# 内容生成与审核标准

本项目的题目有两种来源：

- `src/lib/exercises.ts`：人工维护的种子题库
- `src/content/generated-exercises.json`：AI 生成候选及其审核记录；应用只会加载 `review.status === "approved"` 的条目

## 1. 流程

1. **每日生成**：本机 `launchd` 任务调用 Maggie，把候选追加到 `src/content/generated-exercises.json`，并创建 PR。
2. **自动预审**：对新候选执行第二次 Maggie 审核，按下方 16 分制打分并填写 checklist。
3. **自动确认**：若每条当日候选都满足 **score ≥ 14/16、八项 checklist 全为 true、无 issues、技术校验通过**，自动标记 `approved` 并合并 PR。
4. **人工兜底**：未达到自动确认门槛的候选保留 `pending` / `needs_changes`，由人工在 PR 中处理。
5. **发布**：PR 合并后自动部署；只有 `status: "approved"` 的条目会进入网站。
6. **校验**：`npm run content:validate` 检查 schema、重复、等级、标签与审核完整性；构建前也会自动执行。

自动审核由同一 Maggie 模型完成，不等同于独立人工复核。建议定期抽查已自动合并的内容；需要更严格时可以关闭自动合并。

## 2. 审核状态

| 状态 | 含义 | 是否上线 |
| --- | --- | --- |
| `pending` | 等待审核 | 否 |
| `needs_changes` | 需要修改后再审 | 否 |
| `approved` | 通过审核 | 是 |
| `rejected` | 不采用 | 否 |

审核决定必须写入 `review.notes`（`approved` 可选，其他状态必须有说明）。

## 3. 评分标准（每项 0–2 分，总分 16）

| 维度 | 0 分 | 1 分 | 2 分 |
| --- | --- | --- | --- |
| 语义对齐 `semanticAlignment` | 含义有明显偏差、增删信息 | 大意正确但有细节或语气偏差 | 三语言含义、细节与语气一致 |
| 自然度 `naturalness` | 明显生硬或不合语法习惯 | 可理解但不够地道 | 母语者自然会这样说，变体合理 |
| 等级匹配 `levelFit` | 明显超出或低于目标等级 | 大致匹配但部分表达偏离 | 词汇、句长与结构符合目标语言 CEFR 等级 |
| 语域匹配 `registerFit` | 日常/学术语域错位 | 基本合适但有少量不协调 | 场景、语气与用词一致 |
| 语法与正字法 `grammar` | 有影响理解的错误 | 有轻微错误或标点问题 | 拼写、词形、词序、标点均正确 |
| 解析准确性 `notesAccuracy` | 解释错误或误导 | 解释正确但不够清楚 | 准确、具体、有助于理解差异 |
| 原创与安全 `originality` | 抄袭、含个人信息或有害内容 | 有轻微模板化/来源风险 | 原创、无个人信息、无有害内容 |
| 技术规范 `technical` | schema 错误、ID/重复问题 | 结构正确但有标签或格式瑕疵 | 字段完整、ID 唯一、无近似重复 |

**通过条件（同时满足）**：

- 八项均为 `true`
- 总分 ≥ **14 / 16**
- 至少一名审核者签名
- 审核日期有效
- 技术校验通过

低于标准时，将状态改为 `needs_changes` 或 `rejected`，并在 `review.notes` 写明原因。修改后重新审核并更新分数。

## 4. 代码中的审核字段

审核者需要把条目的 `review` 改为：

```json
{
  "status": "approved",
  "reviewer": "github-handle",
  "reviewedAt": "2026-11-12T08:00:00.000Z",
  "score": 15,
  "checklist": {
    "semanticAlignment": true,
    "naturalness": true,
    "levelFit": true,
    "registerFit": true,
    "grammar": true,
    "notesAccuracy": true,
    "originality": true,
    "technical": true
  },
  "notes": "三语言语义一致；Bokmål 自然；解析准确。"
}
```

## 5. 语言规范

- 挪威语：Bokmål；名词性别、定形、复数与动词时态必须正确。
- 汉语：简体中文；普通话表达；避免翻译腔。
- 英语：统一拼写习惯（当前默认美式）。
- 三语言都必须提供至少一个主译文，变体不得只是标点或大小写变化。
- 每题的 `levels` 按目标语言分别标记，不能默认三种语言同等级。

## 6. 红线

- 不收录个人信息、仇恨、色情、暴力指导或违法内容。
- 不直接复制受版权保护的教材、论文或网站句子。
- 不使用无法解释的机器翻译腔作为“标准答案”。
- 不允许把未审核的 AI 输出直接展示给学习者。

## 7. 配置生成任务

### 本机 launchd（当前方式）

GitHub 托管运行器无法解析 Maggie 的 UiT 接口，因此当前使用本机 `launchd`：

- 每天 15:00 运行 `scripts/maggie-daily.sh`
- 密钥保存在 `~/.config/lingo2/maggie.env`（权限 600）
- 日志：`~/Library/Logs/lingo2-content.log`
- 安装：`MAGGIE_API_KEY='...' ./scripts/install-maggie-schedule.sh`
- 手动测试：`launchctl kickstart -k gui/$(id -u)/com.uit.lingo2.content`

脚本会自动创建 `content/maggie-日期-时间` 分支和审核 PR。若当天已有 PR 则跳过。

自动确认开关（可写在 `~/.config/lingo2/maggie.env`）：

- `AUTO_REVIEW=0`：关闭自动预审
- `AUTO_MERGE=0`：保留自动预审结果，但 PR 必须人工合并
- `AUTO_APPROVE_MIN_SCORE=14`：调整自动确认分数阈值

### GitHub Actions（可选）

- **Settings → Actions → General**：允许 GitHub Actions 创建 Pull Request
- Repository variable：`ENABLE_AI_CONTENT=true`（当前为 `false`）
- Secrets：`MAGGIE_API_KEY`，可选 `AI_API_URL`、`AI_MODEL`、`AI_TEMPERATURE`
- 默认地址：`http://springfield.uit.no:30800/v1/chat/completions`，默认模型：`maggie`
- 需要 self-hosted runner 或可访问该接口的网络

本地 fixture 测试：

```bash
npm run content:generate -- --fixture --count=2 --level=A1 --track=everyday --output=/tmp/candidates.json
npm run content:validate -- /tmp/candidates.json
```
