import type { Metadata } from "next";
import { RelatoriosConteudo } from "@/components/relatorios-conteudo";

export const metadata: Metadata = { title: "Relatórios — Mercadão O.S." };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = "30" } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <RelatoriosConteudo periodo={periodo} />
    </div>
  );
}
