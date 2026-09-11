import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { PainelNav } from "@/components/painel-nav";
import { RelatoriosConteudo } from "@/components/relatorios-conteudo";

export const metadata: Metadata = { title: "Relatórios — Mercadão O.S." };

export default async function RelatoriosPapelPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const usuario = await getUsuarioAtual();
  if (usuario.papel === "admin") redirect("/admin/relatorios");
  if (usuario.papel !== "supervisor" && usuario.papel !== "diretor_dono") redirect("/");

  const { periodo = "30" } = await searchParams;

  const contexto = usuario.papel === "diretor_dono" ? "Rede completa" : usuario.usuarioSetores.map((us) => us.setor.nome).join(", ") || "—";

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <PainelNav papel={usuario.papel} nome={usuario.nome} contexto={contexto} />
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <RelatoriosConteudo periodo={periodo} />
        </div>
      </div>
    </div>
  );
}
