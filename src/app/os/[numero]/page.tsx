import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { decidirAprovacao, marcarConcluido, reenviarParaAprovacao } from "@/app/os/actions";
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  PRIORIDADE_COR,
  PRIORIDADE_LABEL,
  STATUS_COR,
  STATUS_LABEL,
} from "@/lib/formato";
import { DecisaoPanel } from "./decisao-panel";
import { PainelNav } from "@/components/painel-nav";
import { podeVerOS } from "@/lib/os-permissoes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const { numero } = await params;
  return { title: `O.S. #${numero} — Mercadão O.S.` };
}

const ETAPAS = [
  { chave: "solicitado", label: "Solicitado" },
  { chave: "supervisor", label: "Supervisor" },
  { chave: "diretoria", label: "Diretoria" },
  { chave: "execucao", label: "Concluído" },
] as const;

export default async function DetalheOSPage({
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
    include: {
      loja: true,
      setor: true,
      solicitante: true,
      despesas: true,
      orcamentos: { orderBy: { criadoEm: "asc" } },
      historico: { orderBy: { criadoEm: "asc" }, include: { autor: true } },
      anexos: { orderBy: { criadoEm: "asc" }, include: { enviadoPor: true } },
    },
  });
  if (!os) notFound();

  const setorNoEscopo = usuario.usuarioSetores.some((us) => us.setor.id === os.setorId);

  if (!podeVerOS(usuario, os)) notFound();

  const podeDecidirEtapaSupervisor =
    os.status === "aguardando_supervisor" &&
    (usuario.papel === "admin" || (usuario.papel === "supervisor" && setorNoEscopo));
  const podeDecidirEtapaDiretor =
    os.status === "aguardando_diretoria" &&
    (usuario.papel === "admin" || usuario.papel === "diretor_dono");
  const podeDecidir = podeDecidirEtapaSupervisor || podeDecidirEtapaDiretor;

  const podeReenviar =
    os.status === "ajuste_solicitado" &&
    (usuario.id === os.solicitanteId || usuario.papel === "admin");
  const podeConcluir =
    os.status === "em_execucao" && (usuario.papel === "despesas" || usuario.papel === "admin");

  const etapaAtualIndex =
    os.status === "aguardando_supervisor"
      ? 2
      : os.status === "aguardando_diretoria"
        ? 3
        : os.status === "em_execucao"
          ? 4
          : 5; // concluido, rejeitado, ajuste_solicitado -> trata visualmente com o badge de status

  const contexto =
    usuario.papel === "diretor_dono"
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
          <div>
            <Link href="/" className="text-xs font-semibold text-text-2 hover:text-orange-dark">
              ← Voltar
            </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            #{os.numero} · {os.titulo}
          </h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COR[os.status]}`}>
            {STATUS_LABEL[os.status]}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${PRIORIDADE_COR[os.prioridade]}`}
          >
            {PRIORIDADE_LABEL[os.prioridade]}
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-start">
          {ETAPAS.map((etapa, i) => {
            const numeroEtapa = i + 1;
            const concluida = numeroEtapa < etapaAtualIndex || os.status === "concluido";
            const atual = numeroEtapa === etapaAtualIndex && os.status !== "concluido";
            return (
              <div key={etapa.chave} className="flex flex-1 items-start">
                <div className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${
                      concluida
                        ? "bg-green-600 text-white"
                        : atual
                          ? "border-2 border-orange bg-orange-tint text-orange-dark"
                          : "bg-border text-text-2"
                    }`}
                  >
                    {concluida ? "✓" : numeroEtapa}
                  </div>
                  <span className="mt-2 text-xs font-bold">{etapa.label}</span>
                </div>
                {i < ETAPAS.length - 1 && (
                  <div
                    className={`mt-4 h-0.5 flex-1 ${
                      numeroEtapa < etapaAtualIndex || os.status === "concluido"
                        ? "bg-green-600"
                        : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-2 font-display text-sm font-bold">Descrição</h2>
            <p className="text-sm leading-relaxed text-text-2">{os.descricao}</p>
          </div>

          {os.anexos.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="mb-4 font-display text-sm font-bold">
                Anexos ({os.anexos.length})
              </h2>
              <div className="flex flex-col gap-2">
                {os.anexos.map((anexo) => (
                  <a
                    key={anexo.id}
                    href={`/api/anexos/${anexo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-[8px] border border-border bg-background px-3 py-2.5 hover:border-orange"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {anexo.nomeArquivo}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-3">
                      {anexo.enviadoPor?.nome ?? "—"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-orange-dark">Abrir</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-bold">Histórico</h2>
            <div className="flex flex-col gap-4">
              {os.historico.map((evento) => (
                <div key={evento.id} className="border-l-2 border-border pl-4">
                  <p className="text-sm">
                    {evento.autor ? <b>{evento.autor.nome}</b> : "Sistema"} —{" "}
                    {evento.descricao.replace(/^.*?—\s*/, "")}
                  </p>
                  <p className="mt-0.5 text-xs text-text-3">
                    {formatarDataHora(evento.criadoEm)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {podeReenviar && (
            <form action={reenviarParaAprovacao.bind(null, os.numero)}>
              <button
                type="submit"
                className="rounded-[10px] bg-orange px-5 py-2.5 font-display text-sm font-semibold text-white hover:opacity-90"
              >
                Reenviar para aprovação
              </button>
            </form>
          )}

          {podeConcluir && (
            <form action={marcarConcluido.bind(null, os.numero)}>
              <button
                type="submit"
                className="rounded-[10px] bg-green-600 px-5 py-2.5 font-display text-sm font-semibold text-white hover:opacity-90"
              >
                Marcar como concluída
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-3 font-display text-sm font-bold">Detalhes</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-2">Solicitante</dt>
                <dd className="font-medium">{os.solicitante.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-2">Loja</dt>
                <dd className="font-medium">{os.loja.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-2">Setor</dt>
                <dd className="font-medium">{os.setor.nome}</dd>
              </div>
              {os.dataDesejada && (
                <div className="flex justify-between">
                  <dt className="text-text-2">Data desejada</dt>
                  <dd className="font-medium">{formatarData(os.dataDesejada)}</dd>
                </div>
              )}
              {os.despesas && (
                <div className="flex justify-between">
                  <dt className="text-text-2">Despesas</dt>
                  <dd className="font-medium">{os.despesas.nome}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-3 font-display text-sm font-bold">
              Orçamentos comparados ({os.orcamentos.length})
            </h2>
            <div className="flex flex-col gap-2">
              {os.orcamentos.map((o) => (
                <div
                  key={o.id}
                  className={`flex items-center gap-2 rounded-[9px] border p-2.5 text-sm ${
                    o.selecionado ? "border-orange bg-orange-tint" : "border-border"
                  }`}
                >
                  <span className="flex-1 font-medium">{o.fornecedor}</span>
                  <span className="text-xs text-text-3">{o.parcelas}</span>
                  <span className="font-display font-bold">{formatarMoeda(o.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {podeDecidir && (
            <div className="rounded-2xl border border-orange bg-orange-tint p-6">
              <h2 className="mb-3 font-display text-sm font-bold text-orange-dark">
                Sua decisão
              </h2>
              <DecisaoPanel
                action={decidirAprovacao.bind(null, os.numero)}
                orcamentos={os.orcamentos.map((o) => ({
                  id: o.id,
                  fornecedor: o.fornecedor,
                  valor: o.valor.toString(),
                  parcelas: o.parcelas,
                  selecionado: o.selecionado,
                }))}
              />
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
