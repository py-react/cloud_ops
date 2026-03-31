"""add_strategy_and_httproute_to_deployment_config

Revision ID: a1b2c3d4e5f6
Revises: 3ba269e92921
Create Date: 2026-03-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3ba269e92921'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('deploymentconfig', sa.Column('deployment_strategy_id', sa.INTEGER(), nullable=True))
    op.add_column('deploymentconfig', sa.Column('http_route_id', sa.INTEGER(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('deploymentconfig', 'http_route_id')
    op.drop_column('deploymentconfig', 'deployment_strategy_id')
