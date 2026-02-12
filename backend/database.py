from sqlmodel import SQLModel, create_engine, Session
from sqlmodel import select
from models import Column, Board

DATABASE_URL = "sqlite:///./todolist.db"
engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:

        board = session.exec(select(Board)).first()
        if not board:
            board = Board(name="Main Board")
            session.add(board)
            session.commit()
            session.refresh(board)

        existing_columns = session.exec(select(Column)).all()

        if not existing_columns:
            session.add(Column(name="Todo", board_id=board.id))
            session.add(Column(name="Doing", board_id=board.id))
            session.add(Column(name="Done", board_id=board.id))
            session.commit()




def get_session():
    with Session(engine) as session:
        yield session
