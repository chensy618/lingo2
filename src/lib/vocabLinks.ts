import type { Exercise, Lang } from "./types";
import { VOCABULARY } from "./vocabulary";

export function relatedVocabulary(exercise: Exercise, lang: Lang) {
  const sentence = exercise.variants[lang].join(" ").toLowerCase();
  return VOCABULARY.filter((entry) => {
    const candidates = entry.translations[lang]
      .split("/")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 2);
    return candidates.some((candidate) => sentence.includes(candidate));
  }).slice(0, 3);
}
