"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { logout } from "@/app/actions";

const ITENS = [
  { href: "/admin/visao-geral", label: "Visão Geral" },
  { href: "/admin/usuarios", label: "Usuários & Permissões" },
  { href: "/admin/lojas", label: "Lojas" },
  { href: "/admin/setores", label: "Setores" },
  { href: "/admin/configuracoes", label: "Configurações" },
  { href: "/admin/relatorios", label: "Relatórios" },
] as const;

export function AdminNav({ nome }: { nome: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 sm:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="rounded-[8px] p-1.5 text-text-2 hover:bg-background"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo size={28} />
      </div>

      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col bg-charcoal transition-transform duration-200 sm:static sm:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <Logo />
          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
            className="text-[#9CA1A6] hover:text-white sm:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mx-5 mb-4 h-px bg-white/10" />

        <nav className="flex flex-col gap-0.5 px-3">
          <span className="px-3 pb-2 text-[10.5px] font-bold tracking-wide text-[#6E7276]">
            ADMINISTRAÇÃO
          </span>
          {ITENS.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={`rounded-[9px] px-4 py-2.5 text-[13.5px] font-semibold ${
                  ativo ? "bg-charcoal-3 text-white" : "text-[#B7BABD] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-5 py-4">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-orange font-display text-[13px] font-bold text-white">
            {nome
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13px] font-semibold text-white">{nome}</span>
            <Link href="/" className="text-[11.5px] text-[#9CA1A6] hover:text-white">
              Ir para o painel
            </Link>
          </div>
          <form action={logout} className="ml-auto">
            <button
              type="submit"
              title="Sair"
              className="text-[11.5px] font-semibold text-[#9CA1A6] hover:text-white"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
