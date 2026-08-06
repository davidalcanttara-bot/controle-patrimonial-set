(function(){
  'use strict';

  const selecionados = window.patrimonioSelecionadosV135 instanceof Set
    ? window.patrimonioSelecionadosV135
    : new Set();
  window.patrimonioSelecionadosV135 = selecionados;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function listaBens(){
    try{ if(Array.isArray(window.bens)) return window.bens; }catch(e){}
    try{ if(typeof bens !== 'undefined' && Array.isArray(bens)) return bens; }catch(e){}
    return [];
  }

  function setListaBens(novaLista){
    try{ window.bens = novaLista; }catch(e){}
    try{ if(typeof bens !== 'undefined') bens = novaLista; }catch(e){}
  }

  function dataCadastroValor(bem){
    return bem?.created_at || bem?.criado_em || bem?.criadoEm || bem?.data_cadastro || bem?.inserido_em || bem?.atualizado_em || '';
  }

  function dataCadastroTexto(bem){
    const value = dataCadastroValor(bem);
    if(!value) return '—';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }

  function localizarBem(pat){
    return listaBens().find(item => String(item?.pat ?? item?.numero_patrimonial ?? '') === String(pat));
  }

  function garantirDadosCadastro(){
    const mapAnterior = window.mapearBemSupabase || (typeof mapearBemSupabase === 'function' ? mapearBemSupabase : null);
    if(typeof mapAnterior === 'function' && !mapAnterior.__v135){
      const novoMap = function(row){
        const item = mapAnterior(row);
        item.created_at = row.created_at || row.criado_em || row.inserido_em || item.created_at || null;
        item.atualizado_em = row.atualizado_em || item.atualizado_em || null;
        return item;
      };
      novoMap.__v135 = true;
      window.mapearBemSupabase = novoMap;
      try{ mapearBemSupabase = novoMap; }catch(e){}
    }

    const salvarAnterior = window.salvarBemSupabase || (typeof salvarBemSupabase === 'function' ? salvarBemSupabase : null);
    if(typeof salvarAnterior === 'function' && !salvarAnterior.__v135){
      const novoSalvar = async function(item){
        const result = await salvarAnterior(item);
        item.created_at = result?.created_at || item.created_at || new Date().toISOString();
        item.atualizado_em = result?.atualizado_em || new Date().toISOString();
        return result;
      };
      novoSalvar.__v135 = true;
      window.salvarBemSupabase = novoSalvar;
      try{ salvarBemSupabase = novoSalvar; }catch(e){}
    }
  }

  function garantirFiltros(){
    const filters = document.querySelector('#bens .bens-filters');
    if(!filters) return;

    [...filters.querySelectorAll('button')].forEach(btn => {
      if((btn.textContent || '').trim().toLowerCase() === 'atualizar banco') btn.remove();
    });

    if(!document.getElementById('ordemCadastroV135')){
      const select = document.createElement('select');
      select.id = 'ordemCadastroV135';
      select.title = 'Ordenar os bens pela data de cadastro';
      select.innerHTML = `
        <option value="recentes">Mais recentes primeiro</option>
        <option value="antigos">Mais antigos primeiro</option>
        <option value="pat-asc">Nº patrimonial crescente</option>
        <option value="pat-desc">Nº patrimonial decrescente</option>`;
      const situacao = document.getElementById('filtroSituacao');
      if(situacao?.nextSibling) situacao.parentNode.insertBefore(select, situacao.nextSibling);
      else filters.appendChild(select);
      select.addEventListener('change', () => {
        const value = select.value;
        if(value === 'recentes') window.ordemBensV111 = {campo:'adicionado',dir:'desc'};
        else if(value === 'antigos') window.ordemBensV111 = {campo:'adicionado',dir:'asc'};
        else if(value === 'pat-desc') window.ordemBensV111 = {campo:'pat',dir:'desc'};
        else window.ordemBensV111 = {campo:'pat',dir:'asc'};
        try{ pagina = 1; }catch(e){}
        window.renderTabela?.();
      });
    }

    if(!document.getElementById('filtroDataCadastroV135')){
      const input = document.createElement('input');
      input.id = 'filtroDataCadastroV135';
      input.type = 'date';
      input.title = 'Mostrar somente os bens inseridos nesta data';
      input.setAttribute('aria-label','Filtrar pela data de cadastro');
      input.addEventListener('change',()=>{ try{ pagina = 1; }catch(e){} window.renderTabela?.(); });
      const ordem = document.getElementById('ordemCadastroV135');
      ordem?.insertAdjacentElement('afterend', input);
    }

    let bar = document.getElementById('acoesSelecaoV135');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'acoesSelecaoV135';
      bar.className = 'acoes-selecao-v135';
      bar.innerHTML = `
        <button id="excluirSelecionadosV135" type="button" class="delete-btn" disabled>Excluir itens selecionados</button>
        <button id="limparSelecaoV135" type="button" class="secondary" disabled>Limpar seleção</button>
        <span id="totalCadastroV135" class="total-cadastro-v135"></span>`;
      filters.insertAdjacentElement('afterend', bar);
      document.getElementById('excluirSelecionadosV135')?.addEventListener('click', excluirSelecionados);
      document.getElementById('limparSelecaoV135')?.addEventListener('click', () => {
        selecionados.clear();
        atualizarSelecaoTela();
      });
    }
  }

  function patsVisiveis(){
    return [...document.querySelectorAll('#tabelaBens tr[data-pat-v135]')].map(tr => tr.dataset.patV135).filter(Boolean);
  }

  function atualizarBarra(){
    const qtd = selecionados.size;
    const excluir = document.getElementById('excluirSelecionadosV135');
    const limpar = document.getElementById('limparSelecaoV135');
    if(excluir){
      excluir.disabled = qtd === 0;
      excluir.textContent = qtd ? `Excluir ${qtd} ${qtd === 1 ? 'item selecionado' : 'itens selecionados'}` : 'Excluir itens selecionados';
    }
    if(limpar) limpar.disabled = qtd === 0;
    const total = document.getElementById('totalCadastroV135');
    if(total) total.textContent = `${listaBens().length} itens cadastrados`;

    const visible = patsVisiveis();
    const head = document.getElementById('selecionarPaginaV135');
    if(head){
      const marcados = visible.filter(pat => selecionados.has(String(pat))).length;
      head.checked = visible.length > 0 && marcados === visible.length;
      head.indeterminate = marcados > 0 && marcados < visible.length;
    }
  }

  function atualizarSelecaoTela(){
    document.querySelectorAll('.selecionar-bem-v135').forEach(input => {
      input.checked = selecionados.has(String(input.dataset.pat));
      input.closest('tr')?.classList.toggle('selecionado-v135', input.checked);
    });
    atualizarBarra();
  }

  function alternarPagina(checked){
    patsVisiveis().forEach(pat => checked ? selecionados.add(String(pat)) : selecionados.delete(String(pat)));
    atualizarSelecaoTela();
  }

  function inserirColunas(){
    const tbody = document.getElementById('tabelaBens');
    const table = tbody?.closest('table');
    if(!tbody || !table) return;

    const header = table.querySelector('thead tr');
    if(header){
      if(!header.querySelector('.th-selecao-v135')){
        const th = document.createElement('th');
        th.className = 'th-selecao-v135';
        th.innerHTML = '<input id="selecionarPaginaV135" type="checkbox" aria-label="Selecionar todos os bens desta página">';
        header.insertBefore(th, header.firstElementChild);
        th.querySelector('input').addEventListener('change', event => alternarPagina(event.target.checked));
      }
      if(!header.querySelector('.th-data-v135')){
        const th = document.createElement('th');
        th.className = 'th-data-v135 sort-th-v112';
        th.title = 'Clique para ordenar pela data de cadastro';
        th.innerHTML = '<span>Data de cadastro <span class="sort-arrow-v112">↕</span></span>';
        th.addEventListener('click', () => {
          const atual = window.ordemBensV111 || {campo:'adicionado',dir:'desc'};
          window.ordemBensV111 = {campo:'adicionado',dir: atual.campo === 'adicionado' && atual.dir === 'desc' ? 'asc' : 'desc'};
          const seletor = document.getElementById('ordemCadastroV135');
          if(seletor) seletor.value = window.ordemBensV111.dir === 'desc' ? 'recentes' : 'antigos';
          try{ pagina = 1; }catch(e){}
          window.renderTabela?.();
        });
        const actions = [...header.children].find(cell => /ações/i.test(cell.textContent || ''));
        const situation = [...header.children].find(cell => /situação/i.test(cell.textContent || ''));
        header.insertBefore(th, situation || actions || null);
      }
    }

    const cols = table.querySelector('colgroup');
    if(cols && !cols.querySelector('.col-selecao-v135')){
      const c1 = document.createElement('col'); c1.className = 'col-selecao-v135';
      cols.insertBefore(c1, cols.firstElementChild);
      const c2 = document.createElement('col'); c2.className = 'col-data-v135';
      const all = [...cols.children];
      const actionCol = all[all.length - 1];
      cols.insertBefore(c2, actionCol || null);
    }

    [...tbody.querySelectorAll('tr')].forEach(tr => {
      if(tr.querySelector('.empty')){
        tr.querySelector('.empty').colSpan = header?.children.length || 14;
        return;
      }
      const pat = tr.querySelector('td:nth-child(2) strong')?.textContent?.trim() || tr.dataset.patV135;
      if(!pat) return;
      tr.dataset.patV135 = pat;
      if(!tr.querySelector('.td-selecao-v135')){
        const td = document.createElement('td');
        td.className = 'td-selecao-v135';
        td.innerHTML = `<input class="selecionar-bem-v135" type="checkbox" data-pat="${esc(pat)}" aria-label="Selecionar bem ${esc(pat)}">`;
        tr.insertBefore(td, tr.firstElementChild);
        td.querySelector('input').addEventListener('change', event => {
          const key = String(event.target.dataset.pat);
          event.target.checked ? selecionados.add(key) : selecionados.delete(key);
          tr.classList.toggle('selecionado-v135', event.target.checked);
          atualizarBarra();
        });
      }
      if(!tr.querySelector('.td-data-v135')){
        const bem = localizarBem(pat);
        const td = document.createElement('td');
        td.className = 'td-data-v135';
        td.innerHTML = `<span title="${esc(dataCadastroValor(bem))}">${esc(dataCadastroTexto(bem))}</span>`;
        const cells = [...tr.children];
        const actionCell = cells[cells.length - 1];
        const situationCell = cells[cells.length - 2];
        tr.insertBefore(td, situationCell || actionCell || null);
      }
    });

    const topInner = document.getElementById('bensTopScrollInnerV113');
    const wrap = table.closest('.table-wrap');
    if(topInner && wrap) requestAnimationFrame(() => { topInner.style.width = Math.max(table.scrollWidth, wrap.scrollWidth, wrap.clientWidth) + 'px'; });
    atualizarSelecaoTela();
  }

  async function excluirSelecionados(){
    const pats = [...selecionados];
    if(!pats.length) return;
    const bensSelecionados = pats.map(localizarBem).filter(Boolean);
    if(!bensSelecionados.length){ selecionados.clear(); atualizarSelecaoTela(); return; }

    const lista = bensSelecionados.slice(0,8).map(b => `• ${b.pat} — ${b.desc}`).join('\n');
    const resto = bensSelecionados.length > 8 ? `\n… e mais ${bensSelecionados.length - 8} item(ns).` : '';
    if(!confirm(`Excluir definitivamente ${bensSelecionados.length} item(ns)?\n\n${lista}${resto}`)) return;

    const btn = document.getElementById('excluirSelecionadosV135');
    if(btn){ btn.disabled = true; btn.textContent = 'Excluindo…'; }
    const excluidos = [];
    const erros = [];

    try{
      const confirmar = window.confirmarPermissaoTotal || (typeof confirmarPermissaoTotal === 'function' ? confirmarPermissaoTotal : null);
      if(confirmar) await confirmar();
      const excluir = window.excluirBemSupabase || (typeof excluirBemSupabase === 'function' ? excluirBemSupabase : null);
      if(typeof excluir !== 'function') throw new Error('Rotina de exclusão não localizada.');

      for(let i=0;i<bensSelecionados.length;i++){
        const bem = bensSelecionados[i];
        if(btn) btn.textContent = `Excluindo ${i+1} de ${bensSelecionados.length}…`;
        try{
          await excluir(bem);
          excluidos.push(bem);
          selecionados.delete(String(bem.pat));
          try{ await supabaseClient.from('bens_patrimoniais_ext').delete().eq('numero_patrimonial', bem.pat); }catch(e){}
        }catch(error){ erros.push(`${bem.pat}: ${error?.message || error}`); }
      }

      if(excluidos.length){
        const ids = new Set(excluidos.map(b => String(b.id || '')));
        const tombos = new Set(excluidos.map(b => String(b.pat || '')));
        setListaBens(listaBens().filter(b => !ids.has(String(b.id || '')) && !tombos.has(String(b.pat || ''))));
        try{ if(typeof salvarLocal === 'function') salvarLocal(); }catch(e){}
        try{ if(typeof renderTudo === 'function') renderTudo(); }catch(e){}
        const sync = window.sincronizarDoSupabase || (typeof sincronizarDoSupabase === 'function' ? sincronizarDoSupabase : null);
        if(sync){ try{ await sync(false); }catch(e){} }
        try{ if(typeof renderTudo === 'function') renderTudo(); }catch(e){}
      }

      let msg = `${excluidos.length} item(ns) excluído(s) com sucesso.`;
      if(erros.length) msg += `\n\n${erros.length} item(ns) não foram excluídos:\n${erros.join('\n')}`;
      alert(msg);
    }catch(error){
      alert('Erro ao excluir os itens selecionados: ' + (error?.message || error));
    }finally{
      atualizarBarra();
      if(btn && selecionados.size === 0){ btn.disabled = true; btn.textContent = 'Excluir itens selecionados'; }
    }
  }

  function protegerRetornoAoPortal(){
    const old = document.querySelector('.side-head');
    if(!old || old.dataset.v135Safe === '1') return;
    const clone = old.cloneNode(true);
    clone.dataset.v135Safe = '1';
    old.replaceWith(clone);

    let startX = 0, startY = 0, moved = false, wheelAt = 0;
    clone.addEventListener('pointerdown', event => { startX = event.clientX; startY = event.clientY; moved = false; });
    clone.addEventListener('pointermove', event => {
      if(Math.abs(event.clientX - startX) > 7 || Math.abs(event.clientY - startY) > 7) moved = true;
    });
    clone.addEventListener('wheel', () => { wheelAt = Date.now(); moved = true; }, {passive:true});
    clone.addEventListener('click', event => {
      event.preventDefault();
      if(moved || Date.now() - wheelAt < 450) return;
      window.location.href = '../';
    });
  }

  function instalar(){
    garantirDadosCadastro();
    garantirFiltros();
    protegerRetornoAoPortal();
    if(!window.ordemBensV111 || window.ordemBensV111.campo === 'adicionado'){
      window.ordemBensV111 = {campo:'adicionado',dir:'desc'};
    }

    const filtradosAnterior = window.filtrados || (typeof filtrados === 'function' ? filtrados : null);
    if(typeof filtradosAnterior === 'function' && !filtradosAnterior.__v135){
      const novoFiltrados = function(){
        const rows = filtradosAnterior();
        const filtro = document.getElementById('filtroDataCadastroV135')?.value || '';
        if(!filtro) return rows;
        return rows.filter(item=>{
          const d = new Date(dataCadastroValor(item));
          if(Number.isNaN(d.getTime())) return false;
          const local = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          return local === filtro;
        });
      };
      novoFiltrados.__v135 = true;
      window.filtrados = novoFiltrados;
      try{ filtrados = novoFiltrados; }catch(e){}
    }

    const renderAnterior = window.renderTabela || (typeof renderTabela === 'function' ? renderTabela : null);
    if(typeof renderAnterior === 'function' && !renderAnterior.__v135){
      const novoRender = function(){
        renderAnterior();
        garantirFiltros();
        inserirColunas();
      };
      novoRender.__v135 = true;
      window.renderTabela = novoRender;
      try{ renderTabela = novoRender; }catch(e){}
    }

    window.renderTabela?.();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();
})();
