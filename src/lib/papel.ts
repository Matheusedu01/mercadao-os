import type { Papel } from "@/generated/prisma/enums";

export const PAPEL_LABEL: Record<Papel, string> = {
  solicitante: "Solicitante",
  supervisor: "Supervisor",
  diretor_dono: "Diretor / Dono",
  despesas: "Despesas",
  admin: "Administrador",
};
