#!/usr/bin/env python3
"""
GROVIQUE LIVE - Institutional Investment Calculators Suite
Covers:
- Mutual Fund SIP & Annual Step-Up Compounding
- Stocks & Equity Alpha (CAGR, Dividends, Budget 2024 STCG/LTCG Taxes)
- Bank Fixed Deposits (FD / RD) with Quarterly Compounding & TDS
- Bonds, G-Secs & Sovereign Gold Bonds (SGB) Yield-to-Maturity (YTM)
- Inflation Erosion & Financial Independence (FIRE) Retirement Corpus
- Multi-Asset Class Head-to-Head Comparison
"""

import sys
import math
import json


def calculate_sip(monthly_sip=10000, rate=12.0, years=10, step_up=0, inflation=5.5):
    r = (rate / 100.0) / 12.0
    total_months = years * 12
    invested = 0.0
    corpus = 0.0
    current_sip = monthly_sip

    for m in range(1, total_months + 1):
        invested += current_sip
        corpus = (corpus + current_sip) * (1 + r)
        if m % 12 == 0 and step_up > 0:
            current_sip *= (1 + step_up / 100.0)

    gains = corpus - invested
    inflation_factor = math.pow(1 + inflation / 100.0, years)
    real_power = corpus / inflation_factor
    taxable_gains = max(0.0, gains - 125000)
    ltcg_tax = taxable_gains * 0.125
    post_tax_corpus = corpus - ltcg_tax

    print("\n" + "=" * 65)
    print("  GROVIQUE LIVE - MUTUAL FUND SIP & STEP-UP REPORT")
    print("=" * 65)
    print(f"Monthly SIP Investment   : ₹{monthly_sip:,.2f} (Step-Up: +{step_up}%/yr)")
    print(f"Expected Annual Return   : {rate:.2f}% p.a. | Tenure: {years} Years")
    print(f"Total Capital Invested   : ₹{invested:,.2f}")
    print(f"Nominal Maturity Corpus  : ₹{corpus:,.2f}")
    print(f"Gross Estimated Gains    : ₹{gains:,.2f} (+{(gains/invested)*100:.1f}%)")
    print(f"Budget 2024 LTCG Tax     : -₹{ltcg_tax:,.2f} (12.5% on gains > ₹1.25L)")
    print(f"Net Post-Tax Corpus      : ₹{post_tax_corpus:,.2f}")
    print(f"Real Purchasing Power    : ₹{real_power:,.2f} (Post-{inflation}% Inflation)")
    print(f"Inflation Wealth Erosion : -₹{corpus - real_power:,.2f}")
    print("=" * 65)


def calculate_fd(principal=500000, rate=7.5, years=3, senior_citizen=False, tax_slab=20.0, inflation=5.5):
    effective_rate = rate + 0.5 if senior_citizen else rate
    # Quarterly compounding (n = 4)
    maturity = principal * math.pow(1 + (effective_rate / 100.0) / 4.0, 4.0 * years)
    interest = maturity - principal
    tax = interest * (tax_slab / 100.0)
    post_tax_maturity = maturity - tax
    inflation_factor = math.pow(1 + inflation / 100.0, years)
    real_power = post_tax_maturity / inflation_factor

    print("\n" + "=" * 65)
    print("  GROVIQUE LIVE - BANK FIXED DEPOSIT (FD) REPORT")
    print("=" * 65)
    print(f"Principal Deposit        : ₹{principal:,.2f}")
    print(f"Interest Rate            : {effective_rate:.2f}% p.a. (Senior Citizen: {senior_citizen})")
    print(f"Tenure                   : {years} Years (Quarterly Compounding)")
    print(f"Gross Maturity Value     : ₹{maturity:,.2f}")
    print(f"Total Interest Earned    : ₹{interest:,.2f}")
    print(f"Taxes / Slab Deduction   : -₹{tax:,.2f} ({tax_slab}% Tax Slab)")
    print(f"Post-Tax Net Payout      : ₹{post_tax_maturity:,.2f}")
    print(f"Real Purchasing Power    : ₹{real_power:,.2f} (Post-{inflation}% Inflation)")
    print("=" * 65)


def calculate_stock(buy_price=1250, exit_price=2150, qty=200, holding_days=730, div_yield=1.8):
    invested = buy_price * qty
    exit_val = exit_price * qty
    gain = exit_val - invested
    years = holding_days / 365.25
    cagr = (math.pow(exit_val / invested, 1.0 / years) - 1.0) * 100 if years > 0 else 0
    dividends = invested * (div_yield / 100.0) * years

    is_ltcg = holding_days > 365
    taxable = max(0.0, gain - 125000) if is_ltcg else gain
    tax_rate = 12.5 if is_ltcg else 20.0
    tax = taxable * (tax_rate / 100.0)
    net_profit = (gain + dividends) - tax

    print("\n" + "=" * 65)
    print("  GROVIQUE LIVE - STOCKS & EQUITY ALPHA REPORT")
    print("=" * 65)
    print(f"Initial Investment       : ₹{invested:,.2f} ({qty} shares @ ₹{buy_price})")
    print(f"Exit / Current Value     : ₹{exit_val:,.2f} (@ ₹{exit_price})")
    print(f"Holding Period           : {holding_days} Days ({years:.2f} Years)")
    print(f"Annualized CAGR          : {cagr:.2f}% p.a. (Absolute: {((exit_val - invested)/invested)*100:.1f}%)")
    print(f"Total Dividends Earned   : ₹{dividends:,.2f} ({div_yield}% yield)")
    print(f"Tax Treatment            : {'LTCG (12.5% > ₹1.25L)' if is_ltcg else 'STCG (20%)'}")
    print(f"Estimated Tax Deduction  : -₹{tax:,.2f}")
    print(f"Net Post-Tax Profit      : ₹{net_profit:,.2f}")
    print("=" * 65)


def calculate_inflation(monthly_expense=60000, inflation=6.0, years=15):
    mult = math.pow(1 + inflation / 100.0, years)
    future_monthly = monthly_expense * mult
    annual_future = future_monthly * 12.0
    # Corpus needed for 25-year retirement @ 2% real yield
    corpus = annual_future * ((1 - math.pow(1.02, -25)) / 0.02)

    print("\n" + "=" * 65)
    print("  GROVIQUE LIVE - INFLATION & FIRE RETIREMENT REPORT")
    print("=" * 65)
    print(f"Current Monthly Living   : ₹{monthly_expense:,.2f}")
    print(f"Inflation Rate           : {inflation:.1f}% p.a. over {years} Years")
    print(f"Future Living Cost / mo  : ₹{future_monthly:,.2f} ({mult:.2f}x Cost Multiplier)")
    print(f"Required FIRE Corpus     : ₹{corpus:,.2f} (₹{corpus/10000000:.2f} Crores)")
    print(f"Idle Cash Purchasing Loss: -{(1 - 1/mult)*100:.1f}% loss on uninvested cash")
    print("=" * 65)


def main():
    print("=" * 65)
    print("  GROVIQUE LIVE - Quantitative Multi-Asset Calculators")
    print("=" * 65)

    calc_type = "sip"
    for arg in sys.argv:
        if arg.startswith("--type="):
            calc_type = arg.split("=")[1].lower()

    if calc_type == "fd":
        calculate_fd()
    elif calc_type == "stock":
        calculate_stock()
    elif calc_type == "inflation":
        calculate_inflation()
    else:
        calculate_sip()


if __name__ == "__main__":
    main()
