import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPEL_LABEL } from "@/lib/papel";
import { formatarMoeda } from "@/lib/formato";
import { OSLista } from "@/components/os-lista";
import { PainelNav } from "@/components/painel-nav";
import { FiltroLojaSelect } from "@/components/filtro-loja-select";
import type { Prisma, Prioridade } from "@/generated/prisma/client";

const SELECT_LISTA = {
  numero: true,
  titulo: true,
  status: true,
  prioridade: true,
  loja: { select: { nome: true } },
  setor: { select: { nome: true } },
  orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } },
} as const;

const FILTROS_SOLICITANTE = [
  { valor: "", label: "Todas" },
  { valor: "aguardando", label: "Aguardando aprovação" },
  { valor: "em_execucao", label: "Em execução" },
  { valor: "concluido", label: "Concluídas" },
  { valor: "problema", label: "Rejeitadas / Ajuste" },
] as const;

function statusPorFiltro(filtro: string): Prisma.OrdemServicoWhereInput {
  switch (filtro) {
    case "aguardando":
      return { status: { in: ["aguardando_supervisor", "aguardando_diretoria"] } };
    case "em_execucao":
      return { status: "em_execucao" };
    case "concluido":
      return { status: "concluido" };
    case "problema":
      return { status: { in: ["rejeitado", "ajuste_solicitado"] } };
    default:
      return {};
  }
}

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

async function obterMetricasSolicitante(lojaIds: string[], inicioMes: Date) {
  const [aguardando, emExecucao, concluidasEsteMes, ajuste] = await Promise.all([
    prisma.ordemServico.count({
      where: { lojaId: { in: lojaIds }, status: { in: ["aguardando_supervisor", "aguardando_diretoria"] } },
    }),
    prisma.ordemServico.count({ where: { lojaId: { in: lojaIds }, status: "em_execucao" } }),
    prisma.ordemServico.count({
      where: { lojaId: { in: lojaIds }, status: "concluido", atualizadoEm: { gte: inicioMes } },
    }),
    prisma.ordemServico.count({ where: { lojaId: { in: lojaIds }, status: "ajuste_solicitado" } }),
  ]);
  return { aguardando, emExecucao, concluidasEsteMes, ajuste };
}

async function obterAprovacoesDecididas(aprovadorId: string, etapa: "supervisor" | "diretor") {
  return prisma.aprovacao.findMany({
    where: { aprovadorId, etapa, decisao: "aprovado" },
    select: { decididoEm: true, ordemServico: { select: { criadoEm: true } } },
  });
}

async function obterValorAprovadoEsteMes(aprovadorId: string, etapa: "supervisor" | "diretor", inicioMes: Date) {
  const aprovacoes = await prisma.aprovacao.findMany({
    where: { aprovadorId, etapa, decisao: "aprovado", decididoEm: { gte: inicioMes } },
    select: {
      ordemServico: {
        select: { orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } } },
      },
    },
  });
  return aprovacoes.reduce((soma, a) => soma + Number(a.ordemServico.orcamentos[0]?.valor ?? 0), 0);
}

function MetricCard({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string | number;
  destaque?: "orange" | "green";
}) {
  const corValor =
    destaque === "orange" ? "text-orange-dark" : destaque === "green" ? "text-green-700" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs text-text-2">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${corValor}`}>{valor}</p>
    </div>
  );
}

