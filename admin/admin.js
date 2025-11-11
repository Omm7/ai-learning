// ==============================
// ADMIN PANEL JS (EDIT + PREVIEW + PATCHED LINKS)
// ==============================

const API_BASE = "http://localhost:5000/api";

// ==============================
// DOM Elements
// ==============================
const courseForm = document.getElementById("add-course-form");
const noticeForm = document.getElementById("add-notice-form");
const academicForm = document.getElementById("add-academic-form");
const courseList = document.getElementById("course-list");
const noticeList = document.getElementById("notice-list");
const academicList = document.getElementById("academic-list");

// For tracking edit mode
let editingCourseId = null;
let editingNoticeId = null;
let editingAcademicId = null;

// ==============================
// File Preview Helper
// ==============================
function setupFilePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    if (input.files && input.files.length > 0) {
      preview.textContent = `📄 Selected: ${input.files[0].name}`;
    } else {
      preview.textContent = "";
    }
  });
}
setupFilePreview("course-pdf", "course-pdf-preview");
setupFilePreview("notice-pdf", "notice-pdf-preview");
setupFilePreview("academic-pdf", "academic-pdf-preview");

// ==============================
// Helper: Submit FormData
// ==============================
async function submitForm(endpoint, formData, method = "POST") {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      body: formData,
    });
    const data = await res.json();
    return { ok: res.ok, ...data };
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    alert("❌ Unable to connect to backend!");
    return { ok: false, success: false };
  }
}

// ==============================
// 1️⃣ ADD / UPDATE COURSE
// ==============================
if (courseForm) {
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("course-title").value.trim();
    const teacher = document.getElementById("course-teacher").value.trim();
    const description = document.getElementById("course-description").value.trim();
    const youtube = document.getElementById("course-youtube")?.value.trim() || "";
    const pdfFile = document.getElementById("course-pdf")?.files[0];

    if (!title || !teacher || !description) {
      alert("⚠️ Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("teacher", teacher);
    formData.append("description", description);
    formData.append("youtube_link", youtube);
    if (pdfFile) formData.append("pdf", pdfFile);

    const endpoint = editingCourseId ? `/admin/update-course/${editingCourseId}` : "/admin/add-course";
    const method = editingCourseId ? "PUT" : "POST";

    const data = await submitForm(endpoint, formData, method);

    if (data.success) {
      alert(editingCourseId ? "✅ Course updated!" : "✅ Course added!");
      courseForm.reset();
      document.getElementById("course-pdf-preview").textContent = "";
      editingCourseId = null;
      fetchCourses();
    } else {
      alert("❌ " + (data.message || "Failed to save course"));
    }
  });
}

// ==============================
// 2️⃣ ADD / UPDATE NOTICE
// ==============================
if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("notice-title").value.trim();
    const content = document.getElementById("notice-content").value.trim();
    const createdBy = document.getElementById("notice-author")?.value.trim() || "Admin";
    const pdfFile = document.getElementById("notice-pdf")?.files[0];

    if (!title || !content) {
      alert("⚠️ Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("created_by", createdBy);
    if (pdfFile) formData.append("pdf", pdfFile);

    const endpoint = editingNoticeId ? `/admin/update-notice/${editingNoticeId}` : "/admin/add-notice";
    const method = editingNoticeId ? "PUT" : "POST";

    const data = await submitForm(endpoint, formData, method);

    if (data.success) {
      alert(editingNoticeId ? "✅ Notice updated!" : "✅ Notice added!");
      noticeForm.reset();
      document.getElementById("notice-pdf-preview").textContent = "";
      editingNoticeId = null;
      fetchNotices();
    } else {
      alert("❌ " + (data.message || "Failed to save notice"));
    }
  });
}

// ==============================
// 3️⃣ ADD / UPDATE ACADEMIC INFO
// ==============================
if (academicForm) {
  academicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("info-title").value.trim();
    const description = document.getElementById("info-content").value.trim();
    const pdfFile = document.getElementById("academic-pdf")?.files[0];

    if (!title || !description) {
      alert("⚠️ Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (pdfFile) formData.append("pdf", pdfFile);

    const endpoint = editingAcademicId ? `/admin/update-academic/${editingAcademicId}` : "/admin/add-academic";
    const method = editingAcademicId ? "PUT" : "POST";

    const data = await submitForm(endpoint, formData, method);

    if (data.success) {
      alert(editingAcademicId ? "✅ Info updated!" : "✅ Info added!");
      academicForm.reset();
      document.getElementById("academic-pdf-preview").textContent = "";
      editingAcademicId = null;
      fetchAcademicInfo();
    } else {
      alert("❌ " + (data.message || "Failed to save academic info"));
    }
  });
}

// ==============================
// Utility for safe inline strings (escape single quotes and backticks)
// ==============================
function escForInlineStr(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\n/g, "\\n");
}

