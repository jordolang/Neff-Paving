// Standalone blog page initialization
// This script is specifically for the blog.html page

// Import the blog system
import './blog-system.js'

class BlogPageApp {
    constructor() {
        this.init()
    }
    
    async init() {
        console.log('Blog page app initializing...')
        
        try {
            // Initialize blog system
            this.blogSystem = new BlogSystem()
            console.log('Blog system created, loading posts...')
            
            await this.blogSystem.init()
            console.log(`Blog system initialized with ${this.blogSystem.posts.length} posts`)
            
            // Handle blog page rendering
            this.renderBlogPage()
            
        } catch (error) {
            console.error('Error initializing blog page:', error)
            this.showError('Failed to load blog posts. Please try again later.')
        }
    }
    
    renderBlogPage() {
        const urlParams = new URLSearchParams(window.location.search)
        const postSlug = urlParams.get('post')
        
        const blogList = document.querySelector('.blog-list')
        if (!blogList) {
            console.error('Blog list container not found')
            return
        }
        
        if (postSlug) {
            // Show single post
            this.renderSinglePost(postSlug, blogList)
        } else {
            // Show all posts
            this.renderAllPosts(blogList)
        }
    }
    
    renderSinglePost(postSlug, container) {
        const post = this.blogSystem.getPostBySlug(postSlug)
        if (post) {
            container.innerHTML = this.blogSystem.renderFullPost(post)
            document.title = `${post.title} - Neff Paving Blog`
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-3xl);">
                    <h3>Post Not Found</h3>
                    <p>The blog post you're looking for doesn't exist.</p>
                    <a href="blog.html" class="btn btn-primary">← Back to Blog</a>
                </div>
            `
        }
    }
    
    renderAllPosts(container) {
        const allPosts = this.blogSystem.posts
        console.log(`Rendering ${allPosts.length} posts`)
        
        if (allPosts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-3xl);">
                    <h3>No Blog Posts Available</h3>
                    <p>Check back soon for new content!</p>
                </div>
            `
            return
        }
        
        container.innerHTML = ''
        
        allPosts.forEach((post, index) => {
            const postElement = document.createElement('div')
            postElement.innerHTML = this.blogSystem.renderPostCard(post)
            
            // Add some animation delay
            const card = postElement.firstElementChild
            if (card) {
                card.style.opacity = '0'
                card.style.transform = 'translateY(20px)'
                card.style.transition = 'all 0.5s ease'
                
                setTimeout(() => {
                    card.style.opacity = '1'
                    card.style.transform = 'translateY(0)'
                }, index * 100)
            }
            
            container.appendChild(postElement.firstElementChild)
        })
    }
    
    showError(message) {
        const blogList = document.querySelector('.blog-list')
        if (blogList) {
            blogList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-3xl); color: var(--error-red);">
                    <h3>Error Loading Blog</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="btn btn-outline">Try Again</button>
                </div>
            `
        }
    }
}

// Initialize only if we're on the blog page
if (window.location.pathname.includes('blog.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, starting blog page app...')
        new BlogPageApp()
    })
}
