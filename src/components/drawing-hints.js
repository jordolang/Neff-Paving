/**
 * Drawing Hints and Visual Feedback System
 * Provides contextual hints and visual feedback during drawing operations
 */

export class DrawingHints {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            enableHints: true,
            enableVertexHighlights: true,
            enableAreaPreview: true,
            enableClickFeedback: true,
            enableKeyboardShortcuts: true,
            hintPosition: 'top-right',
            autoHide: true,
            autoHideDelay: 5000,
            ...options
        };
        
        this.isDrawing = false;
        this.currentShape = null;
        this.vertices = [];
        this.hintContainer = null;
        this.previewPolygon = null;
        this.vertexMarkers = [];
        this.lastClickTime = 0;
        this.clickCount = 0;
        
        this.init();
    }

    /**
     * Initialize drawing hints system
     */
    init() {
        this.createHintContainer();
        this.setupEventListeners();
        this.initializeKeyboardShortcuts();
        this.addStyles();
        
        // Show initial hint
        this.showHint('click-to-start', 'Click on the map to start drawing your boundary');
    }

    /**
     * Create hint container
     */
    createHintContainer() {
        this.hintContainer = document.createElement('div');
        this.hintContainer.className = 'drawing-hints-container';
        this.hintContainer.style.display = 'none';
        
        this.hintContainer.innerHTML = `
            <div class="hint-content">
                <div class="hint-icon">💡</div>
                <div class="hint-text">
                    <div class="hint-title"></div>
                    <div class="hint-description"></div>
                </div>
                <button class="hint-close" aria-label="Close hint">&times;</button>
            </div>
        `;
        
        // Position hint container
        this.positionHintContainer();
        
        // Add to map container
        const mapContainer = this.map.getDiv();
        mapContainer.appendChild(this.hintContainer);
    }

    /**
     * Position hint container based on options
     */
    positionHintContainer() {
        const positions = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' },
            'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
        };
        
        const position = positions[this.options.hintPosition] || positions['top-right'];
        
        Object.assign(this.hintContainer.style, {
            position: 'absolute',
            zIndex: '1000',
            ...position
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Map click events
        this.map.addListener('click', (e) => this.handleMapClick(e));
        
        // Drawing events
        this.map.addListener('rightclick', (e) => this.handleRightClick(e));
        
        // Mouse move for preview
        this.map.addListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Hint close button
        this.hintContainer.querySelector('.hint-close').addEventListener('click', () => {
            this.hideHint();
        });
        
        // Window resize
        window.addEventListener('resize', () => this.positionHintContainer());
    }

    /**
     * Handle map click events
     */
    handleMapClick(e) {
        const currentTime = Date.now();
        
        // Check for double-click
        if (currentTime - this.lastClickTime < 500) {
            this.clickCount++;
            if (this.clickCount === 2) {
                this.handleDoubleClick(e);
                this.clickCount = 0;
                return;
            }
        } else {
            this.clickCount = 1;
        }
        
        this.lastClickTime = currentTime;
        
        // Single click handling
        setTimeout(() => {
            if (this.clickCount === 1) {
                this.handleSingleClick(e);
            }
            this.clickCount = 0;
        }, 300);
        
        // Visual click feedback
        if (this.options.enableClickFeedback) {
            this.showClickFeedback(e.latLng);
        }
    }

    /**
     * Handle single click
     */
    handleSingleClick(e) {
        if (!this.isDrawing) {
            this.startDrawing(e.latLng);
        } else {
            this.addVertex(e.latLng);
        }
    }

    /**
     * Handle double-click to finish drawing
     */
    handleDoubleClick(e) {
        if (this.isDrawing && this.vertices.length >= 3) {
            this.finishDrawing();
            this.showHint('shape-completed', 'Shape completed! Click "Calculate Area" to get measurements.');
        }
    }

    /**
     * Handle right-click for context menu
     */
    handleRightClick(e) {
        if (this.isDrawing) {
            e.preventDefault();
            this.showContextMenu(e);
        }
    }

    /**
     * Handle mouse move for preview
     */
    handleMouseMove(e) {
        if (this.isDrawing && this.vertices.length > 0 && this.options.enableAreaPreview) {
            this.updatePreview(e.latLng);
        }
    }

    /**
     * Start drawing process
     */
    startDrawing(latLng) {
        this.isDrawing = true;
        this.vertices = [latLng];
        
        // Create first vertex marker
        this.addVertexMarker(latLng, 0);
        
        // Show next hint
        this.showHint('continue-drawing', 'Click to add more points. Double-click to finish.');
        
        // Trigger drawing started event
        this.dispatchEvent('drawingStarted', { startPoint: latLng });
    }

    /**
     * Add vertex to shape
     */
    addVertex(latLng) {
        this.vertices.push(latLng);
        
        // Add vertex marker
        this.addVertexMarker(latLng, this.vertices.length - 1);
        
        // Update hints based on vertex count
        if (this.vertices.length === 2) {
            this.showHint('second-point', 'Great! Add more points or double-click to finish.');
        } else if (this.vertices.length === 3) {
            this.showHint('shape-forming', 'Shape is forming! Continue adding points or double-click to finish.');
        } else if (this.vertices.length >= 5) {
            this.showHint('many-points', 'Detailed shape! Double-click to finish or right-click for options.');
        }
        
        // Update preview
        this.updatePreview();
        
        // Trigger vertex added event
        this.dispatchEvent('vertexAdded', { 
            vertex: latLng, 
            index: this.vertices.length - 1,
            totalVertices: this.vertices.length 
        });
    }

    /**
     * Add vertex marker with highlight
     */
    addVertexMarker(latLng, index) {
        if (!this.options.enableVertexHighlights) return;
        
        const marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: index === 0 ? '#4CAF50' : '#2196F3',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6
            },
            title: index === 0 ? 'Start point (double-click to finish)' : `Point ${index + 1}`,
            zIndex: 1000
        });
        
        // Add click handler for first vertex (to close shape)
        if (index === 0) {
            marker.addListener('click', () => {
                if (this.vertices.length >= 3) {
                    this.finishDrawing();
                }
            });
        }
        
        this.vertexMarkers.push(marker);
    }

    /**
     * Update area preview
     */
    updatePreview(currentMousePos = null) {
        if (!this.options.enableAreaPreview || this.vertices.length < 2) return;
        
        // Remove existing preview
        if (this.previewPolygon) {
            this.previewPolygon.setMap(null);
        }
        
        // Create preview path
        let previewPath = [...this.vertices];
        
        // Add current mouse position if provided
        if (currentMousePos) {
            previewPath.push(currentMousePos);
        }
        
        // Close the shape if we have enough vertices
        if (previewPath.length >= 3) {
            // Create preview polygon
            this.previewPolygon = new google.maps.Polygon({
                paths: previewPath,
                map: this.map,
                strokeColor: '#ff6b6b',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#ff6b6b',
                fillOpacity: 0.1,
                zIndex: 1
            });
            
            // Calculate and show area preview
            this.showAreaPreview(previewPath);
        }
    }

    /**
     * Show area preview in hint
     */
    showAreaPreview(path) {
        const area = google.maps.geometry.spherical.computeArea(path);
        const areaInSqFt = (area * 10.764).toFixed(0);
        const areaInAcres = (area * 0.000247105).toFixed(4);
        
        this.showHint('area-preview', 
            `Preview: ${areaInSqFt} sq ft (${areaInAcres} acres)`,
            'This is a live preview. Double-click to finish and get exact measurements.'
        );
    }

    /**
     * Finish drawing
     */
    finishDrawing() {
        if (!this.isDrawing || this.vertices.length < 3) return;
        
        this.isDrawing = false;
        
        // Remove preview
        if (this.previewPolygon) {
            this.previewPolygon.setMap(null);
            this.previewPolygon = null;
        }
        
        // Create final polygon
        const finalPolygon = new google.maps.Polygon({
            paths: this.vertices,
            map: this.map,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            zIndex: 2
        });
        
        this.currentShape = finalPolygon;
        
        // Update vertex markers to show completion
        this.updateVertexMarkersForCompletion();
        
        // Show completion hint
        this.showHint('drawing-complete', 
            'Drawing complete!',
            'Click "Calculate Area" to get precise measurements, or start a new drawing.'
        );
        
        // Trigger drawing completed event
        this.dispatchEvent('drawingCompleted', { 
            vertices: this.vertices,
            shape: finalPolygon
        });
    }

    /**
     * Update vertex markers for completion
     */
    updateVertexMarkersForCompletion() {
        this.vertexMarkers.forEach((marker, index) => {
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 5
            });
            
            marker.setTitle(`Vertex ${index + 1} (completed)`);
        });
    }

    /**
     * Show visual click feedback
     */
    showClickFeedback(latLng) {
        const clickFeedback = new google.maps.Marker({
            position: latLng,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10
            },
            zIndex: 2000
        });
        
        // Animate and remove
        setTimeout(() => {
            clickFeedback.setIcon({
                ...clickFeedback.getIcon(),
                scale: 20,
                fillOpacity: 0.2
            });
            
            setTimeout(() => {
                clickFeedback.setMap(null);
            }, 200);
        }, 100);
    }

    /**
     * Show context menu
     */
    showContextMenu(e) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'drawing-context-menu';
        contextMenu.innerHTML = `
            <div class="context-item" data-action="finish">Finish Drawing</div>
            <div class="context-item" data-action="undo">Undo Last Point</div>
            <div class="context-item" data-action="cancel">Cancel Drawing</div>
        `;
        
        // Position menu
        const pixel = this.map.getProjection().fromLatLngToPoint(e.latLng);
        contextMenu.style.left = (pixel.x * Math.pow(2, this.map.getZoom())) + 'px';
        contextMenu.style.top = (pixel.y * Math.pow(2, this.map.getZoom())) + 'px';
        
        // Add to map
        this.map.getDiv().appendChild(contextMenu);
        
        // Handle menu actions
        contextMenu.addEventListener('click', (menuE) => {
            const action = menuE.target.dataset.action;
            
            switch (action) {
                case 'finish':
                    if (this.vertices.length >= 3) {
                        this.finishDrawing();
                    }
                    break;
                case 'undo':
                    this.undoLastVertex();
                    break;
                case 'cancel':
                    this.cancelDrawing();
                    break;
            }
            
            contextMenu.remove();
        });
        
        // Remove menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (contextMenu.parentNode) {
                    contextMenu.remove();
                }
            }, { once: true });
        }, 100);
    }

    /**
     * Undo last vertex
     */
    undoLastVertex() {
        if (this.vertices.length > 1) {
            this.vertices.pop();
            
            // Remove last vertex marker
            const lastMarker = this.vertexMarkers.pop();
            if (lastMarker) {
                lastMarker.setMap(null);
            }
            
            // Update preview
            this.updatePreview();
            
            this.showHint('vertex-removed', 'Last point removed. Continue drawing or double-click to finish.');
        }
    }

    /**
     * Cancel drawing
     */
    cancelDrawing() {
        this.isDrawing = false;
        this.vertices = [];
        
        // Remove all vertex markers
        this.vertexMarkers.forEach(marker => marker.setMap(null));
        this.vertexMarkers = [];
        
        // Remove preview
        if (this.previewPolygon) {
            this.previewPolygon.setMap(null);
            this.previewPolygon = null;
        }
        
        this.showHint('drawing-cancelled', 'Drawing cancelled. Click on the map to start a new drawing.');
        
        // Trigger drawing cancelled event
        this.dispatchEvent('drawingCancelled');
    }

    /**
     * Clear all drawings
     */
    clearDrawings() {
        this.cancelDrawing();
        
        if (this.currentShape) {
            this.currentShape.setMap(null);
            this.currentShape = null;
        }
        
        this.showHint('click-to-start', 'All drawings cleared. Click on the map to start drawing your boundary.');
    }

    /**
     * Show hint
     */
    showHint(type, title, description = '') {
        if (!this.options.enableHints) return;
        
        const hintTypes = {
            'click-to-start': '🎯',
            'continue-drawing': '➕',
            'second-point': '✌️',
            'shape-forming': '🔷',
            'many-points': '📍',
            'area-preview': '📏',
            'shape-completed': '✅',
            'drawing-complete': '🎉',
            'vertex-removed': '↩️',
            'drawing-cancelled': '❌',
            'error': '⚠️'
        };
        
        const titleElement = this.hintContainer.querySelector('.hint-title');
        const descriptionElement = this.hintContainer.querySelector('.hint-description');
        const iconElement = this.hintContainer.querySelector('.hint-icon');
        
        titleElement.textContent = title;
        descriptionElement.textContent = description;
        iconElement.textContent = hintTypes[type] || '💡';
        
        // Show hint
        this.hintContainer.style.display = 'block';
        this.hintContainer.classList.add('hint-show');
        
        // Auto-hide if enabled
        if (this.options.autoHide) {
            clearTimeout(this.hideTimer);
            this.hideTimer = setTimeout(() => {
                this.hideHint();
            }, this.options.autoHideDelay);
        }
    }

    /**
     * Hide hint
     */
    hideHint() {
        this.hintContainer.classList.remove('hint-show');
        setTimeout(() => {
            this.hintContainer.style.display = 'none';
        }, 300);
    }

    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        if (!this.options.enableKeyboardShortcuts) return;
        
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when drawing
            if (!this.isDrawing) return;
            
            switch (e.key) {
                case 'Escape':
                    this.cancelDrawing();
                    break;
                case 'Enter':
                    if (this.vertices.length >= 3) {
                        this.finishDrawing();
                    }
                    break;
                case 'Backspace':
                case 'Delete':
                    this.undoLastVertex();
                    e.preventDefault();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        this.undoLastVertex();
                        e.preventDefault();
                    }
                    break;
            }
        });
        
        // Show keyboard shortcuts hint
        this.showKeyboardShortcutsHint();
    }

    /**
     * Show keyboard shortcuts hint
     */
    showKeyboardShortcutsHint() {
        const shortcutsHint = document.createElement('div');
        shortcutsHint.className = 'keyboard-shortcuts-hint';
        shortcutsHint.innerHTML = `
            <div class="shortcuts-title">Keyboard Shortcuts</div>
            <div class="shortcuts-list">
                <div><kbd>Enter</kbd> Finish drawing</div>
                <div><kbd>Escape</kbd> Cancel drawing</div>
                <div><kbd>Backspace</kbd> Undo last point</div>
                <div><kbd>Ctrl+Z</kbd> Undo last point</div>
            </div>
        `;
        
        // Position and add to map
        shortcutsHint.style.position = 'absolute';
        shortcutsHint.style.bottom = '20px';
        shortcutsHint.style.left = '20px';
        shortcutsHint.style.zIndex = '999';
        
        this.map.getDiv().appendChild(shortcutsHint);
        
        // Remove after delay
        setTimeout(() => {
            if (shortcutsHint.parentNode) {
                shortcutsHint.remove();
            }
        }, 8000);
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`drawingHints:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Add styles
     */
    addStyles() {
        if (document.getElementById('drawing-hints-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'drawing-hints-styles';
        style.textContent = `
            .drawing-hints-container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 0;
                max-width: 300px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                pointer-events: auto;
            }
            
            .drawing-hints-container.hint-show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .hint-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
            }
            
            .hint-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .hint-text {
                flex: 1;
            }
            
            .hint-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .hint-description {
                font-size: 0.875rem;
                color: #6b7280;
                line-height: 1.4;
            }
            
            .hint-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .hint-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .drawing-context-menu {
                position: absolute;
                background: white;
                border-radius: 6px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                padding: 8px 0;
                min-width: 160px;
                z-index: 2000;
            }
            
            .context-item {
                padding: 12px 16px;
                cursor: pointer;
                font-size: 0.875rem;
                color: #374151;
                transition: background-color 0.2s;
            }
            
            .context-item:hover {
                background: #f3f4f6;
            }
            
            .keyboard-shortcuts-hint {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 16px;
                border-radius: 8px;
                font-size: 0.875rem;
                animation: slideInUp 0.3s ease;
            }
            
            .shortcuts-title {
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .shortcuts-list div {
                margin-bottom: 4px;
            }
            
            .shortcuts-list kbd {
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.75rem;
                margin-right: 8px;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Mobile styles */
            @media (max-width: 768px) {
                .drawing-hints-container {
                    max-width: 280px;
                    font-size: 0.875rem;
                }
                
                .hint-content {
                    padding: 12px;
                    gap: 10px;
                }
                
                .hint-icon {
                    font-size: 1.25rem;
                }
                
                .keyboard-shortcuts-hint {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Get current drawing state
     */
    getDrawingState() {
        return {
            isDrawing: this.isDrawing,
            vertices: this.vertices,
            vertexCount: this.vertices.length,
            hasShape: this.currentShape !== null
        };
    }

    /**
     * Destroy drawing hints system
     */
    destroy() {
        // Cancel any active drawing
        this.cancelDrawing();
        
        // Remove hint container
        if (this.hintContainer && this.hintContainer.parentNode) {
            this.hintContainer.parentNode.removeChild(this.hintContainer);
        }
        
        // Remove current shape
        if (this.currentShape) {
            this.currentShape.setMap(null);
        }
        
        // Remove preview
        if (this.previewPolygon) {
            this.previewPolygon.setMap(null);
        }
        
        // Remove vertex markers
        this.vertexMarkers.forEach(marker => marker.setMap(null));
        
        // Remove styles
        const styles = document.getElementById('drawing-hints-styles');
        if (styles) {
            styles.remove();
        }
        
        // Clear timers
        clearTimeout(this.hideTimer);
    }
}
