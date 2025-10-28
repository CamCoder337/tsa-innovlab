#!/usr/bin/env python3
"""
Cron job to calculate and store recommendation statistics
Run this script periodically (e.g., hourly, daily) to aggregate feedback data

Usage:
    python calculate_recommendation_stats.py [--period daily|weekly|monthly]
"""

import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
import argparse

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def calculate_stats(period_type: str = "daily"):
    """
    Calculate and store recommendation statistics for a given period

    Args:
        period_type: One of 'hourly', 'daily', 'weekly', 'monthly'
    """
    db = SessionLocal()

    try:
        # Determine period date based on type
        now = datetime.utcnow()

        if period_type == "hourly":
            period_date = now.replace(minute=0, second=0, microsecond=0)
            start_time = period_date
            end_time = period_date + timedelta(hours=1)
        elif period_type == "daily":
            period_date = now.date()
            start_time = datetime.combine(period_date, datetime.min.time())
            end_time = start_time + timedelta(days=1)
        elif period_type == "weekly":
            # Start of week (Monday)
            days_since_monday = now.weekday()
            period_date = (now - timedelta(days=days_since_monday)).date()
            start_time = datetime.combine(period_date, datetime.min.time())
            end_time = start_time + timedelta(days=7)
        elif period_type == "monthly":
            period_date = now.replace(day=1).date()
            start_time = datetime.combine(period_date, datetime.min.time())
            # Next month
            if now.month == 12:
                end_time = datetime(now.year + 1, 1, 1)
            else:
                end_time = datetime(now.year, now.month + 1, 1)
        else:
            raise ValueError(f"Invalid period_type: {period_type}")

        logger.info(f"Calculating {period_type} stats for period: {period_date}")

        # Calculate stats for each strategy
        strategies = ['collaborative_filtering', 'content_based', 'popularity', 'content_similarity']

        for strategy in strategies:
            logger.info(f"Processing strategy: {strategy}")

            # Get stats from feedback table
            stats_query = text("""
                SELECT
                    COUNT(DISTINCT user_id) as total_users,
                    COUNT(*) as total_recommendations,
                    SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as total_views,
                    SUM(CASE WHEN action = 'click' THEN 1 ELSE 0 END) as total_clicks,
                    SUM(CASE WHEN action = 'add_to_cart' THEN 1 ELSE 0 END) as total_add_to_cart,
                    SUM(CASE WHEN action = 'purchase' THEN 1 ELSE 0 END) as total_purchases,
                    AVG(recommendation_score) as avg_score
                FROM product_recommendation_feedbacks
                WHERE strategy_used = :strategy
                AND created_at >= :start_time
                AND created_at < :end_time
            """)

            result = db.execute(stats_query, {
                "strategy": strategy,
                "start_time": start_time,
                "end_time": end_time
            }).fetchone()

            if result and result[1] > 0:  # If we have data
                total_users = int(result[0])
                total_recommendations = int(result[1])
                total_views = int(result[2])
                total_clicks = int(result[3])
                total_add_to_cart = int(result[4])
                total_purchases = int(result[5])
                avg_score = float(result[6]) if result[6] else None

                # Calculate rates in basis points (1 bps = 0.01%)
                ctr_bps = int((total_clicks / total_views * 10000)) if total_views > 0 else 0
                conversion_rate_bps = int((total_purchases / total_clicks * 10000)) if total_clicks > 0 else 0
                add_to_cart_rate_bps = int((total_add_to_cart / total_clicks * 10000)) if total_clicks > 0 else 0

                # Insert or update stats
                upsert_query = text("""
                    INSERT INTO product_recommendation_stats
                    (strategy, period_type, period_date, total_recommendations, total_users,
                     total_views, total_clicks, total_add_to_cart, total_purchases,
                     ctr_bps, conversion_rate_bps, add_to_cart_rate_bps, avg_score,
                     created_at, updated_at)
                    VALUES
                    (:strategy, :period_type, :period_date, :total_recommendations, :total_users,
                     :total_views, :total_clicks, :total_add_to_cart, :total_purchases,
                     :ctr_bps, :conversion_rate_bps, :add_to_cart_rate_bps, :avg_score,
                     NOW(), NOW())
                    ON CONFLICT (strategy, period_type, period_date)
                    DO UPDATE SET
                        total_recommendations = EXCLUDED.total_recommendations,
                        total_users = EXCLUDED.total_users,
                        total_views = EXCLUDED.total_views,
                        total_clicks = EXCLUDED.total_clicks,
                        total_add_to_cart = EXCLUDED.total_add_to_cart,
                        total_purchases = EXCLUDED.total_purchases,
                        ctr_bps = EXCLUDED.ctr_bps,
                        conversion_rate_bps = EXCLUDED.conversion_rate_bps,
                        add_to_cart_rate_bps = EXCLUDED.add_to_cart_rate_bps,
                        avg_score = EXCLUDED.avg_score,
                        updated_at = NOW()
                """)

                db.execute(upsert_query, {
                    "strategy": strategy,
                    "period_type": period_type,
                    "period_date": period_date,
                    "total_recommendations": total_recommendations,
                    "total_users": total_users,
                    "total_views": total_views,
                    "total_clicks": total_clicks,
                    "total_add_to_cart": total_add_to_cart,
                    "total_purchases": total_purchases,
                    "ctr_bps": ctr_bps,
                    "conversion_rate_bps": conversion_rate_bps,
                    "add_to_cart_rate_bps": add_to_cart_rate_bps,
                    "avg_score": avg_score
                })

                logger.info(f"  ✓ {strategy}: {total_recommendations} recs, CTR: {ctr_bps/100:.2f}%, Conv: {conversion_rate_bps/100:.2f}%")
            else:
                logger.info(f"  ⚠ {strategy}: No data for this period")

        db.commit()
        logger.info(f"✓ Successfully calculated {period_type} stats for {period_date}")

    except Exception as e:
        logger.error(f"Failed to calculate stats: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Calculate recommendation statistics")
    parser.add_argument(
        "--period",
        choices=["hourly", "daily", "weekly", "monthly"],
        default="daily",
        help="Period type for statistics calculation (default: daily)"
    )
    args = parser.parse_args()

    logger.info(f"Starting recommendation stats calculation - period: {args.period}")
    calculate_stats(args.period)
    logger.info("Stats calculation completed successfully")


if __name__ == "__main__":
    main()
