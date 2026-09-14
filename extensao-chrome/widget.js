// Content script - roda em (quase) toda página aberta no navegador (ver
// "matches" no manifest.json). Não usa config.js: qualquer chamada à API
// tem que passar pelo background (só ele tem host_permissions pra
// cross-origin fetch sem CORS - um content script "roda como a página").

const PRIORIDADE_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
const PRIORIDADE_COR = {
  baixa: { bg: "#E8ECEF", texto: "#3E4448" },
  media: { bg: "#EFEEEC", texto: "#5B5E62" },
  alta: { bg: "#FFF4DE", texto: "#92400E" },
  urgente: { bg: "#FDEAEA", texto: "#B91C1C" },
};
const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CSS = `
  * { box-sizing: border-box; }
  :host { all: initial; }
  [hidden] { display: none !important; }
  .raiz { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }

  .bolha {
    width: 52px; height: 52px; border-radius: 50%;
    background: #2D3033; border: 2.5px solid #F7931E;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    position: relative;
  }
  .bolha:hover { filter: brightness(1.08); }
  .bolha svg { display: block; }
  .contador {
    position: absolute; top: -4px; right: -4px;
    background: #F7931E; color: #fff; font-weight: 700; font-size: 11px;
    min-width: 19px; height: 19px; border-radius: 100px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; border: 2px solid #fff;
  }

  .painel {
    position: absolute; bottom: 64px; right: 0;
    width: 336px; max-height: 480px;
    background: #F5F5F4; border-radius: 14px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.28);
    overflow: hidden; display: flex; flex-direction: column;
    border: 1px solid #E3E2DF;
  }
  .painel[hidden] { display: none; }

  .topo {
    display: flex; align-items: center; justify-content: space-between;
    background: #2D3033; padding: 12px 14px; flex-shrink: 0;
  }
  .marca { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 13px; }
  .topo-acoes { display: flex; align-items: center; gap: 10px; }
  .link-topo { background: none; border: none; color: #F7931E; font-size: 11.5px; font-weight: 600; cursor: pointer; padding: 0; }
  .fechar { background: none; border: none; color: #9CA1A6; cursor: pointer; padding: 0; display: flex; }
  .fechar:hover { color: #fff; }

  .estado { padding: 26px 18px; text-align: center; font-size: 13px; color: #5B5E62; }
  .botao { border-radius: 8px; border: 1px solid #E3E2DF; background: #fff; padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer; color: #5B5E62; }
  .botao-principal { margin-top: 10px; background: #F7931E; border-color: #F7931E; color: #fff; padding: 9px 16px; }

  .lista { overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
  .lista .vazio { text-align: center; color: #8B8E92; font-size: 12.5px; padding: 24px 0; }

  .card { background: #fff; border: 1px solid #E3E2DF; border-radius: 10px; padding: 10px 12px; }
  .card.processando { opacity: 0.55; pointer-events: none; }
  .card-topo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
  .badge { border-radius: 100px; padding: 2px 8px; font-size: 10px; font-weight: 700; }
  .numero { font-size: 11px; color: #8B8E92; }
  .titulo { font-weight: 700; font-size: 12.5px; line-height: 1.35; color: #1D1E1F; }
  .loja { font-size: 11px; color: #5B5E62; margin-top: 2px; }
  .cartao-rodape { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
  .valor { font-weight: 700; font-size: 14px; color: #1D1E1F; }
  .ver-detalhes { font-size: 11px; font-weight: 600; color: #DB7E0A; text-decoration: none; }
  .acoes { display: flex; gap: 8px; margin-top: 9px; }
  .acoes .botao { flex: 1; }
  .botao-aprovar { background: #0CA30C; border-color: #0CA30C; color: #fff; }
  .botao-rejeitar { background: #FDEAEA; border-color: #F3C6C6; color: #B91C1C; }
  .comentario-wrap { margin-top: 9px; display: flex; flex-direction: column; gap: 6px; }
  .comentario-wrap[hidden] { display: none; }
  .comentario { width: 100%; min-height: 46px; border-radius: 8px; border: 1px solid #E3E2DF; padding: 7px 9px; font-size: 12px; font-family: inherit; resize: vertical; }
  .acoes-comentario { display: flex; gap: 8px; }
  .acoes-comentario .botao { flex: 1; }
  .botao-rejeitar-confirma { background: #B91C1C; border-color: #B91C1C; color: #fff; }
`;

