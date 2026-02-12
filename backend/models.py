from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    columns: List["Column"] = Relationship(back_populates="board")


class Column(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    order: int = 0

    board_id: int = Field(foreign_key="board.id")
    board: Optional[Board] = Relationship(back_populates="columns")

    tasks: List["Task"] = Relationship(back_populates="column")


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    order: int = 0

    column_id: int = Field(foreign_key="column.id")
    column: Optional[Column] = Relationship(back_populates="tasks")
