import fs from 'node:fs';import path from 'node:path';
process.chdir(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)));
const routes=JSON.parse(fs.readFileSync('dist/routes.json'));const errors=[];const titles=new Set();
for(const r of routes){const html=fs.readFileSync(r.file,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(r.route+' must have one H1');
if(new Set(ids).size!==ids.length)errors.push(r.route+' duplicate IDs');
const title=html.match(/<title>(.*?)<\/title>/)?.[1];if(!title||titles.has(title))errors.push(r.route+' missing/duplicate title');titles.add(title);
if(!html.includes('name="description"')||!html.includes('rel="canonical"'))errors.push(r.route+' SEO metadata');
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const ref=m[1];if(!ref.startsWith('/')&&!ref.startsWith('#'))continue;const [pathname,anchor]=ref.split('#');const target=pathname?path.join('dist',pathname.endsWith('/')?pathname+'index.html':pathname):r.file;if(!fs.existsSync(target)){errors.push(r.route+' missing '+ref);continue}if(anchor&&!fs.readFileSync(target,'utf8').includes('id="'+anchor+'"'))errors.push(r.route+' bad anchor '+ref)}
for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
if(r.route.startsWith('/blog/')&&r.route!=='/blog/'&&!html.includes('<article class="article">'))errors.push('Missing article content');
}
new Function(fs.readFileSync('dist/assets/site.js','utf8'));
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`PASS: ${routes.length} independent pages; links, assets, anchors, unique titles, H1, structured data and JavaScript syntax.`);
