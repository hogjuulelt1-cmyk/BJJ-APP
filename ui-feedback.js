/* Progress belongs to the action, never to every background network request. */
(function(){'use strict';
 const states=new WeakMap(),delay=650,minimum=250;
 function spinner(){const icon=document.createElement('span');icon.className='button-spinner';icon.setAttribute('aria-hidden','true');return icon;}
 function busy(button,on){
  if(!button)return;
  if(on){if(states.has(button))return;const state={disabled:button.disabled,started:0,ariaLabel:button.getAttribute("aria-label")};if(state.ariaLabel===null)button.setAttribute("aria-label",button.textContent.trim());states.set(button,state);button.disabled=true;button.setAttribute('aria-busy','true');state.timer=setTimeout(()=>{if(!button.isConnected||states.get(button)!==state)return;const label=document.createElement('span');label.className='busy-label';label.append(...button.childNodes);const icon=spinner();button.append(label,icon);button.classList.add('progress-visible');state.label=label;state.icon=icon;state.started=performance.now();},delay);return;}
  const state=states.get(button);if(!state)return;clearTimeout(state.timer);const finish=()=>{if(states.get(button)!==state)return;state.icon?.remove();if(state.label?.parentNode===button)state.label.replaceWith(...state.label.childNodes);button.classList.remove('progress-visible');button.disabled=state.disabled;button.removeAttribute('aria-busy');if(state.ariaLabel===null)button.removeAttribute('aria-label');states.delete(button);};
  const remaining=state.started?Math.max(0,minimum-(performance.now()-state.started)):0;if(remaining)state.end=setTimeout(finish,remaining);else finish();
 }
 async function wait(button){const state=button&&states.get(button);if(!state)return;clearTimeout(state.timer);const remaining=state.started?Math.max(0,minimum-(performance.now()-state.started)):0;if(remaining)await new Promise(r=>setTimeout(r,remaining));}
 function slot(container){if(!container||container.childNodes.length)return()=>{};const node=document.createElement('div');node.className='initial-progress';node.setAttribute('role','status');node.setAttribute('aria-label','Уншиж байна');node.append(spinner());container.append(node);const timer=setTimeout(()=>node.classList.add('visible'),delay);return()=>{clearTimeout(timer);node.remove();};}
 function pulse(e){if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;const button=e.target.closest?.('button,[role="button"],a.btn');if(!button||button.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(e.type==='keydown'&&e.target!==button)return;button.getAnimations().filter(a=>a.id==='arrow-click').forEach(a=>a.cancel());const animation=button.animate([{transform:'scale(1)'},{transform:'scale(.95)',offset:.35},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});animation.id='arrow-click';}
 document.addEventListener('pointerdown',pulse,true);document.addEventListener('keydown',pulse,true);
 window.ARROW_UI={busy,wait,slot};
})();
