(function(){
'use strict';

const JUST_PAGE_ITEMS=[
 ['ANEXO1','Anexo I - Listagem das Contas Bancárias Ativas'],
 ['ANEXO2','Anexo II - Declaração de Responsabilidade e de Ciência do Conteúdo dos Documentos Enviados'],
 ['ANEXO3','Anexo III - Grade de Conciliação e Extratos Bancários'],
 ['ANEXO4','Anexo IV - Relatório de Acompanhamento de Órgãos Arrecadadores'],
 ['REL1','Relatório I - Listagem das Ordens Bancárias Geradas sem Retorno Bancário'],
 ['REL2','Relatório II - Listagem de Contas Contábeis a Regularizar'],
 ['REL3','Relatório III - Listagem dos Lançamentos de Receitas Orçamentárias'],
 ['REL4','Relatório IV - Listagem Prévia da Quebra de Sequencialidade de Pagamentos'],
 ['REL5','Relatório V - Listagem das Ordens Bancárias de Pagamentos da Folha'],
 ['REL6','Relatório VI - Disponibilidade por Fonte - Comparativo Contábil x Financeiro'],
 ['REL7','Relatório VII - Saldos dos Bens Patrimoniais - Comparativo SIAFE x Sistema de Patrimônio'],
 ['REL8','Relatório VIII - Listagem de Consignações Intempestivas'],
 ['REL9','Relatório IX - Listagem de Suprimento de Fundos com Prestação de Contas Atrasada'],
 ['REL10',"Relatório X - Comparativo de DEA's reconhecidos x DEA's executados"],
 ['REL11','Relatório XI - Listagem de Pagamentos de Convênios SICONV'],
 ['BALANCETE','Balancete Mensal'],
 ['FISCAL','Relatório de Situação Fiscal'],
 ['OUTRO','Outro documento complementar']
];

function justToday(){
 const d=new Date(),z=n=>String(n).padStart(2,'0');
 return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}
function justKey(){return `${document.getElementById('just-page-ug')?.value||''}|${document.getElementById('just-page-ref')?.value||''}`}
function justRecords(){state.justifications=state.justifications||{};const k=justKey();state.justifications[k]=state.justifications[k]||[];return state.justifications[k]}
function justLabel(item){return JUST_PAGE_ITEMS.find(x=>x[0]===item)?.[1]||item||'Documento'}
function justSyncContext(){
 const ug=document.getElementById('just-page-ug')?.value||'',ref=document.getElementById('just-page-ref')?.value||'';
 const confUg=document.getElementById('conference-ug'),confRef=document.getElementById('conference-ref');
 if(confUg&&[...confUg.options].some(o=>o.value===ug))confUg.value=ug;
 if(confRef)confRef.value=ref;
 const map=[['just-document','just-page-document'],['just-date','just-page-date'],['just-location','just-page-location'],['just-text','just-page-text'],['just-edit-id','just-page-edit-id']];
 for(const [target,source] of map){const t=document.getElementById(target),s=document.getElementById(source);if(t&&s)t.value=s.value}
}
function justReset(){
 const id=document.getElementById('just-page-edit-id'),text=document.getElementById('just-page-text'),date=document.getElementById('just-page-date'),loc=document.getElementById('just-page-location');
 if(id)id.value='';if(text)text.value='';if(date)date.value=justToday();if(loc&&!loc.value)loc.value='Fortaleza-CE';
 renderJustPage();
}
function renderJustPage(){
 const ugSel=document.getElementById('just-page-ug');if(!ugSel)return;
 const old=ugSel.value;ugSel.innerHTML=(state.ugs||[]).map(u=>`<option value="${u.id}">${esc(u.code)} - ${esc(u.acronym)}</option>`).join('');
 if((state.ugs||[]).some(u=>u.id===old))ugSel.value=old;else if(state.ugs?.[0])ugSel.value=state.ugs[0].id;
 const docSel=document.getElementById('just-page-document');if(docSel&&!docSel.options.length)docSel.innerHTML=JUST_PAGE_ITEMS.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('');
 const ref=document.getElementById('just-page-ref');if(ref&&!ref.value)ref.value=document.getElementById('report-ref')?.value||'2026-07';
 const date=document.getElementById('just-page-date');if(date&&!date.value)date.value=justToday();
 const ug=state.ugs.find(x=>x.id===ugSel.value),person=state.responsibles.find(x=>x.ugId===ug?.id),personBox=document.getElementById('just-page-person');
 if(personBox)personBox.innerHTML=person?`<strong>${esc(person.name)}</strong><span>${esc(person.role||'')} · ${esc(person.registration||'')} · ${esc(person.cpf||'')}</span><small>${esc(person.signatureRole||'')}</small>`:'<strong>Pessoa responsável não cadastrada</strong><span>Cadastre a pessoa responsável na Unidade Gestora antes de gerar o Anexo VI.</span>';
 const list=justRecords().slice().reverse(),box=document.getElementById('just-page-history');
 if(box)box.innerHTML=list.map(x=>`<div class="just-page-history-item"><div><strong>${esc(justLabel(x.item))}</strong><span>Referência ${esc(x.reference||formatRef(document.getElementById('just-page-ref').value))} · ${esc(x.dateLong||x.date||'')}</span><small>${esc((x.text||'').slice(0,150))}${(x.text||'').length>150?'…':''}</small></div><div class="actions"><button class="btn small" onclick="editJustPage('${x.id}')">Editar</button><button class="btn small success" onclick="downloadJustPageWord('${x.id}')">Word</button><button class="btn small primary" onclick="downloadJustPagePdf('${x.id}')">PDF</button><button class="btn small danger" onclick="deleteJustPage('${x.id}')">Excluir</button></div></div>`).join('')||'<div class="empty">Nenhuma justificativa salva para esta UG e competência.</div>';
}
window.renderJustPage=renderJustPage;
window.generateJustPagePdf=function(){justSyncContext();if(!document.getElementById('just-page-text').value.trim())return toast('Digite o texto da justificativa.');exportJustificationPdf();setTimeout(renderJustPage,80)};
window.generateJustPageWord=async function(){justSyncContext();if(!document.getElementById('just-page-text').value.trim())return toast('Digite o texto da justificativa.');await exportJustificationWord();setTimeout(renderJustPage,80)};
window.editJustPage=function(id){const x=justRecords().find(v=>v.id===id);if(!x)return;document.getElementById('just-page-edit-id').value=x.id;document.getElementById('just-page-document').value=x.item;document.getElementById('just-page-date').value=x.date||justToday();document.getElementById('just-page-location').value=x.location||'Fortaleza-CE';document.getElementById('just-page-text').value=x.text||'';document.getElementById('just-page-text').focus()};
window.downloadJustPagePdf=function(id){justSyncContext();downloadSavedJustificationPdf(id)};
window.downloadJustPageWord=function(id){justSyncContext();downloadSavedJustificationWord(id)};
window.deleteJustPage=function(id){if(!confirm('Excluir esta justificativa salva?'))return;const k=justKey();state.justifications[k]=(state.justifications[k]||[]).filter(x=>x.id!==id);persist();renderJustPage();if(window.renderDashboard)renderDashboard()};
window.clearJustPage=justReset;

function installJustificationsPage(){
 const nav=document.querySelector('.nav');
 if(nav&&!nav.querySelector('[data-page="justifications"]')){
  const btn=document.createElement('button');btn.dataset.page='justifications';btn.innerHTML='<b class="nav-icon">✎</b><span>Justificativas</span>';btn.onclick=()=>goPage('justifications');
  const processes=nav.querySelector('[data-page="processes"]');nav.insertBefore(btn,processes||null);
 }
 if(!document.getElementById('page-justifications')){
  const section=document.createElement('section');section.id='page-justifications';section.className='page';section.innerHTML=`
   <div class="page-title"><div><h2>Justificativas</h2><p>Emissão do Anexo VI - Termo de Justificativa para as Inconformidades.</p></div><div class="pill" id="just-page-pill">Anexo VI da IN nº 47/2025</div></div>
   <div class="just-page-layout">
    <div class="card just-page-form">
     <input type="hidden" id="just-page-edit-id">
     <div class="form-grid">
      <div class="field"><label>Unidade Gestora *</label><select id="just-page-ug" onchange="renderJustPage()"></select></div>
      <div class="field"><label>Competência *</label><input id="just-page-ref" type="month" onchange="renderJustPage()"></div>
      <div class="field full"><label>Qual demonstrativo será justificado? *</label><select id="just-page-document"></select></div>
      <div class="field"><label>Data</label><input id="just-page-date" type="date"></div>
      <div class="field"><label>Município/UF</label><input id="just-page-location" value="Fortaleza-CE"></div>
      <div class="field full"><label>Texto da justificativa *</label><textarea id="just-page-text" rows="12" placeholder="Digite o texto completo da justificativa..."></textarea></div>
     </div>
     <div id="just-page-person" class="just-page-person"></div>
     <div class="actions just-page-actions"><button class="btn" onclick="clearJustPage()">Novo / limpar</button><button class="btn success" onclick="generateJustPageWord()">Gerar Word</button><button class="btn primary" onclick="generateJustPagePdf()">Gerar PDF</button></div>
    </div>
    <div class="card just-page-history"><div class="section-head"><div><h3>Justificativas salvas</h3><div class="a3-note">Cada justificativa permanece vinculada à UG e à competência selecionadas.</div></div></div><div id="just-page-history"></div></div>
   </div>`;
  const results=document.getElementById('page-results');(results?.parentNode||document.querySelector('main')).insertBefore(section,results||null);
 }
 renderJustPage();
}

const style=document.createElement('style');
style.textContent=`
.just-page-layout{display:grid;grid-template-columns:minmax(420px,620px) minmax(360px,1fr);gap:18px;align-items:start}
.just-page-form textarea{min-height:250px;resize:vertical;line-height:1.55}
.just-page-person{margin-top:14px;padding:13px 15px;border:1px solid #cfe1e4;border-radius:14px;background:#f3f9f9;display:flex;flex-direction:column;gap:3px}
.just-page-person span,.just-page-person small{color:var(--muted)}
.just-page-actions{margin-top:15px;justify-content:flex-end}
.just-page-history-item{display:flex;gap:16px;justify-content:space-between;align-items:flex-start;padding:14px 0;border-bottom:1px solid #e2ecee}
.just-page-history-item>div:first-child{min-width:0;display:flex;flex-direction:column;gap:4px}.just-page-history-item span,.just-page-history-item small{color:var(--muted)}
.just-page-history-item .actions{flex:0 0 auto;justify-content:flex-end}
@media(max-width:1050px){.just-page-layout{grid-template-columns:1fr}.just-page-history-item{flex-direction:column}.just-page-history-item .actions{justify-content:flex-start}}
`;
document.head.appendChild(style);

/* FERDT - modelo oficial do Anexo III enviado pelo usuário */
const baseBuildExcel=window.buildAnexo3ExcelBytes;
const baseBuildPdf=window.buildAnexo3PdfBytes;
window.buildAnexo3ExcelBytes=async function(){
 const ugId=document.getElementById('report3-ug').value,ref=document.getElementById('report3-ref').value;
 if(ugId!=='ug-ferdt')return baseBuildExcel();
 const asset=window.TRANCILIM_ANEXO3_FERDT_ASSETS;if(!asset?.xlsx)throw new Error('Modelo do Excel do FERDT não encontrado.');
 const rows=report3Rows(),row=rows.find(r=>r.account===asset.account)||rows[0];if(!row)throw new Error('Conta bancária do FERDT não encontrada.');
 const docs=a3Docs(),zip=await JSZip.loadAsync(asset.xlsx,{base64:true}),reference='Referência: '+formatRef(ref),endLabel='SALDO DO EXTRATO BANCÁRIO EM '+a3EndDate(ref),month=a3MonthUpper(ref);
 for(const [name,entry] of Object.entries(zip.files)){
  if(entry.dir||!name.endsWith('.xml'))continue;
  let xml=await entry.async('string');
  xml=xml.replace(/Referência:\s*06\/2026/g,reference).replace(/SALDO DO EXTRATO BANCÁRIO EM 30\/06\/2026/g,endLabel).replace(/569495151-0\s+(?:MAIO|JUNHO)/g,'569495151-0 '+month);
  zip.file(name,xml);
 }
 const entry=zip.file('xl/worksheets/sheet1.xml');if(!entry)throw new Error('Planilha-base do FERDT não encontrada.');
 const xml=await entry.async('string'),doc=new DOMParser().parseFromString(xml,'application/xml'),layout={statementRow:17,sourceRows:[22,23,24,25],totalRow:26};
 a3PatchXlsxPage(doc,row,'current',layout,docs,endLabel);zip.file('xl/worksheets/sheet1.xml',new XMLSerializer().serializeToString(doc));
 zip.remove('xl/calcChain.xml');
 const rel=zip.file('xl/_rels/workbook.xml.rels');if(rel){let x=await rel.async('string');x=x.replace(/<Relationship[^>]+relationships\/calcChain[^>]+\/>/g,'');zip.file('xl/_rels/workbook.xml.rels',x)}
 const ct=zip.file('[Content_Types].xml');if(ct){let x=await ct.async('string');x=x.replace(/<Override[^>]+calcChain[^>]+\/>/g,'');zip.file('[Content_Types].xml',x)}
 return zip.generateAsync({type:'uint8array',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
};
buildAnexo3ExcelBytes=window.buildAnexo3ExcelBytes;

function buildFerdtPdf(account){
 const row=report3Rows().find(r=>r.account===account),docs=a3Docs(),ref=document.getElementById('report3-ref').value,tpl=window.TRANCILIM_A3_PDF_TEMPLATES?.[account]?.current;
 if(!row)throw new Error('Conta não encontrada.');if(!tpl)throw new Error('Modelo oficial do PDF do FERDT não encontrado.');
 const W=595.32,H=841.92,objects=[null],add=o=>(objects.push(o),objects.length-1),catalog=add(''),pagesObj=add(''),fontR=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>'),fontB=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
 const img=b64ToBytes(tpl.jpeg),imgObj=add({dict:`<< /Type /XObject /Subtype /Image /Width ${tpl.iw} /Height ${tpl.ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>`,data:img}),st=getA3Statement(docs,row.account,'current'),accounting=Number(row.accountingCurrent)||0,statement=Number(st.value||0),difference=accounting-statement,sourceRows=tpl.rows.filter(r=>String(r.item).startsWith('5.')),sources=a3OutputSources(row,'current',docs,sourceRows.length),totalRow=tpl.rows.find(r=>r.item==='6'),statementRow=tpl.rows.find(r=>r.item==='0'),[debitLeft,debitRight,creditRight,right]=tpl.cols;
 let c=`q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /BG Do Q\n`;
 const rgb=hex=>{const h=hex.replace('#','');return `${(parseInt(h.slice(0,2),16)/255).toFixed(3)} ${(parseInt(h.slice(2,4),16)/255).toFixed(3)} ${(parseInt(h.slice(4,6),16)/255).toFixed(3)}`};
 const whiteTop=(x0,top,x1,bottom,pad=1.1)=>{const x=x0+pad,y=H-bottom+pad,w=Math.max(0,x1-x0-pad*2),h=Math.max(0,bottom-top-pad*2);c+=`1 1 1 rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 g\n`};
 const width=(v,size,bold=false)=>pdfTextWidth(String(v??''),size,bold);
 const textTop=(v,x,baselineTop,size,bold=false,align='left',color='#000000')=>{v=String(v??'');let tx=x,w=width(v,size,bold);if(align==='center')tx-=w/2;else if(align==='right')tx-=w;c+=`${rgb(color)} rg BT /${bold?'FB':'FR'} ${Number(size).toFixed(2)} Tf 1 0 0 1 ${tx.toFixed(2)} ${(H-baselineTop).toFixed(2)} Tm (${pdfStr(v)}) Tj ET 0 g\n`};
const writeCell=(v,x0,top,x1,bottom,size=5.35,bold=false,color='#000000')=>{v=String(v??'');whiteTop(x0-0.2,top-0.15,x1+0.2,bottom+0.15,.05);const left=x0+2.8,rightEdge=x1-3.6,available=Math.max(4,rightEdge-left),measured=width(v,size,bold),fitted=measured<=available?size:Math.max(4,size*(available/measured)),baseline=(top+bottom)/2+fitted*.26,clipX=left-.3,clipY=H-bottom+.6,clipW=Math.max(1,rightEdge-left+.6),clipH=Math.max(1,bottom-top-1.2);c+=`q ${clipX.toFixed(2)} ${clipY.toFixed(2)} ${clipW.toFixed(2)} ${clipH.toFixed(2)} re W n\n`;textTop(v,rightEdge,baseline,fitted,bold,'right',color);c+='Q\n'};
 const zeroTemplate=Math.abs(accounting)<.005&&Math.abs(statement)<.005&&Math.abs(difference)<.005&&sources.every(s=>Math.abs(Number(s?.value||0))<.005);
 if(ref!=='2026-06'){
  const rb=tpl.refbox,refText='Referência: '+formatRef(ref);
  // Apaga a linha completa da referência antiga e a recompõe na mesma fonte/posição do modelo oficial.
  whiteTop(rb[0]-45.70,rb[1]-1.73,rb[2]+1.31,rb[3]+1.01,.05);
  textTop(refText,rb[2],rb[3]-2.14,9,false,'right');
  const db=tpl.datebox;
  // Substitui somente a data do histórico, preservando o restante da linha original.
  whiteTop(db[0]-1.05,db[1]-.65,db[2]+1.05,db[3]+.85,.05);
  textTop(a3EndDate(ref),db[2],db[3]-1.00,6,false,'right');
 }
 // Quando o FERDT está integralmente zerado, os valores oficiais já fazem parte do modelo.
 // Não os reescreve para evitar sobreposição, cortes e mudança de tipografia.
 if(!zeroTemplate){
  if(statementRow)writeCell(a3PdfMoney(statement),debitRight,statementRow.top,creditRight,statementRow.bottom,5.35,false);
  sourceRows.forEach((rr,i)=>writeCell(a3PdfMoney(sources[i]?.value||0),debitLeft,rr.top,debitRight,rr.bottom,5.35,false));
  if(totalRow){writeCell(a3PdfMoney(accounting),debitLeft,totalRow.top,debitRight,totalRow.bottom,5.05,true);writeCell(a3PdfMoney(statement),debitRight,totalRow.top,creditRight,totalRow.bottom,5.05,true);writeCell(a3PdfMoney(difference),creditRight,totalRow.top,right,totalRow.bottom,5.05,true,Math.abs(difference)>=.005?'#d00000':'#000000')}
 }
 const contentBytes=new Uint8Array(cp1252(c)),content=add({dict:`<< /Length ${contentBytes.length} >>`,data:contentBytes}),page=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${fontR} 0 R /FB ${fontB} 0 R >> /XObject << /BG ${imgObj} 0 R >> >> /Contents ${content} 0 R >>`);
 objects[catalog]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;objects[pagesObj]=`<< /Type /Pages /Count 1 /Kids [${page} 0 R] >>`;
 const parts=[new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n')],offset=[0];let len=parts[0].length;
 for(let n=1;n<objects.length;n++){offset[n]=len;const o=objects[n],head=new TextEncoder().encode(`${n} 0 obj\n`),tail=new TextEncoder().encode('\nendobj\n');parts.push(head);len+=head.length;if(typeof o==='string'){const b=new Uint8Array(cp1252(o));parts.push(b);len+=b.length}else{const h=new Uint8Array(cp1252(o.dict+'\nstream\n'));parts.push(h,o.data,new TextEncoder().encode('\nendstream'));len+=h.length+o.data.length+10}parts.push(tail);len+=tail.length}
 const xref=len;let xs=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let n=1;n<objects.length;n++)xs+=String(offset[n]).padStart(10,'0')+' 00000 n \n';xs+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(new Uint8Array(cp1252(xs)));const total=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let pos=0;for(const b of parts){out.set(b,pos);pos+=b.length}return out;
}
window.buildAnexo3PdfBytes=function(account){const ugId=document.getElementById('report3-ug')?.value;return ugId==='ug-ferdt'?buildFerdtPdf(account):baseBuildPdf(account)};
buildAnexo3PdfBytes=window.buildAnexo3PdfBytes;

window.downloadAnexo3Zip=async function(){
 if(!a3AllReady())return toast(a3PendingMessage()||'Conclua todas as contas antes de baixar o ZIP.');
 const ref=document.getElementById('report3-ref').value;
 try{const out=new JSZip(),excel=await buildAnexo3ExcelBytes();out.file('Anexo III - Grade de Conciliação Bancária.xlsx',excel,{binary:true,compression:'STORE'});const rows=report3Rows();let count=0;for(const r of rows){out.file(`${String(r.account).replace(/[^0-9A-Za-z._-]/g,'_')}.pdf`,buildAnexo3PdfBytes(r.account),{binary:true,compression:'STORE'});count++}const bytes=await out.generateAsync({type:'uint8array',compression:'STORE',mimeType:'application/zip'}),name=`Anexo III - Grade de Conciliação Bancária - ${formatRef(ref).replace('/','-')}.zip`;downloadBytes(bytes,'application/zip',name);toast(`ZIP gerado com o Excel e ${count} PDF(s).`)}catch(err){toast(err.message||'Não foi possível gerar o ZIP.')}
};

const baseRenderReport3=window.renderReport3;
window.renderReport3=function(){baseRenderReport3();const rows=report3Rows();document.querySelectorAll('#a3-table-body .anexo3-account small').forEach((el,i)=>{const r=rows[i],pages=(r?.current?1:0)+(r?.investment?1:0);el.textContent=`Um PDF final com ${pages} página${pages===1?'':'s'}`})};

const baseRenderAllV41=window.renderAll;
window.renderAll=function(){baseRenderAllV41();renderJustPage()};
const baseSyncReferenceV41=window.syncReference;
window.syncReference=function(){baseSyncReferenceV41();const ref=document.getElementById('global-year').value+'-'+document.getElementById('global-month').value;const j=document.getElementById('just-page-ref');if(j)j.value=ref;renderJustPage()};

installJustificationsPage();
if(document.getElementById('page-report3'))renderReport3();
})();