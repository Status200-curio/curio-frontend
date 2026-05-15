"""add image_url to articles

Revision ID: a1b2c3d4e5f6
Revises: 73565bc07d2f
Create Date: 2026-05-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c816bb69f867'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('articles', sa.Column('image_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('articles', 'image_url')
