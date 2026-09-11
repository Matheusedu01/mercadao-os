"use client";

import { useActionState } from "react";
import { editarUsuario, alternarAtivo } from "./actions";

type Opcao = { id: string; nome: string };

const PAPEIS = [
  { valor: "solicitante", label: "Solicitante" },
  { valor: "supervisor", label: "Supervisor" },
  { valor: "diretor_dono", label: "Diretor / Dono" },
  { valor: "despesas", label: "Despesas" },
  { valor: "admin", label: "Admin" },
] as const;

type UsuarioEditavel = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: (typeof PAPEIS)[number]["valor"];
  ativo: boolean;
  usuarioSetores: { setor: { id: string } }[];
  usuarioLojas: { loja: { id: string } }[];
};

export function EditarUsuarioForm({
  usuario,
  setores,
  lojas,
}: {
  usuario: UsuarioEditavel;
  setores: Opcao[];
  lojas: Opcao[];
}) {
  const action = editarUsuario.bind(null, usuario.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const setorIdsAtuais = new Set(usuario.usuarioSetores.map((us) => us.setor.id));
  const lojaIdsAtuais = new Set(usuario.usuarioLojas.map((ul) => ul.loja.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange font-display text-sm font-bold text-white">
          {usuario.nome
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold">{usuario.nome}</div>
          <div className="truncate text-xs text-text-3">{usuario.email}</div>
        </div>
        <form action={alternarAtivo.bind(null, usuario.id, !usuario.ativo)} className="ml-auto shrink-0">
          <button
            type="submit"
            className={
              usuario.ativo
                ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-text-3"
            }
          >
            {usuario.ativo ? "Ativo" : "Inativo"}
          </button>
        </form>
      </div>

      <form key={usuario.id} action={formAction} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">Nome completo</span>
            <input
              name="nome"
              defaultValue={usuario.nome}
              required
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-2">E-mail (login)</span>
            <input
              type="email"
              name="email"
              defaultValue={usuario.email}
              required
              className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Telefone (WhatsApp)</span>
          <input
            name="telefone"
            defaultValue={usuario.telefone ?? ""}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">
            Nova senha (deixe em branco pra manter a atual)
          </span>
          <input
            type="password"
            name="novaSenha"
            placeholder="mínimo 8 caracteres"
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold text-text-2">Papel</span>
          <div className="flex flex-wrap gap-2">
            {PAPEIS.map((p) => (
              <label
                key={p.valor}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
              >
                <input
                  type="radio"
                  name="papel"
                  value={p.valor}
                  defaultChecked={usuario.papel === p.valor}
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

        <div>
          <span className="mb-2 block text-xs font-semibold text-text-2">Escopo · Lojas</span>
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
