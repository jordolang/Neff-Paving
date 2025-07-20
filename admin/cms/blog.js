/**
 * Blog Management Interface for Neff Paving CMS
 * Features: DataTable integration, Quill.js rich text editor, featured image upload with preview,
 * categories and tags management, SEO metadata form fields, post preview modal, publish/schedule controls
 */

class BlogManager {
    constructor(adminDashboard) {
        this.adminDashboard = adminDashboard;
        this.apiBase = adminDashboard.apiBase;
        this.token = adminDashboard.token;
        
        // Initialize components
        this.quillEditor = null;
        this.postsDataTable = null;
        this.categoriesDataTable = null;
        this.currentPost = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('Initializing Blog Manager...');
        
        // Load required libraries
        await this.loadDependencies();
        
        // Initialize components
        this.initializeQuillEditor();
        this.initializeDataTables();
        this.setupEventListeners();
        this.initializeFeaturedImageUpload();
        this.initializeTagManager();
        this.initializeScheduler();
        
        console.log('Blog Manager initialized successfully');
    }

    async loadDependencies() {
        // Load Quill.js CSS and JS
        if (!document.querySelector('link[href*="quill"]')) {
            const quillCSS = document.createElement('link');
            quillCSS.rel = 'stylesheet';
            quillCSS.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
            document.head.appendChild(quillCSS);
        }

        if (!window.Quill) {
            await this.loadScript('https://cdn.quilljs.com/1.3.7/quill.min.js');
        }

        // Load DataTables CSS and JS if not already loaded
        if (!window.jQuery) {
            await this.loadScript('https://code.jquery.com/jquery-3.7.1.min.js');
        }

        if (!document.querySelector('link[href*="datatables"]')) {
            const dtCSS = document.createElement('link');
            dtCSS.rel = 'stylesheet';
            dtCSS.href = 'https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css';
            document.head.appendChild(dtCSS);
        }

        if (!$.fn.DataTable) {
            await this.loadScript('https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js');
            await this.loadScript('https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js');
        }

        // Load Tagify for tags management
        if (!document.querySelector('link[href*="tagify"]')) {
            const tagifyCSS = document.createElement('link');
            tagifyCSS.rel = 'stylesheet';
            tagifyCSS.href = 'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css';
            document.head.appendChild(tagifyCSS);
        }

        if (!window.Tagify) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.min.js');
        }

        // Load Flatpickr for date/time scheduling
        if (!document.querySelector('link[href*="flatpickr"]')) {
            const flatpickrCSS = document.createElement('link');
            flatpickrCSS.rel = 'stylesheet';
            flatpickrCSS.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
            document.head.appendChild(flatpickrCSS);
        }

        if (!window.flatpickr) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/flatpickr');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeQuillEditor() {
        // Add Quill editor container to the existing blog add new section
        const contentTextarea = document.getElementById('post-content');
        if (contentTextarea && !this.quillEditor) {
            // Create Quill container
            const quillContainer = document.createElement('div');
            quillContainer.id = 'quill-editor';
            quillContainer.style.height = '300px';
            quillContainer.style.marginBottom = '20px';
            
            // Replace textarea with Quill editor
            contentTextarea.style.display = 'none';
            contentTextarea.parentNode.insertBefore(quillContainer, contentTextarea);

            // Initialize Quill with advanced toolbar
            this.quillEditor = new Quill('#quill-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['blockquote', 'code-block'],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                },
                placeholder: 'Write your blog post content here...'
            });

