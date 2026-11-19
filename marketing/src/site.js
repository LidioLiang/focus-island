const menu=document.querySelector('.menu'),nav=document.getElementById('navigation');
menu?.addEventListener('click',()=>{menu.setAttribute('aria-expanded',String(nav.classList.toggle('open')))});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});
const preview=document.getElementById('preview');
if(preview){
 const names={cafe:'The cozy café',library:'The quiet library',forest:'The peaceful forest'};
 document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.scene,img=document.getElementById('mainScene');img.src='/assets/'+key+'.webp';img.alt=names[key]+' immersive workspace';document.getElementById('sceneName').textContent=names[key];document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}));
 let duration=1500,remaining=1500,running=false,end=0;
 const button=document.getElementById('timerButton'),status=document.getElementById('timerStatus'),clock=document.getElementById('clock'),modes=[...document.querySelectorAll('[data-minutes]')];
 const render=()=>{clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');modes.forEach(b=>b.disabled=running)};
 const tick=()=>{if(!running)return;remaining=Math.max(0,Math.ceil((end-Date.now())/1000));if(!remaining){running=false;button.textContent='Start again';status.textContent='Session complete. Take a moment, then choose what comes next.'}render()};
 button.addEventListener('click',()=>{if(running){tick();running=false;button.textContent='Resume';status.textContent='Paused. Ready when you are.'}else{if(remaining===0)remaining=duration;end=Date.now()+remaining*1000;running=true;button.textContent='Pause';status.textContent='Session running. Keep this tab open.'}render()});
 document.getElementById('resetTimer').addEventListener('click',()=>{running=false;remaining=duration;button.textContent='Start timer';status.textContent='Timer reset. Ready when you are.';render()});
 modes.forEach(b=>b.addEventListener('click',()=>{if(running)return;duration=Number(b.dataset.minutes)*60;remaining=duration;modes.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.getElementById('timerLabel').textContent=duration===300?'Short break':'Focus session';button.textContent='Start timer';status.textContent='Duration selected. Press Start when ready.';render()}));
 setInterval(tick,250);document.addEventListener('visibilitychange',tick);
}
