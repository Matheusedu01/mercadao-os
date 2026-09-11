"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const NovaLojaSchema = z.object({
  codigo: z.string().trim().min(2, { error: "Informe um código (ex.: LJ17)." }),
  nome: z.string().trim().min(2, { error: "Informe o nome da loja." }),
  endereco: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  uf: z.string().trim().max(2).optional(),
  telefone: z.string().trim().optional(),
  gerenteId: z.string().optional(),
  setorIds: z.array(z.string()).default([]),
});

export type NovaLojaState = { erro?: string; sucesso?: boolean } | undefined;

export async function criarLoja(
  _prevState: NovaLojaState,
  formData: FormData,
): Promise<NovaLojaState> {
  await exigirAdmin();

  const validado = NovaLojaSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
    endereco: formData.get("endereco") || undefined,
    cidade: formData.get("cidade") || undefined,
    uf: formData.get("uf") || undefined,
    telefone: formData.get("telefone") || undefined,
    gerenteId: formData.get("gerenteId") || undefined,
    setorIds: formData.getAll("setorIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { codigo, nome, endereco, cidade, uf, telefone, gerenteId, setorIds } = validado.data;

  const jaExiste = await prisma.loja.findUnique({ where: { codigo } });
  if (jaExiste) {
    return { erro: "Já existe uma loja com esse código." };
  }

  await prisma.loja.create({
    data: {
      codigo,
      nome,
      endereco,
      cidade,
      uf: uf?.toUpperCase(),
      telefone,
      gerenteId: gerenteId || undefined,
      lojaSetores: { create: setorIds.map((setorId) => ({ setorId })) },
    },
  });

  revalidatePath("/admin/lojas");
  return { sucesso: true };
}

export async function alternarAtivoLoja(lojaId: string, ativo: boolean) {
  await exigirAdmin();
  await prisma.loja.update({ where: { id: lojaId }, data: { ativo } });
  revalidatePath("/admin/lojas");
}

const EditarLojaSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome da loja." }),
  endereco: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  uf: z.string().trim().max(2).optional(),
  telefone: z.string().trim().optional(),
  gerenteId: z.string().optional(),
  setorIds: z.array(z.string()).default([]),
});

export type EditarLojaState = { erro?: string; sucesso?: boolean } | undefined;

export async function editarLoja(
  lojaId: string,
  _prevState: EditarLojaState,
  formData: FormData,
): Promise<EditarLojaState> {
  await exigirAdmin();

  const validado = EditarLojaSchema.safeParse({
    nome: formData.get("nome"),
    endereco: formData.get("endereco") || undefined,
    cidade: formData.get("cidade") || undefined,
    uf: formData.get("uf") || undefined,
    telefone: formData.get("telefone") || undefined,
    gerenteId: formData.get("gerenteId") || undefined,
    setorIds: formData.getAll("setorIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, endereco, cidade, uf, telefone, gerenteId, setorIds } = validado.data;

  await prisma.loja.update({
    where: { id: lojaId },
    data: {
      nome,
      endereco,
      cidade,
      uf: uf?.toUpperCase(),
      telefone,
      gerenteId: gerenteId || null,
      lojaSetores: {
        deleteMany: {},
        create: setorIds.map((setorId) => ({ setorId })),
      },
    },
  });

  revalidatePath("/admin/lojas");
  return { sucesso: true };
}
