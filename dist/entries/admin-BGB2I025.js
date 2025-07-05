import "../chunks/chunk-COaX8i6R.js";
class AdminDashboard {
  constructor() {
    this.apiBase = window.location.hostname === "localhost" ? "http://localhost:8001/api" : `${window.location.protocol}//${window.location.hostname}/api`;
    this.token = localStorage.getItem("admin_token");
    this.currentSection = "dashboard";
    this.init();
  }
  async init() {
    if (!this.token) {
      this.showLogin();
      return;
    }
    try {
      await this.verifyToken();
      this.showDashboard();
    } catch (error) {
      console.error("Authentication failed:", error);
      this.showLogin();
    }
  }
  async verifyToken() {
    const response = await fetch(`${this.apiBase}/auth/verify`, {
      headers: {
        "Authorization": `Bearer ${this.token}`
      }
    });
    if (!response.ok) {
      throw new Error("Token verification failed");
    }
    return response.json();
  }
  showLogin() {
    document.getElementById("login-screen").style.display = "block";
    document.getElementById("admin-dashboard").style.display = "none";
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
  }
  showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";
    this.setupEventListeners();
    this.showSection("dashboard");
    this.loadDashboardData();
  }
  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = {
      username: formData.get("username"),
      password: formData.get("password")
    };
    try {
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem("admin_token", result.token);
        this.token = result.token;
        this.showDashboard();
      } else {
        alert("Login failed: " + result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  }
  setupEventListeners() {
    document.querySelectorAll("[data-section]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = e.target.getAttribute("data-section") || e.target.closest("[data-section]").getAttribute("data-section");
        this.showSection(section);
      });
    });
  }
  showSection(sectionName) {
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active");
    });
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
    }
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.classList.remove("active");
    });
    const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavLink) {
      activeNavLink.classList.add("active");
    }
    this.currentSection = sectionName;
    switch (sectionName) {
      case "dashboard":
        this.loadDashboardData();
        break;
      case "estimates":
        this.loadEstimates();
        break;
      case "jobs":
        this.loadJobs();
        break;
      case "customers":
        this.loadCustomers();
        break;
      case "maps":
        this.loadMaps();
        break;
    }
  }
  async loadDashboardData() {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch(`${this.apiBase}/admin/dashboard/stats`, {
          headers: { "Authorization": `Bearer ${this.token}` }
        }),
        fetch(`${this.apiBase}/admin/dashboard/activities`, {
          headers: { "Authorization": `Bearer ${this.token}` }
        })
      ]);
      const stats = await statsResponse.json();
      const activities = await activitiesResponse.json();
      if (stats.success) {
        document.getElementById("pending-estimates").textContent = stats.data.pendingEstimates;
        document.getElementById("active-jobs").textContent = stats.data.activeProjects;
        document.getElementById("total-revenue").textContent = `$${stats.data.revenue.toLocaleString()}`;
        document.getElementById("total-projects").textContent = stats.data.totalProjects;
      }
      if (activities.success) {
        this.renderActivities(activities.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }
  renderActivities(activities) {
    const container = document.getElementById("recent-activities");
    if (activities.length === 0) {
      container.innerHTML = '<p class="text-muted">No recent activities</p>';
      return;
    }
    container.innerHTML = activities.map((activity) => `
            <div class="d-flex align-items-center mb-3 p-3 border rounded">
                <div class="avatar-initial bg-label-${activity.status === "completed" ? "success" : "warning"} me-3">
                    ${activity.type === "estimate_request" ? "📋" : "⚒️"}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${activity.message}</div>
                    <small class="text-muted">${new Date(activity.timestamp).toLocaleDateString()}</small>
                </div>
                <span class="badge bg-${activity.status === "completed" ? "success" : "warning"}">${activity.status}</span>
            </div>
        `).join("");
  }
  async loadEstimates() {
    try {
      const response = await fetch(`${this.apiBase}/estimates`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      const result = await response.json();
      if (result.success) {
        this.renderEstimates(result.data);
      }
    } catch (error) {
      console.error("Error loading estimates:", error);
      document.getElementById("estimates-table").innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error loading estimates</td></tr>';
    }
  }
  renderEstimates(estimates) {
    const tbody = document.getElementById("estimates-table");
    if (estimates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No estimates found</td></tr>';
      return;
    }
    tbody.innerHTML = estimates.map((estimate) => `
            <tr>
                <td>
                    <div class="fw-semibold">${estimate.firstName} ${estimate.lastName}</div>
                    <small class="text-muted">${estimate.email}</small>
                </td>
                <td><span class="badge bg-primary">${estimate.serviceType}</span></td>
                <td><small>${estimate.projectAddress || "N/A"}</small></td>
                <td>${estimate.projectSize || "N/A"}</td>
                <td><span class="badge bg-${estimate.status === "pending" ? "warning" : "success"}">${estimate.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminDashboard.viewEstimate('${estimate.id}')">View</button>
                    ${estimate.areaData ? `<button class="btn btn-sm btn-outline-info ms-1" onclick="adminDashboard.viewArea('${estimate.id}')">Area</button>` : ""}
                </td>
            </tr>
        `).join("");
  }
  async loadJobs() {
    console.log("Loading jobs...");
  }
  async loadCustomers() {
    console.log("Loading customers...");
  }
  loadMaps() {
    console.log("Loading maps...");
  }
  viewEstimate(id) {
    alert(`View estimate details for ID: ${id}`);
  }
  viewArea(id) {
    alert(`View area details for estimate ID: ${id}`);
  }
  logout() {
    localStorage.removeItem("admin_token");
    this.token = null;
    this.showLogin();
  }
}
new AdminDashboard();
//# sourceMappingURL=admin-BGB2I025.js.map
