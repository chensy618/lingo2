# lingo²

**在线地址：<https://chensy618.github.io/lingo2/>**

英语 · 挪威语 · 汉语三语言学习网站。以**分级翻译、三语言对照、场景化词汇**为核心，任意一种语言都可以作为目标语言。

## 当前功能

- **翻译练习**：自由切换目标语言 / 提示语言，A1–C2 等级，Everyday / Academic / Mixed 语域。
- **刷新续练**：进行中的题目、草稿、自评与进度保存在 `sessionStorage`，可从首页或设置页继续。
- **参考覆盖与差异**：提交后展示三语言对照、可接受变体、词级覆盖率和缺失/多余关键词，不把字符串一致当作唯一标准。
- **间隔复习**：自评决定下次复习时间（重练 1 天 / 有点难 3 天 / 掌握 7 天），首页显示今日到期。
- **弱项统计**：按语序、时态、搭配、语域等标签汇总常错知识点。
- **情境练习**：每个场景包含 3–4 句按顺序编排的练习，而不是单句加随机补充。
- **词汇学习**：三语言释义、例句、搭配、词形、用法提示、掌握状态、回忆模式与浏览器发音。
- **练习联动词汇**：反馈区自动关联词表条目，可一键标记“学习中 / 已掌握”。
- **首次引导**：新用户用两步选择目标语言与等级。
- **学习记录**：连续学习、每日目标、分语言进度、最近练习、错题 / 待复习、收藏。
- **PWA**：可安装、离线访问已缓存页面。
- **数据管理**：本地 JSON 导出 / 导入；可选云端同步端点。

## 本地开发

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

```bash
npm run build     # 静态导出到 out/
npm run typecheck
npm run lint
```

## 部署到 GitHub Pages

仓库包含 `.github/workflows/deploy.yml`。推送到 `main` 后自动构建并部署。

1. **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main`，等待 Actions 完成。
3. 站点地址：`https://<username>.github.io/<repo>/`。

构建时通过 `NEXT_PUBLIC_BASE_PATH=/<repo>` 设置子路径。若绑定自定义域名并部署在根路径，请修改 workflow，去掉该环境变量，并在仓库 Pages 设置中配置域名与 CNAME。

## 可选集成

### AI 反馈

设置环境变量 `NEXT_PUBLIC_AI_FEEDBACK_URL` 后，反馈区会出现“分析我的译文”。前端会发送：

```json
{
  "sourceLanguage": "zh",
  "targetLanguage": "no",
  "level": "B1",
  "prompt": "……",
  "answer": "……",
  "references": ["……"],
  "explanationTerms": ["selv om"]
}
```

端点返回 `{ "feedback": "……" }` 或 `{ "text": "……" }`。未配置时该入口不显示；发送前界面会提示数据会交给所配置的服务。

### 云端同步

设置 `NEXT_PUBLIC_SYNC_URL` 后，设置页会出现“云端同步”。客户端使用 `Authorization: Bearer <同步密钥>`：

- `POST <SYNC_URL>`：请求体为完整备份 JSON。
- `GET <SYNC_URL>?key=<同步密钥>`：返回同一结构。

可使用 Supabase Edge Function、Cloudflare Worker 或自建 API 实现。未配置时仍可使用本地导出 / 导入。

## 内容更新与审核

题库不是实时生成的。Maggie 先生成候选，经过自动预审或人工审核后才会进入网站。

### 每日本机生成（当前配置）

Maggie 的 UiT 接口只能从校园网络访问，GitHub 托管运行器无法解析 `springfield.uit.no`，因此每日生成由本机 `launchd` 完成：

1. 安装定时任务（已配置为每天 **15:00**）：
   ```bash
   MAGGIE_API_KEY='...' ./scripts/install-maggie-schedule.sh
   ```
2. 密钥保存在 `~/.config/lingo2/maggie.env`（权限 600），不进入仓库。
3. 任务每天生成候选，自动用 Maggie 预审并创建 `content-review` PR；若评分 ≥14/16、八项 checklist 全通过且无 issues，则自动合并发布；否则保留人工审核。
4. 日志：`~/Library/Logs/lingo2-content.log`
5. 手动运行：
   ```bash
   ./scripts/maggie-daily.sh
   launchctl kickstart -k gui/$(id -u)/com.uit.lingo2.content
   ```
6. 可用环境变量控制：`AUTO_REVIEW=0`（关闭预审）、`AUTO_MERGE=0`（只预审不自动合并）、`AUTO_APPROVE_MIN_SCORE=14`。

### 审核与发布

审核者按 [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) 的 16 分制标准逐条检查，可直接修改 PR 中的 `review` 字段。只有 `review.status === "approved"` 的条目会被前端加载；达到自动确认门槛的 PR 会自动合并，其余保留人工审核。构建前自动运行 `npm run content:validate`。

审核标准包括语义对齐、自然度、等级匹配、语域、语法、解析准确性、原创与安全、技术规范；八项必须全过且总分至少 14/16。

### GitHub Actions（可选）

`Generate content candidates` 仍支持手动触发和 fixture 测试；托管运行器无法访问 UiT 内网，所以仓库变量 `ENABLE_AI_CONTENT` 当前为 `false`。若改用可访问接口或 self-hosted runner，可重新启用。

```bash
npm run content:generate -- --fixture --count=2 --level=A1 --track=everyday --output=/tmp/candidates.json
npm run content:validate -- /tmp/candidates.json
```

## 技术栈

- Next.js 16（App Router，静态导出）
- React 19 + TypeScript
- Tailwind CSS 4
- 本地数据：`localStorage` / `sessionStorage`
- PWA：Manifest + Service Worker
- 字体：Commissioner（正文）、Fraunces（标题）

## 内容说明

题库与词汇为示例种子数据，挪威语以 **Bokmål** 为规范。题目等级按目标语言独立标记，不能默认三种语言难度相同。参考覆盖率只衡量词级重合，不代表表达质量。

## 后续方向

- 账户体系与基于 Supabase 的多设备同步
- 更细的自然度与语域反馈、更多题库
- 段落翻译、学术改写、对话与语音输入
- 隐私友好的使用统计与自定义域名
