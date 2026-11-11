# lingo²

英语 · 挪威语 · 汉语三语言学习网站。以**分级翻译、三语言对照、场景化词汇**为核心，任意一种语言都可以作为目标语言。

## 当前 MVP

- **翻译练习**：自由切换目标语言 / 提示语言，A1–C2 等级，Everyday / Academic / Mixed 语域，单句输入与提交。
- **三语言对照**：作答前只显示提示语言，提交后展示目标语言参考答案、可接受变体、第三语言与语言解析。
- **参考比对 + 自评**：用结构化相似度辅助自评，不把字符串一致作为唯一标准；自评结果进入复习队列。
- **词汇学习**：三语言释义、例句、搭配、词形、用法提示与掌握状态，支持回忆模式。
- **情境练习**：日常与学术场景入口，可选择目标语言后进入对应练习。
- **学习记录**：连续学习、每日目标、分语言进度、最近练习、错题 / 待复习、收藏。
- **本地数据**：MVP 不依赖后端，偏好、练习记录、自评、收藏与词汇状态保存在浏览器 `localStorage`。

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

仓库已包含 `.github/workflows/deploy.yml`。推送到 `main` 后会自动构建静态站点并部署。

首次部署前，在 GitHub 仓库中设置：

1. **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main`，等待 Actions 完成。
3. 站点地址：`https://<username>.github.io/<repo>/`。

构建时通过 `NEXT_PUBLIC_BASE_PATH=/<repo>` 设置子路径，`next.config.ts` 会读取它作为 `basePath`。如果使用自定义域名并部署在根路径，可在构建环境中清空该变量。

## 技术栈

- Next.js 16（App Router，静态导出）
- React 19 + TypeScript
- Tailwind CSS 4
- 本地数据：`localStorage`（无需登录）

## 内容说明

题库与词汇内容为示例种子数据，挪威语以 **Bokmål** 为规范。题目等级按目标语言独立标记，不能默认三种语言难度相同。自动比对只用于辅助自评，正式评分仍应结合语义、语法、自然度与语域。

## 后续方向

- AI 语义 / 语法 / 自然度分析（可替换接口）
- 间隔重复与个性化复习
- 用户账号与云端同步
- 段落翻译、学术改写、对话与语音练习