function elemento(tag, props = {}, filhos = []) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  for (const filho of filhos) el.appendChild(filho);
  return el;
}

function pedirAoBackground(mensagem) {
  return chrome.runtime.sendMessage(mensagem);
}

async function iniciar() {
  const resultado = await pedirAoBackground({ tipo: "widget-obter-pendentes" }).catch(() => null);
  if (!resultado?.autenticado) return; // não logado - não polui a página com nada

  const papel = resultado.dados?.papel;
  if (papel !== "supervisor" && papel !== "diretor_dono" && papel !== "admin") return;

  // Já estamos dentro do próprio site do Mercadão O.S.? A interface
  // completa já resolve isso - a bolha flutuante só faz sentido em
  // qualquer OUTRA página que a pessoa esteja usando.
  try {
    if (new URL(resultado.baseUrl).origin === window.location.origin) return;
  } catch {
    // baseUrl mal configurado - segue e mostra o widget mesmo assim.
  }

  montarWidget(resultado.baseUrl, resultado.dados);
}

function montarWidget(baseUrl, dadosIniciais) {
  const host = document.createElement("div");
  host.id = "mercadao-os-widget-host";
  const raizSombra = host.attachShadow({ mode: "open" });

  const estilo = document.createElement("style");
  estilo.textContent = CSS;
  raizSombra.appendChild(estilo);

  const raiz = elemento("div", { className: "raiz" });

  const contador = elemento("span", { className: "contador", hidden: true });
  const bolha = elemento("div", { className: "bolha", title: "Mercadão O.S." }, [
    (() => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "26");
      svg.setAttribute("height", "26");
      svg.setAttribute("viewBox", "0 0 40 40");
      svg.innerHTML =
        '<circle cx="20" cy="20" r="18" fill="#2D3033"/><text x="20" y="27" text-anchor="middle" font-weight="700" font-size="17" fill="#fff" font-family="system-ui">m</text>';
      return svg;
    })(),
    contador,
  ]);

  const painel = elemento("div", { className: "painel" });
  painel.hidden = true;

  raiz.appendChild(painel);
  raiz.appendChild(bolha);
  raizSombra.appendChild(raiz);
  document.body.appendChild(host);

  let carregado = false;

  bolha.addEventListener("click", async () => {
    painel.hidden = !painel.hidden;
    if (!painel.hidden && !carregado) {
      carregado = true;
      await renderizarPainel(baseUrl, dadosIniciais);
    }
  });

  function atualizarContador(total) {
    if (total > 0) {
      contador.textContent = String(total);
      contador.hidden = false;
    } else {
      contador.hidden = true;
    }
  }
  atualizarContador(dadosIniciais?.total ?? 0);

  async function renderizarPainel(baseUrlAtual, dados) {
    painel.innerHTML = "";

    const topo = elemento("div", { className: "topo" }, [
      elemento("div", { className: "marca", textContent: "Mercadão O.S." }),
      elemento("div", { className: "topo-acoes" }, [
        elemento("button", {
          className: "link-topo",
          textContent: "Abrir site ↗",
          onclick: () => window.open(baseUrlAtual, "_blank"),
        }),
        elemento("button", {
          className: "fechar",
          innerHTML:
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
          onclick: () => {
            painel.hidden = true;
          },
        }),
      ]),
    ]);
    painel.appendChild(topo);

    const lista = elemento("div", { className: "lista" });
    painel.appendChild(lista);

    function montarCard(item) {
      const card = elemento("div", { className: "card" });

      const cor = PRIORIDADE_COR[item.prioridade] ?? { bg: "#EFEEEC", texto: "#5B5E62" };
      const badge = elemento("span", {
        className: "badge",
        textContent: PRIORIDADE_LABEL[item.prioridade] ?? item.prioridade,
        style: `background:${cor.bg};color:${cor.texto}`,
      });
      const numero = elemento("span", { className: "numero", textContent: `#${item.numero}` });
      card.appendChild(elemento("div", { className: "card-topo" }, [badge, numero]));
      card.appendChild(elemento("div", { className: "titulo", textContent: item.titulo }));
      card.appendChild(elemento("div", { className: "loja", textContent: item.loja }));

      const valor = elemento("span", {
        className: "valor",
        textContent: item.valor ? formatadorMoeda.format(Number(item.valor)) : "—",
      });
      const verDetalhes = elemento("a", {
        className: "ver-detalhes",
        textContent: "Ver detalhes",
        href: `${baseUrlAtual}/os/${item.numero}`,
        target: "_blank",
      });
      card.appendChild(elemento("div", { className: "cartao-rodape" }, [valor, verDetalhes]));

      const comentarioWrap = elemento("div", { className: "comentario-wrap" });
      comentarioWrap.hidden = true;
      const textarea = elemento("textarea", {
        className: "comentario",
        placeholder: "Motivo (obrigatório)...",
      });
      const acoesComentario = elemento("div", { className: "acoes-comentario" });
      const btnCancelar = elemento("button", { className: "botao", textContent: "Cancelar" });
      const btnConfirmarRejeicao = elemento("button", {
        className: "botao botao-rejeitar-confirma",
        textContent: "Confirmar rejeição",
      });
      acoesComentario.appendChild(btnCancelar);
      acoesComentario.appendChild(btnConfirmarRejeicao);
      comentarioWrap.appendChild(textarea);
      comentarioWrap.appendChild(acoesComentario);
      card.appendChild(comentarioWrap);

      const acoes = elemento("div", { className: "acoes" });
      const btnRejeitar = elemento("button", { className: "botao botao-rejeitar", textContent: "Rejeitar" });
      const btnAprovar = elemento("button", { className: "botao botao-aprovar", textContent: "Aprovar" });
      acoes.appendChild(btnRejeitar);
      acoes.appendChild(btnAprovar);
      card.appendChild(acoes);

      async function enviarDecisao(decisao, comentario) {
        card.classList.add("processando");
        const resultado = await pedirAoBackground({
          tipo: "widget-decidir",
          numero: item.numero,
          decisao,
          comentario,
        });

        if (!resultado?.autenticado) {
          painel.hidden = true;
          return;
        }
        if (resultado.status !== 200) {
          card.classList.remove("processando");
          alert(resultado.dados?.erro ?? "Não foi possível registrar a decisão.");
          return;
        }
        card.remove();
        atualizarContador(Math.max(0, (Number(contador.textContent) || 0) - 1));
        if (!lista.querySelector(".card")) {
          lista.innerHTML = '<p class="vazio">Nenhuma aprovação pendente. 🎉</p>';
        }
      }

      btnAprovar.addEventListener("click", () => enviarDecisao("aprovado", undefined));
      btnRejeitar.addEventListener("click", () => {
        acoes.hidden = true;
        comentarioWrap.hidden = false;
        textarea.focus();
      });
      btnCancelar.addEventListener("click", () => {
        comentarioWrap.hidden = true;
        acoes.hidden = false;
        textarea.value = "";
      });
      btnConfirmarRejeicao.addEventListener("click", () => {
        const comentario = textarea.value.trim();
        if (!comentario) {
          textarea.focus();
          return;
        }
        enviarDecisao("rejeitado", comentario);
      });

      return card;
    }

    const pendentes = dados?.pendentes ?? [];
    lista.style.maxHeight = "416px";
    if (pendentes.length === 0) {
      lista.innerHTML = '<p class="vazio">Nenhuma aprovação pendente. 🎉</p>';
    } else {
      for (const item of pendentes) lista.appendChild(montarCard(item));
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
