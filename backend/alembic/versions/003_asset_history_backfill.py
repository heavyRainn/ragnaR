"""asset history backfill flags

Revision ID: 003
Revises: 002
Create Date: 2026-06-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "assets",
        sa.Column("history_backfill_attempted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "assets",
        sa.Column("history_backfilled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("assets", "history_backfilled")
    op.drop_column("assets", "history_backfill_attempted")
