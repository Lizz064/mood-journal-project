from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------- Flask App ----------------
app = Flask(__name__)
CORS(app)  # Allow frontend requests
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="Tester",
        password="1234",
        database="mood_journal",
        port=3306
    )


# ---------------- Database Config ----------------
DB_CONFIG = {
    "host": "localhost",
    "user": "Tester",       # Your MySQL username
    "password": "1234",     # Your MySQL password
    "database": "mood_journal",
    "port": 3306
}

# ---------------- Initialize Database ----------------
def init_db():
    try:
        # Connect without database first to create if not exists
        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            port=DB_CONFIG["port"]
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
        conn.commit()
        cursor.close()
        conn.close()

        # Connect to the database and create users table
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                pin_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Database initialized successfully")
    except Exception as e:
        print("❌ Database initialization failed:", e)

# ---------------- Helper Function ----------------
def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# ---------------- Signup Endpoint ----------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    pin = data.get("pin")

    if not username or not pin:
        return jsonify({"error": "Username and PIN are required"}), 400

    pin_hash = generate_password_hash(pin)

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, pin_hash) VALUES (%s, %s)",
            (username, pin_hash)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Account created successfully"}), 201
    except mysql.connector.errors.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Login Endpoint ----------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    pin = data.get("pin")

    if not username or not pin:
        return jsonify({"error": "Username and PIN are required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT pin_hash FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row and check_password_hash(row[0], pin):
            return jsonify({"message": "Login successful"}), 200
        else:
            return jsonify({"error": "Invalid username or PIN"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Health Check ----------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Mood Journal Auth API running 🚀"})

# ---------------- Run App ----------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",  # your MySQL password
    "database": "mood_journal"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

@app.route("/api/entries", methods=["POST"])
def add_entry():
    data = request.get_json()
    mood = data.get("mood")
    note = data.get("note", "")

    if not mood:
        return jsonify({"error": "Mood is required"}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO entries (mood, note, created_at) VALUES (%s, %s, %s)",
            (mood, note, datetime.now())
        )
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Entry saved successfully"}), 201
    except mysql.connector.Error as e:
        return jsonify({"error": f"MySQL Error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/api/entries", methods=["POST"])
def create_entry():
    data = request.get_json()
    mood = data.get("mood")
    note = data.get("note")
    if not mood or not note:
        return jsonify({"error": "Mood and note required"}), 400
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO entries (mood, note) VALUES (%s,%s)", (mood, note))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Entry saved"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/entries", methods=["GET"])
def get_entries():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM entries ORDER BY created_at DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"entries": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
