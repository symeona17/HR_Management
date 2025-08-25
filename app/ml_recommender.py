"""
Hybrid L&D Recommendation Engine for HR_Management
- Uses both content-based (skills, job roles) and collaborative filtering (training history)
- Designed for integration with FastAPI and your existing database
"""
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from app.database import fetch_results

# --- Data Extraction Helpers (replace with your DB queries) ---
def get_employees(con):
    rows = fetch_results('SELECT id, first_name, last_name, department, job_title FROM employee', ())
    return pd.DataFrame(rows, columns=['id', 'first_name', 'last_name', 'department', 'job_title'])

def get_trainings(con):
    rows = fetch_results('SELECT id, title, category FROM training', ())
    return pd.DataFrame(rows, columns=['id', 'title', 'category'])

def get_employee_skills(con):
    rows = fetch_results('SELECT employee_id, skill_id FROM employee_skill', ())
    return pd.DataFrame(rows, columns=['employee_id', 'skill_id'])


def get_training_need(con):
    rows = fetch_results('SELECT employee_id, skill_id, recommendation_score FROM skill_need', ())
    return pd.DataFrame(rows, columns=['employee_id', 'skill_id', 'recommendation_score'])

def get_training_history(con):
    rows = fetch_results('SELECT employee_id, training_id FROM employee_training', ())
    return pd.DataFrame(rows, columns=['employee_id', 'training_id'])

# --- Hybrid Recommendation Engine ---


