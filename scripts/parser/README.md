# Vocab Parser

Parses `../vocablist.txt` (from PDF → TXT) into JSON objects, one per unique Hebrew spelling, supporting multiple English meanings and transliterations per entry.

## Input format (imperfect)
Each logical entry is intended to contain, in order:
- Rank (number)
- English (latin)
- Transliteration (latin)
- Hebrew (RTL)

However, the PDF→TXT conversion sometimes:
- Drops some rank lines
- Splits entries with extra blank lines
- Produces duplicate entries for the same Hebrew spelling with different English meanings/transliterations

## What the parser does
- Repairs missing rank lines by synthesizing a rank based on sequence
- Normalizes direction marks and stray braces
- Alternates latin lines as English/Transliteration automatically
- Accepts multiple English/transliteration lines; merges duplicates across the file
- Merges entries by Hebrew, keeping the lowest (best) rank and unique arrays of meanings/transliterations

## Usage
```bash
node scripts/parser/parse_vocab.js \
  --input scripts/vocablist.txt \
  --cleaned scripts/vocablist.cleaned.txt \
  --out scripts/vocab.json
```

Outputs:
- `vocablist.cleaned.txt`: normalized, with synthesized ranks where they were missing
- `vocab.json`: array of objects like:
```json
{
  "hebrew": "עם",
  "rank": 6,
  "english": ["with", "people / nation"],
  "transliteration": ["im", "am"],
  "rankEstimated": false
}
```

Notes:
- If a rank was synthesized or missing, `rank` may be null and `rankEstimated` may be true.
- The parser removes directionality and zero-width marks that often leak from PDF exports.
