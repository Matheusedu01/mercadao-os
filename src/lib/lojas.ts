// Ordena lojas pelo número do código (ex.: "LJ01" < "LJ02" < ... < "LJ906" <
// "LJ999"), não alfabeticamente pelo nome. Códigos sem parte numérica (não
// deveria acontecer hoje, mas por segurança) ficam por último.
export function ordenarPorCodigo<T extends { codigo: string }>(lojas: T[]): T[] {
  function numeroDoCodigo(codigo: string): number | null {
    const match = codigo.match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  return [...lojas].sort((a, b) => {
    const na = numeroDoCodigo(a.codigo);
    const nb = numeroDoCodigo(b.codigo);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.codigo.localeCompare(b.codigo);
  });
}
