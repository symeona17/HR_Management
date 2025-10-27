"""
Analytics endpoints for the HR Management system.
Provides aggregated statistics and export functionality for employees, trainings, and feedback.
"""

from fastapi import APIRouter, Query, Response, HTTPException
from app.database.database import fetch_results
import csv
import io
from datetime import datetime
from typing import Optional, Tuple, List

try:
    import pandas as pd
except Exception:
    pd = None

router = APIRouter()


@router.get("/overview")
def analytics_overview(start_date: Optional[str] = Query(None, description="YYYY-MM-DD"), end_date: Optional[str] = Query(None, description="YYYY-MM-DD")):
    """High-level stats + monthly feedback timeseries.

    Returns:
      - employee_count, training_count, feedback_count
      - active_trainings, upcoming_trainings
      - avg_feedback
      - monthly_feedback: [{month: 'YYYY-MM', avg_feedback, n}]
    """
    # Basic counts
    emp = fetch_results("SELECT COUNT(*) AS count FROM employee")[0]["count"]
    trn = fetch_results("SELECT COUNT(*) AS count FROM training")[0]["count"]
    fb = fetch_results("SELECT COUNT(*) AS count FROM feedback")[0]["count"]

    # Active / upcoming trainings
    active = fetch_results("SELECT COUNT(*) AS count FROM training WHERE start_date <= CURDATE() AND end_date >= CURDATE()")[0]["count"]
    upcoming = fetch_results("SELECT COUNT(*) AS count FROM training WHERE start_date > CURDATE()")[0]["count"]

    avg_feedback = fetch_results("SELECT AVG(sentiment_score) AS avg FROM feedback")[0]["avg"]

    # Build date filter for feedback monthly aggregation
    where_clauses: List[str] = []
    params: List[str] = []
    if start_date:
        # validate
        try:
            datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="start_date must be YYYY-MM-DD")
        where_clauses.append("feedback_date >= %s")
        params.append(start_date)
    if end_date:
        try:
            datetime.strptime(end_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="end_date must be YYYY-MM-DD")
        where_clauses.append("feedback_date <= %s")
        params.append(end_date)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    monthly = fetch_results(f"""
        SELECT DATE_FORMAT(feedback_date, '%Y-%m') AS month, AVG(sentiment_score) AS avg_feedback, COUNT(*) AS n
        FROM feedback
        {where_sql}
        GROUP BY month
        ORDER BY month
    """, tuple(params) if params else None)

    return {
        "employee_count": emp,
        "training_count": trn,
        "feedback_count": fb,
        "active_trainings": active,
        "upcoming_trainings": upcoming,
        "avg_feedback": avg_feedback,
        "monthly_feedback": monthly,
    }


@router.get("/trainings")
def analytics_trainings(start_date: Optional[str] = Query(None, description="YYYY-MM-DD"), end_date: Optional[str] = Query(None, description="YYYY-MM-DD")):
    """Return trainings with participant counts and monthly aggregates (trainings started & participants by month)."""
    trainings = fetch_results("""
        SELECT t.id, t.title, t.category, COUNT(et.employee_id) AS participants
        FROM training t
        LEFT JOIN employee_training et ON t.id = et.training_id
        GROUP BY t.id
        ORDER BY participants DESC
    """)

    # Apply optional start/end filter on training start_date
    where_clauses: List[str] = []
    params: List[str] = []
    if start_date:
        try:
            datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="start_date must be YYYY-MM-DD")
        where_clauses.append("t.start_date >= %s")
        params.append(start_date)
    if end_date:
        try:
            datetime.strptime(end_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="end_date must be YYYY-MM-DD")
        where_clauses.append("t.start_date <= %s")
        params.append(end_date)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    trainings_by_month = fetch_results(f"""
        SELECT DATE_FORMAT(t.start_date, '%Y-%m') AS month, COUNT(*) AS trainings_started
        FROM training t
        {where_sql}
        GROUP BY month
        ORDER BY month
    """, tuple(params) if params else None)

    participants_by_month = fetch_results(f"""
        SELECT DATE_FORMAT(t.start_date, '%Y-%m') AS month, COUNT(et.employee_id) AS participants
        FROM training t
        LEFT JOIN employee_training et ON t.id = et.training_id
        {where_sql}
        GROUP BY month
        ORDER BY month
    """, tuple(params) if params else None)

    return {"trainings": trainings, "trainings_by_month": trainings_by_month, "participants_by_month": participants_by_month}


