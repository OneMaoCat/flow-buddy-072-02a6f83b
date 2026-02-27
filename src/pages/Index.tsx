import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import DeepFlowSidebar from "@/components/DeepFlowSidebar";
import PromptBar from "@/components/PromptBar";
import QuickActions from "@/components/QuickActions";
import RecommendationCards from "@/components/RecommendationCards";
import PlanFlow from "@/components/PlanFlow";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
};

const Index = () => {
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({
    active: false,
    requirement: "",
  });

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    if (data.isPlanMode) {
      setPlanFlow({ active: true, requirement: data.text });
    }
    // Non-plan mode: no-op for now (direct send)
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DeepFlowSidebar
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarOpen && isDesktop ? "lg:ml-[280px]" : ""
        }`}
      >
        {!isDesktop && (
          <header className="flex items-center h-12 px-4 border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="ml-3 text-sm font-semibold">DeepFlow</span>
          </header>
        )}

        {!sidebarOpen && isDesktop && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-20 p-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
        )}

        <main className="max-w-[1040px] mx-auto px-5 md:px-7">
          {!planFlow.active ? (
            <>
              {/* Welcome */}
              <div className="pt-[100px] md:pt-[140px] flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-6">
                  <span className="text-primary-foreground text-lg font-bold">DF</span>
                </div>
                <h1 className="text-2xl md:text-[34px] font-bold text-foreground text-center leading-tight">
                  Hi 李娟娟，有什么可以帮你的？
                </h1>
              </div>

              <div className="mb-5">
                <PromptBar onSubmit={handleSubmit} />
              </div>

              <div className="mb-14">
                <QuickActions />
              </div>

              <div className="pb-12">
                <RecommendationCards />
              </div>
            </>
          ) : (
            <div className="pt-[60px] md:pt-[80px]">
              {/* Show user's requirement */}
              <div className="w-full max-w-[860px] mx-auto mb-6">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">你</span>
                  </div>
                  <p className="text-sm text-foreground pt-1">{planFlow.requirement}</p>
                </div>
              </div>

              <PlanFlow
                requirement={planFlow.requirement}
                onCancel={() => setPlanFlow({ active: false, requirement: "" })}
                onStartDev={() => {
                  // Stay in confirmed/developing state
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
