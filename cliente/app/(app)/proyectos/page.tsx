import type { Metadata } from "next";
import { ProjectsContent } from "@/components/projects/projects-content";

export const metadata: Metadata = {
  title: "Mis proyectos",
};

export default function ProyectosPage() {
  return <ProjectsContent />;
}