function CampoBusca({ busca, camposOcultos }: { busca: string; camposOcultos?: Record<string, string> }) {
  return (
    <form method="GET" className="ml-auto flex items-center gap-2">
      {camposOcultos &&
        Object.entries(camposOcultos)
          .filter(([, v]) => v)
          .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input
        type="search"
        name="busca"
        defaultValue={busca}
        placeholder="Buscar por título..."
        className="w-56 rounded-[9px] border border-border px-3 py-2 text-sm outline-none focus:border-orange"
      />
    </form>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string; busca?: string; loja?: string }>;
}) {
  const usuario = await getUsuarioAtual();
  if (usuario.papel === "admin") redirect("/admin/visao-geral");
  const setorIds = usuario.usuarioSetores.map((us) => us.setor.id);
  const lojaIds = usuario.usuarioLojas.map((ul) => ul.loja.id);

  const { status = "", prioridade = "", busca = "", loja = "" } = await searchParams;
  const filtroBusca: Prisma.OrdemServicoWhereInput = busca
    ? { titulo: { contains: busca, mode: "insensitive" } }
    : {};
  const filtroPrioridade: Prisma.OrdemServicoWhereInput = prioridade
    ? { prioridade: prioridade as Prioridade }
    : {};
  const filtroLoja: Prisma.OrdemServicoWhereInput = loja ? { lojaId: loja } : {};

  // Filtro de loja só faz sentido pra quem enxerga a rede inteira - o
  // solicitante já é travado nas lojas do próprio login (ver lojaIds acima).
  const podeFiltrarPorLoja =
    usuario.papel === "supervisor" || usuario.papel === "diretor_dono" || usuario.papel === "despesas";
  const lojasParaFiltro = podeFiltrarPorLoja
    ? await prisma.loja.findMany({
        where: { ativo: true },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, codigo: true },
      })
    : [];

  const itensSupervisor =
    usuario.papel === "supervisor"
      ? await prisma.ordemServico.findMany({
          where: {
            status: "aguardando_supervisor",
            setorId: { in: setorIds },
            ...filtroPrioridade,
            ...filtroBusca,
            ...filtroLoja,
          },
          orderBy: { criadoEm: "asc" },
          select: SELECT_LISTA,
        })
      : null;

  const itensDiretor =
    usuario.papel === "diretor_dono"
      ? await prisma.ordemServico.findMany({
          where: { status: "aguardando_diretoria", ...filtroPrioridade, ...filtroBusca, ...filtroLoja },
          orderBy: { criadoEm: "asc" },
          select: SELECT_LISTA,
        })
      : null;

  const itensDespesas =
    usuario.papel === "despesas"
      ? await prisma.ordemServico.findMany({
          where: { status: "em_execucao", ...filtroBusca, ...filtroLoja },
          orderBy: { criadoEm: "asc" },
          select: SELECT_LISTA,
        })
      : null;

  const contexto =
    usuario.papel === "diretor_dono" || usuario.papel === "despesas"
      ? "Rede completa"
      : usuario.papel === "solicitante"
        ? (usuario.usuarioLojas[0]?.loja.nome ?? "—")
        : usuario.usuarioSetores.map((us) => us.setor.nome).join(", ") || "—";

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const metricasSolicitante =
    usuario.papel === "solicitante" ? await obterMetricasSolicitante(lojaIds, inicioMes) : null;

  const metricasSupervisor =
    usuario.papel === "supervisor" && itensSupervisor
      ? await (async () => {
          const valorPendente = itensSupervisor.reduce(
            (soma, os) => soma + Number(os.orcamentos[0]?.valor ?? 0),
            0,
          );
          const aprovacoes = await obterAprovacoesDecididas(usuario.id, "supervisor");
          const aprovadasEsteMes = aprovacoes.filter((a) => a.decididoEm >= inicioMes).length;
          const tempoMedioDias =
            aprovacoes.length > 0
              ? aprovacoes.reduce(
                  (soma, a) =>
                    soma + (a.decididoEm.getTime() - a.ordemServico.criadoEm.getTime()) / 86_400_000,
                  0,
                ) / aprovacoes.length
              : 0;
          return { valorPendente, aprovadasEsteMes, tempoMedioDias };
        })()
      : null;

  const metricasDiretor =
    usuario.papel === "diretor_dono" && itensDiretor
      ? {
          valorPendente: itensDiretor.reduce((soma, os) => soma + Number(os.orcamentos[0]?.valor ?? 0), 0),
          maiorPendente: itensDiretor.reduce(
            (max, os) => Math.max(max, Number(os.orcamentos[0]?.valor ?? 0)),
            0,
          ),
          aprovadoEsteMes: await obterValorAprovadoEsteMes(usuario.id, "diretor", inicioMes),
        }
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <PainelNav
        papel={usuario.papel}
        nome={usuario.nome}
        contexto={contexto}
        badge={itensSupervisor?.length ?? itensDiretor?.length ?? itensDespesas?.length ?? undefined}
      />
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Olá, {usuario.nome.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-text-2">{PAPEL_LABEL[usuario.papel]}</p>
            </div>
            <Link
              href="/os/novo"
              className="rounded-[10px] bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              + Abrir Nova O.S.
            </Link>
          </div>

          {usuario.papel === "solicitante" && metricasSolicitante && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard label="Aguardando aprovação" valor={metricasSolicitante.aguardando} />
                <MetricCard label="Em execução" valor={metricasSolicitante.emExecucao} />
                <MetricCard
                  label="Concluídas este mês"
                  valor={metricasSolicitante.concluidasEsteMes}
                  destaque="green"
                />
                <MetricCard label="Ajuste solicitado" valor={metricasSolicitante.ajuste} destaque="orange" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {FILTROS_SOLICITANTE.map((f) => (
                  <Link
                    key={f.valor}
                    href={`/?${new URLSearchParams({ ...(f.valor && { status: f.valor }), ...(busca && { busca }) }).toString()}`}
                    className={chipClasse(status === f.valor)}
                  >
                    {f.label}
                  </Link>
                ))}
                <CampoBusca busca={busca} camposOcultos={{ status }} />
              </div>
              <OSLista
                titulo="O.S. da loja"
                itens={await prisma.ordemServico.findMany({
                  where: { lojaId: { in: lojaIds }, ...statusPorFiltro(status), ...filtroBusca },
                  orderBy: { criadoEm: "desc" },
                  select: SELECT_LISTA,
                })}
              />
            </>
          )}

          {usuario.papel === "supervisor" && itensSupervisor && metricasSupervisor && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard label="Aguardando minha aprovação" valor={itensSupervisor.length} />
                <MetricCard
                  label="Valor total pendente"
                  valor={formatarMoeda(metricasSupervisor.valorPendente)}
                  destaque="orange"
                />
                <MetricCard
                  label="Aprovadas este mês"
                  valor={metricasSupervisor.aprovadasEsteMes}
                  destaque="green"
                />
                <MetricCard
                  label="Tempo médio até decisão"
                  valor={`${metricasSupervisor.tempoMedioDias.toFixed(1)} dias`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PRIORIDADES.map((p) => (
                  <Link
                    key={p.valor}
                    href={`/?${new URLSearchParams({ ...(p.valor && { prioridade: p.valor }), ...(busca && { busca }), ...(loja && { loja }) }).toString()}`}
                    className={chipClasse(prioridade === p.valor)}
                  >
                    {p.label}
                  </Link>
                ))}
                <FiltroLojaSelect lojas={lojasParaFiltro} valor={loja} />
                <CampoBusca busca={busca} camposOcultos={{ prioridade, loja }} />
              </div>
              <OSLista
                titulo="Fila de Aprovação — Supervisor"
                permitirAprovarRapido
                itens={itensSupervisor}
              />
            </>
          )}

          {usuario.papel === "diretor_dono" && itensDiretor && metricasDiretor && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard label="Aguardando minha aprovação" valor={itensDiretor.length} />
                <MetricCard
                  label="Valor total pendente"
                  valor={formatarMoeda(metricasDiretor.valorPendente)}
                  destaque="orange"
                />
                <MetricCard
                  label="Aprovado este mês"
                  valor={formatarMoeda(metricasDiretor.aprovadoEsteMes)}
                  destaque="green"
                />
                <MetricCard
                  label="Maior solicitação pendente"
                  valor={formatarMoeda(metricasDiretor.maiorPendente)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PRIORIDADES.map((p) => (
                  <Link
                    key={p.valor}
                    href={`/?${new URLSearchParams({ ...(p.valor && { prioridade: p.valor }), ...(busca && { busca }), ...(loja && { loja }) }).toString()}`}
                    className={chipClasse(prioridade === p.valor)}
                  >
                    {p.label}
                  </Link>
                ))}
                <FiltroLojaSelect lojas={lojasParaFiltro} valor={loja} />
                <CampoBusca busca={busca} camposOcultos={{ prioridade, loja }} />
              </div>
              <OSLista
                titulo="Aprovações Finais — Diretor/Dono"
                permitirAprovarRapido
                itens={itensDiretor}
              />
            </>
          )}

          {usuario.papel === "despesas" && itensDespesas && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <FiltroLojaSelect lojas={lojasParaFiltro} valor={loja} />
                <CampoBusca busca={busca} camposOcultos={{ loja }} />
              </div>
              <OSLista titulo="Aguardando conferência de despesa" itens={itensDespesas} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
