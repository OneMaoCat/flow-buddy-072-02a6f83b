import { Plus, Library, Compass, Code2, Settings, MessageCircle, ChevronLeft } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: Library, label: "库", active: false },
  { icon: Compass, label: "发现", active: true },
  { icon: Code2, label: "开发应用", active: false },
];

const conversations = [
  { title: "修复用户登录页表单验证 Bug", hasNotif: true },
  { title: "重构订单模块支付流程", hasNotif: false },
  { title: "搭建后台管理系统页面", hasNotif: true },
  { title: "优化首页加载性能至 2s 内", hasNotif: false },
  { title: "编写用户权限模块单元测试", hasNotif: false },
];

interface DeepFlowSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DeepFlowSidebar = ({ collapsed, onToggle }: DeepFlowSidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col border-r border-border
          bg-sidebar transition-all duration-300 ease-in-out
          ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0" : "w-[280px]"}
        `}
      >
        <div className="flex-1 flex flex-col min-h-0 w-[280px]">
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-sm font-bold">DF</span>
            </div>
            <span className="text-[15px] font-semibold text-foreground">DeepFlow 工作助手</span>
            <button
              onClick={onToggle}
              className="ml-auto p-1 rounded-md hover:bg-deep-sidebar-hover transition-colors"
            >
              <ChevronLeft size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* New button */}
          <div className="px-4 mb-3">
            <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-deep-sidebar-hover transition-colors">
              <Plus size={16} />
              新建
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 mb-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`
                  w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors mb-0.5
                  ${item.active
                    ? "bg-deep-sidebar-active text-deep-sidebar-active-text font-medium"
                    : "text-sidebar-foreground hover:bg-deep-sidebar-hover"
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Conversations */}
          <div className="flex-1 min-h-0 px-3 overflow-y-auto scrollbar-hide">
            <p className="px-3 text-xs text-muted-foreground font-medium mb-2">今天</p>
            {conversations.map((conv, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-sidebar-foreground hover:bg-deep-sidebar-hover transition-colors mb-0.5 text-left"
              >
                <MessageCircle size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{conv.title}</span>
                {conv.hasNotif && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>免费次数: 93</span>
              <button className="text-primary hover:underline font-medium">升级购买</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
                李
              </div>
              <span className="text-sm text-foreground flex-1">李娟娟</span>
              <button className="p-1.5 rounded-md hover:bg-deep-sidebar-hover transition-colors">
                <Settings size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DeepFlowSidebar;
