(function(){
  'use strict';
  if(window.__patrimonioSaveProgressV134) return;
  window.__patrimonioSaveProgressV134=true;

  const nativeAlert=window.alert.bind(window);

  function listaBensSegura(){
    if(Array.isArray(window.bens)) return window.bens;
    try{ if(typeof bens!=='undefined' && Array.isArray(bens)) return bens; }catch(e){}
    return [];
  }

  function somenteDigitos(v){ return String(v||'').replace(/\D/g,''); }
  function formatarCnpj(v){
    const d=somenteDigitos(v).slice(0,14);
    if(d.length!==14) return String(v||'');
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5');
  }

  function injectStyle(){
    if(document.getElementById('pat-save-progress-style-v134')) return;
    const style=document.createElement('style');
    style.id='pat-save-progress-style-v134';
    style.textContent=`
      #patSaveProgressBackdrop{position:fixed;inset:0;z-index:25000;display:none;align-items:center;justify-content:center;background:rgba(4,35,32,.52);padding:20px}
      #patSaveProgressBackdrop.open{display:flex}
      #patSaveProgressCard{width:min(430px,100%);background:#fff;border:1px solid #cfe3df;border-radius:22px;box-shadow:0 24px 70px rgba(0,36,31,.30);padding:24px;color:#11364a;text-align:center}
      #patSaveProgressIcon{width:56px;height:56px;border-radius:18px;margin:0 auto 14px;display:grid;place-items:center;background:#e7f8f1;color:#087a43;font-size:27px;font-weight:900}
      #patSaveProgressTitle{margin:0;font-size:22px;line-height:1.2;color:#0c3450}
      #patSaveProgressSubtitle{margin:9px 0 0;color:#577383;font-size:14px;line-height:1.45}
      #patSaveProgressCount{margin:18px 0 8px;font-size:30px;font-weight:950;color:#087a43}
      #patSaveProgressItem{min-height:42px;margin:0;color:#244d60;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
      #patSaveProgressTrack{height:13px;margin-top:17px;border-radius:999px;background:#e6f0ef;overflow:hidden;border:1px solid #d3e5e1}
      #patSaveProgressBar{height:100%;width:0;background:linear-gradient(90deg,#0b8d4c,#27ad70);border-radius:999px;transition:width .22s ease}
      #patSaveProgressActions{display:none;grid-template-columns:1fr 1.35fr;gap:10px;margin-top:20px}
      #patSaveProgressActions.show{display:grid}
      #patSaveProgressActions button{border-radius:13px;padding:13px 12px;font-weight:900;font-size:14px;cursor:pointer}
      #patSaveProgressFinish{border:1px solid #0a8148;background:#fff;color:#087f43}
      #patSaveProgressBack{border:0;background:#087f43;color:#fff}
      #patSaveProgressCard.done #patSaveProgressIcon{background:#e2f8ea;color:#087a43}
      #patSaveProgressCard.error #patSaveProgressIcon{background:#fff0f2;color:#b4233a}
      #patSaveProgressCard.error #patSaveProgressBar{background:#c43f52}
      .pat-cnpj-label-v134{position:relative}
      .pat-supplier-suggestions-v134{display:none;position:absolute;z-index:40;left:0;right:0;top:calc(100% + 5px);background:#fff;border:1px solid #bad8d1;border-radius:12px;box-shadow:0 12px 30px rgba(0,50,44,.18);max-height:220px;overflow:auto;padding:5px}
      .pat-supplier-suggestions-v134.open{display:block}
      .pat-supplier-option-v134{display:block;width:100%;border:0;background:#fff;color:#123f52;text-align:left;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;line-height:1.3}
      .pat-supplier-option-v134:hover{background:#e9f6f2}
      .pat-supplier-option-v134 strong{display:block;color:#087a43}
      .pat-supplier-found-v134{display:block;margin-top:5px;color:#087a43;font-size:12px;font-weight:800}
      @media(max-width:560px){#patSaveProgressActions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal(){
    injectStyle();
    let back=document.getElementById('patSaveProgressBackdrop');
    if(back) return back;
    back=document.createElement('div');
    back.id='patSaveProgressBackdrop';
    back.innerHTML=`
      <div id="patSaveProgressCard" role="dialog" aria-modal="true" aria-labelledby="patSaveProgressTitle">
        <div id="patSaveProgressIcon">↻</div>
        <h2 id="patSaveProgressTitle">Salvando itens patrimoniais</h2>
        <p id="patSaveProgressSubtitle">Aguarde a confirmação de cada item no banco de dados.</p>
        <div id="patSaveProgressCount">0 de 0</div>
        <p id="patSaveProgressItem">Preparando o cadastro...</p>
        <div id="patSaveProgressTrack"><div id="patSaveProgressBar"></div></div>
        <div id="patSaveProgressActions">
          <button id="patSaveProgressFinish" type="button">Concluir</button>
          <button id="patSaveProgressBack" type="button">Voltar ao cadastro</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    document.getElementById('patSaveProgressFinish').addEventListener('click',()=>{
      back.classList.remove('open');
      if(window.__patSaveProgressController) window.__patSaveProgressController.closed=true;
    });
    document.getElementById('patSaveProgressBack').addEventListener('click',()=>{
      back.classList.remove('open');
      document.getElementById('modalCadastro')?.classList.add('hidden');
      try{ window.renderTudo?.(); }catch(e){}
      try{ window.viewById?.('bens'); }catch(e){}
      window.scrollTo({top:0,behavior:'smooth'});
      if(window.__patSaveProgressController) window.__patSaveProgressController.closed=true;
    });
    return back;
  }

  function itemLabel(item,index,total){
    const pat=item?.pat ? `Tombo ${item.pat}` : `Item ${index}`;
    const desc=String(item?.desc||'').trim();
    const curta=desc.length>85?desc.slice(0,82)+'...':desc;
    return `Salvando ${index} de ${total} — ${pat}${curta?' • '+curta:''}`;
  }

  function createController(items){
    const back=ensureModal(),card=document.getElementById('patSaveProgressCard');
    const title=document.getElementById('patSaveProgressTitle');
    const subtitle=document.getElementById('patSaveProgressSubtitle');
    const count=document.getElementById('patSaveProgressCount');
    const item=document.getElementById('patSaveProgressItem');
    const bar=document.getElementById('patSaveProgressBar');
    const icon=document.getElementById('patSaveProgressIcon');
    const actions=document.getElementById('patSaveProgressActions');
    const finishBtn=document.getElementById('patSaveProgressFinish');
    const backBtn=document.getElementById('patSaveProgressBack');
    const total=items.length;
    const ctl={current:0,total,completed:false,failed:false,closed:false,items};

    card.classList.remove('done','error');
    title.textContent='Salvando itens patrimoniais';
    subtitle.textContent='Aguarde a confirmação de cada item no banco de dados.';
    count.textContent=`0 de ${total}`;
    item.textContent=total?itemLabel(items[0],1,total):'Preparando o cadastro...';
    bar.style.width='0%';
    icon.textContent='↻';
    finishBtn.textContent='Concluir';
    backBtn.textContent='Voltar ao cadastro';
    actions.classList.remove('show');
    back.classList.add('open');

    ctl.update=(n)=>{
      n=Math.max(0,Math.min(total,Number(n)||0));
      if(n<ctl.current) return;
      ctl.current=n;
      count.textContent=`${n} de ${total}`;
      bar.style.width=`${total?Math.round(n/total*100):0}%`;
      if(n<total){
        const next=Math.min(n+1,total);
        item.textContent=itemLabel(items[next-1],next,total);
      }else ctl.finish();
    };
    ctl.confirmOne=(savedItem)=>{
      if(ctl.completed || ctl.failed) return;
      ctl.update(Math.min(ctl.total,ctl.current+1));
      if(savedItem?.pat && ctl.current<ctl.total){
        item.textContent=itemLabel(ctl.items[ctl.current],ctl.current+1,ctl.total);
      }
    };
    ctl.finish=(message='')=>{
      if(ctl.failed) return;
      ctl.current=total;ctl.completed=true;
      card.classList.add('done');
      title.textContent='Cadastro salvo com sucesso';
      subtitle.textContent='Todos os itens foram confirmados no banco de dados.';
      count.textContent=`${total} ${total===1?'item salvo':'itens salvos'}`;
      item.textContent=message || 'Escolha Concluir para fechar esta confirmação ou Voltar ao cadastro para abrir a lista de bens.';
      bar.style.width='100%';
      icon.textContent='✓';
      actions.classList.add('show');
      const btn=document.getElementById('btnSalvarLoteV100');
      if(btn){btn.disabled=true;btn.textContent='Lote salvo';}
    };
    ctl.fail=(message)=>{
      const jaSalvos=ctl.current;
      ctl.failed=true;
      card.classList.add('error');
      title.textContent=jaSalvos===total&&total?'Itens salvos; finalização pendente':'Não foi possível concluir o salvamento';
      subtitle.textContent=jaSalvos?'Os itens já confirmados continuam registrados.':'Nenhum item foi confirmado nesta tentativa.';
      count.textContent=`${jaSalvos} de ${total}`;
      item.textContent=message || 'Revise a conexão e tente novamente apenas para os itens pendentes.';
      icon.textContent='!';
      finishBtn.textContent='Fechar';
      backBtn.textContent='Voltar ao cadastro';
      actions.classList.add('show');
      const btn=document.getElementById('btnSalvarLoteV100');
      if(btn){btn.disabled=false;btn.textContent='Salvar lote e gerar bens';}
    };
    ctl.hide=()=>back.classList.remove('open');
    return ctl;
  }

  window.alert=function(message){
    const text=String(message??'');
    const ctl=window.__patSaveProgressController;
    if(/^Lote salvo sem duplicar:/i.test(text)){
      ctl?.finish('Todos os itens do lote foram salvos. Escolha uma das opções abaixo.');
      return;
    }
    if(/^Erro ao salvar lote:/i.test(text) && ctl){
      ctl.fail(text.replace(/^Erro ao salvar lote:\s*/i,''));
      return;
    }
    nativeAlert(text);
  };

  const salvarBemAnterior=window.salvarBemSupabase;
  if(typeof salvarBemAnterior==='function'){
    window.salvarBemSupabase=async function(item){
      const result=await salvarBemAnterior.apply(this,arguments);
      const ctl=window.__patSaveProgressController;
      if(ctl && !ctl.completed && !ctl.failed && document.getElementById('patSaveProgressBackdrop')?.classList.contains('open')){
        ctl.confirmOne(item);
      }
      return result;
    };
    try{ salvarBemSupabase=window.salvarBemSupabase; }catch(e){}
  }

  const salvarAnterior=window.salvarLotePatrimonialV100;
  if(typeof salvarAnterior==='function'){
    window.salvarLotePatrimonialV100=async function(){
      const rows=[...document.querySelectorAll('#bensBodyV100 tr')].filter(r=>r.querySelector('.bemPat'));
      const items=rows.map(r=>({pat:r.querySelector('.bemPat')?.value?.trim()||'',desc:r.querySelector('.bemDesc')?.value?.trim()||''}));
      const ctl=createController(items);
      window.__patSaveProgressController=ctl;
      const btn=document.getElementById('btnSalvarLoteV100');
      const observer=new MutationObserver(()=>{
        const text=String(btn?.textContent||'');
        const m=text.match(/Salvando\.\.\.\s*(\d+)\s*\/\s*(\d+)/i);
        if(m) ctl.update(Number(m[1]));
      });
      if(btn) observer.observe(btn,{childList:true,characterData:true,subtree:true});
      try{
        await salvarAnterior.apply(this,arguments);
        if(!ctl.completed && !ctl.failed){
          if(ctl.current>=ctl.total && ctl.total) ctl.finish();
          else if(ctl.current===0) ctl.hide();
          else ctl.fail(`O processamento parou após ${ctl.current} de ${ctl.total} itens.`);
        }
        if(ctl.completed && btn){ btn.disabled=true; btn.textContent='Lote salvo'; }
      }catch(error){
        console.error(error);
        ctl.fail(error?.message||String(error));
      }finally{
        observer.disconnect();
      }
    };
    try{ salvarLotePatrimonialV100=window.salvarLotePatrimonialV100; }catch(e){}
  }

  function indiceFornecedores(){
    const map=new Map();
    const add=(cnpj,nome)=>{
      const d=somenteDigitos(cnpj);
      const n=String(nome||'').trim();
      if(d.length!==14 || !n) return;
      if(!map.has(d)) map.set(d,new Set());
      map.get(d).add(n);
    };
    listaBensSegura().forEach(b=>add(b.cnpj,b.fornecedor));
    try{
      const ext=JSON.parse(localStorage.getItem('bensExtSGP_v95')||'{}');
      Object.values(ext||{}).forEach(r=>add(r?.cnpj,r?.fornecedor));
    }catch(e){}
    return [...map.entries()].flatMap(([cnpj,nomes])=>[...nomes].map(nome=>({cnpj,nome})));
  }

  function montarSugestoes(cnpjInput,fornecedorInput,box){
    const digitado=somenteDigitos(cnpjInput.value);
    const todos=indiceFornecedores();
    const exatos=todos.filter(x=>x.cnpj===digitado);
    if(exatos.length===1){
      cnpjInput.value=formatarCnpj(exatos[0].cnpj);
      fornecedorInput.value=exatos[0].nome;
      box.innerHTML=`<span class="pat-supplier-found-v134">Fornecedor localizado: ${escapeHtml(exatos[0].nome)}</span>`;
      box.classList.add('open');
      setTimeout(()=>box.classList.remove('open'),1800);
      return;
    }
    if(digitado.length<3){ box.classList.remove('open'); box.innerHTML=''; return; }
    const achados=todos.filter(x=>x.cnpj.startsWith(digitado)).slice(0,8);
    if(!achados.length){ box.classList.remove('open'); box.innerHTML=''; return; }
    box.innerHTML='';
    achados.forEach(x=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='pat-supplier-option-v134';
      b.innerHTML=`<strong>${formatarCnpj(x.cnpj)}</strong>${escapeHtml(x.nome)}`;
      b.addEventListener('click',()=>{
        cnpjInput.value=formatarCnpj(x.cnpj);
        fornecedorInput.value=x.nome;
        box.classList.remove('open');
        fornecedorInput.dispatchEvent(new Event('change',{bubbles:true}));
      });
      box.appendChild(b);
    });
    box.classList.add('open');
  }

  function escapeHtml(v){
    return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function instalarPar(cnpjId,fornecedorId){
    const cnpjInput=document.getElementById(cnpjId),fornecedorInput=document.getElementById(fornecedorId);
    if(!cnpjInput||!fornecedorInput||cnpjInput.dataset.lookupV134==='1') return;
    cnpjInput.dataset.lookupV134='1';
    const cnpjLabel=cnpjInput.closest('label'),fornecedorLabel=fornecedorInput.closest('label');
    if(cnpjLabel&&fornecedorLabel&&cnpjLabel.parentElement===fornecedorLabel.parentElement){
      cnpjLabel.parentElement.insertBefore(cnpjLabel,fornecedorLabel);
    }
    cnpjLabel?.classList.add('pat-cnpj-label-v134');
    cnpjInput.placeholder='Digite ou selecione um CNPJ já cadastrado';
    fornecedorInput.placeholder='Nome do fornecedor';
    const box=document.createElement('div');
    box.className='pat-supplier-suggestions-v134';
    cnpjLabel?.appendChild(box);
    cnpjInput.addEventListener('input',()=>montarSugestoes(cnpjInput,fornecedorInput,box));
    cnpjInput.addEventListener('focus',()=>montarSugestoes(cnpjInput,fornecedorInput,box));
    cnpjInput.addEventListener('change',()=>montarSugestoes(cnpjInput,fornecedorInput,box));
    cnpjInput.addEventListener('blur',()=>{
      const d=somenteDigitos(cnpjInput.value);
      if(d.length===14) cnpjInput.value=formatarCnpj(d);
      setTimeout(()=>box.classList.remove('open'),220);
    });
    const d=somenteDigitos(cnpjInput.value);
    if(d.length===14) montarSugestoes(cnpjInput,fornecedorInput,box);
  }

  function instalarFornecedores(){
    injectStyle();
    instalarPar('cnpjV100','fornecedorV100');
    instalarPar('editCnpjV110','editFornecedorV110');
  }

  const abrirAnterior=window.abrirCadastro;
  if(typeof abrirAnterior==='function'){
    window.abrirCadastro=function(){
      const r=abrirAnterior.apply(this,arguments);
      setTimeout(instalarFornecedores,0);
      setTimeout(instalarFornecedores,120);
      return r;
    };
    try{ abrirCadastro=window.abrirCadastro; }catch(e){}
  }

  ['lerNFV100','lerOFV100'].forEach(nome=>{
    const anterior=window[nome];
    if(typeof anterior!=='function') return;
    window[nome]=async function(){
      const r=await anterior.apply(this,arguments);
      instalarFornecedores();
      const c=document.getElementById('cnpjV100'),f=document.getElementById('fornecedorV100');
      if(c&&f){
        const box=c.closest('label')?.querySelector('.pat-supplier-suggestions-v134');
        if(box) montarSugestoes(c,f,box);
      }
      return r;
    };
    try{ if(nome==='lerNFV100') lerNFV100=window[nome]; if(nome==='lerOFV100') lerOFV100=window[nome]; }catch(e){}
  });

  const observer=new MutationObserver(instalarFornecedores);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',instalarFornecedores);
  setTimeout(instalarFornecedores,500);
})();
