// Configuração compartilhada entre popup.js e background.js.
// A URL do site fica salva no chrome.storage.sync (editável na página de
// opções da extensão) pra não precisar reinstalar a extensão quando o
// sistema for do ambiente local pra produção.

const URL_PADRAO = "http://localhost:3000";

async function obterBaseUrl() {
  const { baseUrl } = await chrome.storage.sync.get("baseUrl");
  return baseUrl || URL_PADRAO;
}

// Lê o cookie de sessão do site diretamente do navegador. Funciona mesmo
// sendo um cookie httpOnly porque chrome.cookies é uma API do próprio
// navegador (não JavaScript de página) - por isso a extensão precisa da
// permissão "cookies" no manifest.
async function obterTokenSessao(baseUrl) {
  const cookie = await chrome.cookies.get({ url: baseUrl, name: "session" });
  return cookie?.value ?? null;
}

async function chamarApi(caminho, opcoes = {}) {
  const baseUrl = await obterBaseUrl();
  const token = await obterTokenSessao(baseUrl);
  if (!token) {
    return { autenticado: false, baseUrl };
  }

  const resp = await fetch(`${baseUrl}${caminho}`, {
    ...opcoes,
    headers: {
      "X-Session-Token": token,
      ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
      ...opcoes.headers,
    },
  });

  if (resp.status === 401) {
    return { autenticado: false, baseUrl };
  }

  const dados = await resp.json().catch(() => null);
  return { autenticado: true, baseUrl, status: resp.status, dados };
}
