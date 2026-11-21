"use strict";
(() => {
  const core=window.TI_MENU;
  if(!core)return;
  async function load(){
    let menu=core.normalize(core.defaults);
    try{const response=await fetch('./assets/cms-menu.json',{cache:'no-store'});if(response.ok)menu=core.normalize(await response.json());}catch(e){console.warn('Menú predeterminado',e);}
    const main=document.querySelector('.mainlinks'),panel=document.querySelector('#seneca-main-menu');
    if(!main||!panel)return;
    const link=(item)=>{
      const a=document.createElement('a');a.href=core.href(item);a.textContent=item.label;
      if(item.type==='url'){a.target='_blank';a.rel='noopener noreferrer';}
      if(item.type==='page'&&item.value.split('#')[0]==='cuaderno-seneca.html')a.setAttribute('aria-current','page');
      return a;
    };
    main.replaceChildren();
    const home=document.createElement('a');home.href='./index.html';home.className='nav-home';home.textContent='Inicio';main.append(home);
    const groups=[];
    for(const item of menu.items){
      if(item.children?.length){
        const group=document.createElement('div');group.className='nav-group';
        const btn=document.createElement('button');btn.type='button';btn.className='nav-trigger';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-haspopup','true');
        btn.textContent=item.label+' ▾';
        const dropdown=document.createElement('div');dropdown.className='nav-dropdown';dropdown.hidden=true;
        const all=link(item);all.textContent=item.type==='filter'?'Ver todas':`Abrir ${item.label}`;dropdown.append(all);
        for(const child of item.children)dropdown.append(link(child));
        group.append(btn,dropdown);main.append(group);groups.push(group);
      } else {
        const a=link(item);a.className='nav-home nav-standalone';main.append(a);
      }
      const card=document.createElement('div');const title=document.createElement('h3');title.textContent=item.label;card.append(title);
      const first=link(item);first.textContent=item.type==='filter'?'Ver todas':`Abrir ${item.label}`;card.append(first);
      for(const child of (item.children||[]))card.append(link(child));
      panel.append(card);
    }
    // Remove old static cards after adding new cards.
    while(panel.children.length>menu.items.length)panel.firstElementChild.remove();
    function closeAll(except){for(const g of groups){if(g===except)continue;g.querySelector('.nav-dropdown').hidden=true;g.querySelector('.nav-trigger').setAttribute('aria-expanded','false');}}
    const toggle=document.querySelector('#seneca-menu-toggle');
    for(const g of groups){const btn=g.querySelector('button'),menuBox=g.querySelector('.nav-dropdown');
      const open=()=>{closeAll(g);menuBox.hidden=false;btn.setAttribute('aria-expanded','true');panel.hidden=true;toggle.setAttribute('aria-expanded','false');};
      btn.addEventListener('click',()=>{if(menuBox.hidden)open();else if(!matchMedia('(hover: hover) and (pointer: fine)').matches)closeAll();});
      g.addEventListener('mouseenter',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)open()});
      g.addEventListener('mouseleave',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)closeAll()});
      g.addEventListener('focusout',e=>{if(!g.contains(e.relatedTarget))closeAll()});
    }
    document.addEventListener('click',e=>{if(!e.target.closest('.navbar'))closeAll();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});
  }
  load();
})();
