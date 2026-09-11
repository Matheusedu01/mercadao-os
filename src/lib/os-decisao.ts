import "server-only";
import { prisma } from "@/lib/prisma";
import type { Papel } from "@/generated/prisma/enums";

/**
 * Núcleo da regra de aprovação — usado tanto pelo formulário do site
 * (src/app/os/actions.ts) quanto pela API da extensão de navegador
 * (src/app/api/extensao/decidir/route.ts). Mantido num só lugar de
 * propósito: essa é a regra mais sensível do sistema (quem pode aprovar
 * o quê), não faz sentido correr o risco de duas versões divergirem.
 */

type UsuarioParaDecisao = {
  id: string;
  nome: string;
  papel: Papel;
  usuarioSetores: { setor: { id: string } }[];
};

export type ResultadoDecisao =
  | { ok: true }
  | { ok: false; erro: string };

export async function executarDecisao(
  usuario: UsuarioParaDecisao,
  params: {
    osNumero: number;
    decisao: "aprovado" | "rejeitado" | "ajuste_solicitado";
    comentario?: string;
    orcamentoSelecionadoId?: string;
  },
): Promise<ResultadoDecisao> {
  const { osNumero, decisao, comentario, orcamentoSelecionadoId } = params;

  if (decisao !== "aprovado" && !comentario) {
    return {
      ok: false,
      erro: "Explique o motivo — o comentário é obrigatório para rejeitar ou pedir ajuste.",
    };
  }

  const os = await prisma.ordemServico.findUnique({
    where: { numero: osNumero },
    include: { orcamentos: true },
  });
  if (!os) {
    return { ok: false, erro: "O.S. não encontrada." };
  }

  let etapa: "supervisor" | "diretor";
  if (os.status === "aguardando_supervisor") {
    etapa = "supervisor";
    const autorizado =
      usuario.papel === "admin" ||
      (usuario.papel === "supervisor" &&
        usuario.usuarioSetores.some((us) => us.setor.id === os.setorId));
    if (!autorizado) {
      return { ok: false, erro: "Você não tem permissão para aprovar esta etapa." };
    }
  } else if (os.status === "aguardando_diretoria") {
    etapa = "diretor";
    const autorizado = usuario.papel === "admin" || usuario.papel === "diretor_dono";
    if (!autorizado) {
      return { ok: false, erro: "Você não tem permissão para aprovar esta etapa." };
    }
  } else {
    return { ok: false, erro: "Esta O.S. não está aguardando aprovação no momento." };
  }

  const proximoStatus =
    decisao === "aprovado"
      ? etapa === "supervisor"
        ? "aguardando_diretoria"
        : "em_execucao"
      : decisao === "rejeitado"
        ? "rejeitado"
        : "ajuste_solicitado";

  const descricaoEvento =
    decisao === "aprovado"
      ? `${usuario.nome} aprovou a etapa (${etapa === "supervisor" ? "Supervisor" : "Diretoria"})`
      : decisao === "rejeitado"
        ? `${usuario.nome} rejeitou a O.S.`
        : `${usuario.nome} pediu ajuste na O.S.`;

  await prisma.$transaction(async (tx) => {
    if (orcamentoSelecionadoId) {
      await tx.orcamento.updateMany({
        where: { ordemServicoId: os.id },
        data: { selecionado: false },
      });
      await tx.orcamento.update({
        where: { id: orcamentoSelecionadoId },
        data: { selecionado: true },
      });
    }

    await tx.ordemServico.update({
      where: { id: os.id },
      data: { status: proximoStatus },
    });

    await tx.aprovacao.create({
      data: {
        ordemServicoId: os.id,
        etapa,
        aprovadorId: usuario.id,
        decisao,
        comentario,
      },
    });

    await tx.historicoOS.create({
      data: {
        ordemServicoId: os.id,
        tipoEvento: "aprovacao",
        autorId: usuario.id,
        descricao: comentario ? `${descricaoEvento}: "${comentario}"` : descricaoEvento,
      },
    });
  });

  return { ok: true };
}