            // Sync Quill content with hidden textarea
            this.quillEditor.on('text-change', () => {
                contentTextarea.value = this.quillEditor.root.innerHTML;
            });
        }
    }

    initializeDataTables() {
        // Initialize Blog Posts DataTable
        setTimeout(() => {
            if ($.fn.DataTable && document.getElementById('blog-posts-table')) {
                this.postsDataTable = $('#blog-posts-table').closest('table').DataTable({
                    responsive: true,
                    pageLength: 10,
                    order: [[4, 'desc']], // Order by date descending
                    columns: [
                        { title: 'Title', width: '25%' },
                        { title: 'Author', width: '15%' },
                        { title: 'Category', width: '15%' },
                        { title: 'Status', width: '10%' },
                        { title: 'Date', width: '15%' },
                        { title: 'Actions', width: '20%', orderable: false }
                    ],
                    language: {
                        emptyTable: "No blog posts found",
                        loadingRecords: "Loading posts..."
                    }
                });

                // Load posts data
                this.loadBlogPosts();
            }

            // Initialize Categories DataTable
            if ($.fn.DataTable && document.getElementById('categories-table')) {
                this.categoriesDataTable = $('#categories-table').closest('table').DataTable({
                    responsive: true,
                    pageLength: 10,
                    columns: [
                        { title: 'Name', width: '20%' },
                        { title: 'Slug', width: '20%' },
                        { title: 'Description', width: '30%' },
                        { title: 'Posts Count', width: '15%' },
                        { title: 'Actions', width: '15%', orderable: false }
                    ]
                });

                // Load categories data
                this.loadCategories();
            }
        }, 1000);
    }

    setupEventListeners() {
        // Blog post form submission
        const blogForm = document.getElementById('blog-post-form');
        if (blogForm) {
            blogForm.addEventListener('submit', (e) => this.handlePostSubmission(e));
        }

        // Save as draft button
        this.addSaveAsDraftButton();
        
        // Schedule post button
        this.addSchedulePostButton();

        // Preview post button
        this.addPreviewButton();

        // Category form modal if exists
        this.setupCategoryModal();

        // SEO form expansion
        this.setupSEOForm();
    }

    addSaveAsDraftButton() {
        const form = document.getElementById('blog-post-form');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                // Create draft button
                const draftBtn = document.createElement('button');
                draftBtn.type = 'button';
                draftBtn.className = 'btn btn-outline-secondary me-2';
                draftBtn.innerHTML = '💾 Save as Draft';
                draftBtn.onclick = () => this.saveAsDraft();

                submitBtn.parentNode.insertBefore(draftBtn, submitBtn);
            }
        }
    }

    addSchedulePostButton() {
        const form = document.getElementById('blog-post-form');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                // Create schedule button
                const scheduleBtn = document.createElement('button');
                scheduleBtn.type = 'button';
                scheduleBtn.className = 'btn btn-info me-2';
                scheduleBtn.innerHTML = '📅 Schedule Post';
                scheduleBtn.onclick = () => this.showScheduleModal();

                submitBtn.parentNode.insertBefore(scheduleBtn, submitBtn);
            }
        }
    }

    addPreviewButton() {
        const form = document.getElementById('blog-post-form');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                // Create preview button
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn btn-outline-info me-2';
                previewBtn.innerHTML = '👁️ Preview';
                previewBtn.onclick = () => this.showPreviewModal();

                submitBtn.parentNode.insertBefore(previewBtn, submitBtn);
            }
        }
    }

    initializeFeaturedImageUpload() {
        const imageInput = document.getElementById('post-image');
        if (imageInput) {
            // Create image preview container
            const previewContainer = document.createElement('div');
            previewContainer.id = 'image-preview-container';
            previewContainer.innerHTML = `
                <div id="image-preview" style="display: none; margin-top: 10px;">
                    <img id="preview-img" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
                    <div class="mt-2">
                        <button type="button" class="btn btn-sm btn-danger" onclick="blogManager.removeFeaturedImage()">
                            🗑️ Remove Image
                        </button>
                    </div>
                </div>
            `;
            imageInput.parentNode.appendChild(previewContainer);

            // Handle file selection
            imageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('image-preview');
                const img = document.getElementById('preview-img');
                
                img.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    removeFeaturedImage() {
        document.getElementById('post-image').value = '';
        document.getElementById('image-preview').style.display = 'none';
    }

    initializeTagManager() {
        // Add tags input field to the blog form
        const categorySelect = document.getElementById('post-category');
        if (categorySelect) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'mb-3';
            tagsContainer.innerHTML = `
                <label for="post-tags" class="form-label">Tags</label>
                <input type="text" id="post-tags" name="tags" class="form-control" placeholder="Add tags...">
            `;
            categorySelect.parentNode.parentNode.insertBefore(tagsContainer, categorySelect.parentNode.nextSibling);

            // Initialize Tagify
            setTimeout(() => {
                if (window.Tagify) {
                    const tagsInput = document.getElementById('post-tags');
                    this.tagify = new Tagify(tagsInput, {
                        whitelist: ['paving', 'asphalt', 'concrete', 'driveway', 'maintenance', 'repair', 'commercial', 'residential'],
                        maxTags: 10,
                        dropdown: {
                            maxItems: 20,
                            classname: "tags-look",
                            enabled: 0,
                            closeOnSelect: false
                        }
                    });
                }
            }, 500);
        }
    }

    initializeScheduler() {
        // Add schedule datetime input
        const statusSelect = document.getElementById('post-status');
        if (statusSelect) {
            const scheduleContainer = document.createElement('div');
            scheduleContainer.className = 'mb-3';
            scheduleContainer.id = 'schedule-container';
            scheduleContainer.style.display = 'none';
            scheduleContainer.innerHTML = `
                <label for="schedule-datetime" class="form-label">Schedule Publication</label>
                <input type="text" id="schedule-datetime" class="form-control" placeholder="Select date and time">
            `;
            statusSelect.parentNode.parentNode.insertBefore(scheduleContainer, statusSelect.parentNode.nextSibling);

            // Initialize Flatpickr
            setTimeout(() => {
                if (window.flatpickr) {
                    flatpickr("#schedule-datetime", {
                        enableTime: true,
                        dateFormat: "Y-m-d H:i",
                        minDate: "today",
                        time_24hr: true
                    });
                }
            }, 500);

            // Show/hide schedule input based on status
            statusSelect.addEventListener('change', (e) => {
                const scheduleContainer = document.getElementById('schedule-container');
                if (e.target.value === 'scheduled') {
                    scheduleContainer.style.display = 'block';
                } else {
                    scheduleContainer.style.display = 'none';
                }
            });
        }
    }

    setupSEOForm() {
        // Add SEO fields to the blog form
        const imageInput = document.getElementById('post-image');
        if (imageInput) {
            const seoContainer = document.createElement('div');
            seoContainer.className = 'mb-3';
            seoContainer.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">SEO Settings</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="seo-title" class="form-label">SEO Title</label>
                            <input type="text" id="seo-title" class="form-control" maxlength="60" placeholder="Optimized title for search engines">
                            <small class="form-text text-muted">Recommended: 50-60 characters</small>
                        </div>
                        <div class="mb-3">
                            <label for="seo-description" class="form-label">Meta Description</label>
                            <textarea id="seo-description" class="form-control" rows="3" maxlength="160" placeholder="Brief description for search results"></textarea>
                            <small class="form-text text-muted">Recommended: 150-160 characters</small>
                        </div>
                        <div class="mb-3">
                            <label for="seo-keywords" class="form-label">Focus Keywords</label>
                            <input type="text" id="seo-keywords" class="form-control" placeholder="main keyword, secondary keyword">
                        </div>
                        <div class="mb-3">
                            <label for="post-slug" class="form-label">URL Slug</label>
                            <input type="text" id="post-slug" class="form-control" placeholder="url-friendly-post-title">
                            <small class="form-text text-muted">Leave blank to auto-generate from title</small>
                        </div>
                    </div>
                </div>
            `;
            
            imageInput.parentNode.parentNode.appendChild(seoContainer);

            // Auto-generate slug from title
            const titleInput = document.getElementById('post-title');
            const slugInput = document.getElementById('post-slug');
            
            if (titleInput && slugInput) {
                titleInput.addEventListener('input', (e) => {
                    if (!slugInput.value) {
                        slugInput.value = this.generateSlug(e.target.value);
                    }
                });
            }
        }
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    setupCategoryModal() {
        // Create category modal if it doesn't exist
        if (!document.getElementById('add-category-modal')) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'add-category-modal';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Category</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="category-form">
                                <div class="mb-3">
                                    <label for="category-name" class="form-label">Name</label>
                                    <input type="text" id="category-name" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label for="category-slug" class="form-label">Slug</label>
                                    <input type="text" id="category-slug" class="form-control">
                                </div>
                                <div class="mb-3">
                                    <label for="category-description" class="form-label">Description</label>
                                    <textarea id="category-description" class="form-control" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="blogManager.saveCategory()">Save Category</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Auto-generate category slug
            document.getElementById('category-name').addEventListener('input', (e) => {
                const slugInput = document.getElementById('category-slug');
                if (!slugInput.value) {
                    slugInput.value = this.generateSlug(e.target.value);
                }
            });
        }
    }

    async handlePostSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const postData = this.gatherPostData();
        
        // Add text data
        Object.keys(postData).forEach(key => {
            if (key !== 'image') {
                formData.append(key, postData[key]);
            }
        });

        // Add image file if exists
        const imageFile = document.getElementById('post-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`${this.apiBase}/cms/blog/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Post saved successfully!', 'success');
                this.resetForm();
                this.loadBlogPosts();
                
                // Navigate back to posts list
                this.adminDashboard.showSection('blog-all-posts');
            } else {
                this.showNotification('Error saving post: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            this.showNotification('Error saving post. Please try again.', 'error');
        }
    }

    gatherPostData() {
        return {
            title: document.getElementById('post-title').value,
            content: this.quillEditor ? this.quillEditor.root.innerHTML : document.getElementById('post-content').value,
            category: document.getElementById('post-category').value,
            status: document.getElementById('post-status').value,
            tags: this.tagify ? this.tagify.value.map(tag => tag.value).join(',') : '',
            seoTitle: document.getElementById('seo-title')?.value || '',
            seoDescription: document.getElementById('seo-description')?.value || '',
            seoKeywords: document.getElementById('seo-keywords')?.value || '',
            slug: document.getElementById('post-slug')?.value || '',
            scheduleDate: document.getElementById('schedule-datetime')?.value || null
        };
    }

    async saveAsDraft() {
        const statusSelect = document.getElementById('post-status');
        const originalValue = statusSelect.value;
        statusSelect.value = 'draft';
        
        await this.handlePostSubmission({ preventDefault: () => {} });
        
        statusSelect.value = originalValue;
    }

    showScheduleModal() {
        const statusSelect = document.getElementById('post-status');
        statusSelect.value = 'scheduled';
        statusSelect.dispatchEvent(new Event('change'));
        
        this.showNotification('Please set the schedule date and time, then save the post.', 'info');
    }

    showPreviewModal() {
        const postData = this.gatherPostData();
        
        // Create preview modal if it doesn't exist
        if (!document.getElementById('preview-modal')) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'preview-modal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Post Preview</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="preview-content"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Populate preview content
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = `
            <article class="blog-preview">
                <h1>${postData.title || 'Untitled Post'}</h1>
                <div class="meta mb-3">
                    <span class="badge bg-primary">${postData.category || 'Uncategorized'}</span>
                    ${postData.tags ? postData.tags.split(',').map(tag => `<span class="badge bg-secondary ms-1">${tag.trim()}</span>`).join('') : ''}
                </div>
                <div class="content">
                    ${postData.content || '<p><em>No content available</em></p>'}
                </div>
            </article>
        `;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('preview-modal'));
        modal.show();
    }

    async loadBlogPosts() {
        try {
            const response = await fetch(`${this.apiBase}/cms/blog/posts`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.renderBlogPosts(result.data);
            } else {
                this.showNotification('Error loading posts: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.renderBlogPosts([]);
        }
    }

    renderBlogPosts(posts) {
        const tbody = document.getElementById('blog-posts-table');
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No blog posts found</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
            <tr>
                <td>
                    <div class="fw-semibold">${post.title}</div>
                    <small class="text-muted">${post.slug || ''}</small>
                </td>
                <td>${post.author || 'Admin'}</td>
                <td><span class="badge bg-primary">${post.category || 'Uncategorized'}</span></td>
                <td>
                    <span class="badge bg-${this.getStatusColor(post.status)}">${post.status}</span>
                </td>
                <td>
                    <small>${new Date(post.createdAt || Date.now()).toLocaleDateString()}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="blogManager.editPost('${post.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-outline-info" onclick="blogManager.previewPost('${post.id}')">
                            👁️ View
                        </button>
                        <button class="btn btn-outline-danger" onclick="blogManager.deletePost('${post.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update DataTable if initialized
        if (this.postsDataTable) {
            this.postsDataTable.clear().rows.add($(tbody).find('tr')).draw();
        }
    }

    getStatusColor(status) {
        const colors = {
            'published': 'success',
            'draft': 'warning',
            'scheduled': 'info',
            'archived': 'secondary'
        };
        return colors[status] || 'secondary';
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBase}/cms/blog/categories`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.renderCategories(result.data);
                this.updateCategoryOptions(result.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.renderCategories([]);
        }
    }

    renderCategories(categories) {
        const tbody = document.getElementById('categories-table');
        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No categories found</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(category => `
            <tr>
                <td>${category.name}</td>
                <td><code>${category.slug}</code></td>
                <td>${category.description || '-'}</td>
                <td><span class="badge bg-info">${category.postsCount || 0}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="blogManager.editCategory('${category.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-outline-danger" onclick="blogManager.deleteCategory('${category.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateCategoryOptions(categories) {
        const categorySelect = document.getElementById('post-category');
        if (categorySelect) {
            // Keep the first "Select Category" option
            const currentValue = categorySelect.value;
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.slug;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // Restore selected value
            categorySelect.value = currentValue;
        }
    }

    async saveCategory() {
        const categoryData = {
            name: document.getElementById('category-name').value,
            slug: document.getElementById('category-slug').value,
            description: document.getElementById('category-description').value
        };

        try {
            const response = await fetch(`${this.apiBase}/cms/blog/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Category saved successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('add-category-modal'));
                modal.hide();
                
                // Reset form
                document.getElementById('category-form').reset();
                
                // Reload categories
                this.loadCategories();
            } else {
                this.showNotification('Error saving category: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            this.showNotification('Error saving category. Please try again.', 'error');
        }
    }

    async editPost(postId) {
        try {
            const response = await fetch(`${this.apiBase}/cms/blog/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.populatePostForm(result.data);
                this.adminDashboard.showSection('blog-add-new');
            }
        } catch (error) {
            console.error('Error loading post:', error);
            this.showNotification('Error loading post for editing.', 'error');
        }
    }

    populatePostForm(post) {
        // Populate basic fields
        document.getElementById('post-title').value = post.title || '';
        document.getElementById('post-category').value = post.category || '';
        document.getElementById('post-status').value = post.status || 'draft';

        // Populate Quill editor
        if (this.quillEditor) {
            this.quillEditor.root.innerHTML = post.content || '';
        } else {
            document.getElementById('post-content').value = post.content || '';
        }

        // Populate SEO fields
        if (document.getElementById('seo-title')) {
            document.getElementById('seo-title').value = post.seoTitle || '';
            document.getElementById('seo-description').value = post.seoDescription || '';
            document.getElementById('seo-keywords').value = post.seoKeywords || '';
            document.getElementById('post-slug').value = post.slug || '';
        }

        // Populate tags
        if (this.tagify && post.tags) {
            this.tagify.removeAllTags();
            post.tags.split(',').forEach(tag => {
                this.tagify.addTags(tag.trim());
            });
        }

        // Store current post ID for updates
        this.currentPost = post;
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/cms/blog/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Post deleted successfully!', 'success');
                this.loadBlogPosts();
            } else {
                this.showNotification('Error deleting post: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('Error deleting post. Please try again.', 'error');
        }
    }

    resetForm() {
        const form = document.getElementById('blog-post-form');
        if (form) {
            form.reset();
            
            if (this.quillEditor) {
                this.quillEditor.setText('');
            }
            
            if (this.tagify) {
                this.tagify.removeAllTags();
            }
            
            this.removeFeaturedImage();
            this.currentPost = null;
        }
    }

    showNotification(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // Additional methods for category and post management
    async editCategory(categoryId) {
        // Implementation for editing categories
        console.log('Edit category:', categoryId);
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/cms/blog/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Category deleted successfully!', 'success');
                this.loadCategories();
            } else {
                this.showNotification('Error deleting category: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showNotification('Error deleting category. Please try again.', 'error');
        }
    }

    async previewPost(postId) {
        try {
            const response = await fetch(`${this.apiBase}/cms/blog/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showPostPreview(result.data);
            }
        } catch (error) {
            console.error('Error loading post preview:', error);
            this.showNotification('Error loading post preview.', 'error');
        }
    }

    showPostPreview(post) {
        // Create and show preview modal with post data
        if (!document.getElementById('post-preview-modal')) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'post-preview-modal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Post Preview</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="post-preview-content"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <a href="#" class="btn btn-primary" target="_blank">View on Site</a>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const previewContent = document.getElementById('post-preview-content');
        previewContent.innerHTML = `
            <article class="blog-post-preview">
                <h1>${post.title}</h1>
                <div class="meta mb-3">
                    <span class="badge bg-primary">${post.category || 'Uncategorized'}</span>
                    <span class="text-muted ms-2">${new Date(post.createdAt).toLocaleDateString()}</span>
                    <span class="badge bg-${this.getStatusColor(post.status)} ms-2">${post.status}</span>
                </div>
                ${post.featuredImage ? `<img src="${post.featuredImage}" class="img-fluid mb-3" alt="Featured image">` : ''}
                <div class="content">
                    ${post.content}
                </div>
                ${post.tags ? `
                    <div class="tags mt-3">
                        <strong>Tags:</strong>
                        ${post.tags.split(',').map(tag => `<span class="badge bg-secondary ms-1">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `;

        const modal = new bootstrap.Modal(document.getElementById('post-preview-modal'));
        modal.show();
    }
}

// Initialize Blog Manager when AdminDashboard is available
if (typeof window !== 'undefined') {
    // Wait for adminDashboard to be available
    const initBlogManager = () => {
        if (window.adminDashboard) {
            window.blogManager = new BlogManager(window.adminDashboard);
        } else {
            setTimeout(initBlogManager, 100);
        }
    };
    
    initBlogManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogManager;
}
