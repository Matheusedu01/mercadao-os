import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NovoSetorForm } from "./novo-setor-form";
import { EditarSetorForm } from "./editar-setor-form";

export const metadata: Metadata = { title: "Setores — Mercadão O.S." };

export default async function SetoresPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const [setores, supervisores, lojas] = await Promise.all([
    prisma.setor.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        supervisorId: true,
        slaPadraoDias: true,
        ativo: true,
        supervisor: { select: { nome: true } },
        lojaSetores: { select: { loja: { select: { id: true, nome: true } } } },
        _count: { select: { ordensServico: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { ativo: true, papel: "supervisor" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.loja.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
  ]);

  const idSelecionado = id === "novo" ? "novo" : (id ?? setores[0]?.id ?? "novo");
  const setorSelecionado =
    idSelecionado === "novo" ? null : setores.find((s) => s.id === idSelecionado);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Setores</h1>
          <p className="mt-1 text-sm text-text-2">
            Clique num setor pra editar supervisor, SLA e lojas vinculadas.
          </p>
        </div>
        <Link
          href="?id=novo"
          className="shrink-0 rounded-[10px] bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + Novo setor
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-sm font-bold text-foreground">
              Setores cadastrados ({setores.length})
            </h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {setores.map((s) => (
              <Link
                key={s.id}
                href={`?id=${s.id}`}
                className={`flex items-center gap-3 border-b border-border px-5 py-3 last:border-none ${
                  idSelecionado === s.id ? "bg-orange-tint" : "hover:bg-background"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.nome}</div>
                  <div className="truncate text-xs text-text-3">
                    {s.supervisor?.nome ?? "sem supervisor"} · {s._count.ordensServico} O.S.
                  </div>
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${s.ativo ? "bg-green-500" : "bg-zinc-300"}`}
                />
              </Link>
            ))}
            {setores.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-text-3">
                Nenhum setor cadastrado ainda.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          {setorSelecionado ? (
            <EditarSetorForm
              setor={setorSelecionado}
              supervisores={supervisores}
              lojas={lojas}
            />
          ) : (
            <>
              <h2 className="mb-5 font-display text-sm font-bold text-foreground">
                Novo setor
              </h2>
              <NovoSetorForm supervisores={supervisores} lojas={lojas} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
