importScripts("config.js");

const NOME_ALARME = "verificar-pendentes";

async function atualizarBadge() {
  try {
    const resultado = await chamarApi("/api/extensao/pendentes");

    if (!resultado.autenticado) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const total = resultado.dados?.total ?? 0;
    chrome.action.setBadgeText({ text: total > 0 ? String(total) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#F7931E" });
  } catch {
    // Site fora do ar / sem internet - não derruba a extensão, só não
    // atualiza o número por enquanto.
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(NOME_ALARME, { periodInMinutes: 5 });
  atualizarBadge();
});

chrome.runtime.onStartup.addListener(() => {
  atualizarBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === NOME_ALARME) atualizarBadge();
});

// O popup e o widget flutuante (content script, roda na página de fora -
// não tem acesso direto à API por causa de CORS) avisam/pedem pro
// background, que é quem de fato tem permissão pra buscar em qualquer
// origem (host_permissions só vale pra páginas da extensão, não pra
// content scripts).
chrome.runtime.onMessage.addListener((mensagem, _remetente, enviarResposta) => {
  if (mensagem?.tipo === "pendentes-mudaram") {
    atualizarBadge();
    return;
  }

  if (mensagem?.tipo === "widget-obter-pendentes") {
    chamarApi("/api/extensao/pendentes").then(enviarResposta);
    return true; // mantém o canal aberto pra resposta assíncrona
  }

  if (mensagem?.tipo === "widget-decidir") {
    const { numero, decisao, comentario } = mensagem;
    chamarApi("/api/extensao/decidir", {
      method: "POST",
      body: JSON.stringify({ numero, decisao, comentario }),
    }).then((resultado) => {
      atualizarBadge();
      enviarResposta(resultado);
    });
    return true;
  }
});
