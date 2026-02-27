import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockProjects } from "@/data/projects";

const Projects = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to first project
    if (mockProjects.length > 0) {
      navigate(`/project/${mockProjects[0].id}`, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">正在跳转...</p>
    </div>
  );
};

export default Projects;
