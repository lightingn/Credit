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
                   <Input id="pdfUpload" type="file" multiple accept=".pdf" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                   <Button type="button" variant="outline" size="sm">Select Files</Button>
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

            {/* STEP 4: DECISION ENGINE & CAM */}
            {step === 3 && score && fin && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">Decision Dashboard</h2>
                  <p className="text-muted-foreground mt-1">Five Cs Automated Underwriting Output</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Score */}
                  <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 text-center shadow-sm flex flex-col justify-center">
                     <div className="text-5xl font-black text-primary mb-2">{score.total}</div>
                     <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Score</div>
                     <div className={`mt-4 mx-auto px-4 py-1.5 rounded-full text-sm font-bold w-max ${
                       score.total >= 80 ? 'bg-green-500/20 text-green-500' : 
                       score.total >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                     }`}>
                       {score.total >= 80 ? 'Low Risk' : score.total >= 60 ? 'Moderate Risk' : 'High Risk'}
                     </div>
                  </div>

                  {/* 5Cs Breakdown */}
                  <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {label: "Character", val: score.character, max: 20},
                      {label: "Capacity", val: score.capacity, max: 20},
                      {label: "Capital", val: score.capital, max: 20},
                      {label: "Collateral", val: score.collateral, max: 20},
                      {label: "Conditions", val: score.conditions, max: 20},
                    ].map(c => (
                      <div key={c.label} className="bg-secondary rounded-lg p-4">
                        <div className="text-xs text-muted-foreground font-medium uppercase">{c.label}</div>
                        <div className="text-xl font-bold mt-1 text-foreground">{c.val} <span className="text-sm text-muted-foreground font-normal">/ {c.max}</span></div>
                        <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${(c.val / c.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explainability Module */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 text-primary">Explainability Engine</h3>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {generateDecisionExplanation(score, signals)}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button variant="hero" size="lg" className="px-8" onClick={handleDownloadCAM}>
                    <Download className="mr-2 h-5 w-5" /> Download CAM (.docx)
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
