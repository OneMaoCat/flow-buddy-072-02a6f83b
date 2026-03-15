// ---------- Diff Types ----------
export type DiffLineType = "add" | "del" | "ctx";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffComment {
  id: string;
  author: string;
  avatar: string;
  color: string;
  content: string;
  createdAt: string;
  lineIndex: number; // index in DiffLine[]
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  comments: DiffComment[];
}

// ---------- Mock diff templates by file extension ----------
const tsxDiffTemplates: { path: string; lines: DiffLine[] }[] = [
  {
    path: "src/components/LoginForm.tsx",
    lines: [
      { type: "ctx", content: "import { useState } from 'react';", oldLine: 1, newLine: 1 },
      { type: "ctx", content: "import { Button } from '@/components/ui/button';", oldLine: 2, newLine: 2 },
      { type: "del", content: "import { Input } from '@/components/ui/input';", oldLine: 3 },
      { type: "add", content: "import { Input } from '@/components/ui/input';", newLine: 3 },
      { type: "add", content: "import { validateEmail, validatePassword } from '@/lib/validators';", newLine: 4 },
      { type: "add", content: "import { toast } from 'sonner';", newLine: 5 },
      { type: "ctx", content: "", oldLine: 4, newLine: 6 },
      { type: "ctx", content: "export const LoginForm = () => {", oldLine: 5, newLine: 7 },
      { type: "ctx", content: "  const [email, setEmail] = useState('');", oldLine: 6, newLine: 8 },
      { type: "ctx", content: "  const [password, setPassword] = useState('');", oldLine: 7, newLine: 9 },
      { type: "del", content: "  const [error, setError] = useState('');", oldLine: 8 },
      { type: "add", content: "  const [errors, setErrors] = useState<Record<string, string>>({});", newLine: 10 },
      { type: "add", content: "  const [isSubmitting, setIsSubmitting] = useState(false);", newLine: 11 },
      { type: "ctx", content: "", oldLine: 9, newLine: 12 },
      { type: "del", content: "  const handleSubmit = () => {", oldLine: 10 },
      { type: "del", content: "    if (!email || !password) {", oldLine: 11 },
      { type: "del", content: "      setError('请填写完整');", oldLine: 12 },
      { type: "del", content: "      return;", oldLine: 13 },
      { type: "del", content: "    }", oldLine: 14 },
      { type: "del", content: "    // TODO: call API", oldLine: 15 },
      { type: "del", content: "  };", oldLine: 16 },
      { type: "add", content: "  const handleSubmit = async () => {", newLine: 13 },
      { type: "add", content: "    const newErrors: Record<string, string> = {};", newLine: 14 },
      { type: "add", content: "    if (!validateEmail(email)) {", newLine: 15 },
      { type: "add", content: "      newErrors.email = '请输入有效的邮箱地址';", newLine: 16 },
      { type: "add", content: "    }", newLine: 17 },
      { type: "add", content: "    if (!validatePassword(password)) {", newLine: 18 },
      { type: "add", content: "      newErrors.password = '密码至少8位，包含字母和数字';", newLine: 19 },
      { type: "add", content: "    }", newLine: 20 },
      { type: "add", content: "    if (Object.keys(newErrors).length > 0) {", newLine: 21 },
      { type: "add", content: "      setErrors(newErrors);", newLine: 22 },
      { type: "add", content: "      return;", newLine: 23 },
      { type: "add", content: "    }", newLine: 24 },
      { type: "add", content: "    setIsSubmitting(true);", newLine: 25 },
      { type: "add", content: "    try {", newLine: 26 },
      { type: "add", content: "      await authApi.login({ email, password });", newLine: 27 },
      { type: "add", content: "      toast.success('登录成功');", newLine: 28 },
      { type: "add", content: "    } catch (err) {", newLine: 29 },
      { type: "add", content: "      toast.error('登录失败，请检查账号密码');", newLine: 30 },
      { type: "add", content: "    } finally {", newLine: 31 },
      { type: "add", content: "      setIsSubmitting(false);", newLine: 32 },
      { type: "add", content: "    }", newLine: 33 },
      { type: "add", content: "  };", newLine: 34 },
      { type: "ctx", content: "", oldLine: 17, newLine: 35 },
      { type: "ctx", content: "  return (", oldLine: 18, newLine: 36 },
    ],
  },
  {
    path: "src/lib/validators.ts",
    lines: [
      { type: "add", content: "export const validateEmail = (email: string): boolean => {", newLine: 1 },
      { type: "add", content: "  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;", newLine: 2 },
      { type: "add", content: "  return emailRegex.test(email);", newLine: 3 },
      { type: "add", content: "};", newLine: 4 },
      { type: "add", content: "", newLine: 5 },
      { type: "add", content: "export const validatePassword = (password: string): boolean => {", newLine: 6 },
      { type: "add", content: "  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\\d/.test(password);", newLine: 7 },
      { type: "add", content: "};", newLine: 8 },
    ],
  },
  {
    path: "src/components/FormErrorTip.tsx",
    lines: [
      { type: "add", content: "import { AlertCircle } from 'lucide-react';", newLine: 1 },
      { type: "add", content: "", newLine: 2 },
      { type: "add", content: "interface FormErrorTipProps {", newLine: 3 },
      { type: "add", content: "  message: string;", newLine: 4 },
      { type: "add", content: "}", newLine: 5 },
      { type: "add", content: "", newLine: 6 },
      { type: "add", content: "export const FormErrorTip = ({ message }: FormErrorTipProps) => {", newLine: 7 },
      { type: "add", content: "  return (", newLine: 8 },
      { type: "add", content: "    <div className=\"flex items-center gap-1.5 text-destructive text-xs mt-1\">", newLine: 9 },
      { type: "add", content: "      <AlertCircle size={12} />", newLine: 10 },
      { type: "add", content: "      <span>{message}</span>", newLine: 11 },
      { type: "add", content: "    </div>", newLine: 12 },
      { type: "add", content: "  );", newLine: 13 },
      { type: "add", content: "};", newLine: 14 },
    ],
  },
];

