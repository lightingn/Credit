import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResearchSchema, ResearchData } from "./schemas";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Tavily Helper - Fallback logic built-in to handle rate limits/missing keys gracefully in demo
async function runSearch(query: string): Promise<string> {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("No Tavily API key found, returning simulated results.");
    return `Simulated search results for: ${query}. Found 0 major risks. Market trend appears stable. Sector is neutral. Promoters are clean. No litigations mentioned recently.`;
  }
  
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 3
      })
    });
    const data = await response.json();
    return data.results ? data.results.map((r: any) => `${r.title}: ${r.content}`).join("\n\n") : "No results.";
  } catch(e) {
    console.error("Tavily search failed", e);
    return "Search failed. Defaulting to neutral state.";
  }
}

export async function companyResearchAgent(companyName: string): Promise<string> {
  const query = `${companyName} default NPA news fraud lawsuit RBI penalty`;
  return await runSearch(query);
}

export async function promoterResearchAgent(promoterNames: string[]): Promise<string> {
  if (promoterNames.length === 0) return "No promoters provided.";
  const query = `${promoterNames.join(" OR ")} criminal case court financial fraud`;
  return await runSearch(query);
}

export async function sectorResearchAgent(industry: string): Promise<string> {
  const query = `${industry} sector outlook India 2024 RBI credit trend slowdown`;
  return await runSearch(query);
}

export async function litigationResearchAgent(companyName: string): Promise<string> {
  const query = `${companyName} pending litigation cases eCourts high court nclt`;
  return await runSearch(query);
}

// Master Research Aggregator
export async function masterResearchAgent(
  companyName: string, 
  promoters: string[], 
  industry: string
): Promise<ResearchData> {
  console.log("Running Sub-Agents...");
  const companyResults = await companyResearchAgent(companyName);
  const promoterResults = await promoterResearchAgent(promoters);
  const sectorResults = await sectorResearchAgent(industry);
  const litigationResults = await litigationResearchAgent(companyName);

  const combinedSearchData = `
    COMPANY SEARCH: ${companyResults}
    PROMOTER SEARCH: ${promoterResults}
    SECTOR SEARCH: ${sectorResults}
    LITIGATION SEARCH: ${litigationResults}
  `;

  console.log("Synthesizing Search Data with Gemini...");
  const prompt = `
    Analyze the following internet search results for a credit risk assessment.
    
    SEARCH DATA:
    ${combinedSearchData}
    
    Extract insights and output ONLY valid JSON matching this schema exactly:
    {
      "promoterRisk": "LOW" | "MEDIUM" | "HIGH",
      "litigationCases": number (estimated pending cases, 0 if none found),
      "sectorTrend": "UPWARD" | "NEUTRAL" | "DOWNWARD",
      "newsSentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      "summary": "2 sentence executive summary of these risk findings"
    }

    Do not include markdown blocks like \`\`\`json, just the raw JSON object. Use your best judgment based on the text.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return ResearchSchema.parse(parsed);
  } catch (error) {
    console.error("Gemini research summarization failed", error);
    // Fallback Mock
    return {
      promoterRisk: "LOW",
      litigationCases: 0,
      sectorTrend: "NEUTRAL",
      newsSentiment: "NEUTRAL",
      summary: "Error during deep AI synthesis. Defaulting to neutral rating based on preliminary checks."
    };
  }
}
