// Determine Base API URL
const BASE_HOST = (window.location.protocol.startsWith("http") && (window.location.port === "8080" || window.location.port === ""))
    ? ""
    : "http://localhost:8080";

const API = {
    employees: `${BASE_HOST}/api/employees`,
    tasks: `${BASE_HOST}/api/tasks`,
    reviews: `${BASE_HOST}/api/reviews`
};

// Global Application State
let appState = {
    employees: [],
    tasks: [],
    reviews: [],
    taskFilter: "All",
    empTaskFilter: "All",
    employeeSearch: "",
    currentRole: "manager", // 'manager' | 'employee'
    activeEmployeeId: null,
    activeSection: "dashboard"
};

// DOM Elements
const alertBanner = document.getElementById("alertBanner");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// Section titles configuration
const sectionMeta = {
    dashboard: { title: "Manager Dashboard", subtitle: "Organization KPIs, top performers, and recent tasks" },
    employees: { title: "Employee Directory", subtitle: "Manage organization staff and departmental roles" },
    tasks: { title: "Task Management", subtitle: "Track, assign, and manage employee workflows" },
    reviews: { title: "Performance Reviews", subtitle: "Formal evaluations, star ratings, and managerial feedback" },
    leaderboard: { title: "Company Leaderboard", subtitle: "Ranked by Composite Performance Score (50% tasks + 50% reviews)" },
    "emp-dashboard": { title: "My Performance Overview", subtitle: "Personal KPIs, task progress, and evaluations" },
    "emp-tasks": { title: "My Assigned Tasks", subtitle: "Manage your active tasks and update progress in real time" },
    "emp-reviews": { title: "My Performance Reviews", subtitle: "Official feedback and star ratings received from leadership" }
};

// ================= INITIALIZATION & NAVIGATION =================

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupModals();
    setupFiltersAndSearch();
    loadAllData();
});

function setupNavigation() {
    // Navigation links in sidebar
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const section = link.getAttribute("data-section");
            if (section) switchSection(section);
        });
    });

    // Quick switch links in panels
    document.addEventListener("click", (e) => {
        const switchTarget = e.target.closest("[data-switch]");
        if (switchTarget) {
            e.preventDefault();
            const section = switchTarget.getAttribute("data-switch");
            if (section) switchSection(section);
        }
    });
}

function switchSection(sectionId) {
    appState.activeSection = sectionId;

    // Update active nav link for current nav set
    const currentNavId = appState.currentRole === "employee" ? "employeeNav" : "managerNav";
    document.querySelectorAll(`#${currentNavId} .nav-link`).forEach(link => {
        link.classList.toggle("active", link.getAttribute("data-section") === sectionId);
    });

    // Update visible content section
    document.querySelectorAll(".content-section").forEach(sec => {
        sec.classList.remove("active");
    });
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    // Update header title and subtitle
    const meta = sectionMeta[sectionId] || { title: "EPMS", subtitle: "" };
    if (pageTitle) pageTitle.textContent = meta.title;
    if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

    // If switching to employee sections, re-render employee portal
    if (sectionId.startsWith("emp-")) {
        renderEmployeePortal();
    }
}

// ================= ROLE & IDENTITY SWITCHING =================

