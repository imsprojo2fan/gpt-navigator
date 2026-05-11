# GPT Navigator — 项目技术方案

> 面向海外英语用户的 GPT 平台导航站。
> 爬虫自动收录"做任务赚钱"平台 → 用户发现平台 → 点击 Affiliate 链接注册 → 站长赚佣金。
> 目标用户：US / UK / CA / AU 英语用户。

---

## 技术栈（实际落地）

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 + API | Next.js 14 (App Router) | SSR + ISR，SEO 友好 |
| 数据库 | Supabase PostgreSQL | 免费套餐，东京区 |
| ORM | Prisma | 类型安全，自动 migration |
| 样式 | Tailwind CSS | utility-first，响应式 |
| 部署 | Vercel | 东京区 `hnd1`，自动部署 |
| 域名 DNS | Cloudflare | CNAME 指向 Vercel |
| 代码托管 | GitHub | `main` 分支 push 自动触发 Vercel 部署 |
| 爬虫 | Python 3.11 + Playwright + httpx | 独立目录 `/crawler` |
| AI 解析 | DeepSeek API (deepseek-chat) | 从网页 HTML 提取结构化数据 |
| 爬虫调度 | GitHub Actions | 每天 UTC 7:00 定时运行 |
| 统计分析 | Vercel Analytics | 页面访问量、Web Vitals |
| SEO 监控 | Google Search Console | 搜索排名、索引状态 |
| 任务队列 | PostgreSQL 表 `crawl_jobs` | 简单可靠，免额外中间件 |

---

## 基础设施详解

### 数据库：Supabase

```
Supabase 免费套餐
├── 区域：ap-northeast-1 (Tokyo)
├── PostgreSQL 15
├── 直连端口 5432（本地开发用）
└── Transaction Pooler 端口 6543（Vercel 生产用，IPv4 兼容）
```

**关键坑**：Vercel 函数只有 IPv4 出网，Supabase 直连只有 IPv6 DNS。
必须用 Transaction Pooler 连接：

```
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"
```

注意：用户名带项目 ID `postgres.tfgwybywaifjslttklyr`，不是单独的 `postgres`。

### 部署：Vercel

```
vercel.json:
{
  "regions": ["hnd1"]   // 东京，离 Supabase Tokyo 最近
}
```

- 框架自动检测 Next.js
- push `main` 分支自动部署生产环境
- 环境变量在 Vercel 后台设置，不写在代码里
- ISR 策略：列表页 `revalidate = 60`，详情页 `revalidate = 300`

### 域名：Cloudflare → Vercel

```
www.ins199.com (Cloudflare DNS)
  → CNAME → cname.vercel-dns.com
    → Vercel 自动处理 SSL
```

- SSL/TLS 模式：Full
- Cloudflare Proxy 关掉（橙色云朵），否则 Vercel SSL 出问题

### 爬虫调度：GitHub Actions

```yaml
# .github/workflows/crawler.yml
on:
  schedule: "0 7 * * *"     # 每天 UTC 7:00
  workflow_dispatch:          # 手动触发
```

GitHub Secrets 需要配置：
- `DATABASE_URL` — Supabase Transaction Pooler 连接串
- `DEEPSEEK_API_KEY` — DeepSeek API Key

---

## 数据库表设计

### platforms（平台主表）
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL
description     TEXT
logo_url        VARCHAR(500)
website_url     VARCHAR(500) NOT NULL
affiliate_url   VARCHAR(500)        -- 推广链接（手动填入）
min_cashout     VARCHAR(50)         -- "$1.00"
rating          DECIMAL(2,1)
trustpilot_score DECIMAL(2,1)
trustpilot_url  VARCHAR(500)
is_verified     BOOLEAN DEFAULT false
status          VARCHAR(20) DEFAULT 'active'  -- active/pending/inactive
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### platform_features（1-to-1 平台特性）
```sql
platform_id     INTEGER UNIQUE REFERENCES platforms(id)
task_types      TEXT[]   -- survey, games, app, video, referral, shopping, cashback, offer
payment_methods TEXT[]   -- paypal, crypto, giftcard, bank, venmo, skrill, payoneer
regions         TEXT[]   -- US, UK, CA, AU, Global, EU
has_mobile_app  BOOLEAN DEFAULT false
is_beginner_friendly BOOLEAN DEFAULT true
```

