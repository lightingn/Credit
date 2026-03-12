import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard = ({ icon: Icon, label, value, trend, trendUp }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="gradient-card rounded-lg border border-border p-5 shadow-card hover:border-primary/30 transition-colors"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-2xl font-bold font-mono text-foreground">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? "text-success" : "text-destructive"}`}>
          {trend}
        </span>
      )}
    </div>
  </motion.div>
);
