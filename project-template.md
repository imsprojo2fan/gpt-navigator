# {{PROJECT_NAME}} — 项目技术方案

<!--
  使用说明：
  1. 把本文档发给 Claude Code 或任何 LLM
  2. 告诉它你的产品需求（做什么、目标用户、商业模式）
  3. Claude 会基于此模板生成：
     - project-plan.md（填好所有 {{PLACEHOLDER}} 的具体方案）
     - CLAUDE.md（该项目专属的开发规范）
  4. 检查生成的方案 → 让 Claude 按 CLAUDE.md 开始开发

  本模板覆盖：基础设施 / 数据库 / 爬虫 / 前端架构 / SEO / 合规 / 运维
  所有 {{ALL_CAPS}} 是需要替换的占位符，LLM 会根据你的需求自动填充。
-->

> 面向 {{TARGET_AUDIENCE}} 的 {{PRODUCT_TYPE}}。
> {{ONE_LINE_VALUE_PROP}}。
> 目标用户：{{USER_GEO}} {{USER_LANG}} 用户。

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 + API | Next.js 14 (App Router) | SSR + ISR，SEO 友好 |
| 数据库 | Supabase PostgreSQL | 免费套餐起步，按需升级 |
| ORM | Prisma | 类型安全，自动 migration |
| 样式 | Tailwind CSS | utility-first，响应式 |
| 部署 | Vercel | 东京区 `hnd1`，push 自动部署 |
| 域名 DNS | Cloudflare | CNAME 指向 Vercel |
| 代码托管 | GitHub | `main` 分支 push → Vercel 自动部署 |
| 爬虫 | Python 3.11 + Playwright + httpx | 独立 `/crawler` 目录 |
| AI 解析 | DeepSeek API 或 Claude API | 从非结构化内容提取数据 |
| 爬虫调度 | GitHub Actions | cron 定时 + workflow_dispatch 手动 |
| 统计分析 | Vercel Analytics | 页面访问量、Web Vitals |
| SEO 监控 | Google Search Console | 搜索排名、索引状态 |

---

## 基础设施

### 数据库：Supabase

```
Supabase 免费套餐
├── PostgreSQL 15
├── 区域选离 Vercel 部署区域最近的
├── 直连端口 5432（本地开发用）
└── Transaction Pooler 端口 6543（Vercel 生产用）
```

**Vercel → Supabase 必须用 Transaction Pooler**。Vercel 函数只有 IPv4 出网，Supabase 直连只解析 IPv6 DNS。

```
# 生产连接（Vercel 用）
DATABASE_URL="postgresql://postgres.{{SUPABASE_PROJECT_ID}}:[PASSWORD]@aws-1-{{REGION}}.pooler.supabase.co:6543/postgres?pgbouncer=true"

# 本地开发（直连即可）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.{{SUPABASE_PROJECT_ID}}.supabase.co:5432/postgres"
```

注意用户名是 `postgres.{{SUPABASE_PROJECT_ID}}`，不是 `postgres`。

### 部署：Vercel

```json
// vercel.json
{ "regions": ["hnd1"] }
```

- 区域选离 Supabase 最近的（如 Tokyo → `hnd1`）
- push `main` 自动部署
- 环境变量在 Vercel 后台设置：`DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`、`ADMIN_PASSWORD`
- ISR 策略：列表页 `revalidate = 60`，详情页 `revalidate = 300`

### 域名：Cloudflare → Vercel

```
{{DOMAIN}} (Cloudflare DNS)
  → CNAME → cname.vercel-dns.com
    → Vercel 自动 SSL
```

- Cloudflare Proxy 关掉（橙色云朵），否则 Vercel SSL 冲突
- SSL/TLS 模式：Full

### 爬虫调度：GitHub Actions

```yaml
# .github/workflows/crawler.yml
on:
  schedule: "0 7 * * *"    # 每天 UTC 7:00
  workflow_dispatch:         # 手动触发
```

GitHub Secrets 需配置：`DATABASE_URL`、`AI_API_KEY`。

---

## 数据库表设计（通用骨架）

### 核心业务表（1 对多特性配置时用）

```sql
-- 主表
CREATE TABLE {{TABLE_NAME}} (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,  -- URL 安全标识
  description   TEXT,
  image_url     VARCHAR(500),
  website_url   VARCHAR(500),
  rating        DECIMAL(2,1),
  status        VARCHAR(20) DEFAULT 'active',  -- active/pending/inactive
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 特性表（1-to-1 关系）
CREATE TABLE {{TABLE_NAME}}_features (
  id            SERIAL PRIMARY KEY,
  {{TABLE}}_id  INTEGER UNIQUE REFERENCES {{TABLE_NAME}}(id) ON DELETE CASCADE,
  -- 根据业务自定义字段
  tags          TEXT[],     -- 标签数组
  properties    JSONB,      -- 灵活属性
  created_at    TIMESTAMP DEFAULT NOW()
);
```

