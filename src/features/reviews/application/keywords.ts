/**
 * Tiny keyword extractor for review analytics — no NLP dependency. Lowercases,
 * strips punctuation, drops stopwords and short tokens, then counts frequency.
 */
const STOPWORDS = new Set([
  "the","and","for","with","that","this","was","were","are","have","has","had","you","your","our",
  "they","them","their","but","not","all","any","can","get","got","out","from","just","very","really",
  "too","also","been","who","what","when","where","which","would","could","should","did","does","doing",
  "his","her","him","she","its","one","two","about","into","than","then","some","such","only","over",
  "here","there","after","before","again","more","most","much","many","will","because","being","these",
  "those","upon","onto","off","per","via","yet","nor","how","why","had","a","an","is","it","to","of",
  "in","on","at","by","or","as","so","we","i","my","me","us","be","do","if","no","up","he",
]);

export interface Keyword {
  word: string;
  count: number;
}

export function extractKeywords(texts: string[], limit = 12): Keyword[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/);
    for (const word of words) {
      if (word.length < 4 || STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .filter((k) => k.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