**Prisma 1-to-1 注意**：查询时用 `is` 过滤而非 `some`：
```typescript
where: { features: { is: { taskTypes: { hasSome: [...] } } } }
```

### crawl_jobs（爬虫任务队列）
```sql
id              SERIAL PRIMARY KEY
target_url      VARCHAR(500) NOT NULL
source_site     VARCHAR(100)
job_type        VARCHAR(50)       -- discover / detail / update
status          VARCHAR(20) DEFAULT 'pending'  -- pending/running/done/failed
error_msg       TEXT
retry_count     INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
processed_at    TIMESTAMP
```

### crawl_logs（爬取历史审计）
```sql
platform_id     INTEGER REFERENCES platforms(id)
crawled_at      TIMESTAMP DEFAULT NOW()
changes         JSONB             -- 哪些字段变了
snapshot        JSONB             -- 当次数据快照
```

---

## 爬虫系统

### 爬虫一：平台发现（discover）

数据源（`crawler/spiders/discovery_spider.py` SOURCES）：
- `gpthub.gg` — GPT 导航站目录
- `elitesurveysites.com` — Survey 站点导航
- `reddit.com/r/beermoney` — 社区推荐帖
- `trustpilot.com/categories/rewards_programs` — Trustpilot 分类

流程：
```
httpx 抓取目录页
  → BeautifulSoup 提取链接
    → 去重（查 crawl_jobs 是否已有 target_url）
      → 新链接写入 crawl_jobs（status=pending, job_type=detail）
```

技术依赖：`httpx`、`beautifulsoup4`、`lxml`（需要系统 `libxml2-dev libxslt-dev`）。

### 爬虫二：平台详情（crawl）

```
从 crawl_jobs 取 pending 任务（FOR UPDATE SKIP LOCKED 防重复）
  → Playwright + Chromium 渲染官网首页
    → 同时 httpx 抓 Trustpilot 搜索页
      → HTML 拼接后发给 DeepSeek API 解析
        → 结构化数据写入 platforms + platform_features
          → 状态标记 done
```

**Prisma 不能用**：爬虫是 Python，数据库操作直接用 `psycopg2-binary` 写 SQL。
表结构和前端 Prisma schema 要手动保持一致。

### 爬虫三：定时更新（update）

```
遍历 status=active 的平台
  → httpx 检查官网是否可访问（HTTP 200/非200）
    → 不可访问的标记 inactive
      → 记录到 crawl_logs
```

### DeepSeek API 解析 Prompt

```
从以下网页内容中提取 GPT 平台信息，只返回 JSON：
{
  "name": "平台名称",
  "description": "一句话简介（英文，50字以内）",
  "min_cashout": "最低提现金额，如 $1.00 或 null",
  "payment_methods": ["paypal", "crypto", "giftcard", "bank", "venmo"],
  "task_types": ["survey", "games", "app", "video", "referral", "shopping"],
  "regions": ["US", "UK", "Global"],
  "has_mobile_app": true/false
}
如果内容不包含平台信息，返回 {"error": "no platform info found"}
```

---

## 前端页面架构

