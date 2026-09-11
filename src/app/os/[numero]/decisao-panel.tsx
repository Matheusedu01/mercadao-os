"use client";

import { useActionState, useState } from "react";
import type { DecisaoState } from "@/app/os/actions";
import { formatarMoeda } from "@/lib/formato";

type Orcamento = {
  id: string;
  fornecedor: string;
  valor: string;
  parcelas: string;
  selecionado: boolean;
};

export function DecisaoPanel({
  action,
  orcamentos,
}: {
  action: (state: DecisaoState, formData: FormData) => Promise<DecisaoState>;
  orcamentos: Orcamento[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selecionadoId, setSelecionadoId] = useState(
    orcamentos.find((o) => o.selecionado)?.id ?? orcamentos[0]?.id ?? "",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {orcamentos.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-2">
            Escolha o orçamento antes de decidir
          </span>
          {orcamentos.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 ${
                selecionadoId === o.id
                  ? "border-orange bg-orange-tint"
                  : "border-border bg-white"
              }`}
            >
              <input
                type="radio"
                name="orcamentoSelecionadoId"
                value={o.id}
                checked={selecionadoId === o.id}
                onChange={() => setSelecionadoId(o.id)}
              />
              <span className="flex-1 text-sm font-semibold">{o.fornecedor}</span>
              <span className="text-xs text-text-2">{o.parcelas}</span>
              <span className="font-display text-sm font-bold">
                {formatarMoeda(o.valor)}
              </span>
            </label>
          ))}
        </div>
      )}
      {orcamentos.length === 1 && (
        <input type="hidden" name="orcamentoSelecionadoId" value={orcamentos[0].id} />
      )}

      <textarea
        name="comentario"
        rows={3}
        placeholder="Comentário (obrigatório se rejeitar ou pedir ajuste)..."
        className="rounded-[10px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
      />

      {state?.erro && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.erro}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          name="decisao"
          value="aprovado"
          disabled={pending}
          className="rounded-[9px] bg-green-600 py-2.5 font-display text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          Aprovar
        </button>
        <div className="flex gap-2">
          <button
            type="submit"
            name="decisao"
            value="rejeitado"
            disabled={pending}
            className="flex-1 rounded-[9px] border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            Rejeitar
          </button>
          <button
            type="submit"
            name="decisao"
            value="ajuste_solicitado"
            disabled={pending}
            className="flex-1 rounded-[9px] border border-border py-2 text-sm font-semibold text-text-2 hover:bg-background disabled:opacity-60"
          >
            Pedir ajuste
          </button>
        </div>
      </div>
    </form>
  );
}
