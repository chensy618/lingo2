export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const TOPICS_BY_TRACK = {
  everyday: [
    "introductions",
    "food",
    "shopping",
    "travel",
    "housing",
    "health",
    "work",
    "daily",
    "society",
    "opinion",
  ],
  academic: ["research", "methods", "data", "writing", "conference", "review"],
};

export const CHECKLIST_KEYS = [
  "semanticAlignment",
  "naturalness",
  "levelFit",
  "registerFit",
  "grammar",
  "notesAccuracy",
  "originality",
  "technical",
];

const PLACEHOLDER = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b|待补充|占位/i;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalized(text) {
  return String(text).toLowerCase().replace(/[\s，。！？；：、“”‘’（）《》,.!?;:'"()[\]{}\-—…]/g, "");
}

export function validateContent(items, options = {}) {
  const errors = [];
  const warnings = [];
  const seedIds = new Set(options.seedIds ?? []);
  const ids = new Set();
  const primarySentences = new Map();

  if (!Array.isArray(items)) {
    return { errors: ["Root value must be an array."], warnings };
  }

  items.forEach((item, index) => {
    const at = `[${index}]${item && typeof item.id === "string" ? ` ${item.id}` : ""}`;
    if (!isPlainObject(item)) {
      errors.push(`${at}: must be an object.`);
      return;
    }

    if (!/^ai_[a-z0-9_]+$/.test(item.id ?? "")) {
      errors.push(`${at}: id must match ai_[a-z0-9_]+.`);
    } else if (seedIds.has(item.id)) {
      errors.push(`${at}: id collides with a seed exercise.`);
    } else if (ids.has(item.id)) {
      errors.push(`${at}: duplicate id.`);
    } else {
      ids.add(item.id);
    }

    if (item.type !== "sentence_translation") errors.push(`${at}: type must be sentence_translation.`);
    if (!TOPICS_BY_TRACK[item.track]) errors.push(`${at}: track must be everyday or academic.`);
    if (item.track && TOPICS_BY_TRACK[item.track] && !TOPICS_BY_TRACK[item.track].includes(item.topic)) {
      errors.push(`${at}: topic "${item.topic}" does not belong to track "${item.track}".`);
    }
    if (item.origin !== "ai") errors.push(`${at}: origin must be "ai".`);

    for (const lang of ["en", "no", "zh"]) {
      const level = item.levels?.[lang];
      if (!LEVELS.includes(level)) errors.push(`${at}: invalid ${lang} level "${level}".`);
    }

    for (const lang of ["en", "no", "zh"]) {
      const variants = item.variants?.[lang];
      if (!Array.isArray(variants) || variants.length < 1 || variants.length > 3) {
        errors.push(`${at}: variants.${lang} must contain 1-3 strings.`);
        continue;
      }
      const local = new Set();
      for (const variant of variants) {
        if (typeof variant !== "string") {
          errors.push(`${at}: variants.${lang} contains a non-string.`);
          continue;
        }
        const value = variant.trim();
        if (value.length < 2 || value.length > 300) errors.push(`${at}: variants.${lang} length out of range.`);
        if (PLACEHOLDER.test(value)) errors.push(`${at}: variants.${lang} contains a placeholder.`);
        if (local.has(value)) errors.push(`${at}: duplicate variant in ${lang}.`);
        local.add(value);
      }
      const primary = variants[0];
      if (typeof primary === "string") {
        const key = `${lang}:${normalized(primary)}`;
        if (primarySentences.has(key)) {
          errors.push(`${at}: duplicate primary ${lang} sentence with ${primarySentences.get(key)}.`);
        } else {
          primarySentences.set(key, item.id);
        }
      }
    }

    if (!Array.isArray(item.tags) || item.tags.length < 1 || item.tags.length > 8) {
      errors.push(`${at}: tags must contain 1-8 entries.`);
    } else {
      for (const tag of item.tags) {
        if (typeof tag !== "string" || !/^[a-z][a-z0-9_]*$/.test(tag)) {
          errors.push(`${at}: invalid tag "${tag}".`);
        }
      }
    }

    if (!Array.isArray(item.notes) || item.notes.length < 2 || item.notes.length > 5) {
      errors.push(`${at}: notes must contain 2-5 entries.`);
    } else {
      item.notes.forEach((note, noteIndex) => {
        if (!isPlainObject(note) || typeof note.term !== "string" || typeof note.text !== "string") {
          errors.push(`${at}: notes[${noteIndex}] must contain term and text.`);
          return;
        }
        if (!note.term.trim()) errors.push(`${at}: notes[${noteIndex}].term is empty.`);
        if (note.text.trim().length < 8) errors.push(`${at}: notes[${noteIndex}].text is too short.`);
        if (PLACEHOLDER.test(note.text)) errors.push(`${at}: notes[${noteIndex}] contains a placeholder.`);
      });
    }

    if (item.context && !isPlainObject(item.context)) {
      errors.push(`${at}: context must be an object when present.`);
    }

    if (!isPlainObject(item.review)) {
      errors.push(`${at}: review object is required.`);
      return;
    }
    const review = item.review;
    if (!["pending", "approved", "needs_changes", "rejected"].includes(review.status)) {
      errors.push(`${at}: invalid review status.`);
    }
    if (review.status === "approved") {
      if (!review.reviewer || typeof review.reviewer !== "string") errors.push(`${at}: approved content needs a reviewer.`);
      if (!review.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) {
        errors.push(`${at}: approved content needs a valid reviewedAt.`);
      }
      if (!isPlainObject(review.checklist)) {
        errors.push(`${at}: approved content needs a checklist.`);
      } else {
        for (const key of CHECKLIST_KEYS) {
          if (review.checklist[key] !== true) errors.push(`${at}: checklist.${key} must be true for approval.`);
        }
      }
      if (typeof review.score !== "number" || review.score < 14 || review.score > 16) {
        errors.push(`${at}: approved content needs a score of at least 14/16.`);
      }
    }
    if ((review.status === "needs_changes" || review.status === "rejected") && !review.notes) {
      warnings.push(`${at}: add review notes explaining the decision.`);
    }
    if (review.status === "pending" && review.reviewer) {
      warnings.push(`${at}: pending content already has a reviewer.`);
    }
  });

  return { errors, warnings };
}
