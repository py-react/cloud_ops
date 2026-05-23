"""add_connection_port_to_system

Revision ID: 19e451ce08bd
Revises: 74259e02ec6d
Create Date: 2026-05-21 23:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19e451ce08bd'
down_revision: Union[str, Sequence[str], None] = '74259e02ec6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('system', schema=None) as batch_op:
        batch_op.add_column(sa.Column('connection_port', sa.Integer(), nullable=False, server_default='22'))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('system', schema=None) as batch_op:
        batch_op.drop_column('connection_port')
