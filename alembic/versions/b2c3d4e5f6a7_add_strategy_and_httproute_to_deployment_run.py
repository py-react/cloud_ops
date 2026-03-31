"""add_strategy_and_httproute_to_deployment_run

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-10 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('deploymentrun', sa.Column('deployment_strategy_id', sa.INTEGER(), nullable=True))
    op.add_column('deploymentrun', sa.Column('http_route_id', sa.INTEGER(), nullable=True))
    op.add_column('deploymentrun', sa.Column('apply_derived_httproute', sa.BOOLEAN(), nullable=True))
    # Note: apply_derived_service is kept as JSONB to avoid migration issues with existing data


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('deploymentrun', 'apply_derived_httproute')
    op.drop_column('deploymentrun', 'http_route_id')
    op.drop_column('deploymentrun', 'deployment_strategy_id')
