import { NextResponse } from "next/server";
import { obterUsuarioApi } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const usuario = await obterUsuarioApi(request);
  if (!usuario) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const setorIds = usuario.usuarioSetores.map((us) => us.setor.id);

  const where: Prisma.OrdemServicoWhereInput | null =
    usuario.papel === "supervisor"
      ? { status: "aguardando_supervisor", setorId: { in: setorIds } }
      : usuario.papel === "diretor_dono"
        ? { status: "aguardando_diretoria" }
        : usuario.papel === "admin"
          ? { status: { in: ["aguardando_supervisor", "aguardando_diretoria"] } }
          : null;

  if (!where) {
    return NextResponse.json({ nome: usuario.nome, papel: usuario.papel, total: 0, pendentes: [] });
  }

  const ordens = await prisma.ordemServico.findMany({
    where,
    orderBy: { criadoEm: "asc" },
    select: {
      numero: true,
      titulo: true,
      prioridade: true,
      loja: { select: { nome: true } },
      orcamentos: { where: { selecionado: true }, take: 1, select: { valor: true } },
    },
  });

  return NextResponse.json({
    nome: usuario.nome,
    papel: usuario.papel,
    total: ordens.length,
    pendentes: ordens.map((os) => ({
      numero: os.numero,
      titulo: os.titulo,
      loja: os.loja.nome,
      prioridade: os.prioridade,
      valor: os.orcamentos[0]?.valor ?? null,
    })),
  });
}
