"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { logout } from "@/app/actions";
import { PAPEL_LABEL } from "@/lib/papel";
import type { Papel } from "@/generated/prisma/enums";

type ItemNav = { href: string; label: string };

// Só os itens do menu que já têm uma página real por trás - o mockup
// original também tinha "Notificações" e "Ajuda"/"Relatórios do setor",
// mas essas telas ainda não existem, então não entram aqui (nada de link
// morto no menu).
const ITENS_POR_PAPEL: Record<Exclude<Papel, "admin">, ItemNav[]> = {
  solicitante: [
    { href: "/", label: "Minhas O.S." },
    { href: "/os/novo", label: "Abrir Nova O.S." },
  ],
  supervisor: [
    { href: "/", label: "Fila de Aprovação" },
    { href: "/os", label: "Todas as O.S." },
    { href: "/relatorios", label: "Relatórios" },
  ],
  diretor_dono: [
    { href: "/", label: "Aprovações Finais" },
    { href: "/os", label: "Todas as O.S." },
    { href: "/relatorios", label: "Relatórios" },
  ],
  despesas: [
    { href: "/", label: "Fechamento de Despesas" },
    { href: "/os", label: "Todas as O.S." },
  ],
};

export function PainelNav({
  papel,
  nome,
  contexto,
  badge,
}: {
  papel: Exclude<Papel, "admin">;
  nome: string;
  /** Texto curto de escopo: nome da loja, do setor, ou "Rede completa". */
  contexto: string;
  /** Contador mostrado no primeiro item do menu (fila de aprovação pendente). */
  badge?: number;
}) {
  const pathname = usePathname();
  const itens = ITENS_POR_PAPEL[papel];
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
          MENU
        </span>
        {itens.map((item, i) => {
          const ativo = pathname === item.href;
          const mostrarBadge = i === 0 && !!badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              className={`flex items-center justify-between rounded-[9px] px-4 py-2.5 text-[13.5px] font-semibold ${
                ativo ? "bg-charcoal-3 text-white" : "text-[#B7BABD] hover:text-white"
              }`}
            >
              {item.label}
              {mostrarBadge && (
                <span className="rounded-full bg-orange px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                  {badge}
                </span>
              )}
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
          <span className="truncate text-[11.5px] text-[#9CA1A6]">
            {PAPEL_LABEL[papel]} · {contexto}
          </span>
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