const apiDiffTemplates: { path: string; lines: DiffLine[] }[] = [
  {
    path: "src/api/auth.ts",
    lines: [
      { type: "ctx", content: "import { supabase } from '@/lib/supabase';", oldLine: 1, newLine: 1 },
      { type: "ctx", content: "", oldLine: 2, newLine: 2 },
      { type: "del", content: "export const login = async (email: string, password: string) => {", oldLine: 3 },
      { type: "del", content: "  const { data, error } = await supabase.auth.signInWithPassword({", oldLine: 4 },
      { type: "del", content: "    email, password", oldLine: 5 },
      { type: "del", content: "  });", oldLine: 6 },
      { type: "del", content: "  if (error) throw error;", oldLine: 7 },
      { type: "del", content: "  return data;", oldLine: 8 },
      { type: "del", content: "};", oldLine: 9 },
      { type: "add", content: "interface LoginParams {", newLine: 3 },
      { type: "add", content: "  email: string;", newLine: 4 },
      { type: "add", content: "  password: string;", newLine: 5 },
      { type: "add", content: "}", newLine: 6 },
      { type: "add", content: "", newLine: 7 },
      { type: "add", content: "export const login = async ({ email, password }: LoginParams) => {", newLine: 8 },
      { type: "add", content: "  const { data, error } = await supabase.auth.signInWithPassword({", newLine: 9 },
      { type: "add", content: "    email,", newLine: 10 },
      { type: "add", content: "    password,", newLine: 11 },
      { type: "add", content: "  });", newLine: 12 },
      { type: "add", content: "", newLine: 13 },
      { type: "add", content: "  if (error) {", newLine: 14 },
      { type: "add", content: "    console.error('[Auth] Login failed:', error.message);", newLine: 15 },
      { type: "add", content: "    throw new Error(error.message);", newLine: 16 },
      { type: "add", content: "  }", newLine: 17 },
      { type: "add", content: "", newLine: 18 },
      { type: "add", content: "  return data;", newLine: 19 },
      { type: "add", content: "};", newLine: 20 },
      { type: "ctx", content: "", oldLine: 10, newLine: 21 },
      { type: "add", content: "export const logout = async () => {", newLine: 22 },
      { type: "add", content: "  await supabase.auth.signOut();", newLine: 23 },
      { type: "add", content: "};", newLine: 24 },
    ],
  },
  {
    path: "src/types/auth.ts",
    lines: [
      { type: "add", content: "export interface User {", newLine: 1 },
      { type: "add", content: "  id: string;", newLine: 2 },
      { type: "add", content: "  email: string;", newLine: 3 },
      { type: "add", content: "  displayName?: string;", newLine: 4 },
      { type: "add", content: "  avatar?: string;", newLine: 5 },
      { type: "add", content: "  role: 'admin' | 'user';", newLine: 6 },
      { type: "add", content: "  createdAt: string;", newLine: 7 },
      { type: "add", content: "}", newLine: 8 },
    ],
  },
];

const dbDiffTemplates: { path: string; lines: DiffLine[] }[] = [
  {
    path: "supabase/migrations/20240301_users.sql",
    lines: [
      { type: "add", content: "CREATE TABLE IF NOT EXISTS public.users (", newLine: 1 },
      { type: "add", content: "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),", newLine: 2 },
      { type: "add", content: "  email TEXT UNIQUE NOT NULL,", newLine: 3 },
      { type: "add", content: "  display_name TEXT,", newLine: 4 },
      { type: "add", content: "  avatar_url TEXT,", newLine: 5 },
      { type: "add", content: "  role TEXT DEFAULT 'user',", newLine: 6 },
      { type: "add", content: "  created_at TIMESTAMPTZ DEFAULT now(),", newLine: 7 },
      { type: "add", content: "  updated_at TIMESTAMPTZ DEFAULT now()", newLine: 8 },
      { type: "add", content: ");", newLine: 9 },
      { type: "add", content: "", newLine: 10 },
      { type: "add", content: "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;", newLine: 11 },
      { type: "add", content: "", newLine: 12 },
      { type: "add", content: "CREATE POLICY \"Users can read own data\"", newLine: 13 },
      { type: "add", content: "  ON public.users FOR SELECT", newLine: 14 },
      { type: "add", content: "  USING (auth.uid() = id);", newLine: 15 },
    ],
  },
];

