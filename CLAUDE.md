# CLAUDE.md

这是 GPT Navigator 项目的开发规范文件。
每次开始开发前请先阅读本文件。

---

## 项目简介

GPT Navigator 是一个面向海外英语用户的 GPT 平台导航站。
通过爬虫自动收录全网"做任务赚钱"平台，用户发现平台后
点击 Affiliate 链接注册，站长赚取推广佣金。

详细设计见 `project-plan.md`，运维实操见 `project-runbook.md`。

---

## 技术栈

- **前端 + API**：Next.js 14，使用 App Router
- **数据库**：PostgreSQL，ORM 使用 Prisma
- **样式**：Tailwind CSS
- **爬虫**：Python（独立目录 `/crawler`）
- **语言**：前端代码用 TypeScript，爬虫用 Python 3.11+

---

## 目录结构

```
/
├── app/                   # Next.js App Router 页面
│   ├── (site)/            # 前台页面
│   │   ├── page.tsx       # 首页
│   │   ├── platforms/     # 列表页 + 详情页
│   │   └── compare/       # 对比页
│   ├── admin/             # 管理后台
│   └── api/               # API Routes
├── components/            # 可复用组件
│   ├── ui/                # 基础 UI 组件
│   └── platform/          # 平台相关组件
├── lib/                   # 工具函数
│   ├── db.ts              # Prisma client
│   ├── api.ts             # API 工具函数
│   └── utils.ts           # 通用工具
├── prisma/
│   ├── schema.prisma      # 数据库 Schema
│   └── migrations/        # 数据库迁移文件
├── crawler/               # Python 爬虫（独立模块）
│   ├── main.py
│   ├── spiders/           # 各爬虫
│   ├── parsers/           # AI 解析模块
│   └── requirements.txt
├── public/                # 静态资源
├── .github/workflows/     # GitHub Actions（爬虫定时任务）
├── project-plan.md        # 项目规划文档
├── project-runbook.md     # 运维手册（基础设施、SEO、合规）
└── CLAUDE.md              # 本文件
```

---

## 开发规范

### TypeScript
- 所有前端文件使用 `.tsx` 或 `.ts`，禁止用 `.js`
- 所有数据类型必须显式定义，禁止用 `any`
- API 返回值必须有类型定义

### 组件规范
- 组件文件名使用 PascalCase，如 `PlatformCard.tsx`
- 每个组件只做一件事，超过 150 行考虑拆分
- 使用 Server Component 优先，需要交互再用 Client Component
- Client Component 文件顶部加 `'use client'`

### API 规范
统一返回格式：
```typescript
// 成功
{ success: true, data: {...} }

// 失败
{ success: false, error: "错误信息" }
```

HTTP 状态码：
- 200：成功
- 400：参数错误
- 404：资源不存在
- 500：服务器错误

### 数据库规范
- 所有数据库操作通过 Prisma，禁止写原始 SQL
- Prisma client 统一从 `lib/db.ts` 导入
- 字段命名用 camelCase（Prisma 默认）
- 每次改 schema 必须创建 migration，禁止直接 push

### 样式规范
- 只用 Tailwind CSS 的 utility class
- 禁止写内联 style
- 响应式断点：`sm:` `md:` `lg:`
- 颜色使用 Tailwind 默认色板

### Python 爬虫规范
- 使用 `httpx` 做 HTTP 请求，`Playwright` 处理动态页面
- 所有爬虫继承 `BaseSpider` 基类
- 请求之间加随机延迟 `1-3秒`，避免被封
- 错误必须记录到 `crawl_jobs.error_msg`，不能静默失败
- DeepSeek API 调用统一在 `parsers/ai_parser.py`

---

## 环境变量

项目需要以下环境变量，开发时放在 `.env.local`：

```bash
# 数据库
DATABASE_URL="postgresql://..."

# DeepSeek API（爬虫 AI 解析用）
DEEPSEEK_API_KEY="sk-..."

# 网站 URL（SEO canonical 用）
NEXT_PUBLIC_SITE_URL="https://www.ins199.com"

# 管理后台密码
ADMIN_PASSWORD="..."

# 可选：Redis 缓存
REDIS_URL="redis://..."
```

---

## 常用命令

```bash
# 启动开发服务器
npm run dev

# 数据库迁移
npx prisma migrate dev --name 描述

# 查看数据库
npx prisma studio

# 类型检查
npm run type-check

# 运行爬虫（在 crawler 目录）
cd crawler
python main.py discover    # 发现新平台
python main.py crawl       # 抓取详情
python main.py update      # 更新已有平台
```

---

## 重要约定

1. **每次只做一个模块**，做完告诉我，等我确认再继续
2. **数据库有改动**必须生成 migration 文件
3. **新增 API**必须同步更新类型定义
4. **爬虫运行前**检查 `.env` 是否有 `DEEPSEEK_API_KEY`
5. **所有页面**必须有移动端响应式布局
6. **详情页**是 SEO 核心，`<title>` 和 `<description>` 必须动态生成
7. **Affiliate 链接**跳转必须加 `target="_blank" rel="noopener noreferrer"`
8. **禁止**在前端代码中硬编码任何 API Key 或密码

---

## 当前开发阶段

> 每完成一个 Phase 后更新这里

- [x] 项目规划完成
- [x] Phase 1：基础设施
- [x] Phase 2：爬虫系统
- [x] Phase 3：前端 MVP
- [x] Phase 4：管理后台
- [x] Phase 5：SEO 优化
