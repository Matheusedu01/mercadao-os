import Link from "next/link";
import {
  formatarMoeda,
  PRIORIDADE_COR,
  PRIORIDADE_LABEL,
  STATUS_COR,
  STATUS_LABEL,
} from "@/lib/formato";
import type { Prioridade, StatusOS } from "@/generated/prisma/enums";
import { aprovarRapido } from "@/app/os/actions";

type LinhaOS = {
  numero: number;
  titulo: string;
  status: StatusOS;
  prioridade: Prioridade;
  loja: { nome: string };
  setor: { nome: string };
  orcamentos: { valor: number | string | { toString(): string } }[];
};

export function OSLista({
  titulo,
  itens,
  permitirAprovarRapido = false,
}: {
  titulo: string;
  itens: LinhaOS[];
  /** Mostra um botão "Aprovar" em cada linha (fila de Supervisor/Diretor). */
  permitirAprovarRapido?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-display text-sm font-bold text-foreground">
          {titulo} <span className="text-text-3">({itens.length})</span>
        </h2>
      </div>
      <div className="flex flex-col">
        {itens.map((os) => (
          <div
            key={os.numero}
            className="flex flex-col gap-2.5 border-b border-border px-6 py-3.5 last:border-none hover:bg-background sm:flex-row sm:items-center sm:gap-4"
          >
            <Link href={`/os/${os.numero}`} className="min-w-0 sm:flex-1">
              <div className="truncate text-sm font-semibold">
                #{os.numero} · {os.titulo}
              </div>
              <div className="mt-0.5 text-xs text-text-2">
                {os.loja.nome} · {os.setor.nome}
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 font-display text-sm font-bold sm:w-24 sm:text-right">
                {os.orcamentos[0] ? formatarMoeda(os.orcamentos[0].valor) : "—"}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${PRIORIDADE_COR[os.prioridade]}`}
              >
                {PRIORIDADE_LABEL[os.prioridade]}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COR[os.status]}`}
              >
                {STATUS_LABEL[os.status]}
              </span>
              {permitirAprovarRapido && (
                <>
                  <Link
                    href={`/os/${os.numero}`}
                    className="shrink-0 rounded-[8px] border border-border px-3 py-1.5 text-xs font-semibold text-text-2 hover:bg-white"
                  >
                    Ver detalhes
                  </Link>
                  <form action={aprovarRapido.bind(null, os.numero)}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-[8px] bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      Aprovar
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
        {itens.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-text-3">Nada por aqui.</p>
        )}
      </div>
    </div>
  );
}
