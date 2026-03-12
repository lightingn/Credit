import { FinancialDataExtracted, ResearchData } from "./schemas";

export const riskThresholds = {
  minDSCR: 1.25,
  maxDebtEquity: 2.5,
  minCurrentRatio: 1.2,
  minInterestCoverage: 1.5,
};

export function generateRiskSignals(
  financialData: FinancialDataExtracted & {
    computed_dscr: number;
    computed_debt_equity: number;
    computed_interest_coverage: number;
    computed_current_ratio: number;
  },
  researchData: ResearchData
): string[] {
  const signals: string[] = [];

  // Financial Signals
  if (financialData.computed_dscr < riskThresholds.minDSCR) {
    signals.push(`DSCR is critically low: ${financialData.computed_dscr} (Target: >${riskThresholds.minDSCR})`);
  }
  if (financialData.computed_debt_equity > riskThresholds.maxDebtEquity) {
    signals.push(`Leverage is too high. D/E Ratio: ${financialData.computed_debt_equity} (Target: <${riskThresholds.maxDebtEquity})`);
  }
  if (financialData.computed_current_ratio < riskThresholds.minCurrentRatio) {
    signals.push(`Weak liquidity. Current Ratio: ${financialData.computed_current_ratio} (Target: >${riskThresholds.minCurrentRatio})`);
  }
  
  // Research Signals
  if (researchData.promoterRisk === "HIGH") {
    signals.push("Promoter risk identified (Check litigation records or defaults).");
  }
  if (researchData.litigationCases > 0) {
    signals.push(`Warning: ${researchData.litigationCases} pending litigations found.`);
  }
  if (researchData.sectorTrend === "DOWNWARD") {
    signals.push("Sector trend is downward, adjust future revenue projects.");
  }
  if (researchData.newsSentiment === "NEGATIVE") {
    signals.push("Negative news sentiment detected associated with the borrowing entity.");
  }

  // Add more GST or specific rule-based triggers as needed.

  return signals;
}
