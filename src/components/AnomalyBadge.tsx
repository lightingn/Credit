import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface AnomalyBadgeProps {
  severity: "high" | "medium" | "low";
  rule: string;
  message: string;
}

export const AnomalyBadge = ({ severity, rule, message }: AnomalyBadgeProps) => {
  const styles = {
    high: "border-destructive/40 bg-destructive/10 text-destructive",
    medium: "border-warning/40 bg-warning/10 text-warning",
    low: "border-info/40 bg-info/10 text-info",
  };
  const Icon = severity === "high" ? ShieldAlert : severity === "medium" ? AlertTriangle : Info;

  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 ${styles[severity]}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <span className="font-mono text-xs font-semibold">{rule}</span>
        <p className="text-xs mt-0.5 opacity-80">{message}</p>
      </div>
    </div>
  );
};
