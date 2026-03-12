# Intelli-Credit Engine

Intelli-Credit is an automated MSME credit appraisal system built for the HDFC Hackathon. It leverages Generative AI and search-based Data Enrichment tools to automate the underwriting process based on the Five Cs of Credit (Character, Capacity, Capital, Collateral, and Conditions).

## 🏗️ System Architecture 

1. **Document Upload & Parsing Agent** (Gemini + PDF.js): Extracts raw data from uploaded ITRs, Bank Statements, and Annual Reports into heavily structured JSON `FinancialDataExtracted` objects.
2. **Web Research Agent** (Tavily + Gemini): Automatically queries the web to pull insights on promoter litigation, company defaults, and sector trends.
3. **Financial Analysis Engine**: Computes ratios (DSCR, D/E, ICR) from the extracted PDF data automatically.
4. **Risk Signal Engine**: Triggers rule-based flags such as "Sector trend downward" or "DSCR critically low."
5. **Five Cs Scoring Model**: Aggregates all insights into a 100-point metric broken down across the 5Cs.
6. **Explainability Engine**: Translates quantitative risk into human-readable narratives to prevent black-box decisioning.
7. **CAM output Engine**: Assembles the findings into a downloaded Microsoft Word `(.docx)` file for the Credit Officer.

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and `npm` installed.

### Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_GEMINI_API_KEY="your_google_gemini_key_here"
VITE_TAVILY_API_KEY="your_tavily_search_api_here"
# Optional
VITE_SERPAPI_KEY="your_serp_key_here"
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

To build for production, run:

```bash
npm run build
```

This application is purely frontend (React/Vite). You can host the contents of the `dist` folder on Vercel, Netlify, or GitHub Pages. Note that because API keys are exposed in the build (for demonstration purposes), you should restrict usage vectors on your GCP Console.

## 🛠️ Stack

*   [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [shadcn/ui](https://ui.shadcn.com/)
*   [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
*   [docx](https://docx.js.org/)
*   [Tavily Search API](https://tavily.com/)
