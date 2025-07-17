/**
 * Content Management Interface for Neff Paving CMS
 * Comprehensive page content editor for all website sections
 * Features: Homepage hero, services, about us, testimonials, contact info, footer management
 */

class ContentManager {
    constructor(adminDashboard) {
        this.adminDashboard = adminDashboard;
        this.apiBase = adminDashboard.apiBase;
        this.token = adminDashboard.token;
        
        // Content sections configuration
        this.contentSections = {
            'homepage-hero': {
                title: 'Homepage Hero Section',
                fields: {
                    title: { type: 'text', label: 'Main Title', required: true },
                    subtitle: { type: 'text', label: 'Subtitle', required: true },
                    ctaPrimary: { type: 'text', label: 'Primary CTA Button Text' },
                    ctaPrimaryLink: { type: 'text', label: 'Primary CTA Link' },
                    ctaSecondary: { type: 'text', label: 'Secondary CTA Button Text' },
                    ctaSecondaryLink: { type: 'text', label: 'Secondary CTA Link' },
                    backgroundImage: { type: 'media', label: 'Background Image' },
                    videoUrl: { type: 'text', label: 'Background Video URL (optional)' }
                }
            },
            'services-overview': {
                title: 'Services Overview',
                fields: {
                    title: { type: 'text', label: 'Section Title', required: true },
                    description: { type: 'textarea', label: 'Section Description' },
                    services: { type: 'repeater', label: 'Services', fields: {
                        title: { type: 'text', label: 'Service Title' },
                        description: { type: 'textarea', label: 'Service Description' },
                        icon: { type: 'text', label: 'Icon Class (FontAwesome)' },
                        image: { type: 'media', label: 'Service Image' },
                        features: { type: 'array', label: 'Key Features' },
                        link: { type: 'text', label: 'Learn More Link' }
                    }}
                }
            },
            'about-us': {
                title: 'About Us Section',
                fields: {
                    title: { type: 'text', label: 'Section Title', required: true },
                    description: { type: 'rich-text', label: 'Main Description' },
                    missionStatement: { type: 'textarea', label: 'Mission Statement' },
                    foundedYear: { type: 'number', label: 'Founded Year' },
                    yearsExperience: { type: 'number', label: 'Years of Experience' },
                    teamImage: { type: 'media', label: 'Team Photo' },
                    stats: { type: 'repeater', label: 'Company Stats', fields: {
                        number: { type: 'number', label: 'Statistic Number' },
                        label: { type: 'text', label: 'Statistic Label' },
                        icon: { type: 'text', label: 'Icon Class' }
                    }},
                    certifications: { type: 'array', label: 'Certifications & Awards' }
                }
            },
            'testimonials': {
                title: 'Customer Testimonials',
                fields: {
                    title: { type: 'text', label: 'Section Title' },
                    subtitle: { type: 'text', label: 'Section Subtitle' },
                    testimonials: { type: 'repeater', label: 'Testimonials', fields: {
                        name: { type: 'text', label: 'Customer Name' },
                        company: { type: 'text', label: 'Company (optional)' },
                        location: { type: 'text', label: 'Location' },
                        rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 },
                        text: { type: 'textarea', label: 'Testimonial Text' },
                        image: { type: 'media', label: 'Customer Photo' },
                        projectType: { type: 'text', label: 'Project Type' },
                        featured: { type: 'checkbox', label: 'Featured Testimonial' }
                    }}
                }
            },
            'contact-info': {
                title: 'Contact Information',
                fields: {
                    companyName: { type: 'text', label: 'Company Name', required: true },
                    phone: { type: 'tel', label: 'Phone Number', required: true },
                    email: { type: 'email', label: 'Email Address', required: true },
                    address: { type: 'textarea', label: 'Physical Address' },
                    mailingAddress: { type: 'textarea', label: 'Mailing Address (if different)' },
                    hours: { type: 'repeater', label: 'Business Hours', fields: {
                        day: { type: 'text', label: 'Day' },
                        hours: { type: 'text', label: 'Hours' },
                        closed: { type: 'checkbox', label: 'Closed' }
                    }},
                    socialMedia: { type: 'repeater', label: 'Social Media Links', fields: {
                        platform: { type: 'text', label: 'Platform' },
                        url: { type: 'url', label: 'Profile URL' },
                        icon: { type: 'text', label: 'Icon Class' }
                    }},
                    emergencyContact: { type: 'tel', label: 'Emergency Contact Number' },
                    serviceAreas: { type: 'array', label: 'Service Areas' }
                }
            },
            'footer-content': {
                title: 'Footer Content',
                fields: {
                    copyrightText: { type: 'text', label: 'Copyright Text' },
                    tagline: { type: 'text', label: 'Company Tagline' },
                    quickLinks: { type: 'repeater', label: 'Quick Links', fields: {
                        text: { type: 'text', label: 'Link Text' },
                        url: { type: 'text', label: 'Link URL' },
                        external: { type: 'checkbox', label: 'External Link' }
                    }},
                    legalLinks: { type: 'repeater', label: 'Legal Links', fields: {
                        text: { type: 'text', label: 'Link Text' },
                        url: { type: 'text', label: 'Link URL' }
                    }},
                    newsletterSignup: { type: 'checkbox', label: 'Enable Newsletter Signup' },
                    newsletterText: { type: 'text', label: 'Newsletter Call-to-Action' }
                }
            }
        };
        
