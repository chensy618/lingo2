export type Lang = "en" | "no" | "zh";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Track = "everyday" | "academic" | "mixed";

export type BaseTrack = Exclude<Track, "mixed">;

export type Skill = "translation" | "vocabulary" | "dialogue" | "writing";

export type SelfRating = "again" | "hard" | "good";

export interface LanguageMeta {
  code: Lang;
  label: string;
  native: string;
  zhLabel: string;
  short: string;
  accent: string;
  soft: string;
}

export const LANGUAGES: Record<Lang, LanguageMeta> = {
  en: {
    code: "en",
    label: "English",
    native: "English",
    zhLabel: "英语",
    short: "EN",
    accent: "#355c7d",
    soft: "#e8eef4",
  },
  no: {
    code: "no",
    label: "Norsk",
    native: "Norsk bokmål",
    zhLabel: "挪威语",
    short: "NO",
    accent: "#2f5d50",
    soft: "#e6efe9",
  },
  zh: {
    code: "zh",
    label: "中文",
    native: "简体中文",
    zhLabel: "汉语",
    short: "中",
    accent: "#a8543a",
    soft: "#f6e9e2",
  },
};

export const LANG_CODES: Lang[] = ["en", "no", "zh"];

export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_LABELS: Record<Level, string> = {
  A1: "入门",
  A2: "基础",
  B1: "进阶",
  B2: "中高阶",
  C1: "高级",
  C2: "精通",
};

export const TRACKS: Record<Track, { label: string; en: string; description: string }> = {
  everyday: {
    label: "日常生活",
    en: "Everyday",
    description: "社交、购物、出行、健康与工作中的真实表达。",
  },
  academic: {
    label: "学术与专业",
    en: "Academic",
    description: "研究、方法、数据、论文写作与学术沟通。",
  },
  mixed: {
    label: "混合训练",
    en: "Mixed",
    description: "在日常与学术语域之间切换，训练语域意识。",
  },
};

export interface Topic {
  id: string;
  label: string;
  en: string;
  track: BaseTrack;
  description: string;
}

export interface ExerciseNote {
  term: string;
  text: string;
}

export interface Exercise {
  id: string;
  type: "sentence_translation";
  track: BaseTrack;
  topic: string;
  levels: Record<Lang, Level>;
  variants: Record<Lang, string[]>;
  tags: string[];
  notes: ExerciseNote[];
  context?: Partial<Record<Lang, string>>;
}

export interface VocabularyEntry {
  id: string;
  track: BaseTrack;
  topic: string;
  pos: string;
  levels: Record<Lang, Level>;
  translations: Record<Lang, string>;
  definitions: Record<Lang, string>;
  example: Record<Lang, string>;
  collocations: Record<Lang, string[]>;
  forms: Record<Lang, string>;
  note?: string;
  related?: string[];
}

export interface Scenario {
  id: string;
  track: BaseTrack;
  title: string;
  titleEn: string;
  description: string;
  topic: string;
  level: Level;
  target?: Lang;
  steps: string[];
  exerciseIds: string[];
}

export interface Attempt {
  id: string;
  exerciseId: string;
  target: Lang;
  source: Lang;
  level: Level;
  track: BaseTrack;
  answer: string;
  selfRating: SelfRating;
  similarity: number;
  createdAt: string;
  nextReviewAt?: string;
}

export interface VocabStatus {
  status: "new" | "learning" | "known";
  updatedAt: string;
}

export interface Preferences {
  target: Lang;
  source: Lang;
  level: Level;
  track: Track;
  sessionSize: number;
  dailyGoal: number;
  showThird: boolean;
  uiLanguage: "zh";
  profileLevels: Record<Lang, Level>;
}

export type PageId =
  | "dashboard"
  | "translation"
  | "vocabulary"
  | "situations"
  | "progress"
  | "settings";
