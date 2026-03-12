import { FiveCsScore } from "./scoring";

export function generateDecisionExplanation(
  score: FiveCsScore,
  signals: string[]
): string {
  let explanation = "";

  if (score.total >= 80) {
    explanation += "Loan Approved with Low Risk\n\n";
  } else if (score.total >= 60) {
    explanation += "Loan Approved with Moderate Risk\n\n";
  } else if (score.total >= 40) {
    explanation += "Conditional Approval - High Scrutiny Required\n\n";
  } else {
    explanation += "Loan Rejected\n\n";
  }

  explanation += "Reasons:\n";

  // Add 5Cs breakdown strengths
  if (score.capacity >= 14) explanation += "+ Strong capacity to repay (High DSCR/ICR)\n";
  if (score.capital >= 14) explanation += "+ Excellent capital adequacy (Low leverage/High Net Worth)\n";
  if (score.character >= 14) explanation += "+ Good character and clean credit history\n";
  if (score.collateral >= 14) explanation += "+ Strong collateral coverage\n";
  if (score.conditions >= 14) explanation += "+ Favorable macroeconomic and sector conditions\n";

  // Add signals as weaknesses/flags
  if (signals.length > 0) {
    signals.forEach(signal => {
      explanation += `- ${signal}\n`;
    });
  } else {
    explanation += "+ No major risk signals detected.\n";
  }

  return explanation;
}
