import type { Papel } from "@/generated/prisma/enums";

/**
 * Quem pode ver os detalhes (e anexos) de uma O.S.: admin, quem abriu,
 * ou qualquer Supervisor/Diretor/Despesas (todos têm visão de rede
 * completa hoje - ver PainelNav).
 */
export function podeVerOS(
  usuario: { id: string; papel: Papel },
  os: { solicitanteId: string },
) {
  return (
    usuario.papel === "admin" ||
    usuario.id === os.solicitanteId ||
    usuario.papel === "supervisor" ||
    usuario.papel === "diretor_dono" ||
    usuario.papel === "despesas"
  );
}