// ==============================
// 4️⃣ FETCH COURSES
// ==============================
async function fetchCourses() {
  if (!courseList) return;
  courseList.innerHTML = `<tr><td colspan="7">⏳ Loading courses...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/courses`);
    const data = await res.json();
    console.log("Courses Data:", data);

    if (!data.success || !data.courses?.length) {
      courseList.innerHTML = `<tr><td colspan="7">No courses found.</td></tr>`;
      return;
    }

    courseList.innerHTML = data.courses
      .map((c, i) => {
        const pdfLink = c.pdf_path || c.pdf_url || c.pdf || c.file_path || "";
        const fixedPdfLink = pdfLink
          ? (pdfLink.startsWith("http") ? pdfLink : `${API_BASE.replace("/api", "")}${pdfLink.startsWith("/") ? pdfLink : "/" + pdfLink}`)
          : "";
        const youtube = c.youtube_link || c.youtube || "";

        // safely pass strings into onclick
        const stitle = escForInlineStr(c.title);
        const steacher = escForInlineStr(c.teacher || "");
        const sdesc = escForInlineStr(c.description || "");
        const syoutube = escForInlineStr(youtube);

        return `
        <tr>
          <td>${i + 1}</td>
          <td>${c.title || ""}</td>
          <td>${c.teacher || "N/A"}</td>
          <td>${c.description || "—"}</td>
          <td>${fixedPdfLink ? `<a href="${fixedPdfLink}" target="_blank">View PDF</a>` : "—"}</td>
          <td>${youtube ? `<a href="${youtube}" target="_blank">Watch</a>` : "—"}</td>
          <td>
            <button onclick="editCourse(${c.id}, '${stitle}', '${steacher}', '${sdesc}', '${syoutube}')" class="edit-btn">✏️ Edit</button>
            <button onclick="deleteCourse(${c.id})" class="delete-btn">🗑️ Delete</button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    courseList.innerHTML = `<tr><td colspan="7">❌ Failed to load courses.</td></tr>`;
  }
}

// ==============================
// 5️⃣ FETCH NOTICES
// ==============================
async function fetchNotices() {
  if (!noticeList) return;
  noticeList.innerHTML = `<tr><td colspan="5">⏳ Loading notices...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/notices`);
    const data = await res.json();

    if (!data.success || !data.notices?.length) {
      noticeList.innerHTML = `<tr><td colspan="5">No notices found.</td></tr>`;
      return;
    }

    noticeList.innerHTML = data.notices
      .map((n, i) => {
        const contentSafe = escForInlineStr(n.content || "");
        return `
        <tr>
          <td>${i + 1}</td>
          <td>${n.title}</td>
          <td>${n.created_by || "Admin"}</td>
          <td>${n.file_path ? `<a href="${(n.file_path.startsWith("http") ? n.file_path : API_BASE.replace("/api","") + n.file_path)}" target="_blank">PDF</a>` : "—"}</td>
          <td>
            <button onclick="editNotice(${n.id}, '${escForInlineStr(n.title)}', \`${contentSafe}\`)" class="edit-btn">✏️ Edit</button>
            <button onclick="deleteNotice(${n.id})" class="delete-btn">🗑️ Delete</button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    noticeList.innerHTML = `<tr><td colspan="5">❌ Failed to load notices.</td></tr>`;
  }
}

// ==============================
// 6️⃣ FETCH ACADEMIC INFO
// ==============================
async function fetchAcademicInfo() {
  if (!academicList) return;
  academicList.innerHTML = `<tr><td colspan="4">⏳ Loading academic info...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/academic`);
    const data = await res.json();

    if (!data.success || !data.academic?.length) {
      academicList.innerHTML = `<tr><td colspan="4">No data found.</td></tr>`;
      return;
    }

    academicList.innerHTML = data.academic
      .map((a, i) => {
        const safeDesc = escForInlineStr(a.description || "");
        return `
       <tr>
  <td>${i + 1}</td>
  <td>${a.title}</td>
  <td>${a.description || "—"}</td>
  <td>${a.file_path ? `<a href="${(a.file_path.startsWith("http") ? a.file_path : API_BASE.replace("/api","") + a.file_path)}" target="_blank">PDF</a>` : "—"}</td>
  <td>
    <button onclick="editAcademic(${a.id}, '${escForInlineStr(a.title)}', \`${safeDesc}\`)" class="edit-btn">✏️ Edit</button>
    <button onclick="deleteAcademic(${a.id})" class="delete-btn">🗑️ Delete</button>
  </td>
</tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    academicList.innerHTML = `<tr><td colspan="4">❌ Failed to load academic info.</td></tr>`;
  }
}

// ==============================
// 7️⃣ EDIT FUNCTIONS (prefill form)
// ==============================
function editCourse(id, title, teacher, description, youtube) {
  editingCourseId = id;
  document.getElementById("course-title").value = title || "";
  document.getElementById("course-teacher").value = teacher || "";
  document.getElementById("course-description").value = description || "";
  document.getElementById("course-youtube").value = youtube || "";
  // show the form container if hidden
  const container = document.getElementById("courseFormContainer");
  if (container) container.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function editNotice(id, title, content) {
  editingNoticeId = id;
  document.getElementById("notice-title").value = title || "";
  document.getElementById("notice-content").value = content || "";
  const container = document.getElementById("noticeFormContainer");
  if (container) container.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function editAcademic(id, title, description) {
  editingAcademicId = id;
  document.getElementById("info-title").value = title || "";
  document.getElementById("info-content").value = description || "";
  const container = document.getElementById("academicFormContainer");
  if (container) container.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==============================
// 8️⃣ DELETE FUNCTIONS
// ==============================
async function deleteCourse(id) {
  if (!confirm("🗑️ Delete this course?")) return;
  const res = await fetch(`${API_BASE}/admin/delete-course/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) fetchCourses();
  else alert("❌ Failed to delete course");
}

async function deleteNotice(id) {
  if (!confirm("🗑️ Delete this notice?")) return;
  const res = await fetch(`${API_BASE}/admin/delete-notice/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) fetchNotices();
  else alert("❌ Failed to delete notice");
}

async function deleteAcademic(id) {
  if (!confirm("🗑️ Delete this academic info?")) return;
  const res = await fetch(`${API_BASE}/admin/delete-academic/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) fetchAcademicInfo();
  else alert("❌ Failed to delete record");
}

// ==============================
// 9️⃣ AUTO LOAD ON PAGE READY
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  fetchCourses();
  fetchNotices();
  fetchAcademicInfo();
});
