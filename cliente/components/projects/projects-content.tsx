"use client";

import { useProjects } from "@/hooks/use-projects";
import { PageHeader } from "@/components/layout/page-header";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";

export function ProjectsContent() {
  const projectsQuery = useProjects();
  const projects = projectsQuery.data ?? [];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <PageHeader
          title="Mis proyectos"
          description="Crea un proyecto y organiza a tus colaboradores."
        />

        <div className="flex flex-col gap-4">
          <div>
            <CreateProjectDialog />
          </div>

          {projectsQuery.isLoading ? (
            <p className="text-sm text-zinc-500">Cargando proyectos...</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-700">
                Aún no hay proyectos
              </p>
              <p className="max-w-sm text-sm text-zinc-500">
                Crea tu primer proyecto para comenzar a diseñar tu base de datos.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    memberRole={project.memberRole}
                    createdAt={project.createdAt}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}