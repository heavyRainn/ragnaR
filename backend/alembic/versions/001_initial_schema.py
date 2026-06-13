"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cmc_id", sa.Integer(), nullable=True),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("symbol"),
    )
    op.create_table(
        "market_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column("volume_24h", sa.Numeric(precision=24, scale=2), nullable=False),
        sa.Column("market_cap", sa.Numeric(precision=24, scale=2), nullable=True),
        sa.Column("percent_change_1h", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("percent_change_24h", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("percent_change_7d", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("cmc_rank", sa.Integer(), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_market_snapshots_asset_id"), "market_snapshots", ["asset_id"], unique=False)
    op.create_index(op.f("ix_market_snapshots_captured_at"), "market_snapshots", ["captured_at"], unique=False)
    op.create_table(
        "signals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("signal_type", sa.String(length=50), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reason_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metric_snapshot_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_signals_asset_id"), "signals", ["asset_id"], unique=False)
    op.create_index(op.f("ix_signals_created_at"), "signals", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_signals_created_at"), table_name="signals")
    op.drop_index(op.f("ix_signals_asset_id"), table_name="signals")
    op.drop_table("signals")
    op.drop_index(op.f("ix_market_snapshots_captured_at"), table_name="market_snapshots")
    op.drop_index(op.f("ix_market_snapshots_asset_id"), table_name="market_snapshots")
    op.drop_table("market_snapshots")
    op.drop_table("assets")
