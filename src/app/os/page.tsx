import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/formato";
import { OSLista } from "@/components/os-lista";
import { PainelNav } from "@/components/painel-nav";
import type { Prisma, Prioridade, StatusOS } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Todas as O.S. — Mercadão O.S." };

const SELECT_LISTA = {
  numero: true,
  titulo: true,
  status: true,
  prioridade: true,
  loja: { select: { nome: true } },
  setor: { select: { nome: true } },
  orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } },
} as const;

const STATUS_FILTROS = [
  { valor: "", label: "Todas" },
  ...(Object.keys(STATUS_LABEL) as StatusOS[]).map((valor) => ({ valor, label: STATUS_LABEL[valor] })),
];

const PRIORIDADES = [
  { valor: "", label: "Todas" },
  { valor: "baixa", label: "Baixa" },
  { valor: "media", label: "Média" },
  { valor: "alta", label: "Alta" },
  { valor: "urgente", label: "Urgente" },
] as const;

function chipClasse(ativo: boolean) {
  return `shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
    ativo
      ? "border-charcoal bg-charcoal text-white"
      : "border-border bg-white text-text-2 hover:bg-background"
  }`;
}

export default async function TodasOSPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string; busca?: string }>;
}) {
  const usuario = await getUsuarioAtual();
  if (usuario.papel === "admin") redirect("/admin/visao-geral");
  if (usuario.papel !== "supervisor" && usuario.papel !== "diretor_dono") redirect("/");

  const { status = "", prioridade = "", busca = "" } = await searchParams;

  const where: Prisma.OrdemServicoWhereInput = {
    ...(status && { status: status as StatusOS }),
    ...(prioridade && { prioridade: prioridade as Prioridade }),
    ...(busca && { titulo: { contains: busca, mode: "insensitive" } }),
  };

  const itens = await prisma.ordemServico.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    select: SELECT_LISTA,
    take: 200,
  });

  const contexto =
    usuario.papel === "diretor_dono"
      ? "Rede completa"
      : usuario.usuarioSetores.map((us) => us.setor.nome).join(", ") || "—";

  const query = (novos: Record<string, string>) =>
    `/os?${new URLSearchParams({ status, prioridade, busca, ...novos }).toString()}`;

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <PainelNav papel={usuario.papel} nome={usuario.nome} contexto={contexto} />
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Todas as O.S.</h1>
            <p className="mt-1 text-sm text-text-2">
              Todas as ordens de serviço da rede, em qualquer etapa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTROS.map((f) => (
              <Link key={f.valor} href={query({ status: f.valor })} className={chipClasse(status === f.valor)}>
                {f.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRIORIDADES.map((p) => (
              <Link
                key={p.valor}
                href={query({ prioridade: p.valor })}
                className={chipClasse(prioridade === p.valor)}
              >
                {p.label}
              </Link>
            ))}
            <form method="GET" className="ml-auto flex items-center gap-2">
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="prioridade" value={prioridade} />
              <input
                type="search"
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por título..."
                className="w-56 rounded-[9px] border border-border px-3 py-2 text-sm outline-none focus:border-orange"
              />
            </form>
          </div>

          <OSLista titulo="Ordens de serviço" itens={itens} />
        </div>
      </div>
    </div>
  );
}
