import mysql.connector
import mysql.connector
import json

# Load credentials from JSON file
with open("config.json", "r") as config_file:
    config = json.load(config_file)

# Create a database connection
def create_connection():
    return mysql.connector.connect(
        host=config["host"],
        user=config["user"],
        password=config["password"],
        database=config["database"]
    )

# Test connection
try:
    conn = create_connection()
    print("Database connected successfully!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")


# Function to execute a query
def execute_query(query, values=None):
    try:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        print("Query executed successfully!")
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

# Insert
#execute_query(
 #   "INSERT INTO employees (first_name, last_name, email, hire_date, department, job_title) "
 #   "VALUES (%s, %s, %s, %s, %s, %s)",
#  ("John", "Doe", "john.doe@example.com", "2024-06-01", "Engineering", "Software Engineer")
#)

def fetch_results(query, values=None):
    try:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        rows = cursor.fetchall()
        for row in rows:
            print(row)
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

# Example: Fetch all employees
fetch_results("SELECT * FROM employees")
