# 花花有期

> HUĀHUĀ PERIODICAL

一本按周生长、按月装订、按年收藏的个人刊物。

**把日子装订成册。**

项目仓库名：`huahua-periodical`

这是一个基于 Astro 的开源个人刊物系统。平时持续发布 Markdown/MDX 内容，网站会自动按上海时区整理成本周首页、周刊、月刊、年刊、精选、JSON 和 RSS。

## 功能

- 首页只展示本周内容，最新发布永远排在最前
- 本周精选最多 3 篇，长期精选拥有独立页面
- 自动生成周刊、月刊、年刊及往期归档
- 已结束刊期可以生成不可变 JSON 快照
- 公开版本化 JSON、JSON Schema 和 JSON Feed
- 提供文章 RSS 与周刊 RSS
- GitHub Actions 在周一、月初、年初自动定稿
- 可直接部署到 Vercel，无需数据库

## 本地运行

需要 Node.js 22.12+ 和 pnpm。

```sh
pnpm install
pnpm astro dev --background
```

后台开发服务器管理命令：

```sh
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
```

生产构建：

```sh
pnpm build
pnpm preview
```

## 发布一篇内容

在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件：

```yaml
---
title: '今天遇见的一场雨'
description: '夏日下午的一段记录。'
pubDate: '2026-07-23T18:30:00+08:00'
lang: zh
type: note
tags: ['生活', '夏天']

draft: false

featured: true
featuredOrder: 1

evergreen: false
heroImage: '../../assets/example.jpg'
---

正文从这里开始。
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `pubDate` | 发布时间。建议带 `+08:00`，避免跨时区日期偏移 |
| `type` | `essay`、`note`、`photo` 或 `link` |
| `draft` | 为 `true` 时不会出现在页面、JSON 或 RSS |
| `featured` | 是否进入所在周刊的“本周精选” |
| `featuredOrder` | 本周精选顺序，从 1 开始 |
| `evergreen` | 是否进入 `/picks/` 长期精选 |
| `evergreenOrder` | 长期精选顺序，从 1 开始 |

文章不需要手动填写周、月、年编号。程序会根据 `pubDate` 和 `Asia/Shanghai` 自动计算：

```text
week:  2026-W30
month: 2026-07
year:  2026
```

`issue` 旧字段仍兼容，但新的刊期系统不再依赖它。

## 精选规则

首页分为两个独立区域：

1. “最新发布”始终选择本周发布时间最新的一篇。
2. “本周精选”选择 `featured: true` 的本周文章，按 `featuredOrder` 排序，最多 3 篇。

如果最新文章本身也是精选，它不会在首页精选侧栏重复出现。`evergreen: true` 的内容会进入 `/picks/`，不受当前周限制。

月刊和年刊的精选保存在定稿快照的 `featuredIds` 中。生成快照后可手动调整列表和摘要。

## 刊期与定稿

当前周、月、年会在构建时实时生成。已结束的刊期可以用下面的命令定稿：

```sh
pnpm publication:close -- weekly
pnpm publication:close -- monthly
pnpm publication:close -- yearly
```

命令默认关闭上一个完整刊期，例如周一执行 `weekly` 会关闭刚结束的一周。也可以指定刊期：

```sh
pnpm publication:close -- weekly --id=2026-W30
pnpm publication:close -- monthly --id=2026-07
pnpm publication:close -- yearly --id=2026
```

快照输出在：

```text
src/data/issues/weekly/2026-W30.json
src/data/issues/monthly/2026-07.json
src/data/issues/yearly/2026.json
```

已经存在的快照不会被覆盖。确认确实需要重建时使用：

```sh
pnpm publication:close -- weekly --id=2026-W30 --force
```

快照中的 `itemIds` 决定该期收录内容，`featuredIds` 决定本期精选。这样以后补写一篇旧日期文章，也不会悄悄改变已经定稿的刊物。

## 页面地址

| 地址 | 内容 |
| --- | --- |
| `/` | 仅展示本周内容 |
| `/blog/` | 全部文章 |
| `/picks/` | 长期精选 |
| `/weekly/` | 周刊归档 |
| `/monthly/` | 月刊归档 |
| `/yearly/` | 年刊归档 |
| `/weekly/2026-W30/` | 单期周刊 |
| `/monthly/2026-07/` | 单期月刊 |
| `/yearly/2026/` | 单期年刊 |

## 开放数据与订阅

| 地址 | 内容 |
| --- | --- |
| `/data/v1/site.json` | 站点信息、当前刊期和数据入口 |
| `/data/v1/items.json` | 全部已发布内容 |
| `/data/v1/schema.json` | 内容 JSON Schema |
| `/data/v1/issues/weekly/index.json` | 周刊索引 |
| `/data/v1/issues/weekly/2026-W30.json` | 单期周刊 JSON |
| `/data/v1/issues/monthly/index.json` | 月刊索引 |
| `/data/v1/issues/yearly/index.json` | 年刊索引 |
| `/feed.json` | JSON Feed 1.1 |
| `/rss.xml` | 全部文章 RSS |
| `/weekly/rss.xml` | 周刊 RSS |

开放 JSON 默认允许跨域读取。未来修改字段时应新增 `/data/v2/`，不要破坏现有 v1 使用者。

## 部署到 Vercel

1. 把仓库推送到 GitHub。
2. 在 Vercel 导入该仓库。
3. Build Command 使用 `pnpm build`，Output Directory 使用 `dist`。
4. 在 Vercel 环境变量中添加：

```text
SITE_URL=https://huahua.7miaoyu.com
PUBLIC_SUBMISSION_EMAIL=leewei@icenew.top
```

5. 每次推送文章后，Vercel 会自动重新构建，首页、JSON 和 RSS 会一起更新。

项目以 `https://huahua.7miaoyu.com` 和 `leewei@icenew.top` 作为本地构建兜底值。正式部署仍建议配置 `SITE_URL` 与 `PUBLIC_SUBMISSION_EMAIL`，方便以后在不修改代码的情况下更换主域名或投稿邮箱。

项目同时使用 `huahua.leewei0923.com` 作为备用访问域名。在 Vercel 的 Domains 设置中，将它永久重定向到 `huahua.7miaoyu.com`，避免两个域名产生重复页面。

## 设置自动定稿

仓库包含 `.github/workflows/publications.yml`：

- 每周一 `00:10 Asia/Shanghai` 定稿上一周
- 每月 1 日 `00:20` 定稿上个月
- 每年 1 月 1 日 `00:30` 定稿上一年
- 新快照由 `github-actions[bot]` 提交到默认分支

在 GitHub 仓库中打开：

```text
Settings → Actions → General → Workflow permissions
```

选择 `Read and write permissions`。如果默认分支禁止机器人直接推送，需要允许 GitHub Actions 绕过对应规则，或者把工作流改成创建 Pull Request。

建议再在 Vercel 项目中创建一个 Deploy Hook，然后保存为 GitHub Actions secret：

```text
VERCEL_DEPLOY_HOOK
```

它是可选的。有新快照提交时，Vercel 的 Git 集成本身就会部署；Deploy Hook 的作用是在空刊、跨周但没有新提交时也刷新静态首页。

定时工作流也可以从 GitHub Actions 页面手动运行，并选择 `weekly`、`monthly`、`yearly` 或 `all`。

## 目录

```text
src/
  content/blog/          原始文章
  data/issues/          已定稿刊期快照
  lib/periods.ts        上海时区与周/月/年计算
  lib/publications.ts   筛选、精选、序列化
  pages/                页面、JSON、RSS
scripts/
  close-publication.mjs
.github/workflows/
  publications.yml
```
