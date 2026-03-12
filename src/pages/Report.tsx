import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Shield, AlertTriangle, TrendingUp, Landmark, Building2, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { AnomalyBadge } from "@/components/AnomalyBadge";
import { CreditResult, CompanyData, FinancialData, formatINR } from "@/lib/scoring";

const fiveCIcons = [Shield, TrendingUp, Landmark, Building2, Globe];

const Report = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<CreditResult | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [fin, setFin] = useState<FinancialData | null>(null);

  useEffect(() => {
    const r = sessionStorage.getItem("creditResult");
    const c = sessionStorage.getItem("companyData");
    const f = sessionStorage.getItem("financialData");
    if (r && c && f) {
      setResult(JSON.parse(r));
      setCompany(JSON.parse(c));
      setFin(JSON.parse(f));
    } else {
      navigate("/appraise");
    }
  }, [navigate]);

  if (!result || !company || !fin) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/appraise">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <Button variant="glow" size="sm">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>

        {/* CAM Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-lg border border-border p-6 shadow-card mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Credit Appraisal Memorandum</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {company.name || "Untitled Company"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {company.industry} • CIN: {company.cin || "N/A"} • {company.yearsInOperation} years
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <span className="text-xs text-muted-foreground">Facility</span>
              <p className="font-semibold text-foreground">{company.facilityType}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Requested</span>
              <p className="font-semibold font-mono text-foreground">{formatINR(company.requestedAmount)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Recommended</span>
              <p className="font-semibold font-mono" style={{ color: result.decisionColor }}>
                {formatINR(result.recommendedAmount)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Interest Rate</span>
              <p className="font-semibold font-mono text-foreground">{result.interestRate.toFixed(2)}% p.a.</p>
            </div>
          </div>
        </motion.div>

        {/* Decision Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border p-5 mb-6 text-center"
          style={{ borderColor: result.decisionColor + "40", backgroundColor: result.decisionColor + "10" }}
        >
          <span className="text-sm text-muted-foreground">Final Decision</span>
          <h2 className="text-3xl font-extrabold font-mono mt-1" style={{ color: result.decisionColor }}>
            {result.decision}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total Score: <span className="font-mono font-bold text-foreground">{result.totalScore}/100</span>
          </p>
        </motion.div>

        {/* Five Cs Scorecard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gradient-card rounded-lg border border-border p-6 shadow-card mb-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Five Cs Scorecard</h2>
          <div className="flex justify-around flex-wrap gap-6">
            <ScoreGauge score={result.totalScore} maxScore={100} label="Total" size="lg" />
            {result.fiveCScores.map((c, i) => (
              <ScoreGauge key={c.label} score={c.score} maxScore={c.maxScore} label={c.label} />
            ))}
          </div>

          {/* Detail Table */}
          <div className="mt-8 border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Parameter</th>
                  <th className="text-center px-4 py-2 text-xs text-muted-foreground font-medium">Score</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Justification</th>
                </tr>
              </thead>
              <tbody>
                {result.fiveCScores.map((c, i) => {
                  const Icon = fiveCIcons[i];
                  return (
                    <tr key={c.label} className="border-t border-border">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{c.label}</span>
                      </td>
                      <td className="text-center px-4 py-3 font-mono font-bold text-foreground">{c.score}/{c.maxScore}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.justification}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Anomalies */}
        {result.anomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="gradient-card rounded-lg border border-border p-6 shadow-card mb-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Anomaly Detection ({result.anomalies.length} flags)
            </h2>
            <div className="space-y-3">
              {result.anomalies.map((a, i) => (
                <AnomalyBadge key={i} severity={a.severity} rule={a.rule} message={a.message} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Financial Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="gradient-card rounded-lg border border-border p-6 shadow-card mb-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Financial Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "GSTR-1 Sales", value: formatINR(fin.gstr1AnnualSales) },
              { label: "Net Worth", value: formatINR(fin.netWorth) },
              { label: "Total Debt", value: formatINR(fin.totalDebt) },
              { label: "D/E Ratio", value: `${fin.debtToEquity.toFixed(2)}x` },
              { label: "DSCR", value: `${fin.dscr.toFixed(2)}x` },
              { label: "Interest Coverage", value: `${fin.interestCoverage.toFixed(2)}x` },
              { label: "Current Ratio", value: `${fin.currentRatio.toFixed(2)}x` },
              { label: "EMI Bounces", value: `${fin.emiBounces}` },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/50 rounded-md p-3">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <p className="font-mono font-semibold text-foreground text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="gradient-card rounded-lg border border-border p-6 shadow-card"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Pricing Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">RBI Repo Rate</span>
              <span className="font-mono text-foreground">6.50%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit Risk Spread</span>
              <span className="font-mono text-foreground">{((100 - result.totalScore) * 0.04).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operational Cost</span>
              <span className="font-mono text-foreground">0.50%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Margin</span>
              <span className="font-mono text-foreground">0.25%</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span className="text-foreground">Total Interest Rate</span>
              <span className="font-mono text-primary">{result.interestRate.toFixed(2)}% p.a.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
