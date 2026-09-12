"use client";

import { useRouter } from "next/navigation";

export function FiltroLojaSelect({
  lojas,
  valor,
}: {
  lojas: { id: string; nome: string; codigo: string }[];
  valor: string;
}) {
  const router = useRouter();

  return (
    <select
      value={valor}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) url.searchParams.set("loja", e.target.value);
        else url.searchParams.delete("loja");
        router.push(`${url.pathname}?${url.searchParams.toString()}`);
      }}
      className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-2 outline-none focus:border-orange"
    >
      <option value="">Todas as lojas</option>
      {lojas.map((l) => (
        <option key={l.id} value={l.id}>
          {l.codigo} · {l.nome}
        </option>
      ))}
    </select>
  );
}
