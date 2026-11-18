// Institutional Investment & Returns Calculation Engine for GROVIQUE LIVE
// Covers: Stocks, Mutual Funds (SIP / Step-Up / Lumpsum / SWP), Fixed Deposits (FD / RD), Bonds / G-Secs / SGBs, Inflation & Tax Adjustments.

class InvestmentCalculators {
  constructor() {
    this.DEFAULT_INFLATION_RATE = 5.5; // Indian CPI baseline average
    this.LTCG_EQUITY_TAX = 12.5; // Budget 2024 revised LTCG rate
    this.STCG_EQUITY_TAX = 20.0; // Budget 2024 revised STCG rate
    this.LTCG_EXEMPTION_LIMIT = 125000; // ₹1.25 Lakh exemption
  }

  // ========================================================
  // 1. MUTUAL FUNDS & SIP / STEP-UP CALCULATOR
  // ========================================================
  calculateSIP({ monthlyInvestment = 10000, expectedReturnRate = 12.0, durationYears = 10, stepUpPercent = 0, inflationRate = 5.5 }) {
    const r = (expectedReturnRate / 100) / 12; // Monthly return rate
    const totalMonths = durationYears * 12;
    let totalInvested = 0;
    let nominalCorpus = 0;
    let currentMonthly = monthlyInvestment;
    const yearlyBreakdown = [];

    let currentYearInvestment = 0;
    for (let m = 1; m <= totalMonths; m++) {
      totalInvested += currentMonthly;
      currentYearInvestment += currentMonthly;
      nominalCorpus = (nominalCorpus + currentMonthly) * (1 + r);

      // Annual Step-Up at the end of every 12 months
      if (m % 12 === 0) {
        const yearNum = m / 12;
        const inflationFactor = Math.pow(1 + inflationRate / 100, yearNum);
        const realPurchasingPower = nominalCorpus / inflationFactor;

        yearlyBreakdown.push({
          year: yearNum,
          monthlySip: Math.round(currentMonthly),
          totalInvested: Math.round(totalInvested),
          nominalValue: Math.round(nominalCorpus),
          realValue: Math.round(realPurchasingPower),
          wealthGain: Math.round(nominalCorpus - totalInvested)
        });

        if (stepUpPercent > 0) {
          currentMonthly = currentMonthly * (1 + stepUpPercent / 100);
        }
      }
    }

    const estimatedGains = nominalCorpus - totalInvested;
    const inflationAdjustmentFactor = Math.pow(1 + inflationRate / 100, durationYears);
    const inflationAdjustedCorpus = nominalCorpus / inflationAdjustmentFactor;
    const inflationErosion = nominalCorpus - inflationAdjustedCorpus;

    // LTCG Tax Calculation (12.5% on gains exceeding ₹1.25 Lakh)
    const taxableGains = Math.max(0, estimatedGains - this.LTCG_EXEMPTION_LIMIT);
    const estimatedLTCGTax = taxableGains * (this.LTCG_EQUITY_TAX / 100);
    const postTaxCorpus = nominalCorpus - estimatedLTCGTax;

    return {
      totalInvested: Math.round(totalInvested),
      nominalCorpus: Math.round(nominalCorpus),
      estimatedGains: Math.round(estimatedGains),
      gainPercentage: parseFloat(((estimatedGains / totalInvested) * 100).toFixed(1)),
      inflationAdjustedCorpus: Math.round(inflationAdjustedCorpus),
      inflationErosion: Math.round(inflationErosion),
      estimatedLTCGTax: Math.round(estimatedLTCGTax),
      postTaxCorpus: Math.round(postTaxCorpus),
      durationYears,
      yearlyBreakdown
    };
  }

  // ========================================================
  // 2. LUMPSUM COMPOUNDING CALCULATOR
  // ========================================================
  calculateLumpsum({ investmentAmount = 100000, expectedReturnRate = 12.0, durationYears = 10, inflationRate = 5.5 }) {
    const r = expectedReturnRate / 100;
    const nominalCorpus = investmentAmount * Math.pow(1 + r, durationYears);
    const estimatedGains = nominalCorpus - investmentAmount;

    const inflationFactor = Math.pow(1 + inflationRate / 100, durationYears);
    const inflationAdjustedCorpus = nominalCorpus / inflationFactor;

    const taxableGains = Math.max(0, estimatedGains - this.LTCG_EXEMPTION_LIMIT);
    const estimatedLTCGTax = taxableGains * (this.LTCG_EQUITY_TAX / 100);
    const postTaxCorpus = nominalCorpus - estimatedLTCGTax;

    const yearlyBreakdown = [];
    for (let y = 1; y <= durationYears; y++) {
      const val = investmentAmount * Math.pow(1 + r, y);
      const infVal = val / Math.pow(1 + inflationRate / 100, y);
      yearlyBreakdown.push({
        year: y,
        invested: investmentAmount,
        nominalValue: Math.round(val),
        realValue: Math.round(infVal),
        wealthGain: Math.round(val - investmentAmount)
      });
    }

    return {
      totalInvested: Math.round(investmentAmount),
      nominalCorpus: Math.round(nominalCorpus),
      estimatedGains: Math.round(estimatedGains),
      gainPercentage: parseFloat(((estimatedGains / investmentAmount) * 100).toFixed(1)),
      inflationAdjustedCorpus: Math.round(inflationAdjustedCorpus),
      estimatedLTCGTax: Math.round(estimatedLTCGTax),
      postTaxCorpus: Math.round(postTaxCorpus),
      yearlyBreakdown
    };
  }

