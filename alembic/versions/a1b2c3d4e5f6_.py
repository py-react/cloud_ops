"""add ssh_username to compute_instances

Revision ID: a1b2c3d4e5f6
Revises: c4e7a93684ee
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c4e7a93684ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ssh_username', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.drop_column('ssh_username')
