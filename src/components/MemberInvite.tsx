import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ProjectMember } from "@/data/projects";

interface MemberInviteProps {
  members: ProjectMember[];
}

const roleLabels: Record<string, string> = {
  owner: "所有者",
  editor: "编辑者",
  viewer: "查看者",
};

const MemberInvite = ({ members }: MemberInviteProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
          <UserPlus size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>邀请成员</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="editor">编辑者</option>
            <option value="viewer">查看者</option>
          </select>
          <Button size="sm" className="h-9">邀请</Button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">当前成员</p>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-accent-foreground">
                {m.avatar}
              </div>
              <span className="text-sm text-foreground flex-1">{m.name}</span>
              <span className="text-[11px] text-muted-foreground">{roleLabels[m.role]}</span>
              {m.role !== "owner" && (
                <button className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberInvite;
