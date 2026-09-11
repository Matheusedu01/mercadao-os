import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAPEL_LABEL } from "@/lib/papel";
import { NovoUsuarioForm } from "./novo-usuario-form";
import { EditarUsuarioForm } from "./editar-usuario-form";

export const metadata: Metadata = { title: "Usuários & Permissões — Mercadão O.S." };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const [usuarios, setores, lojas] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        papel: true,
        ativo: true,
        usuarioSetores: { select: { setor: { select: { id: true, nome: true } } } },
        usuarioLojas: { select: { loja: { select: { id: true, nome: true } } } },
      },
    }),
    prisma.setor.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    prisma.loja.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
  ]);

  const idSelecionado = id === "novo" ? "novo" : (id ?? usuarios[0]?.id ?? "novo");
  const usuarioSelecionado =
    idSelecionado === "novo" ? null : usuarios.find((u) => u.id === idSelecionado);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Usuários &amp; Permissões
          </h1>
          <p className="mt-1 text-sm text-text-2">
            Clique num usuário pra editar o papel e o escopo (setor + loja).
          </p>
        </div>
        <Link
          href="?id=novo"
          className="shrink-0 rounded-[10px] bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + Novo usuário
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-sm font-bold text-foreground">
              Usuários cadastrados ({usuarios.length})
            </h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {usuarios.map((u) => (
              <Link
                key={u.id}
                href={`?id=${u.id}`}
                className={`flex items-center gap-3 border-b border-border px-5 py-3 last:border-none ${
                  idSelecionado === u.id ? "bg-orange-tint" : "hover:bg-background"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.nome}</div>
                  <div className="truncate text-xs text-text-3">{u.email}</div>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-semibold text-text-2">
                  {PAPEL_LABEL[u.papel]}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${u.ativo ? "bg-green-500" : "bg-zinc-300"}`}
                />
              </Link>
            ))}
            {usuarios.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-text-3">
                Nenhum usuário cadastrado ainda.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          {usuarioSelecionado ? (
            <EditarUsuarioForm usuario={usuarioSelecionado} setores={setores} lojas={lojas} />
          ) : (
            <>
              <h2 className="mb-5 font-display text-sm font-bold text-foreground">
                Novo usuário
              </h2>
              <NovoUsuarioForm setores={setores} lojas={lojas} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
