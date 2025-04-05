from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
import sqlite3
from datetime import datetime
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Database connection helper
def get_db_connection():
    conn = sqlite3.connect('health_database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in first', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# BMI calculation and classification
def calculate_bmi(weight, height):
    # BMI = weight(kg) / height(m)²
    bmi = weight / ((height/100) ** 2)
    return round(bmi, 1)

def classify_bmi(bmi):
    if bmi < 18.5:
        return "Underweight"
    elif 18.5 <= bmi < 25:
        return "Normal weight"
    elif 25 <= bmi < 30:
        return "Overweight"
    elif 30 <= bmi < 35:
        return "Obesity (Class 1)"
    elif 35 <= bmi < 40:
        return "Obesity (Class 2)"
    else:
        return "Extreme Obesity (Class 3)"

# Only the get_bmi_analysis function is changed, keeping the rest of the code the same

def get_bmi_analysis(classification):
    analyses = {
        "Underweight": {
            "health_risks": ["Nutritional deficiencies", "Weakened immune system", "Reduced energy levels"],
            "recommendations": [
                "Add nutrient-dense foods like nuts, avocados, and whole grains to your meals",
                "Consider small, frequent meals instead of three large ones",
                "Incorporate protein-rich foods at every meal (eggs, yogurt, lean meats)",
                "Try smoothies with added protein powder as an easy way to increase calories",
                "Focus on strength training to build muscle mass",
                "Track your food intake for a week to identify patterns and gaps"
            ],
            "quick_tips": [
                "Set reminders to eat regularly during work hours",
                "Keep healthy snacks at your desk",
                "Stand up and stretch every hour to stimulate appetite",
                "Consider a multivitamin after consulting your doctor"
            ]
        },
        "Normal weight": {
            "health_risks": ["Low health risks if maintaining healthy lifestyle"],
            "recommendations": [
                "Maintain your current balance of nutrition and activity",
                "Incorporate a variety of foods to ensure complete nutrition",
                "Stay hydrated with at least 8 glasses of water daily",
                "Aim for 150 minutes of moderate activity weekly",
                "Include both cardio and strength training in your routine",
                "Focus on overall wellness rather than just weight"
            ],
            "quick_tips": [
                "Use a standing desk for part of your workday",
                "Take a 10-minute walk during lunch breaks",
                "Keep a water bottle at your desk",
                "Practice stress management through short breathing exercises"
            ]
        },
        "Overweight": {
            "health_risks": ["Increased risk of cardiovascular disease", "Higher risk of Type 2 diabetes", "Joint strain"],
            "recommendations": [
                "Aim for a modest 5-10% weight reduction initially",
                "Create a calorie deficit of 500 calories per day for sustainable weight loss",
                "Increase protein intake to preserve muscle mass during weight loss",
                "Replace refined carbs with fiber-rich alternatives",
                "Incorporate 30 minutes of physical activity daily",
                "Consider using a food tracking app to monitor intake"
            ],
            "quick_tips": [
                "Start meetings with a one-minute stretch",
                "Use smaller plates for meals to manage portions",
                "Swap sugary drinks for water or herbal tea",
                "Set up calendar alerts for activity breaks every hour"
            ]
        },
        "Obesity (Class 1)": {
            "health_risks": ["Heart disease risk", "Diabetes risk", "Hypertension", "Sleep disturbances"],
            "recommendations": [
                "Target a 10% weight reduction over 6 months for significant health benefits",
                "Focus on whole foods and minimally processed items",
                "Begin with low-impact exercises like walking or swimming",
                "Gradually increase physical activity to 150-300 minutes weekly",
                "Consider consulting with a registered dietitian for personalized advice",
                "Create a supportive environment at home and work"
            ],
            "quick_tips": [
                "Use a timer to ensure you stand at least 5 minutes every hour",
                "Keep a food journal to identify emotional eating triggers",
                "Find an accountability partner for exercise",
                "Create a relaxing bedtime routine for better sleep quality"
            ]
        },
        "Obesity (Class 2)": {
            "health_risks": ["Significant cardiovascular risk", "Metabolic syndrome", "Joint disorders", "Sleep apnea"],
            "recommendations": [
                "Speak with your healthcare provider about supervised weight management",
                "Consider joining a structured weight loss program for support",
                "Start with gentle movement like stretching or chair exercises",
                "Gradually work up to 30-minute activity sessions",
                "Focus on sustainable dietary changes rather than restrictive dieting",
                "Monitor progress with metrics beyond just weight (energy, mood, etc.)"
            ],
            "quick_tips": [
                "Use ergonomic supports to reduce joint strain while working",
                "Practice mindful eating by removing distractions during meals",
                "Try seated exercises during work breaks",
                "Use breathing techniques to manage stress-related eating"
            ]
        },
        "Extreme Obesity (Class 3)": {
            "health_risks": ["Critical cardiovascular risk", "Severe mobility limitations", "Respiratory difficulties", "Chronic pain"],
            "recommendations": [
                "Consult with medical professionals for a comprehensive treatment plan",
                "Focus on small, achievable lifestyle changes",
                "Consider water-based exercises for reduced joint impact",
                "Set realistic short-term goals for motivation",
                "Look into support groups for emotional and practical guidance",
                "Celebrate non-scale victories like improved mobility or energy"
            ],
            "quick_tips": [
                "Use specialized ergonomic equipment for comfortable work",
                "Do gentle seated stretches throughout the day",
                "Practice proper breathing techniques to improve lung capacity",
                "Set up your workspace to minimize physical strain"
            ]
        }
    }
    return analyses.get(classification, {"health_risks": ["Unknown"], "recommendations": ["Consult with healthcare provider"], "quick_tips": ["Schedule a check-up with your doctor"]})

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form.get('user_id')
        password = request.form.get('password')
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        # In production, use proper password hashing
        if user and password == user['password']:  # Simplified for example
            session['user_id'] = user_id
            return redirect(url_for('dashboard'))
        
        flash('Invalid credentials', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user_id = request.form.get('user_id')
        password = request.form.get('password')
        
        conn = get_db_connection()
        existing_user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
        
        if existing_user:
            conn.close()
            flash('User ID already exists', 'error')
            return render_template('register.html')
        
        conn.execute('INSERT INTO users (user_id, password) VALUES (?, ?)', (user_id, password))
        conn.commit()
        conn.close()
        
        flash('Registration successful, please login', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    conn = get_db_connection()
    health_data = conn.execute('SELECT * FROM health_metrics WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1', 
                              (session['user_id'],)).fetchone()
    conn.close()
    
    bmi_data = None
    if health_data:
        bmi = calculate_bmi(health_data['weight'], health_data['height'])
        classification = classify_bmi(bmi)
        analysis = get_bmi_analysis(classification)
        
        bmi_data = {
            'bmi': bmi,
            'classification': classification,
            'health_risks': analysis['health_risks'],
            'recommendations': analysis['recommendations'],
            'last_updated': health_data['last_updated']
        }
    
    return render_template('dashboard.html', bmi_data=bmi_data)

@app.route('/update_metrics', methods=['GET', 'POST'])
@login_required
def update_metrics():
    if request.method == 'POST':
        weight = float(request.form.get('weight'))
        height = float(request.form.get('height'))
        age = int(request.form.get('age'))
        
        if weight <= 0 or height <= 0 or age <= 0:
            flash('Please enter valid measurements', 'error')
            return redirect(url_for('update_metrics'))
        
        conn = get_db_connection()
        conn.execute('''INSERT INTO health_metrics 
                      (user_id, weight, height, age, last_updated) 
                      VALUES (?, ?, ?, ?, ?)''', 
                   (session['user_id'], weight, height, age, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        conn.commit()
        conn.close()
        
        flash('Health metrics updated successfully', 'success')
        return redirect(url_for('dashboard'))
    
    # For GET request, show the form with current values if available
    conn = get_db_connection()
    health_data = conn.execute('SELECT * FROM health_metrics WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1', 
                              (session['user_id'],)).fetchone()
    conn.close()
    
    return render_template('update_metrics.html', health_data=health_data)

@app.route('/history')
@login_required
def history():
    conn = get_db_connection()
    history_data = conn.execute('SELECT * FROM health_metrics WHERE user_id = ? ORDER BY last_updated DESC', 
                               (session['user_id'],)).fetchall()
    conn.close()
    
    metrics_history = []
    for data in history_data:
        bmi = calculate_bmi(data['weight'], data['height'])
        classification = classify_bmi(bmi)
        
        metrics_history.append({
            'date': data['last_updated'],
            'weight': data['weight'],
            'height': data['height'],
            'age': data['age'],
            'bmi': bmi,
            'classification': classification
        })
    
    return render_template('history.html', metrics_history=metrics_history)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/api/bmi', methods=['POST'])
def api_bmi():
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'weight' not in data or 'height' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    weight = float(data['weight'])
    height = float(data['height'])
    
    bmi = calculate_bmi(weight, height)
    classification = classify_bmi(bmi)
    analysis = get_bmi_analysis(classification)
    
    return jsonify({
        'bmi': bmi,
        'classification': classification,
        'health_risks': analysis['health_risks'],
        'recommendations': analysis['recommendations']
    })

if __name__ == '__main__':
    # Create tables if they don't exist
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    password TEXT NOT NULL)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS health_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    weight REAL,
                    height REAL,
                    age INTEGER,
                    last_updated TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(user_id))''')
    conn.commit()
    conn.close()
    
    app.run(debug=True)
