const PRIORIDADE_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const elCarregando = document.getElementById("estado-carregando");
const elDeslogado = document.getElementById("estado-deslogado");
const elSemPermissao = document.getElementById("estado-sem-permissao");
const elLista = document.getElementById("lista-pendentes");
const modeloCard = document.getElementById("modelo-card");

function mostrarApenas(el) {
  for (const e of [elCarregando, elDeslogado, elSemPermissao, elLista]) {
    e.hidden = e !== el;
  }
}

async function abrirNoSite(caminho) {
  const baseUrl = await obterBaseUrl();
  chrome.tabs.create({ url: `${baseUrl}${caminho}` });
}

document.getElementById("btn-abrir-site").addEventListener("click", () => abrirNoSite("/"));
document.getElementById("btn-login").addEventListener("click", () => abrirNoSite("/login"));
document.getElementById("btn-nova-os").addEventListener("click", () => abrirNoSite("/os/novo"));
document.getElementById("btn-nova-os-2").addEventListener("click", () => abrirNoSite("/os/novo"));

function avisarBackgroundQueMudou() {
  chrome.runtime.sendMessage({ tipo: "pendentes-mudaram" });
}

async function enviarDecisao(cardEl, numero, decisao, comentario) {
  cardEl.classList.add("processando");
  const resultado = await chamarApi("/api/extensao/decidir", {
    method: "POST",
    body: JSON.stringify({ numero, decisao, comentario }),
  });

  if (!resultado.autenticado) {
    mostrarApenas(elDeslogado);
    return;
  }

  if (resultado.status !== 200) {
    cardEl.classList.remove("processando");
    alert(resultado.dados?.erro ?? "Não foi possível registrar a decisão.");
    return;
  }

  cardEl.remove();
  avisarBackgroundQueMudou();
  if (!elLista.querySelector(".card")) {
    elLista.innerHTML = '<p class="vazio">Nenhuma aprovação pendente. 🎉</p>';
  }
}

function montarCard(baseUrl, item) {
  const frag = modeloCard.content.cloneNode(true);
  const card = frag.querySelector(".card");

  const badge = frag.querySelector(".badge-prioridade");
  badge.textContent = PRIORIDADE_LABEL[item.prioridade] ?? item.prioridade;
  badge.classList.add(`badge-${item.prioridade}`);

  frag.querySelector(".numero").textContent = `#${item.numero}`;
  frag.querySelector(".titulo").textContent = item.titulo;
  frag.querySelector(".loja").textContent = item.loja;
  frag.querySelector(".valor").textContent = item.valor
    ? formatadorMoeda.format(Number(item.valor))
    : "—";

  const linkDetalhes = frag.querySelector(".ver-detalhes");
  linkDetalhes.href = `${baseUrl}/os/${item.numero}`;

  const comentarioWrap = frag.querySelector(".comentario-wrap");
  const acoes = frag.querySelector(".acoes");
  const textarea = frag.querySelector(".comentario");

  frag.querySelector(".botao-aprovar").addEventListener("click", () => {
    enviarDecisao(card, item.numero, "aprovado", undefined);
  });

  frag.querySelector(".botao-rejeitar").addEventListener("click", () => {
    acoes.hidden = true;
    comentarioWrap.hidden = false;
    textarea.focus();
  });

  frag.querySelector(".botao-cancelar").addEventListener("click", () => {
    comentarioWrap.hidden = true;
    acoes.hidden = false;
    textarea.value = "";
  });

  frag.querySelector(".botao-rejeitar-confirma").addEventListener("click", () => {
    const comentario = textarea.value.trim();
    if (!comentario) {
      textarea.focus();
      return;
    }
    enviarDecisao(card, item.numero, "rejeitado", comentario);
  });

  return frag;
}

async function carregar() {
  mostrarApenas(elCarregando);
  const resultado = await chamarApi("/api/extensao/pendentes");

  if (!resultado.autenticado) {
    mostrarApenas(elDeslogado);
    return;
  }

  const { papel, pendentes } = resultado.dados ?? { papel: null, pendentes: [] };

  if (papel !== "supervisor" && papel !== "diretor_dono" && papel !== "admin") {
    mostrarApenas(elSemPermissao);
    return;
  }

  elLista.innerHTML = "";
  if (pendentes.length === 0) {
    elLista.innerHTML = '<p class="vazio">Nenhuma aprovação pendente. 🎉</p>';
  } else {
    for (const item of pendentes) {
      elLista.appendChild(montarCard(resultado.baseUrl, item));
    }
  }
  mostrarApenas(elLista);
}

carregar();
