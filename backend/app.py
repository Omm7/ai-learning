from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import mysql.connector
import os
app = Flask(__name__)
CORS(app)
# =====================
# UPLOAD CONFIGURATION
# =====================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"pdf"}
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
# =====================
# DATABASE CONNECTION
# =====================
def get_db_cursor():
    db = mysql.connector.connect(
        host="localhost",
        user="bop2025",
        password="Avengers@12345",
        database="learn"
    )
    return db, db.cursor(dictionary=True)
# =====================
# DEFAULT ADMIN CREATION
# =====================
def ensure_default_admin():
    try:
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM admins WHERE email=%s", ("admin@learnhub.com",))
        admin = cursor.fetchone()
        if not admin:
            hashed_password = generate_password_hash("admin123")
            cursor.execute("""
                INSERT INTO admins (first_name, last_name, email, phone, password, role)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, ("Default", "Admin", "admin@learnhub.com", "9999999999", hashed_password, "admin"))
            db.commit()
            print("✅ Default admin created → email: admin@learnhub.com | password: admin123")
        else:
            print("ℹ️ Default admin already exists.")
        cursor.close()
        db.close()
    except Exception as e:
        print("❌ Error while creating default admin:", e)
# =====================
# USER REGISTER
# =====================
@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        phone = data.get('phone')
        branch = data.get('branch')
        roll_number = data.get('roll_number')
        semester = data.get('semester')
        password = data.get('password')
        role = data.get('role', 'student')
        if not all([first_name, last_name, email, branch, roll_number, semester, password]):
            return jsonify({"success": False, "message": "All fields are required"}), 400
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        existing = cursor.fetchone()
        if existing:
            return jsonify({"success": False, "message": "Email already registered"}), 400
        hashed_password = generate_password_hash(password)
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email, phone, branch, roll_number, semester, password, role)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (first_name, last_name, email, phone, branch, roll_number, semester, hashed_password, role))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Account created successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": "Server Error: " + str(e)}), 500
# =====================
# USER LOGIN
# =====================
@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        if user and check_password_hash(user['password'], password):
            cursor.close()
            db.close()
            return jsonify({"success": True, "user": user})
        else:
            cursor.close()
            db.close()
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# ADMIN LOGIN
# =====================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM admins WHERE email=%s", (email,))
        admin = cursor.fetchone()
        if admin and check_password_hash(admin['password'], password):
            cursor.close()
            db.close()
            return jsonify({"success": True, "admin": admin})
        else:
            cursor.close()
            db.close()
            return jsonify({"success": False, "message": "Invalid admin credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# FORGOT PASSWORD (STUDENT)
# =====================
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')
        new_password = data.get('new_password')
        if not email or not new_password:
            return jsonify({"success": False, "message": "Email and new password required"}), 400
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        if not user:
            cursor.close()
            db.close()
            return jsonify({"success": False, "message": "User email not found"}), 404
        hashed_password = generate_password_hash(new_password)
        cursor.execute("UPDATE users SET password=%s WHERE email=%s", (hashed_password, email))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Password updated successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# ADMIN FORGOT PASSWORD
# =====================
@app.route('/api/admin/forgot-password', methods=['POST'])
def admin_forgot_password():
    try:
        data = request.json
        email = data.get('email')
        new_password = data.get('new_password')
        if not email or not new_password:
            return jsonify({"success": False, "message": "Email and new password required"}), 400
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM admins WHERE email=%s", (email,))
        admin = cursor.fetchone()
        if not admin:
            cursor.close()
            db.close()
            return jsonify({"success": False, "message": "Admin email not found"}), 404
        hashed_password = generate_password_hash(new_password)
        cursor.execute("UPDATE admins SET password=%s WHERE email=%s", (hashed_password, email))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Admin password updated successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# ADMIN ADD COURSE
# =====================
@app.route('/api/admin/add-course', methods=['POST'])
def add_course():
    try:
        title = request.form.get("title")
        description = request.form.get("description")
        teacher = request.form.get("teacher", "Unknown")
        youtube_link = request.form.get("youtube_link")
        pdf_path = None
        if "pdf" in request.files:
            pdf = request.files["pdf"]
            if pdf and allowed_file(pdf.filename):
                filename = secure_filename(pdf.filename)
                pdf.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                pdf_path = f"/uploads/{filename}"
        db, cursor = get_db_cursor()
        cursor.execute("INSERT INTO courses (title, description, teacher, pdf_path, youtube_link) VALUES (%s,%s,%s,%s,%s)",
                       (title, description, teacher, pdf_path, youtube_link))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Course added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@app.route("/api/admin/add-notice", methods=["POST"])
def add_notice():
    try:
        title = request.form.get("title")
        content = request.form.get("content")  
        pdf_path = None

        if "pdf" in request.files:
            pdf = request.files["pdf"]
            if pdf and allowed_file(pdf.filename):
                filename = secure_filename(pdf.filename)
                pdf.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                pdf_path = f"/uploads/{filename}"

        db, cursor = get_db_cursor()
        cursor.execute("INSERT INTO notices (title, content, file_path) VALUES (%s,%s,%s)",
                       (title, content, pdf_path))  
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Notice added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# ADMIN ADD ACADEMIC INFO
# =====================

@app.route("/api/admin/add-academic", methods=["POST"])
def add_academic():
    try:
        title = request.form.get("title")
        description = request.form.get("description")
        pdf_path = None
        if "pdf" in request.files:
            pdf = request.files["pdf"]
            if pdf and allowed_file(pdf.filename):
                filename = secure_filename(pdf.filename)
                pdf.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                pdf_path = f"/uploads/{filename}"
        db, cursor = get_db_cursor()
        cursor.execute("INSERT INTO academic_resources (title, description, file_path) VALUES (%s,%s,%s)",
                       (title, description, pdf_path))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Academic info added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# FETCH ROUTES (Student Side)
# =====================
@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM courses ORDER BY id DESC")
        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({"success": True, "courses": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@app.route('/api/notices', methods=['GET'])
def get_notices():
    try:
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM notices ORDER BY id DESC")
        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({"success": True, "notices": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@app.route('/api/academic', methods=['GET'])
def get_academic():
    try:
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM academic_resources ORDER BY id DESC")
        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({"success": True, "academic": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# DELETE OPTIONS
# =====================
@app.route('/api/admin/delete-course/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        db, cursor = get_db_cursor()
        cursor.execute("DELETE FROM courses WHERE id=%s", (course_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Course deleted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@app.route('/api/admin/delete-notice/<int:notice_id>', methods=['DELETE'])
def delete_notice(notice_id):
    try:
        db, cursor = get_db_cursor()
        cursor.execute("DELETE FROM notices WHERE id=%s", (notice_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Notice deleted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@app.route('/api/admin/delete-academic/<int:info_id>', methods=['DELETE'])
def delete_academic(info_id):
    try:
        db, cursor = get_db_cursor()
        cursor.execute("DELETE FROM academic_resources WHERE id=%s", (info_id,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"success": True, "message": "Academic info deleted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# SERVE UPLOADED FILES
# =====================
@app.route("/uploads/<filename>")
def serve_pdf(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        data = request.json
        user_id = data.get("id")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        phone = data.get("phone")
        branch = data.get("branch")
        semester = data.get("semester")
        roll_number = data.get("roll_number")

        db, cursor = get_db_cursor()
        cursor.execute("""
            UPDATE users 
            SET first_name=%s, last_name=%s, email=%s, phone=%s, branch=%s, semester=%s, roll_number=%s
            WHERE id=%s
        """, (first_name, last_name, email, phone, branch, semester, roll_number, user_id))
        db.commit()
        cursor.close()
        db.close()

        return jsonify({"success": True, "message": "Profile updated successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
    
@app.route('/api/get-user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        db, cursor = get_db_cursor()
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        db.close()

        if not user:
            return jsonify({"success": False, "message": "User not found"})

        return jsonify({"success": True, "user": user})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =====================
# SERVER START
# =====================
if __name__ == '__main__':
    ensure_default_admin()
    app.run(debug=True)