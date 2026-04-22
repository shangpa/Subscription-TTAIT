import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def load_extractions(jsonl_path: Path) -> dict[tuple[str, str], str]:
    results: dict[tuple[str, str], str] = {}
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            doc_id = row["docId"]
            extraction = row.get("extraction", {})
            for field, node in extraction.items():
                value = ""
                if isinstance(node, dict):
                    value = normalize_text(node.get("value"))
                results[(doc_id, field)] = value
    return results


def load_golden(golden_csv_path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with golden_csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        required = {"docId", "field", "expectedValue"}
        if not required.issubset(set(reader.fieldnames or [])):
            raise SystemExit("golden CSV must include: docId, field, expectedValue")
        for row in reader:
            rows.append(row)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate extraction vs golden set")
    parser.add_argument("--jsonl", required=True, help="Path to extraction JSONL")
    parser.add_argument("--golden", default="data/golden.csv", help="Path to golden CSV")
    args = parser.parse_args()

    jsonl_path = Path(args.jsonl)
    golden_path = Path(args.golden)

    extracted = load_extractions(jsonl_path)
    golden_rows = load_golden(golden_path)

    stats = defaultdict(lambda: {"total": 0, "match": 0, "missing": 0})
    for row in golden_rows:
        doc_id = row["docId"].strip()
        field = row["field"].strip()
        expected = normalize_text(row["expectedValue"])

        actual = extracted.get((doc_id, field), "")
        stats[field]["total"] += 1
        if not actual:
            stats[field]["missing"] += 1
        if actual == expected and expected:
            stats[field]["match"] += 1

    print("field,total,accuracy,missingRate")
    for field in sorted(stats.keys()):
        total = stats[field]["total"]
        match = stats[field]["match"]
        missing = stats[field]["missing"]
        accuracy = (match / total) if total else 0.0
        missing_rate = (missing / total) if total else 0.0
        print(f"{field},{total},{accuracy:.4f},{missing_rate:.4f}")


if __name__ == "__main__":
    main()
