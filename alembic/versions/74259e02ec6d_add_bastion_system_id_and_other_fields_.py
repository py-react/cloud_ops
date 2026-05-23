"""add_bastion_system_id_to_compute_instances

Revision ID: 74259e02ec6d
Revises: b2c3d4e5f6a7
Create Date: 2026-05-21 22:55:45.559395

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74259e02ec6d'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.add_column(sa.Column('bastion_system_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.drop_column('bastion_system_id')