@router.get("/feedback")
def analytics_feedback(start_date: Optional[str] = Query(None, description="YYYY-MM-DD"), end_date: Optional[str] = Query(None, description="YYYY-MM-DD")):
    """Return feedback analytics: monthly averages and top/bottom employees by avg feedback."""
    where_clauses: List[str] = []
    params: List[str] = []
    if start_date:
        try:
            datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="start_date must be YYYY-MM-DD")
        where_clauses.append("f.feedback_date >= %s")
        params.append(start_date)
    if end_date:
        try:
            datetime.strptime(end_date, "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="end_date must be YYYY-MM-DD")
        where_clauses.append("f.feedback_date <= %s")
        params.append(end_date)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    monthly = fetch_results(f"""
        SELECT DATE_FORMAT(f.feedback_date, '%Y-%m') AS month, AVG(f.sentiment_score) AS avg_feedback, COUNT(*) AS n
        FROM feedback f
        {where_sql}
        GROUP BY month
        ORDER BY month
    """, tuple(params) if params else None)

    top_pos = fetch_results("""
        SELECT e.id AS employee_id, e.first_name, e.last_name, AVG(f.sentiment_score) AS avg_feedback, COUNT(f.id) AS n_feedback
        FROM employee e
        JOIN feedback f ON e.id = f.employee_id
        GROUP BY e.id
        HAVING COUNT(f.id) >= 1
        ORDER BY avg_feedback DESC
        LIMIT 10
    """)

    top_neg = fetch_results("""
        SELECT e.id AS employee_id, e.first_name, e.last_name, AVG(f.sentiment_score) AS avg_feedback, COUNT(f.id) AS n_feedback
        FROM employee e
        JOIN feedback f ON e.id = f.employee_id
        GROUP BY e.id
        HAVING COUNT(f.id) >= 1
        ORDER BY avg_feedback ASC
        LIMIT 10
    """)

    return {"monthly": monthly, "top_positive": top_pos, "top_negative": top_neg}


@router.get("/skills")
def analytics_skills(limit: int = 20):
    """Return skills with lowest average proficiency (skill gaps).

    Requires `employee_skill.proficiency_level` to be numeric.
    """
    skills = fetch_results("""
        SELECT s.id AS skill_id, s.preferred_label, AVG(es.proficiency_level) AS avg_proficiency, COUNT(es.employee_id) AS n
        FROM skill s
        JOIN employee_skill es ON s.id = es.skill_id
        GROUP BY s.id
        HAVING n > 0
        ORDER BY avg_proficiency ASC
        LIMIT %s
    """, (limit,))
    return {"low_proficiency_skills": skills}


@router.get("/export")
def analytics_export(format: str = Query("csv", enum=["csv", "excel"])):
    """Export employees/trainings/feedback. Supports CSV and Excel (if pandas + engine available).

    Excel requires pandas and either openpyxl/xlsxwriter installed. If Excel can't be produced the endpoint falls back to CSV.
    """
    employees = fetch_results("SELECT * FROM employee")
    trainings = fetch_results("SELECT * FROM training")
    feedback = fetch_results("SELECT * FROM feedback")

    # If Excel requested and pandas available, try to produce a multi-sheet workbook
    if format == "excel" and pd is not None:
        try:
            # Build DataFrames
            df_emp = pd.DataFrame(employees)
            df_trn = pd.DataFrame(trainings)
            df_fb = pd.DataFrame(feedback)

            output = io.BytesIO()
            # let pandas pick the engine; if not available an Exception will be raised
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df_emp.to_excel(writer, sheet_name="employees", index=False)
                df_trn.to_excel(writer, sheet_name="trainings", index=False)
                df_fb.to_excel(writer, sheet_name="feedback", index=False)
            output.seek(0)
            return Response(content=output.read(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=analytics_export.xlsx"})
        except Exception:
            # fallthrough to CSV
            pass

    # Default CSV export
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["EMPLOYEES"])
    if employees:
        writer.writerow(list(employees[0].keys()))
        for row in employees:
            writer.writerow(list(row.values()))
    writer.writerow([])
    writer.writerow(["TRAININGS"])
    if trainings:
        writer.writerow(list(trainings[0].keys()))
        for row in trainings:
            writer.writerow(list(row.values()))
    writer.writerow([])
    writer.writerow(["FEEDBACK"])
    if feedback:
        writer.writerow(list(feedback[0].keys()))
        for row in feedback:
            writer.writerow(list(row.values()))
    csv_data = output.getvalue()
    output.close()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=analytics_export.csv"})
