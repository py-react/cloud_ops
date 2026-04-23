"""add custom_rules to kubeconfig_audit

Revision ID: c1a2b3d4e5f6
Revises: 6cd43bafe004
Create Date: 2026-04-15 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'dbfff245918e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add custom_rules column to kubeconfig_audit table."""
    op.add_column(
        'kubeconfig_audit',
        sa.Column('custom_rules', sqlmodel.sql.sqltypes.AutoString(), nullable=True)
    )


def downgrade() -> None:
    """Remove custom_rules column from kubeconfig_audit table."""
    op.drop_column('kubeconfig_audit', 'custom_rules')
