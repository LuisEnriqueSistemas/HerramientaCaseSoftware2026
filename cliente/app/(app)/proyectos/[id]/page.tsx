"use client";

import { use } from "react";
import { ProjectDetailContent } from "@/components/projects/project-detail-content";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  return <ProjectDetailContent projectId={id} />;
}