import type { Prioridade, StatusOS } from "@/generated/prisma/enums";

// Prisma representa campos @db.Decimal como um objeto Decimal (decimal.js),
// não como number/string direto - aceitamos qualquer coisa "stringificavel"
// pra nao precisar converter toda hora antes de chamar essa funcao.
type ValorMonetario = number | string | { toString(): string };

export function formatarMoeda(valor: ValorMonetario) {
  const numero = typeof valor === "number" ? valor : Number(valor.toString());
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarDataHora(data: Date) {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABEL: Record<StatusOS, string> = {
  aguardando_supervisor: "Aguardando Supervisor",
  aguardando_diretoria: "Aguardando Diretoria",
  em_execucao: "Em execução",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  ajuste_solicitado: "Ajuste solicitado",
};

export const STATUS_COR: Record<StatusOS, string> = {
  aguardando_supervisor: "bg-[#FFF4DE] text-[#92400E]",
  aguardando_diretoria: "bg-[#F1EEFE] text-[#5B21B6]",
  em_execucao: "bg-[#E6F0FE] text-[#1D4ED8]",
  concluido: "bg-[#E7F7EC] text-[#15803D]",
  rejeitado: "bg-[#FDEAEA] text-[#B91C1C]",
  ajuste_solicitado: "bg-[#FFEBD6] text-[#9A3B00]",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_COR: Record<Prioridade, string> = {
  baixa: "bg-[#E8ECEF] text-[#3E4448]",
  media: "bg-[#EFEEEC] text-[#5B5E62]",
  alta: "bg-[#FFF4DE] text-[#92400E]",
  urgente: "bg-[#FDEAEA] text-[#B91C1C]",
};
