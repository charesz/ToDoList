from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models import Task, Column

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/")
def get_tasks(session: Session = Depends(get_session)):
    tasks = session.exec(select(Task)).all()

    result = []
    for task in tasks:
        column = session.get(Column, task.column_id)

        result.append({
            "id": f"task-{task.id}",
            "title": task.title,
            "tag": task.tag,
            "status": column.name.lower()
        })

    return result

@router.post("/")
def create_task(data: dict, session: Session = Depends(get_session)):

    status = data.get("status")

    column = session.exec(
        select(Column).where(Column.name == status.capitalize())
    ).first()

    if not column:
        raise HTTPException(400, "Column not found")

    task = Task(
        title=data.get("title"),
        tag=data.get("tag"),
        column_id=column.id
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "id": f"task-{task.id}",
        "title": task.title,
        "tag": task.tag,
        "status": status
    }

@router.delete("/{task_id}")
def delete_task(task_id: str, session: Session = Depends(get_session)):

    db_id = int(task_id.replace("task-", ""))

    task = session.get(Task, db_id)
    if not task:
        raise HTTPException(404, "Task not found")

    session.delete(task)
    session.commit()

    return {"message": "Task deleted"}

@router.put("/{task_id}")
def update_task(task_id: str, data: dict, session: Session = Depends(get_session)):

    db_id = int(task_id.replace("task-", ""))

    task = session.get(Task, db_id)
    if not task:
        raise HTTPException(404, "Task not found")

    if "title" in data:
        task.title = data["title"]

    session.add(task)
    session.commit()
    session.refresh(task)

    column = session.get(Column, task.column_id)

    return {
        "id": f"task-{task.id}",
        "title": task.title,
        "tag": task.tag,
        "status": column.name.lower()
    }
