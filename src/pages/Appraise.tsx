import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Building2, UploadCloud, 
  Settings, CheckCircle, MessageSquare, PieChart, ShieldAlert,
  Download, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  DocumentMetaData, FinancialDataExtracted, ResearchData, 
} from "@/lib/schemas";
import { extractTextFromPDF, extractFinancialMetrics } from "@/lib/agents";
import { masterResearchAgent } from "@/lib/researchAgent";
import { enrichFinancialMetrics } from "@/lib/financialAnalysis";
import { generateRiskSignals } from "@/lib/riskSignals";
import { computeFiveCs, FiveCsScore } from "@/lib/scoring";
import { generateDecisionExplanation } from "@/lib/explainability";
import { generateCAMReport } from "@/lib/camGenerator";
import { ScoreGauge } from "@/components/ScoreGauge";

const steps = [
  { label: "Upload Documents", icon: UploadCloud },
  { label: "Processing Dashboard", icon: Settings },
  { label: "Qualitative Input", icon: MessageSquare },
  { label: "Decision Engine", icon: PieChart },
];

export default function Appraise() {
  const [step, setStep] = useState(0);

  // Agent States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  
  // Data State
  const [meta, setMeta] = useState<DocumentMetaData>({ companyName: "", cin: "", gstin: "", promoterNames: [] });
  const [fin, setFin] = useState<any>(null); // enriched financial data
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [score, setScore] = useState<FiveCsScore | null>(null);

  // Qualitative Override
  const [qualitativeNotes, setQualitativeNotes] = useState("");

  // Uploaded Files State (for UI display only)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const addLog = (msg: string) => setProcessingLog(prev => [...prev, msg]);

  // Step 1: Handle Upload & Trigger Pipelines
  const handleUploadAndProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta.companyName) {
      toast.error("Please enter a company name to begin.");
      return;
    }
    
    setStep(1); // Move to Processing
    setIsProcessing(true);
    setProcessingLog([]);
    addLog("Initializing Agents...");

    try {
      // 1. PDF Extraction (Mock simulated delay for uploaded files if none provided)
      addLog("Running Document Extraction Agent (pdfjs + Gemini)...");
      let extractedFinData: FinancialDataExtracted;
      
      const fileInput = document.getElementById("pdfUpload") as HTMLInputElement;
      if (fileInput?.files && fileInput.files.length > 0) {
         let combinedText = "";
         for(let i=0; i<fileInput.files.length; i++) {
           combinedText += await extractTextFromPDF(fileInput.files[i]) + "\n";
         }
         extractedFinData = await extractFinancialMetrics([combinedText]);
      } else {
        // Fallback demo data if no files uploaded
        await new Promise(r => setTimeout(r, 2000));
        extractedFinData = await extractFinancialMetrics(["Sample unstructured finance text simulating revenue 50000000 net profit 4500000 debt 10000000 ebitda 6000000 net_worth 20000000"]);
      }

      addLog("Financial extraction complete. Running Financial Analysis Engine...");
      const enrichedFin = enrichFinancialMetrics(extractedFinData);
      setFin(enrichedFin);

      // 2. Research Agent
      addLog("Running Web Intelligence & Research Agent (Tavily)...");
      const researchData = await masterResearchAgent(
        meta.companyName || "Unknown", 
        meta.promoterNames || [], 
        "General SME"
      );
      setResearch(researchData);

      // 3. Signal Engine
      addLog("Analyzing Risk Signals...");
      const generatedSignals = generateRiskSignals(enrichedFin, researchData);
      setSignals(generatedSignals);

      addLog("Calculating Five Cs Credit Score...");
      const calculatedScore = computeFiveCs(enrichedFin, researchData, 700); // 700 default CIBIL for demo
      setScore(calculatedScore);

      addLog("✅ Processing Complete.");
      setIsProcessing(false);
      
      // Auto move to qualitative after 1.5s
      setTimeout(() => setStep(2), 1500);

    } catch(err:any) {
      console.error(err);
      addLog(`❌ Error during processing: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleDownloadCAM = () => {
    if(!fin || !research || !score) return;
    toast.info("Generating Report...");
    generateCAMReport(meta, fin, research, score, signals);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Nav */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  i === step ? "bg-primary text-primary-foreground" : 
                  i < step ? "bg-primary/20 text-primary" : "text-muted-foreground bg-secondary"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
              {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="gradient-card rounded-xl border border-border p-6 shadow-card"
          >
            {/* STEP 1: UPLOAD */}
            {step === 0 && (
              <form onSubmit={handleUploadAndProcess} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Step 1: Document Upload & Setup</h2>
                  <p className="text-sm text-muted-foreground mb-6">Provide the borrower's basic details and upload available financial documents safely. Agents will handle extraction.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <Label>Company Name</Label>
                    <Input 
                      required 
                      value={meta.companyName} 
                      onChange={e => setMeta({...meta, companyName: e.target.value})} 
                      placeholder="e.g. Acme Industries Ltd" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Label>Promoter Name(s) (comma separated)</Label>
                    <Input 
                      value={meta.promoterNames?.join(",")} 
                      onChange={e => setMeta({...meta, promoterNames: e.target.value.split(",")})} 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input 
                      value={meta.gstin} 
                      onChange={e => setMeta({...meta, gstin: e.target.value})} 
                      placeholder="e.g. 27AAAAA1234A1Z5" 
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label>Company CIN</Label>
                    <Input 
                      value={meta.cin} 
                      onChange={e => setMeta({...meta, cin: e.target.value})} 
                      placeholder="U12345MH..." 
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/30 mt-6 relative hover:bg-secondary/50 transition">
                   <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                   <p className="text-sm font-medium">Drag & Drop Documents (PDF)</p>
                   <p className="text-xs text-muted-foreground mt-1 mb-4">ITR, Bank Statements, Annual Report, Sanction Letters</p>
                   <Input 
                     id="pdfUpload" 
                     type="file" 
                     multiple 
                     accept=".pdf" 
                     className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                     onChange={(e) => {
                       if (e.target.files) {
                         const files = Array.from(e.target.files);
                         setSelectedFiles(files);
                         
                         // Auto-fill logic based on filenames
                         let inferredCompany = meta.companyName;
                         let inferredGst = meta.gstin;
                         let inferredPromoter = meta.promoterNames;

                         files.forEach(f => {
                           const name = f.name.toLowerCase();
                           if (name.includes("shivam")) {
                             inferredCompany = "Shivam Industries";
                             inferredPromoter = ["Shivam Patel"];
                           }
                           if (name.includes("gst")) {
                             // mock extraction of GST from filename or just default
                             inferredGst = "27AAAAA1234A1Z5";
                           }
                         });

                         setMeta({
                           ...meta,
                           companyName: inferredCompany,
                           gstin: inferredGst,
                           promoterNames: inferredPromoter
                         });
                       }
                     }}
                   />
                   <Button type="button" variant="outline" size="sm">Select Files</Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="bg-secondary/50 rounded-md p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Attached Files ({selectedFiles.length})</p>
                    <ul className="text-sm space-y-1">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-border mt-8 pt-6">
                  <h3 className="text-sm font-semibold mb-3">Live Synthesis Credentials (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Gemini AI Studio Key</Label>
                      <Input 
                        type="password" 
                        placeholder="AIzaSy..." 
                        onChange={e => localStorage.setItem("VITE_GEMINI_API_KEY", e.target.value)} 
                        defaultValue={localStorage.getItem("VITE_GEMINI_API_KEY") || ""}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tavily Search API Key</Label>
                      <Input 
                        type="password" 
                        placeholder="tvly-..." 
                        onChange={e => localStorage.setItem("VITE_TAVILY_API_KEY", e.target.value)} 
                        defaultValue={localStorage.getItem("VITE_TAVILY_API_KEY") || ""}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Keys are stored strictly in your browser's local storage. Leave blank to use simulated analytics.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="hero">Start Pipeline <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </div>
              </form>
            )}

            {/* STEP 2: PROCESSING DASHBOARD */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Processing Dashboard</h2>
                <div className="bg-background border border-border rounded-lg p-6 font-mono text-sm space-y-3 min-h-[300px]">
                  {processingLog.map((log, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className="flex items-start gap-3"
                    >
                      {log.includes('✅') || log.includes('❌') ? (
                        <span className="text-foreground shrink-0 mt-0.5">»</span>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 mt-0.5" />
                      )}
                      <span className={log.includes('✅') ? 'text-green-500 font-bold' : log.includes('❌') ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                        {log}
                      </span>
                    </motion.div>
                  ))}
                </div>
                {!isProcessing && (
                  <div className="flex justify-end">
                    <Button variant="glow" onClick={() => setStep(2)}>Review Outputs <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: QUALITATIVE INPUT */}
            {step === 2 && fin && research && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Qualitative Input Portal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: AI Alerts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-orange-500"/> AI Risk Intelligence Alerts</h3>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-4 space-y-3">
                      {signals.length > 0 ? signals.map((s, i) => (
                        <div key={i} className="flex gap-2 text-sm text-orange-600 dark:text-orange-400">
                          <span className="shrink-0 font-bold">⚠</span> {s}
                        </div>
                      )) : (
                        <div className="text-sm text-green-600">No major AI risk flags detected.</div>
                      )}
                    </div>
                    
                    <div className="bg-secondary rounded-md p-4 space-y-2 mt-4">
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Agent Summary</p>
                      <p className="text-sm">{research.summary}</p>
                    </div>
                  </div>

                  {/* Right: Manual Input */}
                  <div className="space-y-4">
                     <h3 className="text-sm font-semibold text-foreground">Credit Officer Assessment</h3>
                     <div>
                       <Label>Site Visit / Interview Notes (Optional text override)</Label>
                       <Textarea 
                         rows={8}
                         placeholder="e.g. Factory running at 40% capacity, management credibility concerns..."
                         className="mt-2 bg-secondary"
                         value={qualitativeNotes}
                         onChange={(e) => setQualitativeNotes(e.target.value)}
                       />
                     </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(0)}>Start Over</Button>
                  <Button variant="glow" onClick={() => setStep(3)}>Generate Final Decision <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </div>
              </div>
            )}

            {/* STEP 4: DECISION ENGINE (Redesigned per mockups) */}
            {step === 3 && score && fin && (
              <div className="space-y-6">
                
                {/* Header Banner - Credit Appraisal Memorandum */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex flex-col gap-1 mb-8">
                    <span className="text-xs font-mono font-bold text-[#81b29a] uppercase tracking-widest">Credit Appraisal Memorandum</span>
                    <h2 className="text-3xl font-extrabold text-foreground">{meta.companyName || "Untitled Company"}</h2>
                    <span className="text-sm font-medium text-muted-foreground">• CIN: {meta.cin || "N/A"} • {(fin?.revenue || 0) > 100000000 ? "10+ years" : "5 years"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-6 border-t border-border">
                    <div>
                      <span className="block text-xs text-muted-foreground mb-1">Facility</span>
                      <span className="font-semibold text-foreground">Term Loan</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground mb-1">Requested</span>
                      <span className="font-semibold text-foreground">₹1.00 Cr</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground mb-1">Recommended</span>
                      <span className="font-semibold text-[#81b29a]">₹1.00 Cr</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground mb-1">Interest Rate</span>
                      <span className="font-bold text-foreground">7.89% p.a.</span>
                    </div>
                  </div>
                </div>

                {/* Final Decision Banner */}
                <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Final Decision</span>
                  <div className={`text-3xl md:text-4xl font-extrabold uppercase mb-2 ${
                    score.total >= 80 ? 'text-[#81b29a]' : 
                    score.total >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {score.total >= 80 ? 'APPROVE WITH CONDITIONS' : score.total >= 60 ? 'MANUAL REVIEW REQUIRED' : 'DECLINE'}
                  </div>
                  <div className="font-mono text-sm font-semibold text-muted-foreground">Total Score: <span className="text-foreground">{score.total}/100</span></div>
                </div>

                {/* Scorecard Box */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6">Five Cs Scorecard</h3>
                  
                  {/* Gauge Row */}
                  <div className="flex flex-wrap items-end justify-between gap-6 px-4 pb-8">
                     <ScoreGauge score={score.total} maxScore={100} label="Total" size="lg" />
                     <ScoreGauge score={score.character} maxScore={20} label="Character" size="sm" />
                     <ScoreGauge score={score.capacity} maxScore={20} label="Capacity" size="sm" />
                     <ScoreGauge score={score.capital} maxScore={20} label="Capital" size="sm" />
                     <ScoreGauge score={score.collateral} maxScore={20} label="Collateral" size="sm" />
                     <ScoreGauge score={score.conditions} maxScore={20} label="Conditions" size="sm" />
                  </div>

                  {/* Justification Table */}
                  <div className="border border-border rounded-lg overflow-hidden mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Parameter</th>
                          <th className="px-6 py-4">Score</th>
                          <th className="px-6 py-4">Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr className="bg-background">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2"><div className="w-4 h-4 rounded text-primary border border-primary flex items-center justify-center p-0.5"><div className="w-full h-full border border-primary rounded-[1px]"/></div> Character</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">{score.character}/20</td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-pre-wrap">{research?.summary.split(".")[1] || "Promoter background assessed"}</td>
                        </tr>
                        <tr className="bg-background">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2"><svg className="w-4 h-4 text-[#81b29a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> Capacity</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">{score.capacity}/20</td>
                          <td className="px-6 py-4 text-muted-foreground">DSCR: {fin?.dscr?.toFixed(2) || "0.00"}x, ICR: {fin?.interest_coverage?.toFixed(2) || "0.00"}x</td>
                        </tr>
                        <tr className="bg-background">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-[#81b29a]"/> Capital</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">{score.capital}/20</td>
                          <td className="px-6 py-4 text-muted-foreground">D/E: {fin?.debt_to_equity?.toFixed(2) || "0.00"}x, Net Worth: ₹{((fin?.net_worth || 0)/10000000).toFixed(2)}Cr</td>
                        </tr>
                        <tr className="bg-background">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2"><svg className="w-4 h-4 text-[#81b29a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> Collateral</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">{score.collateral}/20</td>
                          <td className="px-6 py-4 text-muted-foreground">Coverage: 1.50x</td>
                        </tr>
                        <tr className="bg-background">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2"><svg className="w-4 h-4 text-[#81b29a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> Conditions</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">{score.conditions}/20</td>
                          <td className="px-6 py-4 text-muted-foreground">Sector: {research?.sectorTrend.toUpperCase() || "NEUTRAL"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Snapshot */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6">Financial Snapshot</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">GSTR-1 Sales</span>
                       <span className="font-bold text-foreground md:text-lg">₹{((fin?.revenue || 0)/10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">Net Worth</span>
                       <span className="font-bold text-foreground md:text-lg">₹{((fin?.net_worth || 0)/10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">Total Debt</span>
                       <span className="font-bold text-foreground md:text-lg">₹{((fin?.total_debt || 0)/10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">D/E Ratio</span>
                       <span className="font-bold text-foreground md:text-lg">{fin?.debt_to_equity?.toFixed(2) || "0.00"}x</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">DSCR</span>
                       <span className="font-bold text-foreground md:text-lg">{fin?.dscr?.toFixed(2) || "0.00"}x</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">Interest Coverage</span>
                       <span className="font-bold text-foreground md:text-lg">{fin?.interest_coverage?.toFixed(2) || "0.00"}x</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">Current Ratio</span>
                       <span className="font-bold text-foreground md:text-lg">{fin?.current_ratio?.toFixed(2) || "0.00"}x</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                       <span className="block text-xs text-muted-foreground mb-1">EMI Bounces</span>
                       <span className="font-bold text-foreground md:text-lg">1</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6">Pricing Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">RBI Repo Rate</span>
                      <span className="font-mono font-bold text-foreground">6.50%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Credit Risk Spread</span>
                      <span className="font-mono font-bold text-foreground">0.64%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Operational Cost</span>
                      <span className="font-mono font-bold text-foreground">0.50%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Profit Margin</span>
                      <span className="font-mono font-bold text-foreground">0.25%</span>
                    </div>
                    <div className="pt-4 mt-2 border-t border-border flex justify-between items-center text-base">
                      <span className="font-bold text-foreground">Total Interest Rate</span>
                      <span className="font-mono font-bold text-[#81b29a]">7.89% p.a.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8 border-t border-border">
                  <Button variant="hero" size="lg" className="px-10" onClick={handleDownloadCAM}>
                    <Download className="mr-2 h-5 w-5" /> Export Official CAM (.docx)
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
