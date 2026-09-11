"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/password";

const PapelSchema = z.enum([
  "solicitante",
  "supervisor",
  "diretor_dono",
  "despesas",
  "admin",
]);

const NovoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  telefone: z.string().trim().optional(),
  senha: z.string().min(8, { error: "A senha precisa ter ao menos 8 caracteres." }),
  papel: PapelSchema,
  setorIds: z.array(z.string()).default([]),
  lojaIds: z.array(z.string()).default([]),
});

export type NovoUsuarioState = { erro?: string; sucesso?: boolean } | undefined;

export async function criarUsuario(
  _prevState: NovoUsuarioState,
  formData: FormData,
): Promise<NovoUsuarioState> {
  // Só Admin pode criar usuário - checagem obrigatória aqui dentro, não
  // basta esconder o link no menu (Server Actions são endpoints públicos).
  await exigirAdmin();

  const validado = NovoUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone") || undefined,
    senha: formData.get("senha"),
    papel: formData.get("papel"),
    setorIds: formData.getAll("setorIds"),
    lojaIds: formData.getAll("lojaIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, email, telefone, senha, papel, setorIds, lojaIds } = validado.data;

  const jaExiste = await prisma.usuario.findUnique({ where: { email } });
  if (jaExiste) {
    return { erro: "Já existe um usuário com esse e-mail." };
  }

  const senhaHash = await hashSenha(senha);

  await prisma.usuario.create({
    data: {
      nome,
      email,
      telefone,
      senhaHash,
      papel,
      usuarioSetores: { create: setorIds.map((setorId) => ({ setorId })) },
      usuarioLojas: { create: lojaIds.map((lojaId) => ({ lojaId })) },
    },
  });

  revalidatePath("/admin/usuarios");
  return { sucesso: true };
}

export async function alternarAtivo(usuarioId: string, ativo: boolean) {
  await exigirAdmin();
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { ativo },
  });
  revalidatePath("/admin/usuarios");
}

const EditarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  telefone: z.string().trim().optional(),
  novaSenha: z
    .union([z.string().length(0), z.string().min(8)])
    .optional()
    .refine((v) => v === undefined || v.length === 0 || v.length >= 8, {
      error: "A nova senha precisa ter ao menos 8 caracteres.",
    }),
  papel: PapelSchema,
  setorIds: z.array(z.string()).default([]),
  lojaIds: z.array(z.string()).default([]),
});

export type EditarUsuarioState = { erro?: string; sucesso?: boolean } | undefined;

export async function editarUsuario(
  usuarioId: string,
  _prevState: EditarUsuarioState,
  formData: FormData,
): Promise<EditarUsuarioState> {
  await exigirAdmin();

  const validado = EditarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone") || undefined,
    novaSenha: formData.get("novaSenha") ?? "",
    papel: formData.get("papel"),
    setorIds: formData.getAll("setorIds"),
    lojaIds: formData.getAll("lojaIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, email, telefone, novaSenha, papel, setorIds, lojaIds } = validado.data;

  const jaExiste = await prisma.usuario.findUnique({ where: { email } });
  if (jaExiste && jaExiste.id !== usuarioId) {
    return { erro: "Já existe outro usuário com esse e-mail." };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      nome,
      email,
      telefone,
      papel,
      ...(novaSenha ? { senhaHash: await hashSenha(novaSenha) } : {}),
      // Substitui o escopo inteiro (mais simples e sem risco de duplicar
      // vínculo do que tentar calcular um "diff" entre o que já tinha).
      usuarioSetores: {
        deleteMany: {},
        create: setorIds.map((setorId) => ({ setorId })),
      },
      usuarioLojas: {
        deleteMany: {},
        create: lojaIds.map((lojaId) => ({ lojaId })),
      },
    },
  });

  revalidatePath("/admin/usuarios");
  return { sucesso: true };
}
