import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables from .env file
load_dotenv()

# Fetch credentials from environment variables
host = os.getenv("DB_HOST")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
database = os.getenv("DB_NAME")

# Create a database connection
def create_connection():
    try:
        return mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
    except mysql.connector.Error as e:
        print(f"Error connecting to database: {e}")
        raise

# General function to execute a query
def execute_query(query, values=None):
    conn = None
    cursor = None
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
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# General function to fetch results
def fetch_results(query, values=None):
    conn = None
    cursor = None
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)  # Use dictionary=True for easier result handling
        cursor.execute(query, values)
        return cursor.fetchall()
    except mysql.connector.Error as e:
        print(f"Error fetching results: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()