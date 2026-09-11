"use client";

import { useActionState } from "react";
import { editarSetor, alternarAtivoSetor } from "./actions";

type Opcao = { id: string; nome: string };

type SetorEditavel = {
  id: string;
  nome: string;
  supervisorId: string | null;
  slaPadraoDias: number;
  ativo: boolean;
  lojaSetores: { loja: { id: string } }[];
};

export function EditarSetorForm({
  setor,
  supervisores,
  lojas,
}: {
  setor: SetorEditavel;
  supervisores: Opcao[];
  lojas: Opcao[];
}) {
  const action = editarSetor.bind(null, setor.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const lojaIdsAtuais = new Set(setor.lojaSetores.map((ls) => ls.loja.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-display text-base font-bold">{setor.nome}</div>
        </div>
        <form action={alternarAtivoSetor.bind(null, setor.id, !setor.ativo)} className="ml-auto shrink-0">
          <button
            type="submit"
            className={
              setor.ativo
                ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-text-3"
            }
          >
            {setor.ativo ? "Ativo" : "Inativo"}
          </button>
        </form>
      </div>

      <form key={setor.id} action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">Nome do setor</span>
            <input
              name="nome"
              defaultValue={setor.nome}
              required
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">SLA padrão (dias)</span>
            <input
              name="slaPadraoDias"
              type="number"
              min={1}
              max={30}
              defaultValue={setor.slaPadraoDias}
              required
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">
            Supervisor responsável (etapa 1)
          </span>
          <select
            name="supervisorId"
            defaultValue={setor.supervisorId ?? ""}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">— nenhum por enquanto —</option>
            {supervisores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold text-text-2">
            Lojas que utilizam este setor
          </span>
          <div className="flex flex-wrap gap-2">
            {lojas.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
              >
                <input
                  type="checkbox"
                  name="lojaIds"
                  value={l.id}
                  defaultChecked={lojaIdsAtuais.has(l.id)}
                  className="sr-only"
                />
                {l.nome}
              </label>
            ))}
          </div>
        </div>

        {state?.erro && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {state.erro}
          </p>
        )}
        {state?.sucesso && (
          <p className="text-sm font-medium text-green-700">Alterações salvas.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-[9px] bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
