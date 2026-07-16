((cssText, artDataUrl, emblemDataUrl, themeConfig) => {
  const STATE_KEY = "__CODEX_DREAM_SKIN_STATE__";
  const DISABLED_KEY = "__CODEX_DREAM_SKIN_DISABLED__";
  const STYLE_ID = "codex-dream-skin-style";
  const CHROME_ID = "codex-dream-skin-chrome";
  const SHELL_ATTR = "data-dream-shell";
  const VERSION = __DREAM_SKIN_VERSION_JSON__;
  const THEME = themeConfig && typeof themeConfig === "object" ? themeConfig : {};
  const THEME_VARIABLES = [
    "--ds-bg", "--ds-panel", "--ds-panel-2", "--ds-red", "--ds-red-bright",
    "--ds-red-dark", "--ds-gold", "--ds-ink", "--ds-muted", "--ds-success",
    "--dream-skin-emblem",
    "--dream-skin-name", "--dream-skin-tagline", "--dream-skin-project-prefix",
    "--dream-skin-project-label",
  ];
  window[DISABLED_KEY] = false;

  const previous = window[STATE_KEY];
  if (previous?.observer) previous.observer.disconnect();
  if (previous?.timer) clearInterval(previous.timer);
  if (previous?.scheduler?.timeout) clearTimeout(previous.scheduler.timeout);
  if (previous?.resizeHandler) window.removeEventListener("resize", previous.resizeHandler);
  if (previous?.mediaHandler && previous?.mediaQuery) {
    try { previous.mediaQuery.removeEventListener("change", previous.mediaHandler); } catch {}
  }
  if (previous?.artUrl) URL.revokeObjectURL(previous.artUrl);

  const artUrl = (() => {
    const comma = artDataUrl.indexOf(",");
    const mime = /^data:([^;,]+)/.exec(artDataUrl)?.[1] || "image/png";
    const binary = atob(artDataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  })();

  const cssString = (value) => JSON.stringify(String(value ?? ""));

  const detectShellMode = () => "light";

  const applyTheme = (root) => {
    const colors = THEME.colors || {};
    const variables = {
      "--ds-bg": colors.background || "#fff8e8",
      "--ds-panel": colors.panel || "#fffcf5",
      "--ds-panel-2": colors.panelAlt || "#fff2df",
      "--ds-red": colors.accent || "#9b0000",
      "--ds-red-bright": colors.accentAlt || "#c81717",
      "--ds-red-dark": colors.highlight || "#6f0808",
      "--ds-gold": colors.secondary || "#c89322",
      "--ds-ink": colors.text || "#291815",
      "--ds-muted": colors.muted || "#67534d",
      "--ds-success": "#198754",
    };

    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
    root.style.setProperty("--dream-skin-name", cssString(THEME.name || "CODEX 中国红"));
    root.style.setProperty(
      "--dream-skin-tagline",
      cssString(THEME.tagline || "让每一次创造，都成为值得骄傲的成果。"),
    );
    root.style.setProperty("--dream-skin-project-prefix", cssString(THEME.projectPrefix || "选择项目 · "));
    root.style.setProperty("--dream-skin-project-label", cssString(THEME.projectLabel || "选择项目"));
  };

  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.textContent = cssText;
    existingStyle.dataset.dreamSkinVersion = VERSION;
  }

  const ensure = () => {
    if (window[DISABLED_KEY]) return;
    const root = document.documentElement;
    if (!root) return;
    root.classList.add("codex-dream-skin");
    root.setAttribute(SHELL_ATTR, "light");
    root.style.setProperty("--dream-skin-art", `url("${artUrl}")`);
    root.style.setProperty("--dream-skin-emblem", emblemDataUrl ? `url("${emblemDataUrl}")` : "none");
    applyTheme(root);

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.dataset.dreamSkinVersion !== VERSION) {
      style.textContent = cssText;
      style.dataset.dreamSkinVersion = VERSION;
    }

    const shellMain = document.querySelector("main.main-surface") || document.querySelector("main");
    const homeIndicator = document.querySelector('[data-testid="home-icon"]');
    const home = homeIndicator?.closest('[role="main"]') ||
      [...document.querySelectorAll('[role="main"]')].find((candidate) =>
        candidate.querySelector('[data-feature="game-source"]') &&
        candidate.querySelector('.group\\\\/home-suggestions')) || null;
    for (const candidate of document.querySelectorAll('[role="main"].dream-skin-home')) {
      if (candidate !== home) candidate.classList.remove("dream-skin-home");
    }
    if (home) home.classList.add("dream-skin-home");

    if (!shellMain || !document.body) return;
    shellMain.classList.toggle("dream-skin-home-shell", Boolean(home));
    let chrome = document.getElementById(CHROME_ID);
    if (!chrome || chrome.parentElement !== document.body) {
      chrome?.remove();
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      chrome.setAttribute("aria-hidden", "true");
      chrome.innerHTML = `
        <div class="dream-skin-brand">
          <img class="dream-skin-emblem" alt="中华人民共和国国徽" />
          <span><b></b><small></small></span>
        </div>
        <div class="dream-skin-status"><i></i><span></span></div>`;
      document.body.appendChild(chrome);
    }
    const emblem = chrome.querySelector(".dream-skin-emblem");
    if (emblem) {
      emblem.src = emblemDataUrl || "";
      emblem.style.display = emblemDataUrl ? "block" : "none";
    }
    chrome.querySelector(".dream-skin-brand b").textContent = THEME.name || "CODEX 中国红";
    chrome.querySelector(".dream-skin-brand small").textContent = THEME.brandSubtitle || "代码自强 · 智造未来";
    chrome.querySelector(".dream-skin-status span").textContent = THEME.statusText || "中国红模式";
    const shellBox = shellMain.getBoundingClientRect();
    chrome.style.left = `${Math.round(shellBox.left)}px`;
    chrome.style.top = `${Math.round(shellBox.top)}px`;
    chrome.style.width = `${Math.round(shellBox.width)}px`;
    chrome.style.height = `${Math.round(shellBox.height)}px`;
    chrome.classList.toggle("dream-skin-home-shell", Boolean(home));
    chrome.dataset.dreamShell = "light";
  };

  const cleanup = () => {
    window[DISABLED_KEY] = true;
    document.documentElement?.classList.remove("codex-dream-skin");
    document.documentElement?.removeAttribute(SHELL_ATTR);
    document.documentElement?.style.removeProperty("--dream-skin-art");
    document.documentElement?.style.removeProperty("--dream-skin-emblem");
    for (const name of THEME_VARIABLES) document.documentElement?.style.removeProperty(name);
    document.querySelectorAll(".dream-skin-home").forEach((node) => node.classList.remove("dream-skin-home"));
    document.querySelectorAll(".dream-skin-home-shell").forEach((node) => node.classList.remove("dream-skin-home-shell"));
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CHROME_ID)?.remove();
    const state = window[STATE_KEY];
    state?.observer?.disconnect();
    if (state?.timer) clearInterval(state.timer);
    if (state?.scheduler?.timeout) clearTimeout(state.scheduler.timeout);
    if (state?.resizeHandler) window.removeEventListener("resize", state.resizeHandler);
    if (state?.mediaHandler && state?.mediaQuery) {
      try { state.mediaQuery.removeEventListener("change", state.mediaHandler); } catch {}
    }
    if (state?.artUrl) URL.revokeObjectURL(state.artUrl);
    delete window[STATE_KEY];
    return true;
  };

  const scheduler = { timeout: null };
  const scheduleEnsure = () => {
    if (scheduler.timeout) clearTimeout(scheduler.timeout);
    scheduler.timeout = setTimeout(() => {
      scheduler.timeout = null;
      ensure();
    }, 180);
  };
  const observer = new MutationObserver(scheduleEnsure);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-appearance", "data-color-mode", "style"],
  });
  const timer = setInterval(ensure, 4000);
  const resizeHandler = scheduleEnsure;
  window.addEventListener("resize", resizeHandler, { passive: true });

  let mediaQuery = null;
  let mediaHandler = null;
  try {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaHandler = () => scheduleEnsure();
    mediaQuery.addEventListener("change", mediaHandler);
  } catch {}

  window[STATE_KEY] = {
    ensure,
    cleanup,
    observer,
    timer,
    scheduler,
    resizeHandler,
    mediaQuery,
    mediaHandler,
    artUrl,
    version: VERSION,
    themeId: THEME.id || "custom",
    detectShellMode,
  };
  ensure();
  return { installed: true, version: VERSION, themeId: THEME.id || "custom", shell: detectShellMode() };
})(__DREAM_SKIN_CSS_JSON__, __DREAM_SKIN_ART_JSON__, __DREAM_SKIN_EMBLEM_JSON__, __DREAM_SKIN_THEME_JSON__)
