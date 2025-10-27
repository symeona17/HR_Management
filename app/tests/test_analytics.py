import os
import sys
from fastapi.testclient import TestClient

# Ensure repo root is on sys.path so `main` can be imported when pytest runs from anywhere
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from main import app

client = TestClient(app)


def test_overview():
    r = client.get('/analytics/overview')
    assert r.status_code == 200
    data = r.json()
    assert 'employee_count' in data
    assert 'training_count' in data
    assert 'avg_feedback' in data


def test_trainings():
    r = client.get('/analytics/trainings')
    assert r.status_code == 200
    data = r.json()
    assert 'trainings' in data


def test_feedback():
    r = client.get('/analytics/feedback')
    assert r.status_code == 200
    data = r.json()
    assert 'monthly' in data or 'monthly_feedback' in data
