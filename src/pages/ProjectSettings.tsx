import { useState, useSyncExternalStore } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, X, Pencil, Check } from "lucide-react";
import { type ProjectMember } from "@/data/projects";
import { projectStore } from "@/data/projectStore";
import { Button } from "@/components/ui/button";

const roleLabels: Record<string, string> = {
  owner: "所有者",
  editor: "编辑者",
  viewer: "查看者",
};

const ProjectSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = useSyncExternalStore(projectStore.subscribe, projectStore.getAll);
  const project = projects.find((p) => p.id === id);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 px-6 border-b border-border">
        <button
          onClick={() => navigate(`/project/${id}`)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold text-foreground">{project.name} — 设置</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Team Members Section */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-1">团队成员</h2>
          <p className="text-sm text-muted-foreground mb-5">管理项目成员和权限</p>

          {/* Invite */}
          <div className="flex gap-2 mb-6">
            <input
              className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none"
            >
              <option value="editor">编辑者</option>
              <option value="viewer">查看者</option>
            </select>
            <Button className="h-10 gap-1.5">
              <UserPlus size={14} />
              邀请
            </Button>
          </div>

          {/* Member List */}
          <div className="border border-border rounded-lg divide-y divide-border">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[m.role]}</p>
                </div>
                {m.role !== "owner" && (
                  <button className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectSettings;
