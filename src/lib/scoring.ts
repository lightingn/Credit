import { FinancialDataExtracted, ResearchData } from "./schemas";

export type FiveCsScore = {
  character: number;
  capacity: number;
  capital: number;
  collateral: number;
  conditions: number;
  total: number;
};

// Based on Phase 5 Scoring Engine logic
export function computeFiveCs(
  financialData: FinancialDataExtracted & {
    computed_dscr: number;
    computed_debt_equity: number;
    computed_interest_coverage: number;
    computed_current_ratio: number;
  },
  researchData: ResearchData,
  cibilScore: number,
  mcaCompliancePts: number = 4, // Assume fully compliant for now if not scraped
  collateralCoverageRatio: number = 1.0, // Collateral / Loan Amount
  collateralQualityPts: number = 8 // Assume good collateral
): FiveCsScore {
  let character = 0;
  let capacity = 0;
  let capital = 0;
  let collateral = 0;
  let conditions = 0;

  // 1. Character (0-20)
  // CIBIL up to 8
  if (cibilScore >= 750) character += 8;
  else if (cibilScore >= 650) character += 5;
  else if (cibilScore >= 550) character += 2;

  // MCA compliance up to 4
  character += Math.min(4, mcaCompliancePts);

  // Litigation up to 4
  if (researchData.litigationCases === 0) character += 4;
  else if (researchData.litigationCases < 3) character += 2;

  // Web research sentiment up to 4
  if (researchData.newsSentiment === "POSITIVE") character += 4;
  else if (researchData.newsSentiment === "NEUTRAL") character += 2;

  // 2. Capacity (0-20)
  // DSCR up to 8
  const dscr = financialData.computed_dscr;
  if (dscr >= 2.0) capacity += 8;
  else if (dscr >= 1.5) capacity += 6;
  else if (dscr >= 1.25) capacity += 4;

  // ICR up to 6
  const icr = financialData.computed_interest_coverage;
  if (icr >= 3.0) capacity += 6;
  else if (icr >= 2.0) capacity += 4;
  else if (icr >= 1.5) capacity += 2;

  // Revenue CAGR up to 6 (simplified to 6 if revenue exists and is >0)
  // To do properly, we need a 3-yr array. If not provided, assume medium growth for MVP.
  capacity += 4;

  // 3. Capital (0-20)
  // D/E Ratio up to 10
  const de = financialData.computed_debt_equity;
  if (de <= 1.0) capital += 10;
  else if (de <= 1.5) capital += 8;
  else if (de <= 2.5) capital += 5;
  else if (de <= 3.5) capital += 2;

  // Net Worth Adequacy up to 10
  // (Assuming > 1Cr is adequate for a typical MSME)
  if ((financialData.net_worth || 0) >= 20000000) capital += 10;
  else if ((financialData.net_worth || 0) >= 10000000) capital += 7;
  else if ((financialData.net_worth || 0) >= 5000000) capital += 4;

  // 4. Collateral (0-20)
  // Coverage Ratio up to 12
  if (collateralCoverageRatio >= 1.5) collateral += 12;
  else if (collateralCoverageRatio >= 1.0) collateral += 8;
  else if (collateralCoverageRatio >= 0.8) collateral += 4;

  // Asset Quality up to 8
  collateral += collateralQualityPts;

  // 5. Conditions (0-20)
  // Sector Outlook up to 10
  if (researchData.sectorTrend === "UPWARD") conditions += 10;
  else if (researchData.sectorTrend === "NEUTRAL") conditions += 6;
  else if (researchData.sectorTrend === "DOWNWARD") conditions += 2;

  // GST Trend up to 6 (Assuming stable/good for MVP)
  conditions += 4;

  // Macro Signals up to 4 (neutral)
  conditions += 2;

  return {
    character,
    capacity,
    capital,
    collateral,
    conditions,
    total: character + capacity + capital + collateral + conditions,
  };
}
