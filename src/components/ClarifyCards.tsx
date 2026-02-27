import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentIdx, setCurrentIdx] = useState(0);

  const allAnswered = questions.every((q) => answers[q.id]);
  const current = questions[currentIdx];
  const total = questions.length;

  return (
    <div className="w-full max-w-[520px]">
      <Card className="border-border bg-card overflow-hidden">
        {/* Slide indicator */}
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => !disabled && setCurrentIdx(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? "bg-primary w-6"
                  : i < currentIdx && answers[questions[i].id]
                  ? "bg-primary/40 w-3"
                  : "bg-border w-3"
              }`}
            />
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {currentIdx + 1} / {total}
          </span>
        </div>

        {/* Question content with slide transition */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIdx * 100}%)` }}
          >
            {questions.map((q, qIdx) => (
              <div key={q.id} className="w-full shrink-0">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary text-foreground text-xs flex items-center justify-center font-semibold shrink-0">
                      {qIdx + 1}
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
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border ${
                            selected
                              ? "bg-primary/10 border-primary text-foreground font-medium"
                              : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <span className="flex items-center gap-2">
                            {selected && (
                              <CheckCircle2
                                size={12}
                                className="text-primary shrink-0"
                              />
                            )}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation footer */}
        {!disabled && (
          <div className="flex items-center justify-between px-4 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIdx((i) => i - 1)}
              disabled={currentIdx === 0}
              className="gap-1 text-xs h-8"
            >
              <ChevronLeft size={14} />
              上一个
            </Button>

            {currentIdx < total - 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (answers[current.id]) {
                    setCurrentIdx((i) => i + 1);
                  }
                }}
                disabled={!answers[current.id]}
                className="gap-1 text-xs h-8"
              >
                下一个
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onComplete(answers)}
                disabled={!allAnswered}
                className="gap-1.5 text-xs h-8"
              >
                生成 Plan
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClarifyCards;
