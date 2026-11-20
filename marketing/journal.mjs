// Journal pages share the homepage palette and navigation, with a quieter reading layout.
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const readingTime = article => Math.max(1, Math.ceil(article.sections.flat().join(' ').split(/\s+/).length / 180));
const imageAlt = { cafe: 'A warm café window seat overlooking the water', forest: 'A quiet desk surrounded by a green forest', library: 'A sunlit library desk beside an arched window' };
const brand = `<a class="brand" href="/"><img src="/assets/home/1974e52515d7574f.png" width="40" height="40" alt="">Focus Isle</a>`;

export function journalHeader() {
  return `<header class="site-nav"><div class="container nav-inner">${brand}<nav class="navlinks" id="navigation" aria-label="Main navigation"><a href="/#features">Features</a><a href="/#how">How it works</a><a href="/blog/" aria-current="page">Journal</a></nav><a class="btn nav-cta" href="https://focusisle.online/app" target="_blank" rel="noopener" data-app-link>Start focusing</a><button class="menu" aria-label="Open navigation" aria-controls="navigation" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div></header>`;
}

export function journalFooter(support) {
  return `<footer class="site-footer"><div class="container"><div class="footer-top">${brand}<nav class="footer-links" aria-label="Footer navigation"><a href="/pricing/">Pricing</a><a href="/spaces/">Spaces</a><a href="/blog/">Journal</a><a href="mailto:${escapeHtml(support)}">Contact</a><a href="https://focusisle.online/privacy">Privacy</a><a href="https://focusisle.online/terms">Terms</a></nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Focus Isle · A little quiet, by <a href="https://nisoniy.com">Nisoniy</a></span><a href="mailto:${escapeHtml(support)}">${escapeHtml(support)}</a></div></div></footer>`;
}

function articleList(articles, headingLevel = 2) {
  return `<div class="journal-list">${articles.map((article, index) => `<article class="journal-entry"><a class="journal-link" href="/blog/${article.slug}/"><div class="entry-image"><img src="/assets/${article.image}.webp" width="1000" height="630" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} alt="${imageAlt[article.image]}"></div><div class="entry-copy"><div class="entry-meta"><span class="category">${article.category}</span><span aria-hidden="true">·</span><span>${readingTime(article)} min read</span></div><h${headingLevel}>${article.title}</h${headingLevel}><p>${article.description}</p><span class="read-link">Read article <span aria-hidden="true">↗</span></span></div></a></article>`).join('')}</div>`;
}

function journalClosing(cta) {
  return `<section class="journal-cta"><div class="journal-wrap cta-inner"><div><h2>A quiet seat. A fresh start.</h2><p>Bring one task. Find your space.</p></div>${cta()}</div></section>`;
}

export function journalIndex(articles, cta) {
  return `<div class="journal-wrap"><section class="journal-intro"><span class="eyebrow">THE FOCUS JOURNAL</span><h1>A little room for focus.</h1><p>Simple ideas for a calmer, more focused day.</p></section><section class="journal-collection" aria-label="Journal articles">${articleList(articles)}</section></div>${journalClosing(cta)}`;
}

export function journalArticle(article, articles, cta) {
  return `<article class="article"><header class="article-heading reading-wrap"><a class="back-link" href="/blog/"><span aria-hidden="true">←</span> Back to Journal</a><div class="entry-meta"><span class="category">${article.category}</span><span aria-hidden="true">·</span><span>${readingTime(article)} min read</span></div><h1>${article.title}</h1><p class="article-deck">${article.description}</p><p class="byline">By Focus Isle</p></header><div class="article-cover journal-wrap"><img src="/assets/${article.image}.webp" width="1000" height="630" fetchpriority="high" alt="${imageAlt[article.image]}"></div><div class="prose reading-wrap">${article.sections.map(([heading, paragraph], index) => `<section id="section-${index}"><h2>${heading}</h2><p>${paragraph}</p></section>`).join('')}<div class="article-action"><h2>Make it your next session.</h2><p>Choose a space and give one task your attention.</p><div class="actions">${cta()}<a class="text-link" href="/tools/pomodoro-timer/">Try the free timer</a></div></div><a class="back-link" href="/blog/"><span aria-hidden="true">←</span> All journal articles</a></div></article><section class="related journal-wrap" aria-labelledby="related-title"><h2 id="related-title">A little more to explore.</h2>${articleList(articles.filter(item => item.slug !== article.slug), 3)}</section>`;
}
