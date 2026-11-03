"""Commercial listing catalog. Pricing is server-owned; clients only display it."""

import calendar
from datetime import datetime
from typing import Literal

CustomerType = Literal[
    "apartment_community",
    "military_homeowner",
    "civilian_homeowner",
    "property_management_company",
    "real_estate_company",
]


PRODUCTS: dict[str, dict] = {
    "apartment_community": {
        "label": "Apartment community",
        "monthly_per_property": 25000,
        "initial_term_months": 6,
        "initial_amount_per_property": 150000,
        "annual_renewal_per_property": 300000,
    },
    "military_homeowner": {
        "label": "Military homeowner",
        "monthly_per_property": 2500,
        "initial_term_months": 6,
        "initial_amount_per_property": 15000,
        "annual_renewal_per_property": 30000,
    },
    "civilian_homeowner": {
        "label": "Civilian homeowner",
        "monthly_per_property": 5000,
        "initial_term_months": 6,
        "initial_amount_per_property": 30000,
        "annual_renewal_per_property": 60000,
    },
    "property_management_company": {
        "label": "Property management company",
        "monthly_per_property": 1100,
        "initial_term_months": 6,
        "initial_amount_per_property": 6600,
        "annual_renewal_per_property": 13200,
    },
    "real_estate_company": {
        "label": "Real estate company",
        "monthly_per_property": None,
        "initial_term_months": None,
        "initial_amount_per_property": None,
        "annual_renewal_per_property": None,
    },
}


INITIAL_TERM_MONTHS = 6
RENEWAL_TERM_MONTHS = 12


def add_months(start: datetime, months: int) -> datetime:
    """Same day-of-month `months` later, clamped to the last day of a shorter month."""
    y, m = divmod(start.month - 1 + months, 12)
    year, month = start.year + y, m + 1
    return start.replace(year=year, month=month, day=min(start.day, calendar.monthrange(year, month)[1]))


def quote(customer_type: CustomerType, property_count: int) -> dict:
    product = PRODUCTS[customer_type]
    if customer_type == "real_estate_company":
        return {
            "customer_type": customer_type,
            "property_count": property_count,
            "currency": "usd",
            "status": "pricing_required",
            "message": "Geographic advertising is priced by selected market. Contact the PCS.army team for a written quote.",
        }
    return {
        "customer_type": customer_type,
        "property_count": property_count,
        "currency": "usd",
        "status": "ready_for_payment_setup",
        "initial_term_months": product["initial_term_months"],
        "initial_amount_cents": product["initial_amount_per_property"] * property_count,
        "annual_renewal_cents": product["annual_renewal_per_property"] * property_count,
        "message": "Six months are charged at checkout; the annual renewal is charged automatically when they end.",
    }
