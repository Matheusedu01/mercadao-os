import type { Prisma } from "@/generated/prisma/client";

/**
 * Busca por texto no título, mas também reconhece um número de O.S.
 * (com ou sem "#" na frente, ex.: "9" ou "#9") e inclui isso como
 * alternativa na busca - digitar o número que aparece em "#9 · ..." tem
 * que achar a O.S., não só o que estiver no título.
 */
export function filtroBuscaOS(busca: string): Prisma.OrdemServicoWhereInput {
  const semHashtag = busca.trim().replace(/^#/, "");
  const numero = Number(semHashtag);

  if (semHashtag !== "" && Number.isInteger(numero) && numero > 0) {
    return {
      OR: [{ titulo: { contains: busca, mode: "insensitive" } }, { numero }],
    };
  }

  return { titulo: { contains: busca, mode: "insensitive" } };
}
