"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarLoja } from "./actions";

type Opcao = { id: string; nome: string };

export function NovaLojaForm({
  setores,
  gerentes,
}: {
  setores: Opcao[];
  gerentes: Opcao[];
}) {
  const [state, action, pending] = useActionState(criarLoja, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.sucesso) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Código</span>
          <input
            name="codigo"
            required
            placeholder="LJ17"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Nome da loja</span>
          <input
            name="nome"
            required
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Endereço</span>
        <input
          name="endereco"
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Cidade</span>
          <input
            name="cidade"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">UF</span>
          <input
            name="uf"
            maxLength={2}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Telefone</span>
          <input
            name="telefone"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Gerente responsável</span>
        <select
          name="gerenteId"
          defaultValue=""
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
              <input type="checkbox" name="setorIds" value={s.id} className="sr-only" />
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
        <p className="text-sm font-medium text-green-700">Loja criada com sucesso.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[9px] bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar loja"}
      </button>
    </form>
  );
}
