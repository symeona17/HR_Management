import mysql.connector
import json

# Load credentials from JSON file
with open("config.json", "r") as config_file:
    config = json.load(config_file)

# Create a database connection
def create_connection():
    try:
        return mysql.connector.connect(
            host=config["host"],
            user=config["user"],
            password=config["password"],
            database=config["database"]
        )
    except mysql.connector.Error as e:
        print(f"Error connecting to database: {e}")
        raise

# General function to execute a query
def execute_query(query, values=None):
    try:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return cursor.lastrowid  # Return ID of the last inserted row
    except mysql.connector.Error as e:
        print(f"Query execution error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

# General function to fetch results
def fetch_results(query, values=None):
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)  # Use dictionary=True for easier result handling
        cursor.execute(query, values)
        return cursor.fetchall()
    except mysql.connector.Error as e:
        print(f"Error fetching results: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
