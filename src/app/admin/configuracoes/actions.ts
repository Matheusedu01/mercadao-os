"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { Prioridade } from "@/generated/prisma/enums";

export async function atualizarSla(prioridade: Prioridade, formData: FormData) {
  await exigirAdmin();
  const dias = Number(formData.get(`dias_${prioridade}`));
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
    throw new Error("SLA precisa ser um número de dias entre 1 e 30.");
  }
  await prisma.slaPrioridade.update({ where: { prioridade }, data: { dias } });
  revalidatePath("/admin/configuracoes");
}

const ConfigSchema = z.object({
  lembreteWhatsappAtivo: z.coerce.boolean(),
  lembreteWhatsappDias: z.coerce.number().int().min(1).max(30),
  notificacaoEmailAtivo: z.coerce.boolean(),
  resumoDiarioDiretoriaAtivo: z.coerce.boolean(),
});

export async function atualizarNotificacoes(formData: FormData) {
  await exigirAdmin();

  const validado = ConfigSchema.parse({
    lembreteWhatsappAtivo: formData.get("lembreteWhatsappAtivo") === "on",
    lembreteWhatsappDias: formData.get("lembreteWhatsappDias"),
    notificacaoEmailAtivo: formData.get("notificacaoEmailAtivo") === "on",
    resumoDiarioDiretoriaAtivo: formData.get("resumoDiarioDiretoriaAtivo") === "on",
  });

  await prisma.configSistema.update({ where: { id: "default" }, data: validado });
  revalidatePath("/admin/configuracoes");
}
