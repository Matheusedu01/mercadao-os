import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Arquivos ficam fora de `public/` de propósito - anexo de O.S. pode ter
// informação sensível (endereço, valor, foto do local) e só pode ser lido
// por quem tem permissão pra ver aquela O.S. (checado na Route Handler que
// serve o arquivo, não pelo sistema de arquivos estático do Next).
const DIR_UPLOADS = path.join(process.cwd(), "uploads", "os");

export const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15MB por arquivo

export const TIPOS_ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizarNome(nome: string) {
  return nome.replace(/[^\w.\-]+/g, "_").slice(-100) || "arquivo";
}

/** Grava o arquivo em disco e devolve os metadados pra salvar no banco. */
export async function salvarAnexo(ordemServicoId: string, file: File) {
  const dirOS = path.join(DIR_UPLOADS, ordemServicoId);
  await mkdir(dirOS, { recursive: true });

  const nomeArmazenado = `${randomUUID()}-${sanitizarNome(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dirOS, nomeArmazenado), buffer);

  return {
    nomeArquivo: file.name || nomeArmazenado,
    // Relativo a DIR_UPLOADS - portátil, não vaza o caminho absoluto do disco.
    caminhoArquivo: `${ordemServicoId}/${nomeArmazenado}`,
    tipoMime: file.type || "application/octet-stream",
    tamanhoBytes: buffer.byteLength,
  };
}

export async function lerAnexo(caminhoArquivo: string) {
  return readFile(path.join(DIR_UPLOADS, caminhoArquivo));
}
