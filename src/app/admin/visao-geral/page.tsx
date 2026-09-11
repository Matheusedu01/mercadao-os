import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatarMoeda,
  PRIORIDADE_COR,
  PRIORIDADE_LABEL,
  STATUS_COR,
  STATUS_LABEL,
} from "@/lib/formato";
import { estaVencida, obterSlaPorPrioridade } from "@/lib/sla";
import type { StatusOS } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Visão Geral — Mercadão O.S." };

const STATUS_PENDENTES: StatusOS[] = ["aguardando_supervisor", "aguardando_diretoria"];

export default async function VisaoGeralPage({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string; status?: string }>;
}) {
  const { setor: setorId, status } = await searchParams;
  const ehFiltroVencidas = status === "vencida";

  const [setores, slaPorPrioridade, ordensBrutas, totalVencidas] = await Promise.all([
    prisma.setor.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, _count: { select: { ordensServico: true } } },
    }),
    obterSlaPorPrioridade(),
    prisma.ordemServico.findMany({
      where: {
        setorId: setorId || undefined,
        ...(ehFiltroVencidas
          ? { status: { in: STATUS_PENDENTES } }
          : { status: (status as StatusOS) || undefined }),
      },
      orderBy: { criadoEm: "desc" },
      select: {
        numero: true,
        titulo: true,
        status: true,
        prioridade: true,
        criadoEm: true,
        loja: { select: { nome: true } },
        setor: { select: { nome: true } },
        solicitante: { select: { nome: true } },
        orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } },
      },
    }),
    // Contagem de vencidas pra badge do filtro - independe do setor selecionado.
    prisma.ordemServico.findMany({
      where: { status: { in: STATUS_PENDENTES } },
      select: { status: true, criadoEm: true, prioridade: true },
    }),
  ]);

  const ordens = ehFiltroVencidas
    ? ordensBrutas.filter((os) => estaVencida(os, slaPorPrioridade, os.prioridade))
    : ordensBrutas;

  const qtdVencidas = totalVencidas.filter((os) =>
    estaVencida(os, slaPorPrioridade, os.prioridade),
  ).length;

  const totalGeral = setores.reduce((soma, s) => soma + s._count.ordensServico, 0);

  const linkFiltro = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    if (params.setor) usp.set("setor", params.setor);
    if (params.status) usp.set("status", params.status);
    const qs = usp.toString();
    return `/admin/visao-geral${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex h-screen flex-col gap-6 overflow-hidden px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Visão Geral — Todas as O.S.
          </h1>
          <p className="mt-1 text-sm text-text-2">Todos os chamados da rede, em qualquer etapa.</p>
        </div>
        <Link
          href="/os/novo"
          className="rounded-[10px] bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + Nova O.S.
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <Link
          href={linkFiltro({ setor: setorId, status: ehFiltroVencidas ? undefined : "vencida" })}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
            ehFiltroVencidas
              ? "border-[#B91C1C] bg-[#FDEAEA] text-[#B91C1C]"
              : "border-border bg-white text-text-2"
          }`}
        >
          Vencidas (SLA) {qtdVencidas > 0 && `· ${qtdVencidas}`}
        </Link>
        {(
          [
            "aguardando_supervisor",
            "aguardando_diretoria",
            "em_execucao",
            "concluido",
            "rejeitado",
            "ajuste_solicitado",
          ] as const
        ).map((s) => (
          <Link
            key={s}
            href={linkFiltro({ setor: setorId, status: status === s ? undefined : s })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              status === s ? STATUS_COR[s] : "bg-white text-text-2"
            } border border-border`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr] gap-5">
        <div className="overflow-y-auto rounded-2xl border border-border bg-white p-3">
          <span className="block px-2 pb-2 text-[10.5px] font-bold tracking-wide text-text-3">
            SETORES
          </span>
          <Link
            href={linkFiltro({ setor: undefined, status })}
            className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-xs ${
              !setorId ? "bg-orange-tint font-bold text-orange-dark" : "text-text-2"
            }`}
          >
            <span>Todos</span>
            <span>{totalGeral}</span>
          </Link>
          {setores.map((s) => (
            <Link
              key={s.id}
              href={linkFiltro({ setor: setorId === s.id ? undefined : s.id, status })}
              className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-xs ${
                setorId === s.id ? "bg-orange-tint font-bold text-orange-dark" : "text-text-2"
              }`}
            >
              <span>{s.nome}</span>
              <span>{s._count.ordensServico}</span>
            </Link>
          ))}
        </div>

        <div className="overflow-y-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-border text-left text-[10.5px] font-bold uppercase text-text-3">
                <th className="px-4 py-3">O.S.</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((os) => {
                const vencida = estaVencida(os, slaPorPrioridade, os.prioridade);
                return (
                  <tr key={os.numero} className="border-b border-border last:border-none">
                    <td className="px-4 py-3">
                      <Link
                        href={`/os/${os.numero}`}
                        className="font-semibold text-orange-dark hover:underline"
                      >
                        #{os.numero}
                      </Link>
                      <span className="ml-2 text-text-2">{os.titulo}</span>
                      {vencida && (
                        <span className="ml-2 rounded-full bg-[#FDEAEA] px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]">
                          Atrasada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-2">{os.loja.nome}</td>
                    <td className="px-4 py-3 text-text-2">{os.setor.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_COR[os.status]}`}>
                        {STATUS_LABEL[os.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${PRIORIDADE_COR[os.prioridade]}`}
                      >
                        {PRIORIDADE_LABEL[os.prioridade]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-2">{os.solicitante.nome}</td>
                    <td className="px-4 py-3 font-bold">
                      {os.orcamentos[0] ? formatarMoeda(os.orcamentos[0].valor) : "—"}
                    </td>
                  </tr>
                );
              })}
              {ordens.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-3">
                    Nenhuma O.S. encontrada com esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
