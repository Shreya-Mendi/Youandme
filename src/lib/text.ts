const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "and",
  "or",
  "with",
  "to",
  "for",
  "fresh",
  "chopped",
  "sliced",
  "diced",
  "ground",
  "large",
  "small",
  "medium",
  "ripe",
  "boneless",
  "skinless",
  "extra",
  "plain",
  "raw",
  "cooked",
  "warm",
  "hot",
  "cold",
]);

const UNITS = new Set([
  "g",
  "kg",
  "mg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "cups",
  "clove",
  "cloves",
  "can",
  "cans",
  "slice",
  "slices",
  "scoop",
  "pinch",
  "handful",
  "piece",
  "pieces",
  "fillet",
  "fillets",
  "leaf",
  "leaves",
  "stalk",
  "stalks",
]);

/**
 * Turn a raw ingredient line into normalized tokens: lowercase, strip
 * quantities, units and stopwords. Used for TF-IDF and grocery matching.
 */
export function tokenizeIngredient(line: string): string[] {
  return line
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(
      (t) => t.length > 1 && !STOPWORDS.has(t) && !UNITS.has(t)
    );
}

export function tokenizeIngredients(lines: string[]): string[] {
  return lines.flatMap(tokenizeIngredient);
}

/** A readable "core" name for an ingredient line (drops quantity + units). */
export function ingredientCoreName(line: string): string {
  const tokens = tokenizeIngredient(line);
  return tokens.join(" ").trim() || line.trim().toLowerCase();
}
