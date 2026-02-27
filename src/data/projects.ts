export interface ProjectMember {
  id: string;
  name: string;
  avatar: string; // single character for avatar circle
  role: "owner" | "editor" | "viewer";
}

export interface TestCase {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  duration?: number; // ms
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: ProjectMember[];
  status: "active" | "archived" | "draft";
  createdAt: string;
  techStack: string[];
}

export const mockMembers: ProjectMember[] = [
  { id: "m1", name: "李娟娟", avatar: "李", role: "owner" },
  { id: "m2", name: "张伟", avatar: "张", role: "editor" },
  { id: "m3", name: "王芳", avatar: "王", role: "viewer" },
  { id: "m4", name: "陈明", avatar: "陈", role: "editor" },
];

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "电商平台 v2.0",
    description: "全新改版的电商平台，包含商品管理、订单系统、支付集成和用户中心模块。",
    members: [mockMembers[0], mockMembers[1], mockMembers[2]],
    status: "active",
    createdAt: "2026-02-20",
    techStack: ["React", "TypeScript", "Tailwind"],
  },
  {
    id: "proj-2",
    name: "内部管理后台",
    description: "公司内部使用的管理系统，涵盖员工管理、考勤、审批和报表模块。",
    members: [mockMembers[0], mockMembers[3]],
    status: "active",
    createdAt: "2026-02-15",
    techStack: ["React", "TypeScript", "Ant Design"],
  },
  {
    id: "proj-3",
    name: "移动端 H5 活动页",
    description: "营销活动落地页，支持抽奖、分享裂变和数据埋点。",
    members: [mockMembers[0], mockMembers[1], mockMembers[2], mockMembers[3]],
    status: "draft",
    createdAt: "2026-02-25",
    techStack: ["React", "TypeScript", "Framer Motion"],
  },
];

export const generateMockTests = (projectName: string): TestCase[] => [
  { id: "t1", name: `${projectName} - 页面渲染测试`, status: "pending" },
  { id: "t2", name: `${projectName} - 表单验证测试`, status: "pending" },
  { id: "t3", name: `${projectName} - API 接口集成测试`, status: "pending" },
  { id: "t4", name: `${projectName} - 用户权限校验测试`, status: "pending" },
  { id: "t5", name: `${projectName} - 响应式布局测试`, status: "pending" },
  { id: "t6", name: `${projectName} - 性能基准测试`, status: "pending" },
];