```
app/
├── layout.tsx                    # 根布局：metadataBase、OG、Analytics
├── sitemap.ts                    # 动态生成 sitemap.xml（平台 + Blog）
├── robots.ts                     # 屏蔽 /admin、/api/admin
├── not-found.tsx                 # 404 页面
├── (site)/                       # 前台（共享 Header + Footer）
│   ├── page.tsx                  # 首页：精选平台 + 分类入口
│   ├── platforms/
│   │   ├── page.tsx              # 列表页：筛选 + 排序 + 分页
│   │   └── [slug]/page.tsx       # 详情页：评分、Task Types、相似推荐
│   ├── compare/page.tsx          # 对比页：最多 3 个平台并排
│   ├── blog/
│   │   ├── page.tsx              # Blog 列表
│   │   └── [slug]/page.tsx       # Blog 文章（静态 MDX 内容）
│   ├── privacy/page.tsx          # 隐私政策
│   └── terms/page.tsx            # 服务条款
├── admin/                        # 管理后台（密码保护）
│   ├── page.tsx                  # Dashboard
│   ├── platforms/page.tsx        # 平台管理列表
│   ├── platforms/new/page.tsx    # 手动新增
│   ├── platforms/[id]/page.tsx   # 编辑平台
│   └── crawl-jobs/page.tsx       # 爬虫任务监控
└── api/                          # API Routes
    ├── platforms/route.ts        # 列表查询 + 筛选
    ├── admin/auth/route.ts       # 密码登录
    └── admin/crawl-jobs/...      # 爬虫任务管理
```

**路由组设计**：
- `(site)` — 前台页面，共享 Header/Footer/BreadcrumbSchema
- `admin` — 后台页面，独立的 sidebar 布局，无前台导航

**渲染策略**：
- 列表页/详情页：`revalidate = 60/300`（ISR），不设 `force-dynamic`
- 对比页：`revalidate = 60`，因为查询参数动态变化
- Blog：静态内容，不设 revalidate（纯静态）
- Admin：纯 CSR + API Routes，不需要 ISR

---

## SEO 实现

