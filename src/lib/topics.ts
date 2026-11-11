import type { Topic } from "./types";

export const TOPICS: Topic[] = [
  { id: "introductions", label: "自我介绍与社交", en: "Introductions", track: "everyday", description: "问候、介绍自己、开启对话。" },
  { id: "food", label: "餐馆与饮食", en: "Food & dining", track: "everyday", description: "点单、饮食偏好、结账。" },
  { id: "shopping", label: "购物与超市", en: "Shopping", track: "everyday", description: "询问价格、尺码与退换。" },
  { id: "travel", label: "交通与出行", en: "Travel", track: "everyday", description: "车票、路线、住宿与行李。" },
  { id: "housing", label: "居住与租房", en: "Housing", track: "everyday", description: "找房、合同、邻里与公共服务。" },
  { id: "health", label: "医疗与健康", en: "Healthcare", track: "everyday", description: "描述症状、预约与就医。" },
  { id: "work", label: "工作与同事", en: "Work", track: "everyday", description: "会议、邮件、协作与安排。" },
  { id: "daily", label: "日常活动", en: "Daily life", track: "everyday", description: "计划、习惯、天气与生活节奏。" },
  { id: "society", label: "社会议题", en: "Society", track: "everyday", description: "城市、环境与公共讨论。" },
  { id: "opinion", label: "观点与讨论", en: "Opinions", track: "everyday", description: "表达同意、保留与不同意见。" },
  { id: "research", label: "研究问题", en: "Research questions", track: "academic", description: "研究目的、背景与假设。" },
  { id: "methods", label: "研究方法", en: "Methods", track: "academic", description: "设计、抽样与数据收集。" },
  { id: "data", label: "数据分析", en: "Data analysis", track: "academic", description: "描述趋势、关联与结果。" },
  { id: "writing", label: "论文写作", en: "Academic writing", track: "academic", description: "论证、衔接与精确表达。" },
  { id: "conference", label: "会议与交流", en: "Conferences", track: "academic", description: "报告、提问与学术社交。" },
  { id: "review", label: "评审与批判", en: "Peer review", track: "academic", description: "评价、局限与改进建议。" },
];

export const TOPIC_MAP = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic]));

export function topicLabel(id: string) {
  return TOPIC_MAP[id]?.label ?? id;
}
