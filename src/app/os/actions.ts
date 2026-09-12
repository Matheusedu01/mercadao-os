"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/dal";
import { executarDecisao } from "@/lib/os-decisao";
import { salvarAnexo, TAMANHO_MAXIMO_BYTES, TIPOS_ACEITOS } from "@/lib/anexos";
import { podeVerOS } from "@/lib/os-permissoes";

const CriarOSSchema = z.object({
  tipo: z.enum(["obra", "manutencao", "despesa", "outro"]),
  lojaId: z.string().min(1),
  setorId: z.string().min(1),
  local: z.string().trim().min(2, { error: "Diga onde é a manutenção/despesa." }),
  descricao: z.string().trim().min(10, {
    error: "Descreva com um pouco mais de detalhe (mínimo 10 caracteres).",
  }),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
  dataDesejada: z.string().optional(),
});

export type CriarOSState = { erro?: string } | undefined;

export async function criarOS(
  _prevState: CriarOSState,
  formData: FormData,
): Promise<CriarOSState> {
  const usuario = await getUsuarioAtual();

  const validado = CriarOSSchema.safeParse({
    tipo: formData.get("tipo"),
    lojaId: formData.get("lojaId"),
    setorId: formData.get("setorId"),
    local: formData.get("local"),
    descricao: formData.get("descricao"),
    prioridade: formData.get("prioridade"),
    dataDesejada: formData.get("dataDesejada") || undefined,
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Os orçamentos vêm como listas paralelas (uma linha do formulário = um
  // índice em cada lista). getAll preserva a ordem de inserção no FormData,
  // então zipar por índice é seguro aqui.
  const fornecedores = formData.getAll("fornecedor").map((v) => String(v).trim());
  const valores = formData.getAll("valor").map((v) => String(v).trim());
  const parcelasLista = formData.getAll("parcelas").map((v) => String(v).trim());

  const orcamentos = fornecedores
    .map((fornecedor, i) => ({
      fornecedor,
      valor: valores[i],
      parcelas: parcelasLista[i] || "À vista",
    }))
    .filter((o) => o.fornecedor && o.valor);

  if (orcamentos.length === 0) {
    return { erro: "Anexe pelo menos um orçamento de fornecedor." };
  }

  const valoresInvalidos = orcamentos.some(
    (o) => Number.isNaN(Number(o.valor)) || Number(o.valor) <= 0,
  );
  if (valoresInvalidos) {
    return { erro: "Confira os valores dos orçamentos — precisam ser números maiores que zero." };
  }

  const loja = await prisma.loja.findUnique({ where: { id: validado.data.lojaId } });
  if (!loja) {
    return { erro: "Loja inválida." };
  }

  // Anexos são opcionais - filtra entradas vazias (input de arquivo sem
  // nada selecionado ainda manda uma entrada "File" vazia no FormData).
  const anexos = formData
    .getAll("anexos")
    .filter((v): v is File => v instanceof File && v.size > 0);

  const anexoGrandeDemais = anexos.find((f) => f.size > TAMANHO_MAXIMO_BYTES);
  if (anexoGrandeDemais) {
    return {
      erro: `"${anexoGrandeDemais.name}" passa de 15MB. Envie um arquivo menor.`,
    };
  }
  const anexoTipoInvalido = anexos.find((f) => !TIPOS_ACEITOS.has(f.type));
  if (anexoTipoInvalido) {
    return {
      erro: `"${anexoTipoInvalido.name}" não é um tipo aceito (use foto, PDF, Word ou Excel).`,
    };
  }

  // Título segue o padrão já usado pela rede: "LOJA - FORNECEDOR - LOCAL".
  // Gerado aqui no servidor (nunca a partir do que o cliente mandar pronto)
  // pra garantir que sempre reflita o primeiro orçamento de verdade.
  const titulo = `${loja.codigo}-${orcamentos[0].fornecedor.toUpperCase()}-${validado.data.local.toUpperCase()}`;

  const os = await prisma.ordemServico.create({
    data: {
      tipo: validado.data.tipo,
      titulo,
      local: validado.data.local,
      descricao: validado.data.descricao,
      prioridade: validado.data.prioridade,
      lojaId: validado.data.lojaId,
      setorId: validado.data.setorId,
      solicitanteId: usuario.id,
      dataDesejada: validado.data.dataDesejada
        ? new Date(validado.data.dataDesejada)
        : null,
      orcamentos: {
        create: orcamentos.map((o, i) => ({
          fornecedor: o.fornecedor,
          valor: o.valor,
          parcelas: o.parcelas,
          selecionado: i === 0,
        })),
      },
      historico: {
        create: {
          tipoEvento: "criado",
          autorId: usuario.id,
          descricao: `${usuario.nome} abriu a O.S.`,
        },
      },
    },
  });

  if (anexos.length > 0) {
    const salvos = await Promise.all(anexos.map((file) => salvarAnexo(os.id, file)));
    await prisma.anexo.createMany({
      data: salvos.map((s) => ({ ordemServicoId: os.id, enviadoPorId: usuario.id, ...s })),
    });
  }

  revalidatePath("/");
  redirect(`/os/${os.numero}`);
}

/**
 * Aprovar de um clique, direto na fila (sem entrar no detalhe). Só faz
 * sentido pra aprovação simples - rejeitar/pedir ajuste sempre exige
 * comentário, então continua exigindo passar pela tela de detalhe.
 */
export async function aprovarRapido(osNumero: number) {
  const usuario = await getUsuarioAtual();
  const resultado = await executarDecisao(usuario, { osNumero, decisao: "aprovado" });
  if (!resultado.ok) {
    throw new Error(resultado.erro);
  }
  revalidatePath("/");
  revalidatePath(`/os/${osNumero}`);
}

const DecisaoSchema = z.object({
  decisao: z.enum(["aprovado", "rejeitado", "ajuste_solicitado"]),
  comentario: z.string().trim().optional(),
  orcamentoSelecionadoId: z.string().optional(),
});

export type DecisaoState = { erro?: string } | undefined;

export async function decidirAprovacao(
  osNumero: number,
  _prevState: DecisaoState,
  formData: FormData,
): Promise<DecisaoState> {
  const usuario = await getUsuarioAtual();

  const validado = DecisaoSchema.safeParse({
    decisao: formData.get("decisao"),
    comentario: formData.get("comentario") || undefined,
    orcamentoSelecionadoId: formData.get("orcamentoSelecionadoId") || undefined,
  });
  if (!validado.success) {
    return { erro: "Decisão inválida." };
  }
  const resultado = await executarDecisao(usuario, { osNumero, ...validado.data });
  if (!resultado.ok) {
    return { erro: resultado.erro };
  }

  revalidatePath(`/os/${osNumero}`);
  revalidatePath("/");
  return undefined;
}

export async function marcarConcluido(osNumero: number, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (usuario.papel !== "despesas" && usuario.papel !== "admin") {
    throw new Error("Apenas Despesas ou o admin podem concluir uma O.S.");
  }

  const os = await prisma.ordemServico.findUnique({ where: { numero: osNumero } });
  if (!os || os.status !== "em_execucao") {
    throw new Error("Esta O.S. não está em execução.");
  }

  const comentario = String(formData.get("comentario") ?? "").trim() || undefined;
  const descricaoEvento = "conferiu a despesa e marcou a O.S. como concluída";

  await prisma.$transaction([
    prisma.ordemServico.update({
      where: { id: os.id },
      data: { status: "concluido", despesasId: usuario.id },
    }),
    prisma.historicoOS.create({
      data: {
        ordemServicoId: os.id,
        tipoEvento: "concluido",
        autorId: usuario.id,
        descricao: comentario
          ? `${usuario.nome} ${descricaoEvento}: "${comentario}"`
          : `${usuario.nome} ${descricaoEvento}`,
      },
    }),
  ]);

  revalidatePath(`/os/${osNumero}`);
  revalidatePath("/");
}

export type EditarOSState = { erro?: string } | undefined;

export async function editarOS(
  osNumero: number,
  _prevState: EditarOSState,
  formData: FormData,
): Promise<EditarOSState> {
  const usuario = await getUsuarioAtual();

  const os = await prisma.ordemServico.findUnique({ where: { numero: osNumero } });
  if (!os) {
    return { erro: "O.S. não encontrada." };
  }
  // Mesma regra de visibilidade da tela de detalhe - qualquer papel que
  // pode ver a O.S. pode corrigir um erro de cadastro nela.
  if (!podeVerOS(usuario, os)) {
    return { erro: "Você não tem permissão para editar esta O.S." };
  }

  const validado = CriarOSSchema.safeParse({
    tipo: formData.get("tipo"),
    lojaId: formData.get("lojaId"),
    setorId: formData.get("setorId"),
    local: formData.get("local"),
    descricao: formData.get("descricao"),
    prioridade: formData.get("prioridade"),
    dataDesejada: formData.get("dataDesejada") || undefined,
  });
  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const fornecedores = formData.getAll("fornecedor").map((v) => String(v).trim());
  const valores = formData.getAll("valor").map((v) => String(v).trim());
  const parcelasLista = formData.getAll("parcelas").map((v) => String(v).trim());

  const orcamentos = fornecedores
    .map((fornecedor, i) => ({
      fornecedor,
      valor: valores[i],
      parcelas: parcelasLista[i] || "À vista",
    }))
    .filter((o) => o.fornecedor && o.valor);

  if (orcamentos.length === 0) {
    return { erro: "Anexe pelo menos um orçamento de fornecedor." };
  }

  const valoresInvalidos = orcamentos.some(
    (o) => Number.isNaN(Number(o.valor)) || Number(o.valor) <= 0,
  );
  if (valoresInvalidos) {
    return { erro: "Confira os valores dos orçamentos — precisam ser números maiores que zero." };
  }

  const loja = await prisma.loja.findUnique({ where: { id: validado.data.lojaId } });
  if (!loja) {
    return { erro: "Loja inválida." };
  }

  const motivoEdicao = String(formData.get("motivoEdicao") ?? "").trim() || undefined;
  const titulo = `${loja.codigo}-${orcamentos[0].fornecedor.toUpperCase()}-${validado.data.local.toUpperCase()}`;

  await prisma.$transaction([
    prisma.ordemServico.update({
      where: { id: os.id },
      data: {
        tipo: validado.data.tipo,
        titulo,
        local: validado.data.local,
        descricao: validado.data.descricao,
        prioridade: validado.data.prioridade,
        lojaId: validado.data.lojaId,
        setorId: validado.data.setorId,
        dataDesejada: validado.data.dataDesejada
          ? new Date(validado.data.dataDesejada)
          : null,
      },
    }),
    prisma.orcamento.deleteMany({ where: { ordemServicoId: os.id } }),
    prisma.orcamento.createMany({
      data: orcamentos.map((o, i) => ({
        ordemServicoId: os.id,
        fornecedor: o.fornecedor,
        valor: o.valor,
        parcelas: o.parcelas,
        selecionado: i === 0,
      })),
    }),
    prisma.historicoOS.create({
      data: {
        ordemServicoId: os.id,
        tipoEvento: "editado",
        autorId: usuario.id,
        descricao: motivoEdicao
          ? `${usuario.nome} editou a O.S.: "${motivoEdicao}"`
          : `${usuario.nome} editou a O.S.`,
      },
    }),
  ]);

  revalidatePath(`/os/${osNumero}`);
  revalidatePath("/");
  revalidatePath("/os");
  redirect(`/os/${osNumero}`);
}

export async function reenviarParaAprovacao(osNumero: number) {
  const usuario = await getUsuarioAtual();
  const os = await prisma.ordemServico.findUnique({ where: { numero: osNumero } });
  if (!os) throw new Error("O.S. não encontrada.");
  if (os.solicitanteId !== usuario.id && usuario.papel !== "admin") {
    throw new Error("Só quem abriu a O.S. pode reenviá-la.");
  }
  if (os.status !== "ajuste_solicitado") {
    throw new Error("Esta O.S. não está aguardando ajuste.");
  }

  await prisma.$transaction([
    prisma.ordemServico.update({
      where: { id: os.id },
      data: { status: "aguardando_supervisor" },
    }),
    prisma.historicoOS.create({
      data: {
        ordemServicoId: os.id,
        tipoEvento: "reenviado",
        autorId: usuario.id,
        descricao: `${usuario.nome} reenviou a O.S. para aprovação`,
      },
    }),
  ]);

  revalidatePath(`/os/${osNumero}`);
  revalidatePath("/");
}
