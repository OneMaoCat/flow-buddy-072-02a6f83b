import { useState } from "react";
import { CheckCircle2, Circle, Loader2, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PublishDialogProps {
  testsPassed: boolean;
  previewConfirmed: boolean;
}

const PublishDialog = ({ testsPassed, previewConfirmed }: PublishDialogProps) => {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const checks = [
    { label: "测试用例全部通过", done: testsPassed },
    { label: "代码审查完成", done: true },
    { label: "预览已确认", done: previewConfirmed },
  ];

  const allReady = checks.every((c) => c.done);

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Rocket size={14} /> 发布
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{published ? "发布成功 🎉" : "发布到线上"}</DialogTitle>
        </DialogHeader>

        {published ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 size={48} className="text-green-600" />
            <p className="text-sm text-foreground">产品已成功发布到线上环境</p>
            <p className="text-xs text-muted-foreground">https://your-product.example.com</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mt-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {c.done ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground/40" />
                  )}
                  <span className={`text-sm ${c.done ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4 gap-2"
              disabled={!allReady || publishing}
              onClick={handlePublish}
            >
              {publishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> 发布中...
                </>
              ) : (
                <>
                  <Rocket size={14} /> 发布到线上
                </>
              )}
            </Button>

            {!allReady && (
              <p className="text-xs text-muted-foreground text-center">请先完成所有检查项</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
