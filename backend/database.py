import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://inventory_db_mbsy_user:XAGIdO0fkffsxIKk2BNqIgyRi9ucWIfG@dpg-d8ggd4gjo6nc73eguos0-a.oregon-postgres.render.com/inventory_db_mbsy")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
