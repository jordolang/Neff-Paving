// Simple Markdown Parser
class SimpleMarkdownParser {
    static parse(markdown) {
        let html = markdown;
        
        // Parse frontmatter
        const frontmatterMatch = html.match(/^---\n([\s\S]*?)\n---\n/);
        let frontmatter = {};
        
        if (frontmatterMatch) {
            const frontmatterText = frontmatterMatch[1];
            frontmatterText.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > -1) {
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();
                    
                    // Remove quotes and handle booleans
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    } else if (value === 'true') {
                        value = true;
                    } else if (value === 'false') {
                        value = false;
                    }
                    
                    frontmatter[key] = value;
                }
            });
            
            // Remove frontmatter from content
            html = html.replace(frontmatterMatch[0], '');
        }
        
        // Convert markdown to HTML
        html = this.convertMarkdownToHtml(html);
        
        return { frontmatter, content: html };
    }
    
    static convertMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks (simple)
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Lists
        html = html.replace(/^\s*\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\s*- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\s*\+ (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\s*✅ (.*$)/gim, '<li class="checkmark">✅ $1</li>');
        
        // Numbered lists
        html = html.replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>');
        
        // Wrap consecutive list items in ul/ol
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            return `<ul>${match}</ul>`;
        });
        
        // Tables
        html = this.convertTables(html);
        
        // Paragraphs (split by double newlines)
        const paragraphs = html.split('\n\n');
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<table')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');
        
        return html;
    }
    
    static convertTables(html) {
        // Simple table conversion
        const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g;
        
        return html.replace(tableRegex, (match, header, rows) => {
            const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
            const headerRow = `<tr>${headerCells.map(cell => `<th>${cell}</th>`).join('')}</tr>`;
            
            const bodyRows = rows.trim().split('\n').map(row => {
                const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            }).join('');
            
            return `<table class="blog-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
        });
    }
}

// Blog System
class BlogSystem {
    constructor() {
        this.posts = [];
        this.categories = new Set();
    }
    
    // Get list of available blog posts
    async getPostList() {
        try {
            const response = await fetch('/blog-posts.json');
            if (!response.ok) {
                throw new Error('Failed to fetch blog posts list');
            }
            const data = await response.json();
            return data.posts || [];
        } catch (error) {
            console.error('Error fetching post list:', error);
            // Fallback to hardcoded list
            return [
                '2024-12-15-asphalt-maintenance-guide.md',
                '2024-12-08-paving-material-selection.md',
                '2024-12-01-winter-paving-preparation.md'
            ];
        }
    }
    
    // Load a specific blog post
    async loadPost(filename) {
        try {
            const response = await fetch(`/blog-posts/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load post: ${filename}`);
            }
            
            const markdown = await response.text();
            const parsed = SimpleMarkdownParser.parse(markdown);
            
            return {
                slug: filename.replace('.md', ''),
                filename,
                ...parsed.frontmatter,
                content: parsed.content
            };
        } catch (error) {
            console.error('Error loading post:', error);
            return null;
        }
    }
    
    // Load all blog posts
    async loadAllPosts() {
        const postFiles = await this.getPostList();
        const posts = [];
        
        for (const filename of postFiles) {
            const post = await this.loadPost(filename);
            if (post) {
                posts.push(post);
                this.categories.add(post.category);
            }
        }
        
        // Sort by date (newest first)
        this.posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        return this.posts;
    }
    
    // Get featured posts
    getFeaturedPosts(limit = 3) {
        return this.posts.filter(post => post.featured).slice(0, limit);
    }
    
    // Get recent posts
    getRecentPosts(limit = 3) {
        return this.posts.slice(0, limit);
    }
    
    // Get posts by category
    getPostsByCategory(category) {
        return this.posts.filter(post => post.category === category);
    }
    
    // Find post by slug
    getPostBySlug(slug) {
        return this.posts.find(post => post.slug === slug);
    }
    
    // Render blog post preview card
    renderPostCard(post) {
        return `
            <div class="blog-post" data-aos="fade-up" data-aos-delay="100">
                <div class="blog-image">
                    <img src="${post.image}" alt="${post.title}" loading="lazy">
                    <div class="blog-category">${post.category}</div>
                </div>
                <div class="blog-content">
                    <h3>${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                        <span class="blog-readtime">${post.readTime}</span>
                    </div>
                    <a href="blog.html?post=${post.slug}" class="btn btn-secondary">Read More</a>
                </div>
            </div>
        `;
    }
    
    // Render full blog post
    renderFullPost(post) {
        return `
            <article class="blog-entry">
                <div class="blog-meta">
                    <span class="blog-date">${this.formatDate(post.date)}</span>
                    <span class="blog-category">${post.category}</span>
                    <span class="blog-readtime">${post.readTime}</span>
                </div>
                <h1>${post.title}</h1>
                <img src="${post.image}" alt="${post.title}" class="blog-featured-image">
                <div class="blog-content">
                    ${post.content}
                </div>
                <div class="blog-footer">
                    <a href="blog.html" class="btn btn-outline">← Back to Blog</a>
                    <a href="#contact" class="btn btn-primary">Get Quote</a>
                </div>
            </article>
        `;
    }
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Initialize blog system
    async init() {
        await this.loadAllPosts();
        console.log(`Blog system initialized with ${this.posts.length} posts`);
        return this;
    }
}

// Export for use in other modules
window.BlogSystem = BlogSystem;
window.SimpleMarkdownParser = SimpleMarkdownParser;
