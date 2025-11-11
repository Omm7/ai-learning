const API_BASE = "http://localhost:5000"; // Flask backend base URL
const notificationContainer = document.getElementById('notificationContainer');

// Initialize page when DOM ready
document.addEventListener("DOMContentLoaded", init);

async function init() {
  let currentUser = JSON.parse(localStorage.getItem('currentUser'));
  console.log("Profile Init → currentUser:", currentUser);

  // Redirect if not logged in
  if (!currentUser || !currentUser.id) {
    window.location.href = '../auth/login.html';
    return;
  }

  loadProfile(currentUser);

  // Fetch latest data from backend
  try {
    const res = await fetch(`${API_BASE}/api/get-user/${currentUser.id}`);
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loadProfile(currentUser);
    } else {
      showNotification("Failed to fetch profile details.", "error");
    }
  } catch (err) {
    console.warn("Could not fetch latest profile:", err);
    showNotification("Could not fetch latest data from server", "error");
  }

  // Attach event listeners
  document.getElementById("profileForm").addEventListener("submit", updateProfile);
  document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

// Load profile data into input fields and top card
function loadProfile(user) {
  if (!user) return;

  document.getElementById('profileFirstName').value = user.first_name || '';
  document.getElementById('profileLastName').value = user.last_name || '';
  document.getElementById('profileEmailInput').value = user.email || '';
  document.getElementById('profilePhone').value = user.phone || '';
  document.getElementById('profileRollNumber').value = user.roll_number || '';
  document.getElementById('profileBranch').value = user.branch || '';
  document.getElementById('profileSemester').value = user.semester || '';

  document.getElementById('profileName').textContent =
    `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name';
  document.getElementById('profileEmail').textContent = user.email || 'Not Available';
  document.getElementById('profileRole').textContent =
    user.role === 'admin' ? 'Administrator' : 'Student';
  document.getElementById('userWelcome').textContent = user.first_name || 'User';
}

// Update profile in backend
async function updateProfile(e) {
  e.preventDefault();

  let currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || !currentUser.id) return showNotification("No user found", "error");

  const updatedData = {
    id: currentUser.id,
    first_name: document.getElementById('profileFirstName').value.trim(),
    last_name: document.getElementById('profileLastName').value.trim(),
    email: document.getElementById('profileEmailInput').value.trim(),
    phone: document.getElementById('profilePhone').value.trim(),
    roll_number: document.getElementById('profileRollNumber').value.trim(),
    branch: document.getElementById('profileBranch').value.trim(),
    semester: document.getElementById('profileSemester').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/update-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();

    if (data.success) {
      // Fetch latest user from backend after update
      const latestRes = await fetch(`${API_BASE}/api/get-user/${currentUser.id}`);
      const latestData = await latestRes.json();

      if (latestData.success && latestData.user) {
        currentUser = latestData.user;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        loadProfile(currentUser);
        showNotification("Profile updated successfully!", "success");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          if (currentUser.role === 'admin') {
            window.location.href = '../admin/dashboard.html';
          } else {
            window.location.href = '../dashboard/dashboard.html';
          }
        }, 500);
      } else {
        showNotification("Profile updated, but failed to refresh data.", "warning");
      }
    } else {
      showNotification(data.message || "Failed to update profile", "error");
    }
  } catch (err) {
    console.error("Update error:", err);
    showNotification("Server error while updating profile", "error");
  }
}

// Cancel changes and go back
function cancelEdit() {
  showNotification("Changes discarded", "error");

  // Redirect immediately (no unnecessary delay)
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser?.role === 'admin') {
    window.location.href = '../admin/dashboard.html';
  } else {
    window.location.href = '../dashboard/dashboard.html';
  }
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../auth/login.html";
}

// Notification helper
function showNotification(message, type) {
  const div = document.createElement("div");
  div.className = `notification notification-${type}`;
  div.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">&times;</button>`;
  notificationContainer.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}
