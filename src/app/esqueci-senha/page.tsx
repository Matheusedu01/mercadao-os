import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Esqueci minha senha — Mercadão O.S." };

export default function EsqueciSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <Logo />

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Esqueceu sua senha?
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Por enquanto a redefinição de senha é feita pelo administrador do
            sistema, não existe um link automático por e-mail ainda.
          </p>
        </div>

        <div className="rounded-[12px] border border-border bg-white p-5">
          <h2 className="font-display text-sm font-bold">O que fazer</h2>
          <ol className="mt-3 flex flex-col gap-2 text-sm text-text-2">
            <li>1. Fale com o administrador do sistema da sua rede.</li>
            <li>
              2. Peça pra ele acessar <span className="font-medium">Usuários &amp; Permissões</span> e
              definir uma nova senha temporária pra você.
            </li>
            <li>3. Faça login com a senha nova e, se quiser, troque depois.</li>
          </ol>
        </div>

        <Link
          href="/login"
          className="text-center text-sm font-semibold text-orange-dark hover:underline"
        >
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}
