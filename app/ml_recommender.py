"""
Hybrid L&D Recommendation Engine for HR_Management
- Uses both content-based (skills, job roles) and collaborative filtering (training history)
- Designed for integration with FastAPI and your existing database
"""
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
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
    def fetch_trending_skills_from_web(self, topn=5, job_title=None, con=None):
        """
        Returns recommended skills for a given job title using the trained ML model.
        If the ML model returns no skills, falls back to direct CSV lookup and fuzzy matching (like the test script).
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
        CSV_PATH = os.path.join(BASE_PATH, 'occupation_skill_matrix.csv')
        # Load model and encoders
        clf = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        mlb = joblib.load(MLB_PATH)
        # Normalize job title
        jt = (job_title or '').lower().strip()
        print(f"[DEBUG] Job title for ML: '{jt}'")
        X_new = vectorizer.transform([jt])
        print(f"[DEBUG] Vectorized job title shape: {X_new.shape}")
        y_pred = clf.predict(X_new)
        print(f"[DEBUG] Raw prediction (y_pred): {y_pred}")
        skills = mlb.inverse_transform(y_pred)
        print(f"[DEBUG] Inverse transformed skills: {skills}")
        skill_labels = list(skills[0]) if skills and len(skills) > 0 else []
        print(f"[DEBUG] Skill labels predicted: {skill_labels}")
        # Fallback: direct CSV lookup if ML returns nothing
        if not skill_labels:
            print("[DEBUG] ML returned no skills, trying CSV fallback...")
            df = pd.read_csv(CSV_PATH)
            df['job_title_norm'] = df['job_title'].str.lower().str.strip()
            direct = df[df['job_title_norm'] == jt]['skill'].tolist()
            if direct:
                print(f"[Fallback] Direct lookup used for '{job_title}' (norm: '{jt}')")
                skill_labels = direct[:topn]
            elif process is not None:
                all_titles = df['job_title'].unique()
                matches = process.extract(job_title, all_titles, limit=5)
                print(f"Top 5 closest job titles for '{job_title}':")
                for m, s, _ in matches:
                    print(f"  - {m} (score: {s})")
                match, score, _ = matches[0]
                HIGH_CONFIDENCE = 90
                LOW_CONFIDENCE = 80
                if score >= HIGH_CONFIDENCE:
                    print(f"[Fuzzy Fallback] Closest match for '{job_title}' is '{match}' (score: {score})")
                    direct = df[df['job_title'] == match]['skill'].tolist()
                    skill_labels = direct[:topn]
                elif score >= LOW_CONFIDENCE:
                    print(f"[Warning] Closest match for '{job_title}' is '{match}' (score: {score}), confidence is moderate. Returning skills anyway.")
                    direct = df[df['job_title'] == match]['skill'].tolist()
                    skill_labels = direct[:topn]
                else:
                    print(f"[Warning] No close match found for '{job_title}' (best score: {score}). No skills returned.")
                    skill_labels = []
        # Map skill labels to DB skills
        from app.database import fetch_results, execute_query
        db_skills = fetch_results("SELECT id, preferred_label, skill_type FROM skill", ())
        skill_map = { s['preferred_label'].lower(): s for s in db_skills }
        result = []
        for i, label in enumerate(skill_labels[:topn]):
            key = label.lower()
            if key in skill_map:
                db_skill = skill_map[key]
                result.append({
                    "id": db_skill['id'],
                    "preferred_label": db_skill['preferred_label'],
                    "skill_type": db_skill['skill_type'],
                    "score": 100 - i*5
                })
            else:
                # Optionally insert new skill if not found
                insert_query = "INSERT INTO skill (preferred_label) VALUES (%s)"
                new_id = execute_query(insert_query, (label,))
                result.append({
                    "id": new_id,
                    "preferred_label": label,
                    "skill_type": "",
                    "score": 100 - i*5
                })
                skill_map[key] = {"id": new_id, "preferred_label": label, "skill_type": ""}
        print(f"[DEBUG] Final recommended skills: {result}")
        return result
    def __init__(self):
        self.training_ids = None
        self.employee_ids = None
        self.employee_skills = None
        self.trainings = None
        self.user_item_matrix = None
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
        # If force_trending is True, always return trending skills
        if force_trending:
            return self.fetch_trending_skills_from_web(topn=topn, job_title="Support Specialist", con=con)
        # If employee not found, return trending skills for Support Specialist in DB format
        if employee_id not in self.employee_ids:
            return self.fetch_trending_skills_from_web(topn=topn, job_title="Support Specialist", con=con)

        # If training_need is empty, fallback to trending skills
        if self.training_need is None or len(self.training_need) == 0:
            return self.fetch_trending_skills_from_web(topn=topn, job_title="Support Specialist", con=con)

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
            {"id": s['id'], "preferred_label": s['preferred_label'], "skill_type": s['skill_type'], "score": 100 - i*5}
            for i, s in enumerate(missing_skills[:topn])
        ]
        if not scored_skills:
            return self.fetch_trending_skills_from_web(topn=topn, job_title="Support Specialist", con=con)
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
