# GPT Navigator — 运维手册

> 记录项目实际部署架构和日常运维要点。
> 产品规划和功能设计见 `project-plan.md`，开发规范见 `CLAUDE.md`。

---

## 新项目启动工作流

基于本项目的技术栈，开新项目只需四步：

1. **聊需求** — 跟 Claude 说清楚产品定位、目标用户、商业模式
2. **发模板** — 把 `project-template.md` 给 Claude，它会自动理解并填充所有占位符
3. **出方案** — Claude 生成定制版 `project-plan.md`（技术方案）+ `CLAUDE.md`（开发规范）
4. **开始开发** — 按 `CLAUDE.md` 规范直接写代码

模板覆盖了基础设施、数据库设计、爬虫架构、前端页面、SEO、合规、运维的全部通用模式。业务逻辑之外的轮子不需要重造。

### 项目文档说明

| 文件 | 定位 | 什么时候用 |
|------|------|-----------|
| `project-template.md` | 通用技术方案模板 | 开新项目时发给 Claude |
| `project-plan.md` | 当前项目的具体方案 | 理解本项目设计决策 |
| `project-runbook.md` | 运维速查手册 | 日常操作、排查问题 |
| `CLAUDE.md` | 开发行为规范 | Claude Code 每次自动加载 |

---

## 基础设施总览

| 组件 | 实际使用 | 说明 |
|------|---------|------|
| 代码托管 | GitHub `ins199/gpt-navigator` | 主分支 `main`，push 自动触发 Vercel 部署 |
| 部署平台 | Vercel | 项目名 `gpt-navigator`，东京区 `hnd1` |
| 数据库 | Supabase PostgreSQL | 免费套餐，东京区 `ap-northeast-1` |
| 域名 DNS | Cloudflare | `www.ins199.com` CNAME 指向 Vercel |
| AI API | DeepSeek | 爬虫 HTML 解析用，不是 Claude |
| 爬虫调度 | GitHub Actions | 每天 UTC 7:00 自动运行 |
| 分析统计 | Vercel Analytics | 页面访问、Web Vitals |
| SEO 工具 | Google Search Console | 搜索排名、索引监控 |

---

## 数据库：Supabase

### 连接方式

**Vercel → Supabase 必须用 Transaction Pooler**，因为 Vercel 函数只有 IPv4 出网，Supabase 直连只有 IPv6 DNS。

```
# 正确：Transaction Pooler（IPv4 兼容）
DATABASE_URL="postgresql://postgres.tfgwybywaifjslttklyr:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"

# 错误：直连（Vercel 上会报 EADDRNOTAVAIL）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.tfgwybywaifjslttklyr.supabase.co:5432/postgres"
```

关键点：
- 端口 **6543**（不是 5432）
- 用户名 **postgres.tfgwybywaifjslttklyr**（带项目 ID，不是单独的 `postgres`）
- URL 参数必须带 `?pgbouncer=true`

### Supabase 管理入口

- 后台：https://supabase.com/dashboard/project/tfgwybywaifjslttklyr
- Table Editor 可以直接查看/编辑数据
- SQL Editor 可以跑查询

---

## 部署：Vercel

### 项目配置

```
项目名: gpt-navigator
区域: hnd1 (Tokyo) — 离 Supabase Tokyo 最近，延迟最低
框架: Next.js 14
构建: npm run build
输出: .next
```

### 环境变量（Vercel 后台设置，不在代码里）

| 变量名 | 用途 | 环境 |
|--------|------|------|
| `DATABASE_URL` | Supabase 连接 | Production |
| `NEXT_PUBLIC_SITE_URL` | 网站 canonical URL | Production |
| `ADMIN_PASSWORD` | 管理后台登录密码 | Production |

### 部署流程

1. `git push origin main` → Vercel 自动检测并构建
2. 检查部署日志有无报错
3. 生产域名自动生效

### 常用命令

```bash
vercel env ls              # 查看环境变量名称列表
vercel env pull .env.local # 拉取环境变量到本地（会覆盖！备份先）
```

---

## 域名：Cloudflare → Vercel

```
用户 → www.ins199.com (Cloudflare DNS)
      ↓ CNAME record
      → cname.vercel-dns.com
        ↓
        Vercel 自动处理 SSL
```

### Cloudflare DNS 关键配置

- `www.ins199.com` → CNAME → `cname.vercel-dns.com`（已配置）
- SSL/TLS 模式：Full 或 Full (strict)
- 不要开 Cloudflare Proxy（橙色云朵关掉），否则 Vercel SSL 可能出问题

---

## 代码管理：GitHub

### 仓库

```
https://github.com/ins199/gpt-navigator
分支策略: 所有开发在 main，单人项目不用分支
```

### GitHub Secrets（Settings → Secrets → Actions）

爬虫 Workflow 需要两个 Secret：

| Secret 名 | 内容 |
|-----------|------|
| `DATABASE_URL` | Supabase Transaction Pooler 连接字符串 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |

### GitHub Actions

- 工作流文件：`.github/workflows/crawler.yml`
- 自动运行：每天 UTC 7:00
- 手动触发：https://github.com/ins199/gpt-navigator/actions/workflows/crawler.yml
- 运行内容：discover → crawl → update

---

## 爬虫系统

### 本地运行（开发调试）

```bash
cd crawler
python main.py discover   # 发现新平台，写入 crawl_jobs
python main.py crawl      # 处理 5 个 pending 任务
python main.py crawl --loop --limit 10  # 持续消费直到队列空
python main.py update     # 检查已有平台是否存活
```

### 需要的环境变量

