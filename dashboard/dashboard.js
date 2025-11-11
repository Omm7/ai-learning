// ====================
// CONFIGURATION
// ====================
const API_BASE = "http://localhost:5000";
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let allCourses = []; // Global storage for fetched courses

// Username fallback
if (currentUser) {
  currentUser.username =
    currentUser.username ||
    currentUser.name ||
    currentUser.first_name ||
    currentUser.email?.split("@")[0] ||
    "User";
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

if (currentUser && !currentUser.username) currentUser.username = "User";

// DOM Elements
const userWelcome = document.getElementById("userWelcome");
const noticeAdminControls = document.getElementById("noticeAdminControls");
const academicAdminControls = document.getElementById("academicAdminControls");
const noticesContainer = document.getElementById("noticesContainer");
const coursesContainer = document.getElementById("coursesContainer");
const academicInfoContainer = document.getElementById("academicInfoContainer");
const notificationContainer = document.getElementById("notificationContainer");
const globalSearch = document.getElementById("globalSearch");

// ====================
// INIT
// ====================
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuthentication()) return;
  updateUIForUser();
  setupNavLinks();
  setupUserMenuDropdown();

  fetchNotices();
  fetchCourses();
  fetchAcademicInfo();
  setupGlobalSearch();
});

// ====================
// AUTH CHECK
// ====================
function checkAuthentication() {
  if (!currentUser) {
    window.location.href = "../auth/login.html";
    return false;
  }
  return true;
}

// ====================
// USER INTERFACE
// ====================
function updateUIForUser() {
  if (!currentUser) return;

  const isAdmin = currentUser.role === "admin";
  const displayName =
    currentUser.username?.charAt(0).toUpperCase() +
      currentUser.username?.slice(1) || "User";

  userWelcome.textContent = displayName;

  if (isAdmin) {
    noticeAdminControls.style.display = "block";
    academicAdminControls.style.display = "block";
  } else {
    noticeAdminControls.style.display = "none";
    academicAdminControls.style.display = "none";
  }
}

function setupNavLinks() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      document
        .querySelectorAll(".content-section")
        .forEach((sec) => sec.classList.remove("active"));

      link.classList.add("active");
      const sectionId = link.getAttribute("data-section") + "Section";
      const target = document.getElementById(sectionId);
      if (target) target.classList.add("active");
    });
  });
}

// ====================
// NOTICES
// ====================
async function fetchNotices() {
  try {
    const res = await fetch(`${API_BASE}/api/notices`);
    const data = await res.json();
    if (data.success) renderNotices(data.notices);
    else noticesContainer.innerHTML = "<p>Failed to load notices.</p>";
  } catch (err) {
    console.error("Error fetching notices:", err);
    noticesContainer.innerHTML = "<p>Error loading notices.</p>";
  }
}

function renderNotices(notices = []) {
  const isAdmin = currentUser?.role === "admin";
  if (!noticesContainer) return;

  if (notices.length === 0) {
    noticesContainer.innerHTML = "<p>No notices available.</p>";
    return;
  }

  noticesContainer.innerHTML = notices
    .map(
      (n) => `
      <div class="notice-card glass-card">
        <div class="notice-header">
          <div>
            <h3>${n.title}</h3>
            <span>${formatDate(n.created_at)}</span>
          </div>
        </div>
        <p>${n.content || ""}</p>
        <div class="card-actions">
          ${
            n.file_path
              ? `<a href="${API_BASE}${n.file_path}" target="_blank" class="glossy-btn btn-blue"><i class="fas fa-eye"></i> View</a>`
              : ""
          }
          ${
            isAdmin
              ? `<button onclick="deleteNotice(${n.id})" class="glossy-btn btn-red"><i class="fas fa-trash"></i> Delete</button>`
              : ""
          }
        </div>
      </div>`
    )
    .join("");
}

// ====================
// COURSES
// ====================
async function fetchCourses() {
  try {
    const res = await fetch(`${API_BASE}/api/courses`);
    const data = await res.json();
    if (data.success) {
      allCourses = data.courses;
      renderCourses(allCourses);
    } else {
      coursesContainer.innerHTML = "<p>Failed to load courses.</p>";
    }
  } catch (err) {
    console.error("Error fetching courses:", err);
    coursesContainer.innerHTML = "<p>Error loading courses.</p>";
  }
}

