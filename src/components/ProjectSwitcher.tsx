import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, Plus, Search } from "lucide-react";
import { mockProjects, type Project } from "@/data/projects";

interface ProjectSwitcherProps {
  currentProject: Project;
}

const ProjectSwitcher = ({ currentProject }: ProjectSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = mockProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-[10px] font-bold">
            {currentProject.name[0]}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground truncate flex-1">
          {currentProject.name}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-[220px] bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
          {/* Search */}
          <div className="px-2 pb-1">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="搜索项目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Project list */}
          <div className="max-h-[200px] overflow-y-auto scrollbar-hide">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  navigate(`/project/${p.id}`);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary/50 transition-colors"
              >
                {p.id === currentProject.id ? (
                  <Check size={12} className="text-primary shrink-0" />
                ) : (
                  <div className="w-3 shrink-0" />
                )}
                <span className={`truncate ${p.id === currentProject.id ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {/* New project */}
          <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
              <Plus size={12} />
              新建项目
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
