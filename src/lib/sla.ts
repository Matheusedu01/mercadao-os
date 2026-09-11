import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prioridade, StatusOS } from "@/generated/prisma/enums";

const STATUS_PENDENTES: StatusOS[] = ["aguardando_supervisor", "aguardando_diretoria"];

export async function obterSlaPorPrioridade(): Promise<Record<Prioridade, number>> {
  const linhas = await prisma.slaPrioridade.findMany();
  const mapa = {} as Record<Prioridade, number>;
  for (const l of linhas) mapa[l.prioridade] = l.dias;
  return mapa;
}

/**
 * Uma O.S. está "vencida" quando ainda está aguardando decisão (etapa 1
 * ou 2) e já passou do prazo configurado em Configurações > SLA por
 * prioridade, contado a partir da abertura. Simplificação deliberada:
 * conta desde criadoEm, não separadamente por etapa - mais simples de
 * entender e evita uma consulta extra ao histórico por O.S.
 */
export function estaVencida(
  os: { status: StatusOS; criadoEm: Date },
  slaPorPrioridade: Record<Prioridade, number>,
  prioridade: Prioridade,
): boolean {
  if (!STATUS_PENDENTES.includes(os.status)) return false;
  const diasAberta = (Date.now() - os.criadoEm.getTime()) / (1000 * 60 * 60 * 24);
  return diasAberta > (slaPorPrioridade[prioridade] ?? Infinity);
}