  // ========================================================
  // 3. SYSTEMATIC WITHDRAWAL PLAN (SWP) CASH FLOW CALCULATOR
  // ========================================================
  calculateSWP({ totalCorpus = 5000000, monthlyWithdrawal = 35000, expectedReturnRate = 9.0, durationYears = 10, inflationRate = 5.5 }) {
    const r = (expectedReturnRate / 100) / 12;
    const totalMonths = durationYears * 12;
    let balance = totalCorpus;
    let totalWithdrawn = 0;
    let depletedMonth = null;
    const yearlyBreakdown = [];

    let currentYearWithdrawn = 0;
    for (let m = 1; m <= totalMonths; m++) {
      if (balance <= 0) {
        if (!depletedMonth) depletedMonth = m;
        balance = 0;
        break;
      }

      // Add monthly compounding interest
      balance = balance * (1 + r);
      const actualWithdrawal = Math.min(balance, monthlyWithdrawal);
      balance -= actualWithdrawal;
      totalWithdrawn += actualWithdrawal;
      currentYearWithdrawn += actualWithdrawal;

      if (m % 12 === 0 || m === totalMonths) {
        const yearNum = Math.ceil(m / 12);
        yearlyBreakdown.push({
          year: yearNum,
          totalWithdrawn: Math.round(totalWithdrawn),
          remainingCorpus: Math.round(balance)
        });
        currentYearWithdrawn = 0;
      }
    }

    return {
      initialCorpus: Math.round(totalCorpus),
      totalWithdrawn: Math.round(totalWithdrawn),
      finalRemainingCorpus: Math.round(balance),
      depleted: balance <= 0,
      depletedMonth,
      depletedYear: depletedMonth ? (depletedMonth / 12).toFixed(1) : null,
      yearlyBreakdown
    };
  }

  // ========================================================
  // 4. STOCKS & EQUITY ALPHA / TARGET RETURN CALCULATOR
  // ========================================================
  calculateStockReturns({ buyPrice = 1000, targetOrCurrentPrice = 1450, quantity = 100, holdingPeriodDays = 450, annualDividendYield = 1.5, customTaxRate = null }) {
    const totalInvestment = buyPrice * quantity;
    const currentOrExitValue = targetOrCurrentPrice * quantity;
    const capitalGain = currentOrExitValue - totalInvestment;
    const holdingPeriodYears = holdingPeriodDays / 365.25;

    // Dividends earned
    const totalDividends = totalInvestment * (annualDividendYield / 100) * holdingPeriodYears;
    const totalGrossProfit = capitalGain + totalDividends;

    // CAGR Calculation
    const absoluteReturnPct = (totalGrossProfit / totalInvestment) * 100;
    const cagr = holdingPeriodYears > 0 ? (Math.pow(currentOrExitValue / totalInvestment, 1 / holdingPeriodYears) - 1) * 100 : absoluteReturnPct;

    // Tax Determination (LTCG > 365 days @ 12.5%, STCG <= 365 days @ 20%)
    let taxRate = customTaxRate !== null ? customTaxRate : (holdingPeriodDays > 365 ? this.LTCG_EQUITY_TAX : this.STCG_EQUITY_TAX);
    let taxableCapitalGain = capitalGain;
    if (holdingPeriodDays > 365 && customTaxRate === null) {
      taxableCapitalGain = Math.max(0, capitalGain - this.LTCG_EXEMPTION_LIMIT);
    }
    const estimatedTax = Math.max(0, taxableCapitalGain * (taxRate / 100));
    const netProfitPostTax = totalGrossProfit - estimatedTax;

    return {
      totalInvestment: Math.round(totalInvestment),
      currentOrExitValue: Math.round(currentOrExitValue),
      capitalGain: Math.round(capitalGain),
      totalDividends: Math.round(totalDividends),
      totalGrossProfit: Math.round(totalGrossProfit),
      absoluteReturnPct: parseFloat(absoluteReturnPct.toFixed(2)),
      cagrPct: parseFloat(cagr.toFixed(2)),
      isLTCG: holdingPeriodDays > 365,
      taxRateApplied: taxRate,
      estimatedTax: Math.round(estimatedTax),
      netProfitPostTax: Math.round(netProfitPostTax)
    };
  }

