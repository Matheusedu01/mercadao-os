import { NextResponse } from "next/server";
import * as z from "zod";
import { obterUsuarioApi } from "@/lib/api-auth";
import { executarDecisao } from "@/lib/os-decisao";

const CorpoSchema = z.object({
  numero: z.number().int().positive(),
  decisao: z.enum(["aprovado", "rejeitado", "ajuste_solicitado"]),
  comentario: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const usuario = await obterUsuarioApi(request);
  if (!usuario) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  const validado = CorpoSchema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  // Pela extensão só dá pra aprovar/rejeitar o orçamento já selecionado
  // hoje na O.S. (sem a tela de comparação lado a lado) - por isso não
  // reenvia orcamentoSelecionadoId aqui, só mantém o que já estava.
  const resultado = await executarDecisao(usuario, {
    osNumero: validado.data.numero,
    decisao: validado.data.decisao,
    comentario: validado.data.comentario,
  });

  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 422 });
  }

  return NextResponse.json({ ok: true });
}
