# CMS API Endpoints

This directory contains the Content Management System (CMS) API endpoints for the Neff Paving website. These endpoints provide full CRUD operations for managing blog posts, media files, page content sections, and SEO metadata.

## Overview

The CMS API is built with Express.js and PostgreSQL, providing RESTful endpoints for content management operations. All endpoints are prefixed with `/api/cms/`.

## Database Schema

The CMS uses the following database tables (defined in `/database/cms_schema.sql`):
- `blog_posts` - Blog post content and metadata
- `media_files` - Uploaded media files and metadata
- `cms_pages` - Page content sections for dynamic page building
- `seo_metadata` - SEO metadata for different page types
- `content_categories` - Categories and tags with hierarchical support

## API Endpoints

### Blog Management (`/api/cms/posts`)

#### GET `/api/cms/posts` - List all posts with pagination
**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `status` (string) - Filter by status: `draft`, `published`, `archived`
- `author` (string) - Filter by author name

**Response:**
```json
{
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 10
  }
}
```

#### GET `/api/cms/posts/:id` - Get single post
**Response:**
```json
{
  "post": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-title",
    "content": "Post content...",
    "excerpt": "Post excerpt...",
    "author": "Author Name",
    "status": "published",
    "featured_image": "/uploads/image.jpg",
    "seo_metadata": {...},
    "categories": ["uuid1", "uuid2"],
    "tags": ["uuid3", "uuid4"],
    "published_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/cms/posts` - Create new post
**Request Body:**
```json
{
  "title": "Post Title",
  "slug": "post-title",
  "content": "Post content...",
  "excerpt": "Post excerpt...",
  "author": "Author Name",
  "status": "draft",
  "featured_image": "/uploads/image.jpg",
  "seo_metadata": {...},
  "categories": ["uuid1", "uuid2"],
  "tags": ["uuid3", "uuid4"]
}
```

#### PUT `/api/cms/posts/:id` - Update post
**Request Body:** Same as POST, all fields optional

#### DELETE `/api/cms/posts/:id` - Delete post

#### POST `/api/cms/posts/:id/publish` - Publish/unpublish post
**Request Body:**
```json
{
  "action": "publish" // or "unpublish"
}
```

### Media Management (`/api/cms/media`)

#### GET `/api/cms/media` - List media files
**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `folder` (string) - Filter by folder
- `mime_type` (string) - Filter by MIME type prefix (e.g., "image/")
- `search` (string) - Search in filename, alt text, or description

#### POST `/api/cms/media/upload` - Upload files with multer
**Content-Type:** `multipart/form-data`
**Form Fields:**
- `files` (file[]) - Array of files to upload (max 10 files, 10MB each)
- `folder` (string) - Target folder (default: "uploads")
- `alt_text` (string) - Alt text for accessibility
- `description` (string) - File description

**Supported file types:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Documents: PDF, TXT, DOC, DOCX

#### DELETE `/api/cms/media/:id` - Delete media file

#### PUT `/api/cms/media/:id` - Update media metadata
**Request Body:**
```json
{
  "alt_text": "Updated alt text",
  "description": "Updated description",
  "folder": "new-folder"
}
```

### Content Sections (`/api/cms/pages`)

#### GET `/api/cms/pages/:slug/sections` - Get page sections
**Query Parameters:**
- `section` (string) - Filter by specific section name

**Response:**
```json
{
  "page_slug": "homepage",
  "sections": {
    "hero": {
      "id": "uuid",
      "content": "Hero section content...",
      "metadata": {...},
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "about": {
      "id": "uuid",
      "content": "About section content...",
      "metadata": {...},
      "updated_at": "2024-01-01T00:00:00Z"
    }
  },
  "total_sections": 2,
  "last_updated": 1704067200000
}
```

#### PUT `/api/cms/pages/:slug/sections/:section` - Update section content
**Request Body:**
```json
{
  "content": "Updated section content...",
  "metadata": {
    "background_color": "#ffffff",
    "layout": "two-column"
  }
}
```

