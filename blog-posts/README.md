# Blog System - Markdown-Based

This directory contains all blog posts in Markdown format. The blog system automatically loads and renders these files.

## How to Add a New Blog Post

1. **Create a new markdown file** with the naming pattern: `YYYY-MM-DD-post-slug.md`
   - Example: `2024-12-20-new-paving-techniques.md`

2. **Add frontmatter** at the top of your markdown file:
   ```yaml
   ---
   title: "Your Blog Post Title"
   date: "2024-12-20"
   category: "Category Name"
   readTime: "5 min read"
   excerpt: "A brief description of the post that appears in previews"
   image: "/assets/images/blog/your-image.jpg"
   featured: false
   ---
   ```

3. **Write your content** in standard markdown below the frontmatter:
   ```markdown
   # Your Main Heading
   
   Your content here with **bold text**, *italic text*, and [links](http://example.com).
   
   ## Subheading
   
   - List item 1
   - List item 2
   - ✅ Checklist item
   
   ### Tables
   
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
   ```

4. **Update the blog posts index** in `/blog-posts.json`:
   ```json
   {
     "posts": [
       "2024-12-20-new-paving-techniques.md",
       "2024-12-15-asphalt-maintenance-guide.md",
       "2024-12-08-paving-material-selection.md",
       "2024-12-01-winter-paving-preparation.md"
     ]
   }
   ```

## Supported Markdown Features

- **Headers** (H1-H6): `# ## ### #### ##### ######`
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Code**: `` `inline code` ``
- **Lists**: `- item` or `* item` or `1. item`
- **Checkmarks**: `✅ item` (special styling)
- **Tables**: Standard markdown table syntax
- **Links**: `[text](url)`

## Categories

Use consistent categories to group related posts:
- `Maintenance`
- `Materials`
- `Seasonal`
- `Techniques`
- `Equipment`
- `Safety`

## Images

Place blog images in `/assets/images/blog/` and reference them in the frontmatter:
```yaml
image: "/assets/images/blog/your-post-image.jpg"
```

## Featured Posts

Set `featured: true` in the frontmatter to highlight posts on the homepage.

## The System

The blog system:
1. Fetches the list of posts from `blog-posts.json`
2. Loads each markdown file dynamically
3. Parses frontmatter and markdown content
4. Renders posts with proper styling
5. Supports both preview cards and full post views

No need to edit HTML files - just add markdown files and update the JSON index!
