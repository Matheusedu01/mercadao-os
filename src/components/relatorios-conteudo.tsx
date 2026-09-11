import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, STATUS_LABEL } from "@/lib/formato";
import type { StatusOS } from "@/generated/prisma/enums";

const CORES_STATUS: Record<StatusOS, string> = {
  concluido: "#0CA30C",
  em_execucao: "#2a78d6",
  aguardando_supervisor: "#fab219",
  aguardando_diretoria: "#fab219",
  ajuste_solicitado: "#eb6834",
  rejeitado: "#d03b3b",
};

const PERIODOS = [
  { valor: "7", label: "Últimos 7 dias" },
  { valor: "30", label: "Últimos 30 dias" },
  { valor: "90", label: "Últimos 90 dias" },
  { valor: "", label: "Tudo" },
] as const;

export async function RelatoriosConteudo({ periodo }: { periodo: string }) {
  const dias = periodo ? Number(periodo) : null;
  const dataLimite = dias ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000) : undefined;

  const ordens = await prisma.ordemServico.findMany({
    where: dataLimite ? { criadoEm: { gte: dataLimite } } : undefined,
    select: {
      status: true,
      criadoEm: true,
      loja: { select: { nome: true } },
      setor: { select: { nome: true } },
      orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } },
      aprovacoes: { orderBy: { decididoEm: "asc" }, take: 1, select: { decididoEm: true } },
    },
  });

  const totalOS = ordens.length;
  const valorPorOS = (os: (typeof ordens)[number]) => Number(os.orcamentos[0]?.valor ?? 0);

  const valorAprovado = ordens
    .filter((os) => os.status === "em_execucao" || os.status === "concluido")
    .reduce((soma, os) => soma + valorPorOS(os), 0);

  const comDecisao = ordens.filter((os) => os.aprovacoes[0]);
  const tempoMedioDias =
    comDecisao.length > 0
      ? comDecisao.reduce((soma, os) => {
          const dias =
            (os.aprovacoes[0]!.decididoEm.getTime() - os.criadoEm.getTime()) /
            (1000 * 60 * 60 * 24);
          return soma + dias;
        }, 0) / comDecisao.length
      : 0;

  const rejeitadas = ordens.filter((os) => os.status === "rejeitado").length;
  const taxaRejeicao = totalOS > 0 ? (rejeitadas / totalOS) * 100 : 0;

  const porLoja = new Map<string, number>();
  const porSetor = new Map<string, number>();
  for (const os of ordens) {
    const valor = valorPorOS(os);
    porLoja.set(os.loja.nome, (porLoja.get(os.loja.nome) ?? 0) + valor);
    porSetor.set(os.setor.nome, (porSetor.get(os.setor.nome) ?? 0) + valor);
  }
  const lojasOrdenadas = [...porLoja.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maiorValorLoja = lojasOrdenadas[0]?.[1] ?? 1;

  const porStatus = new Map<StatusOS, number>();
  for (const os of ordens) {
    porStatus.set(os.status, (porStatus.get(os.status) ?? 0) + 1);
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Relatórios Financeiros
          </h1>
          <p className="mt-1 text-sm text-text-2">
            Despesas, obras e manutenção aprovadas na rede.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.valor}
              href={p.valor ? `?periodo=${p.valor}` : "?periodo="}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                periodo === p.valor
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-border bg-white text-text-2 hover:bg-background"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-text-2">Total de O.S.</p>
          <p className="mt-2 font-display text-2xl font-bold">{totalOS}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-text-2">Valor aprovado</p>
          <p className="mt-2 font-display text-2xl font-bold text-orange-dark">
            {formatarMoeda(valorAprovado)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-text-2">Tempo médio até decisão</p>
          <p className="mt-2 font-display text-2xl font-bold">
            {tempoMedioDias.toFixed(1)} dias
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-text-2">Taxa de rejeição</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-700">
            {taxaRejeicao.toFixed(0)}%
          </p>
        </div>
      </div>

      {totalOS === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-text-3">
          Ainda não há O.S. suficientes para gerar os gráficos. Assim que o time começar a usar
          o sistema, os dados aparecem aqui automaticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-bold">Despesas por loja</h2>
            <div className="flex flex-col gap-3">
              {lojasOrdenadas.map(([nome, valor]) => (
                <div key={nome} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-text-2">{nome}</span>
                  <div className="h-3.5 flex-1 overflow-hidden rounded bg-background">
                    <div
                      className="h-full rounded bg-orange"
                      style={{ width: `${Math.max(4, (valor / maiorValorLoja) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-bold">
                    {formatarMoeda(valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-bold">Despesas por setor</h2>
            <div className="flex flex-col gap-3">
              {[...porSetor.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([nome, valor]) => (
                  <div key={nome} className="flex items-center justify-between text-sm">
                    <span className="text-text-2">{nome}</span>
                    <span className="font-bold">{formatarMoeda(valor)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 md:col-span-2">
            <h2 className="mb-4 font-display text-sm font-bold">
              Status das O.S. ({totalOS} no total)
            </h2>
            <div className="flex h-5 overflow-hidden rounded-full">
              {[...porStatus.entries()].map(([status, qtd]) => (
                <div
                  key={status}
                  style={{
                    width: `${(qtd / totalOS) * 100}%`,
                    background: CORES_STATUS[status],
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {[...porStatus.entries()].map(([status, qtd]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: CORES_STATUS[status] }}
                  />
                  <span className="text-text-2">{STATUS_LABEL[status]}</span>
                  <span className="font-bold">{qtd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
