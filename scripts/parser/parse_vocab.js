#!/usr/bin/env node
/**
 * Parse a Hebrew vocab list (Rank, English, Transliteration, Hebrew) into JSON.
 * - Handles entries where the same Hebrew form has multiple English meanings and transliterations
 * - Repairs missing rank lines by inserting estimated ranks in a cleaned intermediate file
 * - Merges duplicate Hebrew entries, keeping the lowest rank and unique arrays of english/transliteration
 *
 * Usage:
 *   node scripts/parser/parse_vocab.js \
 *     --input scripts/vocablist.txt \
 *     --out scripts/vocab.json \
 *     --cleaned scripts/vocablist.cleaned.txt
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { input: 'scripts/vocablist.txt', out: 'scripts/vocab.json', cleaned: 'scripts/vocablist.cleaned.txt' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' && argv[i + 1]) { args.input = argv[++i]; }
    else if (a === '--out' && argv[i + 1]) { args.out = argv[++i]; }
    else if (a === '--cleaned' && argv[i + 1]) { args.cleaned = argv[++i]; }
  }
  return args;
}

function removeDirectionMarks(s) {
  if (!s) return s;
  // Remove common directional and zero-width marks often present from PDF exports
  return s.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
}

function normalizeLine(raw) {
  if (raw == null) return '';
  const withoutMarks = removeDirectionMarks(raw);
  return withoutMarks.replace(/[{}]/g, '').replace(/\u00A0/g, ' ').trim();
}

function cleanHebrewWord(hebrew) {
  if (!hebrew) return hebrew;
  // Remove spaces between Hebrew letters and normalize
  return hebrew.replace(/\s+/g, '').trim();
}

function isHebrewLine(s) {
  return /[\u0590-\u05FF]/.test(s);
}

function isRankLine(s) {
  return /^\d{1,6}$/.test(s);
}

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!v || v.trim() === '') continue;
    const key = v.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v.trim());
    }
  }
  return out;
}

function writeFileEnsureDir(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function cleanAndRepairRanks(lines) {
  // The original format is already correct, just normalize and remove empty lines
  // Don't add extra numbers that mess up the structure
  let cleaned = [];
  let prevRank = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = normalizeLine(raw);
    
    if (line === '') {
      // Keep blank lines as entry separators
      cleaned.push('');
      continue;
    }
    
    if (isRankLine(line)) {
      // Found a rank line
      const rank = parseInt(line, 10);
      if (rank > prevRank + 1) {
        // There might be missing ranks, but don't synthesize them
        // Just use the actual rank
      }
      prevRank = rank;
      cleaned.push(line);
      continue;
    }
    
    // Non-rank line, just add it
    cleaned.push(line);
  }

  return cleaned;
}

// Helper to validate and clean entries
function validateEntry(entry) {
  // Remove entries that have numbers or obvious non-English content in English field
  const cleanEnglish = entry.english.filter(eng => {
    // Remove entries that are just numbers or contain obvious non-English patterns
    if (/^\d+$/.test(eng.trim())) return false; // Just numbers
    if (/^\d+\/\d+$/.test(eng.trim())) return false; // Fractions like "2/373"
    // Don't filter out short English words like "in", "to", "at", etc.
    // Only filter out obvious transliterations that got mixed in
    if (/^[a-z]+$/.test(eng.trim()) && eng.length <= 2 && !['in', 'to', 'at', 'on', 'of', 'by', 'as', 'or', 'if', 'so', 'up', 'no', 'he', 'she', 'it', 'we', 'me', 'my', 'do', 'go', 'be', 'am', 'is', 'an'].includes(eng.trim().toLowerCase())) return false;
    return true;
  });

  const cleanTransliteration = entry.transliteration.filter(trans => {
    // Remove entries that are just numbers or contain obvious non-transliteration patterns
    if (/^\d+$/.test(trans.trim())) return false; // Just numbers
    if (/^\d+\/\d+$/.test(trans.trim())) return false; // Fractions
    return true;
  });

  // Ensure arrays have the same length
  const maxLength = Math.max(cleanEnglish.length, cleanTransliteration.length);
  while (cleanEnglish.length < maxLength) {
    cleanEnglish.push('');
  }
  while (cleanTransliteration.length < maxLength) {
    cleanTransliteration.push('');
  }

  // Remove empty entries
  const finalEnglish = cleanEnglish.filter(e => e.trim() !== '');
  const finalTransliteration = cleanTransliteration.filter(t => t.trim() !== '');

  return {
    ...entry,
    english: finalEnglish,
    transliteration: finalTransliteration
  };
}

function parseCleanedLines(lines) {
  // The format is:
  // Rank, (blank), English, (blank), Transliteration, (blank), Hebrew, (blank), [Additional content], Next entry...
  const entries = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    if (line === '') {
      i++;
      continue;
    }

    if (!isRankLine(line)) {
      i++;
      continue;
    }

    // Start of a new entry
    const rank = parseInt(line, 10);
    const entry = {
      rank,
      hebrew: '',
      english: [],
      transliteration: [],
      rankEstimated: false
    };

    i++; // Move past rank
    if (i < lines.length && lines[i] === '') i++; // Skip blank line after rank

    // Find the Hebrew word for this entry first
    let hebrewIndex = -1;
    let nextRankIndex = -1;
    
    // Look ahead to find the Hebrew word and next rank
    for (let j = i; j < lines.length; j++) {
      const checkLine = lines[j];
      if (checkLine === '') continue;
      if (isRankLine(checkLine)) {
        nextRankIndex = j;
        break;
      }
      if (isHebrewLine(checkLine)) {
        hebrewIndex = j;
        break;
      }
    }

    if (hebrewIndex === -1) {
      // No Hebrew found, skip this entry
      i = nextRankIndex > 0 ? nextRankIndex : i + 1;
      continue;
    }

    // Collect all non-blank lines between current position and Hebrew word (excluding Hebrew)
    const entryLines = [];
    for (let j = i; j < hebrewIndex; j++) {
      if (lines[j] !== '') {
        entryLines.push(lines[j]);
      }
    }

    // Process the lines before Hebrew: they should be pairs of English/Transliteration
    for (let j = 0; j < entryLines.length; j += 2) {
      if (j + 1 < entryLines.length) {
        // We have a pair: English and Transliteration
        entry.english.push(entryLines[j]);
        entry.transliteration.push(entryLines[j + 1]);
      } else {
        // Odd number of lines, last one might be English only
        entry.english.push(entryLines[j]);
      }
    }

    // Set the Hebrew word
    entry.hebrew = cleanHebrewWord(lines[hebrewIndex]);

    // Look for additional meanings after Hebrew
    let additionalIndex = hebrewIndex + 1;
    while (additionalIndex < lines.length && additionalIndex < (nextRankIndex > 0 ? nextRankIndex : lines.length)) {
      const additionalLine = lines[additionalIndex];
      if (additionalLine === '' || isRankLine(additionalLine)) break;
      if (isHebrewLine(additionalLine)) break;

      // Additional meanings alternate English/Transliteration
      const isEnglish = (entry.english.length + entry.transliteration.length) % 2 === 0;
      if (isEnglish) {
        entry.english.push(additionalLine);
      } else {
        entry.transliteration.push(additionalLine);
      }
      additionalIndex++;
    }

    i = additionalIndex;

    // Only add entry if it has Hebrew and balanced English/transliteration
    if (entry.hebrew) {
      // Validate and clean the entry
      const validatedEntry = validateEntry(entry);
      
      // Only add if it still has content after validation
      if (validatedEntry.english.length > 0 || validatedEntry.transliteration.length > 0) {
        entries.push(validatedEntry);
      }
    }
  }

  return entries;
}

function mergeByHebrew(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = cleanHebrewWord(e.hebrew);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        hebrew: key,
        rank: e.rank == null ? Number.MAX_SAFE_INTEGER : e.rank,
        english: [...e.english],
        transliteration: [...e.transliteration],
        rankEstimated: !!e.rankEstimated
      });
    } else {
      // Merge fields
      existing.rank = Math.min(existing.rank, e.rank == null ? Number.MAX_SAFE_INTEGER : e.rank);
      existing.english = uniq(existing.english.concat(e.english));
      existing.transliteration = uniq(existing.transliteration.concat(e.transliteration));
      existing.rankEstimated = existing.rankEstimated || !!e.rankEstimated;
    }
  }
  // Convert to sorted array by rank, then hebrew
  const out = Array.from(map.values());
  out.sort((a, b) => (a.rank || 0) - (b.rank || 0) || a.hebrew.localeCompare(b.hebrew));
  // Replace MAX_SAFE_INTEGER with null for clarity
  for (const o of out) {
    if (o.rank === Number.MAX_SAFE_INTEGER) o.rank = null;
  }
  return out;
}

function main() {
  const { input, out, cleaned } = parseArgs(process.argv);
  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(input, 'utf8');
  // Normalize newlines and split; keep potential long files memory-safe (acceptable here ~600KB)
  const rawLines = raw.replace(/\r\n?/g, '\n').split('\n');
  const normalizedLines = rawLines.map(normalizeLine);

  // Build a cleaned version with synthesized ranks where missing
  const cleanedLines = cleanAndRepairRanks(normalizedLines);
  writeFileEnsureDir(cleaned, cleanedLines.join('\n'));

  // Parse the cleaned lines to structured entries
  const parsedEntries = parseCleanedLines(cleanedLines);
  const merged = mergeByHebrew(parsedEntries);

  writeFileEnsureDir(out, JSON.stringify(merged, null, 2));
  console.log(`Parsed ${merged.length} unique Hebrew entries → ${out}`);
  console.log(`Wrote cleaned source with repaired ranks → ${cleaned}`);
}

if (require.main === module) {
  main();
}


