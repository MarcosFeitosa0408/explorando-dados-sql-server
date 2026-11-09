"use strict";

const feedback = document.querySelector("#aviso-copia");
document.querySelectorAll(".copy-sql").forEach(botao => {
  let espera;
  botao.addEventListener("click", async () => {
    const codigo = document.getElementById(botao.dataset.code);
    clearTimeout(espera);
    try {
      await navigator.clipboard.writeText(codigo.textContent);
      botao.textContent = "Copiado!";
      feedback.textContent = "Código copiado.";
    } catch {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(codigo);
      const selecao = window.getSelection();
      selecao.removeAllRanges();
      selecao.addRange(intervalo);
      botao.textContent = "Código selecionado";
      feedback.textContent = "Código selecionado. Use o comando de copiar do navegador.";
    }
    espera = setTimeout(() => { botao.textContent = "Copiar código"; }, 2500);
  });
});
