class AdminDashboard {
    constructor() {
        this.apiBase = 'http://localhost:8001/api';
        this.token = localStorage.getItem('admin_token');
        this.currentSection = 'dashboard';
        
        this.init();
    }

    async init() {
        if (!this.token) {
            this.showLogin();
            return;
        }

        try {
            await this.verifyToken();
            this.setupEventListeners();
            this.showSection('dashboard');
            this.loadDashboardData();
        } catch (error) {
            console.error('Authentication failed:', error);
            this.showLogin();
        }
    }

    async verifyToken() {
        const response = await fetch(`${this.apiBase}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token verification failed');
        }

        return response.json();
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="authentication-wrapper authentication-basic container-p-y">
                <div class="authentication-inner">
                    <div class="card">
                        <div class="card-body">
                            <div class="app-brand justify-content-center">
                                <h3 class="fw-bolder mb-3">Neff Paving Admin</h3>
                            </div>
                            
                            <h4 class="mb-2">Welcome! 👋</h4>
                            <p class="mb-4">Please sign-in to your account</p>

                            <form id="login-form" class="mb-3">
                                <div class="mb-3">
                                    <label for="username" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="username" name="username" placeholder="Enter your username" autofocus required>
                                </div>
                                <div class="mb-3 form-password-toggle">
                                    <label class="form-label" for="password">Password</label>
                                    <input type="password" id="password" class="form-control" name="password" placeholder="Password" required>
                                </div>
                                <div class="mb-3">
                                    <button class="btn btn-primary d-grid w-100" type="submit">Sign in</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('admin_token', result.token);
                this.token = result.token;
                
                // Instead of reloading, show the admin interface
                this.showAdminInterface();
            } else {
                alert('Login failed: ' + result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    showAdminInterface() {
        // Replace the login page with the full admin interface
        document.body.innerHTML = `
            <div class="layout-wrapper layout-content-navbar">
                <div class="layout-container">
                    <!-- Menu -->
                    <aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme">
                        <div class="app-brand demo">
                            <a href="#" class="app-brand-link">
                                <span class="app-brand-text demo menu-text fw-bolder ms-2">Neff Paving</span>
                            </a>
                        </div>

                        <div class="menu-inner-shadow"></div>

                        <ul class="menu-inner py-1">
                            <li class="menu-item active">
                                <a href="#dashboard" class="menu-link" data-section="dashboard">
                                    <i class="menu-icon tf-icons bx bx-home-circle"></i>
                                    <div data-i18n="Analytics">Dashboard</div>
                                </a>
                            </li>
                            
                            <li class="menu-item">
                                <a href="#estimates" class="menu-link" data-section="estimates">
                                    <i class="menu-icon tf-icons bx bx-file"></i>
                                    <div data-i18n="Estimates">Estimates</div>
                                </a>
                            </li>
                            
                            <li class="menu-item">
                                <a href="#jobs" class="menu-link" data-section="jobs">
                                    <i class="menu-icon tf-icons bx bx-task"></i>
                                    <div data-i18n="Jobs">Jobs</div>
                                </a>
                            </li>
                            
                            <li class="menu-item">
                                <a href="#customers" class="menu-link" data-section="customers">
                                    <i class="menu-icon tf-icons bx bx-user"></i>
                                    <div data-i18n="Customers">Customers</div>
                                </a>
                            </li>
                            
                            <li class="menu-item">
                                <a href="#maps" class="menu-link" data-section="maps">
                                    <i class="menu-icon tf-icons bx bx-map"></i>
                                    <div data-i18n="Maps">Service Areas</div>
                                </a>
                            </li>
                        </ul>
                    </aside>

                    <!-- Layout container -->
                    <div class="layout-page">
                        <!-- Navbar -->
                        <nav class="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">
                            <div class="navbar-nav-right d-flex align-items-center">
                                <span class="fw-semibold d-none d-sm-block">Admin Panel</span>
                                
                                <ul class="navbar-nav flex-row align-items-center ms-auto">
                                    <li class="nav-item navbar-dropdown dropdown-user dropdown">
                                        <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);">
                                            <div class="avatar avatar-online">
                                                <span class="avatar-initial rounded-circle bg-label-primary">A</span>
                                            </div>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li>
                                                <a class="dropdown-item" href="javascript:void(0);" onclick="adminDashboard.logout()">
                                                    <i class="bx bx-power-off me-2"></i>
                                                    <span class="align-middle">Log Out</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </nav>

                        <!-- Content wrapper -->
                        <div class="content-wrapper">
                            <!-- Content -->
                            <div class="container-xxl flex-grow-1 container-p-y">
                                <!-- Dashboard Section -->
                                <div id="dashboard-section" class="content-section">
                                    <div class="row">
                                        <div class="col-lg-8 mb-4 order-0">
                                            <div class="card">
                                                <div class="d-flex align-items-end row">
                                                    <div class="col-sm-7">
                                                        <div class="card-body">
                                                            <h5 class="card-title text-primary">Welcome to Admin Dashboard! 🎉</h5>
                                                            <p class="mb-4">
                                                                You have <span class="fw-bold" id="pending-estimates">0</span> pending estimates.
                                                                Check your estimates and manage your projects efficiently.
                                                            </p>
                                                            <a href="#estimates" class="btn btn-sm btn-outline-primary" data-section="estimates">View Estimates</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-lg-4 col-md-4 order-1">
                                            <div class="row">
                                                <div class="col-lg-6 col-md-12 col-6 mb-4">
                                                    <div class="card stats-card">
                                                        <div class="card-body">
                                                            <div class="card-title d-flex align-items-start justify-content-between">
                                                                <div class="avatar flex-shrink-0">
                                                                    <span class="avatar-initial rounded bg-label-success">
                                                                        📋
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span class="fw-semibold d-block mb-1">Active Jobs</span>
                                                            <h3 class="card-title mb-2" id="active-jobs">0</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="col-lg-6 col-md-12 col-6 mb-4">
                                                    <div class="card stats-card">
                                                        <div class="card-body">
                                                            <div class="card-title d-flex align-items-start justify-content-between">
                                                                <div class="avatar flex-shrink-0">
                                                                    <span class="avatar-initial rounded bg-label-info">
                                                                        💰
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span class="fw-semibold d-block mb-1">Revenue</span>
                                                            <h3 class="card-title mb-2" id="total-revenue">$0</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Recent Activities -->
                                    <div class="card mt-4">
                                        <h5 class="card-header">Recent Activities</h5>
                                        <div class="card-body">
                                            <div id="recent-activities">
                                                <div class="text-center">
                                                    <div class="loading-spinner"></div>
                                                    <p class="mt-2">Loading activities...</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Estimates Section -->
                                <div id="estimates-section" class="content-section" style="display: none;">
                                    <div class="card">
                                        <h5 class="card-header">Estimate Requests</h5>
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-borderless">
                                                    <thead>
                                                        <tr>
                                                            <th>Customer</th>
                                                            <th>Service Type</th>
                                                            <th>Address</th>
                                                            <th>Size</th>
                                                            <th>Status</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody id="estimates-table">
                                                        <tr>
                                                            <td colspan="6" class="text-center">
                                                                <div class="loading-spinner"></div>
                                                                <p class="mt-2">Loading estimates...</p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Jobs Section -->
                                <div id="jobs-section" class="content-section" style="display: none;">
                                    <div class="card">
                                        <h5 class="card-header">Scheduled Jobs</h5>
                                        <div class="card-body">
                                            <div id="jobs-content">Loading jobs...</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Customers Section -->
                                <div id="customers-section" class="content-section" style="display: none;">
                                    <div class="card">
                                        <h5 class="card-header">Customer Management</h5>
                                        <div class="card-body">
                                            <div id="customers-content">Loading customers...</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Maps Section -->
                                <div id="maps-section" class="content-section" style="display: none;">
                                    <div class="card">
                                        <h5 class="card-header">Service Area Management</h5>
                                        <div class="card-body">
                                            <p>Manage service areas and visualize project locations on the map.</p>
                                            <div id="admin-map" class="map-container"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Re-setup event listeners
        this.setupEventListeners();
        this.showSection('dashboard');
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section') || e.target.closest('[data-section]').getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`).closest('.menu-item');
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'estimates':
                this.loadEstimates();
                break;
            case 'jobs':
                this.loadJobs();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'maps':
                this.loadMaps();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [statsResponse, activitiesResponse] = await Promise.all([
                fetch(`${this.apiBase}/admin/dashboard/stats`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }),
                fetch(`${this.apiBase}/admin/dashboard/activities`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
            ]);

            const stats = await statsResponse.json();
            const activities = await activitiesResponse.json();

            if (stats.success) {
                document.getElementById('pending-estimates').textContent = stats.data.pendingEstimates;
                document.getElementById('active-jobs').textContent = stats.data.activeProjects;
                document.getElementById('total-revenue').textContent = `$${stats.data.revenue.toLocaleString()}`;
            }

            if (activities.success) {
                this.renderActivities(activities.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    renderActivities(activities) {
        const container = document.getElementById('recent-activities');
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activities</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="d-flex align-items-center mb-3">
                <div class="avatar avatar-sm me-3">
                    <span class="avatar-initial rounded-circle bg-label-${activity.status === 'completed' ? 'success' : 'warning'}">
                        <i class="bx bx-${activity.type === 'estimate_request' ? 'file' : 'task'}"></i>
                    </span>
                </div>
                <div class="flex-grow-1">
                    <small class="text-muted d-block">${new Date(activity.timestamp).toLocaleDateString()}</small>
                    <span>${activity.message}</span>
                </div>
                <span class="badge bg-label-${activity.status === 'completed' ? 'success' : 'warning'}">${activity.status}</span>
            </div>
        `).join('');
    }

    async loadEstimates() {
        try {
            const response = await fetch(`${this.apiBase}/estimates`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const result = await response.json();
            
            if (result.success) {
                this.renderEstimates(result.data);
            }
        } catch (error) {
            console.error('Error loading estimates:', error);
            document.getElementById('estimates-table').innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error loading estimates</td></tr>';
        }
    }

    renderEstimates(estimates) {
        const tbody = document.getElementById('estimates-table');
        
        if (estimates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No estimates found</td></tr>';
            return;
        }

        tbody.innerHTML = estimates.map(estimate => `
            <tr>
                <td>${estimate.firstName} ${estimate.lastName}</td>
                <td><span class="badge bg-label-primary">${estimate.serviceType}</span></td>
                <td>${estimate.projectAddress || 'N/A'}</td>
                <td>${estimate.projectSize || 'N/A'}</td>
                <td><span class="badge bg-label-${estimate.status === 'pending' ? 'warning' : 'success'}">${estimate.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.viewEstimate('${estimate.id}')">View</button>
                    ${estimate.areaData ? `<button class="btn btn-sm btn-outline-info" onclick="adminDashboard.viewArea('${estimate.id}')">View Area</button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    async loadJobs() {
        try {
            const response = await fetch(`${this.apiBase}/jobs`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const result = await response.json();
            
            if (result.success) {
                this.renderJobs(result.data);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            document.getElementById('jobs-table').innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error loading jobs</td></tr>';
        }
    }

    renderJobs(jobs) {
        const tbody = document.getElementById('jobs-table');
        
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No jobs found</td></tr>';
            return;
        }

        tbody.innerHTML = jobs.map(job => `
            <tr>
                <td>${job.title}</td>
                <td>${job.customerName}</td>
                <td>${new Date(job.startDate).toLocaleDateString()}</td>
                <td><span class="badge bg-label-${job.status === 'scheduled' ? 'info' : 'success'}">${job.status}</span></td>
                <td>$${job.estimatedCost.toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.viewJob('${job.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    async loadCustomers() {
        try {
            const response = await fetch(`${this.apiBase}/admin/customers`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const result = await response.json();
            
            if (result.success) {
                this.renderCustomers(result.data);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            document.getElementById('customers-table').innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error loading customers</td></tr>';
        }
    }

    renderCustomers(customers) {
        const tbody = document.getElementById('customers-table');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.address}</td>
                <td>${customer.totalProjects}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.viewCustomer('${customer.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    loadMaps() {
        // Initialize Google Maps for admin
        if (typeof google !== 'undefined') {
            this.initAdminMap();
        } else {
            // Load Google Maps API
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k&libraries=drawing,geometry&callback=adminDashboard.initAdminMap`;
            document.head.appendChild(script);
        }
    }

    initAdminMap() {
        const mapContainer = document.getElementById('admin-map');
        if (!mapContainer) return;

        const map = new google.maps.Map(mapContainer, {
            zoom: 10,
            center: { lat: 39.9612, lng: -82.9988 }, // Columbus, Ohio
            mapTypeId: 'hybrid'
        });

        // Add service area overlays
        this.addServiceAreas(map);
    }

    addServiceAreas(map) {
        // Primary service area (15-mile radius)
        const primaryArea = new google.maps.Circle({
            center: { lat: 39.9612, lng: -82.9988 },
            radius: 24140, // 15 miles in meters
            fillColor: '#FFD700',
            fillOpacity: 0.2,
            strokeColor: '#FFD700',
            strokeWeight: 2,
            map: map
        });

        // Extended service area (30-mile radius)
        const extendedArea = new google.maps.Circle({
            center: { lat: 39.9612, lng: -82.9988 },
            radius: 48280, // 30 miles in meters
            fillColor: '#FFA500',
            fillOpacity: 0.1,
            strokeColor: '#FFA500',
            strokeWeight: 1,
            map: map
        });

        // Add legend
        const legend = document.createElement('div');
        legend.innerHTML = `
            <div style="background: white; padding: 10px; margin: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h6>Service Areas</h6>
                <div><span style="color: #FFD700;">●</span> Primary (15 mi)</div>
                <div><span style="color: #FFA500;">●</span> Extended (30 mi)</div>
            </div>
        `;
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    }

    viewEstimate(id) {
        alert(`View estimate details for ID: ${id}`);
    }

    viewArea(id) {
        alert(`View area details for estimate ID: ${id}`);
    }

    viewJob(id) {
        alert(`View job details for ID: ${id}`);
    }

    viewCustomer(id) {
        alert(`View customer details for ID: ${id}`);
    }

    logout() {
        localStorage.removeItem('admin_token');
        location.reload();
    }
}

// Initialize admin dashboard
const adminDashboard = new AdminDashboard();

// Global logout function
function logout() {
    adminDashboard.logout();
}