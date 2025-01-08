from fastapi import FastAPI
from database.database import fetch_results, execute_query

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the application"}

@app.get("/employees")
def get_employees():
    # Fetch employees from the database
    query = "SELECT * FROM employees"
    results = []
    try:
        results = fetch_results(query)
    except Exception as e:
        return {"error": str(e)}
    return {"employees": results}
