import type { Papel } from "@/generated/prisma/enums";

/**
 * Quem pode ver os detalhes (e anexos) de uma O.S.: admin, qualquer
 * Supervisor/Diretor/Despesas (todos têm visão de rede completa hoje -
 * ver PainelNav), ou um Solicitante cuja loja seja uma das lojas da O.S.
 * (cada loja tem seu próprio login - ver lib/dal.ts) - mantemos também
 * "quem abriu" como fallback pra não quebrar um solicitante sem loja
 * vinculada que já tenha uma O.S. antiga.
 */
export function podeVerOS(
  usuario: { id: string; papel: Papel; usuarioLojas?: { loja: { id: string } }[] },
  os: { solicitanteId: string; lojaId?: string },
) {
  if (
    usuario.papel === "admin" ||
    usuario.papel === "supervisor" ||
    usuario.papel === "diretor_dono" ||
    usuario.papel === "despesas"
  ) {
    return true;
  }
  if (usuario.id === os.solicitanteId) return true;
  if (os.lojaId && usuario.usuarioLojas) {
    return usuario.usuarioLojas.some((ul) => ul.loja.id === os.lojaId);
  }
  return false;
}
