"""initial

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-06-18 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('provider', sa.String(), server_default='local', nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('review_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending', nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create review_logs table
    op.create_table(
        'review_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_used', sa.String(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=False),
        sa.Column('execution_time', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['review_id'], ['reviews.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_review_logs_id'), 'review_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_review_logs_id'), table_name='review_logs')
    op.drop_table('review_logs')
    op.drop_table('reviews')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
