"""Create a minimal database schema for the HR Management app.

This script connects to a MySQL URL provided via the JAWSDB_URL environment
variable (or as the first CLI argument) and creates a few basic tables used
by the application so basic endpoints can run.

Usage:
  # set JAWSDB_URL env var then run
  python scripts/create_schema.py

Or pass the DB URL as the first argument:
  python scripts/create_schema.py "mysql://user:pass@host:3306/dbname"
"""
import os
import sys
from urllib.parse import urlparse
import mysql.connector


def parse_db_url(url: str):
    p = urlparse(url)
    db = p.path[1:] if p.path.startswith('/') else p.path
    return {
        'host': p.hostname,
        'port': p.port or 3306,
        'user': p.username,
        'password': p.password,
        'database': db,
    }


def main():
    url = os.environ.get('JAWSDB_URL')
    if not url and len(sys.argv) > 1:
        url = sys.argv[1]
    if not url:
        print('Please set JAWSDB_URL env var or pass DB URL as first argument')
        sys.exit(2)

    cfg = parse_db_url(url)
    print('Connecting to', cfg['host'], 'db=', cfg['database'])
    conn = mysql.connector.connect(
        host=cfg['host'], user=cfg['user'], password=cfg['password'], database=cfg['database'], port=cfg['port']
    )
    cursor = conn.cursor()

    # Minimal schema: employee, skill, employee_skill, skill_need, skill_feedback, training, employee_training
    statements = [
        # Employee
        '''
        CREATE TABLE IF NOT EXISTS employee (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(255),
            hire_date DATE,
            department VARCHAR(100),
            job_title VARCHAR(255),
            details TEXT,
            hashed_password VARCHAR(255)
        );
        ''',

        # Skill
        '''
        CREATE TABLE IF NOT EXISTS skill (
            id INT AUTO_INCREMENT PRIMARY KEY,
            preferred_label VARCHAR(255),
            skill_type VARCHAR(100)
        );
        ''',

        # Employee <-> Skill (many-to-many)
        '''
        CREATE TABLE IF NOT EXISTS employee_skill (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT,
            skill_id INT,
            proficiency_level VARCHAR(50),
            FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
        );
        ''',

        # Skill recommendations / need
        '''
        CREATE TABLE IF NOT EXISTS skill_need (
            id INT AUTO_INCREMENT PRIMARY KEY,
            skill_id INT,
            employee_id INT,
            recommendation_score INT DEFAULT 0,
            UNIQUE KEY uniq_skill_employee (skill_id, employee_id),
            FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
        );
        ''',

        # Feedback on skill suggestions
        '''
        CREATE TABLE IF NOT EXISTS skill_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT,
            skill_id INT,
            vote VARCHAR(10),
            feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
        );
        ''',

        # Training and relations
        '''
        CREATE TABLE IF NOT EXISTS training (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            category VARCHAR(100),
            start_date DATE,
            end_date DATE
        );
        ''',

        '''
        CREATE TABLE IF NOT EXISTS employee_training (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT,
            training_id INT,
            status VARCHAR(50),
            FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
            FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE
        );
        ''',
    ]

    for sql in statements:
        try:
            cursor.execute(sql)
            conn.commit()
        except Exception as e:
            print('Error executing statement:', e)
            conn.rollback()

    print('Schema creation complete')
    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
