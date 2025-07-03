/**
 * Blog Management System
 * Loads and displays blog posts from markdown files
 */

class BlogManager {
    constructor() {
        this.blogPosts = [];
        this.loadedPosts = new Map();
    }

    // Blog post data - in a real app this would come from a CMS or API
    getBlogPostsData() {
        return [
            {
                slug: 'asphalt-maintenance-guide',
                title: 'Understanding Asphalt Maintenance: A Complete Guide',
                date: '2024-12-15',
                category: 'Maintenance',
                readTime: '5 min read',
                excerpt: 'Learn how regular maintenance can extend the life of your pavement by 50% or more. Discover the key signs to watch for and timing for different maintenance services.',
                image: '/assets/images/blog/asphalt-maintenance-guide.jpg',
                featured: true
            },
            {
                slug: 'paving-material-selection',
                title: 'Choosing the Right Paving Solutions for Your Property',
                date: '2024-12-08',
                category: 'Materials',
                readTime: '7 min read',
                excerpt: 'Not all paving materials are created equal. Discover the best practices for selecting materials based on traffic load, climate, and budget considerations.',
                image: '/assets/images/blog/paving-material-selection.jpg',
                featured: false
            },
            {
                slug: 'winter-paving-preparation',
                title: 'Preparing Your Pavement for Winter Weather',
                date: '2024-12-01',
                category: 'Seasonal',
                readTime: '6 min read',
                excerpt: 'Ohio winters can be harsh on pavement. Learn essential preparation steps and protective measures to minimize winter damage and extend surface life.',
                image: '/assets/images/blog/winter-paving-preparation.jpg',
                featured: false
            }
        ];
    }

    // Format date for display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Get category color class
    getCategoryColor(category) {
        const colors = {
            'Maintenance': 'maintenance',
            'Materials': 'materials',
            'Seasonal': 'seasonal',
            'Tips': 'tips',
            'Commercial': 'commercial',
            'Residential': 'residential'
        };
        return colors[category] || 'default';
    }

    // Create blog post HTML
    createBlogPostHTML(post) {
        return `
            <div class="blog-post" data-aos="fade-up" data-aos-delay="100">
                <div class="blog-image">
                    <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.src='/assets/images/projects/maintenance-repair-1.jpg'">
                    <div class="blog-category ${this.getCategoryColor(post.category)}">${post.category}</div>
                </div>
                <div class="blog-content">
                    <h3>${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                        <span class="blog-readtime">${post.readTime}</span>
                    </div>
                    <a href="blog.html#${post.slug}" class="btn btn-secondary">Read More</a>
                </div>
            </div>
        `;
    }

    // Load and display blog posts
    async loadBlogPosts() {
        try {
            const container = document.getElementById('blog-posts-container');
            if (!container) {
                console.error('Blog posts container not found');
                return;
            }

            // Get blog posts data
            const posts = this.getBlogPostsData();
            
            // Sort posts by date (newest first)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Generate HTML for all posts
            const blogHTML = posts.map(post => this.createBlogPostHTML(post)).join('');
            
            // Insert into container
            container.innerHTML = blogHTML;

            // Store posts for later use
            this.blogPosts = posts;

            console.log('Blog posts loaded successfully:', posts.length);

            // Initialize any animations if AOS is available
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }

        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.showErrorState();
        }
    }

    // Show error state
    showErrorState() {
        const container = document.getElementById('blog-posts-container');
        if (container) {
            container.innerHTML = `
                <div class="blog-error" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p style="color: var(--road-gray); margin-bottom: 1rem;">Sorry, we're having trouble loading the latest blog posts.</p>
                    <a href="blog.html" class="btn btn-primary">View All Posts</a>
                </div>
            `;
        }
    }

    // Get recent posts for homepage (limit to 3)
    async loadRecentPosts(limit = 3) {
        const posts = this.getBlogPostsData();
        const recentPosts = posts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);

        const container = document.getElementById('blog-posts-container');
        if (!container) return;

        const blogHTML = recentPosts.map((post, index) => {
            const delay = (index + 1) * 100;
            return `
                <div class="blog-post" data-aos="fade-up" data-aos-delay="${delay}">
                    <div class="blog-image">
                        <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.src='/assets/images/projects/maintenance-repair-1.jpg'">
                        <div class="blog-category ${this.getCategoryColor(post.category)}">${post.category}</div>
                    </div>
                    <div class="blog-content">
                        <h3>${post.title}</h3>
                        <p class="blog-excerpt">${post.excerpt}</p>
                        <div class="blog-meta">
                            <span class="blog-date">${this.formatDate(post.date)}</span>
                            <span class="blog-readtime">${post.readTime}</span>
                        </div>
                        <a href="blog.html#${post.slug}" class="btn btn-secondary">Read More</a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = blogHTML;

        // Initialize animations
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }

        console.log('Recent blog posts loaded:', recentPosts.length);
    }

    // Initialize the blog manager
    init() {
        console.log('Initializing Blog Manager...');
        
        // Check if we're on the homepage or blog page
        const isHomepage = document.getElementById('blog-posts-container') && document.getElementById('hero');
        const isBlogPage = document.getElementById('blog-posts-container') && !document.getElementById('hero');

        if (isHomepage) {
            this.loadRecentPosts(3);
        } else if (isBlogPage) {
            this.loadBlogPosts();
        }
    }
}

// Export for use in main.js
export default BlogManager;
