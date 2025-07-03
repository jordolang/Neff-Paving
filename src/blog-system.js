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
    
    // Get hardcoded blog post data (simpler than fetching markdown files)
    getBlogPostsData() {
        return [
            {
                slug: 'how-to-create-a-blog-post',
                filename: '2025-07-03-how-to-create-a-blog-post.md',
                title: 'How to Create a Blog Post for Neff Paving',
                date: '2025-07-03',
                category: 'Guide',
                readTime: '4 min read',
                excerpt: 'Learn how to create effective blog posts for Neff Paving, complete with structure, images, and metadata.',
                image: '/assets/images/blog/guideline-image.jpg',
                featured: true,
                content: `
                    <h1>How to Create a Blog Post for Neff Paving</h1>
                    <p>Creating a blog post for Neff Paving is simple if you follow these guidelines. Here is a step-by-step guide to help you format your posts properly.</p>
                    <h2>Frontmatter</h2>
                    <p>Each blog post must start with a section of metadata at the top of the file. This section, known as frontmatter, should be enclosed by <code>---</code> and include key information like title, date, category, and other attributes.</p>
                    <h2>Content</h2>
                    <p>The content of your post is written in Markdown format. It can include headers, lists, links, and images.</p>
                    <h3>Headers</h3>
                    <p>Use <code>#</code> for main titles, <code>##</code> for subtitles, and so on.</p>
                    <h3>Lists</h3>
                    <p>Use <code>-</code> or <code>*</code> for lists, and <code>1.</code>, <code>2.</code>, <code>3.</code> for numbered lists.</p>
                    <h3>Images</h3>
                    <p>Include images by specifying their path relative to the assets folder.</p>
                    <h2>Final Tips</h2>
                    <ul>
                        <li>Ensure all images are optimized and in <code>/assets/images/blog/</code></li>
                        <li>Preview your post in the development environment to catch any formatting issues</li>
                    </ul>
                    <p>With these guidelines, you can create engaging and properly formatted blog posts for Neff Paving.</p>
                `
            },
            {
                slug: 'asphalt-maintenance-guide',
                filename: '2024-12-15-asphalt-maintenance-guide.md',
                title: 'Understanding Asphalt Maintenance: A Complete Guide',
                date: '2024-12-15',
                category: 'Maintenance',
                readTime: '5 min read',
                excerpt: 'Learn how regular maintenance can extend the life of your pavement by 50% or more. Discover the key signs to watch for and timing for different maintenance services.',
                image: '/assets/images/blog/asphalt-maintenance-guide.jpg',
                featured: true,
                content: `
                    <h1>Understanding Asphalt Maintenance: A Complete Guide</h1>
                    <p>Regular maintenance is the key to extending your pavement's lifespan by 50% or more. Most property owners don't realize that simple preventive measures can save thousands of dollars in reconstruction costs.</p>
                    <h2>Key Signs Your Pavement Needs Attention</h2>
                    <ul>
                        <li><strong>Small cracks (less than 1/4 inch):</strong> Perfect for crack sealing</li>
                        <li><strong>Fading color:</strong> Indicates it's time for seal coating</li>
                        <li><strong>Rough texture:</strong> May need resurfacing</li>
                        <li><strong>Standing water:</strong> Drainage issues require immediate attention</li>
                    </ul>
                    <h2>Maintenance Timeline</h2>
                    <p><strong>Year 1-3:</strong> Monitor and perform minor crack sealing as needed.</p>
                    <p><strong>Year 3-5:</strong> Apply seal coat to protect surface and restore appearance.</p>
                    <p><strong>Year 5-10:</strong> Consider resurfacing if significant wear is present.</p>
                    <p><strong>Year 10+:</strong> Evaluate for reconstruction vs. continued maintenance.</p>
                    <p><em>Need professional maintenance advice? Contact Neff Paving for a free assessment of your property's needs.</em></p>
                `
            },
            {
                slug: 'paving-material-selection',
                filename: '2024-12-08-paving-material-selection.md',
                title: 'Choosing the Right Paving Solutions for Your Property',
                date: '2024-12-08',
                category: 'Materials',
                readTime: '7 min read',
                excerpt: 'Not all paving materials are created equal. Discover the best practices for selecting materials based on traffic load, climate, and budget considerations.',
                image: '/assets/images/blog/paving-material-selection.jpg',
                featured: false,
                content: `
                    <h1>Choosing the Right Paving Solutions for Your Property</h1>
                    <p>Not all paving materials are created equal. The right choice depends on traffic load, climate conditions, budget, and aesthetic preferences. Here's your complete guide to making the best decision.</p>
                    <h2>Asphalt: The Versatile Choice</h2>
                    <p><strong>Best for:</strong> Driveways, parking lots, and roads</p>
                    <p><strong>Pros:</strong> Cost-effective, quick installation, easy to repair, good for Ohio's freeze-thaw cycles</p>
                    <p><strong>Cons:</strong> Requires regular maintenance, can soften in extreme heat</p>
                    <p><strong>Lifespan:</strong> 15-20 years with proper maintenance</p>
                    <h2>Concrete: The Durable Option</h2>
                    <p><strong>Best for:</strong> High-traffic areas, decorative applications</p>
                    <p><strong>Pros:</strong> Very durable, low maintenance, can be decoratively stamped</p>
                    <p><strong>Cons:</strong> Higher upfront cost, can crack in freeze-thaw cycles</p>
                    <p><strong>Lifespan:</strong> 25-30 years</p>
                    <p><em>Unsure which material is right for your project? Our experts can evaluate your specific needs and recommend the best solution.</em></p>
                `
            },
            {
                slug: 'winter-paving-preparation',
                filename: '2024-12-01-winter-paving-preparation.md',
                title: 'Preparing Your Pavement for Winter Weather',
                date: '2024-12-01',
                category: 'Seasonal',
                readTime: '6 min read',
                excerpt: 'Ohio winters can be harsh on pavement. Learn essential preparation steps and protective measures to minimize winter damage and extend surface life.',
                image: '/assets/images/blog/winter-paving-preparation.jpg',
                featured: false,
                content: `
                    <h1>Preparing Your Pavement for Winter Weather</h1>
                    <p>Ohio winters can be brutal on pavement. Freeze-thaw cycles, snow plowing, and de-icing chemicals all take their toll. Proper preparation can prevent costly spring repairs.</p>
                    <h2>Pre-Winter Inspection Checklist</h2>
                    <ul>
                        <li>✅ Seal all cracks larger than 1/8 inch</li>
                        <li>✅ Ensure proper drainage to prevent ice formation</li>
                        <li>✅ Check and repair any potholes</li>
                        <li>✅ Apply seal coat if it's been more than 3 years</li>
                        <li>✅ Clear debris from drainage systems</li>
                    </ul>
                    <h2>Snow Removal Best Practices</h2>
                    <p><strong>Use the Right Equipment:</strong> Rubber-edged plows prevent surface damage. Metal edges should only be used on heavily deteriorated surfaces.</p>
                    <p><strong>Plow Early and Often:</strong> Remove snow before it becomes compacted. Multiple light passes are better than one heavy push.</p>
                    <p><strong>Avoid Over-Salting:</strong> Excessive salt can damage both asphalt and concrete. Use sand for traction when temperatures are extremely low.</p>
                    <p><em>Don't wait until spring to address winter damage. Contact us for emergency repairs and spring maintenance planning.</em></p>
                `
            }
        ];
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
            
            // Create slug from filename
            const slug = filename.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
            
            return {
                slug: slug,
                filename,
                ...parsed.frontmatter,
                content: parsed.content
            };
        } catch (error) {
            console.error('Error loading post:', error);
            return null;
        }
    }
    
    // Get list of available blog posts
    async getPostList() {
        // Return hardcoded list of blog post files
        return [
            '2025-07-03-how-to-create-a-blog-post.md',
            '2024-12-15-asphalt-maintenance-guide.md',
            '2024-12-08-paving-material-selection.md',
            '2024-12-01-winter-paving-preparation.md'
        ];
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
        if (posts.length > 0) {
            this.posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
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
        // Use hardcoded data for now but load from markdown files
        const hardcodedPosts = this.getBlogPostsData();
        this.posts = hardcodedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Also try to load from markdown files
        try {
            await this.loadAllPosts();
        } catch (error) {
            console.log('Using hardcoded blog data as fallback');
            // If markdown loading fails, keep the hardcoded data
        }
        
        console.log(`Blog system initialized with ${this.posts.length} posts`);
        return this;
    }
}

// Export for use in other modules
window.BlogSystem = BlogSystem;
window.SimpleMarkdownParser = SimpleMarkdownParser;
