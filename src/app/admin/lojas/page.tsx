import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NovaLojaForm } from "./nova-loja-form";
import { EditarLojaForm } from "./editar-loja-form";

export const metadata: Metadata = { title: "Lojas — Mercadão O.S." };

export default async function LojasPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const [lojas, setores, gerentes] = await Promise.all([
    prisma.loja.findMany({
      orderBy: { codigo: "asc" },
      select: {
        id: true,
        codigo: true,
        nome: true,
        endereco: true,
        cidade: true,
        uf: true,
        telefone: true,
        gerenteId: true,
        ativo: true,
        gerente: { select: { nome: true } },
        lojaSetores: { select: { setor: { select: { id: true, nome: true } } } },
        _count: { select: { usuarioLojas: true } },
      },
    }),
    prisma.setor.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    prisma.usuario.findMany({
      where: { ativo: true, papel: { in: ["supervisor", "diretor_dono", "admin"] } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const idSelecionado = id === "novo" ? "novo" : (id ?? lojas[0]?.id ?? "novo");
  const lojaSelecionada = idSelecionado === "novo" ? null : lojas.find((l) => l.id === idSelecionado);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lojas</h1>
          <p className="mt-1 text-sm text-text-2">
            Clique numa loja pra editar endereço, gerente e setores habilitados.
          </p>
        </div>
        <Link
          href="?id=novo"
          className="shrink-0 rounded-[10px] bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + Nova loja
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-sm font-bold text-foreground">
              Lojas cadastradas ({lojas.length})
            </h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {lojas.map((l) => (
              <Link
                key={l.id}
                href={`?id=${l.id}`}
                className={`flex items-center gap-3 border-b border-border px-5 py-3 last:border-none ${
                  idSelecionado === l.id ? "bg-orange-tint" : "hover:bg-background"
                }`}
              >
                <span className="w-14 shrink-0 font-mono text-xs font-semibold text-text-2">
                  {l.codigo}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.nome}</div>
                  <div className="truncate text-xs text-text-3">
                    {l._count.usuarioLojas} usuário(s) · {l.lojaSetores.length} setor(es)
                  </div>
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${l.ativo ? "bg-green-500" : "bg-zinc-300"}`}
                />
              </Link>
            ))}
            {lojas.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-text-3">
                Nenhuma loja cadastrada ainda.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          {lojaSelecionada ? (
            <EditarLojaForm loja={lojaSelecionada} setores={setores} gerentes={gerentes} />
          ) : (
            <>
              <h2 className="mb-5 font-display text-sm font-bold text-foreground">Nova loja</h2>
              <NovaLojaForm setores={setores} gerentes={gerentes} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
