import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";

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

// Se as variáveis do R2 estiverem configuradas, os anexos vão pra lá
// (obrigatório em produção "sem servidor" - disco não sobrevive o
// container dormir/reiniciar). Sem elas, cai pra disco local - assim o
// `npm run dev` continua funcionando sem precisar de conta na Cloudflare
// só pra testar localmente.
function configR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;

  return {
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    cliente: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
  };
}

/** Grava o arquivo (R2 se configurado, senão disco local) e devolve os metadados pra salvar no banco. */
export async function salvarAnexo(ordemServicoId: string, file: File) {
  const nomeArmazenado = `${randomUUID()}-${sanitizarNome(file.name)}`;
  const caminhoArquivo = `${ordemServicoId}/${nomeArmazenado}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const tipoMime = file.type || "application/octet-stream";

  const r2 = configR2();
  if (r2) {
    const resposta = await r2.cliente.fetch(`${r2.endpoint}/${r2.bucket}/${caminhoArquivo}`, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": tipoMime },
    });
    if (!resposta.ok) {
      throw new Error(`Falha ao enviar anexo pro R2: ${resposta.status} ${await resposta.text()}`);
    }
  } else {
    const dirOS = path.join(DIR_UPLOADS, ordemServicoId);
    await mkdir(dirOS, { recursive: true });
    await writeFile(path.join(dirOS, nomeArmazenado), buffer);
  }

  return {
    nomeArquivo: file.name || nomeArmazenado,
    // Relativo (não é caminho de disco nem URL) - portátil entre os dois
    // modos de armazenamento e não vaza detalhe de infraestrutura.
    caminhoArquivo,
    tipoMime,
    tamanhoBytes: buffer.byteLength,
  };
}

export async function lerAnexo(caminhoArquivo: string) {
  const r2 = configR2();
  if (r2) {
    const resposta = await r2.cliente.fetch(`${r2.endpoint}/${r2.bucket}/${caminhoArquivo}`);
    if (!resposta.ok) {
      throw new Error(`Falha ao ler anexo do R2: ${resposta.status}`);
    }
    return Buffer.from(await resposta.arrayBuffer());
  }

  return readFile(path.join(DIR_UPLOADS, caminhoArquivo));
}
