(function initializeFocusIslandI18n() {
  "use strict";

  const PREFERENCES_KEY = "focusIslandPreferencesV1";
  const SUPPORTED_LANGUAGES = new Set(["zh-CN", "en"]);
  const TRANSLATABLE_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
  const OBSERVER_OPTIONS = {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRIBUTES,
  };
  const english = window.__FOCUS_ISLAND_LOCALES__?.en || {};
  const englishPhrases = Object.entries(english)
    .filter(([source, translation]) => (
      source.length >= 2
      && /[\u3400-\u9fff]/.test(source)
      && translation
      && translation !== source
    ))
    .sort(([left], [right]) => right.length - left.length);
  let currentLanguage = detectLanguage();
  let observer = null;

  function detectLanguage() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "null");
      if (SUPPORTED_LANGUAGES.has(saved?.language)) return saved.language;
    } catch (_) {
      // Ignore corrupt local preferences and fall back to the browser language.
    }
    return /^zh\b/i.test(window.navigator.language || "") ? "zh-CN" : "en";
  }

  function translatePattern(source) {
    const patterns = [
      [/^(\d+) \u5206\u949f$/, "$1 min"],
      [/^(\d+) \u5c0f\u65f6$/, "$1 hr"],
      [/^(\d+) \u5c0f\u65f6 (\d+) \u5206\u949f$/, "$1 hr $2 min"],
      [/^(\d+) \u79d2$/, "$1 sec"],
      [/^(\d+) \u5929$/, "$1 days"],
      [/^(\d+) \u6b21$/, "$1 sessions"],
      [/^(\d+) \u6b21\u4e13\u6ce8$/, "$1 focus sessions"],
      [/^(\d+) \u6b21\u8bb0\u5f55$/, "$1 records"],
      [/^(\d+) \u5ea7$/, "$1 seats"],
      [/^(\d+) \u4e2a\u623f\u95f4$/, "$1 rooms"],
      [/^(\d+) \u4eba\u6b63\u5728\u623f\u95f4\u91cc$/, "$1 people in this room"],
      [/^\u5df2\u4e13\u6ce8 (\d+) \u5206\u949f$/, "Focused for $1 min"],
      [/^(\d+) \u79d2\u540e\u81ea\u52a8\u8fdb\u5165\u6c89\u6d78\u89c6\u89d2$/, "Focus view opens in $1 sec"],
      [/^\u8fd8\u5269 (\d+) \u4e2a\u7a7a\u4f4d$/, "$1 seats available"],
      [/^\u65e0\u9700\u79fb\u52a8\u89d2\u8272 \u00b7 \u8fd8\u5269 (\d+) \u4e2a\u7a7a\u4f4d$/, "Choose a seat \u00b7 $1 available"],
      [/^\u9009\u62e9\u4e00\u5f20\u559c\u6b22\u7684\u4f4d\u7f6e\u5750\u4e0b \u00b7 \u8fd8\u5269 (\d+) \u4e2a\u7a7a\u4f4d$/, "Choose a seat you like \u00b7 $1 available"],
      [/^\u5df2\u9009\u62e9 (\d+) \u53f7\u5ea7\u4f4d$/, "Seat $1 selected"],
      [/^\u6b63\u5728\u6362\u5230 (\d+) \u53f7\u5ea7\u4f4d$/, "Moving to seat $1"],
      [/^\u6b63\u5728\u786e\u8ba4 (\d+) \u53f7\u5ea7\u4f4d$/, "Confirming seat $1"],
      [/^(\d+) \u53f7\u5ea7\u4f4d \u00b7 \u5df2\u5f00\u59cb\u4e13\u6ce8$/, "Seat $1 \u00b7 Focus started"],
      [/^(\d+)\u53f7\u5ea7\u4f4d\u5df2\u5360\u7528/, "Seat $1 is occupied"],
      [/^\u9009\u62e9 (\d+) \u53f7\u7a7a\u4f4d$/, "Choose open seat $1"],
      [/^(\d+)\u53f7\u5ea7\u4f4d\u7f16\u53f7$/, "Seat $1 number"],
      [/^(\d+)\u53f7\u5ea7\u4f4d\u6807\u8bb0$/, "Seat $1 marker"],
      [/^(\d+)\u6708(\d+)\u65e5(.*)$/, "$1/$2$3"],
      [/^(\d+) \u5e74 (\d+) \u6708$/, "$1 / $2"],
      [/^(\d+) \u6708 (\d+) \u65e5$/, "$1/$2"],
      [/^(\u5b89\u9759\u7684|\u6668\u5149\u91cc\u7684|\u6162\u6162\u6765\u7684|\u9760\u7a97\u7684|\u96e8\u58f0\u91cc\u7684|\u4e13\u5fc3\u7684|\u6e29\u67d4\u7684|\u4ece\u5bb9\u7684)(\u6d77\u736d|\u77e5\u66f4\u9e1f|\u5c0f\u9e7f|\u65c5\u4eba|\u677e\u9f20|\u4e91\u6735|\u706f\u5854|\u6a61\u6811)$/, (_, adjective, noun) => `${english[adjective] || adjective} ${english[noun] || noun}`],
      [/^\u5750\u5728(.+?)(\d+)\u53f7\u5ea7\u4f4d\u770b\u5230\u7684\u6c89\u6d78\u5f0f\u5de5\u4f5c\u89c6\u89d2$/, "Immersive work view from seat $2 in $1"],
      [/\u5df2\u4e13\u6ce8 (\d+) \u5206\u949f/, "Focused for $1 min"],
      [/^\u8fde\u7eed\u4e13\u6ce8 (\d+) \u5929$/, "$1-day focus streak"],
      [/^\u8fde\u7eed\u4e13\u6ce8 (\d+) \u5929$/, "$1-day focus streak"],
      [/^\u5f53\u524d\u8ba1\u65f6 (.*)\uff0c\u60ac\u505c\u6216\u805a\u7126\u663e\u793a\u5feb\u6377\u64cd\u4f5c$/, "Current timer $1. Hover or focus for controls."],
      [/^\u4f11\u606f\u7ed3\u675f\u540e\u81ea\u52a8\u5f00\u59cb\u4e0b\u4e00\u8f6e (\d+) \u5206\u949f\u4e13\u6ce8$/, "Start the next $1-minute focus automatically after the break"],
      [/^(\d+) \u5206\u949f\u540e\u63d0\u9192\u4f60\u5f00\u59cb\u4e0b\u4e00\u8f6e\u4e13\u6ce8$/, "We will remind you to start the next focus in $1 min"],
      [/^\u4e0b\u4e00\u8f6e \u00b7 (\d+) \u5206\u949f$/, "Next round \u00b7 $1 min"],
      [/^\u786e\u8ba4\u540e\uff0c\u4f60\u4f1a\u5316\u8eab\u5c0f\u89d2\u8272\u5750\u8fdb (\d+) \u53f7\u5ea7\u4f4d$/, "Your character will take seat $1"],
      [/^\u4f60\u5728(.+)\u5b88\u4f4f\u4e86\u8ba1\u5212\u4e2d\u7684\u65f6\u95f4\u3002\u4f11\u606f\u4e00\u4e0b\uff0c\u51c6\u5907\u597d\u65f6\u518d\u56de\u6765\u3002$/, "You completed your planned session in $1. Take a break\u2014you earned it."],
      [/^\u4f60\u5728(.+)\u5b8c\u6210\u4e86\u4e00\u6bb5\u81ea\u7531\u4e13\u6ce8\uff0c\u6bcf\u4e00\u5206\u949f\u90fd\u5df2\u7ecf\u88ab\u8bb0\u5f55\u3002$/, "You wrapped up an open-ended session in $1. Every focused minute has been saved."],
      [/^\u8fd9\u6b21\u8fd8\u6ca1\u6709\u5f62\u6210\u4e13\u6ce8\u8bb0\u5f55\u3002\u4f60\u53ef\u4ee5\u8fd4\u56de(.+)\u91cd\u65b0\u5f00\u59cb\u3002$/, "This session did not record any focus time. Return to $1 whenever you are ready to try again."],
      [/^\u4f60\u5728(.+)\u505c\u7559\u7684\u65f6\u95f4\u5df2\u7ecf\u4fdd\u5b58\u3002\u63d0\u524d\u7ed3\u675f\u4e5f\u4e0d\u7b49\u4e8e\u6ca1\u6709\u6536\u83b7\u3002$/, "Your time in $1 has been saved. Ending early does not erase the work you did."],
      [/^\u559d\u53e3\u6c34\u3001\u4f38\u5c55\u4e00\u4e0b\uff0c(\d+) \u5206\u949f\u540e\u518d\u56de\u6765\u3002$/, "Drink some water, stretch, and come back in $1 min."],
      [/^\u8fdb\u5165(.+)$/, "Enter $1"],
      [/^(.+)\u97f3\u91cf$/, "$1 volume"],
      [/^(.+)\uff08\u4f60\uff09$/, "$1 (you)"],
      [/^(.+)\u623f\u95f4\u5185\u90e8$/, "Inside $1"],
      [/^\u5c9b\u6c11 \u00b7 (.+)$/, "Islander \u00b7 $1"],
    ];
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(source)) return source.replace(pattern, replacement);
    }
    return source;
  }

  function translateCore(source) {
    if (!source || currentLanguage === "zh-CN" || !/[\u3400-\u9fff]/.test(source)) return source;
    const exact = window.i18next?.t(source, { defaultValue: source });
    if (exact && exact !== source) return exact;
    let translated = translatePattern(source);
    for (const [phrase, translation] of englishPhrases) {
      if (translated.includes(phrase)) translated = translated.split(phrase).join(translation);
    }
    return translated
      .replace(/(Quiet|Sunlit|Unhurried|Window-side|Rainy|Focused|Gentle|Calm)(Otter|Robin|Deer|Traveler|Squirrel|Cloud|Lighthouse|Oak)(?=\s|\u00b7|Focused|Just|Seated|$)/g, "$1 $2")
      .replace(/(Otter|Robin|Deer|Traveler|Squirrel|Cloud|Lighthouse|Oak)(?=Just sat down|Seated)/g, "$1 \u00b7 ")
      .replace(/(\d+)\s*\u5c0f\u65f6/g, "$1 hr")
      .replace(/(\d+)\s*\u5206\u949f/g, "$1 min")
      .replace(/(\d+)\s*\u79d2/g, "$1 sec")
      .replace(/(\d+)\s*\u5929/g, "$1 days")
      .replace(/(\d+)\s*\u6b21/g, "$1 sessions")
      .replace(/\uff0c\s*/g, ", ")
      .replace(/\u3002\s*/g, ". ")
      .replace(/\uff1a\s*/g, ": ")
      .replace(/\uff08/g, " (")
      .replace(/\uff09/g, ")");
  }

  function translateText(source) {
    if (typeof source !== "string" || currentLanguage === "zh-CN") return source;
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    const core = source.slice(leading.length, source.length - trailing.length || undefined);
    return `${leading}${translateCore(core)}${trailing}`;
  }

  function translateElement(element) {
    if (!(element instanceof Element)) return;
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      if (element.hasAttribute(attribute)) {
        const value = element.getAttribute(attribute);
        const translated = translateText(value);
        if (translated !== value) element.setAttribute(attribute, translated);
      }
    }
  }

  function translateNode(node) {
    if (currentLanguage === "zh-CN" || !node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
      return;
    }
    if (!(node instanceof Element)) return;
    translateElement(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        const translated = translateText(current.nodeValue);
        if (translated !== current.nodeValue) current.nodeValue = translated;
      } else {
        translateElement(current);
      }
      current = walker.nextNode();
    }
  }

  function translateDocument() {
    const shouldResumeObserver = Boolean(observer);
    observer?.disconnect();
    document.documentElement.lang = currentLanguage;
    const description = document.querySelector('meta[name="description"]');
    if (currentLanguage === "zh-CN") {
      if (window.location.pathname.startsWith("/privacy")) document.title = "隐私政策 · 专注岛";
      else if (window.location.pathname.startsWith("/terms")) document.title = "服务条款 · 专注岛";
      else document.title = "专注岛 · Focus Isle";
      if (description) description.content = "像进入游戏一样，找一个安静的位置开始专注。";
    } else {
      document.title = translateCore(document.title);
      if (description) description.content = translateText(description.content);
      translateNode(document.body);
    }
    if (shouldResumeObserver) observer.observe(document.documentElement, OBSERVER_OPTIONS);
  }

  function observeDocument() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      if (currentLanguage === "zh-CN") return;

      // Translation writes change the same text and attributes we observe. Pause
      // observation so those writes cannot recursively enqueue more mutations.
      observer.disconnect();
      const pendingNodes = new Set();
      for (const mutation of mutations) {
        if (mutation.type === "characterData" || mutation.type === "attributes") {
          pendingNodes.add(mutation.target);
        }
        mutation.addedNodes.forEach((node) => pendingNodes.add(node));
      }

      // A translated parent already includes its descendants. Collapsing the
      // mutation batch avoids repeatedly walking the same rendered subtree.
      const translationRoots = [...pendingNodes].filter((node) => {
        let ancestor = node.parentNode;
        while (ancestor) {
          if (pendingNodes.has(ancestor)) return false;
          ancestor = ancestor.parentNode;
        }
        return true;
      });
      translationRoots.forEach(translateNode);
      observer.takeRecords();
      observer.observe(document.documentElement, OBSERVER_OPTIONS);
    });
    observer.observe(document.documentElement, OBSERVER_OPTIONS);
  }

  function setLanguage(language, { reload = false } = {}) {
    currentLanguage = SUPPORTED_LANGUAGES.has(language) ? language : "en";
    document.documentElement.lang = currentLanguage;
    window.i18next?.changeLanguage(currentLanguage);
    window.dispatchEvent(new CustomEvent("focus-island:language-change", { detail: { language: currentLanguage } }));
    if (reload) window.location.reload();
    else translateDocument();
  }

  window.FocusI18n = {
    getLanguage: () => currentLanguage,
    setLanguage,
    t: translateCore,
    translate: translateText,
    translateDocument,
    supportedLanguages: ["zh-CN", "en"],
  };

  const init = window.i18next?.init({
    lng: currentLanguage,
    fallbackLng: "zh-CN",
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    resources: { en: { translation: english } },
  });

  Promise.resolve(init).finally(() => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        translateDocument();
        observeDocument();
      }, { once: true });
    } else {
      translateDocument();
      observeDocument();
    }
  });
})();
