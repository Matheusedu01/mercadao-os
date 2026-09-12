"use client";

import { useActionState, useState } from "react";
import type { EditarOSState } from "@/app/os/actions";

type Loja = { id: string; nome: string; codigo: string };
type Setor = { id: string; nome: string };

const TIPOS = [
  { valor: "obra", label: "Obra" },
  { valor: "manutencao", label: "Manutenção" },
  { valor: "despesa", label: "Despesa" },
  { valor: "outro", label: "Outro" },
] as const;

const PRIORIDADES = [
  { valor: "baixa", label: "Baixa" },
  { valor: "media", label: "Média" },
  { valor: "alta", label: "Alta" },
  { valor: "urgente", label: "Urgente" },
] as const;

type LinhaOrcamento = { chave: number; fornecedor: string; valor: string; parcelas: string };

let proximaChave = 1;

export function EditarOSForm({
  action,
  lojas,
  setoresPorLoja,
  valoresIniciais,
}: {
  action: (state: EditarOSState, formData: FormData) => Promise<EditarOSState>;
  lojas: Loja[];
  setoresPorLoja: Record<string, Setor[]>;
  valoresIniciais: {
    tipo: string;
    lojaId: string;
    setorId: string;
    local: string;
    descricao: string;
    prioridade: string;
    dataDesejada: string;
    orcamentos: { fornecedor: string; valor: string; parcelas: string }[];
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [lojaId, setLojaId] = useState(valoresIniciais.lojaId);
  const [linhas, setLinhas] = useState<LinhaOrcamento[]>(
    valoresIniciais.orcamentos.length > 0
      ? valoresIniciais.orcamentos.map((o) => ({ chave: proximaChave++, ...o }))
      : [{ chave: proximaChave++, fornecedor: "", valor: "", parcelas: "À vista" }],
  );

  const setoresDisponiveis = setoresPorLoja[lojaId] ?? [];

  function atualizarLinha(chave: number, campo: keyof LinhaOrcamento, valor: string) {
    setLinhas((atual) =>
      atual.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)),
    );
  }

  function adicionarLinha() {
    setLinhas((atual) => [
      ...atual,
      { chave: proximaChave++, fornecedor: "", valor: "", parcelas: "À vista" },
    ]);
  }

  function removerLinha(chave: number) {
    setLinhas((atual) => (atual.length > 1 ? atual.filter((l) => l.chave !== chave) : atual));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">
          Tipo de solicitação
        </span>
        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <label
              key={t.valor}
              className="flex-1 cursor-pointer rounded-[9px] border border-border py-2.5 text-center text-sm font-semibold text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
            >
              <input
                type="radio"
                name="tipo"
                value={t.valor}
                defaultChecked={t.valor === valoresIniciais.tipo}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Loja</span>
          <select
            name="lojaId"
            value={lojaId}
            onChange={(e) => setLojaId(e.target.value)}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Setor responsável</span>
          <select
            name="setorId"
            required
            defaultValue={valoresIniciais.setorId}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="" disabled>
              Selecione o setor
            </option>
            {setoresDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">
          Local / o que precisa (ex.: &quot;Depósito e estacionamento&quot;)
        </span>
        <input
          name="local"
          required
          defaultValue={valoresIniciais.local}
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Descrição detalhada</span>
        <textarea
          name="descricao"
          required
          rows={4}
          defaultValue={valoresIniciais.descricao}
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-text-2">Orçamentos de fornecedores</span>
          <span className="text-[11px] text-text-3">
            Anexe pelo menos 1 — quanto mais opções, mais rápida a aprovação
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {linhas.map((linha, i) => (
            <div
              key={linha.chave}
              className="flex flex-wrap items-end gap-2.5 rounded-[10px] border border-border bg-background p-3"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-charcoal font-display text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <label className="flex basis-full flex-col gap-1 sm:basis-0 sm:flex-1">
                <span className="text-[10.5px] text-text-3">Fornecedor</span>
                <input
                  name="fornecedor"
                  required={i === 0}
                  value={linha.fornecedor}
                  onChange={(e) => atualizarLinha(linha.chave, "fornecedor", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 sm:w-32 sm:flex-none">
                <span className="text-[10.5px] text-text-3">Valor (R$)</span>
                <input
                  name="valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required={i === 0}
                  value={linha.valor}
                  onChange={(e) => atualizarLinha(linha.chave, "valor", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 sm:w-32 sm:flex-none">
                <span className="text-[10.5px] text-text-3">Parcelas</span>
                <input
                  name="parcelas"
                  value={linha.parcelas}
                  onChange={(e) => atualizarLinha(linha.chave, "parcelas", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              {linhas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(linha.chave)}
                  className="pb-2 text-xs font-semibold text-text-3 hover:text-red-600"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={adicionarLinha}
          className="mt-2.5 text-xs font-semibold text-orange-dark hover:underline"
        >
          + Adicionar outro orçamento
        </button>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">Prioridade</span>
        <div className="flex gap-2">
          {PRIORIDADES.map((p) => (
            <label
              key={p.valor}
              className="flex-1 cursor-pointer rounded-[9px] border border-border py-2.5 text-center text-sm font-semibold text-text-2 has-checked:border-orange has-checked:bg-orange-tint has-checked:text-orange-dark"
            >
              <input
                type="radio"
                name="prioridade"
                value={p.valor}
                defaultChecked={p.valor === valoresIniciais.prioridade}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Data desejada (opcional)</span>
        <input
          name="dataDesejada"
          type="date"
          defaultValue={valoresIniciais.dataDesejada}
          className="w-48 rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">
          Motivo da edição (opcional, fica registrado no histórico)
        </span>
        <textarea
          name="motivoEdicao"
          rows={2}
          placeholder="Ex.: corrigido valor do orçamento que estava errado..."
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      {state?.erro && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.erro}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] bg-orange px-6 py-3 font-display text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