        // Current editing state
        this.currentSection = null;
        this.isDirty = false;
        this.autoSaveTimeout = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('Initializing Content Manager...');
        
        // Load required dependencies
        await this.loadDependencies();
        
        // Create the content management interface
        this.createContentInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load existing content
        await this.loadAllSections();
        
        console.log('Content Manager initialized successfully');
    }

    async loadDependencies() {
        // Load Quill.js for rich text editing
        if (!document.querySelector('link[href*="quill"]')) {
            const quillCSS = document.createElement('link');
            quillCSS.rel = 'stylesheet';
            quillCSS.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
            document.head.appendChild(quillCSS);
        }

        if (!window.Quill) {
            await this.loadScript('https://cdn.quilljs.com/1.3.7/quill.min.js');
        }

        // Load Sortable.js for reordering
        if (!window.Sortable) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js');
        }

        // Load SweetAlert2 for better modals
        if (!window.Swal) {
            const swalCSS = document.createElement('link');
            swalCSS.rel = 'stylesheet';
            swalCSS.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
            document.head.appendChild(swalCSS);
            
            await this.loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11');
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

    createContentInterface() {
        const container = document.getElementById('content-manager') || this.createContentContainer();
        
        container.innerHTML = `
            <div class="content-manager">
                <!-- Header -->
                <div class="content-header">
                    <div class="header-info">
                        <h1><i class="fas fa-edit"></i> Content Management</h1>
                        <p class="text-muted">Manage your website content sections</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-outline-secondary" id="preview-changes">
                            <i class="fas fa-eye"></i> Preview Changes
                        </button>
                        <button class="btn btn-success" id="publish-all" disabled>
                            <i class="fas fa-globe"></i> Publish All Changes
                        </button>
                    </div>
                </div>

                <!-- Section Navigation -->
                <div class="section-navigation">
                    <div class="nav nav-pills" id="content-nav">
                        ${Object.keys(this.contentSections).map(sectionKey => `
                            <button class="nav-link" data-section="${sectionKey}">
                                ${this.getSectionIcon(sectionKey)} ${this.contentSections[sectionKey].title}
                                <span class="change-indicator" style="display: none;"></span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Content Editor -->
                <div class="content-editor">
                    <div class="editor-toolbar">
                        <div class="section-info">
                            <h3 id="current-section-title">Select a section to edit</h3>
                            <p id="current-section-description" class="text-muted"></p>
                        </div>
                        <div class="editor-actions">
                            <button class="btn btn-sm btn-outline-primary" id="reset-section" disabled>
                                <i class="fas fa-undo"></i> Reset
                            </button>
                            <button class="btn btn-sm btn-primary" id="save-section" disabled>
                                <i class="fas fa-save"></i> Save
                            </button>
                        </div>
                    </div>

                    <div class="editor-content" id="editor-content">
                        <div class="empty-state">
                            <i class="fas fa-mouse-pointer fa-3x text-muted mb-3"></i>
                            <h4>Select a section to start editing</h4>
                            <p class="text-muted">Choose a content section from the navigation above to begin editing your website content.</p>
                        </div>
                    </div>
                </div>

                <!-- Live Preview Panel -->
                <div class="preview-panel" id="preview-panel" style="display: none;">
                    <div class="preview-header">
                        <h4><i class="fas fa-eye"></i> Live Preview</h4>
                        <button class="btn btn-sm btn-outline-secondary" id="close-preview">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="preview-content" id="preview-content">
                        <!-- Preview content will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        this.addContentStyles();
    }

    createContentContainer() {
        const container = document.createElement('div');
        container.id = 'content-manager';
        container.className = 'content-section';
        
        // Find the content sections container or create one
        const contentSections = document.querySelector('.content-sections') || document.body;
        contentSections.appendChild(container);
        
        return container;
    }

    getSectionIcon(sectionKey) {
        const icons = {
            'homepage-hero': '<i class="fas fa-home"></i>',
            'services-overview': '<i class="fas fa-tools"></i>',
            'about-us': '<i class="fas fa-users"></i>',
            'testimonials': '<i class="fas fa-quote-left"></i>',
            'contact-info': '<i class="fas fa-phone"></i>',
            'footer-content': '<i class="fas fa-grip-horizontal"></i>'
        };
        return icons[sectionKey] || '<i class="fas fa-file-alt"></i>';
    }

    addContentStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .content-manager {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
            }

            .content-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }

            .content-header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }

            .content-header p {
                margin: 5px 0 0 0;
                opacity: 0.9;
            }

            .header-actions {
                display: flex;
                gap: 10px;
            }

            .header-actions .btn {
                border-color: rgba(255,255,255,0.3);
                color: white;
            }

            .header-actions .btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.5);
            }

            .section-navigation {
                margin-bottom: 30px;
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }

            .nav-pills .nav-link {
                border-radius: 8px;
                margin-right: 10px;
                margin-bottom: 10px;
                color: #495057;
                border: 1px solid #e9ecef;
                background: white;
                position: relative;
                transition: all 0.2s ease;
            }

            .nav-pills .nav-link:hover {
                background: #f8f9fa;
                border-color: #dee2e6;
            }

            .nav-pills .nav-link.active {
                background: #007bff;
                border-color: #007bff;
                color: white;
            }

            .change-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 12px;
                height: 12px;
                background: #dc3545;
                border-radius: 50%;
                border: 2px solid white;
            }

            .content-editor {
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                overflow: hidden;
            }

            .editor-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }

            .section-info h3 {
                margin: 0;
                color: #495057;
                font-size: 20px;
            }

            .section-info p {
                margin: 5px 0 0 0;
                font-size: 14px;
            }

            .editor-actions {
                display: flex;
                gap: 10px;
            }

            .editor-content {
                padding: 30px;
                min-height: 500px;
            }

            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #6c757d;
            }

            .form-section {
                margin-bottom: 30px;
                padding: 25px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background: #fafbfc;
            }

            .form-section h4 {
                margin-bottom: 20px;
                color: #495057;
                font-size: 18px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 10px;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .form-row.full-width {
                grid-template-columns: 1fr;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #495057;
            }

            .form-group label.required::after {
                content: " *";
                color: #dc3545;
            }

            .form-control {
                width: 100%;
                padding: 12px 15px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            }

            .form-control:focus {
                border-color: #80bdff;
                outline: 0;
                box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
            }

            .media-picker {
                border: 2px dashed #dee2e6;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
            }

            .media-picker:hover {
                border-color: #007bff;
                background: #f8f9ff;
            }

            .media-picker.has-media {
                border-style: solid;
                border-color: #28a745;
                background: #f8fff9;
                padding: 15px;
            }

            .media-preview {
                max-width: 200px;
                max-height: 200px;
                border-radius: 6px;
                margin: 0 auto 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .repeater-container {
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background: white;
            }

            .repeater-header {
                padding: 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .repeater-items {
                padding: 15px;
            }

            .repeater-item {
                padding: 20px;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                margin-bottom: 15px;
                background: #fafbfc;
                position: relative;
            }

            .repeater-item:last-child {
                margin-bottom: 0;
            }

            .repeater-item-header {
                display: flex;
                justify-content: between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e9ecef;
            }

            .repeater-item-title {
                font-weight: 500;
                color: #495057;
            }

            .repeater-item-actions {
                display: flex;
                gap: 5px;
            }

            .repeater-item-actions .btn {
                padding: 4px 8px;
                font-size: 12px;
            }

            .drag-handle {
                cursor: grab;
                color: #6c757d;
                padding: 5px;
            }

            .drag-handle:active {
                cursor: grabbing;
            }

            .array-input {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }

            .array-input input {
                flex: 1;
            }

            .array-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            .array-tag {
                background: #e9ecef;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .array-tag .remove {
                cursor: pointer;
                color: #dc3545;
                font-weight: bold;
            }

            .rich-text-editor {
                border: 1px solid #ced4da;
                border-radius: 6px;
                background: white;
            }

            .rich-text-editor .ql-toolbar {
                border-bottom: 1px solid #e9ecef;
            }

            .rich-text-editor .ql-editor {
                min-height: 150px;
            }

            .preview-panel {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 15px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                z-index: 1000;
                overflow-y: auto;
            }

            .preview-panel.open {
                right: 0;
            }

            .preview-header {
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .preview-content {
                padding: 20px;
            }

            .btn-floating {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 999;
            }

            @media (max-width: 768px) {
                .content-header {
                    flex-direction: column;
                    gap: 15px;
                }

                .editor-toolbar {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .preview-panel {
                    width: 100%;
                    right: -100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Section navigation
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionKey = e.target.closest('[data-section]').getAttribute('data-section');
                this.selectSection(sectionKey);
            });
        });

        // Editor actions
        document.getElementById('save-section').addEventListener('click', () => {
            this.saveCurrentSection();
        });

        document.getElementById('reset-section').addEventListener('click', () => {
            this.resetCurrentSection();
        });

        document.getElementById('preview-changes').addEventListener('click', () => {
            this.togglePreview();
        });

        document.getElementById('publish-all').addEventListener('click', () => {
            this.publishAllChanges();
        });

        document.getElementById('close-preview').addEventListener('click', () => {
            this.closePreview();
        });

        // Auto-save on content change
        document.addEventListener('input', (e) => {
            if (e.target.closest('.editor-content')) {
                this.markDirty();
                this.scheduleAutoSave();
            }
        });

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    async selectSection(sectionKey) {
        // Save current section if dirty
        if (this.isDirty && this.currentSection) {
            const shouldSave = await this.confirmSave();
            if (shouldSave) {
                await this.saveCurrentSection();
            }
        }

        this.currentSection = sectionKey;
        const section = this.contentSections[sectionKey];

        // Update UI
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-section') === sectionKey);
        });

        document.getElementById('current-section-title').textContent = section.title;
        document.getElementById('current-section-description').textContent = 
            `Configure the ${section.title.toLowerCase()} content and settings.`;

        // Load section content
        await this.loadSectionContent(sectionKey);

        // Enable editor actions
        document.getElementById('save-section').disabled = false;
        document.getElementById('reset-section').disabled = false;

        this.isDirty = false;
        this.updateSaveState();
    }

    async loadSectionContent(sectionKey) {
        const editorContent = document.getElementById('editor-content');
        const section = this.contentSections[sectionKey];

        try {
            // Fetch existing content
            const response = await fetch(`${this.apiBase}/cms/pages/main/sections/${sectionKey}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            let existingContent = {};
            if (response.ok) {
                const result = await response.json();
                existingContent = result.sections[sectionKey]?.content || {};
            }

            // Generate form HTML
            const formHTML = this.generateSectionForm(section.fields, existingContent, sectionKey);
            
            editorContent.innerHTML = `
                <form id="section-form-${sectionKey}" class="section-form">
                    ${formHTML}
                </form>
            `;

            // Initialize components
            this.initializeFormComponents(sectionKey);

        } catch (error) {
            console.error('Error loading section content:', error);
            this.showNotification('Error loading section content', 'error');
        }
    }

    generateSectionForm(fields, existingContent, sectionKey) {
        return Object.entries(fields).map(([fieldKey, fieldConfig]) => {
            const value = existingContent[fieldKey] || '';
            return this.generateFormField(fieldKey, fieldConfig, value, sectionKey);
        }).join('');
    }

    generateFormField(fieldKey, fieldConfig, value, sectionKey) {
        const fieldId = `${sectionKey}-${fieldKey}`;
        const required = fieldConfig.required ? 'required' : '';
        const requiredClass = fieldConfig.required ? 'required' : '';

        const baseField = `
            <div class="form-group">
                <label for="${fieldId}" class="${requiredClass}">${fieldConfig.label}</label>
        `;

        const fieldEnd = `</div>`;

        switch (fieldConfig.type) {
            case 'text':
                return baseField + `
                    <input type="text" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${this.escapeHtml(value)}" ${required}>
                ` + fieldEnd;

            case 'email':
                return baseField + `
                    <input type="email" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${this.escapeHtml(value)}" ${required}>
                ` + fieldEnd;

            case 'tel':
                return baseField + `
                    <input type="tel" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${this.escapeHtml(value)}" ${required}>
                ` + fieldEnd;

            case 'url':
                return baseField + `
                    <input type="url" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${this.escapeHtml(value)}" ${required}>
                ` + fieldEnd;

            case 'number':
                const min = fieldConfig.min ? `min="${fieldConfig.min}"` : '';
                const max = fieldConfig.max ? `max="${fieldConfig.max}"` : '';
                return baseField + `
                    <input type="number" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${value}" ${min} ${max} ${required}>
                ` + fieldEnd;

            case 'textarea':
                return baseField + `
                    <textarea id="${fieldId}" name="${fieldKey}" class="form-control" 
                              rows="4" ${required}>${this.escapeHtml(value)}</textarea>
                ` + fieldEnd;

            case 'rich-text':
                return baseField + `
                    <div class="rich-text-editor" id="${fieldId}-editor"></div>
                    <input type="hidden" id="${fieldId}" name="${fieldKey}" value="${this.escapeHtml(value)}">
                ` + fieldEnd;

            case 'checkbox':
                const checked = value ? 'checked' : '';
                return baseField + `
                    <div class="form-check">
                        <input type="checkbox" id="${fieldId}" name="${fieldKey}" class="form-check-input" 
                               value="1" ${checked}>
                        <label for="${fieldId}" class="form-check-label">${fieldConfig.label}</label>
                    </div>
                ` + fieldEnd;

            case 'media':
                return this.generateMediaField(fieldId, fieldKey, fieldConfig, value);

            case 'array':
                return this.generateArrayField(fieldId, fieldKey, fieldConfig, value);

            case 'repeater':
                return this.generateRepeaterField(fieldId, fieldKey, fieldConfig, value, sectionKey);

            default:
                return baseField + `
                    <input type="text" id="${fieldId}" name="${fieldKey}" class="form-control" 
                           value="${this.escapeHtml(value)}" ${required}>
                ` + fieldEnd;
        }
    }

    generateMediaField(fieldId, fieldKey, fieldConfig, value) {
        const hasMedia = value && value.url;
        const pickerClass = hasMedia ? 'media-picker has-media' : 'media-picker';
        
        return `
            <div class="form-group">
                <label for="${fieldId}">${fieldConfig.label}</label>
                <div class="${pickerClass}" id="${fieldId}-picker" data-field="${fieldKey}">
                    ${hasMedia ? `
                        <div class="media-preview-container">
                            <img src="${value.url}" alt="${value.alt || ''}" class="media-preview">
                            <p><strong>${value.filename}</strong></p>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="contentManager.removeMedia('${fieldId}')">
                                Remove Media
                            </button>
                        </div>
                    ` : `
                        <i class="fas fa-cloud-upload fa-2x text-muted mb-3"></i>
                        <h5>Click to select media</h5>
                        <p class="text-muted">Choose an image or video file</p>
                    `}
                </div>
                <input type="hidden" id="${fieldId}" name="${fieldKey}" value='${JSON.stringify(value)}'>
            </div>
        `;
    }

    generateArrayField(fieldId, fieldKey, fieldConfig, value) {
        const items = Array.isArray(value) ? value : [];
        
        return `
            <div class="form-group">
                <label for="${fieldId}">${fieldConfig.label}</label>
                <div class="array-input">
                    <input type="text" class="form-control" placeholder="Add new item..." id="${fieldId}-input">
                    <button type="button" class="btn btn-outline-primary" onclick="contentManager.addArrayItem('${fieldId}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div class="array-tags" id="${fieldId}-tags">
                    ${items.map((item, index) => `
                        <span class="array-tag">
                            ${this.escapeHtml(item)}
                            <span class="remove" onclick="contentManager.removeArrayItem('${fieldId}', ${index})">×</span>
                        </span>
                    `).join('')}
                </div>
                <input type="hidden" id="${fieldId}" name="${fieldKey}" value='${JSON.stringify(items)}'>
            </div>
        `;
    }

    generateRepeaterField(fieldId, fieldKey, fieldConfig, value, sectionKey) {
        const items = Array.isArray(value) ? value : [];
        
        return `
            <div class="form-group">
                <div class="repeater-container">
                    <div class="repeater-header">
                        <label><strong>${fieldConfig.label}</strong></label>
                        <button type="button" class="btn btn-sm btn-primary" onclick="contentManager.addRepeaterItem('${fieldId}', '${sectionKey}')">
                            <i class="fas fa-plus"></i> Add ${fieldConfig.label.slice(0, -1)}
                        </button>
                    </div>
                    <div class="repeater-items" id="${fieldId}-items">
                        ${items.map((item, index) => this.generateRepeaterItem(fieldId, fieldConfig, item, index, sectionKey)).join('')}
                    </div>
                </div>
                <input type="hidden" id="${fieldId}" name="${fieldKey}" value='${JSON.stringify(items)}'>
            </div>
        `;
    }

    generateRepeaterItem(fieldId, fieldConfig, itemData, index, sectionKey) {
        const itemId = `${fieldId}-item-${index}`;
        
        const fields = Object.entries(fieldConfig.fields).map(([subFieldKey, subFieldConfig]) => {
            const subValue = itemData[subFieldKey] || '';
            return this.generateFormField(`${itemId}-${subFieldKey}`, subFieldConfig, subValue, sectionKey);
        }).join('');

        return `
            <div class="repeater-item" data-index="${index}">
                <div class="repeater-item-header">
                    <div class="repeater-item-title">
                        <i class="fas fa-grip-vertical drag-handle"></i>
                        ${fieldConfig.label.slice(0, -1)} #${index + 1}
                    </div>
                    <div class="repeater-item-actions">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="contentManager.removeRepeaterItem('${fieldId}', ${index})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                ${fields}
            </div>
        `;
    }

    initializeFormComponents(sectionKey) {
        const form = document.getElementById(`section-form-${sectionKey}`);
        
        // Initialize rich text editors
        form.querySelectorAll('.rich-text-editor').forEach(editor => {
            const fieldId = editor.id.replace('-editor', '');
            const hiddenInput = document.getElementById(fieldId);
            
            const quill = new Quill(editor, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                },
                placeholder: 'Enter content...'
            });

            // Set initial content
            if (hiddenInput.value) {
                quill.root.innerHTML = hiddenInput.value;
            }

            // Update hidden input on change
            quill.on('text-change', () => {
                hiddenInput.value = quill.root.innerHTML;
            });
        });

        // Initialize media pickers
        form.querySelectorAll('.media-picker').forEach(picker => {
            picker.addEventListener('click', () => {
                const fieldKey = picker.getAttribute('data-field');
                this.openMediaPicker(picker.id.replace('-picker', ''));
            });
        });

        // Initialize sortable for repeaters
        form.querySelectorAll('.repeater-items').forEach(container => {
            new Sortable(container, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: (evt) => {
                    this.updateRepeaterIndices(container);
                }
            });
        });
    }

    async openMediaPicker(fieldId) {
        // For now, show a simple prompt for media URL
        // In a full implementation, this would open a media library modal
        const mediaUrl = prompt('Enter media URL:');
        if (mediaUrl) {
            const mediaData = {
                url: mediaUrl,
                filename: mediaUrl.split('/').pop(),
                alt: ''
            };
            
            this.setMediaValue(fieldId, mediaData);
        }
    }

    setMediaValue(fieldId, mediaData) {
        const hiddenInput = document.getElementById(fieldId);
        const picker = document.getElementById(`${fieldId}-picker`);
        
        hiddenInput.value = JSON.stringify(mediaData);
        
        picker.className = 'media-picker has-media';
        picker.innerHTML = `
            <div class="media-preview-container">
                <img src="${mediaData.url}" alt="${mediaData.alt || ''}" class="media-preview">
                <p><strong>${mediaData.filename}</strong></p>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="contentManager.removeMedia('${fieldId}')">
                    Remove Media
                </button>
            </div>
        `;
        
        this.markDirty();
    }

    removeMedia(fieldId) {
        const hiddenInput = document.getElementById(fieldId);
        const picker = document.getElementById(`${fieldId}-picker`);
        
        hiddenInput.value = '';
        
        picker.className = 'media-picker';
        picker.innerHTML = `
            <i class="fas fa-cloud-upload fa-2x text-muted mb-3"></i>
            <h5>Click to select media</h5>
            <p class="text-muted">Choose an image or video file</p>
        `;
        
        this.markDirty();
    }

    addArrayItem(fieldId) {
        const input = document.getElementById(`${fieldId}-input`);
        const value = input.value.trim();
        
        if (!value) return;
        
        const hiddenInput = document.getElementById(fieldId);
        const currentItems = JSON.parse(hiddenInput.value || '[]');
        currentItems.push(value);
        
        hiddenInput.value = JSON.stringify(currentItems);
        input.value = '';
        
        this.renderArrayTags(fieldId, currentItems);
        this.markDirty();
    }

    removeArrayItem(fieldId, index) {
        const hiddenInput = document.getElementById(fieldId);
        const currentItems = JSON.parse(hiddenInput.value || '[]');
        currentItems.splice(index, 1);
        
        hiddenInput.value = JSON.stringify(currentItems);
        
        this.renderArrayTags(fieldId, currentItems);
        this.markDirty();
    }

    renderArrayTags(fieldId, items) {
        const tagsContainer = document.getElementById(`${fieldId}-tags`);
        tagsContainer.innerHTML = items.map((item, index) => `
            <span class="array-tag">
                ${this.escapeHtml(item)}
                <span class="remove" onclick="contentManager.removeArrayItem('${fieldId}', ${index})">×</span>
            </span>
        `).join('');
    }

    addRepeaterItem(fieldId, sectionKey) {
        const itemsContainer = document.getElementById(`${fieldId}-items`);
        const hiddenInput = document.getElementById(fieldId);
        const currentItems = JSON.parse(hiddenInput.value || '[]');
        const index = currentItems.length;
        
        // Add empty item
        currentItems.push({});
        hiddenInput.value = JSON.stringify(currentItems);
        
        // Get field config
        const fieldKey = fieldId.split('-').pop();
        const section = this.contentSections[sectionKey];
        const fieldConfig = this.findFieldConfig(section.fields, fieldKey);
        
        if (fieldConfig) {
            const newItemHTML = this.generateRepeaterItem(fieldId, fieldConfig, {}, index, sectionKey);
            itemsContainer.insertAdjacentHTML('beforeend', newItemHTML);
            
            // Re-initialize components for the new item
            this.initializeFormComponents(sectionKey);
        }
        
        this.markDirty();
    }

    removeRepeaterItem(fieldId, index) {
        const hiddenInput = document.getElementById(fieldId);
        const currentItems = JSON.parse(hiddenInput.value || '[]');
        currentItems.splice(index, 1);
        
        hiddenInput.value = JSON.stringify(currentItems);
        
        // Remove the item element
        const itemElement = document.querySelector(`[data-index="${index}"]`);
        if (itemElement) {
            itemElement.remove();
        }
        
        // Update indices
        const itemsContainer = document.getElementById(`${fieldId}-items`);
        this.updateRepeaterIndices(itemsContainer);
        
        this.markDirty();
    }

    updateRepeaterIndices(container) {
        const items = container.querySelectorAll('.repeater-item');
        items.forEach((item, index) => {
            item.setAttribute('data-index', index);
            const title = item.querySelector('.repeater-item-title');
            if (title) {
                const text = title.textContent.replace(/#\d+/, `#${index + 1}`);
                title.firstChild.textContent = text;
            }
        });
        
        this.markDirty();
    }

    findFieldConfig(fields, fieldKey) {
        for (const [key, config] of Object.entries(fields)) {
            if (key === fieldKey) return config;
            if (config.type === 'repeater' && config.fields) {
                const found = this.findFieldConfig(config.fields, fieldKey);
                if (found) return config;
            }
        }
        return null;
    }

    async saveCurrentSection() {
        if (!this.currentSection) return;

        const form = document.getElementById(`section-form-${this.currentSection}`);
        const formData = new FormData(form);
        const content = {};

        // Convert form data to object
        for (const [key, value] of formData.entries()) {
            try {
                // Try to parse as JSON first (for complex fields)
                content[key] = JSON.parse(value);
            } catch {
                // Fall back to string value
                content[key] = value;
            }
        }

        try {
            const response = await fetch(`${this.apiBase}/cms/pages/main/sections/${this.currentSection}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.showNotification('Section saved successfully!', 'success');
                this.isDirty = false;
                this.updateSaveState();
                this.markSectionChanged(this.currentSection, false);
            } else {
                throw new Error('Failed to save section');
            }
        } catch (error) {
            console.error('Error saving section:', error);
            this.showNotification('Error saving section', 'error');
        }
    }

    async resetCurrentSection() {
        if (!this.currentSection) return;

        const confirmed = await this.confirm('Reset section?', 'This will discard all unsaved changes.');
        if (confirmed) {
            await this.loadSectionContent(this.currentSection);
            this.isDirty = false;
            this.updateSaveState();
        }
    }

    async loadAllSections() {
        try {
            const response = await fetch(`${this.apiBase}/cms/pages/main/sections`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Loaded sections:', result);
            }
        } catch (error) {
            console.error('Error loading sections:', error);
        }
    }

    markDirty() {
        this.isDirty = true;
        this.updateSaveState();
        this.markSectionChanged(this.currentSection, true);
    }

    updateSaveState() {
        const saveBtn = document.getElementById('save-section');
        const resetBtn = document.getElementById('reset-section');
        const publishBtn = document.getElementById('publish-all');
        
        saveBtn.disabled = !this.isDirty;
        resetBtn.disabled = !this.isDirty;
        
        // Check if any sections have changes
        const hasChanges = document.querySelector('.change-indicator[style*="block"]');
        publishBtn.disabled = !hasChanges;
    }

    markSectionChanged(sectionKey, changed) {
        const navLink = document.querySelector(`[data-section="${sectionKey}"]`);
        if (navLink) {
            const indicator = navLink.querySelector('.change-indicator');
            indicator.style.display = changed ? 'block' : 'none';
        }
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            if (this.isDirty && this.currentSection) {
                this.saveCurrentSection();
            }
        }, 30000); // Auto-save after 30 seconds
    }

    togglePreview() {
        const panel = document.getElementById('preview-panel');
        const isOpen = panel.classList.contains('open');
        
        if (isOpen) {
            this.closePreview();
        } else {
            this.openPreview();
        }
    }

    openPreview() {
        const panel = document.getElementById('preview-panel');
        panel.classList.add('open');
        
        // Generate preview content
        this.generatePreviewContent();
    }

    closePreview() {
        const panel = document.getElementById('preview-panel');
        panel.classList.remove('open');
    }

    generatePreviewContent() {
        const previewContent = document.getElementById('preview-content');
        
        if (!this.currentSection) {
            previewContent.innerHTML = '<p>Select a section to preview</p>';
            return;
        }

        const form = document.getElementById(`section-form-${this.currentSection}`);
        const formData = new FormData(form);
        const content = {};

        for (const [key, value] of formData.entries()) {
            try {
                content[key] = JSON.parse(value);
            } catch {
                content[key] = value;
            }
        }

        // Generate preview based on section type
        previewContent.innerHTML = this.generateSectionPreview(this.currentSection, content);
    }

    generateSectionPreview(sectionKey, content) {
        switch (sectionKey) {
            case 'homepage-hero':
                return `
                    <div class="hero-preview" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${content.backgroundImage?.url || ''}'); background-size: cover; padding: 60px 20px; color: white; text-align: center;">
                        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${content.title || 'Main Title'}</h1>
                        <p style="font-size: 1.2rem; margin-bottom: 2rem;">${content.subtitle || 'Subtitle'}</p>
                        <div>
                            ${content.ctaPrimary ? `<button class="btn btn-primary me-3">${content.ctaPrimary}</button>` : ''}
                            ${content.ctaSecondary ? `<button class="btn btn-outline-light">${content.ctaSecondary}</button>` : ''}
                        </div>
                    </div>
                `;

            case 'services-overview':
                const services = Array.isArray(content.services) ? content.services : [];
                return `
                    <div class="services-preview">
                        <h2>${content.title || 'Our Services'}</h2>
                        <p>${content.description || ''}</p>
                        <div class="row">
                            ${services.map(service => `
                                <div class="col-md-4 mb-3">
                                    <div class="card">
                                        ${service.image?.url ? `<img src="${service.image.url}" class="card-img-top" style="height: 200px; object-fit: cover;">` : ''}
                                        <div class="card-body">
                                            <h5 class="card-title">${service.title || 'Service Title'}</h5>
                                            <p class="card-text">${service.description || 'Service description'}</p>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'testimonials':
                const testimonials = Array.isArray(content.testimonials) ? content.testimonials : [];
                return `
                    <div class="testimonials-preview">
                        <h2>${content.title || 'Customer Testimonials'}</h2>
                        <p>${content.subtitle || ''}</p>
                        <div>
                            ${testimonials.map(testimonial => `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-3">
                                            ${testimonial.image?.url ? `<img src="${testimonial.image.url}" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">` : ''}
                                            <div>
                                                <h6 class="mb-0">${testimonial.name || 'Customer Name'}</h6>
                                                <small class="text-muted">${testimonial.location || ''}</small>
                                            </div>
                                        </div>
                                        <p>"${testimonial.text || 'Testimonial text'}"</p>
                                        <div class="text-warning">
                                            ${'★'.repeat(testimonial.rating || 5)}${'☆'.repeat(5 - (testimonial.rating || 5))}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="default-preview">
                        <h3>${this.contentSections[sectionKey].title}</h3>
                        <pre>${JSON.stringify(content, null, 2)}</pre>
                    </div>
                `;
        }
    }

    async publishAllChanges() {
        const confirmed = await this.confirm('Publish Changes?', 'This will make all changes live on your website.');
        if (confirmed) {
            this.showNotification('Publishing changes...', 'info');
            
            // In a real implementation, this would trigger a site rebuild/deploy
            setTimeout(() => {
                this.showNotification('Changes published successfully!', 'success');
                
                // Reset all change indicators
                document.querySelectorAll('.change-indicator').forEach(indicator => {
                    indicator.style.display = 'none';
                });
                
                document.getElementById('publish-all').disabled = true;
            }, 2000);
        }
    }

    async confirmSave() {
        return await this.confirm('Save Changes?', 'You have unsaved changes. Would you like to save them?');
    }

    async confirm(title, text) {
        if (window.Swal) {
            const result = await Swal.fire({
                title,
                text,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
            });
            return result.isConfirmed;
        } else {
            return confirm(`${title}\n\n${text}`);
        }
    }

    showNotification(message, type = 'info') {
        if (window.Swal) {
            const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon,
                title: message
            });
        } else {
            // Fallback notification
            const toast = document.createElement('div');
            toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible position-fixed`;
            toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            toast.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Content Manager when AdminDashboard is available
if (typeof window !== 'undefined') {
    const initContentManager = () => {
        if (window.adminDashboard) {
            window.contentManager = new ContentManager(window.adminDashboard);
        } else {
            setTimeout(initContentManager, 100);
        }
    };
    
    initContentManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManager;
}