function renderCourses(courses = []) {
  const isAdmin = currentUser?.role === "admin";
  if (!coursesContainer) return;

  if (courses.length === 0) {
    coursesContainer.innerHTML = `
      <div class="no-results-msg">
        <i class="fas fa-search-minus"></i>
        <h3>No courses found</h3>
        <p>Try searching for a different course title or teacher.</p>
      </div>`;
    return;
  }

  coursesContainer.innerHTML = `
    <div class="course-grid">
      ${courses
        .map(
          (c) => `
          <div class="course-card glass-card">
            <div class="course-content">
              <h3>${c.title}</h3>
              <p>${c.description || "No description available."}</p>
              ${
                c.teacher
                  ? `<p class="teacher"><b>Teacher:</b> ${c.teacher}</p>`
                  : ""
              }
            </div>
            <div class="course-actions">
              ${
                c.youtube_link
                  ? `<a href="${c.youtube_link}" target="_blank" class="glossy-btn btn-blue"><i class="fas fa-play"></i> Watch</a>`
                  : ""
              }
              ${
                c.pdf_path
                  ? `<a href="${API_BASE}${c.pdf_path}" target="_blank" class="glossy-btn btn-blue"><i class="fas fa-file-alt"></i> Notes</a>`
                  : ""
              }
              ${
                isAdmin
                  ? `<button onclick="deleteCourse(${c.id})" class="glossy-btn btn-red"><i class="fas fa-trash"></i> Delete</button>`
                  : ""
              }
            </div>
          </div>`
        )
        .join("")}
    </div>`;
}

// ====================
// ACADEMIC INFO
// ====================
async function fetchAcademicInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/academic`);
    const data = await res.json();
    if (data.success) renderAcademicInfo(data.academic);
    else academicInfoContainer.innerHTML = "<p>Failed to load academic info.</p>";
  } catch (err) {
    console.error("Error fetching academic info:", err);
    academicInfoContainer.innerHTML = "<p>Error loading academic info.</p>";
  }
}

function renderAcademicInfo(list = []) {
  const isAdmin = currentUser?.role === "admin";
  if (!academicInfoContainer) return;

  if (list.length === 0) {
    academicInfoContainer.innerHTML = "<p>No academic info available.</p>";
    return;
  }

  academicInfoContainer.innerHTML = list
    .map(
      (a) => `
      <div class="academic-card glass-card">
        <h3>${a.title}</h3>
        <p>${a.description || ""}</p>
        <div class="card-actions">
          ${
            a.file_path
              ? `<a href="${API_BASE}${a.file_path}" target="_blank" class="glossy-btn btn-blue"><i class="fas fa-download"></i> Download</a>`
              : ""
          }
          ${
            isAdmin
              ? `<button onclick="deleteAcademic(${a.id})" class="glossy-btn btn-red"><i class="fas fa-trash"></i> Delete</button>`
              : ""
          }
        </div>
      </div>`
    )
    .join("");
}

// ====================
// SEARCH FUNCTIONALITY
// ====================
function setupGlobalSearch() {
  if (globalSearch) globalSearch.addEventListener("input", handleGlobalSearch);
}

function handleGlobalSearch() {
  const activeSection = document.querySelector(
    '.nav-link[data-section="courses"].active'
  );
  if (!activeSection) return; // Search only works in Courses section

  const term = globalSearch.value.toLowerCase().trim();

  if (term.length > 0) {
    const filtered = allCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.teacher?.toLowerCase().includes(term)
    );
    renderCourses(filtered);
  } else {
    renderCourses(allCourses);
  }
}

// ====================
// ADMIN DELETE FUNCTIONS
// ====================
async function deleteNotice(id) {
  if (!confirm("Delete this notice?")) return;
  const res = await fetch(`${API_BASE}/api/admin/delete-notice/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (data.success) {
    fetchNotices();
    showNotification("✅ Notice deleted successfully!", "success");
  } else showNotification("Failed to delete notice", "error");
}

async function deleteCourse(id) {
  if (!confirm("Delete this course?")) return;
  const res = await fetch(`${API_BASE}/api/admin/delete-course/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (data.success) {
    allCourses = allCourses.filter((c) => c.id !== id);
    fetchCourses();
    showNotification("✅ Course deleted successfully!", "success");
  } else showNotification("Failed to delete course", "error");
}

async function deleteAcademic(id) {
  if (!confirm("Delete this academic info?")) return;
  const res = await fetch(`${API_BASE}/api/admin/delete-academic/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (data.success) {
    fetchAcademicInfo();
    showNotification("✅ Academic info deleted successfully!", "success");
  } else showNotification("Failed to delete academic info", "error");
}

// ====================
// HELPERS
// ====================
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showNotification(message, type = "info") {
  const div = document.createElement("div");
  div.className = `notification ${type}`;
  div.innerHTML = `${message} <button onclick="this.parentElement.remove()">×</button>`;
  notificationContainer.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// ====================
// USER MENU + LOGOUT
// ====================
function setupUserMenuDropdown() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userMenuBtn || !userDropdown) return;

  userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("active");
    }
  });

  const logoutHandler = () => {
    localStorage.removeItem("currentUser");
    sessionStorage.clear();
    alert("You have been logged out successfully!");
    window.location.href = "../auth/login.html";
  };

  if (logoutBtn) logoutBtn.addEventListener("click", logoutHandler);
  else {
    document.addEventListener("click", (e) => {
      if (e.target.id === "logoutBtn") logoutHandler();
    });
  }
}
