# GPT Navigator — Project Plan

## 项目概述

一个面向海外用户的 GPT 平台导航站。
通过爬虫自动收录、更新全网"做任务赚钱"平台信息，
用户通过导航站发现平台 → 点击 Affiliate 链接注册 → 站长赚取佣金。
早期通过 Google AdSense 变现，流量大后叠加 Affiliate 收入。

**目标用户**：英语用户，主要是 US / UK / CA / AU

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 + 后端 API | Next.js 14 (App Router) | SEO 友好，一体化 |
| 数据库 | PostgreSQL + Prisma ORM | 结构化存储平台数据 |
| 爬虫 | Python + Playwright + httpx | 处理静态和动态页面 |
| AI 解析 | Claude API (claude-haiku) | 从 HTML 提取结构化数据 |
| 任务队列 | PostgreSQL-based queue | 简单可靠，无需额外中间件 |
| 缓存 | Next.js ISR + Redis (可选) | 页面静态缓存 |
| 部署 | Vercel (前端) + Railway (DB) | 快速上线，低成本 |
| 爬虫部署 | Railway / Render cron job | 定时任务 |
| 样式 | Tailwind CSS | 快速开发 |

---

## 数据库表结构

### platforms（平台主表）
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL        -- 平台名称
slug            VARCHAR(100) UNIQUE NOT NULL -- URL 路径，如 freecash
description     TEXT                         -- 平台简介
logo_url        VARCHAR(500)                 -- Logo 图片地址
website_url     VARCHAR(500) NOT NULL        -- 官网地址
affiliate_url   VARCHAR(500)                 -- 推广链接（手动填入）
min_cashout     VARCHAR(50)                  -- 最低提现额，如 "$1.00"
rating          DECIMAL(2,1)                 -- 综合评分 0-5
trustpilot_score DECIMAL(2,1)               -- Trustpilot 评分
trustpilot_url  VARCHAR(500)                 -- Trustpilot 页面地址
is_verified     BOOLEAN DEFAULT false        -- 是否人工审核
status          VARCHAR(20) DEFAULT 'active' -- active / inactive / pending
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
last_crawled_at TIMESTAMP                    -- 最近一次爬取时间
```

### platform_features（平台特性）
```sql
id              SERIAL PRIMARY KEY
platform_id     INTEGER REFERENCES platforms(id)
task_types      TEXT[]   -- survey, games, app, video, referral, shopping
payment_methods TEXT[]   -- paypal, crypto, giftcard, bank
regions         TEXT[]   -- US, UK, CA, AU, Global
has_mobile_app  BOOLEAN DEFAULT false
is_beginner_friendly BOOLEAN DEFAULT true
```

### crawl_jobs（爬虫任务队列）
```sql
id              SERIAL PRIMARY KEY
target_url      VARCHAR(500) NOT NULL
source_site     VARCHAR(100)                 -- 从哪个站点发现的
job_type        VARCHAR(50)                  -- discover / detail / update
status          VARCHAR(20) DEFAULT 'pending' -- pending / running / done / failed
raw_data        TEXT                         -- 原始 HTML 或内容
parsed_data     JSONB                        -- AI 解析后的结构化数据
error_msg       TEXT
retry_count     INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()
processed_at    TIMESTAMP
```

### crawl_logs（爬取历史）
```sql
id              SERIAL PRIMARY KEY
platform_id     INTEGER REFERENCES platforms(id)
crawled_at      TIMESTAMP DEFAULT NOW()
changes         JSONB                        -- 检测到哪些字段变化
snapshot        JSONB                        -- 当次数据快照
```

---

## 系统架构

```
┌─────────────────────────────────────────┐
│            爬虫层（Python）               │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ 发现爬虫     │  │  详情爬虫         │  │
│  │ 扫导航站    │  │  抓官网+Trustpilot│  │
│  │ 扫 Reddit   │  │  AI 解析数据      │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         └────────┬──────────┘           │
└──────────────────┼──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         PostgreSQL 数据库                │
│  platforms / crawl_jobs / crawl_logs    │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Next.js（前端 + API）            │
│                                         │
│  页面：首页 / 列表页 / 详情页 / 对比页   │
│  API：平台数据 / 搜索 / 筛选             │
│  管理：后台审核 / 数据编辑               │
└─────────────────────────────────────────┘
```

---

## 爬虫设计

### 爬虫一：平台发现（每天运行）

目标站点：
- `gpthub.gg` — 导航站，直接有平台列表
- `elitesurveysites.com` — 导航站
- `reddit.com/r/beermoney` — 社区帖子
- `trustpilot.com/categories/rewards_programs` — 分类页

流程：
```
抓取目标页面
    ↓
提取所有平台名称 + 官网链接
    ↓
去重（对比已有数据库记录）
    ↓
新平台写入 crawl_jobs（job_type = detail）
```

### 爬虫二：平台详情（消费队列）

流程：
```
从 crawl_jobs 取 pending 任务
    ↓
用 Playwright 抓取官网首页
    ↓
同时抓取 Trustpilot 对应页面
    ↓
