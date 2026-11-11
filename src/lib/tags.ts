export const TAG_LABELS: Record<string, string> = {
  word_order: "词序",
  tenses: "时态",
  collocation: "搭配",
  register: "语域",
  prepositions: "介词",
  modal_verbs: "情态动词",
  modals: "情态动词",
  conditionals: "条件句",
  concession: "让步结构",
  questions: "疑问句",
  politeness: "礼貌表达",
  academic_vocabulary: "学术词汇",
  academic_phrases: "学术表达",
  academic_writing: "学术写作",
  hedging: "模糊限制语",
  comparison: "比较结构",
  comparatives: "比较级",
  causality: "因果关系",
  cause_effect: "因果关系",
  purpose: "目的表达",
  subordinate_clauses: "从句",
  relative_clauses: "关系从句",
  passive: "被动语态",
  present_tense: "现在时",
  past_tense: "过去时",
  perfect_tense: "完成时",
  future: "将来表达",
  phrasal_verbs: "短语动词",
  fixed_expressions: "固定表达",
  idioms: "习语",
  nouns: "名词",
  adjectives: "形容词",
  numbers: "数字",
  time: "时间表达",
  directions: "问路",
  travel: "旅行",
  health: "健康",
  work: "工作",
  housing: "住房",
  food: "饮食",
  shopping: "购物",
  data: "数据描述",
  methods: "研究方法",
  research: "研究",
  findings: "结果",
  critique: "批判性表达",
  precision: "精确性",
  evaluation: "评价",
  limitations: "研究局限",
  terminology: "术语",
  statistics: "统计",
  results: "结果",
  conclusions: "结论",
  literature: "文献",
  presentations: "报告",
  structure: "篇章结构",
  social: "社交",
  greetings: "问候",
  introductions: "自我介绍",
  daily_routine: "日常作息",
  needs: "需求表达",
  requests: "请求",
  restaurant: "餐馆",
  prices: "价格",
  symptoms: "症状",
  appointments: "预约",
  plans: "计划",
  opinions: "观点",
  society: "社会议题",
  numbers_units: "数量与单位",
  existential: "存在句",
  negation: "否定",
  pronouns: "代词",
  politeness_strategy: "礼貌策略",
  formal: "正式语域",
  contrast: "对比",
  abstract: "抽象表达",
  nuance: "语义细微差别",
  body: "身体部位",
  countable: "可数性",
  future_plans: "未来计划",
  indirect_questions: "间接疑问",
  nominalization: "名词化",
  evaluation_language: "评价语言",
  cause: "原因",
  effect: "结果",
  confirmation: "确认信息",
  repetition: "请求重复",
};

export function tagLabel(tag: string) {
  return TAG_LABELS[tag] ?? tag;
}

export function weakTags(attempts: { exerciseId: string; selfRating: string }[], exerciseMap: Record<string, { tags: string[] }>) {
  const counts = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.selfRating === "good") continue;
    const exercise = exerciseMap[attempt.exerciseId];
    if (!exercise) continue;
    for (const tag of exercise.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, label: tagLabel(tag), count }));
}
