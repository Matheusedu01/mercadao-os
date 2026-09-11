import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Checagem "otimista": so le o cookie, nunca consulta o banco aqui.
// O Proxy roda em toda navegacao (inclusive rotas pre-carregadas), entao
// uma query ao banco aqui deixaria o app lento. A checagem "segura" de
// verdade (usuario ainda existe e esta ativo) acontece na DAL - ver
// src/lib/dal.ts.
async function temSessaoValida(request: NextRequest) {
  const cookie = request.cookies.get("session")?.value;
  if (!cookie) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(cookie, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

const ROTAS_PUBLICAS = ["/login", "/esqueci-senha"];
// Só a tela de login manda quem já está logado de volta pra "/" - a de
// "esqueci senha" é só uma página de ajuda, sem problema em ver logado.
const ROTAS_SO_DESLOGADO = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas de API (usadas pela extensão de navegador, por exemplo) cuidam
  // da própria autenticação e devem responder com JSON (401/422...), não
  // com um redirect HTML pra /login - por isso saem cedo daqui.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Arquivos do PWA (manifest, ícones, service worker) precisam ser
  // acessíveis sem sessão - o navegador os busca antes/independente do
  // login pra permitir instalar o app.
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  const isRotaPublica = ROTAS_PUBLICAS.includes(pathname);
  const autenticado = await temSessaoValida(request);

  if (!isRotaPublica && !autenticado) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (ROTAS_SO_DESLOGADO.includes(pathname) && autenticado) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, exceto assets estaticos e a API interna do Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
