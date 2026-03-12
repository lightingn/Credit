import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { FiveCsScore } from "./scoring";
import { FinancialDataExtracted, DocumentMetaData, ResearchData } from "./schemas";
import { generateDecisionExplanation } from "./explainability";

export async function generateCAMReport(
  meta: DocumentMetaData,
  fin: FinancialDataExtracted & {
    computed_dscr: number;
    computed_debt_equity: number;
    computed_interest_coverage: number;
    computed_current_ratio: number;
  },
  research: ResearchData,
  score: FiveCsScore,
  signals: string[]
) {
  const explanationText = generateDecisionExplanation(score, signals);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // 1. Executive Summary
          new Paragraph({
            text: "Credit Appraisal Memo (CAM)",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "1. Executive Summary", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            text: `This document presents the credit appraisal for ${meta.companyName || "the applicant"}. The total Five Cs credit score is ${score.total}/100. ${explanationText.split("\n\n")[0]}`,
          }),
          
          // 2. Borrower Profile
          new Paragraph({ text: "" }),
          new Paragraph({ text: "2. Borrower Profile", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Company Name: ${meta.companyName || "N/A"}` }),
          new Paragraph({ text: `CIN: ${meta.cin || "N/A"}` }),
          new Paragraph({ text: `GSTIN: ${meta.gstin || "N/A"}` }),
          new Paragraph({ text: `Promoters: ${(meta.promoterNames || []).join(", ") || "N/A"}` }),
          
          // 3. Financial Analysis
          new Paragraph({ text: "" }),
          new Paragraph({ text: "3. Financial Analysis", heading: HeadingLevel.HEADING_2 }),
          createFinancialTable(fin),
          
          // 4. Five Cs Assessment
          new Paragraph({ text: "" }),
          new Paragraph({ text: "4. Five Cs Assessment", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Character: ${score.character}/20` }),
          new Paragraph({ text: `Capacity: ${score.capacity}/20` }),
          new Paragraph({ text: `Capital: ${score.capital}/20` }),
          new Paragraph({ text: `Collateral: ${score.collateral}/20` }),
          new Paragraph({ text: `Conditions: ${score.conditions}/20` }),
          new Paragraph({ text: `Total Score: ${score.total}/100` }),

          // 5. Risk Flags
          new Paragraph({ text: "" }),
          new Paragraph({ text: "5. Risk Flags", heading: HeadingLevel.HEADING_2 }),
          ...(signals.length > 0 
            ? signals.map(s => new Paragraph({ text: `• ${s}`, bullet: { level: 0 } }))
            : [new Paragraph({ text: "No major risk flags detected." })]),
            
          // Research Summary 
          new Paragraph({ text: "" }),
          new Paragraph({ text: `Research Summary: ${research.summary || "N/A"}` }),

          // 6. Recommendation
          new Paragraph({ text: "" }),
          new Paragraph({ text: "6. Loan Recommendation & Pricing", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: explanationText }),
          new Paragraph({ text: `Suggested Interest Rate Range: ${score.total >= 80 ? '9% - 10%' : score.total >= 60 ? '11% - 13%' : '14%+'}` }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${meta.companyName || "Borrower"}_CAM_Report.docx`);
}

function createFinancialTable(fin: any): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Metric", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: "Value", alignment: AlignmentType.CENTER })] }),
        ],
      }),
      createRow("Revenue", `₹${fin.revenue || 0}`),
      createRow("Net Profit", `₹${fin.net_profit || 0}`),
      createRow("Total Debt", `₹${fin.total_debt || 0}`),
      createRow("Net Worth", `₹${fin.net_worth || 0}`),
      createRow("DSCR", `${fin.computed_dscr}`),
      createRow("Debt/Equity", `${fin.computed_debt_equity}`),
      createRow("Current Ratio", `${fin.computed_current_ratio}`),
    ],
  });
}

function createRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph(label)] }),
      new TableCell({ children: [new Paragraph(value)] }),
    ],
  });
}
