/**
 * Media Management Interface
 * Provides comprehensive media library functionality for CMS admin
 */

class MediaManager {
    constructor() {
        this.currentView = 'grid';
        this.selectedFiles = new Set();
        this.currentFolder = null;
        this.searchQuery = '';
        this.filterType = 'all';
        this.mediaFiles = [];
        this.folders = [];
        this.uploadQueue = [];
        
        this.init();
    }

    init() {
        this.createMediaInterface();
        this.setupEventListeners();
        this.loadMediaLibrary();
    }

    createMediaInterface() {
        const container = document.getElementById('media-container') || document.body;
        
        container.innerHTML = `
            <div class="media-manager">
                <!-- Header Section -->
                <div class="media-header">
                    <div class="media-title">
                        <h1>Media Library</h1>
                        <div class="breadcrumb">
                            <span class="breadcrumb-item active" data-folder="root">Media</span>
                            <div class="breadcrumb-path"></div>
                        </div>
                    </div>
                    
                    <div class="media-actions">
                        <button class="btn btn-primary" id="upload-btn">
                            <i class="fas fa-plus"></i> Upload Files
                        </button>
                        <button class="btn btn-secondary" id="new-folder-btn">
                            <i class="fas fa-folder-plus"></i> New Folder
                        </button>
                    </div>
                </div>

                <!-- Controls Section -->
                <div class="media-controls">
                    <div class="media-filters">
                        <div class="search-container">
                            <input type="text" id="media-search" placeholder="Search media files..." class="search-input">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        
                        <select id="media-filter" class="filter-select">
                            <option value="all">All Files</option>
                            <option value="images">Images</option>
                            <option value="videos">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="documents">Documents</option>
                        </select>
                    </div>
                    
                    <div class="media-view-controls">
                        <div class="view-toggle">
                            <button class="view-btn active" data-view="grid" title="Grid View">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-btn" data-view="list" title="List View">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        
                        <div class="bulk-actions" style="display: none;">
                            <span class="selected-count">0 selected</span>
                            <button class="btn btn-sm btn-danger" id="bulk-delete">Delete</button>
                            <button class="btn btn-sm btn-secondary" id="bulk-move">Move</button>
                        </div>
                    </div>
                </div>

                <!-- Upload Zone -->
                <div class="upload-zone" id="upload-zone" style="display: none;">
                    <div class="upload-content">
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <h3>Drag & Drop Files Here</h3>
                        <p>Or click to browse files</p>
                        <input type="file" id="file-input" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt">
                    </div>
                    <div class="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">0%</span>
                    </div>
                </div>

                <!-- Folder Navigation -->
                <div class="folder-navigation" id="folder-nav">
                    <!-- Folders will be populated here -->
                </div>

                <!-- Media Grid/List -->
                <div class="media-content">
                    <div class="media-grid" id="media-grid">
                        <!-- Media items will be populated here -->
                    </div>
                    
                    <div class="media-list" id="media-list" style="display: none;">
                        <!-- List view will be populated here -->
                    </div>
                </div>

                <!-- Loading Indicator -->
                <div class="loading-indicator" id="loading" style="display: none;">
                    <div class="spinner"></div>
                    <p>Loading media files...</p>
                </div>

                <!-- Empty State -->
                <div class="empty-state" id="empty-state" style="display: none;">
                    <i class="fas fa-images empty-icon"></i>
                    <h3>No media files found</h3>
                    <p>Upload your first media file to get started</p>
                </div>
            </div>

            <!-- Media Details Modal -->
            <div class="modal" id="media-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Media Details</h2>
                        <button class="close-btn" data-modal="media-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="media-preview">
                            <div class="preview-container">
                                <!-- Preview will be populated here -->
                            </div>
                        </div>
                        <div class="media-details">
                            <form id="media-form">
                                <div class="form-group">
                                    <label for="media-title">Title</label>
                                    <input type="text" id="media-title" name="title" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="media-alt">Alt Text</label>
                                    <input type="text" id="media-alt" name="alt" class="form-control" placeholder="Describe this image...">
                                </div>
                                <div class="form-group">
                                    <label for="media-description">Description</label>
                                    <textarea id="media-description" name="description" class="form-control" rows="3"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="media-folder">Folder</label>
                                    <select id="media-folder" name="folder" class="form-control">
                                        <option value="">Root</option>
                                        <!-- Folders will be populated here -->
                                    </select>
                                </div>
                                <div class="media-info">
                                    <div class="info-item">
                                        <label>File Size:</label>
                                        <span id="file-size"></span>
                                    </div>
                                    <div class="info-item">
                                        <label>Dimensions:</label>
                                        <span id="file-dimensions"></span>
                                    </div>
                                    <div class="info-item">
                                        <label>Upload Date:</label>
                                        <span id="upload-date"></span>
                                    </div>
                                    <div class="info-item">
                                        <label>File Type:</label>
                                        <span id="file-type"></span>
                                    </div>
                                </div>
                                <div class="url-copy">
                                    <label>File URL:</label>
                                    <div class="url-container">
                                        <input type="text" id="media-url" readonly class="form-control">
                                        <button type="button" class="btn btn-copy" id="copy-url">
                                            <i class="fas fa-copy"></i> Copy
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" id="delete-media">Delete</button>
                        <button class="btn btn-secondary" data-modal="media-modal">Cancel</button>
                        <button class="btn btn-primary" id="save-media">Save Changes</button>
                    </div>
                </div>
            </div>

            <!-- New Folder Modal -->
            <div class="modal" id="folder-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Create New Folder</h2>
                        <button class="close-btn" data-modal="folder-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="folder-form">
                            <div class="form-group">
                                <label for="folder-name">Folder Name</label>
                                <input type="text" id="folder-name" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="folder-parent">Parent Folder</label>
                                <select id="folder-parent" name="parent" class="form-control">
                                    <option value="">Root</option>
                                    <!-- Folders will be populated here -->
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-modal="folder-modal">Cancel</button>
                        <button class="btn btn-primary" id="create-folder">Create Folder</button>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .media-manager {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .media-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e1e5e9;
            }

            .media-title h1 {
                margin: 0 0 5px 0;
                font-size: 28px;
                color: #2c3e50;
            }

            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                color: #6c757d;
            }

            .breadcrumb-item {
                cursor: pointer;
                text-decoration: none;
                color: #007bff;
            }

            .breadcrumb-item.active {
                color: #6c757d;
            }

            .media-actions {
                display: flex;
                gap: 10px;
            }

            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #007bff;
                color: white;
            }

            .btn-primary:hover {
                background: #0056b3;
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background: #545b62;
            }

            .btn-danger {
                background: #dc3545;
                color: white;
            }

            .btn-danger:hover {
                background: #c82333;
            }

            .btn-copy {
                background: #17a2b8;
                color: white;
                padding: 6px 12px;
                font-size: 12px;
            }

            .btn-copy:hover {
                background: #138496;
            }

            .media-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .media-filters {
                display: flex;
                gap: 15px;
                align-items: center;
            }

            .search-container {
                position: relative;
            }

            .search-input {
                padding: 8px 35px 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                width: 250px;
                font-size: 14px;
            }

            .search-icon {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #6c757d;
            }

            .filter-select {
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
                background: white;
            }

            .media-view-controls {
                display: flex;
                gap: 15px;
                align-items: center;
            }

            .view-toggle {
                display: flex;
                border: 1px solid #ced4da;
                border-radius: 4px;
                overflow: hidden;
            }

            .view-btn {
                padding: 8px 12px;
                border: none;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .view-btn.active {
                background: #007bff;
                color: white;
            }

            .bulk-actions {
                display: flex;
                gap: 10px;
                align-items: center;
                padding: 5px 10px;
                background: #e9ecef;
                border-radius: 4px;
            }

            .selected-count {
                font-size: 14px;
                color: #495057;
                font-weight: 500;
            }

            .upload-zone {
                border: 2px dashed #007bff;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                margin-bottom: 20px;
                background: #f8f9ff;
                cursor: pointer;
                transition: all 0.2s;
            }

            .upload-zone:hover {
                border-color: #0056b3;
                background: #e6f3ff;
            }

            .upload-zone.drag-over {
                border-color: #28a745;
                background: #e8f5e8;
            }

            .upload-content h3 {
                margin: 10px 0 5px 0;
                color: #2c3e50;
            }

            .upload-content p {
                margin: 0;
                color: #6c757d;
            }

            .upload-icon {
                font-size: 48px;
                color: #007bff;
            }

            #file-input {
                display: none;
            }

            .upload-progress {
                margin-top: 20px;
            }

            .progress-bar {
                width: 100%;
                height: 10px;
                background: #e9ecef;
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 10px;
            }

            .progress-fill {
                height: 100%;
                background: #007bff;
                transition: width 0.3s;
                width: 0%;
            }

            .progress-text {
                font-size: 14px;
                color: #495057;
            }

            .folder-navigation {
                margin-bottom: 20px;
            }

            .folder-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .folder-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 15px;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: white;
            }

            .folder-item:hover {
                border-color: #007bff;
                background: #f8f9ff;
            }

            .folder-icon {
                font-size: 32px;
                color: #ffc107;
                margin-bottom: 8px;
            }

            .folder-name {
                font-size: 14px;
                text-align: center;
                word-break: break-word;
            }

            .media-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
            }

            .media-item {
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                overflow: hidden;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }

            .media-item:hover {
                border-color: #007bff;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .media-item.selected {
                border-color: #007bff;
                background: #f8f9ff;
            }

            .media-item .select-checkbox {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 2;
            }

            .media-preview {
                height: 150px;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .media-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .media-preview .file-icon {
                font-size: 48px;
                color: #6c757d;
            }

            .media-info {
                padding: 12px;
            }

            .media-filename {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .media-meta {
                font-size: 12px;
                color: #6c757d;
                display: flex;
                justify-content: space-between;
            }

            .media-list {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .list-header {
                display: grid;
                grid-template-columns: 40px 1fr 120px 120px 150px 80px;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #e1e5e9;
                font-weight: 500;
                font-size: 14px;
                color: #495057;
            }

            .list-item {
                display: grid;
                grid-template-columns: 40px 1fr 120px 120px 150px 80px;
                gap: 15px;
                padding: 15px;
                border-bottom: 1px solid #e1e5e9;
                align-items: center;
                cursor: pointer;
                transition: background 0.2s;
            }

            .list-item:hover {
                background: #f8f9fa;
            }

            .list-item.selected {
                background: #e6f3ff;
            }

            .list-thumbnail {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .list-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .list-thumbnail .file-icon {
                font-size: 20px;
                color: #6c757d;
            }

            .loading-indicator {
                text-align: center;
                padding: 60px;
                color: #6c757d;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #6c757d;
            }

            .empty-icon {
                font-size: 64px;
                color: #e9ecef;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                margin-bottom: 10px;
                color: #495057;
            }

            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }

            .modal.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-content {
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e1e5e9;
            }

            .modal-header h2 {
                margin: 0;
                color: #2c3e50;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6c757d;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }

            .close-btn:hover {
                background: #f8f9fa;
            }

            .modal-body {
                padding: 20px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }

            .preview-container {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 300px;
            }

            .preview-container img {
                max-width: 100%;
                max-height: 100%;
                border-radius: 4px;
            }

            .preview-container .file-icon {
                font-size: 80px;
                color: #6c757d;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #495057;
            }

            .form-control {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.2s;
            }

            .form-control:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
            }

            .media-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .info-item label {
                font-weight: 500;
                color: #495057;
            }

            .url-copy {
                margin-top: 20px;
            }

            .url-container {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .url-container input {
                flex: 1;
            }

            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 20px;
                border-top: 1px solid #e1e5e9;
            }

            @media (max-width: 768px) {
                .media-header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }

                .media-controls {
                    flex-direction: column;
                    gap: 15px;
                }

                .media-filters {
                    flex-direction: column;
                    gap: 10px;
                }

                .search-input {
                    width: 100%;
                }

                .media-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                }

                .modal-body {
                    grid-template-columns: 1fr;
                }

                .list-header,
                .list-item {
                    grid-template-columns: 1fr;
                    gap: 5px;
                }

                .list-item > div:not(:first-child) {
                    font-size: 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Upload button
        document.getElementById('upload-btn').addEventListener('click', () => {
            this.toggleUploadZone();
        });

        // File input
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleView(btn.dataset.view);
            });
        });

        // Search
        document.getElementById('media-search').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterMedia();
        });

        // Filter
        document.getElementById('media-filter').addEventListener('change', (e) => {
            this.filterType = e.target.value;
            this.filterMedia();
        });

        // New folder
        document.getElementById('new-folder-btn').addEventListener('click', () => {
            this.showModal('folder-modal');
        });

        // Create folder
        document.getElementById('create-folder').addEventListener('click', () => {
            this.createFolder();
        });

        // Bulk actions
        document.getElementById('bulk-delete').addEventListener('click', () => {
            this.bulkDelete();
        });

        document.getElementById('bulk-move').addEventListener('click', () => {
            this.bulkMove();
        });

        // Modal controls
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal') || e.target.closest('[data-modal]').getAttribute('data-modal');
                this.hideModal(modalId);
            });
        });

        // Media form
        document.getElementById('save-media').addEventListener('click', () => {
            this.saveMediaDetails();
        });

        document.getElementById('delete-media').addEventListener('click', () => {
            this.deleteMedia();
        });

        // Copy URL
        document.getElementById('copy-url').addEventListener('click', () => {
            this.copyMediaUrl();
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    toggleUploadZone() {
        const uploadZone = document.getElementById('upload-zone');
        const isVisible = uploadZone.style.display !== 'none';
        uploadZone.style.display = isVisible ? 'none' : 'block';
    }

    handleFileSelect(files) {
        const fileArray = Array.from(files);
        this.uploadFiles(fileArray);
    }

    async uploadFiles(files) {
        const uploadZone = document.getElementById('upload-zone');
        const uploadProgress = uploadZone.querySelector('.upload-progress');
        const progressFill = uploadProgress.querySelector('.progress-fill');
        const progressText = uploadProgress.querySelector('.progress-text');
        
        uploadProgress.style.display = 'block';
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', this.currentFolder || '');
            
            try {
                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.mediaFiles.push(result.media);
                }
                
                const progress = ((i + 1) / files.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
                
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
        
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            this.toggleUploadZone();
            this.renderMedia();
        }, 1000);
    }

    toggleView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide views
        document.getElementById('media-grid').style.display = view === 'grid' ? 'grid' : 'none';
        document.getElementById('media-list').style.display = view === 'list' ? 'block' : 'none';
        
        this.renderMedia();
    }

    filterMedia() {
        let filteredFiles = this.mediaFiles;
        
        // Filter by search query
        if (this.searchQuery) {
            filteredFiles = filteredFiles.filter(file => 
                file.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                file.filename.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        // Filter by type
        if (this.filterType !== 'all') {
            filteredFiles = filteredFiles.filter(file => {
                const type = this.getFileType(file.mimetype);
                return type === this.filterType;
            });
        }
        
        // Filter by folder
        if (this.currentFolder) {
            filteredFiles = filteredFiles.filter(file => file.folder === this.currentFolder);
        }
        
        this.renderMedia(filteredFiles);
    }

    getFileType(mimetype) {
        if (mimetype.startsWith('image/')) {
          return 'images';
        }
        if (mimetype.startsWith('video/')) {
          return 'videos';
        }
        if (mimetype.startsWith('audio/')) {
          return 'audio';
        }
        return 'documents';
    }

    async loadMediaLibrary() {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        
        try {
            const [mediaResponse, foldersResponse] = await Promise.all([
                fetch('/api/media'),
                fetch('/api/media/folders')
            ]);
            
            this.mediaFiles = await mediaResponse.json();
            this.folders = await foldersResponse.json();
            
            this.renderFolders();
            this.renderMedia();
            
        } catch (error) {
            console.error('Failed to load media library:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    renderFolders() {
        const folderNav = document.getElementById('folder-nav');
        
        if (this.folders.length === 0) {
            folderNav.style.display = 'none';
            return;
        }
        
        folderNav.style.display = 'block';
        folderNav.innerHTML = `
            <div class="folder-grid">
                ${this.folders.map(folder => `
                    <div class="folder-item" data-folder="${folder.id}">
                        <i class="fas fa-folder folder-icon"></i>
                        <span class="folder-name">${folder.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add folder click listeners
        folderNav.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateToFolder(item.dataset.folder);
            });
        });
    }

    navigateToFolder(folderId) {
        this.currentFolder = folderId;
        this.updateBreadcrumb();
        this.filterMedia();
    }

    updateBreadcrumb() {
        const breadcrumbPath = document.querySelector('.breadcrumb-path');
        const rootItem = document.querySelector('.breadcrumb-item[data-folder="root"]');
        
        if (this.currentFolder) {
            const folder = this.folders.find(f => f.id === this.currentFolder);
            if (folder) {
                breadcrumbPath.innerHTML = `
                    <span> / </span>
                    <span class="breadcrumb-item active">${folder.name}</span>
                `;
                rootItem.classList.remove('active');
                rootItem.addEventListener('click', () => {
                    this.navigateToFolder(null);
                });
            }
        } else {
            breadcrumbPath.innerHTML = '';
            rootItem.classList.add('active');
        }
    }

    renderMedia(files = this.mediaFiles) {
        const gridContainer = document.getElementById('media-grid');
        const listContainer = document.getElementById('media-list');
        const emptyState = document.getElementById('empty-state');
        
        if (files.length === 0) {
            gridContainer.style.display = 'none';
            listContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        if (this.currentView === 'grid') {
            this.renderGridView(files);
        } else {
            this.renderListView(files);
        }
    }

    renderGridView(files) {
        const container = document.getElementById('media-grid');
        container.innerHTML = files.map(file => `
            <div class="media-item" data-id="${file.id}">
                <input type="checkbox" class="select-checkbox" data-id="${file.id}">
                <div class="media-preview">
                    ${this.getPreviewHTML(file)}
                </div>
                <div class="media-info">
                    <div class="media-filename">${file.title || file.filename}</div>
                    <div class="media-meta">
                        <span>${this.formatFileSize(file.size)}</span>
                        <span>${this.formatDate(file.created_at)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('.media-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('select-checkbox')) {
                    this.toggleFileSelection(item.dataset.id);
                } else {
                    this.showMediaDetails(item.dataset.id);
                }
            });
        });
        
