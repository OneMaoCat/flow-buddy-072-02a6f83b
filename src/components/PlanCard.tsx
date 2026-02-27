import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, RotateCcw, Play } from "lucide-react";

export interface PlanStep {
  title: string;
  estimatedTime: string;
}

interface PlanCardProps {
  title: string;
  steps: PlanStep[];
  totalTime: string;
  onConfirm: () => void;
  onRevise: () => void;
}

const PlanCard = ({ title, steps, totalTime, onConfirm, onRevise }: PlanCardProps) => {
  return (
    <div className="w-full max-w-[860px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">✓</span>
        </div>
        <h2 className="text-base font-semibold text-foreground">开发计划</h2>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Clock size={13} />
            <span>预计总耗时 {totalTime}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-3 border-b border-border last:border-0 animate-in fade-in duration-300"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className="w-6 h-6 rounded-full bg-secondary text-foreground text-xs flex items-center justify-center font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock size={12} />
                  {step.estimatedTime}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={onRevise} className="gap-2">
              <RotateCcw size={14} />
              返回修改
            </Button>
            <Button onClick={onConfirm} className="gap-2">
              <Play size={14} />
              确认开始开发
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanCard;
