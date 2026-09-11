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

// O popup avisa o background quando uma decisão é tomada, pra atualizar
// o número no ícone na hora, sem esperar os próximos 5 minutos.
chrome.runtime.onMessage.addListener((mensagem) => {
  if (mensagem?.tipo === "pendentes-mudaram") atualizarBadge();
});
