-- CMS Schema Migration Script
-- Creates tables for blog posts, pages, media files, SEO metadata, and content categories
-- Author: Generated for Neff Paving CMS
-- Date: 2024

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: content_categories
-- Store categories and tags with hierarchical support
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT 'category', -- 'category' or 'tag'
    parent_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: blog_posts
-- Store blog posts with comprehensive metadata
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    featured_image VARCHAR(500),
    seo_metadata JSONB,
    categories UUID[] DEFAULT '{}', -- Array of category IDs
    tags UUID[] DEFAULT '{}', -- Array of tag IDs
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: cms_pages
-- Store page content sections for dynamic page building
CREATE TABLE IF NOT EXISTS cms_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_slug VARCHAR(255) NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_slug, section_name)
);

-- Table: media_files
-- Store uploaded media files with metadata
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text TEXT,
    description TEXT,
    folder VARCHAR(255) DEFAULT 'uploads',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: seo_metadata
-- Store SEO data for different page types
CREATE TABLE IF NOT EXISTS seo_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_type VARCHAR(50) NOT NULL, -- 'blog_post', 'cms_page', 'category', etc.
    page_id UUID NOT NULL,
    title VARCHAR(255),
    description TEXT,
    keywords TEXT[],
    og_data JSONB, -- Open Graph data
    twitter_data JSONB, -- Twitter Card data
    schema_markup JSONB, -- Structured data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_type, page_id)
);

-- Performance Indexes
-- Index on blog_posts for efficient querying by slug, status, and published_at
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_status_published 
ON blog_posts(slug, status, published_at);

-- Additional indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author);

-- Index on media_files for efficient querying by folder and mime_type
CREATE INDEX IF NOT EXISTS idx_media_files_folder_mime 
ON media_files(folder, mime_type);

-- Additional indexes for media_files
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_at ON media_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);

-- Index on seo_metadata for efficient querying by page_type and page_id
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_type_id 
ON seo_metadata(page_type, page_id);

-- Additional indexes for content_categories
CREATE INDEX IF NOT EXISTS idx_content_categories_type ON content_categories(type);
CREATE INDEX IF NOT EXISTS idx_content_categories_parent_id ON content_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON content_categories(slug);

-- Additional indexes for cms_pages
CREATE INDEX IF NOT EXISTS idx_cms_pages_page_slug ON cms_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_section_name ON cms_pages(section_name);

-- GIN indexes for JSONB columns for efficient JSON querying
CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_metadata_gin 
ON blog_posts USING GIN (seo_metadata);

CREATE INDEX IF NOT EXISTS idx_cms_pages_metadata_gin 
ON cms_pages USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_og_data_gin 
ON seo_metadata USING GIN (og_data);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_twitter_data_gin 
ON seo_metadata USING GIN (twitter_data);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_schema_markup_gin 
ON seo_metadata USING GIN (schema_markup);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_blog_posts_categories_gin 
ON blog_posts USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin 
ON blog_posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_keywords_gin 
ON seo_metadata USING GIN (keywords);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_pages_updated_at 
    BEFORE UPDATE ON cms_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_categories_updated_at 
    BEFORE UPDATE ON content_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_metadata_updated_at 
    BEFORE UPDATE ON seo_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE blog_posts IS 'Store blog posts with comprehensive metadata and SEO fields';
COMMENT ON TABLE cms_pages IS 'Store page content sections for dynamic page building';
COMMENT ON TABLE media_files IS 'Store uploaded media files with metadata and organization';
COMMENT ON TABLE seo_metadata IS 'Store SEO data for different page types';
COMMENT ON TABLE content_categories IS 'Store categories and tags with hierarchical support';

-- Column comments for better documentation
COMMENT ON COLUMN blog_posts.status IS 'Post status: draft, published, archived';
COMMENT ON COLUMN blog_posts.categories IS 'Array of category UUIDs';
COMMENT ON COLUMN blog_posts.tags IS 'Array of tag UUIDs';
COMMENT ON COLUMN content_categories.type IS 'Type: category or tag';
COMMENT ON COLUMN seo_metadata.page_type IS 'Type of page: blog_post, cms_page, category, etc.';
COMMENT ON COLUMN seo_metadata.og_data IS 'Open Graph metadata as JSON';
COMMENT ON COLUMN seo_metadata.twitter_data IS 'Twitter Card metadata as JSON';
COMMENT ON COLUMN seo_metadata.schema_markup IS 'Structured data markup as JSON';

-- Insert some initial data for content_categories
INSERT INTO content_categories (name, slug, type) VALUES 
    ('General', 'general', 'category'),
    ('News', 'news', 'category'),
    ('Services', 'services', 'category'),
    ('Projects', 'projects', 'category'),
    ('Featured', 'featured', 'tag'),
    ('Important', 'important', 'tag')
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'CMS Schema migration completed successfully!';
END $$;
