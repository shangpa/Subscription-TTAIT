# PDF AI Parsing PoC

This project is a standalone testbed for:
1. Reading notice PDFs
2. Extracting key fields with AI
3. Comparing extraction output against a golden set

## Folder structure

```
pdf-ai-poc/
  data/
    samples/            # put your PDF files here
    golden_template.csv # copy to golden.csv and fill expected values
  output/               # extraction outputs
  run_poc.py
  evaluate.py
  requirements.txt
  .env.example
```

## Quick start

1. Create venv and install packages
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r requirements.txt`

2. Configure environment
   - Copy `.env.example` to `.env`
   - Set `OPENAI_API_KEY`
   - Optionally change `OPENAI_MODEL`

3. Add PDFs
   - Put sample PDFs in `data\samples`
   - Recommended naming: `sample_001.pdf`, `sample_002.pdf`, ...

4. Dry run (schema check only)
   - `python run_poc.py --dry-run`

5. Real extraction
   - `python run_poc.py`

6. Prepare golden set
   - Copy `data\golden_template.csv` to `data\golden.csv`
   - Fill `expectedValue` and `page`

7. Evaluate
   - `python evaluate.py --jsonl output\extractions_YYYYMMDD_HHMMSS.jsonl --golden data\golden.csv`

## Output format

Each JSONL row:
- `docId`
- `isScanned` (true when extracted text volume is very low)
- `extraction` object with fields:
  - `applicationPeriod`
  - `supplyHouseholdCount`
  - `depositMonthlyRent`
  - `incomeAssetCriteria`
  - `contact`

Each field has:
- `value`
- `confidence` (0.0~1.0)
- `sourcePage`
