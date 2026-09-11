"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarUsuario } from "./actions";

type Opcao = { id: string; nome: string };

const PAPEIS = [
  { valor: "solicitante", label: "Solicitante" },
  { valor: "supervisor", label: "Supervisor" },
  { valor: "diretor_dono", label: "Diretor / Dono" },
  { valor: "despesas", label: "Despesas" },
  { valor: "admin", label: "Admin" },
] as const;

export function NovoUsuarioForm({
  setores,
  lojas,
}: {
  setores: Opcao[];
  lojas: Opcao[];
}) {
  const [state, action, pending] = useActionState(criarUsuario, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.sucesso) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Nome completo</span>
          <input
            name="nome"
            required
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">E-mail</span>
          <input
            type="email"
            name="email"
            required
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Telefone (WhatsApp)</span>
          <input
            name="telefone"
            placeholder="(11) 90000-0000"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Senha inicial</span>
          <input
            type="password"
            name="senha"
            required
            minLength={8}
            placeholder="mínimo 8 caracteres"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">Papel</span>
        <div className="flex flex-wrap gap-2">
          {PAPEIS.map((p, i) => (
            <label
              key={p.valor}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
            >
              <input
                type="radio"
                name="papel"
                value={p.valor}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">
          Escopo · Setores
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
          {setores.length === 0 && (
            <span className="text-xs text-text-3">Nenhum setor cadastrado ainda.</span>
          )}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">
          Escopo · Lojas
        </span>
        <div className="flex flex-wrap gap-2">
          {lojas.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
            >
              <input type="checkbox" name="lojaIds" value={l.id} className="sr-only" />
              {l.nome}
            </label>
          ))}
          {lojas.length === 0 && (
            <span className="text-xs text-text-3">Nenhuma loja cadastrada ainda.</span>
          )}
        </div>
      </div>

      {state?.erro && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.erro}
        </p>
      )}
      {state?.sucesso && (
        <p className="text-sm font-medium text-green-700">Usuário criado com sucesso.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[9px] bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