class HybridRecommender:
    @staticmethod
    def preprocess_job_title(job_title, department):
        """
        Remove generic words from job title and optionally append department for more context.
        """
        import re
        GENERIC_WORDS = [
            'specialist', 'officer', 'associate', 'assistant', 'manager', 'staff', 'worker',
            'coordinator', 'representative', 'consultant', 'analyst', 'lead', 'supervisor',
            'administrator', 'advisor', 'agent', 'executive', 'clerk', 'technician', 'intern',
            'junior', 'senior', 'head', 'chief', 'director', 'principal', 'expert', 'team', 'member'
        ]
        # Lowercase and remove punctuation
        jt = job_title.lower() if job_title else ''
        jt = re.sub(r'[^a-z0-9 ]+', '', jt)
        # Remove generic words
        tokens = [w for w in jt.split() if w not in GENERIC_WORDS]
        cleaned = ' '.join(tokens)
        # Optionally add department for more context
        #if department:
            #dept = department.lower().strip()
            #cleaned = f"{cleaned} {dept}".strip()
        # Fallback: if cleaned is empty, use original job title
        if not cleaned:
            cleaned = job_title.lower() if job_title else ''
        return cleaned
    def fetch_trending_skills_from_web(self, topn=5, employee_id=None, con=None):
        """
        Returns recommended skills for a given employee using the trained ML model.
        Loads job_title and department from the employee table using employee_id.
        If the ML model returns no skills, falls back to direct CSV lookup and fuzzy matching.
        """
        import joblib
        import os
        import pandas as pd
        try:
            from rapidfuzz import process
        except ImportError:
            process = None
        # Paths to model and encoders
        BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
        MODEL_PATH = os.path.join(BASE_PATH, 'esco_skill_recommender.pkl')
        VECTORIZER_PATH = os.path.join(BASE_PATH, 'esco_jobtitle_vectorizer.pkl')
        MLB_PATH = os.path.join(BASE_PATH, 'esco_skill_binarizer.pkl')
    # print(f"[DEBUG] Loading MODEL_PATH: {os.path.abspath(MODEL_PATH)}")
    # print(f"[DEBUG] Loading VECTORIZER_PATH: {os.path.abspath(VECTORIZER_PATH)}")
    # print(f"[DEBUG] Loading MLB_PATH: {os.path.abspath(MLB_PATH)}")
        CSV_PATH = os.path.join(BASE_PATH, 'occupation_skill_matrix.csv')
        import joblib
        # Always load job_title and department from DB using employee_id
        job_title = None
        department = None
        if employee_id is not None:
            from app.database import fetch_results
            emp_rows = fetch_results('SELECT job_title, department FROM employee WHERE id = %s', (employee_id,))
            # print(f"[DEBUG] emp_rows from DB: {emp_rows}")
            if emp_rows and isinstance(emp_rows, list):
                first_row = emp_rows[0]
                # print(f"[DEBUG] first_row raw: {first_row} (type: {type(first_row)})")
                if isinstance(first_row, dict):
                    job_title = first_row.get('job_title')
                    department = first_row.get('department')
                elif isinstance(first_row, (list, tuple)):
                    job_title = first_row[0] if len(first_row) > 0 else None
                    department = first_row[1] if len(first_row) > 1 else None
        jt = self.preprocess_job_title(job_title, department)
    # print(f"[INFO] Preprocessed job title for ML: '{jt}' (original: '{job_title}', department: '{department}')")
        # Load model and encoders
        clf = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        mlb = joblib.load(MLB_PATH)
        X_new = vectorizer.transform([jt])
        # Efficiently select top N skills by probability
        proba = clf.predict_proba(X_new)
        topn = int(topn) if topn is not None else 5
        # Get indices of top N probabilities
        top_indices = np.argpartition(-proba[0], range(topn))[:topn]
        # Sort these indices by actual probability descending
        top_indices = top_indices[np.argsort(-proba[0][top_indices])]
        skill_labels = [mlb.classes_[i] for i in top_indices]
        # Fallback: direct CSV lookup if ML returns nothing
        if not skill_labels:
            df = pd.read_csv(CSV_PATH)
            df['job_title_norm'] = df['job_title'].str.lower().str.strip()
            direct = df[df['job_title_norm'] == jt]['skill'].tolist()
            if direct:
                skill_labels = direct[:topn]
            elif process is not None:
                all_titles = df['job_title'].unique()
                matches = process.extract(jt, all_titles, limit=5)
                match, score, _ = matches[0]
                HIGH_CONFIDENCE = 90
                LOW_CONFIDENCE = 80
                if score >= HIGH_CONFIDENCE:
                    direct = df[df['job_title'] == match]['skill'].tolist()
                    skill_labels = direct[:topn]
                elif score >= LOW_CONFIDENCE:
                    direct = df[df['job_title'] == match]['skill'].tolist()
                    skill_labels = direct[:topn]
                else:
                    skill_labels = []
        # Map skill labels to DB skills
        from app.database import fetch_results, execute_query
        db_skills = fetch_results("SELECT id, preferred_label, skill_type FROM skill", ())
        skill_map = { s['preferred_label'].lower(): s for s in db_skills }
        result = []
        # employee_id is already provided as argument
        # Map skill labels to their ML probabilities (scaled 0-100)
        skill_to_proba = {}
        if 'proba' in locals():
            for idx, skill in enumerate(mlb.classes_):
                skill_to_proba[skill] = proba[0][idx]
        for i, label in enumerate(skill_labels[:topn]):
            key = label.lower()
            if key in skill_map:
                db_skill = skill_map[key]
                skill_id = db_skill['id']
                # Get ML probability for this skill, scale to 0-100
                prob = skill_to_proba.get(label, 0)
                rec_score = int(round(prob * 100))
                result.append({
                    "id": skill_id,
                    "preferred_label": label,
                    "skill_type": skill_map[key]["skill_type"],
                    "recommendation_score": rec_score
                })
                # Insert or update skill_need table if employee_id is available
                #if employee_id is not None:
                #    upsert_query = "INSERT INTO skill_need (skill_id, employee_id, recommendation_score) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE recommendation_score = VALUES(recommendation_score)"
                #    try:
                #        execute_query(upsert_query, (skill_id, employee_id, rec_score))
                #    except Exception as e:
                        # print(f"Failed to insert/update skill_need: {e}. Data: skill_id={skill_id}, employee_id={employee_id}, recommendation_score={rec_score}")
            #else:
                # Do not insert new skills; skip if not found
                # print(f"[DEBUG] Skill '{label}' not found in skill table. Skipping.")
        # Sort results by recommendation_score descending
        result_sorted = sorted(result, key=lambda x: x["recommendation_score"], reverse=True)
        # print(f"[INFO] Final recommended skills: {result_sorted}")
        print("[SUCCESS] ML recommendation procedure completed successfully.")
        return result_sorted
    def __init__(self):
        self.training_ids = None
        self.employee_ids = None
        self.employee_skills = None
        self.trainings = None
                        # print(f"[DEBUG] emp_rows from DB: {emp_rows}")
        self.training_need = None

    def fit(self, employees, trainings, employee_skills, training_history, training_need):
        self.employee_skills = employee_skills
        self.trainings = trainings
        self.employee_ids = list(employees['id'])
        self.training_ids = list(trainings['id'])
        self.training_need = training_need

        # Build user-item interaction matrix (collaborative filtering)
        user_idx = {eid: i for i, eid in enumerate(self.employee_ids)}
        item_idx = {tid: i for i, tid in enumerate(self.training_ids)}
        matrix = np.zeros((len(self.employee_ids), len(self.training_ids)))
        for _, row in training_history.iterrows():
            u = user_idx.get(row['employee_id'])
            t = item_idx.get(row['training_id'])
            if u is not None and t is not None:
                matrix[u, t] = 1  # implicit feedback
        self.user_item_matrix = matrix

    def recommend(self, employee_id, topn=5, con=None, force_trending=False):
        # If force_trending is True, always return trending skills for this employee
        if force_trending:
            return self.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)
        # If employee not found, return trending skills for this employee
        if employee_id not in self.employee_ids:
            return self.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)

        # If training_need is empty, fallback to trending skills for this employee
        if self.training_need is None or len(self.training_need) == 0:
            return self.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)

        # Get all skills from DB
        from app.database import fetch_results
        all_skills = fetch_results("SELECT id, preferred_label, skill_type FROM skill", ())
        # Get employee's current skills
        emp_skill_rows = fetch_results("SELECT skill_id FROM employee_skill WHERE employee_id = %s", (employee_id,))
        emp_skill_ids = {s['skill_id'] for s in emp_skill_rows}
        # Recommend missing skills (not already possessed)
        missing_skills = [s for s in all_skills if s['id'] not in emp_skill_ids]
        # Score: simple popularity (frequency in training_need) or just topN
        # For now, just return topN missing skills with descending dummy score
        scored_skills = [
            {"id": s['id'], "preferred_label": s['preferred_label'], "skill_type": s['skill_type'], "recommendation_score": 100 - i*5}
            for i, s in enumerate(missing_skills[:topn])
        ]
        if not scored_skills:
            return self.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)
        return scored_skills



    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @staticmethod
    def load(path):
        with open(path, 'rb') as f:
            return pickle.load(f)

# --- Example Usage (to be called from FastAPI endpoint) ---
# con = ... # your DB connection
# employees = get_employees(con)
# trainings = get_trainings(con)
# employee_skills = get_employee_skills(con)
# No training_skills table; use training_need if needed
# training_history = get_training_history(con)
# recommender = HybridRecommender()
# recommender.fit(employees, trainings, employee_skills, training_history, training_need)
# recommender.save('hybrid_recommender.pkl')
# # To recommend for an employee:
# recommender = HybridRecommender.load('hybrid_recommender.pkl')
# recommended_training_ids = recommender.recommend(employee_id=123)
# # Map IDs to training info as needed
