import { mockProjects, type Project } from "./projects";

// Simple mutable store for project data
let projects: Project[] = [...mockProjects];
const listeners: Set<() => void> = new Set();

const notify = () => listeners.forEach((fn) => fn());

export const projectStore = {
  getAll: () => projects,
  getById: (id: string) => projects.find((p) => p.id === id),
  rename: (id: string, newName: string) => {
    projects = projects.map((p) => (p.id === id ? { ...p, name: newName } : p));
    // Also update the source mock so other imports stay in sync
    const idx = mockProjects.findIndex((p) => p.id === id);
    if (idx !== -1) mockProjects[idx] = { ...mockProjects[idx], name: newName };
    notify();
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
