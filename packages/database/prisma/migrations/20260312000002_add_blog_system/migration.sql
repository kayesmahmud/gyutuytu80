-- CreateTable
CREATE TABLE "blog_authors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_ne" VARCHAR(200),
    "slug" VARCHAR(200) NOT NULL,
    "avatar" VARCHAR(500),
    "bio" TEXT,
    "bio_ne" TEXT,
    "credentials" VARCHAR(500),
    "credentials_ne" VARCHAR(500),
    "expertise_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "social_links" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_ne" VARCHAR(200),
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "description_ne" TEXT,
    "parent_id" INTEGER,
    "display_order" INTEGER DEFAULT 999,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "marketplace_category_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_ne" VARCHAR(100),
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "title_ne" VARCHAR(500),
    "slug" VARCHAR(500) NOT NULL,
    "excerpt" VARCHAR(1000),
    "excerpt_ne" VARCHAR(1000),
    "content" TEXT NOT NULL,
    "content_ne" TEXT,
    "meta_description" VARCHAR(320),
    "meta_description_ne" VARCHAR(320),
    "featured_image" VARCHAR(500),
    "featured_image_alt" VARCHAR(300),
    "featured_image_alt_ne" VARCHAR(300),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "author_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "reading_time_min" INTEGER DEFAULT 5,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "linked_category_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_authors_slug_key" ON "blog_authors"("slug");
CREATE INDEX "idx_blog_authors_slug" ON "blog_authors"("slug");
CREATE INDEX "idx_blog_authors_active" ON "blog_authors"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");
CREATE INDEX "idx_blog_categories_slug" ON "blog_categories"("slug");
CREATE INDEX "idx_blog_categories_parent_id" ON "blog_categories"("parent_id");
CREATE INDEX "idx_blog_categories_marketplace" ON "blog_categories"("marketplace_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");
CREATE INDEX "idx_blog_tags_slug" ON "blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX "idx_blog_posts_slug" ON "blog_posts"("slug");
CREATE INDEX "idx_blog_posts_status_published" ON "blog_posts"("status", "published_at" DESC);
CREATE INDEX "idx_blog_posts_author" ON "blog_posts"("author_id");
CREATE INDEX "idx_blog_posts_category" ON "blog_posts"("category_id");
CREATE INDEX "idx_blog_posts_featured" ON "blog_posts"("is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_tags_post_id_tag_id_key" ON "blog_post_tags"("post_id", "tag_id");
CREATE INDEX "idx_blog_post_tags_post" ON "blog_post_tags"("post_id");
CREATE INDEX "idx_blog_post_tags_tag" ON "blog_post_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_marketplace_category_id_fkey" FOREIGN KEY ("marketplace_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "blog_authors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
