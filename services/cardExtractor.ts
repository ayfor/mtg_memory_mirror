/**
 * Card Extractor Service
 * 
 * Extracts Magic: The Gathering card names from transcript text
 * and counts their occurrences.
 */

// Common MTG card name patterns - this is a simplified NLP approach
// In production, you'd use a comprehensive card database or API
const COMMON_CARD_PATTERNS = [
  // Multi-word card names (must be checked first)
  /\b(Lightning Bolt)\b/gi,
  /\b(Black Lotus)\b/gi,
  /\b(Sol Ring)\b/gi,
  /\b(Mox Pearl)\b/gi,
  /\b(Mox Sapphire)\b/gi,
  /\b(Mox Jet)\b/gi,
  /\b(Mox Ruby)\b/gi,
  /\b(Mox Emerald)\b/gi,
  /\b(Time Walk)\b/gi,
  /\b(Ancestral Recall)\b/gi,
  /\b(Dark Ritual)\b/gi,
  /\b(Counterspell)\b/gi,
  /\b(Force of Will)\b/gi,
  /\b(Brainstorm)\b/gi,
  /\b(Llanowar Elves)\b/gi,
  /\b(Birds of Paradise)\b/gi,
  /\b(Wrath of God)\b/gi,
  /\b(Swords to Plowshares)\b/gi,
  /\b(Path to Exile)\b/gi,
  /\b(Fatal Push)\b/gi,
  /\b(Thoughtseize)\b/gi,
  /\b(Inquisition of Kozilek)\b/gi,
  /\b(Tarmogoyf)\b/gi,
  /\b(Snapcaster Mage)\b/gi,
  /\b(Jace, the Mind Sculptor)\b/gi,
  /\b(Liliana of the Veil)\b/gi,
];

export interface CardExtractionResult {
  cardName: string;
  count: number;
}

/**
 * Extracts card names from transcript text and counts occurrences
 * @param text - The transcript text to analyze
 * @returns Array of card names with their counts
 */
export function extractCardNames(text: string): CardExtractionResult[] {
  const cardCounts = new Map<string, number>();

  for (const pattern of COMMON_CARD_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      // Normalize card name (proper case)
      const cardName = matches[0].split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
      
      const currentCount = cardCounts.get(cardName) || 0;
      cardCounts.set(cardName, currentCount + matches.length);
    }
  }

  // Convert map to array of results
  const results: CardExtractionResult[] = [];
  for (const [cardName, count] of cardCounts) {
    results.push({ cardName, count });
  }

  return results.sort((a, b) => b.count - a.count);
}

/**
 * Validates if a string could be a valid MTG card name
 * @param name - The name to validate
 * @returns boolean indicating if the name is valid
 */
export function isValidCardName(name: string): boolean {
  // Card names should be at least 2 characters and contain only valid characters
  if (name.length < 2) return false;
  
  // MTG card names can contain letters, numbers, spaces, apostrophes, commas, and hyphens
  const validPattern = /^[a-zA-Z0-9\s',\-]+$/;
  return validPattern.test(name);
}
