import "../chunks/chunk-COaX8i6R.js";
import { i as inject, a as injectSpeedInsights } from "../chunks/chunk-cLTX0g4V.js";
import { g as getAssetPath, i as initializeAssetOptimization } from "../chunks/chunk-DOUdzTfx.js";
import { r as requireAos, g as getDefaultExportFromCjs, a as gsapWithCSS } from "../chunks/chunk-BODwLEOT.js";
class SimpleMarkdownParser {
  static parse(markdown) {
    let html = markdown;
    const frontmatterMatch = html.match(/^---\n([\s\S]*?)\n---\n/);
    let frontmatter = {};
    if (frontmatterMatch) {
      const frontmatterText = frontmatterMatch[1];
      frontmatterText.split("\n").forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > -1) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value === "true") {
            value = true;
          } else if (value === "false") {
            value = false;
          }
          frontmatter[key] = value;
        }
      });
      html = html.replace(frontmatterMatch[0], "");
    }
    html = this.convertMarkdownToHtml(html);
    return { frontmatter, content: html };
  }
  static convertMarkdownToHtml(markdown) {
    let html = markdown;
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    html = html.replace(/^\s*\* (.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\s*- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\s*\+ (.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\s*✅ (.*$)/gim, '<li class="checkmark">✅ $1</li>');
    html = html.replace(/^\s*\d+\. (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
      return `<ul>${match}</ul>`;
    });
    html = this.convertTables(html);
    const paragraphs = html.split("\n\n");
    html = paragraphs.map((p) => {
      p = p.trim();
      if (!p) return "";
      if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<ol") || p.startsWith("<table")) {
        return p;
      }
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
    return html;
  }
  static convertTables(html) {
    const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g;
    return html.replace(tableRegex, (match, header, rows) => {
      const headerCells = header.split("|").map((cell) => cell.trim()).filter((cell) => cell);
      const headerRow = `<tr>${headerCells.map((cell) => `<th>${cell}</th>`).join("")}</tr>`;
      const bodyRows = rows.trim().split("\n").map((row) => {
        const cells = row.split("|").map((cell) => cell.trim()).filter((cell) => cell);
        return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
      }).join("");
      return `<table class="blog-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
    });
  }
}
class BlogSystem {
  constructor() {
    this.posts = [];
    this.categories = /* @__PURE__ */ new Set();
  }
  // Get hardcoded blog post data (simpler than fetching markdown files)
  getBlogPostsData() {
    return [
      {
        slug: "how-to-create-a-blog-post",
        filename: "2025-07-03-how-to-create-a-blog-post.md",
        title: "How to Create a Blog Post for Neff Paving",
        date: "2025-07-03",
        category: "Guide",
        readTime: "4 min read",
        excerpt: "Learn how to create effective blog posts for Neff Paving, complete with structure, images, and metadata.",
        image: "/assets/images/blog/guideline-image.jpg",
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
        slug: "asphalt-maintenance-guide",
        filename: "2024-12-15-asphalt-maintenance-guide.md",
        title: "Understanding Asphalt Maintenance: A Complete Guide",
        date: "2024-12-15",
        category: "Maintenance",
        readTime: "5 min read",
        excerpt: "Learn how regular maintenance can extend the life of your pavement by 50% or more. Discover the key signs to watch for and timing for different maintenance services.",
        image: "/assets/images/blog/asphalt-maintenance-guide.jpg",
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
        slug: "paving-material-selection",
        filename: "2024-12-08-paving-material-selection.md",
        title: "Choosing the Right Paving Solutions for Your Property",
        date: "2024-12-08",
        category: "Materials",
        readTime: "7 min read",
        excerpt: "Not all paving materials are created equal. Discover the best practices for selecting materials based on traffic load, climate, and budget considerations.",
        image: "/assets/images/blog/paving-material-selection.jpg",
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
        slug: "winter-paving-preparation",
        filename: "2024-12-01-winter-paving-preparation.md",
        title: "Preparing Your Pavement for Winter Weather",
        date: "2024-12-01",
        category: "Seasonal",
        readTime: "6 min read",
        excerpt: "Ohio winters can be harsh on pavement. Learn essential preparation steps and protective measures to minimize winter damage and extend surface life.",
        image: "/assets/images/blog/winter-paving-preparation.jpg",
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
      const slug = filename.replace(".md", "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return {
        slug,
        filename,
        ...parsed.frontmatter,
        content: parsed.content
      };
    } catch (error) {
      console.error("Error loading post:", error);
      return null;
    }
  }
  // Get list of available blog posts
  async getPostList() {
    return [
      "2025-07-03-how-to-create-a-blog-post.md",
      "2024-12-15-asphalt-maintenance-guide.md",
      "2024-12-08-paving-material-selection.md",
      "2024-12-01-winter-paving-preparation.md"
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
    if (posts.length > 0) {
      this.posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return this.posts;
  }
  // Get featured posts
  getFeaturedPosts(limit = 3) {
    return this.posts.filter((post) => post.featured).slice(0, limit);
  }
  // Get recent posts
  getRecentPosts(limit = 3) {
    return this.posts.slice(0, limit);
  }
  // Get posts by category
  getPostsByCategory(category) {
    return this.posts.filter((post) => post.category === category);
  }
  // Find post by slug
  getPostBySlug(slug) {
    return this.posts.find((post) => post.slug === slug);
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  // Initialize blog system
  async init() {
    const hardcodedPosts = this.getBlogPostsData();
    this.posts = hardcodedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    try {
      await this.loadAllPosts();
    } catch (error) {
      console.log("Using hardcoded blog data as fallback");
    }
    console.log(`Blog system initialized with ${this.posts.length} posts`);
    return this;
  }
}
if (typeof window !== "undefined") {
  window.BlogSystem = BlogSystem;
  window.SimpleMarkdownParser = SimpleMarkdownParser;
}
const GOOGLE_MAPS_CONFIG = {
  apiKey: "AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk",
  libraries: ["drawing", "geometry", "places"]
};
const DEFAULT_MAP_OPTIONS = {
  zoom: 15,
  center: { lat: 39.9612, lng: -82.9988 },
  // Columbus, Ohio
  mapTypeId: "hybrid",
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
    position: google.maps.ControlPosition.TOP_CENTER
  },
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_CENTER
  },
  scaleControl: true,
  streetViewControl: true,
  streetViewControlOptions: {
    position: google.maps.ControlPosition.RIGHT_TOP
  },
  fullscreenControl: true
};
const DRAWING_MANAGER_OPTIONS = {
  drawingMode: google.maps.drawing.OverlayType.POLYGON,
  drawingControl: true,
  drawingControlOptions: {
    position: google.maps.ControlPosition.TOP_CENTER,
    drawingModes: [
      google.maps.drawing.OverlayType.POLYGON,
      google.maps.drawing.OverlayType.RECTANGLE,
      google.maps.drawing.OverlayType.CIRCLE
    ]
  },
  polygonOptions: {
    fillColor: "#FFD700",
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: "#FFD700",
    clickable: false,
    editable: true,
    zIndex: 1
  },
  rectangleOptions: {
    fillColor: "#FFD700",
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: "#FFD700",
    clickable: false,
    editable: true,
    zIndex: 1
  },
  circleOptions: {
    fillColor: "#FFD700",
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: "#FFD700",
    clickable: false,
    editable: true,
    zIndex: 1
  }
};
class AreaFinder {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      showCalculator: true,
      showAddressSearch: true,
      showAreaInfo: true,
      onAreaCalculated: () => {
      },
      ...options
    };
    this.map = null;
    this.drawingManager = null;
    this.currentShape = null;
    this.currentArea = null;
    this.geocoder = null;
    this.searchBox = null;
    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }
    this.init();
  }
  async init() {
    try {
      this.render();
      await this.loadGoogleMaps();
      this.initMap();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing area finder:", error);
      this.showError("Failed to initialize area finder");
    }
  }
  render() {
    this.container.innerHTML = `
            <div class="area-finder-container">
                ${this.options.showAddressSearch ? `
                <div class="area-finder-controls">
                    <div class="search-section">
                        <label for="address-search">Search Location</label>
                        <div class="search-input-group">
                            <input 
                                type="text" 
                                id="address-search" 
                                placeholder="Enter address or coordinates..."
                                class="form-control"
                            >
                            <button type="button" id="search-btn" class="btn btn-primary">Search</button>
                        </div>
                    </div>
                    
                    <div class="drawing-controls">
                        <button type="button" id="clear-shapes" class="btn btn-outline-danger" disabled>Clear All</button>
                        <button type="button" id="calculate-area" class="btn btn-outline-success" disabled>Calculate Area</button>
                    </div>
                </div>
                ` : ""}
                
                <div class="map-section">
                    <div id="${this.containerId}-map" class="area-finder-map"></div>
                    
                    <div class="map-instructions">
                        <h6>Instructions:</h6>
                        <ul>
                            <li>Click on the map to start drawing</li>
                            <li>Continue clicking to add points</li>
                            <li>Click the first point again to close the shape</li>
                            <li>Use the drawing tools above the map to switch between shapes</li>
                        </ul>
                    </div>
                </div>
                
                ${this.options.showAreaInfo ? `
                <div class="area-info-section">
                    <div id="area-results" class="area-results" style="display: none;">
                        <h6>Area Calculation Results</h6>
                        <div class="results-grid">
                            <div class="result-item">
                                <span class="result-label">Area:</span>
                                <span class="result-value" id="area-sqft">0 sq ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Perimeter:</span>
                                <span class="result-value" id="perimeter-ft">0 ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Acres:</span>
                                <span class="result-value" id="area-acres">0 acres</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Square Meters:</span>
                                <span class="result-value" id="area-sqm">0 m²</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ""}
            </div>
        `;
    this.addStyles();
  }
  addStyles() {
    if (document.getElementById("area-finder-styles")) return;
    const style = document.createElement("style");
    style.id = "area-finder-styles";
    style.textContent = `
            .area-finder-container {
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .area-finder-controls {
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                align-items: end;
            }

            .search-section {
                flex: 1;
                min-width: 300px;
            }

            .search-section label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #374151;
            }

            .search-input-group {
                display: flex;
                gap: 8px;
            }

            .search-input-group input {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
            }

            .search-input-group input:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }

            .drawing-controls {
                display: flex;
                gap: 10px;
            }

            .btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                border: 1px solid transparent;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }

            .btn-primary:hover {
                background: #1d4ed8;
            }

            .btn-outline-danger {
                color: #dc2626;
                border-color: #dc2626;
                background: transparent;
            }

            .btn-outline-danger:hover {
                background: #dc2626;
                color: white;
            }

            .btn-outline-success {
                color: #16a34a;
                border-color: #16a34a;
                background: transparent;
            }

            .btn-outline-success:hover {
                background: #16a34a;
                color: white;
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .map-section {
                position: relative;
            }

            .area-finder-map {
                height: 500px;
                width: 100%;
            }

            .map-instructions {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                max-width: 300px;
                font-size: 13px;
                z-index: 10;
            }

            .map-instructions h6 {
                margin: 0 0 10px 0;
                color: #1f2937;
                font-weight: 600;
            }

            .map-instructions ul {
                margin: 0;
                padding-left: 16px;
                color: #6b7280;
            }

            .map-instructions li {
                margin-bottom: 4px;
            }

            .area-info-section {
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .area-results {
                background: white;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #e5e7eb;
            }

            .area-results h6 {
                margin: 0 0 15px 0;
                color: #1f2937;
                font-weight: 600;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .result-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #f3f4f6;
            }

            .result-label {
                font-weight: 500;
                color: #6b7280;
            }

            .result-value {
                font-weight: 600;
                color: #1f2937;
                font-family: 'Courier New', monospace;
            }

            .error-message {
                background: #fef2f2;
                color: #dc2626;
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid #fecaca;
                margin: 10px;
            }

            @media (max-width: 768px) {
                .area-finder-controls {
                    flex-direction: column;
                    align-items: stretch;
                }

                .search-input-group {
                    flex-direction: column;
                }

                .drawing-controls {
                    justify-content: center;
                }

                .results-grid {
                    grid-template-columns: 1fr;
                }

                .map-instructions {
                    position: static;
                    margin: 10px;
                    max-width: none;
                }
            }
        `;
    document.head.appendChild(style);
  }
  async loadGoogleMaps() {
    return new Promise((resolve, reject) => {
      if (typeof google !== "undefined" && google.maps) {
        resolve();
        return;
      }
      window.initAreaFinderMap = () => {
        delete window.initAreaFinderMap;
        resolve();
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(",")}&callback=initAreaFinderMap`;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  initMap() {
    const mapElement = document.getElementById(`${this.containerId}-map`);
    this.map = new google.maps.Map(mapElement, {
      ...DEFAULT_MAP_OPTIONS,
      center: { lat: 39.9612, lng: -82.9988 }
      // Columbus, Ohio
    });
    this.geocoder = new google.maps.Geocoder();
    this.initDrawingManager();
    this.initSearchBox();
  }
  initDrawingManager() {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      ...DRAWING_MANAGER_OPTIONS,
      map: this.map
    });
    google.maps.event.addListener(this.drawingManager, "overlaycomplete", (event) => {
      this.handleShapeComplete(event);
    });
  }
  initSearchBox() {
    const searchInput = document.getElementById("address-search");
    if (!searchInput) return;
    this.searchBox = new google.maps.places.SearchBox(searchInput);
    this.map.addListener("bounds_changed", () => {
      this.searchBox.setBounds(this.map.getBounds());
    });
    this.searchBox.addListener("places_changed", () => {
      const places = this.searchBox.getPlaces();
      if (places.length === 0) return;
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;
      this.map.setCenter(place.geometry.location);
      this.map.setZoom(18);
    });
  }
  setupEventListeners() {
    const searchBtn = document.getElementById("search-btn");
    const clearBtn = document.getElementById("clear-shapes");
    const calculateBtn = document.getElementById("calculate-area");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => this.searchLocation());
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearShapes());
    }
    if (calculateBtn) {
      calculateBtn.addEventListener("click", () => this.calculateArea());
    }
    const searchInput = document.getElementById("address-search");
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchLocation();
        }
      });
    }
  }
  handleShapeComplete(event) {
    if (this.currentShape) {
      this.currentShape.setMap(null);
    }
    this.currentShape = event.overlay;
    this.drawingManager.setDrawingMode(null);
    this.enableButton("clear-shapes");
    this.enableButton("calculate-area");
    if (this.options.autoCalculate !== false) {
      this.calculateArea();
    }
  }
  async calculateArea() {
    if (!this.currentShape) {
      this.showError("No shape to calculate. Please draw a shape first.");
      return;
    }
    try {
      const coordinates = this.getShapeCoordinates(this.currentShape);
      const response = await fetch("/api/maps/calculate-area", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ coordinates })
      });
      const result = await response.json();
      if (result.success) {
        this.displayAreaResults(result.data);
        this.currentArea = result.data;
        this.options.onAreaCalculated(result.data);
      } else {
        throw new Error(result.message || "Calculation failed");
      }
    } catch (error) {
      console.error("Area calculation error:", error);
      this.showError("Failed to calculate area. Please try again.");
    }
  }
  getShapeCoordinates(shape) {
    let coordinates = [];
    if (shape.getPath) {
      const path = shape.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        coordinates.push({
          lat: latLng.lat(),
          lng: latLng.lng()
        });
      }
    } else if (shape.getBounds) {
      const bounds = shape.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      if (shape.getRadius) {
        const center = shape.getCenter();
        const radius = shape.getRadius();
        const points = 32;
        for (let i = 0; i < points; i++) {
          const angle = i * 360 / points * (Math.PI / 180);
          const lat = center.lat() + radius / 111320 * Math.cos(angle);
          const lng = center.lng() + radius / (111320 * Math.cos(center.lat() * Math.PI / 180)) * Math.sin(angle);
          coordinates.push({ lat, lng });
        }
      } else {
        coordinates = [
          { lat: ne.lat(), lng: ne.lng() },
          { lat: ne.lat(), lng: sw.lng() },
          { lat: sw.lat(), lng: sw.lng() },
          { lat: sw.lat(), lng: ne.lng() }
        ];
      }
    }
    return coordinates;
  }
  displayAreaResults(data) {
    const resultsContainer = document.getElementById("area-results");
    if (!resultsContainer) return;
    document.getElementById("area-sqft").textContent = `${data.areaInSquareFeet.toLocaleString()} sq ft`;
    document.getElementById("perimeter-ft").textContent = `${(data.perimeter * 3.28084).toFixed(2)} ft`;
    document.getElementById("area-acres").textContent = `${data.areaInAcres} acres`;
    document.getElementById("area-sqm").textContent = `${data.area.toLocaleString()} m²`;
    resultsContainer.style.display = "block";
  }
  searchLocation() {
    const searchInput = document.getElementById("address-search");
    const query = searchInput.value.trim();
    if (!query) {
      this.showError("Please enter an address or coordinates");
      return;
    }
    this.geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        this.map.setCenter(location);
        this.map.setZoom(18);
        new google.maps.Marker({
          position: location,
          map: this.map,
          title: "Search Result"
        });
      } else {
        this.showError("Location not found. Please try a different address.");
      }
    });
  }
  clearShapes() {
    if (this.currentShape) {
      this.currentShape.setMap(null);
      this.currentShape = null;
    }
    const resultsContainer = document.getElementById("area-results");
    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }
    this.disableButton("clear-shapes");
    this.disableButton("calculate-area");
    this.currentArea = null;
  }
  enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = false;
    }
  }
  disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
    }
  }
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    this.container.insertBefore(errorDiv, this.container.firstChild);
    setTimeout(() => {
      errorDiv.remove();
    }, 5e3);
  }
  // Public methods
  getAreaData() {
    return this.currentArea;
  }
  setLocation(lat, lng, zoom = 18) {
    if (this.map) {
      this.map.setCenter({ lat, lng });
      this.map.setZoom(zoom);
    }
  }
  destroy() {
    if (this.currentShape) {
      this.currentShape.setMap(null);
    }
    if (this.drawingManager) {
      this.drawingManager.setMap(null);
    }
    this.container.innerHTML = "";
  }
}
const LOADING_STATES = {
  PENDING: "pending",
  LOADING: "loading",
  LOADED: "loaded",
  ERROR: "error"
};
const assetCache = /* @__PURE__ */ new Map();
const loadingPromises = /* @__PURE__ */ new Map();
class AssetLoader {
  constructor(options = {}) {
    this.config = {
      maxConcurrentLoads: 6,
      retryAttempts: 3,
      retryDelay: 1e3,
      enableCache: true,
      enablePreloading: true,
      enableLazyLoading: true,
      ...options
    };
    this.currentLoads = 0;
    this.loadQueue = [];
    this.observers = /* @__PURE__ */ new Map();
    if (this.config.enableLazyLoading && "IntersectionObserver" in window) {
      this.initLazyLoading();
    }
  }
  /**
   * Load a single asset with retry logic
   * @param {string} assetPath - Path to the asset
   * @param {object} options - Loading options
   * @returns {Promise} Loading promise
   */
  async loadAsset(assetPath, options = {}) {
    const resolvedPath = getAssetPath(assetPath);
    const cacheKey = resolvedPath;
    if (this.config.enableCache && assetCache.has(cacheKey)) {
      const cached = assetCache.get(cacheKey);
      if (cached.state === LOADING_STATES.LOADED) {
        return cached.data;
      } else if (cached.state === LOADING_STATES.ERROR && !options.forceRetry) {
        throw cached.error;
      }
    }
    if (loadingPromises.has(cacheKey)) {
      return loadingPromises.get(cacheKey);
    }
    const loadingPromise = this._loadAssetWithRetry(resolvedPath, options);
    loadingPromises.set(cacheKey, loadingPromise);
    try {
      const result = await loadingPromise;
      if (this.config.enableCache) {
        assetCache.set(cacheKey, {
          state: LOADING_STATES.LOADED,
          data: result,
          timestamp: Date.now()
        });
      }
      return result;
    } catch (error) {
      if (this.config.enableCache) {
        assetCache.set(cacheKey, {
          state: LOADING_STATES.ERROR,
          error,
          timestamp: Date.now()
        });
      }
      throw error;
    } finally {
      loadingPromises.delete(cacheKey);
      this.currentLoads--;
      this._processQueue();
    }
  }
  /**
   * Load multiple assets concurrently
   * @param {Array} assets - Array of asset paths or objects
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving to array of results
   */
  async loadAssets(assets, options = {}) {
    const {
      failFast = false,
      maxConcurrent = this.config.maxConcurrentLoads
    } = options;
    const loadPromises = assets.map((asset) => {
      const assetPath = typeof asset === "string" ? asset : asset.path;
      const assetOptions = typeof asset === "object" ? { ...options, ...asset } : options;
      return this.loadAsset(assetPath, assetOptions);
    });
    if (failFast) {
      return Promise.all(loadPromises);
    } else {
      return Promise.allSettled(loadPromises);
    }
  }
  /**
   * Preload critical assets
   * @param {Array} assets - Critical assets to preload
   */
  preloadCriticalAssets(assets = []) {
    if (!this.config.enablePreloading) return;
    const defaultCriticalAssets = [
      { path: "/assets/styles/main.css", type: "style", priority: "high" },
      { path: "/entries/main.js", type: "script", priority: "high" },
      { path: "/assets/images/logo.png", type: "image", priority: "medium" }
    ];
    const allAssets = [...defaultCriticalAssets, ...assets];
    allAssets.forEach((asset) => {
      this._createPreloadLink(asset);
    });
  }
  /**
   * Initialize lazy loading for images
   */
  initLazyLoading() {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this._loadLazyImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "50px 0px",
      threshold: 0.01
    });
    document.querySelectorAll("img[data-src]").forEach((img) => {
      lazyImageObserver.observe(img);
    });
    this.observers.set("lazyImages", lazyImageObserver);
  }
  /**
   * Add lazy loading to new images
   * @param {Element} container - Container to search for images
   */
  addLazyImages(container = document) {
    if (!this.observers.has("lazyImages")) return;
    const observer = this.observers.get("lazyImages");
    container.querySelectorAll("img[data-src]").forEach((img) => {
      observer.observe(img);
    });
  }
  /**
   * Load image with fallback options
   * @param {string} imagePath - Path to the image
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving to Image element
   */
  loadImage(imagePath, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const resolvedPath = getAssetPath(imagePath);
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (options.fallback) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${imagePath} and fallback`));
          fallbackImg.src = getAssetPath(options.fallback);
        } else {
          reject(new Error(`Failed to load image: ${imagePath}`));
        }
      };
      if (options.crossOrigin) img.crossOrigin = options.crossOrigin;
      if (options.decoding) img.decoding = options.decoding;
      if (options.loading) img.loading = options.loading;
      img.src = resolvedPath;
    });
  }
  /**
   * Load CSS file dynamically
   * @param {string} cssPath - Path to the CSS file
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving when CSS is loaded
   */
  loadCSS(cssPath, options = {}) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      const resolvedPath = getAssetPath(cssPath);
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = resolvedPath;
      if (options.media) link.media = options.media;
      if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
      document.head.appendChild(link);
    });
  }
  /**
   * Load JavaScript file dynamically
   * @param {string} jsPath - Path to the JavaScript file
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving when script is loaded
   */
  loadJS(jsPath, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const resolvedPath = getAssetPath(jsPath);
      script.src = resolvedPath;
      script.type = options.type || "text/javascript";
      if (options.async !== void 0) script.async = options.async;
      if (options.defer !== void 0) script.defer = options.defer;
      if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
      if (options.integrity) script.integrity = options.integrity;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${jsPath}`));
      document.head.appendChild(script);
    });
  }
  /**
   * Clear asset cache
   * @param {string} pattern - Pattern to match for clearing (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of assetCache) {
        if (regex.test(key)) {
          assetCache.delete(key);
        }
      }
    } else {
      assetCache.clear();
    }
  }
  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    const stats = {
      size: assetCache.size,
      loaded: 0,
      error: 0,
      totalSize: 0
    };
    for (const [key, value] of assetCache) {
      if (value.state === LOADING_STATES.LOADED) {
        stats.loaded++;
      } else if (value.state === LOADING_STATES.ERROR) {
        stats.error++;
      }
    }
    return stats;
  }
  // Private methods
  async _loadAssetWithRetry(assetPath, options = {}) {
    const { retryAttempts = this.config.retryAttempts } = options;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await this._loadAssetDirect(assetPath, options);
      } catch (error) {
        if (attempt === retryAttempts) {
          throw error;
        }
        await new Promise(
          (resolve) => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }
  async _loadAssetDirect(assetPath, options = {}) {
    const { type = this._detectAssetType(assetPath) } = options;
    switch (type) {
      case "image":
        return this.loadImage(assetPath, options);
      case "css":
        return this.loadCSS(assetPath, options);
      case "js":
        return this.loadJS(assetPath, options);
      default:
        const response = await fetch(assetPath);
        if (!response.ok) {
          throw new Error(`Failed to load asset: ${assetPath} (${response.status})`);
        }
        return response;
    }
  }
  _detectAssetType(assetPath) {
    var _a;
    const extension = (_a = assetPath.split(".").pop()) == null ? void 0 : _a.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
      return "image";
    } else if (extension === "css") {
      return "css";
    } else if (["js", "mjs"].includes(extension)) {
      return "js";
    }
    return "unknown";
  }
  _createPreloadLink(asset) {
    const existingLink = document.querySelector(`link[href="${getAssetPath(asset.path)}"]`);
    if (existingLink) return;
    const link = document.createElement("link");
    link.rel = asset.type === "font" ? "preload" : "prefetch";
    link.href = getAssetPath(asset.path);
    link.as = asset.as || asset.type;
    if (asset.type === "font") {
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
    }
    if (asset.priority === "high") {
      link.fetchPriority = "high";
    }
    document.head.appendChild(link);
  }
  async _loadLazyImage(img) {
    try {
      const src = img.dataset.src;
      if (!src) return;
      const loadedImg = await this.loadImage(src, {
        crossOrigin: img.crossOrigin,
        decoding: "async"
      });
      img.src = loadedImg.src;
      img.removeAttribute("data-src");
      img.classList.add("loaded");
      img.dispatchEvent(new Event("load"));
    } catch (error) {
      console.warn("Failed to load lazy image:", error);
      img.classList.add("error");
    }
  }
  _processQueue() {
    while (this.loadQueue.length > 0 && this.currentLoads < this.config.maxConcurrentLoads) {
      const queueItem = this.loadQueue.shift();
      this.currentLoads++;
      queueItem();
    }
  }
}
const assetLoader = new AssetLoader();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    assetLoader.preloadCriticalAssets();
  });
} else {
  assetLoader.preloadCriticalAssets();
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  return Constructor;
}
/*!
 * Observer 3.13.0
 * https://gsap.com
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
var gsap$1, _coreInitted$1, _win$1, _doc$1, _docEl$1, _body$1, _isTouch, _pointerType, ScrollTrigger$1, _root$1, _normalizer$1, _eventTypes, _context$1, _getGSAP$1 = function _getGSAP2() {
  return gsap$1 || typeof window !== "undefined" && (gsap$1 = window.gsap) && gsap$1.registerPlugin && gsap$1;
}, _startup$1 = 1, _observers = [], _scrollers = [], _proxies = [], _getTime$1 = Date.now, _bridge = function _bridge2(name, value) {
  return value;
}, _integrate = function _integrate2() {
  var core = ScrollTrigger$1.core, data = core.bridge || {}, scrollers = core._scrollers, proxies = core._proxies;
  scrollers.push.apply(scrollers, _scrollers);
  proxies.push.apply(proxies, _proxies);
  _scrollers = scrollers;
  _proxies = proxies;
  _bridge = function _bridge3(name, value) {
    return data[name](value);
  };
}, _getProxyProp = function _getProxyProp2(element, property) {
  return ~_proxies.indexOf(element) && _proxies[_proxies.indexOf(element) + 1][property];
}, _isViewport$1 = function _isViewport2(el) {
  return !!~_root$1.indexOf(el);
}, _addListener$1 = function _addListener2(element, type, func, passive, capture) {
  return element.addEventListener(type, func, {
    passive: passive !== false,
    capture: !!capture
  });
}, _removeListener$1 = function _removeListener2(element, type, func, capture) {
  return element.removeEventListener(type, func, !!capture);
}, _scrollLeft = "scrollLeft", _scrollTop = "scrollTop", _onScroll$1 = function _onScroll2() {
  return _normalizer$1 && _normalizer$1.isPressed || _scrollers.cache++;
}, _scrollCacheFunc = function _scrollCacheFunc2(f, doNotCache) {
  var cachingFunc = function cachingFunc2(value) {
    if (value || value === 0) {
      _startup$1 && (_win$1.history.scrollRestoration = "manual");
      var isNormalizing = _normalizer$1 && _normalizer$1.isPressed;
      value = cachingFunc2.v = Math.round(value) || (_normalizer$1 && _normalizer$1.iOS ? 1 : 0);
      f(value);
      cachingFunc2.cacheID = _scrollers.cache;
      isNormalizing && _bridge("ss", value);
    } else if (doNotCache || _scrollers.cache !== cachingFunc2.cacheID || _bridge("ref")) {
      cachingFunc2.cacheID = _scrollers.cache;
      cachingFunc2.v = f();
    }
    return cachingFunc2.v + cachingFunc2.offset;
  };
  cachingFunc.offset = 0;
  return f && cachingFunc;
}, _horizontal = {
  s: _scrollLeft,
  p: "left",
  p2: "Left",
  os: "right",
  os2: "Right",
  d: "width",
  d2: "Width",
  a: "x",
  sc: _scrollCacheFunc(function(value) {
    return arguments.length ? _win$1.scrollTo(value, _vertical.sc()) : _win$1.pageXOffset || _doc$1[_scrollLeft] || _docEl$1[_scrollLeft] || _body$1[_scrollLeft] || 0;
  })
}, _vertical = {
  s: _scrollTop,
  p: "top",
  p2: "Top",
  os: "bottom",
  os2: "Bottom",
  d: "height",
  d2: "Height",
  a: "y",
  op: _horizontal,
  sc: _scrollCacheFunc(function(value) {
    return arguments.length ? _win$1.scrollTo(_horizontal.sc(), value) : _win$1.pageYOffset || _doc$1[_scrollTop] || _docEl$1[_scrollTop] || _body$1[_scrollTop] || 0;
  })
}, _getTarget = function _getTarget2(t, self) {
  return (self && self._ctx && self._ctx.selector || gsap$1.utils.toArray)(t)[0] || (typeof t === "string" && gsap$1.config().nullTargetWarn !== false ? console.warn("Element not found:", t) : null);
}, _isWithin = function _isWithin2(element, list) {
  var i = list.length;
  while (i--) {
    if (list[i] === element || list[i].contains(element)) {
      return true;
    }
  }
  return false;
}, _getScrollFunc = function _getScrollFunc2(element, _ref) {
  var s = _ref.s, sc = _ref.sc;
  _isViewport$1(element) && (element = _doc$1.scrollingElement || _docEl$1);
  var i = _scrollers.indexOf(element), offset = sc === _vertical.sc ? 1 : 2;
  !~i && (i = _scrollers.push(element) - 1);
  _scrollers[i + offset] || _addListener$1(element, "scroll", _onScroll$1);
  var prev = _scrollers[i + offset], func = prev || (_scrollers[i + offset] = _scrollCacheFunc(_getProxyProp(element, s), true) || (_isViewport$1(element) ? sc : _scrollCacheFunc(function(value) {
    return arguments.length ? element[s] = value : element[s];
  })));
  func.target = element;
  prev || (func.smooth = gsap$1.getProperty(element, "scrollBehavior") === "smooth");
  return func;
}, _getVelocityProp = function _getVelocityProp2(value, minTimeRefresh, useDelta) {
  var v1 = value, v2 = value, t1 = _getTime$1(), t2 = t1, min = minTimeRefresh || 50, dropToZeroTime = Math.max(500, min * 3), update = function update2(value2, force) {
    var t = _getTime$1();
    if (force || t - t1 > min) {
      v2 = v1;
      v1 = value2;
      t2 = t1;
      t1 = t;
    } else if (useDelta) {
      v1 += value2;
    } else {
      v1 = v2 + (value2 - v2) / (t - t2) * (t1 - t2);
    }
  }, reset = function reset2() {
    v2 = v1 = useDelta ? 0 : v1;
    t2 = t1 = 0;
  }, getVelocity = function getVelocity2(latestValue) {
    var tOld = t2, vOld = v2, t = _getTime$1();
    (latestValue || latestValue === 0) && latestValue !== v1 && update(latestValue);
    return t1 === t2 || t - t2 > dropToZeroTime ? 0 : (v1 + (useDelta ? vOld : -vOld)) / ((useDelta ? t : t1) - tOld) * 1e3;
  };
  return {
    update,
    reset,
    getVelocity
  };
}, _getEvent = function _getEvent2(e, preventDefault) {
  preventDefault && !e._gsapAllow && e.preventDefault();
  return e.changedTouches ? e.changedTouches[0] : e;
}, _getAbsoluteMax = function _getAbsoluteMax2(a) {
  var max = Math.max.apply(Math, a), min = Math.min.apply(Math, a);
  return Math.abs(max) >= Math.abs(min) ? max : min;
}, _setScrollTrigger = function _setScrollTrigger2() {
  ScrollTrigger$1 = gsap$1.core.globals().ScrollTrigger;
  ScrollTrigger$1 && ScrollTrigger$1.core && _integrate();
}, _initCore = function _initCore2(core) {
  gsap$1 = core || _getGSAP$1();
  if (!_coreInitted$1 && gsap$1 && typeof document !== "undefined" && document.body) {
    _win$1 = window;
    _doc$1 = document;
    _docEl$1 = _doc$1.documentElement;
    _body$1 = _doc$1.body;
    _root$1 = [_win$1, _doc$1, _docEl$1, _body$1];
    gsap$1.utils.clamp;
    _context$1 = gsap$1.core.context || function() {
    };
    _pointerType = "onpointerenter" in _body$1 ? "pointer" : "mouse";
    _isTouch = Observer.isTouch = _win$1.matchMedia && _win$1.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in _win$1 || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0;
    _eventTypes = Observer.eventTypes = ("ontouchstart" in _docEl$1 ? "touchstart,touchmove,touchcancel,touchend" : !("onpointerdown" in _docEl$1) ? "mousedown,mousemove,mouseup,mouseup" : "pointerdown,pointermove,pointercancel,pointerup").split(",");
    setTimeout(function() {
      return _startup$1 = 0;
    }, 500);
    _setScrollTrigger();
    _coreInitted$1 = 1;
  }
  return _coreInitted$1;
};
_horizontal.op = _vertical;
_scrollers.cache = 0;
var Observer = /* @__PURE__ */ function() {
  function Observer2(vars) {
    this.init(vars);
  }
  var _proto = Observer2.prototype;
  _proto.init = function init(vars) {
    _coreInitted$1 || _initCore(gsap$1) || console.warn("Please gsap.registerPlugin(Observer)");
    ScrollTrigger$1 || _setScrollTrigger();
    var tolerance = vars.tolerance, dragMinimum = vars.dragMinimum, type = vars.type, target = vars.target, lineHeight = vars.lineHeight, debounce = vars.debounce, preventDefault = vars.preventDefault, onStop = vars.onStop, onStopDelay = vars.onStopDelay, ignore = vars.ignore, wheelSpeed = vars.wheelSpeed, event = vars.event, onDragStart = vars.onDragStart, onDragEnd = vars.onDragEnd, onDrag = vars.onDrag, onPress = vars.onPress, onRelease = vars.onRelease, onRight = vars.onRight, onLeft = vars.onLeft, onUp = vars.onUp, onDown = vars.onDown, onChangeX = vars.onChangeX, onChangeY = vars.onChangeY, onChange = vars.onChange, onToggleX = vars.onToggleX, onToggleY = vars.onToggleY, onHover = vars.onHover, onHoverEnd = vars.onHoverEnd, onMove = vars.onMove, ignoreCheck = vars.ignoreCheck, isNormalizer = vars.isNormalizer, onGestureStart = vars.onGestureStart, onGestureEnd = vars.onGestureEnd, onWheel = vars.onWheel, onEnable = vars.onEnable, onDisable = vars.onDisable, onClick = vars.onClick, scrollSpeed = vars.scrollSpeed, capture = vars.capture, allowClicks = vars.allowClicks, lockAxis = vars.lockAxis, onLockAxis = vars.onLockAxis;
    this.target = target = _getTarget(target) || _docEl$1;
    this.vars = vars;
    ignore && (ignore = gsap$1.utils.toArray(ignore));
    tolerance = tolerance || 1e-9;
    dragMinimum = dragMinimum || 0;
    wheelSpeed = wheelSpeed || 1;
    scrollSpeed = scrollSpeed || 1;
    type = type || "wheel,touch,pointer";
    debounce = debounce !== false;
    lineHeight || (lineHeight = parseFloat(_win$1.getComputedStyle(_body$1).lineHeight) || 22);
    var id, onStopDelayedCall, dragged, moved, wheeled, locked, axis, self = this, prevDeltaX = 0, prevDeltaY = 0, passive = vars.passive || !preventDefault && vars.passive !== false, scrollFuncX = _getScrollFunc(target, _horizontal), scrollFuncY = _getScrollFunc(target, _vertical), scrollX = scrollFuncX(), scrollY = scrollFuncY(), limitToTouch = ~type.indexOf("touch") && !~type.indexOf("pointer") && _eventTypes[0] === "pointerdown", isViewport = _isViewport$1(target), ownerDoc = target.ownerDocument || _doc$1, deltaX = [0, 0, 0], deltaY = [0, 0, 0], onClickTime = 0, clickCapture = function clickCapture2() {
      return onClickTime = _getTime$1();
    }, _ignoreCheck = function _ignoreCheck2(e, isPointerOrTouch) {
      return (self.event = e) && ignore && _isWithin(e.target, ignore) || isPointerOrTouch && limitToTouch && e.pointerType !== "touch" || ignoreCheck && ignoreCheck(e, isPointerOrTouch);
    }, onStopFunc = function onStopFunc2() {
      self._vx.reset();
      self._vy.reset();
      onStopDelayedCall.pause();
      onStop && onStop(self);
    }, update = function update2() {
      var dx = self.deltaX = _getAbsoluteMax(deltaX), dy = self.deltaY = _getAbsoluteMax(deltaY), changedX = Math.abs(dx) >= tolerance, changedY = Math.abs(dy) >= tolerance;
      onChange && (changedX || changedY) && onChange(self, dx, dy, deltaX, deltaY);
      if (changedX) {
        onRight && self.deltaX > 0 && onRight(self);
        onLeft && self.deltaX < 0 && onLeft(self);
        onChangeX && onChangeX(self);
        onToggleX && self.deltaX < 0 !== prevDeltaX < 0 && onToggleX(self);
        prevDeltaX = self.deltaX;
        deltaX[0] = deltaX[1] = deltaX[2] = 0;
      }
      if (changedY) {
        onDown && self.deltaY > 0 && onDown(self);
        onUp && self.deltaY < 0 && onUp(self);
        onChangeY && onChangeY(self);
        onToggleY && self.deltaY < 0 !== prevDeltaY < 0 && onToggleY(self);
        prevDeltaY = self.deltaY;
        deltaY[0] = deltaY[1] = deltaY[2] = 0;
      }
      if (moved || dragged) {
        onMove && onMove(self);
        if (dragged) {
          onDragStart && dragged === 1 && onDragStart(self);
          onDrag && onDrag(self);
          dragged = 0;
        }
        moved = false;
      }
      locked && !(locked = false) && onLockAxis && onLockAxis(self);
      if (wheeled) {
        onWheel(self);
        wheeled = false;
      }
      id = 0;
    }, onDelta = function onDelta2(x, y, index) {
      deltaX[index] += x;
      deltaY[index] += y;
      self._vx.update(x);
      self._vy.update(y);
      debounce ? id || (id = requestAnimationFrame(update)) : update();
    }, onTouchOrPointerDelta = function onTouchOrPointerDelta2(x, y) {
      if (lockAxis && !axis) {
        self.axis = axis = Math.abs(x) > Math.abs(y) ? "x" : "y";
        locked = true;
      }
      if (axis !== "y") {
        deltaX[2] += x;
        self._vx.update(x, true);
      }
      if (axis !== "x") {
        deltaY[2] += y;
        self._vy.update(y, true);
      }
      debounce ? id || (id = requestAnimationFrame(update)) : update();
    }, _onDrag = function _onDrag2(e) {
      if (_ignoreCheck(e, 1)) {
        return;
      }
      e = _getEvent(e, preventDefault);
      var x = e.clientX, y = e.clientY, dx = x - self.x, dy = y - self.y, isDragging = self.isDragging;
      self.x = x;
      self.y = y;
      if (isDragging || (dx || dy) && (Math.abs(self.startX - x) >= dragMinimum || Math.abs(self.startY - y) >= dragMinimum)) {
        dragged = isDragging ? 2 : 1;
        isDragging || (self.isDragging = true);
        onTouchOrPointerDelta(dx, dy);
      }
    }, _onPress = self.onPress = function(e) {
      if (_ignoreCheck(e, 1) || e && e.button) {
        return;
      }
      self.axis = axis = null;
      onStopDelayedCall.pause();
      self.isPressed = true;
      e = _getEvent(e);
      prevDeltaX = prevDeltaY = 0;
      self.startX = self.x = e.clientX;
      self.startY = self.y = e.clientY;
      self._vx.reset();
      self._vy.reset();
      _addListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, passive, true);
      self.deltaX = self.deltaY = 0;
      onPress && onPress(self);
    }, _onRelease = self.onRelease = function(e) {
      if (_ignoreCheck(e, 1)) {
        return;
      }
      _removeListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
      var isTrackingDrag = !isNaN(self.y - self.startY), wasDragging = self.isDragging, isDragNotClick = wasDragging && (Math.abs(self.x - self.startX) > 3 || Math.abs(self.y - self.startY) > 3), eventData = _getEvent(e);
      if (!isDragNotClick && isTrackingDrag) {
        self._vx.reset();
        self._vy.reset();
        if (preventDefault && allowClicks) {
          gsap$1.delayedCall(0.08, function() {
            if (_getTime$1() - onClickTime > 300 && !e.defaultPrevented) {
              if (e.target.click) {
                e.target.click();
              } else if (ownerDoc.createEvent) {
                var syntheticEvent = ownerDoc.createEvent("MouseEvents");
                syntheticEvent.initMouseEvent("click", true, true, _win$1, 1, eventData.screenX, eventData.screenY, eventData.clientX, eventData.clientY, false, false, false, false, 0, null);
                e.target.dispatchEvent(syntheticEvent);
              }
            }
          });
        }
      }
      self.isDragging = self.isGesturing = self.isPressed = false;
      onStop && wasDragging && !isNormalizer && onStopDelayedCall.restart(true);
      dragged && update();
      onDragEnd && wasDragging && onDragEnd(self);
      onRelease && onRelease(self, isDragNotClick);
    }, _onGestureStart = function _onGestureStart2(e) {
      return e.touches && e.touches.length > 1 && (self.isGesturing = true) && onGestureStart(e, self.isDragging);
    }, _onGestureEnd = function _onGestureEnd2() {
      return (self.isGesturing = false) || onGestureEnd(self);
    }, onScroll = function onScroll2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      var x = scrollFuncX(), y = scrollFuncY();
      onDelta((x - scrollX) * scrollSpeed, (y - scrollY) * scrollSpeed, 1);
      scrollX = x;
      scrollY = y;
      onStop && onStopDelayedCall.restart(true);
    }, _onWheel = function _onWheel2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      e = _getEvent(e, preventDefault);
      onWheel && (wheeled = true);
      var multiplier = (e.deltaMode === 1 ? lineHeight : e.deltaMode === 2 ? _win$1.innerHeight : 1) * wheelSpeed;
      onDelta(e.deltaX * multiplier, e.deltaY * multiplier, 0);
      onStop && !isNormalizer && onStopDelayedCall.restart(true);
    }, _onMove = function _onMove2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      var x = e.clientX, y = e.clientY, dx = x - self.x, dy = y - self.y;
      self.x = x;
      self.y = y;
      moved = true;
      onStop && onStopDelayedCall.restart(true);
      (dx || dy) && onTouchOrPointerDelta(dx, dy);
    }, _onHover = function _onHover2(e) {
      self.event = e;
      onHover(self);
    }, _onHoverEnd = function _onHoverEnd2(e) {
      self.event = e;
      onHoverEnd(self);
    }, _onClick = function _onClick2(e) {
      return _ignoreCheck(e) || _getEvent(e, preventDefault) && onClick(self);
    };
    onStopDelayedCall = self._dc = gsap$1.delayedCall(onStopDelay || 0.25, onStopFunc).pause();
    self.deltaX = self.deltaY = 0;
    self._vx = _getVelocityProp(0, 50, true);
    self._vy = _getVelocityProp(0, 50, true);
    self.scrollX = scrollFuncX;
    self.scrollY = scrollFuncY;
    self.isDragging = self.isGesturing = self.isPressed = false;
    _context$1(this);
    self.enable = function(e) {
      if (!self.isEnabled) {
        _addListener$1(isViewport ? ownerDoc : target, "scroll", _onScroll$1);
        type.indexOf("scroll") >= 0 && _addListener$1(isViewport ? ownerDoc : target, "scroll", onScroll, passive, capture);
        type.indexOf("wheel") >= 0 && _addListener$1(target, "wheel", _onWheel, passive, capture);
        if (type.indexOf("touch") >= 0 && _isTouch || type.indexOf("pointer") >= 0) {
          _addListener$1(target, _eventTypes[0], _onPress, passive, capture);
          _addListener$1(ownerDoc, _eventTypes[2], _onRelease);
          _addListener$1(ownerDoc, _eventTypes[3], _onRelease);
          allowClicks && _addListener$1(target, "click", clickCapture, true, true);
          onClick && _addListener$1(target, "click", _onClick);
          onGestureStart && _addListener$1(ownerDoc, "gesturestart", _onGestureStart);
          onGestureEnd && _addListener$1(ownerDoc, "gestureend", _onGestureEnd);
          onHover && _addListener$1(target, _pointerType + "enter", _onHover);
          onHoverEnd && _addListener$1(target, _pointerType + "leave", _onHoverEnd);
          onMove && _addListener$1(target, _pointerType + "move", _onMove);
        }
        self.isEnabled = true;
        self.isDragging = self.isGesturing = self.isPressed = moved = dragged = false;
        self._vx.reset();
        self._vy.reset();
        scrollX = scrollFuncX();
        scrollY = scrollFuncY();
        e && e.type && _onPress(e);
        onEnable && onEnable(self);
      }
      return self;
    };
    self.disable = function() {
      if (self.isEnabled) {
        _observers.filter(function(o) {
          return o !== self && _isViewport$1(o.target);
        }).length || _removeListener$1(isViewport ? ownerDoc : target, "scroll", _onScroll$1);
        if (self.isPressed) {
          self._vx.reset();
          self._vy.reset();
          _removeListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
        }
        _removeListener$1(isViewport ? ownerDoc : target, "scroll", onScroll, capture);
        _removeListener$1(target, "wheel", _onWheel, capture);
        _removeListener$1(target, _eventTypes[0], _onPress, capture);
        _removeListener$1(ownerDoc, _eventTypes[2], _onRelease);
        _removeListener$1(ownerDoc, _eventTypes[3], _onRelease);
        _removeListener$1(target, "click", clickCapture, true);
        _removeListener$1(target, "click", _onClick);
        _removeListener$1(ownerDoc, "gesturestart", _onGestureStart);
        _removeListener$1(ownerDoc, "gestureend", _onGestureEnd);
        _removeListener$1(target, _pointerType + "enter", _onHover);
        _removeListener$1(target, _pointerType + "leave", _onHoverEnd);
        _removeListener$1(target, _pointerType + "move", _onMove);
        self.isEnabled = self.isPressed = self.isDragging = false;
        onDisable && onDisable(self);
      }
    };
    self.kill = self.revert = function() {
      self.disable();
      var i = _observers.indexOf(self);
      i >= 0 && _observers.splice(i, 1);
      _normalizer$1 === self && (_normalizer$1 = 0);
    };
    _observers.push(self);
    isNormalizer && _isViewport$1(target) && (_normalizer$1 = self);
    self.enable(event);
  };
  _createClass(Observer2, [{
    key: "velocityX",
    get: function get() {
      return this._vx.getVelocity();
    }
  }, {
    key: "velocityY",
    get: function get() {
      return this._vy.getVelocity();
    }
  }]);
  return Observer2;
}();
Observer.version = "3.13.0";
Observer.create = function(vars) {
  return new Observer(vars);
};
Observer.register = _initCore;
Observer.getAll = function() {
  return _observers.slice();
};
Observer.getById = function(id) {
  return _observers.filter(function(o) {
    return o.vars.id === id;
  })[0];
};
_getGSAP$1() && gsap$1.registerPlugin(Observer);
/*!
 * ScrollTrigger 3.13.0
 * https://gsap.com
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
var gsap, _coreInitted, _win, _doc, _docEl, _body, _root, _resizeDelay, _toArray, _clamp, _time2, _syncInterval, _refreshing, _pointerIsDown, _transformProp, _i, _prevWidth, _prevHeight, _autoRefresh, _sort, _suppressOverwrites, _ignoreResize, _normalizer, _ignoreMobileResize, _baseScreenHeight, _baseScreenWidth, _fixIOSBug, _context, _scrollRestoration, _div100vh, _100vh, _isReverted, _clampingMax, _limitCallbacks, _startup = 1, _getTime = Date.now, _time1 = _getTime(), _lastScrollTime = 0, _enabled = 0, _parseClamp = function _parseClamp2(value, type, self) {
  var clamp = _isString(value) && (value.substr(0, 6) === "clamp(" || value.indexOf("max") > -1);
  self["_" + type + "Clamp"] = clamp;
  return clamp ? value.substr(6, value.length - 7) : value;
}, _keepClamp = function _keepClamp2(value, clamp) {
  return clamp && (!_isString(value) || value.substr(0, 6) !== "clamp(") ? "clamp(" + value + ")" : value;
}, _rafBugFix = function _rafBugFix2() {
  return _enabled && requestAnimationFrame(_rafBugFix2);
}, _pointerDownHandler = function _pointerDownHandler2() {
  return _pointerIsDown = 1;
}, _pointerUpHandler = function _pointerUpHandler2() {
  return _pointerIsDown = 0;
}, _passThrough = function _passThrough2(v) {
  return v;
}, _round = function _round2(value) {
  return Math.round(value * 1e5) / 1e5 || 0;
}, _windowExists = function _windowExists2() {
  return typeof window !== "undefined";
}, _getGSAP = function _getGSAP22() {
  return gsap || _windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap;
}, _isViewport = function _isViewport22(e) {
  return !!~_root.indexOf(e);
}, _getViewportDimension = function _getViewportDimension2(dimensionProperty) {
  return (dimensionProperty === "Height" ? _100vh : _win["inner" + dimensionProperty]) || _docEl["client" + dimensionProperty] || _body["client" + dimensionProperty];
}, _getBoundsFunc = function _getBoundsFunc2(element) {
  return _getProxyProp(element, "getBoundingClientRect") || (_isViewport(element) ? function() {
    _winOffsets.width = _win.innerWidth;
    _winOffsets.height = _100vh;
    return _winOffsets;
  } : function() {
    return _getBounds(element);
  });
}, _getSizeFunc = function _getSizeFunc2(scroller, isViewport, _ref) {
  var d = _ref.d, d2 = _ref.d2, a = _ref.a;
  return (a = _getProxyProp(scroller, "getBoundingClientRect")) ? function() {
    return a()[d];
  } : function() {
    return (isViewport ? _getViewportDimension(d2) : scroller["client" + d2]) || 0;
  };
}, _getOffsetsFunc = function _getOffsetsFunc2(element, isViewport) {
  return !isViewport || ~_proxies.indexOf(element) ? _getBoundsFunc(element) : function() {
    return _winOffsets;
  };
}, _maxScroll = function _maxScroll2(element, _ref2) {
  var s = _ref2.s, d2 = _ref2.d2, d = _ref2.d, a = _ref2.a;
  return Math.max(0, (s = "scroll" + d2) && (a = _getProxyProp(element, s)) ? a() - _getBoundsFunc(element)()[d] : _isViewport(element) ? (_docEl[s] || _body[s]) - _getViewportDimension(d2) : element[s] - element["offset" + d2]);
}, _iterateAutoRefresh = function _iterateAutoRefresh2(func, events) {
  for (var i = 0; i < _autoRefresh.length; i += 3) {
    (!events || ~events.indexOf(_autoRefresh[i + 1])) && func(_autoRefresh[i], _autoRefresh[i + 1], _autoRefresh[i + 2]);
  }
}, _isString = function _isString2(value) {
  return typeof value === "string";
}, _isFunction = function _isFunction2(value) {
  return typeof value === "function";
}, _isNumber = function _isNumber2(value) {
  return typeof value === "number";
}, _isObject = function _isObject2(value) {
  return typeof value === "object";
}, _endAnimation = function _endAnimation2(animation, reversed, pause) {
  return animation && animation.progress(reversed ? 0 : 1) && pause && animation.pause();
}, _callback = function _callback2(self, func) {
  if (self.enabled) {
    var result = self._ctx ? self._ctx.add(function() {
      return func(self);
    }) : func(self);
    result && result.totalTime && (self.callbackAnimation = result);
  }
}, _abs = Math.abs, _left = "left", _top = "top", _right = "right", _bottom = "bottom", _width = "width", _height = "height", _Right = "Right", _Left = "Left", _Top = "Top", _Bottom = "Bottom", _padding = "padding", _margin = "margin", _Width = "Width", _Height = "Height", _px = "px", _getComputedStyle = function _getComputedStyle2(element) {
  return _win.getComputedStyle(element);
}, _makePositionable = function _makePositionable2(element) {
  var position = _getComputedStyle(element).position;
  element.style.position = position === "absolute" || position === "fixed" ? position : "relative";
}, _setDefaults = function _setDefaults2(obj, defaults) {
  for (var p in defaults) {
    p in obj || (obj[p] = defaults[p]);
  }
  return obj;
}, _getBounds = function _getBounds2(element, withoutTransforms) {
  var tween = withoutTransforms && _getComputedStyle(element)[_transformProp] !== "matrix(1, 0, 0, 1, 0, 0)" && gsap.to(element, {
    x: 0,
    y: 0,
    xPercent: 0,
    yPercent: 0,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    skewX: 0,
    skewY: 0
  }).progress(1), bounds = element.getBoundingClientRect();
  tween && tween.progress(0).kill();
  return bounds;
}, _getSize = function _getSize2(element, _ref3) {
  var d2 = _ref3.d2;
  return element["offset" + d2] || element["client" + d2] || 0;
}, _getLabelRatioArray = function _getLabelRatioArray2(timeline) {
  var a = [], labels = timeline.labels, duration = timeline.duration(), p;
  for (p in labels) {
    a.push(labels[p] / duration);
  }
  return a;
}, _getClosestLabel = function _getClosestLabel2(animation) {
  return function(value) {
    return gsap.utils.snap(_getLabelRatioArray(animation), value);
  };
}, _snapDirectional = function _snapDirectional2(snapIncrementOrArray) {
  var snap = gsap.utils.snap(snapIncrementOrArray), a = Array.isArray(snapIncrementOrArray) && snapIncrementOrArray.slice(0).sort(function(a2, b) {
    return a2 - b;
  });
  return a ? function(value, direction, threshold) {
    if (threshold === void 0) {
      threshold = 1e-3;
    }
    var i;
    if (!direction) {
      return snap(value);
    }
    if (direction > 0) {
      value -= threshold;
      for (i = 0; i < a.length; i++) {
        if (a[i] >= value) {
          return a[i];
        }
      }
      return a[i - 1];
    } else {
      i = a.length;
      value += threshold;
      while (i--) {
        if (a[i] <= value) {
          return a[i];
        }
      }
    }
    return a[0];
  } : function(value, direction, threshold) {
    if (threshold === void 0) {
      threshold = 1e-3;
    }
    var snapped = snap(value);
    return !direction || Math.abs(snapped - value) < threshold || snapped - value < 0 === direction < 0 ? snapped : snap(direction < 0 ? value - snapIncrementOrArray : value + snapIncrementOrArray);
  };
}, _getLabelAtDirection = function _getLabelAtDirection2(timeline) {
  return function(value, st) {
    return _snapDirectional(_getLabelRatioArray(timeline))(value, st.direction);
  };
}, _multiListener = function _multiListener2(func, element, types, callback) {
  return types.split(",").forEach(function(type) {
    return func(element, type, callback);
  });
}, _addListener = function _addListener22(element, type, func, nonPassive, capture) {
  return element.addEventListener(type, func, {
    passive: !nonPassive,
    capture: !!capture
  });
}, _removeListener = function _removeListener22(element, type, func, capture) {
  return element.removeEventListener(type, func, !!capture);
}, _wheelListener = function _wheelListener2(func, el, scrollFunc) {
  scrollFunc = scrollFunc && scrollFunc.wheelHandler;
  if (scrollFunc) {
    func(el, "wheel", scrollFunc);
    func(el, "touchmove", scrollFunc);
  }
}, _markerDefaults = {
  startColor: "green",
  endColor: "red",
  indent: 0,
  fontSize: "16px",
  fontWeight: "normal"
}, _defaults = {
  toggleActions: "play",
  anticipatePin: 0
}, _keywords = {
  top: 0,
  left: 0,
  center: 0.5,
  bottom: 1,
  right: 1
}, _offsetToPx = function _offsetToPx2(value, size) {
  if (_isString(value)) {
    var eqIndex = value.indexOf("="), relative = ~eqIndex ? +(value.charAt(eqIndex - 1) + 1) * parseFloat(value.substr(eqIndex + 1)) : 0;
    if (~eqIndex) {
      value.indexOf("%") > eqIndex && (relative *= size / 100);
      value = value.substr(0, eqIndex - 1);
    }
    value = relative + (value in _keywords ? _keywords[value] * size : ~value.indexOf("%") ? parseFloat(value) * size / 100 : parseFloat(value) || 0);
  }
  return value;
}, _createMarker = function _createMarker2(type, name, container, direction, _ref4, offset, matchWidthEl, containerAnimation) {
  var startColor = _ref4.startColor, endColor = _ref4.endColor, fontSize = _ref4.fontSize, indent = _ref4.indent, fontWeight = _ref4.fontWeight;
  var e = _doc.createElement("div"), useFixedPosition = _isViewport(container) || _getProxyProp(container, "pinType") === "fixed", isScroller = type.indexOf("scroller") !== -1, parent = useFixedPosition ? _body : container, isStart = type.indexOf("start") !== -1, color = isStart ? startColor : endColor, css = "border-color:" + color + ";font-size:" + fontSize + ";color:" + color + ";font-weight:" + fontWeight + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
  css += "position:" + ((isScroller || containerAnimation) && useFixedPosition ? "fixed;" : "absolute;");
  (isScroller || containerAnimation || !useFixedPosition) && (css += (direction === _vertical ? _right : _bottom) + ":" + (offset + parseFloat(indent)) + "px;");
  matchWidthEl && (css += "box-sizing:border-box;text-align:left;width:" + matchWidthEl.offsetWidth + "px;");
  e._isStart = isStart;
  e.setAttribute("class", "gsap-marker-" + type + (name ? " marker-" + name : ""));
  e.style.cssText = css;
  e.innerText = name || name === 0 ? type + "-" + name : type;
  parent.children[0] ? parent.insertBefore(e, parent.children[0]) : parent.appendChild(e);
  e._offset = e["offset" + direction.op.d2];
  _positionMarker(e, 0, direction, isStart);
  return e;
}, _positionMarker = function _positionMarker2(marker, start, direction, flipped) {
  var vars = {
    display: "block"
  }, side = direction[flipped ? "os2" : "p2"], oppositeSide = direction[flipped ? "p2" : "os2"];
  marker._isFlipped = flipped;
  vars[direction.a + "Percent"] = flipped ? -100 : 0;
  vars[direction.a] = flipped ? "1px" : 0;
  vars["border" + side + _Width] = 1;
  vars["border" + oppositeSide + _Width] = 0;
  vars[direction.p] = start + "px";
  gsap.set(marker, vars);
}, _triggers = [], _ids = {}, _rafID, _sync = function _sync2() {
  return _getTime() - _lastScrollTime > 34 && (_rafID || (_rafID = requestAnimationFrame(_updateAll)));
}, _onScroll = function _onScroll22() {
  if (!_normalizer || !_normalizer.isPressed || _normalizer.startX > _body.clientWidth) {
    _scrollers.cache++;
    if (_normalizer) {
      _rafID || (_rafID = requestAnimationFrame(_updateAll));
    } else {
      _updateAll();
    }
    _lastScrollTime || _dispatch("scrollStart");
    _lastScrollTime = _getTime();
  }
}, _setBaseDimensions = function _setBaseDimensions2() {
  _baseScreenWidth = _win.innerWidth;
  _baseScreenHeight = _win.innerHeight;
}, _onResize = function _onResize2(force) {
  _scrollers.cache++;
  (force === true || !_refreshing && !_ignoreResize && !_doc.fullscreenElement && !_doc.webkitFullscreenElement && (!_ignoreMobileResize || _baseScreenWidth !== _win.innerWidth || Math.abs(_win.innerHeight - _baseScreenHeight) > _win.innerHeight * 0.25)) && _resizeDelay.restart(true);
}, _listeners = {}, _emptyArray = [], _softRefresh = function _softRefresh2() {
  return _removeListener(ScrollTrigger, "scrollEnd", _softRefresh2) || _refreshAll(true);
}, _dispatch = function _dispatch2(type) {
  return _listeners[type] && _listeners[type].map(function(f) {
    return f();
  }) || _emptyArray;
}, _savedStyles = [], _revertRecorded = function _revertRecorded2(media) {
  for (var i = 0; i < _savedStyles.length; i += 5) {
    if (!media || _savedStyles[i + 4] && _savedStyles[i + 4].query === media) {
      _savedStyles[i].style.cssText = _savedStyles[i + 1];
      _savedStyles[i].getBBox && _savedStyles[i].setAttribute("transform", _savedStyles[i + 2] || "");
      _savedStyles[i + 3].uncache = 1;
    }
  }
}, _revertAll = function _revertAll2(kill, media) {
  var trigger;
  for (_i = 0; _i < _triggers.length; _i++) {
    trigger = _triggers[_i];
    if (trigger && (!media || trigger._ctx === media)) {
      if (kill) {
        trigger.kill(1);
      } else {
        trigger.revert(true, true);
      }
    }
  }
  _isReverted = true;
  media && _revertRecorded(media);
  media || _dispatch("revert");
}, _clearScrollMemory = function _clearScrollMemory2(scrollRestoration, force) {
  _scrollers.cache++;
  (force || !_refreshingAll) && _scrollers.forEach(function(obj) {
    return _isFunction(obj) && obj.cacheID++ && (obj.rec = 0);
  });
  _isString(scrollRestoration) && (_win.history.scrollRestoration = _scrollRestoration = scrollRestoration);
}, _refreshingAll, _refreshID = 0, _queueRefreshID, _queueRefreshAll = function _queueRefreshAll2() {
  if (_queueRefreshID !== _refreshID) {
    var id = _queueRefreshID = _refreshID;
    requestAnimationFrame(function() {
      return id === _refreshID && _refreshAll(true);
    });
  }
}, _refresh100vh = function _refresh100vh2() {
  _body.appendChild(_div100vh);
  _100vh = !_normalizer && _div100vh.offsetHeight || _win.innerHeight;
  _body.removeChild(_div100vh);
}, _hideAllMarkers = function _hideAllMarkers2(hide) {
  return _toArray(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function(el) {
    return el.style.display = hide ? "none" : "block";
  });
}, _refreshAll = function _refreshAll2(force, skipRevert) {
  _docEl = _doc.documentElement;
  _body = _doc.body;
  _root = [_win, _doc, _docEl, _body];
  if (_lastScrollTime && !force && !_isReverted) {
    _addListener(ScrollTrigger, "scrollEnd", _softRefresh);
    return;
  }
  _refresh100vh();
  _refreshingAll = ScrollTrigger.isRefreshing = true;
  _scrollers.forEach(function(obj) {
    return _isFunction(obj) && ++obj.cacheID && (obj.rec = obj());
  });
  var refreshInits = _dispatch("refreshInit");
  _sort && ScrollTrigger.sort();
  skipRevert || _revertAll();
  _scrollers.forEach(function(obj) {
    if (_isFunction(obj)) {
      obj.smooth && (obj.target.style.scrollBehavior = "auto");
      obj(0);
    }
  });
  _triggers.slice(0).forEach(function(t) {
    return t.refresh();
  });
  _isReverted = false;
  _triggers.forEach(function(t) {
    if (t._subPinOffset && t.pin) {
      var prop = t.vars.horizontal ? "offsetWidth" : "offsetHeight", original = t.pin[prop];
      t.revert(true, 1);
      t.adjustPinSpacing(t.pin[prop] - original);
      t.refresh();
    }
  });
  _clampingMax = 1;
  _hideAllMarkers(true);
  _triggers.forEach(function(t) {
    var max = _maxScroll(t.scroller, t._dir), endClamp = t.vars.end === "max" || t._endClamp && t.end > max, startClamp = t._startClamp && t.start >= max;
    (endClamp || startClamp) && t.setPositions(startClamp ? max - 1 : t.start, endClamp ? Math.max(startClamp ? max : t.start + 1, max) : t.end, true);
  });
  _hideAllMarkers(false);
  _clampingMax = 0;
  refreshInits.forEach(function(result) {
    return result && result.render && result.render(-1);
  });
  _scrollers.forEach(function(obj) {
    if (_isFunction(obj)) {
      obj.smooth && requestAnimationFrame(function() {
        return obj.target.style.scrollBehavior = "smooth";
      });
      obj.rec && obj(obj.rec);
    }
  });
  _clearScrollMemory(_scrollRestoration, 1);
  _resizeDelay.pause();
  _refreshID++;
  _refreshingAll = 2;
  _updateAll(2);
  _triggers.forEach(function(t) {
    return _isFunction(t.vars.onRefresh) && t.vars.onRefresh(t);
  });
  _refreshingAll = ScrollTrigger.isRefreshing = false;
  _dispatch("refresh");
}, _lastScroll = 0, _direction = 1, _primary, _updateAll = function _updateAll2(force) {
  if (force === 2 || !_refreshingAll && !_isReverted) {
    ScrollTrigger.isUpdating = true;
    _primary && _primary.update(0);
    var l = _triggers.length, time = _getTime(), recordVelocity = time - _time1 >= 50, scroll = l && _triggers[0].scroll();
    _direction = _lastScroll > scroll ? -1 : 1;
    _refreshingAll || (_lastScroll = scroll);
    if (recordVelocity) {
      if (_lastScrollTime && !_pointerIsDown && time - _lastScrollTime > 200) {
        _lastScrollTime = 0;
        _dispatch("scrollEnd");
      }
      _time2 = _time1;
      _time1 = time;
    }
    if (_direction < 0) {
      _i = l;
      while (_i-- > 0) {
        _triggers[_i] && _triggers[_i].update(0, recordVelocity);
      }
      _direction = 1;
    } else {
      for (_i = 0; _i < l; _i++) {
        _triggers[_i] && _triggers[_i].update(0, recordVelocity);
      }
    }
    ScrollTrigger.isUpdating = false;
  }
  _rafID = 0;
}, _propNamesToCopy = [_left, _top, _bottom, _right, _margin + _Bottom, _margin + _Right, _margin + _Top, _margin + _Left, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"], _stateProps = _propNamesToCopy.concat([_width, _height, "boxSizing", "max" + _Width, "max" + _Height, "position", _margin, _padding, _padding + _Top, _padding + _Right, _padding + _Bottom, _padding + _Left]), _swapPinOut = function _swapPinOut2(pin, spacer, state) {
  _setState(state);
  var cache = pin._gsap;
  if (cache.spacerIsNative) {
    _setState(cache.spacerState);
  } else if (pin._gsap.swappedIn) {
    var parent = spacer.parentNode;
    if (parent) {
      parent.insertBefore(pin, spacer);
      parent.removeChild(spacer);
    }
  }
  pin._gsap.swappedIn = false;
}, _swapPinIn = function _swapPinIn2(pin, spacer, cs, spacerState) {
  if (!pin._gsap.swappedIn) {
    var i = _propNamesToCopy.length, spacerStyle = spacer.style, pinStyle = pin.style, p;
    while (i--) {
      p = _propNamesToCopy[i];
      spacerStyle[p] = cs[p];
    }
    spacerStyle.position = cs.position === "absolute" ? "absolute" : "relative";
    cs.display === "inline" && (spacerStyle.display = "inline-block");
    pinStyle[_bottom] = pinStyle[_right] = "auto";
    spacerStyle.flexBasis = cs.flexBasis || "auto";
    spacerStyle.overflow = "visible";
    spacerStyle.boxSizing = "border-box";
    spacerStyle[_width] = _getSize(pin, _horizontal) + _px;
    spacerStyle[_height] = _getSize(pin, _vertical) + _px;
    spacerStyle[_padding] = pinStyle[_margin] = pinStyle[_top] = pinStyle[_left] = "0";
    _setState(spacerState);
    pinStyle[_width] = pinStyle["max" + _Width] = cs[_width];
    pinStyle[_height] = pinStyle["max" + _Height] = cs[_height];
    pinStyle[_padding] = cs[_padding];
    if (pin.parentNode !== spacer) {
      pin.parentNode.insertBefore(spacer, pin);
      spacer.appendChild(pin);
    }
    pin._gsap.swappedIn = true;
  }
}, _capsExp = /([A-Z])/g, _setState = function _setState2(state) {
  if (state) {
    var style = state.t.style, l = state.length, i = 0, p, value;
    (state.t._gsap || gsap.core.getCache(state.t)).uncache = 1;
    for (; i < l; i += 2) {
      value = state[i + 1];
      p = state[i];
      if (value) {
        style[p] = value;
      } else if (style[p]) {
        style.removeProperty(p.replace(_capsExp, "-$1").toLowerCase());
      }
    }
  }
}, _getState = function _getState2(element) {
  var l = _stateProps.length, style = element.style, state = [], i = 0;
  for (; i < l; i++) {
    state.push(_stateProps[i], style[_stateProps[i]]);
  }
  state.t = element;
  return state;
}, _copyState = function _copyState2(state, override, omitOffsets) {
  var result = [], l = state.length, i = omitOffsets ? 8 : 0, p;
  for (; i < l; i += 2) {
    p = state[i];
    result.push(p, p in override ? override[p] : state[i + 1]);
  }
  result.t = state.t;
  return result;
}, _winOffsets = {
  left: 0,
  top: 0
}, _parsePosition = function _parsePosition2(value, trigger, scrollerSize, direction, scroll, marker, markerScroller, self, scrollerBounds, borderWidth, useFixedPosition, scrollerMax, containerAnimation, clampZeroProp) {
  _isFunction(value) && (value = value(self));
  if (_isString(value) && value.substr(0, 3) === "max") {
    value = scrollerMax + (value.charAt(4) === "=" ? _offsetToPx("0" + value.substr(3), scrollerSize) : 0);
  }
  var time = containerAnimation ? containerAnimation.time() : 0, p1, p2, element;
  containerAnimation && containerAnimation.seek(0);
  isNaN(value) || (value = +value);
  if (!_isNumber(value)) {
    _isFunction(trigger) && (trigger = trigger(self));
    var offsets = (value || "0").split(" "), bounds, localOffset, globalOffset, display;
    element = _getTarget(trigger, self) || _body;
    bounds = _getBounds(element) || {};
    if ((!bounds || !bounds.left && !bounds.top) && _getComputedStyle(element).display === "none") {
      display = element.style.display;
      element.style.display = "block";
      bounds = _getBounds(element);
      display ? element.style.display = display : element.style.removeProperty("display");
    }
    localOffset = _offsetToPx(offsets[0], bounds[direction.d]);
    globalOffset = _offsetToPx(offsets[1] || "0", scrollerSize);
    value = bounds[direction.p] - scrollerBounds[direction.p] - borderWidth + localOffset + scroll - globalOffset;
    markerScroller && _positionMarker(markerScroller, globalOffset, direction, scrollerSize - globalOffset < 20 || markerScroller._isStart && globalOffset > 20);
    scrollerSize -= scrollerSize - globalOffset;
  } else {
    containerAnimation && (value = gsap.utils.mapRange(containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, 0, scrollerMax, value));
    markerScroller && _positionMarker(markerScroller, scrollerSize, direction, true);
  }
  if (clampZeroProp) {
    self[clampZeroProp] = value || -1e-3;
    value < 0 && (value = 0);
  }
  if (marker) {
    var position = value + scrollerSize, isStart = marker._isStart;
    p1 = "scroll" + direction.d2;
    _positionMarker(marker, position, direction, isStart && position > 20 || !isStart && (useFixedPosition ? Math.max(_body[p1], _docEl[p1]) : marker.parentNode[p1]) <= position + 1);
    if (useFixedPosition) {
      scrollerBounds = _getBounds(markerScroller);
      useFixedPosition && (marker.style[direction.op.p] = scrollerBounds[direction.op.p] - direction.op.m - marker._offset + _px);
    }
  }
  if (containerAnimation && element) {
    p1 = _getBounds(element);
    containerAnimation.seek(scrollerMax);
    p2 = _getBounds(element);
    containerAnimation._caScrollDist = p1[direction.p] - p2[direction.p];
    value = value / containerAnimation._caScrollDist * scrollerMax;
  }
  containerAnimation && containerAnimation.seek(time);
  return containerAnimation ? value : Math.round(value);
}, _prefixExp = /(webkit|moz|length|cssText|inset)/i, _reparent = function _reparent2(element, parent, top, left) {
  if (element.parentNode !== parent) {
    var style = element.style, p, cs;
    if (parent === _body) {
      element._stOrig = style.cssText;
      cs = _getComputedStyle(element);
      for (p in cs) {
        if (!+p && !_prefixExp.test(p) && cs[p] && typeof style[p] === "string" && p !== "0") {
          style[p] = cs[p];
        }
      }
      style.top = top;
      style.left = left;
    } else {
      style.cssText = element._stOrig;
    }
    gsap.core.getCache(element).uncache = 1;
    parent.appendChild(element);
  }
}, _interruptionTracker = function _interruptionTracker2(getValueFunc, initialValue, onInterrupt) {
  var last1 = initialValue, last2 = last1;
  return function(value) {
    var current = Math.round(getValueFunc());
    if (current !== last1 && current !== last2 && Math.abs(current - last1) > 3 && Math.abs(current - last2) > 3) {
      value = current;
      onInterrupt && onInterrupt();
    }
    last2 = last1;
    last1 = Math.round(value);
    return last1;
  };
}, _shiftMarker = function _shiftMarker2(marker, direction, value) {
  var vars = {};
  vars[direction.p] = "+=" + value;
  gsap.set(marker, vars);
}, _getTweenCreator = function _getTweenCreator2(scroller, direction) {
  var getScroll = _getScrollFunc(scroller, direction), prop = "_scroll" + direction.p2, getTween = function getTween2(scrollTo, vars, initialValue, change1, change2) {
    var tween = getTween2.tween, onComplete = vars.onComplete, modifiers = {};
    initialValue = initialValue || getScroll();
    var checkForInterruption = _interruptionTracker(getScroll, initialValue, function() {
      tween.kill();
      getTween2.tween = 0;
    });
    change2 = change1 && change2 || 0;
    change1 = change1 || scrollTo - initialValue;
    tween && tween.kill();
    vars[prop] = scrollTo;
    vars.inherit = false;
    vars.modifiers = modifiers;
    modifiers[prop] = function() {
      return checkForInterruption(initialValue + change1 * tween.ratio + change2 * tween.ratio * tween.ratio);
    };
    vars.onUpdate = function() {
      _scrollers.cache++;
      getTween2.tween && _updateAll();
    };
    vars.onComplete = function() {
      getTween2.tween = 0;
      onComplete && onComplete.call(tween);
    };
    tween = getTween2.tween = gsap.to(scroller, vars);
    return tween;
  };
  scroller[prop] = getScroll;
  getScroll.wheelHandler = function() {
    return getTween.tween && getTween.tween.kill() && (getTween.tween = 0);
  };
  _addListener(scroller, "wheel", getScroll.wheelHandler);
  ScrollTrigger.isTouch && _addListener(scroller, "touchmove", getScroll.wheelHandler);
  return getTween;
};
var ScrollTrigger = /* @__PURE__ */ function() {
  function ScrollTrigger2(vars, animation) {
    _coreInitted || ScrollTrigger2.register(gsap) || console.warn("Please gsap.registerPlugin(ScrollTrigger)");
    _context(this);
    this.init(vars, animation);
  }
  var _proto = ScrollTrigger2.prototype;
  _proto.init = function init(vars, animation) {
    this.progress = this.start = 0;
    this.vars && this.kill(true, true);
    if (!_enabled) {
      this.update = this.refresh = this.kill = _passThrough;
      return;
    }
    vars = _setDefaults(_isString(vars) || _isNumber(vars) || vars.nodeType ? {
      trigger: vars
    } : vars, _defaults);
    var _vars = vars, onUpdate = _vars.onUpdate, toggleClass = _vars.toggleClass, id = _vars.id, onToggle = _vars.onToggle, onRefresh = _vars.onRefresh, scrub = _vars.scrub, trigger = _vars.trigger, pin = _vars.pin, pinSpacing = _vars.pinSpacing, invalidateOnRefresh = _vars.invalidateOnRefresh, anticipatePin = _vars.anticipatePin, onScrubComplete = _vars.onScrubComplete, onSnapComplete = _vars.onSnapComplete, once = _vars.once, snap = _vars.snap, pinReparent = _vars.pinReparent, pinSpacer = _vars.pinSpacer, containerAnimation = _vars.containerAnimation, fastScrollEnd = _vars.fastScrollEnd, preventOverlaps = _vars.preventOverlaps, direction = vars.horizontal || vars.containerAnimation && vars.horizontal !== false ? _horizontal : _vertical, isToggle = !scrub && scrub !== 0, scroller = _getTarget(vars.scroller || _win), scrollerCache = gsap.core.getCache(scroller), isViewport = _isViewport(scroller), useFixedPosition = ("pinType" in vars ? vars.pinType : _getProxyProp(scroller, "pinType") || isViewport && "fixed") === "fixed", callbacks = [vars.onEnter, vars.onLeave, vars.onEnterBack, vars.onLeaveBack], toggleActions = isToggle && vars.toggleActions.split(" "), markers = "markers" in vars ? vars.markers : _defaults.markers, borderWidth = isViewport ? 0 : parseFloat(_getComputedStyle(scroller)["border" + direction.p2 + _Width]) || 0, self = this, onRefreshInit = vars.onRefreshInit && function() {
      return vars.onRefreshInit(self);
    }, getScrollerSize = _getSizeFunc(scroller, isViewport, direction), getScrollerOffsets = _getOffsetsFunc(scroller, isViewport), lastSnap = 0, lastRefresh = 0, prevProgress = 0, scrollFunc = _getScrollFunc(scroller, direction), tweenTo, pinCache, snapFunc, scroll1, scroll2, start, end, markerStart, markerEnd, markerStartTrigger, markerEndTrigger, markerVars, executingOnRefresh, change, pinOriginalState, pinActiveState, pinState, spacer, offset, pinGetter, pinSetter, pinStart, pinChange, spacingStart, spacerState, markerStartSetter, pinMoves, markerEndSetter, cs, snap1, snap2, scrubTween, scrubSmooth, snapDurClamp, snapDelayedCall, prevScroll, prevAnimProgress, caMarkerSetter, customRevertReturn;
    self._startClamp = self._endClamp = false;
    self._dir = direction;
    anticipatePin *= 45;
    self.scroller = scroller;
    self.scroll = containerAnimation ? containerAnimation.time.bind(containerAnimation) : scrollFunc;
    scroll1 = scrollFunc();
    self.vars = vars;
    animation = animation || vars.animation;
    if ("refreshPriority" in vars) {
      _sort = 1;
      vars.refreshPriority === -9999 && (_primary = self);
    }
    scrollerCache.tweenScroll = scrollerCache.tweenScroll || {
      top: _getTweenCreator(scroller, _vertical),
      left: _getTweenCreator(scroller, _horizontal)
    };
    self.tweenTo = tweenTo = scrollerCache.tweenScroll[direction.p];
    self.scrubDuration = function(value) {
      scrubSmooth = _isNumber(value) && value;
      if (!scrubSmooth) {
        scrubTween && scrubTween.progress(1).kill();
        scrubTween = 0;
      } else {
        scrubTween ? scrubTween.duration(value) : scrubTween = gsap.to(animation, {
          ease: "expo",
          totalProgress: "+=0",
          inherit: false,
          duration: scrubSmooth,
          paused: true,
          onComplete: function onComplete() {
            return onScrubComplete && onScrubComplete(self);
          }
        });
      }
    };
    if (animation) {
      animation.vars.lazy = false;
      animation._initted && !self.isReverted || animation.vars.immediateRender !== false && vars.immediateRender !== false && animation.duration() && animation.render(0, true, true);
      self.animation = animation.pause();
      animation.scrollTrigger = self;
      self.scrubDuration(scrub);
      snap1 = 0;
      id || (id = animation.vars.id);
    }
    if (snap) {
      if (!_isObject(snap) || snap.push) {
        snap = {
          snapTo: snap
        };
      }
      "scrollBehavior" in _body.style && gsap.set(isViewport ? [_body, _docEl] : scroller, {
        scrollBehavior: "auto"
      });
      _scrollers.forEach(function(o) {
        return _isFunction(o) && o.target === (isViewport ? _doc.scrollingElement || _docEl : scroller) && (o.smooth = false);
      });
      snapFunc = _isFunction(snap.snapTo) ? snap.snapTo : snap.snapTo === "labels" ? _getClosestLabel(animation) : snap.snapTo === "labelsDirectional" ? _getLabelAtDirection(animation) : snap.directional !== false ? function(value, st) {
        return _snapDirectional(snap.snapTo)(value, _getTime() - lastRefresh < 500 ? 0 : st.direction);
      } : gsap.utils.snap(snap.snapTo);
      snapDurClamp = snap.duration || {
        min: 0.1,
        max: 2
      };
      snapDurClamp = _isObject(snapDurClamp) ? _clamp(snapDurClamp.min, snapDurClamp.max) : _clamp(snapDurClamp, snapDurClamp);
      snapDelayedCall = gsap.delayedCall(snap.delay || scrubSmooth / 2 || 0.1, function() {
        var scroll = scrollFunc(), refreshedRecently = _getTime() - lastRefresh < 500, tween = tweenTo.tween;
        if ((refreshedRecently || Math.abs(self.getVelocity()) < 10) && !tween && !_pointerIsDown && lastSnap !== scroll) {
          var progress = (scroll - start) / change, totalProgress = animation && !isToggle ? animation.totalProgress() : progress, velocity = refreshedRecently ? 0 : (totalProgress - snap2) / (_getTime() - _time2) * 1e3 || 0, change1 = gsap.utils.clamp(-progress, 1 - progress, _abs(velocity / 2) * velocity / 0.185), naturalEnd = progress + (snap.inertia === false ? 0 : change1), endValue, endScroll, _snap = snap, onStart = _snap.onStart, _onInterrupt = _snap.onInterrupt, _onComplete = _snap.onComplete;
          endValue = snapFunc(naturalEnd, self);
          _isNumber(endValue) || (endValue = naturalEnd);
          endScroll = Math.max(0, Math.round(start + endValue * change));
          if (scroll <= end && scroll >= start && endScroll !== scroll) {
            if (tween && !tween._initted && tween.data <= _abs(endScroll - scroll)) {
              return;
            }
            if (snap.inertia === false) {
              change1 = endValue - progress;
            }
            tweenTo(endScroll, {
              duration: snapDurClamp(_abs(Math.max(_abs(naturalEnd - totalProgress), _abs(endValue - totalProgress)) * 0.185 / velocity / 0.05 || 0)),
              ease: snap.ease || "power3",
              data: _abs(endScroll - scroll),
              // record the distance so that if another snap tween occurs (conflict) we can prioritize the closest snap.
              onInterrupt: function onInterrupt() {
                return snapDelayedCall.restart(true) && _onInterrupt && _onInterrupt(self);
              },
              onComplete: function onComplete() {
                self.update();
                lastSnap = scrollFunc();
                if (animation && !isToggle) {
                  scrubTween ? scrubTween.resetTo("totalProgress", endValue, animation._tTime / animation._tDur) : animation.progress(endValue);
                }
                snap1 = snap2 = animation && !isToggle ? animation.totalProgress() : self.progress;
                onSnapComplete && onSnapComplete(self);
                _onComplete && _onComplete(self);
              }
            }, scroll, change1 * change, endScroll - scroll - change1 * change);
            onStart && onStart(self, tweenTo.tween);
          }
        } else if (self.isActive && lastSnap !== scroll) {
          snapDelayedCall.restart(true);
        }
      }).pause();
    }
    id && (_ids[id] = self);
    trigger = self.trigger = _getTarget(trigger || pin !== true && pin);
    customRevertReturn = trigger && trigger._gsap && trigger._gsap.stRevert;
    customRevertReturn && (customRevertReturn = customRevertReturn(self));
    pin = pin === true ? trigger : _getTarget(pin);
    _isString(toggleClass) && (toggleClass = {
      targets: trigger,
      className: toggleClass
    });
    if (pin) {
      pinSpacing === false || pinSpacing === _margin || (pinSpacing = !pinSpacing && pin.parentNode && pin.parentNode.style && _getComputedStyle(pin.parentNode).display === "flex" ? false : _padding);
      self.pin = pin;
      pinCache = gsap.core.getCache(pin);
      if (!pinCache.spacer) {
        if (pinSpacer) {
          pinSpacer = _getTarget(pinSpacer);
          pinSpacer && !pinSpacer.nodeType && (pinSpacer = pinSpacer.current || pinSpacer.nativeElement);
          pinCache.spacerIsNative = !!pinSpacer;
          pinSpacer && (pinCache.spacerState = _getState(pinSpacer));
        }
        pinCache.spacer = spacer = pinSpacer || _doc.createElement("div");
        spacer.classList.add("pin-spacer");
        id && spacer.classList.add("pin-spacer-" + id);
        pinCache.pinState = pinOriginalState = _getState(pin);
      } else {
        pinOriginalState = pinCache.pinState;
      }
      vars.force3D !== false && gsap.set(pin, {
        force3D: true
      });
      self.spacer = spacer = pinCache.spacer;
      cs = _getComputedStyle(pin);
      spacingStart = cs[pinSpacing + direction.os2];
      pinGetter = gsap.getProperty(pin);
      pinSetter = gsap.quickSetter(pin, direction.a, _px);
      _swapPinIn(pin, spacer, cs);
      pinState = _getState(pin);
    }
    if (markers) {
      markerVars = _isObject(markers) ? _setDefaults(markers, _markerDefaults) : _markerDefaults;
      markerStartTrigger = _createMarker("scroller-start", id, scroller, direction, markerVars, 0);
      markerEndTrigger = _createMarker("scroller-end", id, scroller, direction, markerVars, 0, markerStartTrigger);
      offset = markerStartTrigger["offset" + direction.op.d2];
      var content = _getTarget(_getProxyProp(scroller, "content") || scroller);
      markerStart = this.markerStart = _createMarker("start", id, content, direction, markerVars, offset, 0, containerAnimation);
      markerEnd = this.markerEnd = _createMarker("end", id, content, direction, markerVars, offset, 0, containerAnimation);
      containerAnimation && (caMarkerSetter = gsap.quickSetter([markerStart, markerEnd], direction.a, _px));
      if (!useFixedPosition && !(_proxies.length && _getProxyProp(scroller, "fixedMarkers") === true)) {
        _makePositionable(isViewport ? _body : scroller);
        gsap.set([markerStartTrigger, markerEndTrigger], {
          force3D: true
        });
        markerStartSetter = gsap.quickSetter(markerStartTrigger, direction.a, _px);
        markerEndSetter = gsap.quickSetter(markerEndTrigger, direction.a, _px);
      }
    }
    if (containerAnimation) {
      var oldOnUpdate = containerAnimation.vars.onUpdate, oldParams = containerAnimation.vars.onUpdateParams;
      containerAnimation.eventCallback("onUpdate", function() {
        self.update(0, 0, 1);
        oldOnUpdate && oldOnUpdate.apply(containerAnimation, oldParams || []);
      });
    }
    self.previous = function() {
      return _triggers[_triggers.indexOf(self) - 1];
    };
    self.next = function() {
      return _triggers[_triggers.indexOf(self) + 1];
    };
    self.revert = function(revert, temp) {
      if (!temp) {
        return self.kill(true);
      }
      var r = revert !== false || !self.enabled, prevRefreshing = _refreshing;
      if (r !== self.isReverted) {
        if (r) {
          prevScroll = Math.max(scrollFunc(), self.scroll.rec || 0);
          prevProgress = self.progress;
          prevAnimProgress = animation && animation.progress();
        }
        markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
          return m.style.display = r ? "none" : "block";
        });
        if (r) {
          _refreshing = self;
          self.update(r);
        }
        if (pin && (!pinReparent || !self.isActive)) {
          if (r) {
            _swapPinOut(pin, spacer, pinOriginalState);
          } else {
            _swapPinIn(pin, spacer, _getComputedStyle(pin), spacerState);
          }
        }
        r || self.update(r);
        _refreshing = prevRefreshing;
        self.isReverted = r;
      }
    };
    self.refresh = function(soft, force, position, pinOffset) {
      if ((_refreshing || !self.enabled) && !force) {
        return;
      }
      if (pin && soft && _lastScrollTime) {
        _addListener(ScrollTrigger2, "scrollEnd", _softRefresh);
        return;
      }
      !_refreshingAll && onRefreshInit && onRefreshInit(self);
      _refreshing = self;
      if (tweenTo.tween && !position) {
        tweenTo.tween.kill();
        tweenTo.tween = 0;
      }
      scrubTween && scrubTween.pause();
      if (invalidateOnRefresh && animation) {
        animation.revert({
          kill: false
        }).invalidate();
        animation.getChildren && animation.getChildren(true, true, false).forEach(function(t) {
          return t.vars.immediateRender && t.render(0, true, true);
        });
      }
      self.isReverted || self.revert(true, true);
      self._subPinOffset = false;
      var size = getScrollerSize(), scrollerBounds = getScrollerOffsets(), max = containerAnimation ? containerAnimation.duration() : _maxScroll(scroller, direction), isFirstRefresh = change <= 0.01 || !change, offset2 = 0, otherPinOffset = pinOffset || 0, parsedEnd = _isObject(position) ? position.end : vars.end, parsedEndTrigger = vars.endTrigger || trigger, parsedStart = _isObject(position) ? position.start : vars.start || (vars.start === 0 || !trigger ? 0 : pin ? "0 0" : "0 100%"), pinnedContainer = self.pinnedContainer = vars.pinnedContainer && _getTarget(vars.pinnedContainer, self), triggerIndex = trigger && Math.max(0, _triggers.indexOf(self)) || 0, i = triggerIndex, cs2, bounds, scroll, isVertical, override, curTrigger, curPin, oppositeScroll, initted, revertedPins, forcedOverflow, markerStartOffset, markerEndOffset;
      if (markers && _isObject(position)) {
        markerStartOffset = gsap.getProperty(markerStartTrigger, direction.p);
        markerEndOffset = gsap.getProperty(markerEndTrigger, direction.p);
      }
      while (i-- > 0) {
        curTrigger = _triggers[i];
        curTrigger.end || curTrigger.refresh(0, 1) || (_refreshing = self);
        curPin = curTrigger.pin;
        if (curPin && (curPin === trigger || curPin === pin || curPin === pinnedContainer) && !curTrigger.isReverted) {
          revertedPins || (revertedPins = []);
          revertedPins.unshift(curTrigger);
          curTrigger.revert(true, true);
        }
        if (curTrigger !== _triggers[i]) {
          triggerIndex--;
          i--;
        }
      }
      _isFunction(parsedStart) && (parsedStart = parsedStart(self));
      parsedStart = _parseClamp(parsedStart, "start", self);
      start = _parsePosition(parsedStart, trigger, size, direction, scrollFunc(), markerStart, markerStartTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._startClamp && "_startClamp") || (pin ? -1e-3 : 0);
      _isFunction(parsedEnd) && (parsedEnd = parsedEnd(self));
      if (_isString(parsedEnd) && !parsedEnd.indexOf("+=")) {
        if (~parsedEnd.indexOf(" ")) {
          parsedEnd = (_isString(parsedStart) ? parsedStart.split(" ")[0] : "") + parsedEnd;
        } else {
          offset2 = _offsetToPx(parsedEnd.substr(2), size);
          parsedEnd = _isString(parsedStart) ? parsedStart : (containerAnimation ? gsap.utils.mapRange(0, containerAnimation.duration(), containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, start) : start) + offset2;
          parsedEndTrigger = trigger;
        }
      }
      parsedEnd = _parseClamp(parsedEnd, "end", self);
      end = Math.max(start, _parsePosition(parsedEnd || (parsedEndTrigger ? "100% 0" : max), parsedEndTrigger, size, direction, scrollFunc() + offset2, markerEnd, markerEndTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._endClamp && "_endClamp")) || -1e-3;
      offset2 = 0;
      i = triggerIndex;
      while (i--) {
        curTrigger = _triggers[i];
        curPin = curTrigger.pin;
        if (curPin && curTrigger.start - curTrigger._pinPush <= start && !containerAnimation && curTrigger.end > 0) {
          cs2 = curTrigger.end - (self._startClamp ? Math.max(0, curTrigger.start) : curTrigger.start);
          if ((curPin === trigger && curTrigger.start - curTrigger._pinPush < start || curPin === pinnedContainer) && isNaN(parsedStart)) {
            offset2 += cs2 * (1 - curTrigger.progress);
          }
          curPin === pin && (otherPinOffset += cs2);
        }
      }
      start += offset2;
      end += offset2;
      self._startClamp && (self._startClamp += offset2);
      if (self._endClamp && !_refreshingAll) {
        self._endClamp = end || -1e-3;
        end = Math.min(end, _maxScroll(scroller, direction));
      }
      change = end - start || (start -= 0.01) && 1e-3;
      if (isFirstRefresh) {
        prevProgress = gsap.utils.clamp(0, 1, gsap.utils.normalize(start, end, prevScroll));
      }
      self._pinPush = otherPinOffset;
      if (markerStart && offset2) {
        cs2 = {};
        cs2[direction.a] = "+=" + offset2;
        pinnedContainer && (cs2[direction.p] = "-=" + scrollFunc());
        gsap.set([markerStart, markerEnd], cs2);
      }
      if (pin && !(_clampingMax && self.end >= _maxScroll(scroller, direction))) {
        cs2 = _getComputedStyle(pin);
        isVertical = direction === _vertical;
        scroll = scrollFunc();
        pinStart = parseFloat(pinGetter(direction.a)) + otherPinOffset;
        if (!max && end > 1) {
          forcedOverflow = (isViewport ? _doc.scrollingElement || _docEl : scroller).style;
          forcedOverflow = {
            style: forcedOverflow,
            value: forcedOverflow["overflow" + direction.a.toUpperCase()]
          };
          if (isViewport && _getComputedStyle(_body)["overflow" + direction.a.toUpperCase()] !== "scroll") {
            forcedOverflow.style["overflow" + direction.a.toUpperCase()] = "scroll";
          }
        }
        _swapPinIn(pin, spacer, cs2);
        pinState = _getState(pin);
        bounds = _getBounds(pin, true);
        oppositeScroll = useFixedPosition && _getScrollFunc(scroller, isVertical ? _horizontal : _vertical)();
        if (pinSpacing) {
          spacerState = [pinSpacing + direction.os2, change + otherPinOffset + _px];
          spacerState.t = spacer;
          i = pinSpacing === _padding ? _getSize(pin, direction) + change + otherPinOffset : 0;
          if (i) {
            spacerState.push(direction.d, i + _px);
            spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i + _px);
          }
          _setState(spacerState);
          if (pinnedContainer) {
            _triggers.forEach(function(t) {
              if (t.pin === pinnedContainer && t.vars.pinSpacing !== false) {
                t._subPinOffset = true;
              }
            });
          }
          useFixedPosition && scrollFunc(prevScroll);
        } else {
          i = _getSize(pin, direction);
          i && spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i + _px);
        }
        if (useFixedPosition) {
          override = {
            top: bounds.top + (isVertical ? scroll - start : oppositeScroll) + _px,
            left: bounds.left + (isVertical ? oppositeScroll : scroll - start) + _px,
            boxSizing: "border-box",
            position: "fixed"
          };
          override[_width] = override["max" + _Width] = Math.ceil(bounds.width) + _px;
          override[_height] = override["max" + _Height] = Math.ceil(bounds.height) + _px;
          override[_margin] = override[_margin + _Top] = override[_margin + _Right] = override[_margin + _Bottom] = override[_margin + _Left] = "0";
          override[_padding] = cs2[_padding];
          override[_padding + _Top] = cs2[_padding + _Top];
          override[_padding + _Right] = cs2[_padding + _Right];
          override[_padding + _Bottom] = cs2[_padding + _Bottom];
          override[_padding + _Left] = cs2[_padding + _Left];
          pinActiveState = _copyState(pinOriginalState, override, pinReparent);
          _refreshingAll && scrollFunc(0);
        }
        if (animation) {
          initted = animation._initted;
          _suppressOverwrites(1);
          animation.render(animation.duration(), true, true);
          pinChange = pinGetter(direction.a) - pinStart + change + otherPinOffset;
          pinMoves = Math.abs(change - pinChange) > 1;
          useFixedPosition && pinMoves && pinActiveState.splice(pinActiveState.length - 2, 2);
          animation.render(0, true, true);
          initted || animation.invalidate(true);
          animation.parent || animation.totalTime(animation.totalTime());
          _suppressOverwrites(0);
        } else {
          pinChange = change;
        }
        forcedOverflow && (forcedOverflow.value ? forcedOverflow.style["overflow" + direction.a.toUpperCase()] = forcedOverflow.value : forcedOverflow.style.removeProperty("overflow-" + direction.a));
      } else if (trigger && scrollFunc() && !containerAnimation) {
        bounds = trigger.parentNode;
        while (bounds && bounds !== _body) {
          if (bounds._pinOffset) {
            start -= bounds._pinOffset;
            end -= bounds._pinOffset;
          }
          bounds = bounds.parentNode;
        }
      }
      revertedPins && revertedPins.forEach(function(t) {
        return t.revert(false, true);
      });
      self.start = start;
      self.end = end;
      scroll1 = scroll2 = _refreshingAll ? prevScroll : scrollFunc();
      if (!containerAnimation && !_refreshingAll) {
        scroll1 < prevScroll && scrollFunc(prevScroll);
        self.scroll.rec = 0;
      }
      self.revert(false, true);
      lastRefresh = _getTime();
      if (snapDelayedCall) {
        lastSnap = -1;
        snapDelayedCall.restart(true);
      }
      _refreshing = 0;
      animation && isToggle && (animation._initted || prevAnimProgress) && animation.progress() !== prevAnimProgress && animation.progress(prevAnimProgress || 0, true).render(animation.time(), true, true);
      if (isFirstRefresh || prevProgress !== self.progress || containerAnimation || invalidateOnRefresh || animation && !animation._initted) {
        animation && !isToggle && (animation._initted || prevProgress || animation.vars.immediateRender !== false) && animation.totalProgress(containerAnimation && start < -1e-3 && !prevProgress ? gsap.utils.normalize(start, end, 0) : prevProgress, true);
        self.progress = isFirstRefresh || (scroll1 - start) / change === prevProgress ? 0 : prevProgress;
      }
      pin && pinSpacing && (spacer._pinOffset = Math.round(self.progress * pinChange));
      scrubTween && scrubTween.invalidate();
      if (!isNaN(markerStartOffset)) {
        markerStartOffset -= gsap.getProperty(markerStartTrigger, direction.p);
        markerEndOffset -= gsap.getProperty(markerEndTrigger, direction.p);
        _shiftMarker(markerStartTrigger, direction, markerStartOffset);
        _shiftMarker(markerStart, direction, markerStartOffset - (pinOffset || 0));
        _shiftMarker(markerEndTrigger, direction, markerEndOffset);
        _shiftMarker(markerEnd, direction, markerEndOffset - (pinOffset || 0));
      }
      isFirstRefresh && !_refreshingAll && self.update();
      if (onRefresh && !_refreshingAll && !executingOnRefresh) {
        executingOnRefresh = true;
        onRefresh(self);
        executingOnRefresh = false;
      }
    };
    self.getVelocity = function() {
      return (scrollFunc() - scroll2) / (_getTime() - _time2) * 1e3 || 0;
    };
    self.endAnimation = function() {
      _endAnimation(self.callbackAnimation);
      if (animation) {
        scrubTween ? scrubTween.progress(1) : !animation.paused() ? _endAnimation(animation, animation.reversed()) : isToggle || _endAnimation(animation, self.direction < 0, 1);
      }
    };
    self.labelToScroll = function(label) {
      return animation && animation.labels && (start || self.refresh() || start) + animation.labels[label] / animation.duration() * change || 0;
    };
    self.getTrailing = function(name) {
      var i = _triggers.indexOf(self), a = self.direction > 0 ? _triggers.slice(0, i).reverse() : _triggers.slice(i + 1);
      return (_isString(name) ? a.filter(function(t) {
        return t.vars.preventOverlaps === name;
      }) : a).filter(function(t) {
        return self.direction > 0 ? t.end <= start : t.start >= end;
      });
    };
    self.update = function(reset, recordVelocity, forceFake) {
      if (containerAnimation && !forceFake && !reset) {
        return;
      }
      var scroll = _refreshingAll === true ? prevScroll : self.scroll(), p = reset ? 0 : (scroll - start) / change, clipped = p < 0 ? 0 : p > 1 ? 1 : p || 0, prevProgress2 = self.progress, isActive, wasActive, toggleState, action, stateChanged, toggled, isAtMax, isTakingAction;
      if (recordVelocity) {
        scroll2 = scroll1;
        scroll1 = containerAnimation ? scrollFunc() : scroll;
        if (snap) {
          snap2 = snap1;
          snap1 = animation && !isToggle ? animation.totalProgress() : clipped;
        }
      }
      if (anticipatePin && pin && !_refreshing && !_startup && _lastScrollTime) {
        if (!clipped && start < scroll + (scroll - scroll2) / (_getTime() - _time2) * anticipatePin) {
          clipped = 1e-4;
        } else if (clipped === 1 && end > scroll + (scroll - scroll2) / (_getTime() - _time2) * anticipatePin) {
          clipped = 0.9999;
        }
      }
      if (clipped !== prevProgress2 && self.enabled) {
        isActive = self.isActive = !!clipped && clipped < 1;
        wasActive = !!prevProgress2 && prevProgress2 < 1;
        toggled = isActive !== wasActive;
        stateChanged = toggled || !!clipped !== !!prevProgress2;
        self.direction = clipped > prevProgress2 ? 1 : -1;
        self.progress = clipped;
        if (stateChanged && !_refreshing) {
          toggleState = clipped && !prevProgress2 ? 0 : clipped === 1 ? 1 : prevProgress2 === 1 ? 2 : 3;
          if (isToggle) {
            action = !toggled && toggleActions[toggleState + 1] !== "none" && toggleActions[toggleState + 1] || toggleActions[toggleState];
            isTakingAction = animation && (action === "complete" || action === "reset" || action in animation);
          }
        }
        preventOverlaps && (toggled || isTakingAction) && (isTakingAction || scrub || !animation) && (_isFunction(preventOverlaps) ? preventOverlaps(self) : self.getTrailing(preventOverlaps).forEach(function(t) {
          return t.endAnimation();
        }));
        if (!isToggle) {
          if (scrubTween && !_refreshing && !_startup) {
            scrubTween._dp._time - scrubTween._start !== scrubTween._time && scrubTween.render(scrubTween._dp._time - scrubTween._start);
            if (scrubTween.resetTo) {
              scrubTween.resetTo("totalProgress", clipped, animation._tTime / animation._tDur);
            } else {
              scrubTween.vars.totalProgress = clipped;
              scrubTween.invalidate().restart();
            }
          } else if (animation) {
            animation.totalProgress(clipped, !!(_refreshing && (lastRefresh || reset)));
          }
        }
        if (pin) {
          reset && pinSpacing && (spacer.style[pinSpacing + direction.os2] = spacingStart);
          if (!useFixedPosition) {
            pinSetter(_round(pinStart + pinChange * clipped));
          } else if (stateChanged) {
            isAtMax = !reset && clipped > prevProgress2 && end + 1 > scroll && scroll + 1 >= _maxScroll(scroller, direction);
            if (pinReparent) {
              if (!reset && (isActive || isAtMax)) {
                var bounds = _getBounds(pin, true), _offset = scroll - start;
                _reparent(pin, _body, bounds.top + (direction === _vertical ? _offset : 0) + _px, bounds.left + (direction === _vertical ? 0 : _offset) + _px);
              } else {
                _reparent(pin, spacer);
              }
            }
            _setState(isActive || isAtMax ? pinActiveState : pinState);
            pinMoves && clipped < 1 && isActive || pinSetter(pinStart + (clipped === 1 && !isAtMax ? pinChange : 0));
          }
        }
        snap && !tweenTo.tween && !_refreshing && !_startup && snapDelayedCall.restart(true);
        toggleClass && (toggled || once && clipped && (clipped < 1 || !_limitCallbacks)) && _toArray(toggleClass.targets).forEach(function(el) {
          return el.classList[isActive || once ? "add" : "remove"](toggleClass.className);
        });
        onUpdate && !isToggle && !reset && onUpdate(self);
        if (stateChanged && !_refreshing) {
          if (isToggle) {
            if (isTakingAction) {
              if (action === "complete") {
                animation.pause().totalProgress(1);
              } else if (action === "reset") {
                animation.restart(true).pause();
              } else if (action === "restart") {
                animation.restart(true);
              } else {
                animation[action]();
              }
            }
            onUpdate && onUpdate(self);
          }
          if (toggled || !_limitCallbacks) {
            onToggle && toggled && _callback(self, onToggle);
            callbacks[toggleState] && _callback(self, callbacks[toggleState]);
            once && (clipped === 1 ? self.kill(false, 1) : callbacks[toggleState] = 0);
            if (!toggled) {
              toggleState = clipped === 1 ? 1 : 3;
              callbacks[toggleState] && _callback(self, callbacks[toggleState]);
            }
          }
          if (fastScrollEnd && !isActive && Math.abs(self.getVelocity()) > (_isNumber(fastScrollEnd) ? fastScrollEnd : 2500)) {
            _endAnimation(self.callbackAnimation);
            scrubTween ? scrubTween.progress(1) : _endAnimation(animation, action === "reverse" ? 1 : !clipped, 1);
          }
        } else if (isToggle && onUpdate && !_refreshing) {
          onUpdate(self);
        }
      }
      if (markerEndSetter) {
        var n = containerAnimation ? scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0) : scroll;
        markerStartSetter(n + (markerStartTrigger._isFlipped ? 1 : 0));
        markerEndSetter(n);
      }
      caMarkerSetter && caMarkerSetter(-scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0));
    };
    self.enable = function(reset, refresh) {
      if (!self.enabled) {
        self.enabled = true;
        _addListener(scroller, "resize", _onResize);
        isViewport || _addListener(scroller, "scroll", _onScroll);
        onRefreshInit && _addListener(ScrollTrigger2, "refreshInit", onRefreshInit);
        if (reset !== false) {
          self.progress = prevProgress = 0;
          scroll1 = scroll2 = lastSnap = scrollFunc();
        }
        refresh !== false && self.refresh();
      }
    };
    self.getTween = function(snap3) {
      return snap3 && tweenTo ? tweenTo.tween : scrubTween;
    };
    self.setPositions = function(newStart, newEnd, keepClamp, pinOffset) {
      if (containerAnimation) {
        var st = containerAnimation.scrollTrigger, duration = containerAnimation.duration(), _change = st.end - st.start;
        newStart = st.start + _change * newStart / duration;
        newEnd = st.start + _change * newEnd / duration;
      }
      self.refresh(false, false, {
        start: _keepClamp(newStart, keepClamp && !!self._startClamp),
        end: _keepClamp(newEnd, keepClamp && !!self._endClamp)
      }, pinOffset);
      self.update();
    };
    self.adjustPinSpacing = function(amount) {
      if (spacerState && amount) {
        var i = spacerState.indexOf(direction.d) + 1;
        spacerState[i] = parseFloat(spacerState[i]) + amount + _px;
        spacerState[1] = parseFloat(spacerState[1]) + amount + _px;
        _setState(spacerState);
      }
    };
    self.disable = function(reset, allowAnimation) {
      if (self.enabled) {
        reset !== false && self.revert(true, true);
        self.enabled = self.isActive = false;
        allowAnimation || scrubTween && scrubTween.pause();
        prevScroll = 0;
        pinCache && (pinCache.uncache = 1);
        onRefreshInit && _removeListener(ScrollTrigger2, "refreshInit", onRefreshInit);
        if (snapDelayedCall) {
          snapDelayedCall.pause();
          tweenTo.tween && tweenTo.tween.kill() && (tweenTo.tween = 0);
        }
        if (!isViewport) {
          var i = _triggers.length;
          while (i--) {
            if (_triggers[i].scroller === scroller && _triggers[i] !== self) {
              return;
            }
          }
          _removeListener(scroller, "resize", _onResize);
          isViewport || _removeListener(scroller, "scroll", _onScroll);
        }
      }
    };
    self.kill = function(revert, allowAnimation) {
      self.disable(revert, allowAnimation);
      scrubTween && !allowAnimation && scrubTween.kill();
      id && delete _ids[id];
      var i = _triggers.indexOf(self);
      i >= 0 && _triggers.splice(i, 1);
      i === _i && _direction > 0 && _i--;
      i = 0;
      _triggers.forEach(function(t) {
        return t.scroller === self.scroller && (i = 1);
      });
      i || _refreshingAll || (self.scroll.rec = 0);
      if (animation) {
        animation.scrollTrigger = null;
        revert && animation.revert({
          kill: false
        });
        allowAnimation || animation.kill();
      }
      markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
        return m.parentNode && m.parentNode.removeChild(m);
      });
      _primary === self && (_primary = 0);
      if (pin) {
        pinCache && (pinCache.uncache = 1);
        i = 0;
        _triggers.forEach(function(t) {
          return t.pin === pin && i++;
        });
        i || (pinCache.spacer = 0);
      }
      vars.onKill && vars.onKill(self);
    };
    _triggers.push(self);
    self.enable(false, false);
    customRevertReturn && customRevertReturn(self);
    if (animation && animation.add && !change) {
      var updateFunc = self.update;
      self.update = function() {
        self.update = updateFunc;
        _scrollers.cache++;
        start || end || self.refresh();
      };
      gsap.delayedCall(0.01, self.update);
      change = 0.01;
      start = end = 0;
    } else {
      self.refresh();
    }
    pin && _queueRefreshAll();
  };
  ScrollTrigger2.register = function register(core) {
    if (!_coreInitted) {
      gsap = core || _getGSAP();
      _windowExists() && window.document && ScrollTrigger2.enable();
      _coreInitted = _enabled;
    }
    return _coreInitted;
  };
  ScrollTrigger2.defaults = function defaults(config) {
    if (config) {
      for (var p in config) {
        _defaults[p] = config[p];
      }
    }
    return _defaults;
  };
  ScrollTrigger2.disable = function disable(reset, kill) {
    _enabled = 0;
    _triggers.forEach(function(trigger) {
      return trigger[kill ? "kill" : "disable"](reset);
    });
    _removeListener(_win, "wheel", _onScroll);
    _removeListener(_doc, "scroll", _onScroll);
    clearInterval(_syncInterval);
    _removeListener(_doc, "touchcancel", _passThrough);
    _removeListener(_body, "touchstart", _passThrough);
    _multiListener(_removeListener, _doc, "pointerdown,touchstart,mousedown", _pointerDownHandler);
    _multiListener(_removeListener, _doc, "pointerup,touchend,mouseup", _pointerUpHandler);
    _resizeDelay.kill();
    _iterateAutoRefresh(_removeListener);
    for (var i = 0; i < _scrollers.length; i += 3) {
      _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 1]);
      _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 2]);
    }
  };
  ScrollTrigger2.enable = function enable() {
    _win = window;
    _doc = document;
    _docEl = _doc.documentElement;
    _body = _doc.body;
    if (gsap) {
      _toArray = gsap.utils.toArray;
      _clamp = gsap.utils.clamp;
      _context = gsap.core.context || _passThrough;
      _suppressOverwrites = gsap.core.suppressOverwrites || _passThrough;
      _scrollRestoration = _win.history.scrollRestoration || "auto";
      _lastScroll = _win.pageYOffset || 0;
      gsap.core.globals("ScrollTrigger", ScrollTrigger2);
      if (_body) {
        _enabled = 1;
        _div100vh = document.createElement("div");
        _div100vh.style.height = "100vh";
        _div100vh.style.position = "absolute";
        _refresh100vh();
        _rafBugFix();
        Observer.register(gsap);
        ScrollTrigger2.isTouch = Observer.isTouch;
        _fixIOSBug = Observer.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent);
        _ignoreMobileResize = Observer.isTouch === 1;
        _addListener(_win, "wheel", _onScroll);
        _root = [_win, _doc, _docEl, _body];
        if (gsap.matchMedia) {
          ScrollTrigger2.matchMedia = function(vars) {
            var mm = gsap.matchMedia(), p;
            for (p in vars) {
              mm.add(p, vars[p]);
            }
            return mm;
          };
          gsap.addEventListener("matchMediaInit", function() {
            return _revertAll();
          });
          gsap.addEventListener("matchMediaRevert", function() {
            return _revertRecorded();
          });
          gsap.addEventListener("matchMedia", function() {
            _refreshAll(0, 1);
            _dispatch("matchMedia");
          });
          gsap.matchMedia().add("(orientation: portrait)", function() {
            _setBaseDimensions();
            return _setBaseDimensions;
          });
        } else {
          console.warn("Requires GSAP 3.11.0 or later");
        }
        _setBaseDimensions();
        _addListener(_doc, "scroll", _onScroll);
        var bodyHasStyle = _body.hasAttribute("style"), bodyStyle = _body.style, border = bodyStyle.borderTopStyle, AnimationProto = gsap.core.Animation.prototype, bounds, i;
        AnimationProto.revert || Object.defineProperty(AnimationProto, "revert", {
          value: function value() {
            return this.time(-0.01, true);
          }
        });
        bodyStyle.borderTopStyle = "solid";
        bounds = _getBounds(_body);
        _vertical.m = Math.round(bounds.top + _vertical.sc()) || 0;
        _horizontal.m = Math.round(bounds.left + _horizontal.sc()) || 0;
        border ? bodyStyle.borderTopStyle = border : bodyStyle.removeProperty("border-top-style");
        if (!bodyHasStyle) {
          _body.setAttribute("style", "");
          _body.removeAttribute("style");
        }
        _syncInterval = setInterval(_sync, 250);
        gsap.delayedCall(0.5, function() {
          return _startup = 0;
        });
        _addListener(_doc, "touchcancel", _passThrough);
        _addListener(_body, "touchstart", _passThrough);
        _multiListener(_addListener, _doc, "pointerdown,touchstart,mousedown", _pointerDownHandler);
        _multiListener(_addListener, _doc, "pointerup,touchend,mouseup", _pointerUpHandler);
        _transformProp = gsap.utils.checkPrefix("transform");
        _stateProps.push(_transformProp);
        _coreInitted = _getTime();
        _resizeDelay = gsap.delayedCall(0.2, _refreshAll).pause();
        _autoRefresh = [_doc, "visibilitychange", function() {
          var w = _win.innerWidth, h = _win.innerHeight;
          if (_doc.hidden) {
            _prevWidth = w;
            _prevHeight = h;
          } else if (_prevWidth !== w || _prevHeight !== h) {
            _onResize();
          }
        }, _doc, "DOMContentLoaded", _refreshAll, _win, "load", _refreshAll, _win, "resize", _onResize];
        _iterateAutoRefresh(_addListener);
        _triggers.forEach(function(trigger) {
          return trigger.enable(0, 1);
        });
        for (i = 0; i < _scrollers.length; i += 3) {
          _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 1]);
          _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 2]);
        }
      }
    }
  };
  ScrollTrigger2.config = function config(vars) {
    "limitCallbacks" in vars && (_limitCallbacks = !!vars.limitCallbacks);
    var ms = vars.syncInterval;
    ms && clearInterval(_syncInterval) || (_syncInterval = ms) && setInterval(_sync, ms);
    "ignoreMobileResize" in vars && (_ignoreMobileResize = ScrollTrigger2.isTouch === 1 && vars.ignoreMobileResize);
    if ("autoRefreshEvents" in vars) {
      _iterateAutoRefresh(_removeListener) || _iterateAutoRefresh(_addListener, vars.autoRefreshEvents || "none");
      _ignoreResize = (vars.autoRefreshEvents + "").indexOf("resize") === -1;
    }
  };
  ScrollTrigger2.scrollerProxy = function scrollerProxy(target, vars) {
    var t = _getTarget(target), i = _scrollers.indexOf(t), isViewport = _isViewport(t);
    if (~i) {
      _scrollers.splice(i, isViewport ? 6 : 2);
    }
    if (vars) {
      isViewport ? _proxies.unshift(_win, vars, _body, vars, _docEl, vars) : _proxies.unshift(t, vars);
    }
  };
  ScrollTrigger2.clearMatchMedia = function clearMatchMedia(query) {
    _triggers.forEach(function(t) {
      return t._ctx && t._ctx.query === query && t._ctx.kill(true, true);
    });
  };
  ScrollTrigger2.isInViewport = function isInViewport(element, ratio, horizontal) {
    var bounds = (_isString(element) ? _getTarget(element) : element).getBoundingClientRect(), offset = bounds[horizontal ? _width : _height] * ratio || 0;
    return horizontal ? bounds.right - offset > 0 && bounds.left + offset < _win.innerWidth : bounds.bottom - offset > 0 && bounds.top + offset < _win.innerHeight;
  };
  ScrollTrigger2.positionInViewport = function positionInViewport(element, referencePoint, horizontal) {
    _isString(element) && (element = _getTarget(element));
    var bounds = element.getBoundingClientRect(), size = bounds[horizontal ? _width : _height], offset = referencePoint == null ? size / 2 : referencePoint in _keywords ? _keywords[referencePoint] * size : ~referencePoint.indexOf("%") ? parseFloat(referencePoint) * size / 100 : parseFloat(referencePoint) || 0;
    return horizontal ? (bounds.left + offset) / _win.innerWidth : (bounds.top + offset) / _win.innerHeight;
  };
  ScrollTrigger2.killAll = function killAll(allowListeners) {
    _triggers.slice(0).forEach(function(t) {
      return t.vars.id !== "ScrollSmoother" && t.kill();
    });
    if (allowListeners !== true) {
      var listeners = _listeners.killAll || [];
      _listeners = {};
      listeners.forEach(function(f) {
        return f();
      });
    }
  };
  return ScrollTrigger2;
}();
ScrollTrigger.version = "3.13.0";
ScrollTrigger.saveStyles = function(targets) {
  return targets ? _toArray(targets).forEach(function(target) {
    if (target && target.style) {
      var i = _savedStyles.indexOf(target);
      i >= 0 && _savedStyles.splice(i, 5);
      _savedStyles.push(target, target.style.cssText, target.getBBox && target.getAttribute("transform"), gsap.core.getCache(target), _context());
    }
  }) : _savedStyles;
};
ScrollTrigger.revert = function(soft, media) {
  return _revertAll(!soft, media);
};
ScrollTrigger.create = function(vars, animation) {
  return new ScrollTrigger(vars, animation);
};
ScrollTrigger.refresh = function(safe) {
  return safe ? _onResize(true) : (_coreInitted || ScrollTrigger.register()) && _refreshAll(true);
};
ScrollTrigger.update = function(force) {
  return ++_scrollers.cache && _updateAll(force === true ? 2 : 0);
};
ScrollTrigger.clearScrollMemory = _clearScrollMemory;
ScrollTrigger.maxScroll = function(element, horizontal) {
  return _maxScroll(element, horizontal ? _horizontal : _vertical);
};
ScrollTrigger.getScrollFunc = function(element, horizontal) {
  return _getScrollFunc(_getTarget(element), horizontal ? _horizontal : _vertical);
};
ScrollTrigger.getById = function(id) {
  return _ids[id];
};
ScrollTrigger.getAll = function() {
  return _triggers.filter(function(t) {
    return t.vars.id !== "ScrollSmoother";
  });
};
ScrollTrigger.isScrolling = function() {
  return !!_lastScrollTime;
};
ScrollTrigger.snapDirectional = _snapDirectional;
ScrollTrigger.addEventListener = function(type, callback) {
  var a = _listeners[type] || (_listeners[type] = []);
  ~a.indexOf(callback) || a.push(callback);
};
ScrollTrigger.removeEventListener = function(type, callback) {
  var a = _listeners[type], i = a && a.indexOf(callback);
  i >= 0 && a.splice(i, 1);
};
ScrollTrigger.batch = function(targets, vars) {
  var result = [], varsCopy = {}, interval = vars.interval || 0.016, batchMax = vars.batchMax || 1e9, proxyCallback = function proxyCallback2(type, callback) {
    var elements = [], triggers = [], delay = gsap.delayedCall(interval, function() {
      callback(elements, triggers);
      elements = [];
      triggers = [];
    }).pause();
    return function(self) {
      elements.length || delay.restart(true);
      elements.push(self.trigger);
      triggers.push(self);
      batchMax <= elements.length && delay.progress(1);
    };
  }, p;
  for (p in vars) {
    varsCopy[p] = p.substr(0, 2) === "on" && _isFunction(vars[p]) && p !== "onRefreshInit" ? proxyCallback(p, vars[p]) : vars[p];
  }
  if (_isFunction(batchMax)) {
    batchMax = batchMax();
    _addListener(ScrollTrigger, "refresh", function() {
      return batchMax = vars.batchMax();
    });
  }
  _toArray(targets).forEach(function(target) {
    var config = {};
    for (p in varsCopy) {
      config[p] = varsCopy[p];
    }
    config.trigger = target;
    result.push(ScrollTrigger.create(config));
  });
  return result;
};
var _clampScrollAndGetDurationMultiplier = function _clampScrollAndGetDurationMultiplier2(scrollFunc, current, end, max) {
  current > max ? scrollFunc(max) : current < 0 && scrollFunc(0);
  return end > max ? (max - current) / (end - current) : end < 0 ? current / (current - end) : 1;
}, _allowNativePanning = function _allowNativePanning2(target, direction) {
  if (direction === true) {
    target.style.removeProperty("touch-action");
  } else {
    target.style.touchAction = direction === true ? "auto" : direction ? "pan-" + direction + (Observer.isTouch ? " pinch-zoom" : "") : "none";
  }
  target === _docEl && _allowNativePanning2(_body, direction);
}, _overflow = {
  auto: 1,
  scroll: 1
}, _nestedScroll = function _nestedScroll2(_ref5) {
  var event = _ref5.event, target = _ref5.target, axis = _ref5.axis;
  var node = (event.changedTouches ? event.changedTouches[0] : event).target, cache = node._gsap || gsap.core.getCache(node), time = _getTime(), cs;
  if (!cache._isScrollT || time - cache._isScrollT > 2e3) {
    while (node && node !== _body && (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth || !(_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]))) {
      node = node.parentNode;
    }
    cache._isScroll = node && node !== target && !_isViewport(node) && (_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]);
    cache._isScrollT = time;
  }
  if (cache._isScroll || axis === "x") {
    event.stopPropagation();
    event._gsapAllow = true;
  }
}, _inputObserver = function _inputObserver2(target, type, inputs, nested) {
  return Observer.create({
    target,
    capture: true,
    debounce: false,
    lockAxis: true,
    type,
    onWheel: nested = nested && _nestedScroll,
    onPress: nested,
    onDrag: nested,
    onScroll: nested,
    onEnable: function onEnable() {
      return inputs && _addListener(_doc, Observer.eventTypes[0], _captureInputs, false, true);
    },
    onDisable: function onDisable() {
      return _removeListener(_doc, Observer.eventTypes[0], _captureInputs, true);
    }
  });
}, _inputExp = /(input|label|select|textarea)/i, _inputIsFocused, _captureInputs = function _captureInputs2(e) {
  var isInput = _inputExp.test(e.target.tagName);
  if (isInput || _inputIsFocused) {
    e._gsapAllow = true;
    _inputIsFocused = isInput;
  }
}, _getScrollNormalizer = function _getScrollNormalizer2(vars) {
  _isObject(vars) || (vars = {});
  vars.preventDefault = vars.isNormalizer = vars.allowClicks = true;
  vars.type || (vars.type = "wheel,touch");
  vars.debounce = !!vars.debounce;
  vars.id = vars.id || "normalizer";
  var _vars2 = vars, normalizeScrollX = _vars2.normalizeScrollX, momentum = _vars2.momentum, allowNestedScroll = _vars2.allowNestedScroll, onRelease = _vars2.onRelease, self, maxY, target = _getTarget(vars.target) || _docEl, smoother = gsap.core.globals().ScrollSmoother, smootherInstance = smoother && smoother.get(), content = _fixIOSBug && (vars.content && _getTarget(vars.content) || smootherInstance && vars.content !== false && !smootherInstance.smooth() && smootherInstance.content()), scrollFuncY = _getScrollFunc(target, _vertical), scrollFuncX = _getScrollFunc(target, _horizontal), scale = 1, initialScale = (Observer.isTouch && _win.visualViewport ? _win.visualViewport.scale * _win.visualViewport.width : _win.outerWidth) / _win.innerWidth, wheelRefresh = 0, resolveMomentumDuration = _isFunction(momentum) ? function() {
    return momentum(self);
  } : function() {
    return momentum || 2.8;
  }, lastRefreshID, skipTouchMove, inputObserver = _inputObserver(target, vars.type, true, allowNestedScroll), resumeTouchMove = function resumeTouchMove2() {
    return skipTouchMove = false;
  }, scrollClampX = _passThrough, scrollClampY = _passThrough, updateClamps = function updateClamps2() {
    maxY = _maxScroll(target, _vertical);
    scrollClampY = _clamp(_fixIOSBug ? 1 : 0, maxY);
    normalizeScrollX && (scrollClampX = _clamp(0, _maxScroll(target, _horizontal)));
    lastRefreshID = _refreshID;
  }, removeContentOffset = function removeContentOffset2() {
    content._gsap.y = _round(parseFloat(content._gsap.y) + scrollFuncY.offset) + "px";
    content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(content._gsap.y) + ", 0, 1)";
    scrollFuncY.offset = scrollFuncY.cacheID = 0;
  }, ignoreDrag = function ignoreDrag2() {
    if (skipTouchMove) {
      requestAnimationFrame(resumeTouchMove);
      var offset = _round(self.deltaY / 2), scroll = scrollClampY(scrollFuncY.v - offset);
      if (content && scroll !== scrollFuncY.v + scrollFuncY.offset) {
        scrollFuncY.offset = scroll - scrollFuncY.v;
        var y = _round((parseFloat(content && content._gsap.y) || 0) - scrollFuncY.offset);
        content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + y + ", 0, 1)";
        content._gsap.y = y + "px";
        scrollFuncY.cacheID = _scrollers.cache;
        _updateAll();
      }
      return true;
    }
    scrollFuncY.offset && removeContentOffset();
    skipTouchMove = true;
  }, tween, startScrollX, startScrollY, onStopDelayedCall, onResize = function onResize2() {
    updateClamps();
    if (tween.isActive() && tween.vars.scrollY > maxY) {
      scrollFuncY() > maxY ? tween.progress(1) && scrollFuncY(maxY) : tween.resetTo("scrollY", maxY);
    }
  };
  content && gsap.set(content, {
    y: "+=0"
  });
  vars.ignoreCheck = function(e) {
    return _fixIOSBug && e.type === "touchmove" && ignoreDrag() || scale > 1.05 && e.type !== "touchstart" || self.isGesturing || e.touches && e.touches.length > 1;
  };
  vars.onPress = function() {
    skipTouchMove = false;
    var prevScale = scale;
    scale = _round((_win.visualViewport && _win.visualViewport.scale || 1) / initialScale);
    tween.pause();
    prevScale !== scale && _allowNativePanning(target, scale > 1.01 ? true : normalizeScrollX ? false : "x");
    startScrollX = scrollFuncX();
    startScrollY = scrollFuncY();
    updateClamps();
    lastRefreshID = _refreshID;
  };
  vars.onRelease = vars.onGestureStart = function(self2, wasDragging) {
    scrollFuncY.offset && removeContentOffset();
    if (!wasDragging) {
      onStopDelayedCall.restart(true);
    } else {
      _scrollers.cache++;
      var dur = resolveMomentumDuration(), currentScroll, endScroll;
      if (normalizeScrollX) {
        currentScroll = scrollFuncX();
        endScroll = currentScroll + dur * 0.05 * -self2.velocityX / 0.227;
        dur *= _clampScrollAndGetDurationMultiplier(scrollFuncX, currentScroll, endScroll, _maxScroll(target, _horizontal));
        tween.vars.scrollX = scrollClampX(endScroll);
      }
      currentScroll = scrollFuncY();
      endScroll = currentScroll + dur * 0.05 * -self2.velocityY / 0.227;
      dur *= _clampScrollAndGetDurationMultiplier(scrollFuncY, currentScroll, endScroll, _maxScroll(target, _vertical));
      tween.vars.scrollY = scrollClampY(endScroll);
      tween.invalidate().duration(dur).play(0.01);
      if (_fixIOSBug && tween.vars.scrollY >= maxY || currentScroll >= maxY - 1) {
        gsap.to({}, {
          onUpdate: onResize,
          duration: dur
        });
      }
    }
    onRelease && onRelease(self2);
  };
  vars.onWheel = function() {
    tween._ts && tween.pause();
    if (_getTime() - wheelRefresh > 1e3) {
      lastRefreshID = 0;
      wheelRefresh = _getTime();
    }
  };
  vars.onChange = function(self2, dx, dy, xArray, yArray) {
    _refreshID !== lastRefreshID && updateClamps();
    dx && normalizeScrollX && scrollFuncX(scrollClampX(xArray[2] === dx ? startScrollX + (self2.startX - self2.x) : scrollFuncX() + dx - xArray[1]));
    if (dy) {
      scrollFuncY.offset && removeContentOffset();
      var isTouch = yArray[2] === dy, y = isTouch ? startScrollY + self2.startY - self2.y : scrollFuncY() + dy - yArray[1], yClamped = scrollClampY(y);
      isTouch && y !== yClamped && (startScrollY += yClamped - y);
      scrollFuncY(yClamped);
    }
    (dy || dx) && _updateAll();
  };
  vars.onEnable = function() {
    _allowNativePanning(target, normalizeScrollX ? false : "x");
    ScrollTrigger.addEventListener("refresh", onResize);
    _addListener(_win, "resize", onResize);
    if (scrollFuncY.smooth) {
      scrollFuncY.target.style.scrollBehavior = "auto";
      scrollFuncY.smooth = scrollFuncX.smooth = false;
    }
    inputObserver.enable();
  };
  vars.onDisable = function() {
    _allowNativePanning(target, true);
    _removeListener(_win, "resize", onResize);
    ScrollTrigger.removeEventListener("refresh", onResize);
    inputObserver.kill();
  };
  vars.lockAxis = vars.lockAxis !== false;
  self = new Observer(vars);
  self.iOS = _fixIOSBug;
  _fixIOSBug && !scrollFuncY() && scrollFuncY(1);
  _fixIOSBug && gsap.ticker.add(_passThrough);
  onStopDelayedCall = self._dc;
  tween = gsap.to(self, {
    ease: "power4",
    paused: true,
    inherit: false,
    scrollX: normalizeScrollX ? "+=0.1" : "+=0",
    scrollY: "+=0.1",
    modifiers: {
      scrollY: _interruptionTracker(scrollFuncY, scrollFuncY(), function() {
        return tween.pause();
      })
    },
    onUpdate: _updateAll,
    onComplete: onStopDelayedCall.vars.onComplete
  });
  return self;
};
ScrollTrigger.sort = function(func) {
  if (_isFunction(func)) {
    return _triggers.sort(func);
  }
  var scroll = _win.pageYOffset || 0;
  ScrollTrigger.getAll().forEach(function(t) {
    return t._sortY = t.trigger ? scroll + t.trigger.getBoundingClientRect().top : t.start + _win.innerHeight;
  });
  return _triggers.sort(func || function(a, b) {
    return (a.vars.refreshPriority || 0) * -1e6 + (a.vars.containerAnimation ? 1e6 : a._sortY) - ((b.vars.containerAnimation ? 1e6 : b._sortY) + (b.vars.refreshPriority || 0) * -1e6);
  });
};
ScrollTrigger.observe = function(vars) {
  return new Observer(vars);
};
ScrollTrigger.normalizeScroll = function(vars) {
  if (typeof vars === "undefined") {
    return _normalizer;
  }
  if (vars === true && _normalizer) {
    return _normalizer.enable();
  }
  if (vars === false) {
    _normalizer && _normalizer.kill();
    _normalizer = vars;
    return;
  }
  var normalizer = vars instanceof Observer ? vars : _getScrollNormalizer(vars);
  _normalizer && _normalizer.target === normalizer.target && _normalizer.kill();
  _isViewport(normalizer.target) && (_normalizer = normalizer);
  return normalizer;
};
ScrollTrigger.core = {
  // smaller file size way to leverage in ScrollSmoother and Observer
  _getVelocityProp,
  _inputObserver,
  _scrollers,
  _proxies,
  bridge: {
    // when normalizeScroll sets the scroll position (ss = setScroll)
    ss: function ss() {
      _lastScrollTime || _dispatch("scrollStart");
      _lastScrollTime = _getTime();
    },
    // a way to get the _refreshing value in Observer
    ref: function ref() {
      return _refreshing;
    }
  }
};
_getGSAP() && gsap.registerPlugin(ScrollTrigger);
var aosExports = requireAos();
const AOS = /* @__PURE__ */ getDefaultExportFromCjs(aosExports);
gsapWithCSS.registerPlugin(ScrollTrigger);
class NeffPavingApp {
  constructor() {
    this.scrollRevealElements = [];
    this.isLoading = false;
    this.formProgress = 0;
    this.areaFinderInstance = null;
    this.init();
  }
  init() {
    initializeAssetOptimization();
    inject();
    injectSpeedInsights();
    this.preloadCriticalAssets();
    this.initLoadingAnimation();
    this.initAnimations();
    this.initScrollEffects();
    this.initRevealOnScroll();
    this.initNavigation();
    this.initGalleryFilters();
    this.initContactForm();
    this.initSectionAnimations();
    this.initConversionOptimizations();
    this.initInteractiveFeatures();
    this.initClickToCall();
    this.initEmergencyServiceHighlight();
    this.initNotificationSystem();
    this.initBlogSystem();
    this.initLazyLoading();
  }
  /**
   * Preload critical assets for better performance
   */
  preloadCriticalAssets() {
    const criticalAssets = [
      { path: "/assets/images/hero-bg.jpg", type: "image", priority: "high" },
      { path: "/assets/videos/neff-paving-1080p.mp4", type: "video", priority: "medium" },
      { path: "/assets/images/logo.png", type: "image", priority: "high" }
    ];
    assetLoader.preloadCriticalAssets(criticalAssets);
  }
  /**
   * Initialize lazy loading for images and videos
   */
  initLazyLoading() {
    document.querySelectorAll("img[src]").forEach((img) => {
      const src = img.src;
      if (src && !src.startsWith("data:") && !img.hasAttribute("data-no-lazy")) {
        img.dataset.src = src;
        img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGZpbGw9IiNGOEY5RkEiIGQ9Ik0wIDBoMXYxSDB6Ii8+PC9zdmc+";
        img.loading = "lazy";
        img.classList.add("lazy-load");
      }
    });
    assetLoader.addLazyImages();
  }
  initSectionAnimations() {
    document.querySelectorAll(".service-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsapWithCSS.to(card, {
          scale: 1.03,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      card.addEventListener("mouseleave", () => {
        gsapWithCSS.to(card, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
    document.querySelectorAll(".team-member").forEach((member, index) => {
      gsapWithCSS.from(member, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: member,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });
    });
    document.querySelectorAll(".contact-method").forEach((method, index) => {
      method.style.opacity = "1";
      method.style.transform = "none";
    });
    document.querySelectorAll(".stat-number").forEach((stat) => {
      const finalValue = stat.textContent;
      stat.textContent = "0";
      gsapWithCSS.to(stat, {
        textContent: finalValue,
        duration: 2,
        ease: "power2.out",
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: stat,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    });
    document.querySelectorAll(".cert-icon").forEach((icon, index) => {
      gsapWithCSS.from(icon, {
        scale: 0,
        rotation: 180,
        duration: 0.5,
        delay: index * 0.05,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: icon,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });
    });
  }
  initAnimations() {
    AOS.init({
      duration: 1e3,
      once: true,
      offset: 100
    });
    gsapWithCSS.from(".hero-content h2", {
      duration: 1.5,
      y: 50,
      opacity: 0,
      ease: "power3.out"
    });
    gsapWithCSS.from(".hero-content p", {
      duration: 1.5,
      y: 30,
      opacity: 0,
      delay: 0.3,
      ease: "power3.out"
    });
  }
  initAreaFinder() {
    const mapContainer = document.querySelector(".map-placeholder");
    if (mapContainer) {
      mapContainer.innerHTML = `
                <div id="area-finder-container">
                    <h4>Project Area Calculator</h4>
                    <p>Draw the area of your project on the map to get an accurate estimate.</p>
                </div>
            `;
      try {
        this.areaFinderInstance = new AreaFinder("area-finder-container", {
          showCalculator: true,
          showAddressSearch: true,
          showAreaInfo: true,
          onAreaCalculated: (areaData) => {
            console.log("Area calculated:", areaData);
            this.updateProjectSizeFromArea(areaData);
          }
        });
      } catch (error) {
        console.error("Error initializing area finder:", error);
        mapContainer.innerHTML = `
                    <div class="error-message">
                        <p>Unable to load map. Please enter project size manually in the form above.</p>
                    </div>
                `;
      }
    }
  }
  updateProjectSizeFromArea(areaData) {
    const projectSizeInput = document.getElementById("project-size");
    if (projectSizeInput && areaData.areaInSquareFeet) {
      projectSizeInput.value = `${Math.round(areaData.areaInSquareFeet)} sq ft`;
      projectSizeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  initScrollEffects() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      gsapWithCSS.to(".hero-content", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top bottom",
          end: "bottom top",
          scrub: 2
        }
      });
    }
    const heroTimeline = gsapWithCSS.timeline({
      scrollTrigger: {
        trigger: "#hero",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
    heroTimeline.from(".hero-title", {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    }).from(".hero-subtitle", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    }, "-=0.8").from(".hero-cta .btn", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power3.out"
    }, "-=0.6").from(".feature-badge", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out"
    }, "-=0.4");
    gsapWithCSS.from(".asphalt-service-grid .service-card, .concrete-service-container .service-card", {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".services-section",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
    gsapWithCSS.from(".gallery-item", {
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".gallery-container",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
    gsapWithCSS.to("header", {
      backgroundColor: "rgba(44, 62, 80, 0.98)",
      scrollTrigger: {
        trigger: "body",
        start: "top -50px",
        end: "top -100px",
        scrub: 1
      }
    });
    gsapWithCSS.utils.toArray("section").forEach((section, index) => {
      if (section.id !== "hero") {
        gsapWithCSS.from(section, {
          opacity: 0,
          y: 50,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        });
      }
    });
  }
  initNavigation() {
    document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
    let lastScrollTop = 0;
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const header = document.querySelector("header");
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        header.style.transform = "translateY(-100%)";
      } else {
        header.style.transform = "translateY(0)";
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
  }
  initGalleryFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const galleryItems = document.querySelectorAll(".gallery-item");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        const filter = button.dataset.filter;
        galleryItems.forEach((item) => {
          if (filter === "all" || item.dataset.category === filter) {
            item.style.display = "block";
            gsapWithCSS.fromTo(
              item,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, delay: Math.random() * 0.3 }
            );
          } else {
            gsapWithCSS.to(item, {
              opacity: 0,
              y: -20,
              duration: 0.3,
              onComplete: () => {
                item.style.display = "none";
              }
            });
          }
        });
      });
    });
  }
  initContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const formObject = Object.fromEntries(formData);
        if (this.areaFinderInstance && this.areaFinderInstance.getAreaData()) {
          formObject.areaData = this.areaFinderInstance.getAreaData();
        }
        if (!this.validateForm(formObject)) {
          return;
        }
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Sending...";
        submitButton.disabled = true;
        try {
          const response = await fetch("/api/estimates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(formObject)
          });
          const result = await response.json();
          if (result.success) {
            this.showSuccessMessage("Your estimate request has been submitted successfully!");
            contactForm.reset();
            if (this.areaFinderInstance) {
              this.areaFinderInstance.clearShapes();
            }
          } else {
            throw new Error(result.message || "Submission failed");
          }
        } catch (error) {
          console.error("Form submission error:", error);
          this.showSuccessMessage("Form submitted! We will contact you within 2 business hours.", "warning");
        } finally {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }
      });
    }
    const startChatBtn = document.getElementById("start-chat");
    if (startChatBtn) {
      startChatBtn.addEventListener("click", () => {
        alert("Chat widget would open here. In a real implementation, this would integrate with a chat service like Intercom, Zendesk, or custom solution.");
      });
    }
    const checkServiceAreaBtn = document.getElementById("check-service-area");
    if (checkServiceAreaBtn) {
      checkServiceAreaBtn.addEventListener("click", () => {
        const zipCode = prompt("Enter your ZIP code to check if we serve your area:");
        if (zipCode) {
          this.checkServiceArea(zipCode);
        }
      });
    }
  }
  validateForm(formData) {
    const required = ["firstName", "lastName", "email", "phone", "serviceType"];
    const errors = [];
    required.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        errors.push(field);
      }
    });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("email-format");
    }
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      errors.push("phone-format");
    }
    if (errors.length > 0) {
      this.showValidationErrors(errors);
      return false;
    }
    return true;
  }
  showValidationErrors(errors) {
    document.querySelectorAll(".error-message").forEach((msg) => msg.remove());
    errors.forEach((error) => {
      let fieldName, message;
      switch (error) {
        case "firstName":
          fieldName = "first-name";
          message = "First name is required";
          break;
        case "lastName":
          fieldName = "last-name";
          message = "Last name is required";
          break;
        case "email":
          fieldName = "email";
          message = "Email is required";
          break;
        case "email-format":
          fieldName = "email";
          message = "Please enter a valid email address";
          break;
        case "phone":
          fieldName = "phone";
          message = "Phone number is required";
          break;
        case "phone-format":
          fieldName = "phone";
          message = "Please enter a valid phone number";
          break;
        case "serviceType":
          fieldName = "service-type";
          message = "Please select a service type";
          break;
      }
      const field = document.getElementById(fieldName);
      if (field) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.style.color = "var(--error-red)";
        errorDiv.style.fontSize = "14px";
        errorDiv.style.marginTop = "var(--spacing-xs)";
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = "var(--error-red)";
      }
    });
  }
  showSuccessMessage(message = "Thank You!", type = "success") {
    const existingMessage = document.querySelector(".success-message");
    if (existingMessage) {
      existingMessage.remove();
    }
    const successDiv = document.createElement("div");
    successDiv.className = `success-message alert alert-${type === "success" ? "success" : "warning"}`;
    successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#d4edda" : "#fff3cd"};
            color: ${type === "success" ? "#155724" : "#856404"};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            border: 1px solid ${type === "success" ? "#c3e6cb" : "#ffeaa7"};
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
    successDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 600;">${type === "success" ? "✅ " : "⚠️ "}${message}</h4>
                    <p style="margin: 0; font-size: 0.9rem;">
                        ${type === "success" ? "Your estimate request has been submitted successfully. We'll contact you within 2 business hours with a detailed quote." : "Your form has been submitted. If you don't hear from us within 24 hours, please call us directly."}
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; margin-left: 1rem;">×</button>
            </div>
        `;
    document.body.appendChild(successDiv);
    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove();
      }
    }, 8e3);
    if (typeof gsapWithCSS !== "undefined") {
      gsapWithCSS.fromTo(
        successDiv,
        { x: 400, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }
  checkServiceArea(zipCode) {
    const serviceAreas = {
      primary: ["12345", "12346", "12347", "12348", "12349"],
      extended: ["12350", "12351", "12352", "12353", "12354"]
    };
    let message, inService = false;
    if (serviceAreas.primary.includes(zipCode)) {
      message = `Great news! ${zipCode} is in our primary service area. We offer full services with no additional travel charges.`;
      inService = true;
    } else if (serviceAreas.extended.includes(zipCode)) {
      message = `Good news! ${zipCode} is in our extended service area. We can serve your area for larger projects with minimal travel charges.`;
      inService = true;
    } else {
      message = `We're sorry, but ${zipCode} is currently outside our service area. However, we're always expanding! Please contact us directly to discuss your project.`;
    }
    const resultDiv = document.createElement("div");
    resultDiv.className = "service-area-result";
    resultDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: var(--spacing-xl);
            border-radius: var(--border-radius-lg);
            text-align: center;
            z-index: 10000;
            box-shadow: var(--shadow-lg);
            max-width: 400px;
            border: 3px solid ${inService ? "var(--success-green)" : "var(--warning-amber)"};
        `;
    resultDiv.innerHTML = `
            <h3 style="margin-bottom: var(--spacing-md); color: ${inService ? "var(--success-green)" : "var(--warning-amber)"};">Service Area Check</h3>
            <p style="margin-bottom: var(--spacing-lg); line-height: 1.5;">${message}</p>
            <button class="btn btn-primary" onclick="this.parentElement.remove()">Close</button>
            ${inService ? `<button class="btn btn-outline" style="margin-left: var(--spacing-md);" onclick="document.getElementById('contact-form').scrollIntoView({behavior: 'smooth'});">Get Quote</button>` : ""}
        `;
    document.body.appendChild(resultDiv);
    gsapWithCSS.fromTo(
      resultDiv,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  }
  initLoadingAnimation() {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay show";
    loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
        `;
    document.body.appendChild(loadingOverlay);
    window.addEventListener("load", () => {
      setTimeout(() => {
        loadingOverlay.classList.remove("show");
        setTimeout(() => {
          loadingOverlay.remove();
        }, 300);
      }, 500);
    });
  }
  initRevealOnScroll() {
    const elementsToReveal = [
      { selector: ".service-card", class: "reveal stagger-1" },
      { selector: ".gallery-item", class: "reveal-scale stagger-2" },
      { selector: ".team-member", class: "reveal-left stagger-3" },
      { selector: ".contact-method", class: "reveal-right stagger-1" },
      { selector: ".cert-category", class: "reveal stagger-2" }
    ];
    elementsToReveal.forEach(({ selector, class: className }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("reveal");
        if (className.includes("stagger")) {
          element.classList.add(`stagger-${index % 6 + 1}`);
        }
        if (className.includes("reveal-left")) {
          element.classList.add("reveal-left");
        } else if (className.includes("reveal-right")) {
          element.classList.add("reveal-right");
        } else if (className.includes("reveal-scale")) {
          element.classList.add("reveal-scale");
        }
      });
    });
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });
    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => {
      revealObserver.observe(el);
    });
  }
  initConversionOptimizations() {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      const progressBar = document.createElement("div");
      progressBar.className = "form-progress";
      progressBar.innerHTML = '<div class="form-progress-bar"></div>';
      contactForm.insertBefore(progressBar, contactForm.firstChild);
      const formInputs = contactForm.querySelectorAll("input[required], select[required], textarea[required]");
      const progressBarInner = progressBar.querySelector(".form-progress-bar");
      formInputs.forEach((input) => {
        input.addEventListener("input", () => {
          this.updateFormProgress(formInputs, progressBarInner);
        });
        input.addEventListener("change", () => {
          this.updateFormProgress(formInputs, progressBarInner);
        });
      });
    }
    this.addUrgencyIndicators();
    this.trackUserEngagement();
  }
  updateFormProgress(inputs, progressBar) {
    const filledInputs = Array.from(inputs).filter((input) => {
      if (input.type === "email") {
        return input.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      }
      return input.value && input.value.trim() !== "";
    });
    const progress = filledInputs.length / inputs.length * 100;
    progressBar.style.width = `${progress}%`;
    inputs.forEach((input) => {
      const formGroup = input.closest(".form-group");
      if (input.value && input.value.trim() !== "") {
        if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          formGroup.classList.remove("success");
          formGroup.classList.add("error");
        } else {
          formGroup.classList.remove("error");
          formGroup.classList.add("success");
        }
      } else {
        formGroup.classList.remove("success", "error");
      }
    });
  }
  createStickyCTA() {
    const stickyCTA = document.createElement("div");
    stickyCTA.className = "sticky-cta";
    stickyCTA.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--safety-yellow);
            color: var(--asphalt-dark);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: 25px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            font-family: var(--font-primary);
            font-weight: 600;
            cursor: pointer;
            transform: translateY(100px);
            transition: var(--transition);
        `;
    stickyCTA.innerHTML = `
            📞 Call for Free Quote: (555) 123-PAVE
        `;
    stickyCTA.addEventListener("click", () => {
      window.location.href = "tel:5551237283";
    });
    document.body.appendChild(stickyCTA);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          stickyCTA.style.transform = "translateY(0)";
        } else {
          stickyCTA.style.transform = "translateY(100px)";
        }
      });
    }, { threshold: 0.1 });
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      observer.observe(heroSection);
    }
  }
  addUrgencyIndicators() {
    const emergencyService = document.querySelector(".emergency-service");
    if (emergencyService) {
      const urgencyText = document.createElement("div");
      urgencyText.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                padding: var(--spacing-sm);
                border-radius: var(--border-radius);
                margin-top: var(--spacing-md);
                font-size: 14px;
                text-align: center;
            `;
      urgencyText.innerHTML = "⚡ Average response time: 30 minutes";
      emergencyService.appendChild(urgencyText);
    }
    this.addSocialProof();
  }
  addSocialProof() {
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      const socialProof = document.createElement("div");
      socialProof.className = "social-proof";
      socialProof.style.cssText = `
                margin-top: var(--spacing-lg);
                padding: var(--spacing-md);
                background: rgba(255, 255, 255, 0.1);
                border-radius: var(--border-radius);
                text-align: center;
                font-size: 14px;
            `;
      socialProof.innerHTML = `
                ⭐⭐⭐⭐⭐ Rated 4.9/5 by 200+ customers | 🏆 BBB A+ Rating
            `;
      heroContent.appendChild(socialProof);
    }
  }
  trackUserEngagement() {
    window.addEventListener("scroll", () => {
      const scrollPercent = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
      if (scrollPercent >= 50 && !this.hasShownScrollOffer) {
        this.showScrollOffer();
        this.hasShownScrollOffer = true;
      }
    });
    let timeOnPage = 0;
    setInterval(() => {
      timeOnPage += 1;
      if (timeOnPage >= 120 && !this.hasShownTimeOffer) {
        this.showTimeOffer();
        this.hasShownTimeOffer = true;
      }
    }, 1e3);
    document.addEventListener("mouseleave", (e) => {
      if (e.clientY < 0 && !this.hasShownExitIntent) {
        this.showExitIntentOffer();
        this.hasShownExitIntent = true;
      }
    });
  }
  showScrollOffer() {
    this.showNotification("📱 Still browsing? Get a free quote in under 2 minutes!", "info", () => {
      document.getElementById("contact-form").scrollIntoView({ behavior: "smooth" });
    });
  }
  showTimeOffer() {
    this.showNotification("⏰ Limited Time: Free site consultation with any quote request!", "warning");
  }
  showExitIntentOffer() {
    this.showNotification("🚀 Wait! Get 10% off your first project - Call now: (555) 123-PAVE", "success", () => {
      window.location.href = "tel:5551237283";
    });
  }
  initInteractiveFeatures() {
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.openGalleryModal(item);
      });
    });
    document.querySelectorAll(".cert-icon").forEach((icon) => {
      const listItem = icon.closest("li");
      if (listItem) {
        listItem.classList.add("tooltip");
        listItem.setAttribute("data-tooltip", "Click for more information");
      }
    });
    document.querySelectorAll(".service-card").forEach((card) => {
      const quoteBtn = card.querySelector(".btn");
      if (quoteBtn) {
        quoteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.prefilleForm(card);
        });
      }
    });
  }
  openGalleryModal(item) {
    const img = item.querySelector("img");
    const info = item.querySelector(".gallery-info");
    if (!img) return;
    const modal = document.createElement("div");
    modal.className = "modal show";
    modal.innerHTML = `
            <div class="modal-content">
                <img src="${img.src}" alt="${img.alt}" style="width: 100%; border-radius: var(--border-radius);">
                <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">${info ? info.querySelector("h4").textContent : "Project Gallery"}</h3>
                <p style="margin-bottom: var(--spacing-lg);">${info ? info.querySelector("p").textContent : ""}</p>
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('contact-form').scrollIntoView({behavior: 'smooth'}); this.closest('.modal').remove();" style="margin-left: var(--spacing-md);">Get Similar Quote</button>
                </div>
            </div>
        `;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    document.body.appendChild(modal);
  }
  prefilleForm(serviceCard) {
    const serviceTitle = serviceCard.querySelector("h3").textContent;
    const serviceSelect = document.getElementById("service-type");
    if (serviceSelect) {
      const serviceMap = {
        "Residential Paving": "residential",
        "Commercial Paving": "commercial",
        "Maintenance Services": "maintenance",
        "Custom Solutions": "custom"
      };
      const serviceValue = serviceMap[serviceTitle];
      if (serviceValue) {
        serviceSelect.value = serviceValue;
        serviceSelect.dispatchEvent(new Event("change"));
      }
    }
    document.getElementById("contact-form").scrollIntoView({ behavior: "smooth" });
    this.showNotification(`Form pre-filled for ${serviceTitle} services!`, "success");
  }
  initClickToCall() {
    const phoneNumbers = document.querySelectorAll('a[href^="tel:"]');
    phoneNumbers.forEach((phone) => {
      phone.addEventListener("click", () => {
        this.trackPhoneClick(phone.href);
      });
    });
    const phoneTexts = document.querySelectorAll(".method-info, .hero-subtitle");
    phoneTexts.forEach((element) => {
      const text = element.textContent;
      const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;
      if (phoneRegex.test(text)) {
        element.style.cursor = "pointer";
        element.style.textDecoration = "underline";
        element.addEventListener("click", () => {
          const phone = text.match(phoneRegex)[0];
          window.location.href = `tel:${phone.replace(/\D/g, "")}`;
        });
      }
    });
  }
  trackPhoneClick(phoneHref) {
    console.log("Phone click tracked:", phoneHref);
  }
  initEmergencyServiceHighlight() {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const isBusinessHours = hour >= 7 && hour <= 19;
    const emergencyMethods = document.querySelectorAll(".contact-method.emergency");
    emergencyMethods.forEach((method) => {
      if (!isBusinessHours) {
        method.style.order = "-1";
        method.style.transform = "scale(1.05)";
        const badge = document.createElement("div");
        badge.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: var(--warning-amber);
                    color: var(--asphalt-dark);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 700;
                    animation: pulse 2s infinite;
                `;
        badge.textContent = "AFTER HOURS";
        method.style.position = "relative";
        method.appendChild(badge);
      }
    });
  }
  initNotificationSystem() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        `;
    document.body.appendChild(container);
  }
  showNotification(message, type = "info", onClick = null) {
    const container = document.getElementById("notification-container");
    if (!container) return;
    const notification = document.createElement("div");
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <button onclick="this.closest('.notification').remove()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: var(--spacing-md);">&times;</button>
            </div>
        `;
    if (onClick) {
      notification.style.cursor = "pointer";
      notification.addEventListener("click", onClick);
    }
    container.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 5e3);
  }
  async initBlogSystem() {
    try {
      this.blogSystem = new BlogSystem();
      await this.blogSystem.init();
      this.loadRecentBlogPosts();
      this.handleBlogPage();
    } catch (error) {
      console.error("Error initializing blog system:", error);
    }
  }
  loadRecentBlogPosts() {
    const blogGrid = document.querySelector("#recent-blog .blog-grid");
    if (!blogGrid) return;
    const recentPosts = this.blogSystem.getRecentPosts(3);
    blogGrid.innerHTML = "";
    recentPosts.forEach((post) => {
      blogGrid.innerHTML += this.blogSystem.renderPostCard(post);
    });
  }
  async handleBlogPage() {
    if (!window.location.pathname.includes("blog.html")) return;
    console.log("Blog page detected, loading posts...");
    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get("post");
    const blogList = document.querySelector(".blog-list");
    if (!blogList) {
      console.error("Blog list container not found");
      return;
    }
    if (!this.blogSystem || this.blogSystem.posts.length === 0) {
      console.log("Blog system not ready, waiting...");
      setTimeout(() => this.handleBlogPage(), 100);
      return;
    }
    if (postSlug) {
      const post = this.blogSystem.getPostBySlug(postSlug);
      if (post) {
        blogList.innerHTML = this.blogSystem.renderFullPost(post);
        document.title = `${post.title} - Neff Paving Blog`;
      } else {
        blogList.innerHTML = "<p>Post not found.</p>";
      }
    } else {
      const allPosts = this.blogSystem.posts;
      console.log(`Rendering ${allPosts.length} posts`);
      if (allPosts.length === 0) {
        blogList.innerHTML = "<p>No blog posts available.</p>";
        return;
      }
      blogList.innerHTML = "";
      allPosts.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.innerHTML = this.blogSystem.renderPostCard(post);
        blogList.appendChild(postElement.firstElementChild);
      });
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new NeffPavingApp();
});
//# sourceMappingURL=main-Cc7LQw-4.js.map