```bash
# crawler/.env 或项目根 .env
DATABASE_URL="postgresql://..."
DEEPSEEK_API_KEY="sk-..."
```

### 爬虫依赖

- `httpx` — HTTP 请求
- `Playwright` + Chromium — 动态页面渲染
- `BeautifulSoup4` + `lxml` — HTML 解析
- `psycopg2-binary` — PostgreSQL 连接
- DeepSeek API — AI 结构化数据提取

### 数据流

```
discover（BeautifulSoup 扫导航站）
  → crawl_jobs (status=pending)
    → crawl (Playwright 打开官网 + DeepSeek 解析)
      → platforms + platform_features
        → update (httpx 检查存活)
```

---

## SEO 清单

### 已完成

- [x] 所有页面动态 `<title>` 和 `<meta description>`
- [x] OpenGraph 标签（`og:title`、`og:description`、`og:url`）
- [x] Twitter Card 标签
- [x] Canonical URL（指向 `www.ins199.com`）
- [x] `sitemap.xml` 自动生成（含平台详情页、Blog 页）
- [x] `robots.txt`（禁止 `/admin/` 和 `/api/admin/`）
- [x] Favicon（`/favicon.svg`）
- [x] Schema.org 结构化数据（Breadcrumb、Platform、WebSite）
- [x] ISR 缓存（列表页 60s，详情页 300s）
- [x] 根布局 `metadataBase` 设置
- [x] `keywords` meta 标签

### 待做

- [ ] Google Search Console 验证网站所有权
- [ ] 提交 sitemap 到 Google Search Console
- [ ] OG Image 自动生成（目前没有 og:image）
- [ ] 监控 Google 索引覆盖率

---

## 法律合规页面

### 已创建

- `/privacy` — 隐私政策
  - 说明收集什么数据（Vercel Analytics）
  - Cookie 使用说明
  - Affiliate 披露
  - 联系方式
- `/terms` — 服务条款
  - 使用条件
  - 免责声明
  - Affiliate 披露
  - 知识产权
  - 责任限制

### 维护注意

- 两个页面底部都有 "Last updated" 日期，内容有变动时更新日期
- Footer 已有链接指向这两个页面
- Affiliate 计划申请时可能需要提供这两个页面 URL

---

## 管理后台

### 访问

```
https://www.ins199.com/admin
密码在 Vercel 环境变量 ADMIN_PASSWORD 里
```

### 修改密码

1. 打开 https://vercel.com/ins199-s-projects/gpt-navigator/settings/environment-variables
2. 找到 `ADMIN_PASSWORD`，点 Edit → 输入新密码 → Save
3. 点 **Redeploy** 重新部署使新密码生效

### 后台功能

- **Dashboard** — 概览数据
- **Platforms** — 平台列表，可编辑、新增、修改状态
  - Active = 前台可见，Pending = 待审核不可见
- **Crawl Jobs** — 爬虫任务状态
  - Pending/Running/Done/Failed，失败的可重试
- **+ Add Platform** — 手动录入新平台

---

## 日常运维 Checklist

### 每日
- [ ] 看一眼 GitHub Actions 爬虫是否正常跑完
- [ ] 检查管理后台 Crawl Jobs 有无失败任务

### 每周
- [ ] 查看 Vercel Analytics 流量变化
- [ ] 检查 Google Search Console 索引状态
- [ ] 后台审核新收录的平台（Pending → Active/Reject）

### 每月
- [ ] 更新 Privacy Policy / Terms 日期（如果内容有变）
- [ ] 检查 Affiliate 链接是否有效
- [ ] 评估是否需要加新的 Blog 文章做 SEO
- [ ] 备份数据库（Supabase 免费套餐有自动备份但确认一下）

### 按需
- [ ] 改管理员密码
- [ ] 加新的爬虫数据源（改 `crawler/spiders/discovery_spider.py` 的 SOURCES）
- [ ] 加新的 Blog 文章（`content/blog/posts.ts`）

---

## 收入来源

### 当前阶段
1. **Affiliate 佣金** — 用户通过推广链接注册，平台付佣金
   - Freecash、Swagbucks、PrizeRebel 等
   - 注册推广计划后在管理后台填入 `affiliate_url`

### 后续考虑
2. **Google AdSense** — 流量上去后接入
3. **Featured 广告位** — 平台付费买首页推荐位（流量 > 10k/月可以考虑）

---

## 常见问题与注意事项

### Vercel 部署失败
- 先看 Deployment Logs 里的报错
- 常见原因：环境变量缺失、Prisma generate 失败、TypeScript 类型错误
- 本地先跑 `npm run build` 确认能过

### 数据库连不上
- Vercel → Supabase：确认用的是 Transaction Pooler（端口 6543）
- 本地开发：可以直接用 Supabase 直连（端口 5432），本地 IPv6 OK

### 爬虫跑失败
- GitHub Actions 日志里有详细报错
- 常见：DeepSeek API Key 过期、目标网站改版、Playwright 超时
- 失败的 job 会在管理后台 Crawl Jobs 里显示，可以手动重试

### 页面打开慢
- 首次访问会触发 SSR，慢是正常（1-2s TTFB）
- 后续访问走 ISR 缓存，应该秒开
- 检查 Vercel Analytics 的 Web Vitals

### 不要做的事
- **不要**在代码里硬编码 API Key、密码、连接字符串
- **不要**用 `git add -A` 或 `git add .`（会意外提交 .env 等敏感文件）
- **不要**在 Vercel 上直接改 Prisma schema（应该本地 migrate → commit → push）
- **不要**改密码后忘记 Redeploy
- **不要**直接在 Supabase 里手动改数据绕过 Prisma（Schema 不一致会导致字段对不上）
