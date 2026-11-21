"use strict";
// V51 · Barra superior y botón Menú en las páginas independientes.
// Misma configuración de GitHub que portada y administrador, hasta tres niveles.
(() => {
  const core=window.TI_MENU;if(!core)return;
  async function load(){
    let menu=core.normalize(core.defaults);
    try{const response=await fetch('./assets/cms-menu.json',{cache:'no-store'});if(response.ok)menu=core.normalize(await response.json());}
    catch(e){console.warn('Menú predeterminado',e);}
    const main=document.querySelector('.mainlinks'),panel=document.querySelector('#seneca-main-menu');
    if(!main||!panel)return;
    const current=location.pathname.split('/').pop();
    function containsCurrent(item){return item.type==='page'&&item.value.split('#')[0]===current||(item.children||[]).some(containsCurrent);}
    const link=(item,label)=>{
      const a=document.createElement('a');a.href=core.href(item);a.textContent=label||item.label;
      if(item.type==='url'){a.target='_blank';a.rel='noopener noreferrer';}
      if(item.type==='page'&&item.value.split('#')[0]===current)a.setAttribute('aria-current','page');
      return a;
    };
    const makeNavItem=(item,depth)=>{
      if(!item.children?.length){const a=link(item);a.classList.add('ti-leaf');return a;}
      const group=document.createElement('div');group.className='ti-branch';
      const title=link(item);title.className='ti-branch-link';
      const toggle=document.createElement('button');toggle.type='button';toggle.className='ti-branch-toggle';toggle.setAttribute('aria-label','Desplegar '+item.label);toggle.setAttribute('aria-expanded','false');toggle.textContent='›';
      const submenu=document.createElement('div');submenu.className='ti-submenu';
      item.children.forEach(child=>submenu.append(makeNavItem(child,depth+1)));
      toggle.addEventListener('click',e=>{e.stopPropagation();const expanded=group.classList.toggle('ti-expanded');toggle.setAttribute('aria-expanded',String(expanded));});
      group.append(title,toggle,submenu);return group;
    };
    const makePanelItem=(item,depth)=>{
      if(!item.children?.length)return link(item);
      const details=document.createElement('details');details.className='ti-panel-branch';
      // V53: ocultar niveles inferiores hasta hover (ratón) o clic (táctil/teclado).
      const mouse=()=>matchMedia('(hover: hover) and (pointer: fine)').matches;
      details.addEventListener('mouseenter',()=>{if(mouse())details.open=true;});
      details.addEventListener('mouseleave',()=>{if(mouse())details.open=false;});
      details.addEventListener('focusout',e=>{if(!details.contains(e.relatedTarget))details.open=false;});
      const summary=document.createElement('summary');summary.textContent=item.label;
      summary.addEventListener('click',e=>{if(e.detail>0&&mouse()&&details.open)e.preventDefault();});
      const all=link(item,'Ver '+item.label);all.className='ti-panel-all';
      const nested=document.createElement('div');nested.className='ti-panel-nested';
      item.children.forEach(child=>nested.append(makePanelItem(child,depth+1)));
      details.append(summary,all,nested);return details;
    };
    main.replaceChildren();panel.replaceChildren();
    const home=document.createElement('a');home.href='./index.html';home.className='nav-home';home.textContent='Inicio';main.append(home);
    const groups=[];
    for(const item of menu.items){
      if(item.children?.length){
        const group=document.createElement('div');group.className='nav-group';
        if(containsCurrent(item))group.classList.add('current-section');
        const btn=document.createElement('button');btn.type='button';btn.className='nav-trigger';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-haspopup','true');btn.textContent=item.label+' ▾';
        const dropdown=document.createElement('div');dropdown.className='nav-dropdown';dropdown.hidden=true;
        dropdown.append(link(item,item.type==='filter'?'Ver todas':'Abrir '+item.label));
        item.children.forEach(child=>dropdown.append(makeNavItem(child,2)));
        group.append(btn,dropdown);main.append(group);groups.push(group);
      }else{const a=link(item);a.className='nav-home nav-standalone';main.append(a);}
      const card=document.createElement('div');card.className='seneca-menu-card';
      const title=document.createElement('h3');title.textContent=item.label;card.append(title);
      card.append(link(item,item.type==='filter'?'Ver todas':'Abrir '+item.label));
      (item.children||[]).forEach(child=>card.append(makePanelItem(child,2)));
      panel.append(card);
    }
    const toggle=document.querySelector('#seneca-menu-toggle');
    function closeAll(except){for(const g of groups){if(g===except)continue;g.querySelector('.nav-dropdown').hidden=true;g.querySelector('.nav-trigger').setAttribute('aria-expanded','false');}}
    for(const g of groups){const btn=g.querySelector('.nav-trigger'),drop=g.querySelector('.nav-dropdown');
      const open=()=>{closeAll(g);drop.hidden=false;btn.setAttribute('aria-expanded','true');panel.hidden=true;toggle?.setAttribute('aria-expanded','false');};
      btn.addEventListener('click',()=>{if(drop.hidden)open();else closeAll()});
      g.addEventListener('mouseenter',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)open()});
      g.addEventListener('mouseleave',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)closeAll()});
      g.addEventListener('focusout',e=>{if(!g.contains(e.relatedTarget))closeAll()});
    }
    document.addEventListener('click',e=>{if(!e.target.closest('.navbar'))closeAll();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAll();main.querySelectorAll('.ti-expanded').forEach(x=>x.classList.remove('ti-expanded'));}});
  }
  load();
})();
