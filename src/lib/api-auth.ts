import "server-only";
import { decrypt, lerSessao } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Igual a getUsuarioAtual() da DAL, mas pra uso em Route Handlers (API):
 * retorna null em vez de redirecionar pra /login, porque quem está do
 * outro lado é código (site OU a extensão de navegador), não um
 * navegador esperando uma tela de login.
 *
 * A extensão não consegue contar com o cookie httpOnly da mesma forma
 * que o site (chamada entre origens diferentes) - por isso ela manda o
 * token de sessão manualmente no header X-Session-Token, lido via
 * chrome.cookies no background script dela. Aceitamos os dois caminhos
 * aqui, validando com a mesma chave/algoritmo de sempre.
 */
export async function obterUsuarioApi(request: Request) {
  const tokenHeader = request.headers.get("x-session-token") ?? undefined;
  const session = tokenHeader ? await decrypt(tokenHeader) : await lerSessao();

  if (!session?.usuarioId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      ativo: true,
      usuarioSetores: { select: { setor: { select: { id: true } } } },
    },
  });

  if (!usuario || !usuario.ativo) return null;
  return usuario;
}
