from flask import Flask, request, jsonify, render_template
import sqlite3
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import io
import base64
import uuid
import hashlib
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect("screen_time.db")
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    user_id = str(uuid.uuid4())
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    # Simple password hashing - in production use a proper library like bcrypt
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (user_id, username, password_hash, email, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, password_hash, email, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE username = ? AND password_hash = ?", 
                 (username, password_hash))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({"message": "Login successful", "user_id": user['user_id']}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/health-metrics/<user_id>', methods=['POST', 'GET'])
def handle_health_metrics(user_id):
    if request.method == 'POST':
        data = request.json
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if metrics already exist for this user
        cursor.execute("SELECT * FROM health_metrics WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing metrics
            cursor.execute(
                "UPDATE health_metrics SET weight = ?, height = ?, age = ?, last_updated = ? WHERE user_id = ?",
                (weight, height, age, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), user_id)
            )
        else:
            # Insert new metrics
            cursor.execute(
                "INSERT INTO health_metrics (user_id, weight, height, age, last_updated) VALUES (?, ?, ?, ?, ?)",
                (user_id, weight, height, age, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            )
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Health metrics saved successfully"}), 200
    
    elif request.method == 'GET':
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT weight, height, age, last_updated FROM health_metrics WHERE user_id = ?", (user_id,))
        metrics = cursor.fetchone()
        conn.close()
        
        if metrics:
            return jsonify({
                "weight": metrics['weight'],
                "height": metrics['height'],
                "age": metrics['age'],
                "last_updated": metrics['last_updated']
            }), 200
        else:
            return jsonify({"message": "No health metrics found for this user"}), 404

@app.route('/log', methods=['POST'])
def log_screen_time():
    data = request.json
    user_id = data['user_id']
    screen_time_minutes = data['screen_time_minutes']
    work_mode = data.get('work_mode', False)
    
    # Validate input
    if not isinstance(screen_time_minutes, int) or screen_time_minutes < 0:
        return jsonify({"error": "Screen time must be a positive integer"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    today = datetime.today().strftime('%Y-%m-%d')
    
    # Check if an entry for today already exists
    cursor.execute("SELECT id FROM screen_time WHERE user_id = ? AND date = ?", (user_id, today))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing entry
        cursor.execute(
            "UPDATE screen_time SET screen_time_minutes = screen_time_minutes + ?, work_mode = ? WHERE user_id = ? AND date = ?",
            (screen_time_minutes, int(work_mode), user_id, today)
        )
    else:
        # Create new entry
        cursor.execute(
            "INSERT INTO screen_time (user_id, date, screen_time_minutes, work_mode) VALUES (?, ?, ?, ?)",
            (user_id, today, screen_time_minutes, int(work_mode))
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Screen time logged successfully"}), 200

@app.route('/alerts/<user_id>', methods=['GET'])
def check_alerts(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    today = datetime.today().strftime('%Y-%m-%d')
    
    # Sum up all screen time entries for today
    cursor.execute(
        "SELECT SUM(screen_time_minutes) as total_minutes, MAX(work_mode) as work_mode FROM screen_time WHERE user_id = ? AND date = ?", 
        (user_id, today)
    )
    result = cursor.fetchone()
    conn.close()
    
    if result and result['total_minutes']:
        screen_time_minutes = result['total_minutes']
        work_mode = result['work_mode']
        
        # Adjust thresholds based on work mode
        break_threshold = 180 if work_mode else 120  # 3 hours or 2 hours
        risk_threshold = 360 if work_mode else 240   # 6 hours or 4 hours
        
        alerts = []
        if screen_time_minutes >= break_threshold:
            alerts.append(f"You have exceeded {break_threshold // 60} hours of screen time. Take a break!")
        if screen_time_minutes >= risk_threshold:
            alerts.append(f"Warning: More than {risk_threshold // 60} hours on screen today. This can impact your health!")
        
        # Get user health metrics for personalized advice
        cursor = conn.cursor()
        cursor.execute("SELECT age FROM health_metrics WHERE user_id = ?", (user_id,))
        health_data = cursor.fetchone()
        
        if health_data and health_data['age'] > 40 and screen_time_minutes > 180:
            alerts.append("Consider reducing screen time further. Studies show people over 40 may experience increased eye strain.")
            
        return jsonify({"alerts": alerts, "screen_time_minutes": screen_time_minutes}), 200
    else:
        return jsonify({"alerts": ["No screen time data available for today."], "screen_time_minutes": 0}), 200

@app.route('/insights/<user_id>', methods=['GET'])
def generate_insights(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get data for the past week
    start_date = (datetime.today() - timedelta(days=6)).strftime('%Y-%m-%d')
    cursor.execute(
        "SELECT date, SUM(screen_time_minutes) as daily_minutes, MAX(work_mode) as work_mode FROM screen_time "
        "WHERE user_id = ? AND date >= ? GROUP BY date ORDER BY date", 
        (user_id, start_date)
    )
    results = cursor.fetchall()
    conn.close()
    
    if results:
        # Calculate weekly statistics
        dates = [row['date'] for row in results]
        minutes = [row['daily_minutes'] for row in results]
        work_mode_days = sum(1 for row in results if row['work_mode'])
        
        total_minutes = sum(minutes)
        days_with_data = len(results)
        weekly_avg = total_minutes / days_with_data if days_with_data > 0 else 0
        
        # Generate chart
        plt.figure(figsize=(10, 5))
        plt.bar(dates, minutes)
        plt.xlabel('Date')
        plt.ylabel('Screen Time (minutes)')
        plt.title(f'Daily Screen Time for Past Week')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Convert plot to base64 string
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plot_url = base64.b64encode(img.getvalue()).decode()
        
        # Generate personalized insight based on average screen time
        if weekly_avg > 240:
            insight = ("📊 Your average screen time over the past week exceeds 4 hours per day.\n"
                     "😟 Prolonged screen exposure can lead to eye strain, disrupted sleep, and reduced productivity.\n"
                     "💡 Try the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.\n"
                     "🚶‍♀️ Take short breaks, stretch, and stay hydrated to stay healthy and refreshed.")
        elif weekly_avg > 120:
            insight = ("📈 You're spending over 2 hours a day on screens, which is moderate but can still impact your well-being.\n"
                     "🧘‍♂️ Incorporate regular breaks and avoid screens during meals and before bedtime.\n"
                     "✅ You're doing okay — small changes like reducing non-essential screen time can go a long way!")
        else:
            insight = ("🎉 Great job! Your average daily screen time is within healthy limits.\n"
                     "💚 This helps prevent eye fatigue, enhances focus, and improves sleep quality.\n"
                     "🙌 Keep up the good habits and continue balancing your digital and offline life!")
        
        # Add work mode context
        if work_mode_days > 0:
            insight += f"\n\n💼 You used work mode on {work_mode_days} days this week, which adjusts your screen time recommendations."
        
        return jsonify({
            "insight": insight,
            "weekly_avg_minutes": weekly_avg,
            "total_minutes": total_minutes,
            "chart": plot_url,
            "dates": dates,
            "minutes": minutes
        }), 200
    else:
        return jsonify({"insight": "No data available for the past week."}), 200

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
