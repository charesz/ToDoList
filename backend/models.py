from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


# -------------------- USER MODEL --------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password: str  

    # Optional: link to tasks (frontend doesn't assign tasks yet)
    tasks: List["Task"] = Relationship(back_populates="assigned_user")


# -------------------- BOARD MODEL --------------------
class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    columns: List["Column"] = Relationship(back_populates="board")


# -------------------- COLUMN MODEL --------------------
class Column(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # e.g., "Todo", "Doing", "Done"
    order: int = 0  # Column order in the board

    board_id: int = Field(foreign_key="board.id")
    board: Optional[Board] = Relationship(back_populates="columns")

    tasks: List["Task"] = Relationship(back_populates="column")


# -------------------- TASK MODEL --------------------
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    tag: Optional[str] = None  
    order: int = 0  # Position of task in column

    column_id: int = Field(foreign_key="column.id")
    column: Optional[Column] = Relationship(back_populates="tasks")

    assigned_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_user: Optional[User] = Relationship(back_populates="tasks")

