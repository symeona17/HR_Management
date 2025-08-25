"""
ML retraining logic for feedback events.
This module provides a function to retrain or update the ML recommender for a specific employee after feedback is received.
"""
from app.ml_recommender import HybridRecommender
from app.database import fetch_results



def retrain_recommender_on_feedback(employee_id: int, topn: int = 10):
    """
    Retrain the ML recommender using both ESCO data and user feedback from skill_feedback.
    This will update the model files so future recommendations reflect user votes.
    """
    import pandas as pd
    import joblib
    import os
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import MultiLabelBinarizer
    from sklearn.multiclass import OneVsRestClassifier
    from sklearn.linear_model import LogisticRegression

    # --- 1. Load ESCO data ---
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
    DATA_PATH = os.path.join(BASE_PATH, 'occupation_skill_matrix.csv')
    MODEL_PATH = os.path.join(BASE_PATH, 'esco_skill_recommender.pkl')
    VECTORIZER_PATH = os.path.join(BASE_PATH, 'esco_jobtitle_vectorizer.pkl')
    MLB_PATH = os.path.join(BASE_PATH, 'esco_skill_binarizer.pkl')
    df = pd.read_csv(DATA_PATH)
    df['job_title_norm'] = df['job_title'].str.lower().str.strip()

    # --- 2. Aggregate user feedback from skill_feedback table ---
    # Get all feedback (not just for this employee, so model learns from all users)
    feedback_rows = fetch_results("SELECT sf.employee_id, sf.skill_id, sf.vote, e.job_title FROM skill_feedback sf JOIN employee e ON sf.employee_id = e.id", ())
    # Map skill_id to skill label
    skill_map = {row['id']: row['preferred_label'] for row in fetch_results("SELECT id, preferred_label FROM skill", ())}
    # Build feedback DataFrame
    feedback_data = []
    for row in feedback_rows:
        job_title = row['job_title'].lower().strip() if row['job_title'] else None
        skill_label = skill_map.get(row['skill_id'])
        if job_title and skill_label:
            feedback_data.append({
                'job_title_norm': job_title,
                'skill': skill_label,
                'vote': row['vote']
            })
    feedback_df = pd.DataFrame(feedback_data)

    # --- 3. Merge ESCO and feedback data ---
    # For each job_title_norm, collect skills from ESCO and upvoted feedback
    job_to_skills = df.groupby('job_title_norm')['skill'].apply(set).to_dict()
    # Add upvoted skills from feedback
    for jt, group in feedback_df.groupby('job_title_norm'):
        up_skills = set(group[group['vote'] == 'up']['skill'])
        down_skills = set(group[group['vote'] == 'down']['skill'])
        if jt not in job_to_skills:
            job_to_skills[jt] = set()
    job_to_skills[jt].update(up_skills)
        # Optionally, remove downvoted skills
    job_to_skills[jt] -= down_skills

    # --- 4. Prepare training data ---
    job_titles = list(job_to_skills.keys())
    skill_lists = [list(skills) for skills in job_to_skills.values()]

    # --- 5. Train model ---
    vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1,1))
    X = vectorizer.fit_transform(job_titles)
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(skill_lists)
    clf = OneVsRestClassifier(LogisticRegression(max_iter=2000, C=10))
    clf.fit(X, Y)

    # --- 6. Save model and encoders ---
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(mlb, MLB_PATH)

    return True
