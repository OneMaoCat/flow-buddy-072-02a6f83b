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
}

const ClarifyCards = ({ questions, onComplete }: ClarifyCardsProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="w-full max-w-[860px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">?</span>
        </div>
        <h2 className="text-base font-semibold text-foreground">需求澄清</h2>
        <span className="text-xs text-muted-foreground ml-1">请回答以下问题，以便更好地理解你的需求</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {questions.map((q, idx) => (
          <Card
            key={q.id}
            className="border-border bg-card animate-in fade-in slide-in-from-bottom-2 duration-400"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary text-foreground text-xs flex items-center justify-center font-semibold shrink-0">
                  {idx + 1}
                </span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 border ${
                        selected
                          ? "bg-primary/10 border-primary text-foreground font-medium"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {selected && <CheckCircle2 size={14} className="text-primary shrink-0" />}
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

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete(answers)}
          disabled={!allAnswered}
          className="gap-2"
        >
          生成 Plan
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ClarifyCards;
