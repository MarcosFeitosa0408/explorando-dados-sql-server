"use strict";

const canais = [
  { id: "app", nome: "App" },
  { id: "balcao", nome: "Balcão" },
  { id: "site", nome: "Site" }
];

const transacoes = [
  { id: 101, canal: "site", data: "2026-03-05", valor: 200 },
  { id: 102, canal: "site", data: "2026-03-10", valor: 100 },
  { id: 103, canal: "site", data: "2026-03-31", valor: 300 },
  { id: 201, canal: "app", data: "2026-03-08", valor: 150 },
  { id: 202, canal: "app", data: "2026-03-12", valor: 50 },
  { id: 203, canal: "app", data: "2026-03-15", valor: 100 },
  { id: 204, canal: "app", data: "2026-03-31", valor: 80 }
];

const eventos = [
  [1, 101, "2026-03-05T08:01:00", "Pendente"],
  [2, 101, "2026-03-06T10:00:00", "Aprovada"],
  [3, 101, "2026-03-07T10:00:00", "Aprovada"],
  [4, 102, "2026-03-10T08:01:00", "Pendente"],
  [5, 102, "2026-03-10T08:01:00", "Recusada"],
  [6, 103, "2026-03-31T20:01:00", "Pendente"],
  [7, 103, "2026-04-01T00:00:00", "Aprovada"],
  [8, 201, "2026-03-08T08:01:00", "Aprovada"],
  [9, 202, "2026-03-12T08:01:00", "Aprovada"],
  [10, 203, "2026-03-15T08:01:00", "Recusada"]
];

const estornos = [
  [101, "2026-03-20", 20], [101, "2026-03-25", 30], [101, null, 10],
  [101, "2026-04-01", 40], [201, "2026-03-26", 15]
];

const inicio = "2026-03-01";
const corte = "2026-04-01";

function consolidar() {
  const ultimos = new Map();
  for (const [id, transacao, data, status] of eventos) {
    const anterior = ultimos.get(transacao);
    if (data < corte && (!anterior || data > anterior.data || (data === anterior.data && id > anterior.id))) {
      ultimos.set(transacao, { id, data, status });
    }
  }
  const estornoPorTransacao = new Map();
  for (const [transacao, data, valor] of estornos) {
    if (data && data < corte) {
      estornoPorTransacao.set(transacao, (estornoPorTransacao.get(transacao) ?? 0) + valor);
    }
  }
  return canais.map(canal => {
    const resumo = { ...canal, tentativas: 0, aprovadas: 0, semEvento: 0, aprovado: 0, estornado: 0 };
    for (const item of transacoes) {
      if (item.canal !== canal.id || item.data < inicio || item.data >= corte) continue;
      resumo.tentativas++;
      const evento = ultimos.get(item.id);
      if (!evento) resumo.semEvento++;
      if (evento?.status === "Aprovada") {
        resumo.aprovadas++;
        resumo.aprovado += item.valor;
        resumo.estornado += estornoPorTransacao.get(item.id) ?? 0;
      }
    }
    return resumo;
  });
}

const dados = consolidar();
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percentual = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const taxa = (numerador, denominador) => denominador ? percentual.format(numerador / denominador) : "—";
let filtro = "todos";

const textos = {
  todos: ["Mesmo valor aprovado, saldos diferentes", "App e Site aprovaram R$ 200 cada. Após os estornos confirmados, restaram R$ 185 no App e R$ 150 no Site."],
  app: ["Duas aprovações em quatro tentativas", "O App manteve R$ 185 após os estornos. Uma das quatro transações ainda não tinha evento registrado no fechamento."],
  site: ["R$ 50 estornados em uma transação", "Dois estornos parciais confirmados, de R$ 20 e R$ 30, reduziram o saldo de R$ 200 para R$ 150."],
  balcao: ["Sem movimento em março", "O Balcão não teve tentativas no período. As taxas ficam indisponíveis porque seus denominadores são zero."]
};

function selecionados() {
  return filtro === "todos" ? dados : dados.filter(canal => canal.id === filtro);
}

function renderizar() {
  const linhas = selecionados();
  const total = { tentativas: 0, aprovadas: 0, aprovado: 0, estornado: 0 };
  for (const linha of linhas) {
    for (const chave of Object.keys(total)) total[chave] += linha[chave];
  }
  const indicadores = [
    ["Tentativas", total.tentativas],
    ["Taxa de aprovação", taxa(total.aprovadas, total.tentativas)],
    ["Valor aprovado", moeda.format(total.aprovado)],
    ["Valor após estornos", moeda.format(total.aprovado - total.estornado)]
  ];
  document.querySelector("#indicadores").innerHTML = indicadores.map(([nome, valor]) =>
    `<div class="metric"><span>${nome}</span><strong>${valor}</strong></div>`).join("");

  const escala = Math.max(1, ...dados.map(linha => linha.aprovado));
  document.querySelector("#barras").innerHTML = linhas.map(linha => {
    const saldo = linha.aprovado - linha.estornado;
    return `<div><div class="bar-label"><strong>${linha.nome}</strong><span>${moeda.format(saldo)} após estornos · ${moeda.format(linha.estornado)} estornado</span></div>
    <div class="track" aria-hidden="true"><i style="width:${100 * saldo / escala}%"></i><i style="width:${100 * linha.estornado / escala}%"></i></div></div>`;
  }).join("");

  document.querySelector("#tabela").innerHTML = linhas.map(linha => `<tr>
    <th scope="row">${linha.nome}</th><td>${linha.tentativas}</td><td>${linha.aprovadas}</td><td>${linha.semEvento}</td>
    <td>${moeda.format(linha.aprovado)}</td><td>${moeda.format(linha.estornado)}</td>
    <td>${moeda.format(linha.aprovado - linha.estornado)}</td><td>${taxa(linha.estornado, linha.aprovado)}</td></tr>`).join("");

  const [titulo, texto] = textos[filtro];
  document.querySelector("#insight-titulo").textContent = titulo;
  document.querySelector("#insight-texto").textContent = texto;
}

function gerarCsv(linhas) {
  const cabecalho = "Canal;Tentativas;Aprovadas;SemEvento;ValorAprovado;ValorEstornado;ValorAposEstornos;TaxaAprovacaoPct;TaxaEstornoPct";
  const decimal = valor => valor.toFixed(2).replace(".", ",");
  const percentualCsv = (n, d) => d ? decimal(100 * n / d) : "";
  return [cabecalho, ...linhas.map(linha => [
    linha.nome, linha.tentativas, linha.aprovadas, linha.semEvento,
    decimal(linha.aprovado), decimal(linha.estornado), decimal(linha.aprovado - linha.estornado),
    percentualCsv(linha.aprovadas, linha.tentativas), percentualCsv(linha.estornado, linha.aprovado)
  ].join(";"))].join("\r\n");
}

document.querySelectorAll("[data-filter]").forEach(botao => {
  botao.addEventListener("click", () => {
    filtro = botao.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(item =>
      item.setAttribute("aria-pressed", String(item === botao)));
    renderizar();
  });
});

document.querySelector("#exportar").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob(["\uFEFF", gerarCsv(selecionados())], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "explorando-dados-marco-2026.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderizar();
