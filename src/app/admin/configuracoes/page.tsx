import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PRIORIDADE_LABEL } from "@/lib/formato";
import { atualizarSla, atualizarNotificacoes } from "./actions";

export const metadata: Metadata = { title: "Configurações — Mercadão O.S." };

const TIPOS_OS = [
  { valor: "obra", label: "Obra" },
  { valor: "manutencao", label: "Manutenção" },
  { valor: "despesa", label: "Despesa" },
  { valor: "outro", label: "Outro" },
];

export default async function ConfiguracoesPage() {
  const [slas, config] = await Promise.all([
    prisma.slaPrioridade.findMany(),
    prisma.configSistema.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
  ]);

  const slaOrdenado = (["baixa", "media", "alta", "urgente"] as const).map(
    (p) => slas.find((s) => s.prioridade === p)!,
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-text-2">
          Regras gerais do sistema de O.S. — SLA, tipos, aprovação e notificações.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-sm font-bold">Tipos de O.S.</h2>
          <p className="mt-1 text-xs text-text-2">
            Categorias disponíveis ao abrir uma nova O.S.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {TIPOS_OS.map((t) => (
              <div key={t.valor} className="flex items-center justify-between text-sm">
                <span className="font-medium">{t.label}</span>
                <span className="text-xs font-semibold text-green-700">Ativo</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-text-3">
            Fixos por enquanto — ativar/desativar tipos vira configurável numa próxima fase.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-sm font-bold">SLA por prioridade</h2>
          <p className="mt-1 text-xs text-text-2">Prazo alvo para decisão em cada etapa.</p>
          <div className="mt-4 flex flex-col gap-2.5">
            {slaOrdenado.map((sla) => (
              <form
                key={sla.prioridade}
                action={atualizarSla.bind(null, sla.prioridade)}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm font-medium">{PRIORIDADE_LABEL[sla.prioridade]}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name={`dias_${sla.prioridade}`}
                    defaultValue={sla.dias}
                    min={1}
                    max={30}
                    className="w-16 rounded-[8px] border border-border px-2 py-1.5 text-center text-sm outline-none focus:border-orange"
                  />
                  <span className="text-xs text-text-3">dias</span>
                  <button
                    type="submit"
                    className="text-xs font-semibold text-orange-dark hover:underline"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-sm font-bold">Fluxo de aprovação</h2>
          <p className="mt-1 text-xs text-text-2">Regra fixa aplicada a toda O.S. da rede.</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal font-display text-xs font-bold text-white">
                1
              </span>
              <span className="text-sm font-medium">Supervisor do setor aprova primeiro</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal font-display text-xs font-bold text-white">
                2
              </span>
              <span className="text-sm font-medium">Diretor/Dono dá a aprovação final</span>
            </div>
          </div>
          <p className="mt-4 rounded-[9px] bg-background px-3 py-2.5 text-[11px] text-text-2">
            Etapas fixas por decisão da diretoria — não editável por aqui.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-sm font-bold">Notificações</h2>
          <p className="mt-1 text-xs text-text-2">
            Como e quando avisar quem está com uma O.S. pendente.
          </p>
          <form action={atualizarNotificacoes} className="mt-4 flex flex-col gap-4">
            <label className="flex items-center justify-between text-sm">
              <span className="font-medium">Lembrete automático por WhatsApp</span>
              <input
                type="checkbox"
                name="lembreteWhatsappAtivo"
                defaultChecked={config.lembreteWhatsappAtivo}
                className="h-4 w-4 accent-orange"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-text-2">Enviar após dias sem atualização</span>
              <input
                type="number"
                name="lembreteWhatsappDias"
                defaultValue={config.lembreteWhatsappDias}
                min={1}
                max={30}
                className="w-16 rounded-[8px] border border-border px-2 py-1.5 text-center text-sm outline-none focus:border-orange"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="font-medium">Notificação por e-mail</span>
              <input
                type="checkbox"
                name="notificacaoEmailAtivo"
                defaultChecked={config.notificacaoEmailAtivo}
                className="h-4 w-4 accent-orange"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="font-medium">Resumo diário para diretoria</span>
              <input
                type="checkbox"
                name="resumoDiarioDiretoriaAtivo"
                defaultChecked={config.resumoDiarioDiretoriaAtivo}
                className="h-4 w-4 accent-orange"
              />
            </label>
            <p className="text-[11px] text-text-3">
              O envio de verdade pelo WhatsApp ainda não está implementado (Fase 4) — essas
              opções já ficam salvas, prontas pra quando essa parte for construída.
            </p>
            <button
              type="submit"
              className="self-start rounded-[9px] bg-orange px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Salvar notificações
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
