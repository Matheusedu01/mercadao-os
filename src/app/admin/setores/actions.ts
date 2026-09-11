"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const NovoSetorSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome do setor." }),
  supervisorId: z.string().optional(),
  slaPadraoDias: z.coerce.number().int().min(1).max(30),
  lojaIds: z.array(z.string()).default([]),
});

export type NovoSetorState = { erro?: string; sucesso?: boolean } | undefined;

export async function criarSetor(
  _prevState: NovoSetorState,
  formData: FormData,
): Promise<NovoSetorState> {
  await exigirAdmin();

  const validado = NovoSetorSchema.safeParse({
    nome: formData.get("nome"),
    supervisorId: formData.get("supervisorId") || undefined,
    slaPadraoDias: formData.get("slaPadraoDias"),
    lojaIds: formData.getAll("lojaIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, supervisorId, slaPadraoDias, lojaIds } = validado.data;

  const jaExiste = await prisma.setor.findUnique({ where: { nome } });
  if (jaExiste) {
    return { erro: "Já existe um setor com esse nome." };
  }

  await prisma.setor.create({
    data: {
      nome,
      supervisorId: supervisorId || undefined,
      slaPadraoDias,
      lojaSetores: { create: lojaIds.map((lojaId) => ({ lojaId })) },
    },
  });

  revalidatePath("/admin/setores");
  return { sucesso: true };
}

export async function alternarAtivoSetor(setorId: string, ativo: boolean) {
  await exigirAdmin();
  await prisma.setor.update({ where: { id: setorId }, data: { ativo } });
  revalidatePath("/admin/setores");
}

const EditarSetorSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome do setor." }),
  supervisorId: z.string().optional(),
  slaPadraoDias: z.coerce.number().int().min(1).max(30),
  lojaIds: z.array(z.string()).default([]),
});

export type EditarSetorState = { erro?: string; sucesso?: boolean } | undefined;

export async function editarSetor(
  setorId: string,
  _prevState: EditarSetorState,
  formData: FormData,
): Promise<EditarSetorState> {
  await exigirAdmin();

  const validado = EditarSetorSchema.safeParse({
    nome: formData.get("nome"),
    supervisorId: formData.get("supervisorId") || undefined,
    slaPadraoDias: formData.get("slaPadraoDias"),
    lojaIds: formData.getAll("lojaIds"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, supervisorId, slaPadraoDias, lojaIds } = validado.data;

  await prisma.setor.update({
    where: { id: setorId },
    data: {
      nome,
      supervisorId: supervisorId || null,
      slaPadraoDias,
      lojaSetores: {
        deleteMany: {},
        create: lojaIds.map((lojaId) => ({ lojaId })),
      },
    },
  });

  revalidatePath("/admin/setores");
  return { sucesso: true };
}