  // ========================================================
  // 5. FIXED DEPOSIT (FD) & RD COMPOUNDING CALCULATOR
  // ========================================================
  calculateFD({ principal = 100000, interestRate = 7.25, tenureYears = 3, compoundingFrequency = 4, isSeniorCitizen = false, taxBracketPct = 20, inflationRate = 5.5 }) {
    // Senior citizen interest premium (+0.50%)
    const effectiveRate = isSeniorCitizen ? interestRate + 0.50 : interestRate;
    const n = compoundingFrequency; // 4 = Quarterly (standard Indian banks), 1 = Annual, 12 = Monthly
    const t = tenureYears;

    const maturityAmount = principal * Math.pow(1 + (effectiveRate / 100) / n, n * t);
    const totalInterestEarned = maturityAmount - principal;

    // TDS & Tax deduction: FD interest is taxed at investor's slab rate
    const totalTax = totalInterestEarned * (taxBracketPct / 100);
    const postTaxMaturity = maturityAmount - totalTax;
    const postTaxInterest = totalInterestEarned - totalTax;

    // Inflation adjustment on post-tax maturity
    const inflationFactor = Math.pow(1 + inflationRate / 100, t);
    const realPurchasingPower = postTaxMaturity / inflationFactor;
    const realInterestGain = realPurchasingPower - principal;

    return {
      principal: Math.round(principal),
      effectiveRate: parseFloat(effectiveRate.toFixed(2)),
      maturityAmount: Math.round(maturityAmount),
      totalInterestEarned: Math.round(totalInterestEarned),
      taxBracketApplied: taxBracketPct,
      totalTax: Math.round(totalTax),
      postTaxMaturity: Math.round(postTaxMaturity),
      postTaxInterest: Math.round(postTaxInterest),
      realPurchasingPower: Math.round(realPurchasingPower),
      realInterestGain: Math.round(realInterestGain),
      realReturnRate: parseFloat((((realPurchasingPower - principal) / principal) * 100 / t).toFixed(2))
    };
  }

  // ========================================================
  // 6. BONDS, G-SEC & SOVEREIGN GOLD BONDS (SGB) CALCULATOR
  // ========================================================
  calculateBond({ faceValue = 1000, marketPrice = 980, couponRate = 7.75, tenureYears = 5, paymentFrequency = 2, isSGB = false, inflationRate = 5.5 }) {
    // Semi-annual coupon payments standard for Indian G-Secs / Corporate Bonds
    const annualCoupon = faceValue * (couponRate / 100);
    const totalCoupons = annualCoupon * tenureYears;

    // Approximate Yield to Maturity (YTM) Formula:
    // YTM = [Coupon + (Face Value - Price) / Tenure] / [(Face Value + Price) / 2]
    const ytm = ((annualCoupon + (faceValue - marketPrice) / tenureYears) / ((faceValue + marketPrice) / 2)) * 100;
    const totalMaturityCashflow = faceValue + totalCoupons;
    const totalProfit = totalMaturityCashflow - marketPrice;

    // Tax treatment:
    // SGB: 2.5% coupon taxable; capital gains at 8-year maturity are 100% TAX FREE.
    // Regular Bonds: Capital gains & coupons taxed at slab rate (assume 20%).
    let estimatedTax = isSGB ? (totalCoupons * 0.20) : (totalProfit * 0.20);
    const postTaxProfit = totalProfit - estimatedTax;

    // Inflation adjustment
    const inflationFactor = Math.pow(1 + inflationRate / 100, tenureYears);
    const realValue = (marketPrice + postTaxProfit) / inflationFactor;

    return {
      faceValue,
      marketPrice,
      couponRate,
      tenureYears,
      ytmPct: parseFloat(ytm.toFixed(2)),
      annualCoupon: Math.round(annualCoupon),
      totalCoupons: Math.round(totalCoupons),
      totalProfit: Math.round(totalProfit),
      isSGB,
      estimatedTax: Math.round(estimatedTax),
      postTaxProfit: Math.round(postTaxProfit),
      realValue: Math.round(realValue),
      realReturnPct: parseFloat((((realValue - marketPrice) / marketPrice) * 100).toFixed(2))
    };
  }