function switchRole(role) {
    appState.currentRole = role;
    const roleManagerBtn = document.getElementById("roleManagerBtn");
    const roleEmployeeBtn = document.getElementById("roleEmployeeBtn");
    const activeEmployeeBox = document.getElementById("activeEmployeeSelectorBox");
    const managerNav = document.getElementById("managerNav");
    const employeeNav = document.getElementById("employeeNav");

    if (role === "employee") {
        roleManagerBtn.classList.remove("active");
        roleEmployeeBtn.classList.add("active");
        activeEmployeeBox.style.display = "block";
        managerNav.style.display = "none";
        employeeNav.style.display = "flex";

        // Auto-select first employee if none selected
        if (!appState.activeEmployeeId && appState.employees.length > 0) {
            appState.activeEmployeeId = Number(appState.employees[0].id);
        }
        const select = document.getElementById("currentEmployeeSelect");
        if (select && appState.activeEmployeeId) {
            select.value = appState.activeEmployeeId;
        }

        switchSection("emp-dashboard");
        renderEmployeePortal();
        renderLeaderboard();
    } else {
        roleEmployeeBtn.classList.remove("active");
        roleManagerBtn.classList.add("active");
        activeEmployeeBox.style.display = "none";
        employeeNav.style.display = "none";
        managerNav.style.display = "flex";

        switchSection("dashboard");
        renderLeaderboard();
    }
}

function changeActiveEmployee(empId) {
    appState.activeEmployeeId = empId ? Number(empId) : null;
    renderEmployeePortal();
    renderLeaderboard();
}

// ================= DATA FETCHING =================

async function loadAllData() {
    try {
        const [empRes, taskRes, revRes] = await Promise.all([
            fetch(API.employees),
            fetch(API.tasks),
            fetch(API.reviews)
        ]);

        if (!empRes.ok || !taskRes.ok || !revRes.ok) {
            throw new Error("One or more backend services failed to respond");
        }

        appState.employees = await empRes.json();
        appState.tasks = await taskRes.json();
        appState.reviews = await revRes.json();

        // Ensure active employee defaults to first employee if not set
        if (!appState.activeEmployeeId && appState.employees.length > 0) {
            appState.activeEmployeeId = Number(appState.employees[0].id);
        }

        clearAlert();
        renderAll();

    } catch (err) {
        console.error("Error fetching data:", err);
        showAlert("⚠️ Cannot connect to backend at http://localhost:8080. Please ensure Spring Boot is running.", "error");
    }
}

function renderAll() {
    renderDashboard();
    renderEmployees();
    renderTasks();
    renderReviews();
    renderLeaderboard();
    renderEmployeePortal();
    populateEmployeeDropdowns();
}

// ================= COMPOSITE PERFORMANCE CALCULATION =================

function calculateEmployeePerformance(emp) {
    const empId = Number(emp.id);
    const empTasks = appState.tasks.filter(t => Number(t.employeeId) === empId);
    const totalTasks = empTasks.length;
    const completedTasks = empTasks.filter(t => t.status === "Completed").length;
    const inProgressTasks = empTasks.filter(t => t.status === "In Progress").length;
    const pendingTasks = empTasks.filter(t => t.status === "Pending").length;

    // Task Completion Rate: if 0 tasks assigned, baseline 100%
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Review Score Average: if no reviews, baseline 85%
    const empReviews = appState.reviews.filter(r => Number(r.employeeId) === empId);
    let reviewAvg = 85;
    if (empReviews.length > 0) {
        const sum = empReviews.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
        reviewAvg = Math.round(sum / empReviews.length);
    }

    // Composite Performance Score: 50% task execution + 50% manager review score
    const compositeScore = Math.round((taskRate * 0.5) + (reviewAvg * 0.5));

    // Dynamic standing / tier
    let tier = "Good";
    let tierClass = "badge-tier-good";
    if (compositeScore >= 95) {
        tier = "🌟 Top Performer";
        tierClass = "badge-tier-top";
    } else if (compositeScore >= 85) {
        tier = "✨ High Achiever";
        tierClass = "badge-tier-high";
    } else if (compositeScore < 70) {
        tier = "⚠️ Needs Improvement";
        tierClass = "badge-tier-warn";
    }

    return {
        id: empId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        email: emp.email,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        taskRate,
        reviewAvg,
        compositeScore,
        tier,
        tierClass
    };
}

function getRankedEmployees() {
    return appState.employees
        .map(calculateEmployeePerformance)
        .sort((a, b) => {
            if (b.compositeScore !== a.compositeScore) {
                return b.compositeScore - a.compositeScore;
            }
            return b.completedTasks - a.completedTasks;
        });
}

