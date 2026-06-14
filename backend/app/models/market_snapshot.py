from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)
    volume_24h: Mapped[Decimal] = mapped_column(Numeric(24, 2), nullable=False)
    volume_1m: Mapped[Decimal | None] = mapped_column(Numeric(24, 2), nullable=True)
    volume_source: Mapped[str | None] = mapped_column(String(16), nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(24, 2), nullable=True)
    percent_change_1h: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    percent_change_24h: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    percent_change_7d: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    cmc_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    asset: Mapped["Asset"] = relationship("Asset", back_populates="snapshots")


from app.models.asset import Asset  # noqa: E402
