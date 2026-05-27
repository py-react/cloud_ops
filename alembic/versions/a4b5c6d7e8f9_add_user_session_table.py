"""Add user_session table for DB-backed sessions

Revision ID: a4b5c6d7e8f9
Revises: 9b6f01defc76
Create Date: 2026-05-23 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a4b5c6d7e8f9'
down_revision: Union[str, Sequence[str], None] = '9b6f01defc76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_session',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=True),
    sa.Column('token_hash', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('last_accessed_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('user_session', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_session_token_hash'), ['token_hash'], unique=True)
        batch_op.create_index(batch_op.f('ix_user_session_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('user_session', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_session_user_id'))
        batch_op.drop_index(batch_op.f('ix_user_session_token_hash'))
    op.drop_table('user_session')
