import type { Metadata } from "next";
import { InvitationsList } from "@/components/invitations/invitations-list";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Invitaciones",
};

export default function InvitacionesPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <PageHeader
          title="Invitaciones"
          description="Acepta o rechaza las invitaciones a proyectos de tus compañeros."
        />
        <InvitationsList />
      </div>
    </main>
  );
}