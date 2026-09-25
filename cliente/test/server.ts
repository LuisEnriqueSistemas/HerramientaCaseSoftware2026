import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type {
  PendingInvitation,
  ProjectCreated,
  ProjectDetail,
  ProjectListItem,
  ProjectMember,
} from "@/lib/types";
import type { UmlDiagram } from "@/lib/uml-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const projectList: ProjectListItem[] = [
  {
    id: "proyecto-1",
    name: "Sistema de ventas",
    description: "Base de datos del módulo de ventas.",
    memberRole: "HOST",
    createdAt: "2026-01-10T12:00:00.000Z",
  },
  {
    id: "proyecto-2",
    name: "Catálogo",
    description: "Catálogo de productos.",
    memberRole: "EDITOR",
    createdAt: "2026-02-05T12:00:00.000Z",
  },
];

const projectDetail: ProjectDetail = {
  id: "proyecto-1",
  name: "Sistema de ventas",
  description: "Base de datos del módulo de ventas.",
  memberRole: "HOST",
  createdBy: "usuario-host",
  createdAt: "2026-01-10T12:00:00.000Z",
};

const projectMembers: ProjectMember[] = [
  {
    userId: "usuario-host",
    name: "Ana Torres",
    email: "ana@dominio.com",
    role: "HOST",
  },
  {
    userId: "usuario-editor",
    name: "Luis Pérez",
    email: "luis@dominio.com",
    role: "EDITOR",
  },
];

const pendingInvitations: PendingInvitation[] = [
  {
    id: "inv-1",
    projectId: "proyecto-2",
    projectName: "Catálogo",
    email: "luis@dominio.com",
    role: "EDITOR",
    status: "PENDING",
    createdAt: "2026-03-01T12:00:00.000Z",
  },
];

export const handlers = [
  http.get(`${API_URL}/projects`, () =>
    HttpResponse.json(projectList),
  ),
  http.post(`${API_URL}/projects`, async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
    };
    const created: ProjectCreated = {
      id: "proyecto-nuevo",
      name: body.name ?? "Proyecto nuevo",
      description: body.description ?? null,
      role: "HOST",
      createdAt: "2026-09-15T10:00:00.000Z",
    };
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${API_URL}/projects/:id`, () =>
    HttpResponse.json(projectDetail),
  ),
  http.delete(`${API_URL}/projects/:id`, () =>
    HttpResponse.json({ ok: true }),
  ),
  http.get(`${API_URL}/projects/:id/members`, () =>
    HttpResponse.json(projectMembers),
  ),
  http.get(`${API_URL}/invitations/pending`, () =>
    HttpResponse.json(pendingInvitations),
  ),
  http.post(`${API_URL}/invitations/:id/accept`, () =>
    HttpResponse.json(null, { status: 201 }),
  ),
  http.post(`${API_URL}/invitations/:id/reject`, () =>
    HttpResponse.json(null, { status: 201 }),
  ),
  http.get(`${API_URL}/projects/:id/diagram`, ({ params }) => {
    const diagram: UmlDiagram = {
      diagramId: "diagrama-1",
      projectId: String(params.id),
      version: 1,
      canEdit: true,
      nodes: [
        {
          id: "nodo-1",
          name: "Usuario",
          x: 80,
          y: 80,
          attributes: [
            { visibility: "private", name: "id", type: "uuid" },
            { visibility: "private", name: "email", type: "string" },
          ],
          methods: [{ visibility: "public", name: "autenticar", parameters: "credenciales: string", returnType: "boolean" }],
          updatedAt: "2026-09-15T10:00:00.000Z",
        },
      ],
      edges: [],
    };
    return HttpResponse.json(diagram);
  }),
];

export const server = setupServer(...handlers);
