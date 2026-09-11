"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/password";
import { criarSessao } from "@/lib/session";

const LoginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  senha: z.string().min(1, { error: "Informe a senha." }),
});

export type LoginState = { erro?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const validado = LoginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!validado.success) {
    return { erro: "Informe um e-mail e senha válidos." };
  }

  const { email, senha } = validado.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mensagem genérica de propósito: não revelar se o problema foi o
  // e-mail (não existe) ou a senha (errada) - evita que alguém use o
  // formulário de login pra descobrir quais e-mails têm conta no sistema.
  const credenciaisInvalidas = { erro: "Usuário ou senha inválidos." };

  if (!usuario || !usuario.ativo) {
    return credenciaisInvalidas;
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return credenciaisInvalidas;
  }

  await criarSessao({ id: usuario.id, papel: usuario.papel, nome: usuario.nome });
  redirect("/");
}