**Prisma 1-to-1 查询注意**：筛选特性时用 `is` 而非 `some`：
```typescript
where: { features: { is: { tags: { hasSome: [...] } } } }
```

### 爬虫任务表（通用，可直接复制）

```sql
CREATE TABLE crawl_jobs (
  id            SERIAL PRIMARY KEY,
  target_url    VARCHAR(500) NOT NULL,
  source_site   VARCHAR(100),
  job_type      VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'pending', -- pending/running/done/failed
  error_msg     TEXT,
  retry_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  processed_at  TIMESTAMP
);

CREATE TABLE crawl_logs (
  id            SERIAL PRIMARY KEY,
  {{TABLE}}_id  INTEGER REFERENCES {{TABLE_NAME}}(id),
  crawled_at    TIMESTAMP DEFAULT NOW(),
  changes       JSONB,     -- 字段变更记录
  snapshot      JSONB      -- 当次数据快照
);
```

---

## 爬虫系统

### 架构

```
discover（httpx + BeautifulSoup 扫数据源站）
  → crawl_jobs (status=pending)
    → crawl（Playwright + AI API 解析）
      → {{TABLE_NAME}} + {{TABLE_NAME}}_features
        → update（httpx 巡检已有数据）
```

### 爬虫一：发现（discover）

在 `crawler/spiders/discovery_spider.py` 的 `SOURCES` 配置数据源：

```python
SOURCES = [
    {
        "name": "source_name",
        "url": "https://target-directory-site.com",
        "selectors": ["a[href]", "h2 a", ".content a"],  # CSS 选择器
        "url_filter": lambda u: "exclude-pattern" not in u,
    },
]
```

流程：httpx 抓取 → BeautifulSoup 提取链接 → 去重（查 crawl_jobs）→ 新链接入队。

依赖：`httpx`、`beautifulsoup4`、`lxml`（CI 需 `apt install libxml2-dev libxslt-dev`）。

### 爬虫二：详情抓取（crawl）

流程：Playwright + Chromium 打开目标页 → AI API 提取结构化数据 → 写入数据库。

AI 解析 Prompt 模板（`crawler/parsers/ai_parser.py`）根据业务自定义。通用做法：
- DeepSeek: `deepseek-chat` 模型，`https://api.deepseek.com/v1/chat/completions`
- Claude: `claude-haiku` 模型，`https://api.anthropic.com/v1/messages`
- 返回 JSON，外层 try/except 兜底防解析失败

**Python 数据库操作**：爬虫用 `psycopg2-binary` 写原生 SQL（Prisma 是 JS 的，Python 用不了）。

### 爬虫三：定时更新（update）

遍历所有 active 记录 → httpx 检查是否存活 → 标记失效 + 写 crawl_logs。

---

## 前端页面架构

```
app/
├── layout.tsx                    # 根布局：metadataBase、OG、keywords、Analytics
├── sitemap.ts                    # 动态 sitemap（静态页 + DB 数据 + Blog）
├── robots.ts                     # 屏蔽 /admin、/api/admin
├── not-found.tsx                 # 404
├── (site)/                       # 前台路由组（共享 Header + Footer）
│   ├── page.tsx                  # 首页
│   ├── {{list}}/page.tsx         # 列表页：筛选 + 排序
│   ├── {{list}}/[slug]/page.tsx  # 详情页（SEO 核心）
│   ├── compare/page.tsx          # 对比页（可选）
│   ├── blog/                     # Blog 模块（可选）
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── privacy/page.tsx          # 隐私政策
│   └── terms/page.tsx            # 服务条款
├── admin/                        # 后台路由组（独立布局）
│   ├── page.tsx                  # Dashboard
│   ├── {{list}}/page.tsx         # 数据管理
│   └── crawl-jobs/page.tsx       # 爬虫监控
└── api/
    ├── {{list}}/route.ts         # 列表 API
    ├── admin/auth/route.ts       # 登录认证
    └── admin/crawl-jobs/...      # 爬虫管理 API
```

**路由组**：`(site)` 前台（Header/Footer/BreadcrumbSchema），`admin` 后台（sidebar 布局）。

**渲染策略**：
- 列表/详情：ISR（`revalidate = 60/300`），不设 `force-dynamic`
- Blog：纯静态
- Admin：CSR + API Routes

---

## SEO 模板

