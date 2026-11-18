(() => {
  /* QA hook: ?qa=<scrollY> scrolls there after load (used for headless screenshots) */
  const qaY = new URLSearchParams(location.search).get("qa");
  if (qaY !== null) addEventListener("load", () => setTimeout(() => window.scrollTo(0, parseInt(qaY, 10) || 0), 300));
  const S = window.SITE || {};
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = matchMedia("(max-width: 760px)").matches;


  /* ── Rolagem que toca o vídeo ─────────────────────────────────────────── */
  const cine = document.querySelector(".cine");
  const canvas = cine && cine.querySelector(".cine-canvas");
  if (cine && canvas && S.frames && S.frames.total) {
    const ctx = canvas.getContext("2d");
    const total = (celular && S.frames.mobileTotal) ? S.frames.mobileTotal : S.frames.total;
    const padrao = celular ? S.frames.mobile : S.frames.desktop;
    const src = (i) => padrao.replace("{n}", String(i + 1).padStart(4, "0"));
    const quadros = new Array(total);
    const momentos = [...cine.querySelectorAll(".momento")];
    let alvo = 0, atual = 0, desenhado = -1;

    const carregar = (i) => {
      if (quadros[i]) return quadros[i];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.onload = () => { if (Math.abs(atual - i) < 1 || desenhado === -1) desenhar(atual, true); };
      return (quadros[i] = img);
    };

    // Carrega em passadas (1 a cada 8, depois 1 a cada 4…) para cobrir o filme inteiro cedo
    carregar(0);
    if (!reduzir) {
      const fila = [];
      for (const passo of [8, 4, 2, 1]) for (let i = 0; i < total; i += passo) if (!fila.includes(i)) fila.push(i);
      let k = 0;
      const lote = () => { for (let n = 0; n < 6 && k < fila.length; n++) carregar(fila[k++]); if (k < fila.length) setTimeout(lote, 40); };
      lote();
    }

    const pronto = (i) => quadros[i] && quadros[i].complete && quadros[i].naturalWidth;
    const maisProximo = (i) => {
      for (let d = 0; d < total; d++) {
        if (pronto(i - d)) return i - d;
        if (pronto(i + d)) return i + d;
      }
      return -1;
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      desenhado = -1;
      desenhar(atual, true);
    };

    function desenharUm(img, alpha) {
      const cw = canvas.width, ch = canvas.height;
      const escala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // "cover"
      const w = img.naturalWidth * escala, h = img.naturalHeight * escala;
      ctx.globalAlpha = alpha;
      const ancora = 0.5; // phones now get a portrait film, so a centred crop is right
      ctx.drawImage(img, (cw - w) / 2, (ch - h) * ancora, w, h);
      ctx.globalAlpha = 1;
    }
    // Desenha o quadro fracionário: mistura o quadro inferior e o superior
    // para que a rolagem pareça contínua e não "em degraus".
    function desenhar(pos, forcar) {
      const chave = Math.round(pos * 20) / 20;
      if (chave === desenhado && !forcar) return;
      const i0 = Math.floor(pos), i1 = Math.min(total - 1, i0 + 1), f = pos - i0;
      if (pronto(i0) && pronto(i1)) {
        desenharUm(quadros[i0], 1);
        if (f > 0.01 && i1 !== i0) desenharUm(quadros[i1], f);
        desenhado = chave;
        return;
      }
      const j = maisProximo(Math.round(pos));
      if (j < 0) return;
      desenharUm(quadros[j], 1);
      desenhado = chave;
    }

    const fimVideo = (celular && document.querySelector("[data-fim-video-mobile]")) || document.querySelector("[data-fim-video]");
    const cursoTotal = () => fimVideo
      ? fimVideo.offsetTop + fimVideo.offsetHeight - innerHeight
      : document.documentElement.scrollHeight - innerHeight;
    // Script (optional): pins film positions to sections, so each act of the film
    // lands on the section it belongs to whatever the content height.
    // config: roteiro / mobileRoteiro = [{ em: "#about", filme: 0.333 }, ...]
    const roteiro = (celular && S.frames.mobileRoteiro) || S.frames.roteiro || null;
    let pontos = null;
    const montarPontos = () => {
      if (!roteiro) return;
      const lista = [[0, 0]];
      for (const r of roteiro) {
        const el = document.querySelector(r.em);
        if (el) lista.push([el.offsetTop, Math.min(1, Math.max(0, r.filme))]);
      }
      lista.push([cursoTotal(), 1]);
      lista.sort((a, b) => a[0] - b[0]);
      pontos = lista;
    };
    const progresso = () => {
      const y = scrollY;
      if (pontos) {
        for (let k = 1; k < pontos.length; k++) {
          const [y0, f0] = pontos[k - 1], [y1, f1] = pontos[k];
          if (y <= y1) return y1 > y0 ? Math.max(f0, Math.min(f1, f0 + (f1 - f0) * (y - y0) / (y1 - y0))) : f1;
        }
        return 1;
      }
      return Math.min(1, Math.max(0, y / (cursoTotal() || 1)));
    };
    // Moments: opening section only
    const progressoCine = () => {
      const r = cine.getBoundingClientRect();
      const curso = cine.offsetHeight - innerHeight;
      return Math.min(1, Math.max(0, -r.top / (curso || 1)));
    };

    const atualizarMomentos = (p) => {
      for (const m of momentos) {
        const de = parseFloat(m.dataset.de || 0), ate = parseFloat(m.dataset.ate || 1);
        m.classList.toggle("ativo", p >= de && (p < ate || (ate >= 1 && p >= 1)));
      }
      cine.classList.toggle("andou", p > 0.02);
    };

    const quadro = () => {
      alvo = progresso() * (total - 1);
      atual += (alvo - atual) * 0.12; // suaviza: sensação de filme, não de slide
      if (Math.abs(alvo - atual) < 0.01) atual = alvo;
      desenhar(atual);
      atualizarMomentos(progressoCine());
      requestAnimationFrame(quadro);
    };

    addEventListener("resize", () => { montarPontos(); ajustar(); });
    addEventListener("load", montarPontos); // offsets settle once fonts and images are in
    montarPontos();
    ajustar();
    if (reduzir) atualizarMomentos(0);
    else requestAnimationFrame(quadro);
  }

  /* ── Parallax leve nas artes ──────────────────────────────────────────── */
  const artes = reduzir ? [] : [...document.querySelectorAll(".arte")];
  if (artes.length) {
    const mover = () => {
      for (const a of artes) {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = `translate3d(0, ${(c * -60).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    addEventListener("scroll", () => requestAnimationFrame(mover), { passive: true });
    mover();
  }

  /* ── Topo, revelar e ano ──────────────────────────────────────────────── */
  const topo = document.querySelector(".topo");
  const whats = document.querySelector(".whats");
  let formNaTela = false; // o botão flutuante se recolhe para não cobrir o "Enviar"
  const aoRolar = () => {
    topo && topo.classList.toggle("rolou", scrollY > 40);
    whats && whats.classList.toggle("visivel", scrollY > innerHeight * 0.6 && !formNaTela);
  };
  const formEl = document.querySelector(".form");
  if (formEl) new IntersectionObserver(([e]) => { formNaTela = e.isIntersecting; aoRolar(); }).observe(formEl);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: 0.18 });
  document.querySelectorAll(".revelar").forEach((el) => io.observe(el));
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── WhatsApp ─────────────────────────────────────────────────────────── */
  if (whats && S.whatsapp) {
    const num = String(S.whatsapp.numero || "").replace(/\D/g, "");
    whats.href = `https://wa.me/${num}?text=${encodeURIComponent(S.whatsapp.mensagem || "")}`;
  }

  /* ── Formulário → e-mail ──────────────────────────────────────────────── */
  const form = document.querySelector(".form");
  if (form && S.contato) {
    const status = form.querySelector(".form-status");
    const botao = form.querySelector("button[type=submit]");
    const avisar = (txt, tipo) => { status.textContent = txt; status.className = `form-status campo--inteiro ${tipo || ""}`; };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (form.elements._honey.value) return; // robô
      let valido = true;
      form.querySelectorAll("[required]").forEach((c) => {
        const ok = c.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value) : c.value.trim().length > 1;
        c.closest(".campo").classList.toggle("erro", !ok);
        if (!ok) valido = false;
      });
      if (!valido) return avisar("Please check the highlighted fields.", "falha");

      const dados = Object.fromEntries(new FormData(form));
      delete dados._honey;
      const assunto = S.contato.assunto || `New contact from the ${S.nome || ""} website`;
      let url, corpo;
      if (S.contato.web3formsChave) {
        url = "https://api.web3forms.com/submit";
        corpo = { access_key: S.contato.web3formsChave, subject: assunto, from_name: S.nome, ...dados };
      } else {
        url = `https://formsubmit.co/ajax/${encodeURIComponent(S.contato.email)}`;
        corpo = { _subject: assunto, _template: "table", _captcha: "false", ...dados };
      }

      botao.disabled = true;
      avisar("Sending…");
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(corpo),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status);
        form.reset();
        avisar("Thanks, we have your message. A consultant will be in touch shortly.", "ok");
      } catch (e) {
        console.warn("Falha no envio do formulário:", e);
        avisar("We could not send that right now. Reach us on WhatsApp instead.", "falha");
      } finally {
        botao.disabled = false;
      }
    });
  }
})();
