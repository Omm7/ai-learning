const signupForm = document.getElementById('signupForm');
const API_BASE = "http://127.0.0.1:5000"; // Flask backend URL

function init() {
   loadEventListeners();
}

function loadEventListeners() {
 signupForm.addEventListener('submit', handleSignup);
 document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
}

// Password match check
function validatePasswordMatch() {
 const password = document.getElementById('password').value;
 const confirmPassword = document.getElementById('confirmPassword').value;
 const confirmPasswordInput = document.getElementById('confirmPassword');

 if (confirmPassword && password !== confirmPassword) {
 confirmPasswordInput.style.borderColor = 'var(--premium-red)';
 } else {
 confirmPasswordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
 }
}

// Handle signup form
function handleSignup(e) {
 e.preventDefault();

const firstName = document.getElementById('firstName').value.trim();
const lastName = document.getElementById('lastName').value.trim();
const email = document.getElementById('email').value.trim();
const phone = document.getElementById('phone').value.trim();
const branch = document.getElementById('branch').value;
const rollNumber = document.getElementById('rollNumber').value.trim();
const semester = document.getElementById('semester').value;
const password = document.getElementById('password').value;
const confirmPassword = document.getElementById('confirmPassword').value;
const agreeTerms = document.getElementById('agreeTerms').checked;

// Required field validation
if (!firstName || !lastName || !email || !branch || !rollNumber || !semester || !password || !confirmPassword) {
showNotification('Please fill in all required fields', 'error');
return;
 }

 if (password !== confirmPassword) {
 showNotification('Passwords do not match', 'error');
 return;
 }

 if (password.length < 6) {
 showNotification('Password must be at least 6 characters', 'error');
 return;
 }

 if (!agreeTerms) {
 showNotification('Please agree to the terms and conditions', 'error');
 return;
 }

 const newUser = {
 // 🌟 FIXED: Mismatching camelCase keys changed to snake_case
 'first_name': firstName, 
 'last_name': lastName, 
 email, // Matches backend
 phone: phone || '', // Matches backend
 branch, // Matches backend
 'roll_number': rollNumber, // 🌟 FIXED
 semester, // Matches backend
 password
 // confirmPassword is not sent to the server (which is correct)
 };

 // API Call
 fetch(`${API_BASE}/api/register`, { // Endpoint should be /api/register
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(newUser)
 })
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 showNotification('Account created successfully! Redirecting to login...', 'success');
 setTimeout(() => {
 // FIXED: Correct path confirmed by file structure
 window.location.href = '../auth/login.html'; 
 }, 2000);
 } else {
 showNotification(data.message || 'Signup failed. Try again.', 'error');
 }
 })
.catch(err => {
 console.error("Error:", err);
 showNotification("Server error. Please try again later.", "error");
});
}

// Show notification on top
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