将 HTML 发送给 Claude API 解析
    ↓
结构化数据写入 platforms + platform_features
    ↓
更新 crawl_jobs 状态为 done
```

Claude API 解析 Prompt：
```
从以下网页内容中提取 GPT 平台信息，只返回 JSON，不要其他内容：
{
  "name": "平台名称",
  "description": "一句话简介（英文，50字以内）",
  "min_cashout": "最低提现金额，如 $1.00",
  "payment_methods": ["paypal", "crypto", "giftcard"],
  "task_types": ["survey", "games", "app", "video"],
  "regions": ["US", "UK", "Global"],
  "has_mobile_app": true/false
}

网页内容：{html_content}
```

### 爬虫三：定时更新（每周运行）

```
遍历所有 status=active 的平台
    ↓
重新抓取 Trustpilot 评分
    ↓
检测官网是否仍然可访问
    ↓
记录变化到 crawl_logs
    ↓
自动标记失效平台
```

---

## 前端页面结构

### 页面列表

```
/                    首页（精选平台 + 分类入口）
/platforms           全部平台列表（支持筛选+排序）
/platforms/[slug]    平台详情页（SEO 重点）
/compare             平台对比页
/blog                SEO 文章（后期）
/admin               管理后台（简单密码保护）
```

### 首页模块
- Hero：一句话说明网站价值
- 精选平台（评分最高 6 个）
- 按任务类型分类入口（Survey / Games / Apps / Videos）
- 按地区筛选入口（US / UK / Global）
- 最新收录平台

### 列表页筛选条件
- 任务类型（多选）
- 支付方式（多选）
- 支持地区
- 最低提现金额（范围）
- 排序：评分 / 最新收录 / 最低提现

### 详情页内容（SEO 核心）
- 平台基本信息
- 任务类型说明
- 支付方式
- 优缺点（AI 生成）
- Trustpilot 评分展示
- 注册按钮（Affiliate 链接）
- 相似平台推荐

---

## 变现策略

### 阶段一：Google AdSense（上线即接入）
- 列表页侧边栏广告
- 详情页内容广告
- 目标：有流量就有收入

### 阶段二：Affiliate 链接（上线第一周手动完成）
需要手动注册的推广计划：
- Freecash Affiliate
- Swagbucks / Prodege
- PrizeRebel
- InboxDollars
- TimeBucks
- Gaingg
- EarnLab

注册完后在 `platforms.affiliate_url` 填入推广链接，
用户点击注册按钮时跳转该链接。

### 阶段三：Featured 广告位（流量 > 10k/月后）
- 平台可付费获得首页推荐位
- 详情页"Recommended"标签

---

## SEO 策略

### 关键词方向
- `best gpt sites 2026`
- `freecash review`
- `sites like swagbucks`
- `get paid to sites [country]`
- `highest paying gpt sites`

### 技术 SEO
- Next.js SSG/ISR 静态生成
- 每个平台独立详情页（slug）
- sitemap.xml 自动生成
- 结构化数据（Schema.org Review）
- OG 图片自动生成

---

## 开发阶段与顺序

### Phase 1 — 基础设施（Week 1）
- [ ] Next.js 项目初始化
- [ ] PostgreSQL + Prisma 配置
- [ ] 数据库表创建（migration）
- [ ] 基础 API Routes 框架
- [ ] 部署到 Vercel + Railway

### Phase 2 — 爬虫系统（Week 2）
- [ ] Python 爬虫项目初始化
- [ ] 平台发现爬虫（gpthub.gg + reddit）
- [ ] Playwright 详情抓取
- [ ] Claude API 数据解析
- [ ] 爬虫任务队列消费
- [ ] 部署爬虫定时任务

### Phase 3 — 前端 MVP（Week 3）
- [ ] 首页
- [ ] 平台列表页（带筛选）
- [ ] 平台详情页
- [ ] 响应式移动端适配
- [ ] Google AdSense 接入

### Phase 4 — 管理后台（Week 4）
- [ ] 平台数据审核界面
- [ ] Affiliate 链接管理
- [ ] 爬虫任务监控
- [ ] 平台手动新增/编辑

### Phase 5 — SEO 优化（Week 5+）
- [ ] sitemap.xml
- [ ] 结构化数据
- [ ] Blog 模块
- [ ] 平台对比页

---

## 验收标准

### Phase 1 完成标志
- `npx prisma migrate dev` 无报错
- API `GET /api/platforms` 返回空数组（正常）
- Vercel 部署成功，页面可访问

### Phase 2 完成标志
- 发现爬虫运行后，crawl_jobs 有数据
- 详情爬虫运行后，platforms 表有 10+ 条记录
- 每条记录有 name / description / rating

### Phase 3 完成标志
- 首页可以展示平台列表
- 筛选功能正常工作
- 详情页可以独立访问，URL 格式 `/platforms/freecash`
- 移动端布局正常

### Phase 4 完成标志
- `/admin` 可以查看和编辑平台数据
- Affiliate 链接可以配置
- 点击注册按钮跳转正确的 Affiliate 链接
