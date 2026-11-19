import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync(process.execPath,['build.mjs'],{
  cwd:path.join(root,'marketing'),stdio:'inherit',
  env:{...process.env,SITE_MODE:'production',SITE_ORIGIN:'https://focusisle.online',APP_URL:'https://focusisle.online/app',SUPPORT_EMAIL:'support@nisoniy.com'}
});
if(result.status!==0)process.exit(result.status||1);
const source=path.join(root,'marketing/dist');
const output=path.join(root,'public/_website');
fs.mkdirSync(output,{recursive:true});
fs.cpSync(path.join(source,'assets'),path.join(root,'public/website-assets'),{recursive:true});
const routes=JSON.parse(fs.readFileSync(path.join(source,'routes.json'),'utf8'));
function adapt(text){
  text=text.replaceAll('/assets/','/website-assets/');
  for(const item of routes){
    if(item.route==='/')continue;
    const route=item.route, canonical='https://focusisle.online'+route;
    text=text.replaceAll('"'+route+'"','"'+route.slice(0,-1)+'"')
      .replaceAll('"'+canonical+'"','"'+canonical.slice(0,-1)+'"')
      .replaceAll('>'+canonical+'<','>'+canonical.slice(0,-1)+'<');
  }
  text=text.replaceAll('href="https://focusisle.online/app" target="_blank" rel="noopener"','href="/app"');
  text=text.replaceAll('href="https://focusisle.online/privacy"','href="/privacy"').replaceAll('href="https://focusisle.online/terms"','href="/terms"');
  return text;
}
for(const item of routes){
  const name=path.join(output,item.route,'index.html');
  fs.mkdirSync(path.dirname(name),{recursive:true});
  fs.writeFileSync(name,adapt(fs.readFileSync(path.join(root,'marketing',item.file),'utf8')));
}
for(const name of ['robots.txt','sitemap.xml'])fs.writeFileSync(path.join(output,name),adapt(fs.readFileSync(path.join(source,name),'utf8')));
const client=path.join(root,'public/website-assets/site.js');
fs.writeFileSync(client,adapt(fs.readFileSync(client,'utf8')));
console.log('Website ready: 12 pages, same-origin /app, support@nisoniy.com');