const testDiffTemplates: { path: string; lines: DiffLine[] }[] = [
  {
    path: "src/__tests__/login.test.ts",
    lines: [
      { type: "add", content: "import { describe, it, expect } from 'vitest';", newLine: 1 },
      { type: "add", content: "import { validateEmail, validatePassword } from '@/lib/validators';", newLine: 2 },
      { type: "add", content: "", newLine: 3 },
      { type: "add", content: "describe('validateEmail', () => {", newLine: 4 },
      { type: "add", content: "  it('should accept valid email', () => {", newLine: 5 },
      { type: "add", content: "    expect(validateEmail('user@example.com')).toBe(true);", newLine: 6 },
      { type: "add", content: "  });", newLine: 7 },
      { type: "add", content: "", newLine: 8 },
      { type: "add", content: "  it('should reject invalid email', () => {", newLine: 9 },
      { type: "add", content: "    expect(validateEmail('not-an-email')).toBe(false);", newLine: 10 },
      { type: "add", content: "  });", newLine: 11 },
      { type: "add", content: "});", newLine: 12 },
      { type: "add", content: "", newLine: 13 },
      { type: "add", content: "describe('validatePassword', () => {", newLine: 14 },
      { type: "add", content: "  it('should accept strong password', () => {", newLine: 15 },
      { type: "add", content: "    expect(validatePassword('MyPass123')).toBe(true);", newLine: 16 },
      { type: "add", content: "  });", newLine: 17 },
      { type: "add", content: "", newLine: 18 },
      { type: "add", content: "  it('should reject weak password', () => {", newLine: 19 },
      { type: "add", content: "    expect(validatePassword('123')).toBe(false);", newLine: 20 },
      { type: "add", content: "  });", newLine: 21 },
      { type: "add", content: "});", newLine: 22 },
    ],
  },
];

const allTemplateGroups = [tsxDiffTemplates, apiDiffTemplates, dbDiffTemplates, testDiffTemplates];

const mockComments: Omit<DiffComment, "id" | "lineIndex">[] = [
  { author: "李泽龙", avatar: "李", color: "bg-violet-500", content: "这里建议把正则表达式提取为常量，方便复用", createdAt: "10 分钟前" },
  { author: "沈楚城", avatar: "沈", color: "bg-orange-500", content: "错误处理的逻辑可以更细粒度，区分网络错误和认证错误", createdAt: "5 分钟前" },
  { author: "李娟娟", avatar: "李", color: "bg-emerald-500", content: "LGTM 👍", createdAt: "2 分钟前" },
];

// Compute additions/deletions from lines
const computeStats = (lines: DiffLine[]) => ({
  additions: lines.filter(l => l.type === "add").length,
  deletions: lines.filter(l => l.type === "del").length,
});

// ---------- Generate diff files for a requirement ----------
export const generateDiffForRequirement = (req: { id: string; agents: { icon: string }[] }): DiffFile[] => {
  // Pick templates based on agent icons
  const icons = new Set(req.agents.map(a => a.icon));
  const candidates: { path: string; lines: DiffLine[] }[] = [];

  if (icons.has("ui") || icons.has("code")) candidates.push(...tsxDiffTemplates);
  if (icons.has("api")) candidates.push(...apiDiffTemplates);
  if (icons.has("db")) candidates.push(...dbDiffTemplates);
  if (icons.has("test")) candidates.push(...testDiffTemplates);

  // Fallback
  if (candidates.length === 0) {
    candidates.push(...tsxDiffTemplates.slice(0, 2));
  }

  // Pick 2-4 files
  const seed = parseInt(req.id.replace(/\D/g, "") || "1", 10);
  const count = 2 + (seed % 3);
  const selected = candidates.slice(0, count);

  return selected.map((tpl, i) => {
    const stats = computeStats(tpl.lines);
    // Add 0-1 mock comments
    const comments: DiffComment[] = [];
    if (i === 0 && tpl.lines.length > 8) {
      const addLines = tpl.lines.map((l, idx) => ({ l, idx })).filter(x => x.l.type === "add");
      if (addLines.length > 2) {
        const targetIdx = addLines[Math.floor(addLines.length / 2)].idx;
        const mc = mockComments[seed % mockComments.length];
        comments.push({ ...mc, id: `${req.id}-c${i}`, lineIndex: targetIdx });
      }
    }
    return { path: tpl.path, additions: stats.additions, deletions: stats.deletions, lines: tpl.lines, comments };
  });
};
