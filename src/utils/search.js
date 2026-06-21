// Custom translations for artists, days, and stages between Hebrew and English
export const customTranslationMap = {
  // Artists
  'אסטריקס': 'astrix',
  'אייס ונטורה': 'ace ventura',
  'אייס': 'ace ventura',
  'ויברספיר': 'vibrasphere',
  'קפטן הוק': 'captain hook',
  'ליקוויד סול': 'liquid soul',
  'ויני ויצ\'י': 'vini vici',
  'בליס': 'bliss',
  'אסטרל פרוג\'קשן': 'astral projection',
  'אסטרל': 'astral projection',
  'אטמוס': 'atmos',
  'אוולון': 'avalon',
  'אג\'ה': 'ajja',
  'אגא': 'ajja',
  'אלטרואיזם': 'altruism',
  'דומסטיק': 'domestic',
  'מנקיינד': 'mankind',
  'אקס דרים': 'x-dream',
  'אקסדרים': 'x-dream',
  'בריינסל': 'braincell',
  'אאוטסיידרס': 'outsiders',
  'הילייט טרייב': 'hilight tribe',
  'אי קליפס': 'e-clip',
  'איקליפס': 'e-clip',
  'פאראסנס': 'parasense',
  'טריסטן': 'tristan',
  
  // Stages
  'פומפוי': 'pumpui',
  'דום': 'dome',
  'הדום': 'dome',
  'אוזורה': 'ozora',
  'אוזורא': 'ozora',
  'דרגון': 'dragon',
  'דראגון': 'dragon',
  'ויזיום': 'visium',
  'טק זירו': 'tek zero',
  'טקזירו': 'tek zero',
  
  // Days
  'חימום שבת': 'warmup sat',
  'חימום ראשון': 'warmup sun',
  'חימום': 'warmup',
  'יום 1': 'day 1',
  'יום 2': 'day 2',
  'יום 3': 'day 3',
  'יום 4': 'day 4',
  'יום 5': 'day 5',
  'יום 6': 'day 6',
  'יום 7': 'day 7',
  'יום 8': 'day 8'
};

const customTranslationEntries = Object.entries(customTranslationMap);
const searchIndexCache = new WeakMap();

// Hebrew-to-English letter mappings for phonetic transliteration
const hebrewToEnglishMap = {
  'א': '',
  'ב': 'v', // Maps to v/b
  'ג': 'g',
  'ד': 'd',
  'ה': '',
  'ו': 'v', // Can be v, o, or u
  'ז': 'z',
  'ח': 'k', // Maps to ch/k/h
  'ט': 't',
  'י': '',  // Vowel-like
  'כ': 'k',
  'ך': 'k',
  'ל': 'l',
  'מ': 'm',
  'ם': 'm',
  'נ': 'n',
  'ן': 'n',
  'ס': 's',
  'ע': '',
  'פ': 'v', // Maps to f/p/v
  'ף': 'v',
  'צ': 'ts',
  'ץ': 'ts',
  'ק': 'k',
  'ר': 'r',
  'ש': 's', // Maps to sh/s
  'ת': 't'
};

// Phonetic grouping to make similar sounds equivalent
const phoneticGroups = {
  'b': 'v', 'p': 'v', 'f': 'v', 'v': 'v', 'w': 'v', // Labials
  't': 't', 'd': 't',                            // Dentals
  's': 's', 'z': 's', 'c': 's',                  // Sibilants
  'k': 'k', 'g': 'k', 'q': 'k',                  // Velars
  'l': 'l', 'r': 'r', 'm': 'm', 'n': 'n'         // Liquids/Nasals
};

// Normalize a string (English or Hebrew) into its phonetic representation
export function normalizePhonetics(str) {
  if (!str) return '';
  let normalized = str.toLowerCase().trim();
  
  // 1. Transliterate Hebrew to English phonetics
  const hasHebrew = /[\u0590-\u05FF]/.test(normalized);
  if (hasHebrew) {
    let transliterated = '';
    for (let char of normalized) {
      if (hebrewToEnglishMap[char] !== undefined) {
        transliterated += hebrewToEnglishMap[char];
      } else {
        transliterated += char;
      }
    }
    normalized = transliterated;
  }
  
  // 2. Context-based 'c' mapping: 'c' before 'e', 'i', 'y' sounds like 's', else 'k'
  let cMapped = '';
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === 'c') {
      const next = normalized[i + 1];
      if (next === 'e' || next === 'i' || next === 'y') {
        cMapped += 's';
      } else {
        cMapped += 'k';
      }
    } else {
      cMapped += char;
    }
  }
  normalized = cMapped;
  
  // 3. Standardize other English phonetic letter pairs
  normalized = normalized
    .replace(/ph/g, 'v')
    .replace(/ch/g, 'k')
    .replace(/kh/g, 'k')
    .replace(/sh/g, 's')
    .replace(/ts/g, 's')
    .replace(/tz/g, 's')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k');
  
  // 4. Map letters to their phonetic group representatives and drop vowels
  let grouped = '';
  for (let char of normalized) {
    if (phoneticGroups[char]) {
      grouped += phoneticGroups[char];
    }
  }
  
  // 5. Deduplicate consecutive identical phonetic characters
  let deduplicated = '';
  for (let i = 0; i < grouped.length; i++) {
    if (grouped[i] !== grouped[i - 1]) {
      deduplicated += grouped[i];
    }
  }
  
  return deduplicated;
}

