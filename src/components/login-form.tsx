"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex w-full max-w-[400px] flex-col gap-7">
      <div>
        <h1 className="font-display text-[26px] font-bold text-foreground">
          Entrar no sistema
        </h1>
        <p className="mt-2 text-sm text-text-2">
          Acesse com seu usuário Mercadão Atacadista
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="seu.usuario@mercadaoatacadista.com"
            className="rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-orange"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Senha</span>
          <input
            type="password"
            name="senha"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-orange"
          />
        </label>

        <Link
          href="/esqueci-senha"
          className="self-end text-xs font-semibold text-orange-dark hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      {state?.erro && (
        <p role="alert" className="-mt-2 text-sm font-medium text-red-700">
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] bg-orange px-4 py-3.5 font-display text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-xs text-text-3">
        Precisa de acesso? Fale com o administrador do sistema.
      </p>
    </form>
  );
}