### 根布局 metadata

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://{{DOMAIN}}";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),               // 所有 canonical 的基础
  title: {
    default: "{{SITE_TITLE}}",
    template: "%s | {{SITE_NAME}}",
  },
  description: "{{SITE_DESCRIPTION}}",
  keywords: ["{{KW1}}", "{{KW2}}", "{{KW3}}"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "{{SITE_NAME}}",
    title: "{{OG_TITLE}}",
    description: "{{OG_DESCRIPTION}}",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "{{TW_TITLE}}",
    description: "{{TW_DESCRIPTION}}",
  },
  icons: { icon: "/favicon.svg" },
};
```

### 动态详情页 metadata

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await db.{{table}}.findUnique({ where: { slug: params.slug } });
  if (!item) return { title: "Not Found" };
  return {
    title: `${item.name} {{PAGE_SUFFIX}}`,
    description: item.description || "{{FALLBACK_DESCRIPTION}}",
    alternates: { canonical: `/{{list}}/${item.slug}` },
    openGraph: {
      title: `${item.name} {{PAGE_SUFFIX}} | {{SITE_NAME}}`,
      description: item.description,
      url: `/{{list}}/${item.slug}`,
      type: "article",
    },
  };
}
```

### Sitemap（自动含平台详情页 + Blog）

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await db.{{table}}.findMany({
    where: { status: "active" },
  });
  return [
    { url: BASE_URL, priority: 1, changeFrequency: "daily" },
    { url: `${BASE_URL}/{{list}}`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/blog`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: "monthly" },
    // 动态页
    ...items.map(item => ({
      url: `${BASE_URL}/{{list}}/${item.slug}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
    })),
    // Blog 文章
    ...posts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ];
}
```

### Robots

```
Allow: /
Disallow: /admin/, /api/admin/
Sitemap: https://{{DOMAIN}}/sitemap.xml
```

### 结构化数据

至少加三个 Schema：
- `WebSiteSchema` — 全局，放 layout
- `BreadcrumbSchema` — 每个前台页面
- `{{Item}}Schema` — 详情页（根据业务类型用 Article/Product/Review）

### Favicon

`public/favicon.svg` + layout metadata 中 `icons: { icon: "/favicon.svg" }`。

---

## 法律合规（Affiliate / 商业站点必备）

两个必须页面，Footer 放链接：

**Privacy Policy** (`/privacy`)：
- 收集什么数据（Analytics 匿名统计）
- Cookie 使用（无追踪 Cookie 也要声明）
- 第三方链接免责
- Affiliate 披露（如有）
- 联系方式

**Terms of Service** (`/terms`)：
- 服务描述
- 免责声明（信息不保证准确）
- Affiliate 关系披露（如有）
- 知识产权
- 责任限制

---

## 管理后台

### 认证方案

```typescript
// app/api/admin/auth/route.ts — POST 验证密码
// app/admin/login/ — 登录页
// middleware.ts — cookie 校验
```

**登录跳转必须用 `window.location.href` 而非 `router.push()`**。
原因：Cookie `SameSite=lax` 时 RSC fetch 不可靠。

### 密码管理

Vercel 环境变量 `ADMIN_PASSWORD`，改了要 Redeploy。

---

## 环境变量总表

| 变量 | 位置 | 说明 |
|------|------|------|
| `DATABASE_URL` | Vercel + GitHub Secrets + .env.local | Supabase 连接串 |
| `NEXT_PUBLIC_SITE_URL` | Vercel + .env.local | Canonical URL |
| `ADMIN_PASSWORD` | Vercel + .env.local | 后台密码 |
| `AI_API_KEY` | GitHub Secrets + .env.local | AI API Key |

---

## 本地开发

```bash
npm run dev                          # Next.js localhost:3000
npx prisma studio                    # 数据库可视化
cd crawler && python main.py discover/crawl/update
```

```bash
# 数据库迁移
npx prisma migrate dev --name 描述  # 创建 migration
npx prisma generate                  # 重新生成 Client
```

---

## 上线 Checklist

- [ ] `npm run build` 编译通过
- [ ] Vercel 环境变量已设置
- [ ] GitHub Secrets 已设置
- [ ] `NEXT_PUBLIC_SITE_URL` 指向正确域名
- [ ] Sitemap 和 Robots fallback URL 指向正确域名
- [ ] 域名 Cloudflare DNS → Vercel 生效
- [ ] Google Search Console 验证 + 提交 sitemap
- [ ] Privacy / Terms 页面可访问
- [ ] Footer 含 Privacy / Terms 链接
- [ ] 管理员密码已改
- [ ] GitHub Actions 跑通一次
- [ ] Favicon 可访问

---

## 日常运维

| 频率 | 事项 |
|------|------|
| 每日 | 检查 GitHub Actions 爬虫 |
| 每周 | Vercel Analytics + GSC 数据 |
| 每月 | 审核待处理数据、更新外部链接 |
| 按需 | 写 SEO 文章、加爬虫数据源 |
