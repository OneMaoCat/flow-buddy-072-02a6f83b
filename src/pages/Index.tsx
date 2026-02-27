import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import DeepFlowSidebar from "@/components/DeepFlowSidebar";
import PromptBar from "@/components/PromptBar";
import QuickActions from "@/components/QuickActions";
import RecommendationCards from "@/components/RecommendationCards";

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

  // Sync sidebar with screen size changes
  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DeepFlowSidebar
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main area */}
      <div
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarOpen && isDesktop ? "lg:ml-[280px]" : ""
        }`}
      >
        {/* Mobile header with menu toggle */}
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

        {/* Toggle for desktop when collapsed */}
        {!sidebarOpen && isDesktop && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-20 p-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
        )}

        <main className="max-w-[1040px] mx-auto px-5 md:px-7">
          {/* Welcome */}
          <div className="pt-[100px] md:pt-[140px] flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-6">
              <span className="text-primary-foreground text-lg font-bold">DF</span>
            </div>
            <h1 className="text-2xl md:text-[34px] font-bold text-foreground text-center leading-tight">
              Hi 李娟娟，有什么可以帮你的？
            </h1>
          </div>

          {/* Prompt Bar */}
          <div className="mb-5">
            <PromptBar />
          </div>

          {/* Quick Actions */}
          <div className="mb-14">
            <QuickActions />
          </div>

          {/* Recommendations */}
          <div className="pb-12">
            <RecommendationCards />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
