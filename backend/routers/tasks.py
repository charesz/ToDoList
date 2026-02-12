from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from models import Task
from database import get_session

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.put("/{task_id}/move")
def move_task(
    task_id: int,
    column_id: int,
    order: int,
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)

    if not task:
        return {"error": "Task not found"}

    # ✅ Get tasks in target column
    tasks_in_column = session.exec(
        select(Task)
        .where(Task.column_id == column_id)
        .order_by(Task.order)
    ).all()

    # ✅ Remove moving task if already inside column
    tasks_in_column = [t for t in tasks_in_column if t.id != task_id]

    # ✅ Insert task at new position
    tasks_in_column.insert(order, task)

    # ✅ Recalculate order cleanly
    for index, t in enumerate(tasks_in_column):
        t.order = index
        t.column_id = column_id
        session.add(t)

    session.commit()

    return {"message": "Task moved successfully"}
