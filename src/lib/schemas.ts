import { z } from "zod";

export const FinancialSchema = z.object({
  revenue: z.number().optional(),
  net_profit: z.number().optional(),
  total_debt: z.number().optional(),
  ebitda: z.number().optional(),
  dscr: z.number().optional(),
  current_assets: z.number().optional(),
  current_liabilities: z.number().optional(),
  net_worth: z.number().optional(),
  interest_expense: z.number().optional(),
  principal_payment: z.number().optional(),
});
export type FinancialDataExtracted = z.infer<typeof FinancialSchema>;

export const ResearchSchema = z.object({
  promoterRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  litigationCases: z.number(),
  sectorTrend: z.enum(["UPWARD", "NEUTRAL", "DOWNWARD"]),
  newsSentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  summary: z.string().optional(),
});
export type ResearchData = z.infer<typeof ResearchSchema>;

export const RiskSchema = z.object({
  signals: z.array(z.string()),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type RiskData = z.infer<typeof RiskSchema>;

export const DocumentMetaSchema = z.object({
  cin: z.string().optional(),
  gstin: z.string().optional(),
  companyName: z.string().optional(),
  promoterNames: z.array(z.string()).optional(),
});
export type DocumentMetaData = z.infer<typeof DocumentMetaSchema>;