  // ========================================================
  // 7. INFLATION & REAL PURCHASING POWER CALCULATOR
  // ========================================================
  calculateInflationErosion({ currentExpensesMonthly = 50000, inflationRate = 6.0, yearsInFuture = 15, retirementDurationYears = 25 }) {
    const annualExpensesToday = currentExpensesMonthly * 12;
    const futureMultiplier = Math.pow(1 + inflationRate / 100, yearsInFuture);
    const futureAnnualExpenses = annualExpensesToday * futureMultiplier;
    const futureMonthlyExpenses = futureAnnualExpenses / 12;

    // Required Retirement Corpus assuming real return of 2% in retirement
    // Corpus ~ Future Annual Expense * (1 - (1+r)^-n)/r
    const realRetirementRate = 0.02; // Post-inflation conservative rate
    const requiredCorpus = futureAnnualExpenses * ((1 - Math.pow(1 + realRetirementRate, -retirementDurationYears)) / realRetirementRate);

    // Purchasing power decay of ₹1,00,000 idle cash
    const idleCashToday = 100000;
    const idleCashFutureValue = idleCashToday / futureMultiplier;

    return {
      currentMonthly: Math.round(currentExpensesMonthly),
      futureMonthly: Math.round(futureMonthlyExpenses),
      inflationMultiplier: parseFloat(futureMultiplier.toFixed(2)),
      yearsInFuture,
      requiredCorpus: Math.round(requiredCorpus),
      idleCashErosionPct: parseFloat(((1 - (1 / futureMultiplier)) * 100).toFixed(1)),
      idleCashFutureWorth: Math.round(idleCashFutureValue)
    };
  }

  // ========================================================
  // 8. MULTI-ASSET COMPARISON ENGINE
  // ========================================================
  compareAllAssets({ initialLumpsum = 200000, monthlySIP = 15000, tenureYears = 10, inflationRate = 5.5 }) {
    const equityMF = this.calculateSIP({
      monthlyInvestment: monthlySIP,
      expectedReturnRate: 13.5,
      durationYears: tenureYears,
      inflationRate
    });

    const directStocks = this.calculateSIP({
      monthlyInvestment: monthlySIP,
      expectedReturnRate: 15.0,
      durationYears: tenureYears,
      inflationRate
    });

    const fixedDeposit = this.calculateFD({
      principal: initialLumpsum + (monthlySIP * 12 * tenureYears * 0.6), // equivalent baseline
      interestRate: 7.25,
      tenureYears,
      inflationRate
    });

    const sovereignGoldBond = this.calculateBond({
      faceValue: 6500,
      marketPrice: 6500,
      couponRate: 2.5 + 8.5, // 2.5% sovereign + 8.5% historical gold CAGR
      tenureYears,
      isSGB: true,
      inflationRate
    });

    return [
      {
        asset: "Active Equities / Nifty 50 Alpha",
        category: "EQUITY_STOCKS",
        cagrExpected: "15.0%",
        riskLevel: "Moderate-High",
        nominalCorpus: directStocks.nominalCorpus,
        realCorpus: directStocks.inflationAdjustedCorpus,
        postTaxCorpus: directStocks.postTaxCorpus,
        taxRules: "12.5% LTCG (> ₹1.25L)"
      },
      {
        asset: "Equity Mutual Funds / Index SIP",
        category: "MUTUAL_FUNDS",
        cagrExpected: "13.5%",
        riskLevel: "Moderate",
        nominalCorpus: equityMF.nominalCorpus,
        realCorpus: equityMF.inflationAdjustedCorpus,
        postTaxCorpus: equityMF.postTaxCorpus,
        taxRules: "12.5% LTCG (> ₹1.25L)"
      },
      {
        asset: "Sovereign Gold Bonds (SGB)",
        category: "GOLD_BONDS",
        cagrExpected: "11.0%",
        riskLevel: "Low-Moderate",
        nominalCorpus: Math.round((initialLumpsum + monthlySIP * 12 * tenureYears) * Math.pow(1.11, tenureYears)),
        realCorpus: Math.round(((initialLumpsum + monthlySIP * 12 * tenureYears) * Math.pow(1.11, tenureYears)) / Math.pow(1 + inflationRate / 100, tenureYears)),
        postTaxCorpus: Math.round((initialLumpsum + monthlySIP * 12 * tenureYears) * Math.pow(1.11, tenureYears)), // SGB capital gains tax free
        taxRules: "Tax-Free Capital Gains at 8Y"
      },
      {
        asset: "Bank Fixed Deposits (FD)",
        category: "FIXED_INCOME",
        cagrExpected: "7.25%",
        riskLevel: "Very Low (DICGC Insured)",
        nominalCorpus: fixedDeposit.maturityAmount,
        realCorpus: fixedDeposit.realPurchasingPower,
        postTaxCorpus: fixedDeposit.postTaxMaturity,
        taxRules: "Taxed at Investor Slab (20%)"
      }
    ];
  }
}

window.investmentCalculators = new InvestmentCalculators();
