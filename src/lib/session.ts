import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Papel } from "@/generated/prisma/enums";

// Payload minimo guardado no cookie de sessao. Nunca colocar aqui dado
// sensivel (senha, telefone, etc) - so o essencial pra identificar o
// usuario e checar permissao de forma rapida (checagem "otimista").
type SessionPayload = {
  usuarioId: string;
  papel: Papel;
  nome: string;
  expiresAt: Date;
};

const NOME_COOKIE = "session";
const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET nao configurada no .env");
  }
  return new TextEncoder().encode(secret);
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

// Exportado (não mais privado) porque a API da extensão de navegador
// também precisa validar um token de sessão - só que recebido por um
// header (X-Session-Token), não pelo cookie. Ver src/lib/api-auth.ts.
export async function decrypt(session: string | undefined) {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    // Cookie ausente, expirado ou adulterado - trata como "sem sessao".
    return null;
  }
}

export async function criarSessao(usuario: {
  id: string;
  papel: Papel;
  nome: string;
}) {
  const expiresAt = new Date(Date.now() + DURACAO_SESSAO_MS);
  const session = await encrypt({
    usuarioId: usuario.id,
    papel: usuario.papel,
    nome: usuario.nome,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function lerSessao() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(NOME_COOKIE)?.value);
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE);
}
