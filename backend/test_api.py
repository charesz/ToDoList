import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select

from main import app
from database import get_session
from models import User, Task, Column, Board

# -------------------- IN-MEMORY DB WITH SINGLE CONNECTION --------------------
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
connection = engine.connect()  # Persistent connection for in-memory DB

# Create tables
SQLModel.metadata.create_all(connection)

# Override FastAPI dependency to use sessions from the same connection
def get_test_session():
    with Session(connection) as session:
        yield session

app.dependency_overrides[get_session] = get_test_session

# -------------------- PRE-CREATE BOARD AND COLUMNS --------------------
with Session(connection) as session:
    board = Board(name="Main Board")
    session.add(board)
    session.commit()
    session.refresh(board)

    todo_col = Column(name="Todo", board_id=board.id)
    doing_col = Column(name="Doing", board_id=board.id)
    done_col = Column(name="Done", board_id=board.id)
    session.add_all([todo_col, doing_col, done_col])
    session.commit()

# -------------------- TEST CLIENT --------------------
client = TestClient(app)

# -------------------- USER TESTS --------------------
def test_signup_login_flow():
    # Signup
    response = client.post("/tasks/signup", json={"name": "Alice", "email": "alice@test.com", "password": "pass"})
    assert response.status_code == 200
    data = response.json()
    user_id = data["id"]
    assert data["name"] == "Alice"

    # Duplicate signup
    response = client.post("/tasks/signup", json={"name": "Alice", "email": "alice@test.com", "password": "pass"})
    assert response.status_code == 400

    # Successful login
    response = client.post("/tasks/login", json={"email": "alice@test.com", "password": "pass"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id

    # Failed login
    response = client.post("/tasks/login", json={"email": "alice@test.com", "password": "wrong"})
    assert response.status_code == 401

# -------------------- TASK TESTS --------------------
def test_task_crud_and_status():
    # Create task in Todo
    response = client.post("/tasks/", json={"title": "Task1", "tag": "urgent", "status": "todo"})
    assert response.status_code == 200
    task = response.json()
    task_id = task["id"]
    assert task["status"] == "todo"

    # Create task in Doing
    response = client.post("/tasks/", json={"title": "Task2", "tag": "medium", "status": "doing"})
    assert response.status_code == 200

    # Get all tasks
    response = client.get("/tasks/")
    tasks = response.json()
    assert any(t["id"] == task_id for t in tasks)

    # Update task title
    response = client.put(f"/tasks/{task_id}", json={"title": "Task1 Updated"})
    assert response.status_code == 200
    updated_task = response.json()
    assert updated_task["title"] == "Task1 Updated"

    # Move task to Done column using DB (simulate API update if needed)
    with Session(connection) as session:
        db_task = session.exec(select(Task).where(Task.id == int(task_id.replace("task-", "")))).first()
        assert db_task is not None, "Task not found in DB"
        done_col = session.exec(select(Column).where(Column.name == "Done")).first()
        db_task.column_id = done_col.id
        session.add(db_task)
        session.commit()
        session.refresh(db_task)

    # Verify task moved
    response = client.get("/tasks/")
    tasks = response.json()
    moved_task = next(t for t in tasks if t["id"] == task_id)
    assert moved_task["status"] == "done"

    # Delete task
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task deleted"

# -------------------- EDGE CASES --------------------
def test_invalid_task_creation():
    response = client.post("/tasks/", json={"title": "Invalid Task", "status": "nonexistent"})
    assert response.status_code == 400

def test_update_nonexistent_task():
    response = client.put("/tasks/task-999", json={"title": "Doesn't exist"})
    assert response.status_code == 404

def test_delete_nonexistent_task():
    response = client.delete("/tasks/task-999")
    assert response.status_code == 404