import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { podeVerOS } from "@/lib/os-permissoes";
import { PainelNav } from "@/components/painel-nav";
import { editarOS } from "@/app/os/actions";
import { EditarOSForm } from "./editar-os-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Editar O.S. #${numero} — Mercadão O.S.` };
}

export default async function EditarOSPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero: numeroParam } = await params;
  const numero = Number(numeroParam);
  if (Number.isNaN(numero)) notFound();

  const usuario = await getUsuarioAtual();

  const os = await prisma.ordemServico.findUnique({
    where: { numero },
    include: { orcamentos: { orderBy: { criadoEm: "asc" } } },
  });
  if (!os) notFound();
  if (!podeVerOS(usuario, os)) notFound();

  // Qualquer loja da rede pode aparecer aqui - editar serve justamente pra
  // corrigir erro de cadastro (ex.: loja errada selecionada na abertura),
  // então não faz sentido restringir a lista às lojas do editor.
  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      codigo: true,
      lojaSetores: { select: { setor: { select: { id: true, nome: true } } } },
    },
  });

  const setoresPorLoja: Record<string, { id: string; nome: string }[]> = {};
  for (const loja of lojas) {
    setoresPorLoja[loja.id] = loja.lojaSetores.map((ls) => ls.setor);
  }

  const contexto =
    usuario.papel === "diretor_dono" || usuario.papel === "despesas"
      ? "Rede completa"
      : usuario.papel === "solicitante"
        ? (usuario.usuarioLojas[0]?.loja.nome ?? "—")
        : usuario.usuarioSetores.map((us) => us.setor.nome).join(", ") || "—";

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      {usuario.papel !== "admin" && (
        <PainelNav papel={usuario.papel} nome={usuario.nome} contexto={contexto} />
      )}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Editar O.S. #{os.numero}
          </h1>
          <p className="mt-1 text-sm text-text-2">
            Corrija os dados da solicitação — a mudança fica registrada no histórico.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <EditarOSForm
              action={editarOS.bind(null, os.numero)}
              lojas={lojas}
              setoresPorLoja={setoresPorLoja}
              valoresIniciais={{
                tipo: os.tipo,
                lojaId: os.lojaId,
                setorId: os.setorId,
                local: os.local,
                descricao: os.descricao,
                prioridade: os.prioridade,
                dataDesejada: os.dataDesejada
                  ? os.dataDesejada.toISOString().slice(0, 10)
                  : "",
                orcamentos: os.orcamentos.map((o) => ({
                  fornecedor: o.fornecedor,
                  valor: o.valor.toString(),
                  parcelas: o.parcelas,
                })),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
