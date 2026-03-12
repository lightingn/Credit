import { FinancialDataExtracted } from "./schemas";

export function calculateDSCR(data: FinancialDataExtracted): number {
  const ebitda = data.ebitda || (data.net_profit || 0) + (data.interest_expense || 0); // approximation if ebitda missing
  const debtService = (data.principal_payment || 0) + (data.interest_expense || 0);

  if (debtService === 0) return 999; // no debt or no debt service required
  return parseFloat((ebitda / debtService).toFixed(2));
}

export function calculateDebtEquity(data: FinancialDataExtracted): number {
  if (!data.total_debt || !data.net_worth || data.net_worth <= 0) return 999; // high risk/undefined
  return parseFloat((data.total_debt / data.net_worth).toFixed(2));
}

export function calculateInterestCoverage(data: FinancialDataExtracted): number {
  const ebit = (data.ebitda || data.net_profit || 0);
  if (!data.interest_expense || data.interest_expense === 0) return 999;
  return parseFloat((ebit / data.interest_expense).toFixed(2));
}

export function calculateCurrentRatio(data: FinancialDataExtracted): number {
  if (!data.current_assets || !data.current_liabilities || data.current_liabilities === 0) return 0;
  return parseFloat((data.current_assets / data.current_liabilities).toFixed(2));
}

export function enrichFinancialMetrics(data: FinancialDataExtracted): FinancialDataExtracted & {
  computed_dscr: number;
  computed_debt_equity: number;
  computed_interest_coverage: number;
  computed_current_ratio: number;
} {
  return {
    ...data,
    computed_dscr: calculateDSCR(data),
    computed_debt_equity: calculateDebtEquity(data),
    computed_interest_coverage: calculateInterestCoverage(data),
    computed_current_ratio: calculateCurrentRatio(data),
  };
}
