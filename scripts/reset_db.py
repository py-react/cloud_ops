import sqlalchemy as sa
from sqlalchemy import create_engine, MetaData
from sqlalchemy.schema import DropTable
from alembic.config import Config
from alembic import command
import os

# Database URL from alembic.ini or env
DB_URL = "postgresql://postgres:example@localhost:5432/postgres"

def reset_db():
    engine = create_engine(DB_URL)
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    print(f"Dropping {len(metadata.tables)} tables...")
    
    # Drop all tables
    with engine.connect() as conn:
        # For Postgres, we might need to handle dependencies
        for table in reversed(metadata.sorted_tables):
            print(f"Dropping table {table.name}")
            conn.execute(sa.text(f'DROP TABLE IF EXISTS "{table.name}" CASCADE'))
        
        # Also drop alembic_version table if it exists but not in metadata
        conn.execute(sa.text('DROP TABLE IF EXISTS "alembic_version" CASCADE'))
        conn.commit()

    print("Database reset complete. Running migrations...")
    
    # Run alembic upgrade head
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("Migrations complete.")

if __name__ == "__main__":
    reset_db()
