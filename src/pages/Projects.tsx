import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { mockProjects } from "@/data/projects";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "进行中", className: "bg-primary text-primary-foreground" },
  draft: { label: "草稿", className: "bg-muted text-muted-foreground" },
  archived: { label: "已归档", className: "bg-secondary text-secondary-foreground" },
};

const Projects = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = mockProjects.filter(
    (p) => p.name.includes(search) || p.description.includes(search)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的项目</h1>
            <p className="text-sm text-muted-foreground mt-1">管理你的所有产品项目</p>
          </div>
          <button className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            新建项目
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <Badge variant="secondary" className={statusMap[project.status].className + " text-[11px] px-2 py-0.5"}>
                  {statusMap[project.status].label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.techStack.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-accent border-2 border-card flex items-center justify-center text-[10px] font-medium text-accent-foreground"
                    >
                      {m.avatar}
                    </div>
                  ))}
                  {project.members.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} />
                  <span>{project.members.length}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
