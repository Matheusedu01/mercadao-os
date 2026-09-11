const campo = document.getElementById("baseUrl");
const status = document.getElementById("status");

chrome.storage.sync.get("baseUrl").then(({ baseUrl }) => {
  campo.value = baseUrl || "http://localhost:3000";
});

document.getElementById("salvar").addEventListener("click", async () => {
  const valor = campo.value.trim().replace(/\/$/, "");
  if (!valor) return;
  await chrome.storage.sync.set({ baseUrl: valor });
  status.hidden = false;
  setTimeout(() => (status.hidden = true), 2000);
});
