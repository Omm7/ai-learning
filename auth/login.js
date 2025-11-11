const roleTabs = document.querySelectorAll('.role-tab');
const loginForms = document.querySelectorAll('.login-form');
const userForm = document.getElementById('userForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const adminForm = document.getElementById('adminForm');

const forgotPassword = document.getElementById('forgotPassword');
const backToLogin = document.getElementById('backToLogin');

// Admin forgot password links
const adminForgotPassword = document.getElementById('adminForgotPassword');
const backToAdminLogin = document.getElementById('backToAdminLogin');
const adminResetForm = document.getElementById('adminResetForm');

const API_BASE = "http://127.0.0.1:5000";  // Flask backend base URL

function init() {
    checkIfAlreadyLoggedIn();
    loadEventListeners();
}

function checkIfAlreadyLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = '../admin/admin.html';
        } else {
            window.location.href = '../dashboard/dashboard.html';
        }
    }
}

function loadEventListeners() {
    roleTabs.forEach(tab => {
        tab.addEventListener('click', switchRoleTab);
    });

    userForm.addEventListener('submit', handleUserLogin);
    resetPasswordForm.addEventListener('submit', handlePasswordReset);
    adminForm.addEventListener('submit', handleAdminLogin);

    forgotPassword.addEventListener('click', showForgotPasswordForm);
    backToLogin.addEventListener('click', showLoginForm);

    // Admin forgot-password
    adminForgotPassword.addEventListener('click', showAdminForgotPasswordForm);
    backToAdminLogin.addEventListener('click', showAdminLoginForm);
    adminResetForm.addEventListener('submit', handleAdminPasswordReset);
}

function switchRoleTab(e) {
    const role = e.currentTarget.getAttribute('data-role');

    roleTabs.forEach(tab => tab.classList.remove('active'));
    e.currentTarget.classList.add('active');

    loginForms.forEach(form => form.classList.remove('active'));

    if (role === 'user') {
        document.getElementById('userLoginForm').classList.add('active');
    } else {
        document.getElementById('adminLoginForm').classList.add('active');
    }
}

// ----------------- STUDENT TOGGLE -----------------
function showLoginForm(e) {
    if (e) e.preventDefault();
    loginForms.forEach(form => form.classList.remove('active'));
    document.getElementById('userLoginForm').classList.add('active');

    roleTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector('.role-tab[data-role="user"]').classList.add('active');
}

function showForgotPasswordForm(e) {
    e.preventDefault();
    loginForms.forEach(form => form.classList.remove('active'));
    document.getElementById('forgotPasswordForm').classList.add('active');
}

// ----------------- ADMIN TOGGLE -----------------
function showAdminLoginForm(e) {
    if (e) e.preventDefault();
    loginForms.forEach(form => form.classList.remove('active'));
    document.getElementById('adminLoginForm').classList.add('active');

    roleTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector('.role-tab[data-role="admin"]').classList.add('active');
}

function showAdminForgotPasswordForm(e) {
    e.preventDefault();
    loginForms.forEach(form => form.classList.remove('active'));
    document.getElementById('adminForgotPasswordForm').classList.add('active');
}

// ============================
// USER LOGIN
// ============================
function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.first_name + " " + data.user.last_name,
                role: data.user.role
            };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));

            if (currentUser.role === "admin") {
                window.location.href = "../admin/admin.html";
            } else {
                window.location.href = "../dashboard/dashboard.html";
            }
        } else {
            showNotification(data.message || "Invalid email or password", "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Server error. Please try again later.", "error");
    });
}

// ============================
// ADMIN LOGIN (API)
// ============================
function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const currentUser = {
                id: data.admin.id,
                email: data.admin.email,
                name: data.admin.first_name + " " + data.admin.last_name,
                role: "admin"
            };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            window.location.href = "../admin/admin.html";
        } else {
            showNotification(data.message || "Invalid admin credentials", "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Server error. Please try again later.", "error");
    });
}

// ============================
// STUDENT PASSWORD RESET
// ============================
function handlePasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('resetPassword').value.trim();

    if (!email || !newPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('Password updated successfully! Please login.', 'success');
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            showNotification(data.message || "Password reset failed", "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Server error. Please try again later.", "error");
    });
}

// ============================
// ADMIN PASSWORD RESET
// ============================
function handleAdminPasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('resetAdminID').value.trim();
    const newPassword = document.getElementById('resetAdminPassword').value.trim();

    if (!email || !newPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    fetch(`${API_BASE}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('Admin password updated successfully! Please login.', 'success');
            setTimeout(() => {
                showAdminLoginForm();
            }, 2000);
        } else {
            showNotification(data.message || "Password reset failed", "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Server error. Please try again later.", "error");
    });
}

// ============================
// NOTIFICATION
// ============================
function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', init);
