"use client";

import { useActionState } from "react";
import { editarLoja, alternarAtivoLoja } from "./actions";

type Opcao = { id: string; nome: string };

type LojaEditavel = {
  id: string;
  codigo: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  gerenteId: string | null;
  ativo: boolean;
  lojaSetores: { setor: { id: string } }[];
};

export function EditarLojaForm({
  loja,
  setores,
  gerentes,
}: {
  loja: LojaEditavel;
  setores: Opcao[];
  gerentes: Opcao[];
}) {
  const action = editarLoja.bind(null, loja.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const setorIdsAtuais = new Set(loja.lojaSetores.map((ls) => ls.setor.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-orange font-display text-xs font-bold text-white">
          {loja.codigo}
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold">{loja.nome}</div>
          <div className="truncate text-xs text-text-3">{loja.codigo}</div>
        </div>
        <form action={alternarAtivoLoja.bind(null, loja.id, !loja.ativo)} className="ml-auto shrink-0">
          <button
            type="submit"
            className={
              loja.ativo
                ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-text-3"
            }
          >
            {loja.ativo ? "Ativa" : "Inativa"}
          </button>
        </form>
      </div>

      <form key={loja.id} action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Nome da loja</span>
          <input
            name="nome"
            defaultValue={loja.nome}
            required
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Endereço</span>
          <input
            name="endereco"
            defaultValue={loja.endereco ?? ""}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">Cidade</span>
            <input
              name="cidade"
              defaultValue={loja.cidade ?? ""}
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">UF</span>
            <input
              name="uf"
              maxLength={2}
              defaultValue={loja.uf ?? ""}
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">Telefone</span>
            <input
              name="telefone"
              defaultValue={loja.telefone ?? ""}
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Gerente responsável</span>
          <select
            name="gerenteId"
            defaultValue={loja.gerenteId ?? ""}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">— nenhum por enquanto —</option>
            {gerentes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold text-text-2">
            Setores habilitados nesta loja
          </span>
          <div className="flex flex-wrap gap-2">
            {setores.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
              >
                <input
                  type="checkbox"
                  name="setorIds"
                  value={s.id}
                  defaultChecked={setorIdsAtuais.has(s.id)}
                  className="sr-only"
                />
                {s.nome}
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
