"""
ML retraining logic for feedback events.
This module provides a function to retrain or update the ML recommender for a specific employee after feedback is received.
"""
from app.ml_recommender import HybridRecommender
from app.database import fetch_results



def retrain_recommender_on_feedback(employee_id: int = None, topn: int = 10):
    """
    Retrain the ML recommender using ESCO data and user feedback from skill_feedback table.
    This updates the model files so future recommendations reflect user votes.
    
    Args:
        employee_id: (DEPRECATED) Individual employee training is no longer used.
                     Now retrains globally across all feedback and populates skill_need for all employees.
        topn: Number of top skills to recommend per employee.
    
    Flow:
        1. Train model on merged ESCO data + feedback votes
        2. Save model/vectorizer/mlb artifacts
        3. For each employee: infer skills and upsert into skill_need table
    """
    import pandas as pd
    import joblib
    import os
    import time
    import gc
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import MultiLabelBinarizer
    from sklearn.multiclass import OneVsRestClassifier
    from sklearn.linear_model import LogisticRegression

    start_time = time.time()
    print("[Retrain] Starting ML model retrain (memory-conscious mode)...")

    # --- 1. Load ESCO data ---
    print("[Retrain] Loading ESCO CSV data...")
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
    DATA_PATH = os.path.join(BASE_PATH, 'occupationSkillRelations_en.csv')
    MODEL_PATH = os.path.join(BASE_PATH, 'esco_skill_recommender.pkl')
    VECTORIZER_PATH = os.path.join(BASE_PATH, 'esco_jobtitle_vectorizer.pkl')
    MLB_PATH = os.path.join(BASE_PATH, 'esco_skill_binarizer.pkl')
    # Load only needed columns to reduce memory
    df = pd.read_csv(DATA_PATH, usecols=['occupationLabel', 'skillLabel'])
    df['job_title_norm'] = df['occupationLabel'].str.lower().str.strip()
    print(f"[Retrain] ✓ Loaded {len(df)} occupation-skill relationships")
    
    # Clean up memory after loading (occupationLabel no longer needed)
    df = df[['job_title_norm', 'skillLabel']]
    gc.collect()

    # --- 2. Aggregate user feedback from skill_feedback table ---
    print("[Retrain] Aggregating user feedback...")
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
    print(f"[Retrain] ✓ Found {len(feedback_df)} feedback votes")

    # --- 3. Merge ESCO and feedback data with weighted feedback ---
    print("[Retrain] Merging ESCO data with weighted feedback...")
    # For each job_title_norm, collect skills from ESCO
    job_to_skills = df.groupby('job_title_norm')['skillLabel'].apply(set).to_dict()
    
    # Build skill weights dictionary (skill_name -> weight)
    # Base weight = 1.0, +0.2 per upvote, -0.2 per downvote, min 0.2
    skill_weights = {}  # Will map skill_label -> weight
    
    # Add upvoted/downvoted skills from feedback (keeping all, not removing)
    if not feedback_df.empty:
        for jt, group in feedback_df.groupby('job_title_norm'):
            if jt not in job_to_skills:
                job_to_skills[jt] = set()
            # Process each skill in this job title
            for skill in group['skill'].unique():
                skill_votes = group[group['skill'] == skill]
                up_count = len(skill_votes[skill_votes['vote'] == 'up'])
                down_count = len(skill_votes[skill_votes['vote'] == 'down'])
                # Weight = 1.0 + (0.2 * up_count) - (0.2 * down_count), min 0.2
                weight = max(0.2, 1.0 + (0.2 * up_count) - (0.2 * down_count))
                skill_weights[skill] = weight
                job_to_skills[jt].add(skill)  # Add skill even if downvoted
    
    print(f"[Retrain] ✓ Prepared training data with {len(job_to_skills)} job titles")
    print(f"[Retrain] ✓ Built skill weights for {len(skill_weights)} feedback-voted skills")

    # --- 4. Prepare training data ---
    print("[Retrain] Preparing training data...")
    job_titles = list(job_to_skills.keys())
    skill_lists = [list(skills) for skills in job_to_skills.values()]

    # --- 5. Train model ---
    print("[Retrain] Training ML model (full quality, memory-conscious)...")
    # Original quality: no feature limit, but use liblinear solver for memory efficiency
    vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1,1))
    X = vectorizer.fit_transform(job_titles)
    print(f"[Retrain]   TF-IDF vocabulary size: {len(vectorizer.get_feature_names_out())}")
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(skill_lists)
    # liblinear is more memory-efficient than default 'lbfgs' solver
    clf = OneVsRestClassifier(LogisticRegression(max_iter=2000, C=10, solver='liblinear', n_jobs=1))
    clf.fit(X, Y)
    print(f"[Retrain] ✓ Model training complete")
    
    # Clear intermediate data to free memory before saving
    del X, Y, job_titles, skill_lists, df, feedback_df, job_to_skills
    gc.collect()

    # --- 6. Save model and encoders ---
    print("[Retrain] Saving model artifacts...")
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(mlb, MLB_PATH)
    
    # --- 6b. Save skill weights dictionary ---
    WEIGHTS_PATH = os.path.join(BASE_PATH, 'esco_skill_weights.pkl')
    joblib.dump(skill_weights, WEIGHTS_PATH)
    print(f"[Retrain] ✓ Saved 4 files to {BASE_PATH} (model + weights)")
    
    # Clean up to free memory
    del clf, vectorizer, mlb, skill_weights
    gc.collect()

    elapsed = time.time() - start_time
    print(f"[Retrain] ✓ Complete! Model trained in {elapsed:.1f}s")
    print(f"[Retrain] Skills will be calculated per-employee when 'Calculate' is clicked.")
    return True
