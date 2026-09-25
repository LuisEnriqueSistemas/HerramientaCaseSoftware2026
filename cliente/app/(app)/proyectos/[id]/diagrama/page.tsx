"use client";

import { use } from "react";
import { UmlDiagramView } from "@/components/uml/uml-diagram-view";

interface DiagramaPageProps {
  params: Promise<{ id: string }>;
}

export default function DiagramaPage({ params }: DiagramaPageProps) {
  const { id } = use(params);
  return <UmlDiagramView projectId={id} />;
}