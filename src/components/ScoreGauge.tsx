import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  label: string;
  size?: "sm" | "lg";
}

const getScoreColor = (score: number, max: number) => {
  const pct = score / max;
  if (pct >= 0.85) return "hsl(var(--success))";
  if (pct >= 0.7) return "hsl(var(--primary))";
  if (pct >= 0.55) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
};

export const ScoreGauge = ({ score, maxScore, label, size = "sm" }: ScoreGaugeProps) => {
  const pct = score / maxScore;
  const isLarge = size === "lg";
  const r = isLarge ? 54 : 32;
  const stroke = isLarge ? 6 : 4;
  const circ = 2 * Math.PI * r;
  const color = getScoreColor(score, maxScore);
  const dim = isLarge ? 120 : 76;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold ${isLarge ? "text-2xl" : "text-sm"}`} style={{ color }}>
            {score}
          </span>
          <span className="text-muted-foreground text-[10px]">/{maxScore}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium text-center">{label}</span>
    </div>
  );
};