// ================= MANAGER DASHBOARD RENDERING =================

function renderDashboard() {
    const totalEmployees = appState.employees.length;
    const totalTasks = appState.tasks.length;
    const completedTasks = appState.tasks.filter(t => t.status === "Completed").length;

    // Average Performance across all employees using composite score
    let avgComposite = 0;
    if (appState.employees.length > 0) {
        const ranked = getRankedEmployees();
        const sum = ranked.reduce((acc, e) => acc + e.compositeScore, 0);
        avgComposite = Math.round(sum / ranked.length);
    }

    document.getElementById("totalEmployees").textContent = totalEmployees;
    document.getElementById("totalTasks").textContent = totalTasks;
    document.getElementById("completedTasks").textContent = completedTasks;
    document.getElementById("averagePerformance").textContent = `${avgComposite}%`;

    // Render Dashboard Top Performers preview
    const topPerformerContainer = document.getElementById("dashboardTopPerformers");
    const ranked = getRankedEmployees().slice(0, 3);

    if (ranked.length === 0) {
        topPerformerContainer.innerHTML = `<p class="empty-state">No performance data available yet.</p>`;
    } else {
        topPerformerContainer.innerHTML = ranked.map((emp, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f8fafc;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:20px;">${medal}</span>
                        <div>
                            <strong>${escapeHtml(emp.name)}</strong>
                            <div style="font-size:12px; color:#64748b;">${escapeHtml(emp.department)}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span class="badge badge-progress">${emp.compositeScore}%</span>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">${emp.completedTasks}/${emp.totalTasks} tasks done</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Render Dashboard Recent Tasks preview
    const recentTasksContainer = document.getElementById("dashboardRecentTasks");
    const recentTasks = [...appState.tasks].slice(-4).reverse();

    if (recentTasks.length === 0) {
        recentTasksContainer.innerHTML = `<p class="empty-state">No tasks created yet.</p>`;
    } else {
        recentTasksContainer.innerHTML = recentTasks.map(task => {
            const statusClass = task.status === "Completed" ? "badge-completed" : task.status === "In Progress" ? "badge-progress" : "badge-pending";
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid #f8fafc;">
                    <div>
                        <strong>${escapeHtml(task.title)}</strong>
                        <div style="font-size:12px; color:#64748b;">Assigned to: ${escapeHtml(task.employeeName || "Unassigned")}</div>
                    </div>
                    <span class="badge ${statusClass}">${escapeHtml(task.status)}</span>
                </div>
            `;
        }).join("");
    }
}

// ================= EMPLOYEES DIRECTORY RENDERING =================

function renderEmployees() {
    const tableBody = document.getElementById("employeeTableBody");
    if (!tableBody) return;

    const query = appState.employeeSearch.toLowerCase();
    const filtered = appState.employees.filter(emp => 
        (emp.name && emp.name.toLowerCase().includes(query)) ||
        (emp.department && emp.department.toLowerCase().includes(query)) ||
        (emp.email && emp.email.toLowerCase().includes(query)) ||
        (emp.designation && emp.designation.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">No employees found. Click "+ Add Employee" to create one.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(emp => `
        <tr>
            <td><strong>#${emp.id}</strong></td>
            <td><strong>${escapeHtml(emp.name)}</strong></td>
            <td>${escapeHtml(emp.department)}</td>
            <td>${escapeHtml(emp.email)}</td>
            <td>${escapeHtml(emp.designation)}</td>
            <td>
                <button class="btn-action btn-edit" onclick="openEditEmployeeModal(${emp.id})">Edit</button>
                <button class="btn-action btn-delete" onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

// ================= MANAGER TASKS RENDERING =================

function renderTasks() {
    const tableBody = document.getElementById("taskTableBody");
    if (!tableBody) return;

    const filtered = appState.taskFilter === "All"
        ? appState.tasks
        : appState.tasks.filter(t => t.status === appState.taskFilter);

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">No tasks found for filter "${escapeHtml(appState.taskFilter)}". Click "+ Add Task" to create one.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(task => {
        const priorityClass = task.priority === "High" ? "badge-priority-high" : task.priority === "Medium" ? "badge-priority-medium" : "badge-priority-low";
        return `
            <tr>
                <td><strong>#${task.id}</strong></td>
                <td>
                    <strong>${escapeHtml(task.title)}</strong>
                    ${task.description ? `<div style="font-size:12px; color:#64748b;">${escapeHtml(task.description)}</div>` : ""}
                </td>
                <td>${escapeHtml(task.employeeName || "Unassigned")}</td>
                <td><span class="badge ${priorityClass}">${escapeHtml(task.priority)}</span></td>
                <td>${escapeHtml(task.dueDate || "No date")}</td>
                <td>
                    <select class="status-select" onchange="changeTaskStatus(${task.id}, this.value)">
                        <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
                    </select>
                </td>
                <td>
                    <button class="btn-action btn-delete" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

// ================= MANAGER REVIEWS RENDERING =================

function renderReviews() {
    const grid = document.getElementById("reviewsGrid");
    if (!grid) return;

    if (appState.reviews.length === 0) {
        grid.innerHTML = `<p class="empty-state" style="grid-column: 1 / -1;">No performance reviews submitted yet. Click "+ New Review" to add one.</p>`;
        return;
    }

    grid.innerHTML = appState.reviews.map(review => {
        const starCount = review.rating || 5;
        const stars = "⭐".repeat(starCount);
        return `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <div class="review-employee-name">${escapeHtml(review.employeeName || "Employee")}</div>
                        <div class="review-stars">${stars} (${starCount}/5)</div>
                    </div>
                    <span class="review-score-tag">${review.score || 0}% Score</span>
                </div>
                <div class="review-feedback">"${escapeHtml(review.feedback || "Good performance.")}"</div>
                <div class="review-footer">
                    <span>By: <strong>${escapeHtml(review.reviewer || "Manager")}</strong></span>
                    <span>${escapeHtml(review.reviewDate || "")}</span>
                    <button class="btn-action btn-delete" style="padding:3px 8px; font-size:11px;" onclick="deleteReview(${review.id})">Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

// ================= EMPLOYEE PORTAL RENDERING =================

function renderEmployeePortal() {
    if (!appState.activeEmployeeId) return;

    const currentEmp = appState.employees.find(e => Number(e.id) === Number(appState.activeEmployeeId));
    if (!currentEmp) return;

    const perf = calculateEmployeePerformance(currentEmp);

    // 1. Profile Banner
    const pName = document.getElementById("empProfileName");
    const pDetails = document.getElementById("empProfileDetails");
    const pBadge = document.getElementById("empProfileTierBadge");

    if (pName) pName.textContent = currentEmp.name;
    if (pDetails) pDetails.textContent = `${currentEmp.department} • ${currentEmp.designation} • ${currentEmp.email}`;
    if (pBadge) {
        pBadge.textContent = perf.tier;
        pBadge.className = `emp-profile-badge ${perf.tierClass}`;
    }

    // 2. Personal KPI Cards
    const statTotal = document.getElementById("empStatTotalTasks");
    const statCompleted = document.getElementById("empStatCompletedTasks");
    const statRate = document.getElementById("empStatCompletionRate");
    const statScore = document.getElementById("empStatPerformanceScore");

    if (statTotal) statTotal.textContent = perf.totalTasks;
    if (statCompleted) statCompleted.textContent = perf.completedTasks;
    if (statRate) statRate.textContent = `${perf.taskRate}%`;
    if (statScore) statScore.textContent = `${perf.compositeScore}%`;

    // 3. Employee Dashboard Quick Panels
    // Urgent / In-Progress Tasks
    const empDashTasks = document.getElementById("empDashboardTasks");
    if (empDashTasks) {
        const activeEmpTasks = appState.tasks.filter(t => Number(t.employeeId) === perf.id);
        const pendingOrProgress = activeEmpTasks.filter(t => t.status !== "Completed");

        if (pendingOrProgress.length === 0) {
            empDashTasks.innerHTML = `<p class="empty-state" style="color:#16a34a;">🎉 All caught up! No pending tasks remaining.</p>`;
        } else {
            empDashTasks.innerHTML = pendingOrProgress.map(task => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f8fafc;">
                    <div>
                        <strong>${escapeHtml(task.title)}</strong>
                        <div style="font-size:12px; color:#64748b;">Due: ${escapeHtml(task.dueDate || "No date")} &bull; Status: <span class="badge ${task.status === "In Progress" ? "badge-progress" : "badge-pending"}">${escapeHtml(task.status)}</span></div>
                    </div>
                    <div>
                        ${task.status === "Pending" ? `<button class="btn-quick-start" onclick="changeTaskStatus(${task.id}, 'In Progress')">Start Work</button>` : ""}
                        <button class="btn-quick-complete" onclick="changeTaskStatus(${task.id}, 'Completed')">Mark Done</button>
                    </div>
                </div>
            `).join("");
        }
    }

    // Latest Review
    const empDashReview = document.getElementById("empDashboardReview");
    if (empDashReview) {
        const myReviews = appState.reviews.filter(r => Number(r.employeeId) === perf.id);
        if (myReviews.length === 0) {
            empDashReview.innerHTML = `<p class="empty-state">No formal reviews received yet. Keep delivering quality work!</p>`;
        } else {
            const latest = myReviews[myReviews.length - 1];
            const stars = "⭐".repeat(latest.rating || 5);
            empDashReview.innerHTML = `
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div>
                            <span style="font-size:16px;">${stars}</span>
                            <span style="font-size:13px; color:#64748b; margin-left:6px;">(${latest.rating}/5)</span>
                        </div>
                        <span class="badge badge-progress">${latest.score}% Score</span>
                    </div>
                    <div class="review-feedback" style="margin-bottom:12px;">"${escapeHtml(latest.feedback)}"</div>
                    <div style="font-size:12px; color:#64748b;">Reviewed by: <strong>${escapeHtml(latest.reviewer)}</strong> on ${escapeHtml(latest.reviewDate)}</div>
                </div>
            `;
        }
    }

    // 4. Employee Personal Tasks Table
    const empTaskTableBody = document.getElementById("empTaskTableBody");
    if (empTaskTableBody) {
        const empTasks = appState.tasks.filter(t => Number(t.employeeId) === perf.id);
        const filtered = appState.empTaskFilter === "All"
            ? empTasks
            : empTasks.filter(t => t.status === appState.empTaskFilter);

        if (filtered.length === 0) {
            empTaskTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No tasks found under filter "${escapeHtml(appState.empTaskFilter)}".</td>
                </tr>
            `;
        } else {
            empTaskTableBody.innerHTML = filtered.map(task => {
                const priorityClass = task.priority === "High" ? "badge-priority-high" : task.priority === "Medium" ? "badge-priority-medium" : "badge-priority-low";
                const statusClass = task.status === "Completed" ? "badge-completed" : task.status === "In Progress" ? "badge-progress" : "badge-pending";

                let actionButtons = "";
                if (task.status === "Pending") {
                    actionButtons = `
                        <button class="btn-quick-start" onclick="changeTaskStatus(${task.id}, 'In Progress')">Start</button>
                        <button class="btn-quick-complete" onclick="changeTaskStatus(${task.id}, 'Completed')">Complete</button>
                    `;
                } else if (task.status === "In Progress") {
                    actionButtons = `
                        <button class="btn-quick-complete" onclick="changeTaskStatus(${task.id}, 'Completed')">Mark Completed</button>
                    `;
                } else {
                    actionButtons = `
                        <button class="btn-action" style="background:#64748b; color:white;" onclick="changeTaskStatus(${task.id}, 'In Progress')">Reopen</button>
                    `;
                }

                return `
                    <tr>
                        <td><strong>#${task.id}</strong></td>
                        <td>
                            <strong>${escapeHtml(task.title)}</strong>
                            ${task.description ? `<div style="font-size:12px; color:#64748b;">${escapeHtml(task.description)}</div>` : ""}
                        </td>
                        <td><span class="badge ${priorityClass}">${escapeHtml(task.priority)}</span></td>
                        <td>${escapeHtml(task.dueDate || "No date")}</td>
                        <td><span class="badge ${statusClass}">${escapeHtml(task.status)}</span></td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
            }).join("");
        }
    }

    // 5. Employee Personal Reviews Grid
    const empReviewsGrid = document.getElementById("empReviewsGrid");
    if (empReviewsGrid) {
        const myReviews = appState.reviews.filter(r => Number(r.employeeId) === perf.id);
        if (myReviews.length === 0) {
            empReviewsGrid.innerHTML = `<p class="empty-state" style="grid-column: 1 / -1;">No performance reviews on file yet.</p>`;
        } else {
            empReviewsGrid.innerHTML = myReviews.map(review => {
                const starCount = review.rating || 5;
                const stars = "⭐".repeat(starCount);
                return `
                    <div class="review-card">
                        <div class="review-header">
                            <div>
                                <div class="review-stars">${stars} (${starCount}/5)</div>
                            </div>
                            <span class="review-score-tag">${review.score || 0}% Score</span>
                        </div>
                        <div class="review-feedback">"${escapeHtml(review.feedback || "Good performance.")}"</div>
                        <div class="review-footer">
                            <span>Reviewed by: <strong>${escapeHtml(review.reviewer || "Manager")}</strong></span>
                            <span>${escapeHtml(review.reviewDate || "")}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }
}

// ================= SHARED LEADERBOARD RENDERING =================

function renderLeaderboard() {
    const tableBody = document.getElementById("leaderboardTableBody");
    if (!tableBody) return;

    const ranked = getRankedEmployees();

    if (ranked.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">No employee ranking data available yet.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = ranked.map((emp, index) => {
        const rank = index + 1;
        let rankDisplay = `#${rank}`;
        if (rank === 1) rankDisplay = `🥇 1st`;
        else if (rank === 2) rankDisplay = `🥈 2nd`;
        else if (rank === 3) rankDisplay = `🥉 3rd`;

        const isCurrentEmp = (appState.currentRole === "employee" && Number(emp.id) === Number(appState.activeEmployeeId));
        const rowClass = isCurrentEmp ? "leaderboard-highlight-row" : "";
        const youBadge = isCurrentEmp ? `<span class="badge-you">You</span>` : "";

        return `
            <tr class="${rowClass}">
                <td><span class="rank-badge">${rankDisplay}</span></td>
                <td><strong>${escapeHtml(emp.name)}</strong>${youBadge}</td>
                <td>${escapeHtml(emp.department)}</td>
                <td><strong>${emp.completedTasks}</strong> / ${emp.totalTasks} completed</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${emp.compositeScore}%;"></div>
                        </div>
                        <strong style="font-size:13px; color:#2563eb;">${emp.compositeScore}%</strong>
                    </div>
                </td>
                <td><span class="badge ${emp.tierClass}">${emp.tier}</span></td>
            </tr>
        `;
    }).join("");
}

// ================= MODAL & FORM CONTROLLERS =================

function setupModals() {
    // Open Employee Modal (Add)
    const addEmpBtn = document.getElementById("addEmployeeBtn");
    if (addEmpBtn) {
        addEmpBtn.addEventListener("click", () => {
            document.getElementById("employeeForm").reset();
            document.getElementById("employeeId").value = "";
            document.getElementById("employeeModalTitle").textContent = "Add Employee";
            openModal("employeeModal");
        });
    }

    // Open Task Modal (Add)
    const addTaskBtn = document.getElementById("addTaskBtn");
    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            document.getElementById("taskForm").reset();
            const d = new Date();
            d.setDate(d.getDate() + 14);
            document.getElementById("taskDueDate").value = d.toISOString().split("T")[0];
            openModal("taskModal");
        });
    }

    // Open Review Modal (Add)
    const addReviewBtn = document.getElementById("addReviewBtn");
    if (addReviewBtn) {
        addReviewBtn.addEventListener("click", () => {
            document.getElementById("reviewForm").reset();
            openModal("reviewModal");
        });
    }

    // Close on overlay backdrop click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Employee Form Submission
    document.getElementById("employeeForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("employeeId").value.trim();
        const emp = {
            name: document.getElementById("employeeName").value.trim(),
            department: document.getElementById("employeeDept").value.trim(),
            email: document.getElementById("employeeEmail").value.trim(),
            designation: document.getElementById("employeeDesig").value.trim()
        };

        try {
            const url = id ? `${API.employees}/${id}` : API.employees;
            const method = id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emp)
            });

            if (!res.ok) throw new Error("Failed to save employee");

            closeAllModals();
            showAlert(id ? "Employee updated successfully!" : "Employee added successfully!", "success");
            loadAllData();
        } catch (err) {
            console.error(err);
            showAlert("Failed to save employee details.", "error");
        }
    });

    // Task Form Submission
    document.getElementById("taskForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const empSelect = document.getElementById("taskEmployeeSelect");
        const empId = empSelect.value ? parseInt(empSelect.value) : null;
        const empName = empSelect.options[empSelect.selectedIndex]?.text || "Unassigned";

        const task = {
            title: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDesc").value.trim(),
            employeeId: empId,
            employeeName: empName,
            priority: document.getElementById("taskPriority").value,
            status: document.getElementById("taskStatus").value,
            dueDate: document.getElementById("taskDueDate").value
        };

        try {
            const res = await fetch(API.tasks, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(task)
            });

            if (!res.ok) throw new Error("Failed to create task");

            closeAllModals();
            showAlert("Task created successfully!", "success");
            loadAllData();
        } catch (err) {
            console.error(err);
            showAlert("Failed to create task.", "error");
        }
    });

    // Review Form Submission
    document.getElementById("reviewForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const empSelect = document.getElementById("reviewEmployeeSelect");
        const empId = parseInt(empSelect.value);
        const empName = empSelect.options[empSelect.selectedIndex]?.text || "Employee";

        const review = {
            employeeId: empId,
            employeeName: empName,
            score: parseInt(document.getElementById("reviewScore").value),
            rating: parseInt(document.getElementById("reviewRating").value),
            feedback: document.getElementById("reviewFeedback").value.trim(),
            reviewer: document.getElementById("reviewerName").value.trim(),
            reviewDate: new Date().toISOString().split("T")[0]
        };

        try {
            const res = await fetch(API.reviews, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(review)
            });

            if (!res.ok) throw new Error("Failed to submit review");

            closeAllModals();
            showAlert("Performance review submitted successfully!", "success");
            loadAllData();
        } catch (err) {
            console.error(err);
            showAlert("Failed to submit performance review.", "error");
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
}

function populateEmployeeDropdowns() {
    const taskSelect = document.getElementById("taskEmployeeSelect");
    const reviewSelect = document.getElementById("reviewEmployeeSelect");
    const currentSelect = document.getElementById("currentEmployeeSelect");

    const options = appState.employees.map(e => 
        `<option value="${e.id}">${escapeHtml(e.name)} (${escapeHtml(e.department)})</option>`
    ).join("");

    if (taskSelect) {
        taskSelect.innerHTML = `<option value="">Select Employee...</option>` + options;
    }
    if (reviewSelect) {
        reviewSelect.innerHTML = `<option value="">Select Employee...</option>` + options;
    }
    if (currentSelect) {
        currentSelect.innerHTML = options;
        if (appState.activeEmployeeId) {
            currentSelect.value = appState.activeEmployeeId;
        }
    }
}

// Edit employee helper
function openEditEmployeeModal(id) {
    const emp = appState.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById("employeeId").value = emp.id;
    document.getElementById("employeeName").value = emp.name || "";
    document.getElementById("employeeDept").value = emp.department || "";
    document.getElementById("employeeEmail").value = emp.email || "";
    document.getElementById("employeeDesig").value = emp.designation || "";
    document.getElementById("employeeModalTitle").textContent = "Edit Employee";

    openModal("employeeModal");
}

// Change Task Status inline (Instant reactivity)
async function changeTaskStatus(id, newStatus) {
    try {
        const res = await fetch(`${API.tasks}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error("Status update failed");

        // Immediately update in local state
        const task = appState.tasks.find(t => Number(t.id) === Number(id));
        if (task) {
            task.status = newStatus;
        }

        showAlert(`Task #${id} status updated to ${newStatus}`, "success");

        // Re-render all views to immediately reflect new score & rank
        renderAll();

    } catch (err) {
        console.error(err);
        showAlert("Failed to update task status.", "error");
        loadAllData();
    }
}

// ================= DELETION HANDLERS =================

async function deleteEmployee(id) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
        const res = await fetch(`${API.employees}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        showAlert("Employee deleted successfully!", "success");
        loadAllData();
    } catch (err) {
        console.error(err);
        showAlert("Error deleting employee.", "error");
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
        const res = await fetch(`${API.tasks}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        showAlert("Task deleted successfully!", "success");
        loadAllData();
    } catch (err) {
        console.error(err);
        showAlert("Error deleting task.", "error");
    }
}

async function deleteReview(id) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
        const res = await fetch(`${API.reviews}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        showAlert("Performance review deleted successfully!", "success");
        loadAllData();
    } catch (err) {
        console.error(err);
        showAlert("Error deleting review.", "error");
    }
}

// ================= FILTERS & SEARCH =================

function setupFiltersAndSearch() {
    // Manager Task Filter Buttons
    document.querySelectorAll(".filter-btn[data-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn[data-filter]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            appState.taskFilter = btn.getAttribute("data-filter");
            renderTasks();
        });
    });

    // Employee Personal Task Filter Buttons
    document.querySelectorAll(".filter-btn[data-emp-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn[data-emp-filter]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            appState.empTaskFilter = btn.getAttribute("data-emp-filter");
            renderEmployeePortal();
        });
    });

    // Employee Search Input
    const searchInput = document.getElementById("employeeSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            appState.employeeSearch = e.target.value;
            renderEmployees();
        });
    }
}

// ================= UTILITIES =================

function showAlert(message, type = "error") {
    if (!alertBanner) return;
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner ${type}`;
    if (type === "success") {
        setTimeout(() => {
            alertBanner.className = "alert-banner";
        }, 3500);
    }
}

function clearAlert() {
    if (alertBanner) alertBanner.className = "alert-banner";
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Global exposure for HTML event attributes
window.switchRole = switchRole;
window.changeActiveEmployee = changeActiveEmployee;
window.switchSection = switchSection;
window.openEditEmployeeModal = openEditEmployeeModal;
window.changeTaskStatus = changeTaskStatus;
window.deleteEmployee = deleteEmployee;
window.deleteTask = deleteTask;
window.deleteReview = deleteReview;
window.closeAllModals = closeAllModals;