### 全局配置（根 layout）

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),      // 必须设置，canonical 基础
  title: { default: "...", template: "%s | GPT Navigator" },
  description: "...",
  keywords: ["gpt sites", "get paid to", ...],
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "GPT Navigator", ... },
  twitter: { card: "summary_large_image", ... },
  icons: { icon: "/favicon.svg" },
};
```

### 动态页面（generateMetadata）

Platform 详情页和 Blog 详情页用 `generateMetadata` 动态生成 title/description/OG。

### Sitemap（app/sitemap.ts）

```typescript
export default async function sitemap() {
  // 静态页面：首页(1.0)、列表(0.9)、对比(0.8)、Blog(0.8)、隐私(0.3)、条款(0.3)
  // 动态平台页：从 DB 查所有 active 平台，priority 0.9
  // Blog 文章：从 content/blog/posts.ts 读取，priority 0.7
}
```

### Robots（app/robots.ts）

```
Allow: /
Disallow: /admin/, /api/admin/
Sitemap: https://www.ins199.com/sitemap.xml
```

### 结构化数据（Schema.org）

- `WebSiteSchema` — 全局网站信息
- `BreadcrumbSchema` — 每个前台页面的面包屑
- `PlatformSchema` — 平台详情页（Review 类型）

### 其他

- Favicon：`public/favicon.svg` + metadata `icons` 字段
- Canonical：所有页面通过 `metadataBase` + `alternates.canonical` 自动生成
- 部署前检查：`NEXT_PUBLIC_SITE_URL` 指向正确的域名

---

## 法律合规页面

两个必须的页面（Affiliate 推广计划申请时需要提供 URL）：

**Privacy Policy** (`/privacy`)：
- 数据收集说明（Vercel Analytics 匿名统计）
- Cookie 使用（无追踪 Cookie）
- Affiliate 链接披露
- 第三方链接免责
- 联系方式 `admin@ins199.com`

**Terms of Service** (`/terms`)：
- 服务描述
- 免责声明（平台信息不保证准确）
- Affiliate 关系披露
- 知识产权
- 责任限制

Footer 组件中放置 Privacy 和 Terms 链接。

---

## 管理后台

### 认证方案

- 简单密码保护：`app/api/admin/auth/route.ts` POST 验证
- 密码存在 Vercel 环境变量 `ADMIN_PASSWORD`
- 登录成功设置 cookie → middleware 校验
- **关键坑**：登录后跳转不能用 `router.push()`，因为 cookie `SameSite=lax` 下 RSC fetch 不可靠。必须用 `window.location.href` 做整页刷新。

### 后台功能

- Dashboard — 平台总数、活跃平台、各状态任务统计
- Platforms — CRUD 管理，可编辑 Affiliate 链接、评分、状态
- Crawl Jobs — 查看任务状态，失败可重试
- 每个页面有中文使用提示

---

## 开发规范（摘要）

- TypeScript only，禁止 `.js`，禁止 `any`
- Server Component 优先，需交互才用 Client Component
- API 返回统一 `{ success: true, data: ... }` / `{ success: false, error: "..." }`
- 数据库操作全走 Prisma，禁写原始 SQL
- 改 Schema 必建 migration：`npx prisma migrate dev --name 描述`
- Tailwind CSS only，禁内联 style
- Affiliate 链接跳转 `target="_blank" rel="noopener noreferrer"`
- 前端代码禁止硬编码 API Key 或密码
- 爬虫请求间加 1-3 秒随机延迟

---

## 本地开发环境

### 启动

```bash
npm run dev                # Next.js 开发服务器（localhost:3000）
npx prisma studio          # 数据库可视化
cd crawler && python main.py discover/crawl/update  # 爬虫
```

### 环境变量（`.env.local`）

```bash
DATABASE_URL="postgresql://..."           # Supabase 直连（本地 IPv6 OK）
DEEPSEEK_API_KEY="sk-..."                 # 爬虫 AI 解析
ADMIN_PASSWORD="..."                      # 管理后台登录
NEXT_PUBLIC_SITE_URL="http://localhost:3000"  # 本地 canonical URL
```

### 数据库迁移

```bash
npx prisma migrate dev --name 描述更改  # 创建 migration
npx prisma generate                      # 重新生成 Prisma Client
```

---

## 部署上线 Checklist

- [ ] `npm run build` 本地编译通过
- [ ] Vercel 环境变量确认：`DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`、`ADMIN_PASSWORD`
- [ ] GitHub Secrets 确认：`DATABASE_URL`、`DEEPSEEK_API_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` 指向正确的生产域名
- [ ] `robots.ts` 和 `sitemap.ts` fallback URL 指向正确域名
- [ ] 域名 DNS（Cloudflare）CNAME 指向 Vercel
- [ ] Google Search Console 验证网站所有权
- [ ] 提交 sitemap URL 到 GSC
- [ ] Privacy Policy 和 Terms 页面可访问
- [ ] Footer 有 Privacy / Terms 链接
- [ ] 管理员密码已改为强密码
- [ ] GitHub Actions 爬虫 workflow 跑通一次

---

## 日常运维

| 频率 | 事项 |
|------|------|
| 每日 | 看 GitHub Actions 爬虫是否正常 |
| 每周 | 看 Vercel Analytics 流量 + GSC 索引 |
| 每月 | 审核 Pending 平台、更新 Affiliate 链接 |
| 按需 | 写 Blog SEO 文章、加新爬虫数据源 |

详见 `project-runbook.md`。

---

## 开发阶段（已全部完成）

- [x] Phase 1：基础设施（Next.js + Prisma + Supabase + Vercel）
- [x] Phase 2：爬虫系统（discover / crawl / update）
- [x] Phase 3：前端 MVP（首页 / 列表 / 详情 / 对比）
- [x] Phase 4：管理后台（平台管理 / 爬虫监控）
- [x] Phase 5：SEO 优化（metadata / sitemap / robots / Schema / canonical / analytics）
- [x] Phase 6：合规 + 运维（隐私条款 / GitHub Actions / runbook）
