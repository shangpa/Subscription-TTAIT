import argparse
import csv
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader


SYSTEM_PROMPT = """You extract housing announcement info from Korean public rental notice PDFs.
Return only valid JSON with this shape:
{
  "applicationPeriod": {"value": string|null, "confidence": number, "sourcePage": number|null},
  "supplyHouseholdCount": {"value": string|null, "confidence": number, "sourcePage": number|null},
  "depositMonthlyRent": {"value": string|null, "confidence": number, "sourcePage": number|null},
  "incomeAssetCriteria": {"value": string|null, "confidence": number, "sourcePage": number|null},
  "contact": {"value": string|null, "confidence": number, "sourcePage": number|null}
}
Rules:
- Keep Korean text as-is.
- confidence is 0.0 ~ 1.0.
- sourcePage starts from 1.
- If unknown, value=null and confidence=0.0.
"""

TARGET_FIELDS = [
    "applicationPeriod",
    "supplyHouseholdCount",
    "depositMonthlyRent",
    "incomeAssetCriteria",
    "contact",
]


@dataclass
class PageText:
    page: int
    text: str


def extract_pdf_text(pdf_path: Path) -> list[PageText]:
    reader = PdfReader(str(pdf_path))
    pages: list[PageText] = []
    for idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append(PageText(page=idx, text=text.strip()))
    return pages


def detect_scanned(pages: list[PageText], min_chars: int = 200) -> bool:
    total = sum(len(p.text) for p in pages)
    return total < min_chars


def normalize_result(raw: dict[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for field in TARGET_FIELDS:
        node = raw.get(field) if isinstance(raw, dict) else None
        if not isinstance(node, dict):
            normalized[field] = {"value": None, "confidence": 0.0, "sourcePage": None}
            continue

        value = node.get("value")
        confidence = node.get("confidence")
        source_page = node.get("sourcePage")

        if value is not None and not isinstance(value, str):
            value = str(value)

        try:
            confidence = float(confidence)
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = max(0.0, min(1.0, confidence))

        if source_page is not None:
            try:
                source_page = int(source_page)
            except (TypeError, ValueError):
                source_page = None

        normalized[field] = {
            "value": value,
            "confidence": confidence,
            "sourcePage": source_page,
        }
    return normalized


def call_ai_extract(client: OpenAI, model: str, doc_id: str, pages: list[PageText], max_chars: int) -> dict[str, Any]:
    joined = "\n\n".join([f"[PAGE {p.page}]\n{p.text}" for p in pages]).strip()
    if len(joined) > max_chars:
        joined = joined[:max_chars]

    user_payload = {
        "docId": doc_id,
        "content": joined,
    }

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
    )
    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    return normalize_result(parsed)


def write_outputs(results: list[dict[str, Any]], output_dir: Path) -> tuple[Path, Path]:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    jsonl_path = output_dir / f"extractions_{ts}.jsonl"
    csv_path = output_dir / f"summary_{ts}.csv"

    with jsonl_path.open("w", encoding="utf-8") as jf:
        for row in results:
            jf.write(json.dumps(row, ensure_ascii=False) + "\n")

    with csv_path.open("w", encoding="utf-8-sig", newline="") as cf:
        writer = csv.writer(cf)
        writer.writerow(["docId", "isScanned"] + TARGET_FIELDS)
        for row in results:
            writer.writerow(
                [
                    row["docId"],
                    row["isScanned"],
                    row["extraction"]["applicationPeriod"]["value"],
                    row["extraction"]["supplyHouseholdCount"]["value"],
                    row["extraction"]["depositMonthlyRent"]["value"],
                    row["extraction"]["incomeAssetCriteria"]["value"],
                    row["extraction"]["contact"]["value"],
                ]
            )

    return jsonl_path, csv_path


def main() -> None:
    parser = argparse.ArgumentParser(description="PDF AI extraction PoC runner")
    parser.add_argument("--samples-dir", default="data/samples", help="PDF folder")
    parser.add_argument("--output-dir", default="output", help="output folder")
    parser.add_argument("--dry-run", action="store_true", help="skip AI call and output empty schema")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    max_text_chars = int(os.getenv("MAX_TEXT_CHARS", "20000"))

    samples_dir = Path(args.samples_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(samples_dir.glob("*.pdf"))
    if not pdf_files:
        raise SystemExit(f"No PDF files found in {samples_dir.resolve()}")

    client = OpenAI(api_key=api_key) if not args.dry_run else None
    if not args.dry_run and not api_key:
        raise SystemExit("OPENAI_API_KEY is missing. Copy .env.example to .env and set key.")

    results: list[dict[str, Any]] = []
    for pdf_path in pdf_files:
        doc_id = pdf_path.stem
        pages = extract_pdf_text(pdf_path)
        is_scanned = detect_scanned(pages)

        if args.dry_run:
            extraction = normalize_result({})
        else:
            extraction = call_ai_extract(client, model, doc_id, pages, max_text_chars)

        results.append(
            {
                "docId": doc_id,
                "fileName": pdf_path.name,
                "isScanned": is_scanned,
                "pageCount": len(pages),
                "extraction": extraction,
            }
        )

    jsonl_path, csv_path = write_outputs(results, output_dir)
    print(f"Done. JSONL: {jsonl_path}")
    print(f"Done. CSV: {csv_path}")


if __name__ == "__main__":
    main()
