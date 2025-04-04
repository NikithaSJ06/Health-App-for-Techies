import sqlite3

def setup_database():
    """
    Set up the SQLite database with tables for users, health metrics, and screen time.
    """
    conn = sqlite3.connect("screen_time.db")
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                        user_id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        email TEXT UNIQUE,
                        created_at TEXT NOT NULL)''')
    
    # Create health metrics table
    cursor.execute('''CREATE TABLE IF NOT EXISTS health_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        weight REAL,
                        height REAL,
                        age INTEGER,
                        last_updated TEXT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users(user_id))''')
    
    # Create screen time table
    cursor.execute('''CREATE TABLE IF NOT EXISTS screen_time (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        date TEXT NOT NULL,
                        screen_time_minutes INTEGER NOT NULL,
                        work_mode INTEGER NOT NULL DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users(user_id))''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    setup_database()
    print("Database setup complete!")