        container.querySelectorAll('.select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleFileSelection(checkbox.dataset.id);
            });
        });
    }

    renderListView(files) {
        const container = document.getElementById('media-list');
        container.innerHTML = `
            <div class="list-header">
                <div></div>
                <div>Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Modified</div>
                <div>Actions</div>
            </div>
            ${files.map(file => `
                <div class="list-item" data-id="${file.id}">
                    <input type="checkbox" class="select-checkbox" data-id="${file.id}">
                    <div class="list-thumbnail">
                        ${this.getPreviewHTML(file, true)}
                    </div>
                    <div>${file.title || file.filename}</div>
                    <div>${this.getFileType(file.mimetype)}</div>
                    <div>${this.formatFileSize(file.size)}</div>
                    <div>${this.formatDate(file.created_at)}</div>
                    <div>
                        <button class="btn btn-sm btn-secondary" onclick="mediaManager.showMediaDetails('${file.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
        
        // Add event listeners
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('select-checkbox')) {
                    this.toggleFileSelection(item.dataset.id);
                } else {
                    this.showMediaDetails(item.dataset.id);
                }
            });
        });
    }

    getPreviewHTML(file, small = false) {
        const iconClass = small ? 'file-icon' : 'file-icon';
        
        if (file.mimetype.startsWith('image/')) {
            return `<img src="${file.url}" alt="${file.alt || file.filename}">`;
        } else if (file.mimetype.startsWith('video/')) {
            return `<i class="fas fa-video ${iconClass}"></i>`;
        } else if (file.mimetype.startsWith('audio/')) {
            return `<i class="fas fa-music ${iconClass}"></i>`;
        } else if (file.mimetype.includes('pdf')) {
            return `<i class="fas fa-file-pdf ${iconClass}"></i>`;
        } else if (file.mimetype.includes('document') || file.mimetype.includes('word')) {
            return `<i class="fas fa-file-word ${iconClass}"></i>`;
        } else {
            return `<i class="fas fa-file ${iconClass}"></i>`;
        }
    }

    toggleFileSelection(fileId) {
        const item = document.querySelector(`[data-id="${fileId}"]`);
        const checkbox = item.querySelector('.select-checkbox');
        
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
            item.classList.remove('selected');
            checkbox.checked = false;
        } else {
            this.selectedFiles.add(fileId);
            item.classList.add('selected');
            checkbox.checked = true;
        }
        
        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.querySelector('.bulk-actions');
        const selectedCount = document.querySelector('.selected-count');
        
        if (this.selectedFiles.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = `${this.selectedFiles.size} selected`;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    showMediaDetails(fileId) {
        const file = this.mediaFiles.find(f => f.id === fileId);
        if (!file) {
          return;
        }
        
        const modal = document.getElementById('media-modal');
        const previewContainer = modal.querySelector('.preview-container');
        
        // Set preview
        previewContainer.innerHTML = this.getPreviewHTML(file);
        
        // Set form values
        document.getElementById('media-title').value = file.title || '';
        document.getElementById('media-alt').value = file.alt || '';
        document.getElementById('media-description').value = file.description || '';
        document.getElementById('media-folder').value = file.folder || '';
        document.getElementById('media-url').value = file.url;
        
        // Set file info
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
        document.getElementById('file-dimensions').textContent = file.dimensions || 'N/A';
        document.getElementById('upload-date').textContent = this.formatDate(file.created_at);
        document.getElementById('file-type').textContent = file.mimetype;
        
        // Store current file ID
        modal.dataset.fileId = fileId;
        
        // Populate folder select
        this.populateFolderSelect(document.getElementById('media-folder'));
        
        this.showModal('media-modal');
    }

    populateFolderSelect(selectElement) {
        selectElement.innerHTML = '<option value="">Root</option>';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            selectElement.appendChild(option);
        });
    }

    async saveMediaDetails() {
        const modal = document.getElementById('media-modal');
        const {fileId} = modal.dataset;
        
        const formData = {
            title: document.getElementById('media-title').value,
            alt: document.getElementById('media-alt').value,
            description: document.getElementById('media-description').value,
            folder: document.getElementById('media-folder').value
        };
        
        try {
            const response = await fetch(`/api/media/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const updatedFile = await response.json();
                const index = this.mediaFiles.findIndex(f => f.id === fileId);
                if (index !== -1) {
                    this.mediaFiles[index] = updatedFile;
                }
                this.renderMedia();
                this.hideModal('media-modal');
            }
        } catch (error) {
            console.error('Failed to save media details:', error);
        }
    }

    async deleteMedia() {
        const modal = document.getElementById('media-modal');
        const {fileId} = modal.dataset;
        
        if (confirm('Are you sure you want to delete this media file?')) {
            try {
                const response = await fetch(`/api/media/${fileId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.mediaFiles = this.mediaFiles.filter(f => f.id !== fileId);
                    this.renderMedia();
                    this.hideModal('media-modal');
                }
            } catch (error) {
                console.error('Failed to delete media:', error);
            }
        }
    }

    copyMediaUrl() {
        const urlInput = document.getElementById('media-url');
        urlInput.select();
        document.execCommand('copy');
        
        const copyBtn = document.getElementById('copy-url');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }

    async createFolder() {
        const folderName = document.getElementById('folder-name').value;
        const parentFolder = document.getElementById('folder-parent').value;
        
        if (!folderName.trim()) {
            alert('Please enter a folder name');
            return;
        }
        
        try {
            const response = await fetch('/api/media/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    parent: parentFolder || null
                })
            });
            
            if (response.ok) {
                const newFolder = await response.json();
                this.folders.push(newFolder);
                this.renderFolders();
                this.hideModal('folder-modal');
                document.getElementById('folder-form').reset();
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    }

    async bulkDelete() {
        if (this.selectedFiles.size === 0) {
          return;
        }
        
        const message = `Are you sure you want to delete ${this.selectedFiles.size} selected files?`;
        if (confirm(message)) {
            try {
                const promises = Array.from(this.selectedFiles).map(fileId =>
                    fetch(`/api/media/${fileId}`, { method: 'DELETE' })
                );
                
                await Promise.all(promises);
                
                this.mediaFiles = this.mediaFiles.filter(f => !this.selectedFiles.has(f.id));
                this.selectedFiles.clear();
                this.renderMedia();
                this.updateBulkActions();
            } catch (error) {
                console.error('Failed to bulk delete:', error);
            }
        }
    }

    bulkMove() {
        if (this.selectedFiles.size === 0) {
          return;
        }
        
        const targetFolder = prompt('Enter target folder ID (or leave empty for root):');
        if (targetFolder !== null) {
            this.moveFilesToFolder(Array.from(this.selectedFiles), targetFolder || null);
        }
    }

    async moveFilesToFolder(fileIds, folderId) {
        try {
            const promises = fileIds.map(fileId =>
                fetch(`/api/media/${fileId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ folder: folderId })
                })
            );
            
            await Promise.all(promises);
            
            // Update local data
            fileIds.forEach(fileId => {
                const file = this.mediaFiles.find(f => f.id === fileId);
                if (file) {
                    file.folder = folderId;
                }
            });
            
            this.selectedFiles.clear();
            this.renderMedia();
            this.updateBulkActions();
        } catch (error) {
            console.error('Failed to move files:', error);
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    formatFileSize(bytes) {
        if (bytes === 0) {
          return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize media manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediaManager = new MediaManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaManager;
}
