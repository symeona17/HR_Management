# HR Management API

HR Management Application created for my Thesis Project.

## Features
- Manage employees (CRUD operations: create, read, update, delete)
- Manage skills (CRUD operations and skill assignment to employees)
- Manage trainings (create, list, and assign trainings to employees)
- User authentication with JWT (secure login and protected endpoints)
- RESTful API built with FastAPI
- Modern frontend built with Next.js (React)
- Cross-Origin Resource Sharing (CORS) enabled for frontend-backend communication
- Secure password hashing with passlib
- Environment-based configuration for credentials and database access

## Setup & Running the Application

### 1. Clone the Repository

Download or clone the repository from [here](https://github.com/symeona17/HR_Management).

### 2. Backend Setup (FastAPI)

1. Open a terminal in the project root directory.
2. (Recommended) Create a virtual environment:
	- Windows:
	  ```
	  python -m venv .venv
	  .venv\Scripts\Activate
	  ```
3. Install backend dependencies:
	```
	pip install -r app/requirements.txt
	```
4. Ensure you have a `.env` file with your database credentials in the correct location (see project docs for details).
5. Start the backend server:
	```
	uvicorn main:app --reload
	```

### 3. Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
	```
	cd hr-management-frontend
	```
2. Install frontend dependencies:
	```
	npm install
	```
3. Start the frontend development server:
	```
	npm run dev
	```

### 4. Accessing the Application

- The frontend will be available at [http://localhost:3000](http://localhost:3000)
- The backend API will be available at [http://localhost:8000](http://localhost:8000)