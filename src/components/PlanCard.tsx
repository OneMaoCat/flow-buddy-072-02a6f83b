import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, Play } from "lucide-react";

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
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Clock size={12} />
          <span>预计总耗时 {totalTime}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-0">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0"
            >
              <span className="w-5 h-5 rounded-full bg-secondary text-foreground text-[10px] flex items-center justify-center font-semibold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{step.title}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                <Clock size={10} />
                {step.estimatedTime}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onRevise} className="gap-1.5 text-xs">
            <RotateCcw size={12} />
            返回修改
          </Button>
          <Button size="sm" onClick={onConfirm} className="gap-1.5 text-xs">
            <Play size={12} />
            确认开始开发
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
