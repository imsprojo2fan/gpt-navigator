-- CreateTable
CREATE TABLE "platforms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "website_url" VARCHAR(500) NOT NULL,
    "affiliate_url" VARCHAR(500),
    "min_cashout" VARCHAR(50),
    "rating" DECIMAL(2,1),
    "trustpilot_score" DECIMAL(2,1),
    "trustpilot_url" VARCHAR(500),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_crawled_at" TIMESTAMP(3),

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_features" (
    "id" SERIAL NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "task_types" TEXT[],
    "payment_methods" TEXT[],
    "regions" TEXT[],
    "has_mobile_app" BOOLEAN NOT NULL DEFAULT false,
    "is_beginner_friendly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "platform_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" SERIAL NOT NULL,
    "target_url" VARCHAR(500) NOT NULL,
    "source_site" VARCHAR(100),
    "job_type" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "raw_data" TEXT,
    "parsed_data" JSONB,
    "error_msg" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_logs" (
    "id" SERIAL NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" JSONB,
    "snapshot" JSONB,

    CONSTRAINT "crawl_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_slug_key" ON "platforms"("slug");

-- AddForeignKey
ALTER TABLE "platform_features" ADD CONSTRAINT "platform_features_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_logs" ADD CONSTRAINT "crawl_logs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
