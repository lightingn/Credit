import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, FileText, ArrowRight, BarChart3, Building2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-mono text-primary tracking-widest uppercase">AI-Powered Credit Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
              Corporate Credit{" "}
              <span className="text-gradient">Intelligence</span>{" "}
              Engine
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              Five Cs scoring, anomaly detection, and automated CAM generation — built for Indian banking standards, RBI norms, and GST compliance.
            </p>
            <div className="flex gap-3">
              <Link to="/appraise">
                <Button variant="hero" size="lg">
                  <Zap className="h-4 w-4" />
                  Start Appraisal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="glow" size="lg">
                <FileText className="h-4 w-4" />
                View Sample CAM
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Companies Analyzed" value="2,847" trend="+12%" trendUp />
          <StatCard icon={BarChart3} label="Avg. Score" value="72.4" trend="+3.1" trendUp />
          <StatCard icon={AlertTriangle} label="Anomalies Flagged" value="342" trend="-8%" trendUp />
          <StatCard icon={Shield} label="Approval Rate" value="68%" trend="+2%" trendUp />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-xl font-bold text-foreground mb-8">Analysis Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: "Data Ingestor",
              desc: "Parse GST returns, ITR filings, bank statements, and annual reports. Cross-validate with OCR + rule-based anomaly detection.",
              icon: FileText,
            },
            {
              title: "Research Agent",
              desc: "AI-powered promoter background checks, sector analysis, litigation search, and regulatory alert scanning.",
              icon: TrendingUp,
            },
            {
              title: "Scoring Engine",
              desc: "Five Cs framework with 8 anomaly detection rules, weighted scoring, and automated CAM generation.",
              icon: Shield,
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="gradient-card rounded-lg border border-border p-6 shadow-card hover:border-primary/30 transition-all group"
            >
              <div className="rounded-md bg-primary/10 p-2.5 w-fit mb-4 group-hover:shadow-glow transition-shadow">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
