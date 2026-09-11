import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Data Access Layer - centraliza a verificacao de sessao.
 *
 * `cache()` garante que, mesmo se varios componentes chamarem
 * verificarSessao() durante a mesma renderizacao, o cookie so e
 * decodificado uma vez.
 */
export const verificarSessao = cache(async () => {
  const session = await lerSessao();

  if (!session?.usuarioId) {
    redirect("/login");
  }

  return session;
});

/** Dados completos e atuais do usuario logado (checagem "segura", direto no banco). */
export const getUsuarioAtual = cache(async () => {
  const session = await verificarSessao();

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      ativo: true,
      usuarioLojas: { select: { loja: { select: { id: true, nome: true } } } },
      usuarioSetores: { select: { setor: { select: { id: true, nome: true } } } },
    },
  });

  if (!usuario || !usuario.ativo) {
    redirect("/login");
  }

  return usuario;
});

/** Use em paginas/actions restritas ao papel Admin. */
export async function exigirAdmin() {
  const usuario = await getUsuarioAtual();
  if (usuario.papel !== "admin") {
    redirect("/");
  }
  return usuario;
}
