/**
 * Curated topic pool for the topic picker.
 * Topics are tight noun phrases, universally interesting and approachable.
 * Mixed across science, history, culture, technology, nature, psychology, etc.
 */
export const TOPIC_POOL = [
  // Science
  "The electromagnetic spectrum",
  "Black holes",
  "The placebo effect",
  "Ocean tides",
  "Photosynthesis",
  "Quantum entanglement",
  "The doppler effect",
  "Plate tectonics",
  "The water cycle",
  "Nuclear fusion",

  // Technology
  "Bitcoin proof-of-work",
  "How compilers work",
  "Public key cryptography",
  "GPS satellites",
  "Fiber optic cables",
  "Touchscreen technology",
  "Machine learning",
  "The internet protocol stack",

  // History
  "The French Revolution",
  "The Silk Road",
  "The printing press",
  "The Space Race",
  "Ancient Roman aqueducts",
  "The Rosetta Stone",
  "The Industrial Revolution",

  // Nature
  "Coral reef ecosystems",
  "Bird migration",
  "The nitrogen cycle",
  "Carnivorous plants",
  "Bioluminescence",
  "Mycelium networks",
  "Monarch butterfly migration",

  // Psychology & human behavior
  "Cognitive biases",
  "The bystander effect",
  "Circadian rhythms",
  "Color perception",
  "The Dunning-Kruger effect",
  "Memory formation",

  // Culture & everyday life
  "Sourdough bread",
  "The origins of jazz",
  "How vaccines work",
  "The Richter scale",
  "Time zones",
  "The chemistry of cooking",
  "How mirrors work",
  "The history of zero",
  "Paper currency",
  "The phonetic alphabet",

  // Earth & space
  "The aurora borealis",
  "Tidal locking",
  "The greenhouse effect",
  "Asteroid mining",
];

/**
 * Fisher-Yates shuffle: returns a new shuffled copy of the array.
 */
function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Pick `count` random topics from the pool.
 */
export function pickRandomTopics(count = 5): string[] {
  return shuffle(TOPIC_POOL).slice(0, count);
}
