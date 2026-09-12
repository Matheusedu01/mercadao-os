import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PainelNav } from "@/components/painel-nav";
import { ordenarPorCodigo } from "@/lib/lojas";
import { NovaOSForm } from "./nova-os-form";

export const metadata: Metadata = { title: "Abrir Nova O.S. — Mercadão O.S." };

export default async function NovaOSPage() {
  const usuario = await getUsuarioAtual();
  if (usuario.papel === "admin") redirect("/admin/visao-geral");

  const lojaIds = usuario.usuarioLojas.map((ul) => ul.loja.id);

  const lojas = ordenarPorCodigo(
    await prisma.loja.findMany({
      where: { id: { in: lojaIds }, ativo: true },
      select: {
        id: true,
        nome: true,
        codigo: true,
        lojaSetores: { select: { setor: { select: { id: true, nome: true } } } },
      },
    }),
  );

  const setoresPorLoja: Record<string, { id: string; nome: string }[]> = {};
  for (const loja of lojas) {
    setoresPorLoja[loja.id] = loja.lojaSetores.map((ls) => ls.setor);
  }

  const contexto =
    usuario.papel === "diretor_dono"
      ? "Rede completa"
      : usuario.papel === "solicitante"
        ? (usuario.usuarioLojas[0]?.loja.nome ?? "—")
        : usuario.usuarioSetores.map((us) => us.setor.nome).join(", ") || "—";

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <PainelNav papel={usuario.papel} nome={usuario.nome} contexto={contexto} />
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <h1 className="font-display text-2xl font-bold text-foreground">Abrir Nova O.S.</h1>
          <p className="mt-1 text-sm text-text-2">
            Descreva a obra, manutenção ou despesa que precisa de aprovação.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            {lojas.length === 0 ? (
              <p className="text-sm text-text-2">
                Você ainda não está associado a nenhuma loja. Peça para um administrador
                configurar seu acesso em Usuários &amp; Permissões.
              </p>
            ) : (
              <NovaOSForm lojas={lojas} setoresPorLoja={setoresPorLoja} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
