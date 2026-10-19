"""Estimate illustrative video infrastructure costs, not a supplier quotation."""

import argparse
from decimal import Decimal, InvalidOperation, ROUND_CEILING, ROUND_HALF_UP
import json


def nonnegative(text):
    try:
        value = Decimal(text)
    except InvalidOperation as error:
        raise argparse.ArgumentTypeError("Expected a number") from error
    if not value.is_finite() or value < 0:
        raise argparse.ArgumentTypeError("Expected a finite non-negative number")
    return value


def money(value):
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plays", type=nonnegative, default=Decimal(1000))
    parser.add_argument("--minutes", type=nonnegative, default=Decimal(10), help="Delivered minutes per play")
    parser.add_argument("--mbps", type=nonnegative, default=Decimal(3), help="Average video + audio bitrate")
    parser.add_argument("--storage-gb", type=nonnegative, default=Decimal(20), help="Encoded storage footprint")
    parser.add_argument("--catalog-minutes", type=nonnegative, default=Decimal(200))
    parser.add_argument("--overhead", type=nonnegative, default=Decimal(1), help="Additional transfer multiplier")
    args = parser.parse_args()
    if args.plays != args.plays.to_integral_value():
        parser.error("--plays must be an integer")
    if args.overhead < 1:
        parser.error("--overhead must be at least 1")
    delivered = args.plays * args.minutes * args.overhead
    traffic = delivered * 60 * args.mbps / 8 / 1000
    storage = args.storage_gb * Decimal("0.01")
    bunny_rates = {"volume_first_500_TB": "0.005", "standard_europe_north_america": "0.01",
                   "standard_asia_oceania": "0.03", "standard_south_america": "0.045",
                   "standard_middle_east_africa": "0.06"}
    bunny = {name: money(max(Decimal(1), storage + traffic * Decimal(rate)))
             for name, rate in bunny_rates.items()}
    if traffic > 500_000:
        bunny["volume_first_500_TB"] = None
    cf_storage = (args.catalog_minutes / 1000).to_integral_value(rounding=ROUND_CEILING) * 5
    result = {
        "pricing_reference_date": "2026-10-16",
        "assumptions": {key: str(value) for key, value in vars(args).items()},
        "decimal_GB": str(traffic), "delivered_minutes": str(delivered),
        "bunny_stream_USD_per_month": bunny,
        "cloudflare_stream_USD_per_month": money(cf_storage + delivered / 1000),
        "excluded": ["content licensing and revenue share", "site/API/database/domain", "tax and payment fees",
                     "cross-cloud transfers", "premium encoding/transcription/DRM", "storage replication",
                     "marketing and labor", "provider billing granularity and unmodeled transfer"],
        "notes": ["Each scenario puts all traffic in one listed region/tier; not a blended global price.",
                  "Bunny storage assumes one default region, actual encoded footprint, and an active account.",
                  "Volume estimates above 500 TB are omitted; consult the appropriate pricing tier.",
                  "Cloudflare uses uploaded-content pricing with storage capacity rounded to 1000-minute blocks.",
                  "Rates and eligibility must be rechecked before purchase. This is not a total business budget."],
        "sources": ["https://bunny.net/docs/stream/pricing", "https://developers.cloudflare.com/stream/pricing/"]
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
