## AI 内容候选审核

- [ ] 已阅读 `docs/CONTENT_REVIEW.md`
- [ ] 三语言语义、细节与语气一致
- [ ] 挪威语为自然 Bokmål，中文为自然的简体中文表达
- [ ] 目标语言等级与 CEFR 标注一致
- [ ] Everyday / Academic 语域正确
- [ ] 拼写、词形、词序与标点正确
- [ ] 解析准确且对学习者有帮助
- [ ] 无个人信息、抄袭或有害内容
- [ ] ID 唯一、无近似重复、技术校验通过

审核结果必须写入每条内容的 `review` 字段：

- `approved`：八项 checklist 全为 true，score ≥ 14/16，填写 reviewer 与 reviewedAt
- `needs_changes` / `rejected`：在 `review.notes` 说明原因
