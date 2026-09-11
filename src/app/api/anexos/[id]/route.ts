import { NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { lerAnexo } from "@/lib/anexos";
import { podeVerOS } from "@/lib/os-permissoes";

function nomeParaContentDisposition(nome: string) {
  const ascii = nome.replace(/[^\x20-\x7E]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // getUsuarioAtual redireciona pra /login se não houver sessão - ok aqui
  // porque esse endpoint é sempre acessado por navegação direta (link/nova
  // aba), nunca por fetch() de JS.
  const usuario = await getUsuarioAtual();

  const anexo = await prisma.anexo.findUnique({
    where: { id },
    include: { ordemServico: { select: { solicitanteId: true } } },
  });
  if (!anexo) {
    return new NextResponse("Anexo não encontrado.", { status: 404 });
  }
  if (!podeVerOS(usuario, anexo.ordemServico)) {
    return new NextResponse("Sem permissão para ver este anexo.", { status: 403 });
  }

  const conteudo = await lerAnexo(anexo.caminhoArquivo);

  return new NextResponse(conteudo, {
    headers: {
      "Content-Type": anexo.tipoMime,
      "Content-Disposition": nomeParaContentDisposition(anexo.nomeArquivo),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
