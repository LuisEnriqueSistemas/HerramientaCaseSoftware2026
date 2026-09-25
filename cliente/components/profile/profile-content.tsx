"use client";

import { LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UpdateProfileForm } from "@/components/forms/update-profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteAccount, useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function ProfileContent() {
  const { data: user, isLoading, isError, refetch } = useProfile();
  const deleteAccount = useDeleteAccount();
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      clearSession();
      toast.success("Tu cuenta fue eliminada correctamente.");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-zinc-400" aria-hidden />
        <span className="sr-only">Cargando tu perfil...</span>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-sm text-zinc-500">
            No pudimos cargar tu perfil. Puede que la sesión haya expirado.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCw aria-hidden />
              Reintentar
            </Button>
            <Button asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <PageHeader
          title="Tu perfil"
          description="Consulta y actualiza tu información personal."
        />

        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
            <CardDescription>Modifica los campos que deseas actualizar.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm user={user} />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Zona de peligro</CardTitle>
            <CardDescription>
              Al eliminar tu cuenta se borrará tu información de forma definitiva. Esta
              acción no se puede deshacer.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 aria-hidden />
                  Eliminar cuenta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
                  <DialogDescription>
                    Se borrará toda tu información de la aplicación. Esta acción no se
                    puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteAccount.isPending}
                    onClick={() => void handleDeleteAccount()}
                  >
                    {deleteAccount.isPending ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}