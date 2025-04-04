from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)

def setup_database():
    conn = sqlite3.connect("screen_time.db")
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS screen_time (
                        user_id TEXT,
                        date TEXT,
                        screen_time_minutes INTEGER,
                        work_mode INTEGER)''')
    conn.commit()
    conn.close()

@app.route('/log', methods=['POST'])
def log_screen_time():
    data = request.json
    user_id = data['user_id']
    screen_time_minutes = data['screen_time_minutes']
    work_mode = data.get('work_mode', False)
    
    conn = sqlite3.connect("screen_time.db")
    cursor = conn.cursor()
    today = datetime.today().strftime('%Y-%m-%d')
    cursor.execute("INSERT INTO screen_time (user_id, date, screen_time_minutes, work_mode) VALUES (?, ?, ?, ?)",
                   (user_id, today, screen_time_minutes, int(work_mode)))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Screen time logged successfully"})

@app.route('/alerts/<user_id>', methods=['GET'])
def check_alerts(user_id):
    conn = sqlite3.connect("screen_time.db")
    cursor = conn.cursor()
    today = datetime.today().strftime('%Y-%m-%d')
    cursor.execute("SELECT screen_time_minutes, work_mode FROM screen_time WHERE user_id=? AND date=?", (user_id, today))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        screen_time_minutes, work_mode = result
        break_threshold = 180 if work_mode else 120
        risk_threshold = 360 if work_mode else 240
        
        alerts = []
        if screen_time_minutes >= break_threshold:
            alerts.append(f"You have exceeded {break_threshold // 60} hours of screen time. Take a break!")
        if screen_time_minutes >= risk_threshold:
            alerts.append(f"Warning: More than {risk_threshold // 60} hours on screen today. This can impact your health!")
        return jsonify({"alerts": alerts})
    else:
        return jsonify({"alerts": ["No data available for today."]})

@app.route('/insights/<user_id>', methods=['GET'])
def generate_insights(user_id):
    conn = sqlite3.connect("screen_time.db")
    cursor = conn.cursor()
    start_date = (datetime.today() - timedelta(days=6)).strftime('%Y-%m-%d')
    cursor.execute("SELECT screen_time_minutes FROM screen_time WHERE user_id=? AND date >= ?", (user_id, start_date))
    data = cursor.fetchall()
    conn.close()
    
    if data:
        weekly_avg = sum(row[0] for row in data) / len(data)
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

    else:
        return jsonify({"insight": "No data available."})

if __name__ == '__main__':
    setup_database()
    app.run(debug=True)
