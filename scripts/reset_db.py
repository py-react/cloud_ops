from sqlalchemy import create_engine, MetaData, inspect, text
from alembic.config import Config
from alembic import command
import os
import sys

# This should match VERSION_TABLE in alembic/env.py
VERSION_TABLE = "alembic_version_cloud_ops"

def get_db_url():
    """Get database URL from app.db_client.db."""
    import sys
    import os
    sys.path.append(os.getcwd())
    from app.db_client.db import DATABASE_URL
    return DATABASE_URL



def reset_db():
    db_url = get_db_url()
    print(f"🔗 Connecting to {db_url}...")
    
    try:
        engine = create_engine(db_url)
        
        # We only want to drop OUR tables to be safe in a shared DB
        # To do this, we'll import our metadata
        sys.path.append(os.getcwd())
        from sqlmodel import SQLModel
        import app.db_client.models # Load models to fill SQLModel.metadata
        
        our_tables = SQLModel.metadata.tables.keys()
        
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        tables_to_drop = [t for t in existing_tables if t in our_tables or t == VERSION_TABLE]
        
        if not tables_to_drop:
            print("✨ No app tables found to drop.")
        else:
            print(f"🗑️  Dropping {len(tables_to_drop)} app-specific tables...")
            with engine.connect() as conn:
                for table in tables_to_drop:
                    print(f"   - Dropping {table}")
                    # SQLite does not support CASCADE
                    cascade = "CASCADE" if not db_url.startswith("sqlite") else ""
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}" {cascade}'))
                conn.commit()


        print("🚀 Rebuilding database schema...")
        from app.db_client.db import create_db_and_tables
        create_db_and_tables()
        print("✅ Database successfully reset.")

    except Exception as e:
        print(f"❌ Error during reset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_db()
