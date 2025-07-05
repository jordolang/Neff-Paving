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
                location.reload(); // Reload to show main interface
            } else {
                alert('Login failed: ' + result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
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