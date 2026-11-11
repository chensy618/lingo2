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
