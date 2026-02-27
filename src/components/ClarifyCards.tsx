import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export interface ClarifyQuestion {
  id: string;
  question: string;
  options: string[];
}

interface ClarifyCardsProps {
  questions: ClarifyQuestion[];
  onComplete: (answers: Record<string, string>) => void;
  disabled?: boolean;
}

const ClarifyCards = ({ questions, onComplete, disabled }: ClarifyCardsProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {questions.map((q, idx) => (
          <Card
            key={q.id}
            className="border-border bg-card animate-in fade-in slide-in-from-bottom-2 duration-400"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary text-foreground text-xs flex items-center justify-center font-semibold shrink-0">
                  {idx + 1}
                </span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      disabled={disabled}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border ${
                        selected
                          ? "bg-primary/10 border-primary text-foreground font-medium"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        {selected && <CheckCircle2 size={12} className="text-primary shrink-0" />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!disabled && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => onComplete(answers)}
            disabled={!allAnswered}
            className="gap-1.5 text-xs"
          >
            生成 Plan
            <ArrowRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClarifyCards;
