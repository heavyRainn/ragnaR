"""snapshot volume_1m and volume_source

Revision ID: 004
Revises: 003
Create Date: 2026-06-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "market_snapshots",
        sa.Column("volume_1m", sa.Numeric(24, 2), nullable=True),
    )
    op.add_column(
        "market_snapshots",
        sa.Column("volume_source", sa.String(length=16), nullable=True),
    )

    # Legacy Bybit backfill rows stored 1m turnover in volume_24h with no market_cap.
    op.execute(
        """
        UPDATE market_snapshots
        SET volume_1m = volume_24h,
            volume_source = 'bybit_1m',
            volume_24h = 0
        WHERE market_cap IS NULL
          AND volume_24h > 0
          AND volume_1m IS NULL
        """
    )

    op.execute(
        """
        UPDATE market_snapshots
        SET volume_source = 'cmc_24h'
        WHERE volume_source IS NULL
          AND market_cap IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("market_snapshots", "volume_source")
    op.drop_column("market_snapshots", "volume_1m")