#### GET `/api/cms/pages` - List all pages with their sections

#### DELETE `/api/cms/pages/:slug/sections/:section` - Delete a section

#### POST `/api/cms/pages/:slug/sections` - Create a new section
**Request Body:**
```json
{
  "section_name": "new-section",
  "content": "Section content...",
  "metadata": {...}
}
```

#### PUT `/api/cms/pages/:slug/sections` - Bulk update multiple sections
**Request Body:**
```json
{
  "sections": {
    "hero": {
      "content": "Updated hero content...",
      "metadata": {...}
    },
    "about": {
      "content": "Updated about content...",
      "metadata": {...}
    }
  }
}
```

### SEO Management (`/api/cms/seo`)

#### GET `/api/cms/seo/:page` - Get SEO metadata
**Query Parameters:**
- `page_type` (string) - Type: `cms_page`, `blog_post`, `category` (default: `cms_page`)
- `page_id` (string) - Specific page ID

**Response:**
```json
{
  "seo": {
    "id": "uuid",
    "page_type": "cms_page",
    "page_id": "uuid",
    "title": "SEO Title",
    "description": "SEO description...",
    "keywords": ["keyword1", "keyword2"],
    "og_data": {
      "title": "Open Graph Title",
      "description": "OG description...",
      "image": "/uploads/og-image.jpg"
    },
    "twitter_data": {
      "card": "summary_large_image",
      "title": "Twitter Title"
    },
    "schema_markup": {...},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "page_info": {
    "page_title": "Page Title",
    "page_slug": "page-slug"
  }
}
```

#### PUT `/api/cms/seo/:page` - Update SEO metadata
**Request Body:**
```json
{
  "page_type": "cms_page",
  "page_id": "uuid",
  "title": "SEO Title",
  "description": "SEO description...",
  "keywords": ["keyword1", "keyword2"],
  "og_data": {
    "title": "Open Graph Title",
    "description": "OG description...",
    "image": "/uploads/og-image.jpg"
  },
  "twitter_data": {
    "card": "summary_large_image",
    "title": "Twitter Title"
  },
  "schema_markup": {...}
}
```

#### DELETE `/api/cms/seo/:page` - Delete SEO metadata

#### GET `/api/cms/seo` - List all SEO metadata with pagination

#### POST `/api/cms/seo` - Create new SEO metadata

## Utility Endpoints

### GET `/api/cms/status` - CMS system status
Returns operational status and available endpoints.

### GET `/api/cms/health` - CMS health check
Returns database connectivity and system health status.

## Authentication & Security

All CMS endpoints should be protected with appropriate authentication middleware in production. The current implementation focuses on functionality and should be secured before deployment.

## Error Handling

All endpoints return standardized error responses:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `500` - Internal Server Error

## File Uploads

Media uploads are handled with Multer and stored in the `/public/uploads/` directory. Files are organized by folders and include security validations for file types and sizes.

## Database Connection

All endpoints use a PostgreSQL connection pool with the following configuration:
- Host: `process.env.DB_HOST` (default: 'localhost')
- Port: `process.env.DB_PORT` (default: 5432)
- Database: `process.env.DB_NAME` (default: 'neff_paving_admin')
- User: `process.env.DB_USER` (default: 'postgres')
- Password: `process.env.DB_PASSWORD` (default: 'password')

## Examples

### Creating a Blog Post
```bash
curl -X POST http://localhost:8001/api/cms/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "content": "This is the content of my first blog post...",
    "author": "John Doe",
    "status": "published"
  }'
```

### Uploading Media Files
```bash
curl -X POST http://localhost:8001/api/cms/media/upload \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "folder=blog-images" \
  -F "alt_text=Blog post images"
```

### Updating Page Content
```bash
curl -X PUT http://localhost:8001/api/cms/pages/homepage/sections/hero \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<h1>Welcome to Neff Paving</h1><p>Your trusted paving partner...</p>",
    "metadata": {
      "background_image": "/uploads/hero-bg.jpg",
      "text_color": "#ffffff"
    }
  }'
```
