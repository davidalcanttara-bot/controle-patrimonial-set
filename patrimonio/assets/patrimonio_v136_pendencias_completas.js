(function(){
  'use strict';

  let filtroAtual = 'todas';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function vazio(v){
    const s = String(v ?? '').trim();
    return !s || s === '-' || /^(não informado|nao informado|sem informação|sem informacao)$/i.test(s);
  }

  function num(v){
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const s = String(v ?? '').trim();
    if(!s) return 0;
    const normal = s.includes(',') ? s.replace(/\./g,'').replace(',','.') : s;
    const n = Number(normal.replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  }

  function normPat(v){
    try{ if(typeof normalizarTombo === 'function') return normalizarTombo(v); }catch(e){}
    return String(v ?? '').trim();
  }

  function extBem(b){
    try{
      const cache = JSON.parse(localStorage.getItem('bensExtSGP_v95') || '{}') || {};
      return cache[normPat(b?.pat)] || {};
    }catch(e){ return {}; }
  }

  function anexosBem(b){
    const list = [];
    if(Array.isArray(b?.anexos)) list.push(...b.anexos);
    if(Array.isArray(b?.documentos)) list.push(...b.documentos);
    return list;
  }

  function temAnexo(b, tipos){
    const alvo = new Set(tipos.map(x => String(x).toLowerCase()));
    return anexosBem(b).some(a => alvo.has(String(a?.tipo_anexo || a?.tipo || '').toLowerCase()));
  }

  function dadosBem(b){
    const ext = extBem(b);
    return {
      categoriaSecundaria: b?.categoriaSecundaria || b?.categoria_secundaria || ext.categoriaSecundaria || ext.categoria_secundaria || '',
      categoriaPrincipal: b?.categoriaPrincipal || b?.categoria_principal || ext.categoriaPrincipal || ext.categoria_principal || '',
      fornecedor: b?.fornecedor || ext.fornecedor || '',
      cnpj: b?.cnpj || ext.cnpj || '',
      valor: b?.valor ?? b?.valorAquisicao ?? b?.valor_aquisicao ?? 0,
      nf: b?.nf || b?.numeroNotaFiscal || b?.numero_nota_fiscal || '',
      ordem: b?.ordemFornecimento || b?.ordem_fornecimento || b?.ordemCompra || b?.ordem_compra || b?.numeroOrdemFornecimento || b?.numero_ordem_fornecimento || '',
      notaEmpenho: b?.notaEmpenho || b?.nota_empenho || ext.notaEmpenho || ext.nota_empenho || ''
    };
  }

  function pendenciasCompletas(b){
    const d = dadosBem(b);
    const pend = [];
    const anexos = anexosBem(b);

    const temFoto = (() => {
      try{ if(typeof temFotoBem === 'function') return !!temFotoBem(b); }catch(e){}
      return !!b?.temFotoPrincipal || anexos.some(a => ['foto_principal','foto_etiqueta'].includes(String(a?.tipo_anexo || '').toLowerCase()));
    })();

    if(!temFoto) pend.push('Sem foto');
    if(vazio(b?.responsavel)) pend.push('Sem responsável');
    if(vazio(b?.setor)) pend.push('Sem setor');
    if(vazio(d.fornecedor)) pend.push('Sem fornecedor');
    if(vazio(d.cnpj)) pend.push('Sem CNPJ');
    if(vazio(d.categoriaSecundaria) && vazio(d.categoriaPrincipal)) pend.push('Sem item de despesa');
    if(num(d.valor) <= 0) pend.push('Sem valor de aquisição');

    const temNF = !vazio(d.nf) || !!b?.temArquivoNF || temAnexo(b,['nota_fiscal']);
    if(!temNF) pend.push('Sem nota fiscal');

    const temNE = !vazio(d.notaEmpenho) || !!b?.temNotaEmpenhoAnexada || temAnexo(b,['nota_empenho']);
    if(!temNE) pend.push('Sem nota de empenho');

    const temOrdem = !vazio(d.ordem) || !!b?.temOrdemFornecimento || temAnexo(b,['ordem_fornecimento','ordem_compra']);
    if(!temOrdem) pend.push('Sem ordem de compra/fornecimento');

    return [...new Set(pend)];
  }

  function fontePendencias(){
    let fonte = [];
    try{
      if(typeof bensDoRelatorio === 'function') fonte = bensDoRelatorio(mesSelecionado, anoSelecionado) || [];
      else if(typeof bensDaCompetencia === 'function') fonte = bensDaCompetencia() || [];
      else fonte = window.bens || (typeof bens !== 'undefined' ? bens : []) || [];
    }catch(e){ fonte = window.bens || []; }

    try{ if(typeof deduplicarBens === 'function') fonte = deduplicarBens(fonte || []); }catch(e){}

    const seen = new Set();
    return (fonte || []).filter(b => {
      if(!b || String(b.situacao || '').toLowerCase() === 'baixado') return false;
      const key = String(b.id || b.pat || Math.random());
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function slug(v){
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  function instalarControles(){
    const panel = document.querySelector('#pendencias .panel');
    if(!panel) return;

    if(!document.getElementById('pendenciasFiltrosV136')){
      const box = document.createElement('div');
      box.id = 'pendenciasFiltrosV136';
      box.className = 'pendencias-filtros-v136';
      box.innerHTML = `
        <label>Filtrar por tipo de pendência
          <select id="filtroPendenciaV136"><option value="todas">Todas as pendências</option></select>
        </label>
        <button type="button" id="limparFiltroPendenciaV136">Limpar filtro</button>
        <span id="resultadoPendenciaV136"></span>`;
      const tableWrap = panel.querySelector('.table-wrap');
      panel.insertBefore(box, tableWrap || null);
      box.querySelector('#filtroPendenciaV136')?.addEventListener('change', e => {
        filtroAtual = e.target.value || 'todas';
        renderPendenciasV136();
      });
      box.querySelector('#limparFiltroPendenciaV136')?.addEventListener('click', () => {
        filtroAtual = 'todas';
        const select = document.getElementById('filtroPendenciaV136');
        if(select) select.value = 'todas';
        renderPendenciasV136();
      });
    }

    if(!document.getElementById('resumoPendenciasV136')){
      const cards = document.querySelector('#pendencias .cards.small');
      const resumo = document.createElement('div');
      resumo.id = 'resumoPendenciasV136';
      resumo.className = 'resumo-pendencias-v136';
      cards?.insertAdjacentElement('afterend', resumo);
    }
  }

  function atualizarOpcoes(tipos){
    const select = document.getElementById('filtroPendenciaV136');
    if(!select) return;
    const atual = filtroAtual;
    select.innerHTML = '<option value="todas">Todas as pendências</option>' + tipos.map(t => `<option value="${esc(slug(t))}">${esc(t)}</option>`).join('');
    if([...select.options].some(o => o.value === atual)) select.value = atual;
    else { filtroAtual = 'todas'; select.value = 'todas'; }
  }

  function abrirCorrecao(pat){
    if(typeof abrirCadastroCorrigirV124 === 'function') return abrirCadastroCorrigirV124(pat);
    if(typeof abrirCadastro === 'function') return abrirCadastro(pat);
  }

  function renderPendenciasV136(){
    instalarControles();
    const base = fontePendencias();
    const registros = base.map(b => ({b, pend: pendenciasCompletas(b)})).filter(x => x.pend.length);
    const tipos = [...new Set(registros.flatMap(x => x.pend))].sort((a,b) => a.localeCompare(b,'pt-BR'));
    atualizarOpcoes(tipos);

    const contagem = Object.fromEntries(tipos.map(t => [t, registros.filter(x => x.pend.includes(t)).length]));
    const filtrados = filtroAtual === 'todas' ? registros : registros.filter(x => x.pend.some(p => slug(p) === filtroAtual));

    const setTxt = (id,val) => { const el = document.getElementById(id); if(el) el.textContent = String(val); };
    setTxt('pendSemFoto', contagem['Sem foto'] || 0);
    setTxt('pendSemResponsavel', contagem['Sem responsável'] || 0);
    setTxt('pendSemSetor', contagem['Sem setor'] || 0);
    setTxt('pendTotal', registros.length);

    const resumo = document.getElementById('resumoPendenciasV136');
    if(resumo){
      const principais = ['Sem item de despesa','Sem nota fiscal','Sem CNPJ','Sem ordem de compra/fornecimento','Sem valor de aquisição'];
      resumo.innerHTML = principais.map(t => `
        <button type="button" class="resumo-pendencia-v136 ${filtroAtual===slug(t)?'ativo':''}" data-filtro="${esc(slug(t))}">
          <span>${esc(t)}</span><strong>${contagem[t] || 0}</strong>
        </button>`).join('');
      resumo.querySelectorAll('[data-filtro]').forEach(btn => btn.addEventListener('click', () => {
        filtroAtual = btn.dataset.filtro || 'todas';
        const select = document.getElementById('filtroPendenciaV136');
        if(select) select.value = filtroAtual;
        renderPendenciasV136();
      }));
    }

    const info = document.getElementById('resultadoPendenciaV136');
    if(info){
      const nome = filtroAtual === 'todas' ? 'todas as pendências' : (tipos.find(t => slug(t) === filtroAtual) || 'filtro selecionado');
      info.textContent = `Mostrando ${filtrados.length} de ${registros.length} bens com pendência — ${nome}.`;
    }

    const tbody = document.getElementById('tabelaPendencias');
    if(!tbody) return;
    if(!filtrados.length){
      tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum bem encontrado para este filtro.</td></tr>';
      return;
    }

    tbody.innerHTML = filtrados.map(({b,pend}) => `
      <tr>
        <td><strong>${esc(b.pat || '-')}</strong></td>
        <td>${esc(b.desc || b.descricao || '-')}</td>
        <td><div class="pend-list">${pend.map(p => `<span class="pend-chip pend-chip-v136 pend-${esc(slug(p))}">${esc(p)}</span>`).join('')}</div></td>
        <td>${esc(b.setor || '-')}</td>
        <td>${esc(b.responsavel || '-')}</td>
        <td><div class="actions">
          <button type="button" class="ver-pendencia-v136" data-pat="${esc(b.pat)}">Ver</button>
          <button type="button" class="corrigir-pendencia-v136" data-pat="${esc(b.pat)}">Corrigir</button>
        </div></td>
      </tr>`).join('');

    tbody.querySelectorAll('.ver-pendencia-v136').forEach(btn => btn.addEventListener('click', () => {
      if(typeof abrirDetalhe === 'function') abrirDetalhe(btn.dataset.pat);
    }));
    tbody.querySelectorAll('.corrigir-pendencia-v136').forEach(btn => btn.addEventListener('click', () => {
      try{
        if(typeof podeEditar === 'function' && !podeEditar()) return typeof avisarSemPermissao === 'function' && avisarSemPermissao();
      }catch(e){}
      abrirCorrecao(btn.dataset.pat);
    }));
  }

  window.pendenciasDoBem = pendenciasCompletas;
  window.renderPendencias = renderPendenciasV136;

  const renderTudoAnterior = window.renderTudo || (typeof renderTudo === 'function' ? renderTudo : null);
  if(typeof renderTudoAnterior === 'function' && !renderTudoAnterior.__v136){
    const novo = function(){
      const r = renderTudoAnterior.apply(this, arguments);
      try{ renderPendenciasV136(); }catch(e){ console.warn('Pendências v136:', e); }
      return r;
    };
    novo.__v136 = true;
    window.renderTudo = novo;
    try{ renderTudo = novo; }catch(e){}
  }

  const viewAnterior = window.view || (typeof view === 'function' ? view : null);
  if(typeof viewAnterior === 'function' && !viewAnterior.__v136){
    const novoView = function(id,btn){
      const r = viewAnterior.apply(this, arguments);
      if(id === 'pendencias') setTimeout(renderPendenciasV136, 0);
      return r;
    };
    novoView.__v136 = true;
    window.view = novoView;
    try{ view = novoView; }catch(e){}
  }

  function instalar(){
    instalarControles();
    renderPendenciasV136();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();
})();