// Levenshtein distance for fuzzy matching
export function getEditDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Preprocess query to clean up Hebrew terms
function preprocessQuery(query) {
  let cleaned = query.toLowerCase().trim();
  
  // Translate standard Hebrew terms to match English fields
  cleaned = cleaned
    .replace(/יום\s*(\d)/g, 'day $1')
    .replace(/חימום\s*שבת/g, 'warmup sat')
    .replace(/חימום\s*ראשון/g, 'warmup sun')
    .replace(/חימום\s*א/g, 'warmup sun')
    .replace(/חימום\s*ב/g, 'warmup sat')
    .replace(/פומפוי/g, 'pumpui')
    .replace(/דום/g, 'dome')
    .replace(/הדום/g, 'dome')
    .replace(/אוזורה/g, 'ozora')
    .replace(/אוזורא/g, 'ozora')
    .replace(/דרגון/g, 'dragon')
    .replace(/דראגון/g, 'dragon')
    .replace(/ויזיום/g, 'visium')
    .replace(/טק\s*זירו/g, 'tek zero')
    .replace(/טקזירו/g, 'tek zero');
    
  return cleaned;
}

function getSearchIndex(sets) {
  const cached = searchIndexCache.get(sets);
  if (cached) return cached;

  const indexedSets = sets.map(set => ({
    set,
    artistLower: set.artist.toLowerCase(),
    stageLower: set.stage.toLowerCase(),
    dayLower: set.day.toLowerCase(),
    typeLower: set.type.toLowerCase(),
    normalizedArtistWords: set.artist
      .split(/[^a-zA-Z0-9\u0590-\u05FF]+/)
      .filter(Boolean)
      .map(word => normalizePhonetics(word))
      .filter(Boolean)
  }));

  searchIndexCache.set(sets, indexedSets);
  return indexedSets;
}

// Smart bilingual multi-term search
export function searchSchedule(query, sets) {
  const rawQuery = query.trim();
  if (!rawQuery) return [];
  
  const cleanedQuery = preprocessQuery(rawQuery);
  const queryTerms = cleanedQuery.split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return [];
  
  const results = [];
  
  for (let indexedSet of getSearchIndex(sets)) {
    const {
      set,
      artistLower,
      stageLower,
      dayLower,
      typeLower,
      normalizedArtistWords
    } = indexedSet;

    let allTermsMatch = true;
    let totalScore = 0;
    
    for (let term of queryTerms) {
      let termMatches = false;
      let termScore = 0;
      
      // 1. Check custom translation dictionary
      let translated = '';
      for (let [key, value] of customTranslationEntries) {
        if (term.includes(key) || key.includes(term)) {
          translated = value;
          break;
        }
      }
      
      if (translated && artistLower.includes(translated)) {
        termMatches = true;
        termScore = Math.max(termScore, 200 - (artistLower.length - translated.length));
      }
      
      // 2. Direct English substring matches
      if (artistLower.includes(term)) {
        termMatches = true;
        const exactBonus = artistLower === term ? 100 : 0;
        const startBonus = artistLower.startsWith(term) ? 30 : 0;
        termScore = Math.max(termScore, 100 + exactBonus + startBonus - (artistLower.length - term.length));
      }
      if (stageLower.includes(term)) {
        termMatches = true;
        termScore = Math.max(termScore, 80 - (stageLower.length - term.length));
      }
      if (dayLower.includes(term)) {
        termMatches = true;
        termScore = Math.max(termScore, 80 - (dayLower.length - term.length));
      }
      if (typeLower.includes(term)) {
        termMatches = true;
        termScore = Math.max(termScore, 50 - (typeLower.length - term.length));
      }
      
      // 3. Phonetic fuzzy match (word-by-word)
      const normTerm = normalizePhonetics(term);
      
      if (normTerm) {
        let wordMatched = false;
        for (let normArtistWord of normalizedArtistWords) {
          const isPhoneticSub = normTerm.length >= 2 && normArtistWord.includes(normTerm);
          const distance = getEditDistance(normTerm, normArtistWord);
          
          // If query has multiple terms, enforce exact matching (distance 0) for phonetic checks
          // to prevent loose phonetic matches from polluting specific filters.
          let maxAllowedDistance = 0;
          if (queryTerms.length === 1) {
            if (normTerm.length >= 5) {
              maxAllowedDistance = 2;
            } else if (normTerm.length >= 3) {
              maxAllowedDistance = 1;
            }
          }
          
          if (distance === 0) {
            wordMatched = true;
            termScore = Math.max(termScore, 90);
            break;
          } else if (isPhoneticSub) {
            wordMatched = true;
            termScore = Math.max(termScore, 80 - (normArtistWord.length - normTerm.length));
            break;
          } else if (distance <= maxAllowedDistance) {
            wordMatched = true;
            termScore = Math.max(termScore, 70 - distance * 10);
            break;
          }
        }
        
        if (wordMatched) {
          termMatches = true;
        }
      }
      
      if (!termMatches) {
        allTermsMatch = false;
        break;
      }
      
      totalScore += termScore;
    }
    
    if (allTermsMatch) {
      results.push({
        set,
        score: totalScore
      });
    }
  }
  
  // Sort results by score (descending), then alphabetically by artist, then chronologically by day & time
  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      
      // Secondary sort by day/date and time
      const dayCompare = a.set.day.localeCompare(b.set.day);
      if (dayCompare !== 0) return dayCompare;
      
      return a.set.start.localeCompare(b.set.start);
    })
    .map(r => r.set);
}
