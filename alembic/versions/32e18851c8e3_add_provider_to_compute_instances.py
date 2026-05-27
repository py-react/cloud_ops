"""add_provider_to_compute_instances

Revision ID: 32e18851c8e3
Revises: 22697aa41565
Create Date: 2026-05-26 12:58:16.901304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '32e18851c8e3'
down_revision: Union[str, Sequence[str], None] = '22697aa41565'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.add_column(sa.Column('provider', sa.String(), nullable=False, server_default='gcp'))
        batch_op.create_index(batch_op.f('ix_compute_instances_provider'), ['provider'], unique=False)
        batch_op.alter_column('gcp_resource_id', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('compute_instances', schema=None) as batch_op:
        batch_op.alter_column('gcp_resource_id', existing_type=sa.String(), nullable=False)
        batch_op.drop_index(batch_op.f('ix_compute_instances_provider'))
        batch_op.drop_column('provider')
