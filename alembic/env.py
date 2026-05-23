from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel
import app.db_client.models

from alembic.autogenerate import renderers
from sqlmodel.sql.sqltypes import AutoString


from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Unique version table name for cloud_ops to avoid collisions in shared DBs
VERSION_TABLE = "alembic_version_cloud_ops"

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table=VERSION_TABLE,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    from app.db_client.db import DATABASE_URL
    from sqlalchemy import create_engine
    
    # Use the centralized DATABASE_URL from our app config
    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )



    # --- SELF-HEALING LOGIC ---
    # If our app's tables aren't present and we aren't in a migration sub-process,
    # automatically upgrade to 'head' to establish a baseline.
    import os
    with connectable.connect() as connection:
        # --- SQLite Batch Monkeypatch ---
        # SQLite doesn't support ALTER TABLE directly for many operations.
        # This shim transparently wraps op calls in a batch context.
        if connection.dialect.name == 'sqlite':
            from alembic.operations import Operations
            
            original_alter = Operations.alter_column
            original_add = Operations.add_column
            original_drop = Operations.drop_column
            
            def patched_alter(self, table_name, *args, **kwargs):
                with self.batch_alter_table(table_name) as batch_op:
                    return original_alter(batch_op, table_name, *args, **kwargs)
            
            def patched_add(self, table_name, *args, **kwargs):
                with self.batch_alter_table(table_name) as batch_op:
                    return original_add(batch_op, table_name, *args, **kwargs)
            
            def patched_drop(self, table_name, *args, **kwargs):
                with self.batch_alter_table(table_name) as batch_op:
                    return original_drop(batch_op, table_name, *args, **kwargs)
            
            Operations.alter_column = patched_alter
            Operations.add_column = patched_add
            Operations.drop_column = patched_drop
        # -------------------------------

        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            version_table=VERSION_TABLE,
            render_as_batch=True
        )


        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
