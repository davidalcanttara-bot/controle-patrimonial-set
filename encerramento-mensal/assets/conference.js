(function(){
'use strict';

const CONF_REPORTS=[
  {id:'rel1',code:'010669',label:'Relatório I - Ordens bancárias geradas sem retorno bancário',needsExcel:true,keywords:['relatorio i','ordens bancarias','sem retorno bancario']},
  {id:'rel2',code:'010667',label:'Relatório II - Contas contábeis a regularizar',needsExcel:true,keywords:['relatorio ii','contas contabeis','regularizar']},
  {id:'rel3',code:'010670',label:'Relatório III - Lançamentos de receitas orçamentárias',needsExcel:true,keywords:['relatorio iii','lancamentos','receitas orcamentarias']},
  {id:'rel4',code:'011448',label:'Relatório IV - Prévia da quebra de sequencialidade de pagamentos',needsExcel:true,keywords:['relatorio iv','quebra de sequencialidade','pagamentos']},
  {id:'rel5',code:'010672',label:'Relatório V - Ordens bancárias de pagamentos da folha de pessoal',needsExcel:true,keywords:['relatorio v','ordens bancarias','folha de pessoal']},
  {id:'rel6',code:'011500',label:'Relatório VI - Disponibilidade - Comparativo Contábil x Financeiro',needsExcel:true,keywords:['relatorio vi','disponibilidade','comparativo contabil','financeiro']},
  {id:'rel7',code:'010637',label:'Relatório VII - Saldo dos bens patrimoniais - Comparativo SIAFE x Sistema de Patrimônio',needsExcel:true,keywords:['relatorio vii','bens patrimoniais','siafe','patrimonio']},
  {id:'rel8',code:'011296',label:'Relatório VIII - Consignações intempestivas',needsExcel:true,keywords:['relatorio viii','consignacoes intempestivas'],referenceOffset:-2},
  {id:'rel9',code:'010635',label:'Relatório IX - Suprimento de fundos inconsistentes',needsExcel:true,keywords:['relatorio ix','suprimento de fundos'],referenceOffset:-4},
  {id:'rel10',code:'010680',label:"Relatório X - Comparativo DEA's reconhecidas x DEA's executadas",needsExcel:true,keywords:['relatorio x','comparativo dea','reconhecidas','executadas']},
  {id:'rel11',code:'010821',label:'Relatório XI - Listagem de execução de convênios SICONV',needsExcel:true,keywords:['relatorio xi','execucao de convenios','siconv']},
  {id:'balancete',code:'',label:'Balancete Mensal',needsExcel:true,keywords:['balancete','conta contabil','saldo atual']},
  {id:'fiscal',code:'',label:'Relatório de Situação Fiscal',needsExcel:false,keywords:['informacoes de apoio para emissao de certidao','diagnostico fiscal']}
];

const JUSTIFICATION_ITEMS=[
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

state.conferenceDocs=state.conferenceDocs||{};
state.justifications=state.justifications||{};
state.complementaryDocs=state.complementaryDocs||{};
persist();

const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const confRef=()=>document.getElementById('conference-ref')?.value||document.getElementById('report-ref')?.value||'2026-06';
const confUgId=()=>document.getElementById('conference-ug')?.value||state.ugs[0]?.id||'';
const confKey=()=>`${confUgId()}|${confRef()}`;
const confStore=()=>{const k=confKey();state.conferenceDocs[k]=state.conferenceDocs[k]||{reports:{},closed:false};state.conferenceDocs[k].reports=state.conferenceDocs[k].reports||{};return state.conferenceDocs[k]};
const reportEntry=id=>{const s=confStore();s.reports[id]=s.reports[id]||{};return s.reports[id]};
const complementaryStore=()=>{const k=confKey();state.complementaryDocs[k]=state.complementaryDocs[k]||[];return state.complementaryDocs[k]};
const justificationKey=()=>confKey();
const justificationList=()=>{const k=justificationKey();state.justifications[k]=state.justifications[k]||[];return state.justifications[k]};
const reportDef=id=>CONF_REPORTS.find(x=>x.id===id);
const reportLabel=id=>reportDef(id)?.label||'Geral';
const displayedReportLabel=def=>def?.referenceOffset?`${def.label} (${shiftReferenceDate(confRef(),def.referenceOffset)})`:def?.label||'Geral';
const focusReport=()=>document.getElementById('conference-focus-report')?.value||'Geral';

function badge(status,text){const cls=status==='ok'?'conf-badge ok':status==='error'?'conf-badge error':status==='warn'?'conf-badge warn':'conf-badge pending';return `<span class="${cls}">${status==='ok'?'✓':status==='error'?'!':status==='warn'?'•':'○'} ${esc(text)}</span>`}
function worst(statuses){if(statuses.includes('error'))return'error';if(statuses.includes('warn'))return'warn';if(statuses.includes('pending'))return'pending';return'ok'}
function checkByCategory(entry,category){const checks=[];if(entry.pdf?.checks)checks.push(...entry.pdf.checks.filter(x=>x.category===category));if(entry.excel?.checks)checks.push(...entry.excel.checks.filter(x=>x.category===category));if(!checks.length)return{status:'pending',detail:'Aguardando arquivo'};const details=[...new Set(checks.map(x=>x.detail).filter(Boolean))];return{status:worst(checks.map(x=>x.status)),detail:details.join(' | ')}}
function overall(def,entry){if(entry.manualOk)return{status:'ok',text:'OK manual'};if(!entry.pdf)return{status:'pending',text:'Aguardando PDF'};if(def.needsExcel&&!entry.excel)return{status:'pending',text:'Aguardando Excel'};const checks=[...(entry.pdf?.checks||[]),...(entry.excel?.checks||[])];const w=worst(checks.map(x=>x.status));return w==='ok'?{status:'ok',text:'Tudo certo'}:w==='warn'?{status:'warn',text:'Atenção'}:w==='error'?{status:'error',text:'Divergência encontrada'}:{status:'pending',text:'Aguardando'}}
function referenceEnd(ref){const [y,m]=ref.split('-').map(Number);return new Date(y,m,0)}
function shiftReferenceDate(ref,offset){const [y,m]=ref.split('-').map(Number),d=new Date(y,m-1+offset+1,0);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`}
function normalizeFullDate(value){const m=String(value||'').match(/(\d{1,2})\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{4})/);return m?`${String(Number(m[1])).padStart(2,'0')}/${String(Number(m[2])).padStart(2,'0')}/${m[3]}`:''}
function extractSpecificReference(text,expected=''){
  const raw=String(text||'')
    .replace(/\u00a0/g,' ')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .replace(/[：]/g,':')
    .replace(/[／]/g,'/')
    .replace(/[–—]/g,'-');
  const flat=raw.replace(/\s+/g,' ').trim();
  const patterns=[
    /Data\s+(?:de\s+)?Refer[eê]ncia\s*:?\s*(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/i,
    /Refer[eê]ncia\s*:?\s*(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/i,
    /Data\s+Base\s*:?\s*(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/i,
    /Per[ií]odo\s+de\s+Refer[eê]ncia\s*:?\s*(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/i
  ];
  for(const source of [raw,flat])for(const p of patterns){const m=source.match(p);if(m)return normalizeFullDate(m[1])}
  const dates=[];
  const re=/(\d{1,2})\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{4})/g;
  let m;
  while((m=re.exec(flat))){
    const date=normalizeFullDate(m[0]);
    if(!date)continue;
    const before=flat.slice(Math.max(0,m.index-180),m.index);
    const after=flat.slice(m.index+m[0].length,Math.min(flat.length,m.index+m[0].length+100));
    const context=norm(before+' '+after);
    let score=0;
    if(expected&&date===expected)score+=500;
    if(context.includes('referencia'))score+=180;
    if(context.includes('data base'))score+=150;
    if(context.includes('periodo'))score+=70;
    if(context.includes('consignacoes intempestivas')||context.includes('suprimento de fundos'))score+=90;
    if(context.includes('impresso em')||context.includes('emitido em')||context.includes('gerado em'))score-=180;
    dates.push({date,score,index:m.index});
  }
  dates.sort((a,b)=>b.score-a.score||a.index-b.index);
  return dates[0]&&dates[0].score>0?dates[0].date:'';
}
function specificReferenceCheck(def,text){if(!def.referenceOffset)return null;const expected=shiftReferenceDate(confRef(),def.referenceOffset),found=extractSpecificReference(text,expected);return{category:'competencia',status:found===expected?'ok':found?'error':'warn',detail:found===expected?`Data de referência específica ${found} correta`:`Data de referência específica encontrada: ${found||'não localizada'}; esperada para a competência selecionada: ${expected}`}}
function parseBrDate(s){const m=String(s||'').match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);return m?new Date(Number(m[3]),Number(m[2])-1,Number(m[1])):null}
function findEmission(text){const patterns=[/Impresso\s+(?:por\s+[^\n]+\s+)?em\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,/Emitido\s+em\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,/PROCURADORIA-GERAL DA FAZENDA NACIONAL\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}:\d{2}/];for(const p of patterns){const m=String(text||'').match(p);if(m)return m[1].replace(/-/g,'/')}return''}
function titleMatches(def,ntext,filename){const source=ntext+' '+norm(filename);return def.keywords.every(k=>source.includes(norm(k)))}
function canonicalRef(month,year){const m=Number(month),y=Number(year);return m>=1&&m<=12&&y>=2000&&y<=2200?`${y}-${String(m).padStart(2,'0')}`:''}
function extractCompetence(text,filename=''){
  const raw=String(text||'')
    .replace(/\u00a0/g,' ')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .replace(/[：]/g,':')
    .replace(/[／]/g,'/')
    .replace(/[–—]/g,'-');
  const flat=raw.replace(/\s+/g,' ').trim();
  const patterns=[
    /Encerramento\s*Mensal\s*:?\s*(\d{1,2})\s*\/\s*(\d{4})/i,
    /Mensal\s*:?\s*(\d{1,2})\s*\/\s*(\d{4})/i,
    /\bCompet[eê]ncia\s*:?\s*(\d{1,2})\s*\/\s*(\d{4})/i,
    /(?:^|\n)\s*Refer[eê]ncia\s*:?\s*(\d{1,2})\s*\/\s*(\d{4})/im,
    /\bM[eê]s\s*:?\s*(\d{1,2})\s*\/\s*(\d{4})/i
  ];
  for(const source of [raw,flat]){
    for(const p of patterns){
      const m=source.match(p);
      if(m){const ref=canonicalRef(m[1],m[2]);if(ref)return ref}
    }
  }
  // PDFs do SIAFE às vezes entregam o título em fragmentos separados.
  // Esta forma compacta também reconhece "Encerramento / Mensal: 6/2026"
  // mesmo quando o leitor insere espaços entre letras e palavras.
  const compact=norm(raw).replace(/[^a-z0-9/]/g,'');
  const compactMatch=compact.match(/(?:encerramentomensal|mensal|competencia|referencia)(0?[1-9]|1[0-2])\/(20\d{2})/);
  if(compactMatch){const ref=canonicalRef(compactMatch[1],compactMatch[2]);if(ref)return ref}
  const bal=flat.match(/Unidade\s+Gestora[\s\S]{0,350}?(\d{6})[\s\S]{0,180}?(\d{1,2})\s*\/\s*(\d{4})/i);
  if(bal){const ref=canonicalRef(bal[2],bal[3]);if(ref)return ref}
  const pair=flat.match(/\bM[eê]s\s*:?\s*(\d{1,2})[\s\S]{0,140}?Exerc[ií]cio\s*:?\s*(\d{4})/i);
  if(pair){const ref=canonicalRef(pair[1],pair[2]);if(ref)return ref}
  // Último recurso: escolhe o mês/ano mais próximo de rótulos de competência,
  // evitando confundir a data de impressão (dd/mm/aaaa) com a referência.
  const candidates=[];
  const re=/(0?[1-9]|1[0-2])\s*\/\s*(20\d{2})/g;
  let m;
  while((m=re.exec(flat))){
    const before=flat.slice(Math.max(0,m.index-220),m.index);
    const after=flat.slice(m.index+m[0].length,Math.min(flat.length,m.index+m[0].length+100));
    const context=norm(before+' '+after);
    const immediate=before.slice(-8);
    let score=m.index<3000?10:0;
    if(context.includes('encerramento mensal'))score+=120;
    else if(context.includes('mensal'))score+=75;
    if(context.includes('competencia'))score+=95;
    if(context.includes('referencia'))score+=85;
    if(context.includes('mes'))score+=30;
    if(/\d{1,2}\s*[\/-]\s*$/.test(immediate))score-=180;
    if(context.includes('impresso em'))score-=45;
    if(context.includes('emitido em'))score-=35;
    if(context.includes('dados atualizados'))score-=35;
    candidates.push({ref:canonicalRef(m[1],m[2]),score,index:m.index});
  }
  candidates.sort((a,b)=>b.score-a.score||a.index-b.index);
  if(candidates[0]&&candidates[0].score>=35)return candidates[0].ref;
  const fn=String(filename||'').match(/(?:^|\D)(0?[1-9]|1[0-2])[\s_.-]+(20\d{2})(?:\D|$)/);
  return fn?canonicalRef(fn[1],fn[2]):'';
}
function selectedUg(){return state.ugs.find(x=>x.id===confUgId())}
function extractUgCode(text,filename=''){
  const raw=String(text||'').replace(/\u00a0/g,' ').replace(/[\u200B-\u200D\uFEFF]/g,'');
  const joinedDigits=raw.replace(/(?<=\d)\s+(?=\d)/g,'');
  const patterns=[
    /(?:Unidade\s+Gestora|\bUG)\s*[:_\-–]?\s*(\d{6})/i,
    /\bUG\s*[:_\-–]\s*(\d{6})/i,
    /Par[aâ]metros\s*:[\s\S]{0,220}?Unidade\s+Gestora\s*:?\s*(\d{6})/i,
    /Unidade\s+Gestora[\s\S]{0,350}?(\d{6})/i
  ];
  for(const source of [raw,joinedDigits])for(const p of patterns){const m=source.match(p);if(m)return m[1]}
  const fn=String(filename||'').match(/(?:UG|UG_)\s*[:_\-]?\s*(\d{6})/i);if(fn)return fn[1];
  // Alguns relatórios do SIAFE exibem a UG isolada no cabeçalho, sem o rótulo "UG".
  // A leitura do PDF também pode separar cada algarismo; por isso conferimos os códigos conhecidos
  // apenas no começo do documento, onde fica o cabeçalho.
  const header=joinedDigits.slice(0,4200),known=(state.ugs||[]).map(u=>String(u.code||'')).filter(c=>/^\d{6}$/.test(c));
  const hits=known.filter(code=>new RegExp(`(^|\D)${code}(?=\D|$)`).test(header));
  if(hits.length===1)return hits[0];
  const first=raw.slice(0,2600);const cnpj=(first.match(/CNPJ(?:\s+do\s+certificado)?\s*:?\s*(\d{2}\.\d{3}\.\d{3})/i)||[])[1];
  const map={'34.223.378':'560901','49.921.771':'590001','41.604.410':'561001','66.187.382':'590101'};return map[cnpj]||''
}
function competenceCheck(text,filename,def){if(def.id==='fiscal')return{status:'ok',detail:'Competência mensal não se aplica a este documento; a conferência é feita pela emissão.',found:''};const expected=confRef(),found=extractCompetence(text,filename);if(!found)return{status:'warn',detail:`Competência não localizada automaticamente. Selecionada: ${formatRef(expected)}.`,found:''};if(found===expected)return{status:'ok',detail:`Competência do arquivo: ${formatRef(found)} — corresponde à selecionada.`,found};return{status:'error',detail:`Competência divergente. Arquivo: ${formatRef(found)} | selecionada: ${formatRef(expected)}.`,found}}
function ugCheck(text,filename,def){const ug=selectedUg(),expected=String(ug?.code||''),found=extractUgCode(text,filename);if(!expected)return{status:'warn',detail:'Selecione uma Unidade Gestora.',found:''};if(found===expected)return{status:'ok',detail:`Unidade Gestora do arquivo: ${found} — corresponde à selecionada.`,found};if(found)return{status:'error',detail:`Unidade Gestora divergente. Arquivo: ${found} | selecionada: ${expected}.`,found};const n=norm(text+' '+filename);if(n.includes(expected))return{status:'ok',detail:`Unidade Gestora ${expected} confirmada.`,found:expected};if(def.id==='fiscal'){const words=norm(ug?.name).split(' ').filter(w=>w.length>4).slice(0,4);if(words.length>=2&&words.filter(w=>n.includes(w)).length>=2)return{status:'ok',detail:`Unidade Gestora ${expected} confirmada pelo nome da entidade.`,found:expected}}return{status:'warn',detail:`Unidade Gestora não localizada automaticamente. Selecionada: ${expected}.`,found:''}}
function signatureCheck(text,hasPdfSignature=false){
  const n=norm(text),visible=[
    'documento assinado eletronicamente','assinado eletronicamente','assinado digitalmente',
    'assinatura eletronica','assinatura digital','codigo de validacao','codigo verificador',
    'documento assinado por','verifique a autenticidade'
  ].some(x=>n.includes(x));
  if(visible||hasPdfSignature)return{status:'ok',detail:visible?'Assinatura da gestora do patrimônio identificada no próprio PDF.':'Assinatura digital identificada na estrutura do próprio PDF.'};
  return{status:'error',detail:'Assinatura da gestora do patrimônio não foi identificada. Anexe diretamente a versão assinada deste relatório.'}
}
function dataCheck(def,text){const n=norm(text);if(def.id==='fiscal'){const own=n.split('vinculado ao mesmo ente federativo')[0];if(own.includes('nao foram detectadas pendencias')||own.includes('certidao positiva com efeitos de negativa'))return{status:'ok',detail:'Situação fiscal da própria UG identificada'};return{status:'warn',detail:'Não foi possível confirmar automaticamente a situação fiscal da própria UG'}}if(n.includes('a consulta nao retornou valores para os parametros informados'))return{status:'ok',detail:'Consulta sem ocorrências — resultado válido'};const requirements={rel3:['documento','data emissao','saldo'],rel5:['valor total liquido da folha','declaro que o pagamento da folha'],rel6:['saldo contabil','saldo financeiro','diferenca'],rel7:['valor contabil bruto','saldo no sistema de patrimonio'],rel8:['tipo de retencao','saldo'],rel9:['suprimentos a comprovar','adiantamentos em inadimplencia'],rel10:['dea reconhecida','dea liquidada'],rel11:['convenio siconv','transferegov'],balancete:['saldo inicial','debito','credito','saldo atual']};const req=requirements[def.id]||[],missing=req.filter(x=>!n.includes(norm(x)));if(missing.length)return{status:'warn',detail:'Estrutura parcialmente reconhecida: '+missing.join(', ')};return{status:'ok',detail:'Estrutura e dados principais reconhecidos'}}

async function extractPdfTextMeta(file){
  if(!window.pdfjsLib)throw new Error('Leitor de PDF indisponível. Verifique a conexão e tente novamente.');
  const data=new Uint8Array(await file.arrayBuffer()),pdf=await pdfjsLib.getDocument({data}).promise,pages=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p),content=await page.getTextContent();
    const rawItems=content.items.filter(x=>x.str&&String(x.str).trim());
    const items=rawItems.map(x=>({text:String(x.str),x:Number(x.transform?.[4]||0),y:Number(x.transform?.[5]||0)}));
    const lines=[];
    for(const item of items){let line=lines.find(l=>Math.abs(l.y-item.y)<=3.2);if(!line){line={y:item.y,items:[]};lines.push(line)}line.items.push(item)}
    lines.sort((a,b)=>b.y-a.y);
    const visualText=lines.map(l=>l.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ')).join('\n');
    const contentOrderText=rawItems.map(i=>String(i.str)).join(' ');
    pages.push(visualText+'\n'+contentOrderText);
  }
  const binary=new TextDecoder('latin1').decode(data);
  const hasPdfSignature=/\/Type\s*\/Sig\b|\/ByteRange\s*\[|adbe\.pkcs7|ETSI\.CAdES/i.test(binary);
  return{text:pages.join('\n'),pages:pdf.numPages,hasPdfSignature};
}
function analyzePdf(def,file,text,pages,hasPdfSignature=false){const ref=confRef(),checks=[],titleOk=titleMatches(def,norm(text),file.name),uc=ugCheck(text,file.name,def),cc=competenceCheck(text,file.name,def);checks.push({category:'dados',status:titleOk?'ok':'error',detail:titleOk?'Relatório correto':'Nome/conteúdo não corresponde ao relatório selecionado'});checks.push({category:'ug',status:uc.status,detail:uc.detail});checks.push({category:'competencia',status:cc.status,detail:cc.detail});const emission=findEmission(text),ed=parseBrDate(emission),end=referenceEnd(ref);let emStatus='warn',emDetail='Data de emissão não localizada';if(ed){const diff=(ed-end)/86400000;emStatus=diff>0&&diff<=62?'ok':diff<=0?'error':'warn';emDetail=emStatus==='ok'?`Emissão ${emission} após o fechamento da competência`:emStatus==='error'?`Emissão ${emission} anterior ou igual ao fim da competência`:`Emissão ${emission} fora da janela usual`}checks.push({category:'emissao',status:emStatus,detail:emDetail});const specificRef=specificReferenceCheck(def,text);if(specificRef)checks.push(specificRef);const dc=dataCheck(def,text);checks.push({category:'dados',status:dc.status,detail:dc.detail});if(def.id==='rel7'){const sig=signatureCheck(text,hasPdfSignature);checks.push({category:'dados',status:sig.status,detail:sig.detail})}checks.push({category:'dados',status:pages>0?'ok':'error',detail:`PDF com ${pages} página(s)`});return{name:file.name,pages,emission,foundUg:uc.found||'',foundRef:cc.found||'',signed:def.id==='rel7'?signatureCheck(text,hasPdfSignature).status==='ok':undefined,checks,uploadedAt:new Date().toISOString()}}

function scanUtf16(bytes){const out=[];for(let parity=0;parity<2;parity++){let run='';for(let i=parity;i+1<bytes.length;i+=2){const code=bytes[i]|(bytes[i+1]<<8),ok=(code>=32&&code<=255)||code===10||code===13;if(ok)run+=String.fromCharCode(code);else{if(run.trim().length>=4)out.push(run.trim());run=''}}if(run.trim().length>=4)out.push(run.trim())}return out.join('\n')}
function scanLatin(bytes){let run='',out=[];for(const b of bytes){const ok=(b>=32&&b<=126)||(b>=160&&b<=255);if(ok)run+=String.fromCharCode(b);else{if(run.trim().length>=5)out.push(run.trim());run=''}}if(run.trim().length>=5)out.push(run.trim());return out.join('\n')}
async function extractSpreadsheetText(file){const bytes=new Uint8Array(await file.arrayBuffer());if(file.name.toLowerCase().endsWith('.xlsx')){const zip=await JSZip.loadAsync(bytes),parts=[];for(const name of Object.keys(zip.files).filter(n=>/^xl\/(sharedStrings|worksheets\/sheet\d+)\.xml$/.test(n))){const xml=await zip.file(name).async('string');parts.push(xml.replace(/<[^>]+>/g,' '))}return{text:parts.join('\n'),format:'XLSX',valid:true}}const ole=[0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1].every((b,i)=>bytes[i]===b);return{text:scanUtf16(bytes)+'\n'+scanLatin(bytes),format:'XLS',valid:ole}}
function analyzeExcel(def,file,text,format,valid){const n=norm(text),fname=norm(file.name),checks=[],titleOk=titleMatches(def,n,fname),uc=ugCheck(text,file.name,def),cc=competenceCheck(text,file.name,def);checks.push({category:'dados',status:valid?'ok':'error',detail:valid?`${format} válido`:'Estrutura do arquivo Excel inválida'});checks.push({category:'dados',status:titleOk?'ok':'warn',detail:titleOk?'Excel corresponde ao relatório':'Identificação do relatório não foi localizada integralmente no Excel'});checks.push({category:'ug',status:uc.status,detail:uc.detail});checks.push({category:'competencia',status:cc.status,detail:cc.detail});const specificRef=specificReferenceCheck(def,text);if(specificRef)checks.push(specificRef);return{name:file.name,format,foundUg:uc.found||'',foundRef:cc.found||'',checks,uploadedAt:new Date().toISOString()}}

const FILE_DB='trancilim-conference-files-v20',FILE_STORE='files';
const ANALYSIS_VERSION=23;
const reanalysisLocks=new Set();

function openFileDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(FILE_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(FILE_STORE))req.result.createObjectStore(FILE_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function putBlob(key,blob){try{const db=await openFileDb();await new Promise((res,rej)=>{const tx=db.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).put(blob,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close()}catch{}}
async function getBlob(key){try{const db=await openFileDb(),blob=await new Promise((res,rej)=>{const tx=db.transaction(FILE_STORE,'readonly'),r=tx.objectStore(FILE_STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();return blob}catch{return null}}
async function deleteBlob(key){try{const db=await openFileDb();await new Promise((res,rej)=>{const tx=db.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close()}catch{}}
const primaryBlobKey=(id,kind)=>`primary|${confKey()}|${id}|${kind}`;
async function reanalyzeCurrentConference(force=false){
  const key=confKey(),store=confStore();
  if((store.analysisVersion===ANALYSIS_VERSION&&!force)||reanalysisLocks.has(key))return;
  const entries=CONF_REPORTS.filter(def=>{const e=reportEntry(def.id);return e.pdf||e.excel});
  if(!entries.length){store.analysisVersion=ANALYSIS_VERSION;persist();return}
  reanalysisLocks.add(key);
  let processed=0;
  try{
    for(const def of entries){
      const entry=reportEntry(def.id);
      for(const kind of ['pdf','excel']){
        const old=entry[kind];if(!old?.name)continue;
        const blob=await getBlob(primaryBlobKey(def.id,kind));if(!blob)continue;
        const file=new File([blob],old.name,{type:blob.type||''});
        try{
          if(kind==='pdf'){const meta=await extractPdfTextMeta(file);entry.pdf=analyzePdf(def,file,meta.text,meta.pages,meta.hasPdfSignature)}
          else{const meta=await extractSpreadsheetText(file);entry.excel=analyzeExcel(def,file,meta.text,meta.format,meta.valid)}
          processed++;
        }catch{}
      }
    }
    store.analysisVersion=ANALYSIS_VERSION;persist();
  }finally{
    reanalysisLocks.delete(key);renderConference();
  }
  if(force)toast(processed?`${processed} arquivo(s) reanalisado(s).`:'Nenhum arquivo disponível para reanálise.');
}
window.reanalyzeConferenceFiles=()=>reanalyzeCurrentConference(true);

async function openStoredBlob(key,name,download=false){const win=!download?window.open('about:blank','_blank'):null,blob=await getBlob(key);if(!blob){if(win)win.close();return toast('O arquivo não está mais disponível neste navegador. Anexe-o novamente.')}const url=URL.createObjectURL(blob);if(download){const a=document.createElement('a');a.href=url;a.download=name||'arquivo';document.body.appendChild(a);a.click();a.remove()}else if(win)win.location.href=url;else window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),60000)}
window.viewConferenceFile=(id,kind)=>{const f=reportEntry(id)[kind];if(f)openStoredBlob(primaryBlobKey(id,kind),f.name,false)};
window.conferenceUpload=async function(id,kind,input){const file=input.files?.[0];if(!file)return;const def=reportDef(id),entry=reportEntry(id);entry[kind]={name:file.name,reading:true,checks:[]};persist();renderConference();await putBlob(primaryBlobKey(id,kind),file);try{if(kind==='pdf'){const meta=await extractPdfTextMeta(file);entry.pdf=analyzePdf(def,file,meta.text,meta.pages,meta.hasPdfSignature)}else{const meta=await extractSpreadsheetText(file);entry.excel=analyzeExcel(def,file,meta.text,meta.format,meta.valid)}entry.manualOk=false;persist();renderConference();toast(`${kind==='pdf'?'PDF':'Excel'} conferido: ${file.name}`)}catch(err){entry[kind]={name:file.name,checks:[{category:'dados',status:'error',detail:err.message||'Não foi possível ler o arquivo'}],error:err.message||'Falha na leitura'};persist();renderConference();toast(err.message||'Não foi possível ler o arquivo.')}finally{input.value=''}};
window.removeConferenceFile=async function(id,kind){const e=reportEntry(id);delete e[kind];e.manualOk=false;await deleteBlob(primaryBlobKey(id,kind));persist();renderConference()};
window.toggleConferenceDetail=id=>document.getElementById('conf-details-'+id)?.classList.toggle('open');
window.toggleManualConference=function(id){const e=reportEntry(id);e.manualOk=!e.manualOk;persist();renderConference();toast(e.manualOk?'Relatório confirmado manualmente.':'Confirmação manual removida.')};

function fileCell(def,entry,id,kind){const file=entry[kind],accept=kind==='pdf'?'.pdf':'.xls,.xlsx',label=kind==='pdf'?'Anexar PDF':'Anexar Excel';return `<div class="conf-file">${file?`<strong class="file-ok">${esc(file.name)}</strong><div class="actions"><button class="btn small" onclick="viewConferenceFile('${id}','${kind}')">Visualizar</button><button class="btn small danger" onclick="removeConferenceFile('${id}','${kind}')">Remover</button></div>`:`<span class="file-wait">Não anexado</span><button class="btn small" onclick="document.getElementById('conf-${kind}-${id}').click()">${label}</button>`}<input hidden id="conf-${kind}-${id}" type="file" accept="${accept}" onchange="conferenceUpload('${id}','${kind}',this)"></div>`}
function detailHtml(def,entry){const checks=[...(entry.pdf?.checks||[]),...(entry.excel?.checks||[])];if(!checks.length)return'<div class="conf-empty-detail">Anexe os arquivos para iniciar o pente-fino.</div>';return `<div class="conf-check-grid">${checks.map(c=>`<div class="conf-check-item">${badge(c.status,c.category)}<span>${esc(c.detail)}</span></div>`).join('')}</div>`}
function categoryText(category,c){if(c.status==='pending')return'Pendente';if(category==='competencia'){if(c.detail.includes('não se aplica'))return'Não se aplica';return c.status==='ok'?'Competência OK':c.status==='error'?'Competência divergente':'Não localizada'}if(category==='ug')return c.status==='ok'?'UG OK':c.status==='error'?'UG divergente':'Não localizada';if(category==='emissao')return c.status==='ok'?'Emissão OK':c.status==='error'?'Emissão divergente':'Verificar emissão';if(category==='dados')return c.status==='ok'?'Dados OK':c.status==='error'?'Dados divergentes':'Verificar dados';return'Verificar'}
function checkCell(category,c){const show=c.status==='error'||c.status==='warn';return `<div class="conf-check-cell" title="${esc(c.detail)}">${badge(c.status,categoryText(category,c))}${show?`<small>${esc(c.detail)}</small>`:''}</div>`}
function reportRelatedCounts(id){const comp=complementaryStore().filter(x=>relatedId(x)===id).length,just=justificationList().filter(x=>reportIdForItem(x.item)===id).length;return{comp,just}}
function renderConference(){const ugSel=document.getElementById('conference-ug');if(!ugSel)return;const ref=confRef(),store=confStore(),focus=focusReport();document.getElementById('conference-ref-pill').textContent='Referência '+formatRef(ref);const results=CONF_REPORTS.map(def=>overall(def,reportEntry(def.id))),complete=results.filter(x=>x.status!=='pending').length,ok=results.filter(x=>x.status==='ok').length,attention=results.filter(x=>x.status==='warn'||x.status==='error').length;document.getElementById('conf-kpi-total').textContent=CONF_REPORTS.length;document.getElementById('conf-kpi-complete').textContent=complete;document.getElementById('conf-kpi-ok').textContent=ok;document.getElementById('conf-kpi-attention').textContent=attention;document.getElementById('conference-body').innerHTML=CONF_REPORTS.map(def=>{const e=reportEntry(def.id),r=overall(def,e),comp=checkByCategory(e,'competencia'),ug=checkByCategory(e,'ug'),em=checkByCategory(e,'emissao'),data=checkByCategory(e,'dados'),counts=reportRelatedCounts(def.id),focused=focus===def.id?' class="conf-focused"':'';return `<tr${focused}><td class="conf-code-cell"><strong>${def.code?esc(def.code):'—'}</strong></td><td><strong>${esc(displayedReportLabel(def))}</strong><div class="conf-row-meta">${counts.comp?`<span class="support-ok">✓ ${counts.comp} complementar(es)</span>`:'0 complementares'} · ${counts.just?`<span class="support-ok">✓ ${counts.just} justificativa(s)</span>`:'0 justificativas'}</div></td><td>${fileCell(def,e,def.id,'pdf')}</td><td>${def.needsExcel?fileCell(def,e,def.id,'excel'):'<span class="conf-na">Não se aplica</span>'}</td><td>${checkCell('competencia',comp)}</td><td>${checkCell('ug',ug)}</td><td>${checkCell('emissao',em)}</td><td>${checkCell('dados',data)}</td><td>${badge(r.status,r.text)}</td><td><div class="actions"><button class="btn small" onclick="toggleConferenceDetail('${def.id}')">Detalhes</button><button class="btn small" onclick="focusConferenceReport('${def.id}')">Apoios</button><button class="btn small primary" onclick="openJustification('${def.id}')">Justificar</button></div></td></tr><tr id="conf-details-${def.id}" class="conf-detail-row"><td colspan="10"><div class="conf-detail-panel">${detailHtml(def,e)}<div class="actions" style="margin-top:10px"><button class="btn small" onclick="toggleManualConference('${def.id}')">${e.manualOk?'Remover OK manual':'Confirmar manualmente'}</button></div></div></td></tr>`}).join('');renderConferenceSidebar();if(window.applyTopScrollbars)window.applyTopScrollbars();store.closed=CONF_REPORTS.every(def=>overall(def,reportEntry(def.id)).status!=='pending');persist();if(typeof renderDashboard==='function')renderDashboard();if(store.analysisVersion!==ANALYSIS_VERSION&&!reanalysisLocks.has(confKey()))setTimeout(()=>reanalyzeCurrentConference(false),40)}
function fillConferenceUgs(){const sel=document.getElementById('conference-ug');if(!sel)return;const current=sel.value||document.getElementById('report-ug')?.value||state.ugs[0]?.id||'';sel.innerHTML=state.ugs.map(u=>`<option value="${u.id}">${esc(u.code+' - '+u.acronym)}</option>`).join('');if(state.ugs.some(u=>u.id===current))sel.value=current}
function fillFocusReports(){const sel=document.getElementById('conference-focus-report');if(!sel)return;const old=sel.value||'Geral';sel.innerHTML='<option value="Geral">Todos / Geral</option>'+CONF_REPORTS.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('');sel.value=[...sel.options].some(o=>o.value===old)?old:'Geral'}
window.syncConferenceTop=function(){const [y,m]=confRef().split('-');document.getElementById('global-year').value=y;document.getElementById('global-month').value=m;document.getElementById('report-ref').value=confRef();document.getElementById('report2-ref').value=confRef();document.getElementById('report3-ref').value=confRef();renderAll()};
window.changeConferenceFocus=()=>{renderConference();document.querySelector('.conf-sidebar')?.scrollIntoView({behavior:'smooth',block:'start'})};
window.focusConferenceReport=function(id){const sel=document.getElementById('conference-focus-report');if(sel)sel.value=id;renderConference();document.getElementById('conference-side-support')?.scrollIntoView({behavior:'smooth',block:'center'})};

function relatedId(x){if(x.relatedId)return x.relatedId;if(x.related==='Geral'||!x.related)return'Geral';return CONF_REPORTS.find(r=>r.label===x.related)?.id||'Geral'}
function complementBlobKey(id){return`complement|${id}`}
window.addComplementaryDocs=async function(input){const files=[...(input.files||[])];if(!files.length)return;const list=complementaryStore(),relatedIdValue=focusReport(),description=document.getElementById('complement-description-side')?.value.trim()||'';for(const f of files){const id=uid('comp');list.push({id,name:f.name,size:f.size,type:f.type||'',relatedId:relatedIdValue,description,addedAt:new Date().toISOString()});await putBlob(complementBlobKey(id),f)}if(document.getElementById('complement-description-side'))document.getElementById('complement-description-side').value='';input.value='';persist();renderConference();toast(`${files.length} documento(s) complementar(es) adicionado(s) a ${relatedIdValue==='Geral'?'Geral':reportLabel(relatedIdValue)}.`)};
window.removeComplementary=async function(id){const k=confKey();state.complementaryDocs[k]=(state.complementaryDocs[k]||[]).filter(x=>x.id!==id);await deleteBlob(complementBlobKey(id));persist();renderConference()};
window.viewComplementary=function(id,download=false){const x=complementaryStore().find(v=>v.id===id);if(x)openStoredBlob(complementBlobKey(id),x.name,download)};
function formatFileSize(n){if(!Number(n))return'';return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`}
function renderComplementary(){const box=document.getElementById('complementary-list-side');if(!box)return;const focus=focusReport(),all=complementaryStore(),list=focus==='Geral'?all:all.filter(x=>relatedId(x)===focus),count=document.getElementById('complement-count-side');if(count)count.textContent=String(list.length);box.innerHTML=list.slice().reverse().map(x=>`<div class="side-list-item"><div><strong>${esc(x.name)}</strong><span>${esc(relatedId(x)==='Geral'?'Geral':reportLabel(relatedId(x)))}${x.description?' · '+esc(x.description):''}${x.size?' · '+formatFileSize(x.size):''}</span></div><div class="side-item-actions"><button class="btn tiny" onclick="viewComplementary('${x.id}')">Ver</button><button class="btn tiny" onclick="viewComplementary('${x.id}',true)">Baixar</button><button class="btn tiny danger" onclick="removeComplementary('${x.id}')">Excluir</button></div></div>`).join('')||'<div class="side-empty">Nenhum documento complementar para esta seleção.</div>'}

function itemKeyForReport(id){const map={rel1:'REL1',rel2:'REL2',rel3:'REL3',rel4:'REL4',rel5:'REL5',rel6:'REL6',rel7:'REL7',rel8:'REL8',rel9:'REL9',rel10:'REL10',rel11:'REL11',balancete:'BALANCETE',fiscal:'FISCAL'};return map[id]||'OUTRO'}
function reportIdForItem(item){const map={REL1:'rel1',REL2:'rel2',REL3:'rel3',REL4:'rel4',REL5:'rel5',REL6:'rel6',REL7:'rel7',REL8:'rel8',REL9:'rel9',REL10:'rel10',REL11:'rel11',BALANCETE:'balancete',FISCAL:'fiscal'};return map[item]||'Geral'}
function dateLongPt(value){if(!value)return'';const d=new Date(value+'T12:00:00');return `${String(d.getDate()).padStart(2,'0')} de ${months[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`}
function setJustificationModal(record=null,reportId=''){const ug=selectedUg(),r=state.responsibles.find(x=>x.ugId===ug?.id),sel=document.getElementById('just-document');sel.innerHTML=JUSTIFICATION_ITEMS.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('');document.getElementById('just-edit-id').value=record?.id||'';sel.value=record?.item||itemKeyForReport(reportId||focusReport());document.getElementById('just-ug').value=ug?`${ug.code} - ${ug.name}`:'';document.getElementById('just-reference').value=record?.reference||formatRef(confRef());document.getElementById('just-date').value=record?.date||new Date().toISOString().slice(0,10);document.getElementById('just-location').value=record?.location||'Fortaleza-CE';document.getElementById('just-text').value=record?.text||'';document.getElementById('just-person-warning').style.display=r?'none':'block';document.getElementById('justification-modal').classList.add('open')}
window.openJustification=(reportId='')=>setJustificationModal(null,reportId);
window.editJustification=function(id){const x=justificationList().find(v=>v.id===id);if(x)setJustificationModal(x,reportIdForItem(x.item))};
function justificationData(requireText=true){const ug=selectedUg(),r=state.responsibles.find(x=>x.ugId===ug?.id),text=document.getElementById('just-text').value.trim();if(!r){toast('Cadastre a pessoa responsável dentro da UG.');return null}if(requireText&&!text){toast('Preencha o texto da justificativa.');return null}return{id:document.getElementById('just-edit-id').value||'',item:document.getElementById('just-document').value,reference:formatRef(confRef()),ug,person:r,text,location:document.getElementById('just-location').value.trim()||'Fortaleza-CE',date:document.getElementById('just-date').value,dateLong:dateLongPt(document.getElementById('just-date').value)}}
function saveJustificationData(d){const list=justificationList(),id=d.id||uid('just'),record={id,item:d.item,reference:d.reference,text:d.text,location:d.location,date:d.date,dateLong:d.dateLong,ugId:d.ug.id,updatedAt:new Date().toISOString(),createdAt:list.find(x=>x.id===id)?.createdAt||new Date().toISOString()},idx=list.findIndex(x=>x.id===id);if(idx>=0)list[idx]=record;else list.push(record);document.getElementById('just-edit-id').value=id;persist();renderConference();return record}
function justificationFilename(ext){return `Anexo VI - Termo de Justificativa para as Inconformidades.${ext}`}
function normalizeJustificationItem(value){
 const raw=String(value??'').trim();
 if(JUSTIFICATION_ITEMS.some(([k])=>k===raw))return raw;
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase();
 const target=norm(raw);
 const exact=JUSTIFICATION_ITEMS.find(([,label])=>norm(label)===target);
 if(exact)return exact[0];
 const partial=JUSTIFICATION_ITEMS.find(([,label])=>{const n=norm(label);return target&&((target.length>8&&n.includes(target))||(n.length>8&&target.includes(n)))});
 return partial?partial[0]:raw;
}
function dataFromRecord(x){const ug=state.ugs.find(u=>u.id===x.ugId)||selectedUg(),person=state.responsibles.find(r=>r.ugId===ug?.id);if(!ug||!person)return null;return{id:x.id,item:normalizeJustificationItem(x.item),reference:x.reference,ug,person,text:x.text,location:x.location,date:x.date,dateLong:x.dateLong||dateLongPt(x.date)}}
async function buildJustificationWordBytes(d){
 const zip=await JSZip.loadAsync(window.TRANCILIM_JUSTIFICATION_TEMPLATE,{base64:true});
 let xml=await zip.file('word/document.xml').async('string');
 const wordXml=v=>xmlEsc(String(v??'')).replace(/\r?\n/g,'</w:t><w:br/><w:t>');
 const vals={
  '{{REFERENCE}}':d.reference,
  '{{PERSON_NAME}}':d.person.name,
  '{{PERSON_ROLE}}':d.person.role,
  '{{REGISTRATION}}':d.person.registration,
  '{{CPF}}':d.person.cpf,
  '{{UG_BLOCK}}':`${d.ug.code} – ${d.ug.name}`,
  '{{JUSTIFICATION}}':d.text,
  '{{LOCATION}}':d.location,
  '{{DATE_LONG}}':d.dateLong,
  '{{SIGNATURE_ROLE}}':d.person.signatureRole
 };
 const selectedItem=normalizeJustificationItem(d.item);
 for(const [k,labelRaw] of JUSTIFICATION_ITEMS){
  const label=String(labelRaw).replace(' - ',' – ').replace(/DEA's/g,'DEA’s');
  const selected=k===selectedItem;
  vals['{{MARK_'+k+'}}']=selected?'X':'';
  vals['{{NORMAL_'+k+'}}']=selected?'':label;
  vals['{{SELECTED_'+k+'}}']=selected?label:'';
 }
 for(const [k,v] of Object.entries(vals))xml=xml.split(k).join(wordXml(v));
 zip.file('word/document.xml',xml);
 return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6},mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
window.exportJustificationWord=async function(){const d=justificationData();if(!d)return;try{const bytes=await buildJustificationWordBytes(d);downloadBytes(bytes,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',justificationFilename('docx'));saveJustificationData(d);toast('Word da justificativa gerado.')}catch(err){toast(err.message||'Não foi possível gerar o Word.')}};
function makePdf(objects,catalog,pagesObj){const parts=[new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n')],offset=[0];let len=parts[0].length;for(let n=1;n<objects.length;n++){offset[n]=len;const o=objects[n],head=new TextEncoder().encode(`${n} 0 obj\n`),tail=new TextEncoder().encode('\nendobj\n');parts.push(head);len+=head.length;if(typeof o==='string'){const b=new Uint8Array(cp1252(o));parts.push(b);len+=b.length}else{const h=new Uint8Array(cp1252(o.dict+'\nstream\n'));parts.push(h,o.data,new TextEncoder().encode('\nendstream'));len+=h.length+o.data.length+10}parts.push(tail);len+=tail.length}const xref=len;let xs=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let n=1;n<objects.length;n++)xs+=String(offset[n]).padStart(10,'0')+' 00000 n \n';xs+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(new Uint8Array(cp1252(xs)));const total=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let p=0;for(const b of parts){out.set(b,p);p+=b.length}return out}
function buildJustificationPdfBytes(d){
 const W=595.28,H=841.89,img=b64ToBytes(TRANCILIM_ASSETS.logoJpeg),objects=[null],add=o=>(objects.push(o),objects.length-1),catalog=add(''),pagesObj=add(''),fontR=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>'),fontB=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>'),imgObj=add({dict:`<< /Type /XObject /Subtype /Image /Width ${TRANCILIM_ASSETS.logoWidth} /Height ${TRANCILIM_ASSETS.logoHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>`,data:img});
 let c='0 G 0 g\n';
 // pdfTextWidth converte px para pontos. O fator abaixo recompõe a largura real usada pelo Times no PDF.
 const measure=(v,size,bold=false)=>pdfTextWidth(String(v??''),size,bold)*(4/3);
 const text=(v,x,y,size,bold=false,align='left')=>{v=String(v??'');const w=measure(v,size,bold);if(align==='center')x-=w/2;else if(align==='right')x-=w;c+=`BT /${bold?'FB':'FR'} ${Number(size).toFixed(2)} Tf 1 0 0 1 ${Number(x).toFixed(2)} ${Number(y).toFixed(2)} Tm (${pdfStr(v)}) Tj ET\n`};
 const wrapWords=(value,max,size,bold=false)=>{const words=String(value??'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(line&&measure(candidate,size,bold)>max){lines.push(line);line=word}else line=candidate}if(line)lines.push(line);return lines.length?lines:['']};
 const wrapParagraphs=(value,max,size)=>{const out=[];const paragraphs=String(value??'').split(/\r?\n/);paragraphs.forEach((para,pi)=>{const lines=wrapWords(para,max,size,false);lines.forEach((line,i)=>out.push({line,last:i===lines.length-1}));if(pi<paragraphs.length-1)out.push({line:'',last:true})});return out};
 const drawParagraph=(value,x,y,max,size,lh)=>{const lines=wrapParagraphs(value,max,size);lines.forEach((ln,i)=>text(ln.line,x,y-i*lh,size,false));return lines.length};
 const wrapRuns=(runs,max,size)=>{const tokens=[];for(const run of runs){const words=String(run.text??'').trim().split(/\s+/).filter(Boolean);for(const word of words)tokens.push({word,bold:!!run.bold})}const lines=[];let current=[],width=0;const space=measure(' ',size,false);for(const token of tokens){const ww=measure(token.word,size,token.bold);if(current.length&&width+space+ww>max){lines.push(current);current=[];width=0}if(current.length)width+=space;current.push(token);width+=ww}if(current.length)lines.push(current);return lines};
 const drawRuns=(runs,x,y,max,size,lh)=>{const lines=wrapRuns(runs,max,size),space=measure(' ',size,false);lines.forEach((line,i)=>{let px=x;line.forEach((token,j)=>{text(token.word,px,y-i*lh,size,token.bold);px+=measure(token.word,size,token.bold)+(j<line.length-1?space:0)})});return lines.length};
 const selectedItem=normalizeJustificationItem(d.item);
 c+=`q 102 0 0 63 ${((W-102)/2).toFixed(2)} 754 cm /Im1 Do Q\n`;
 text('Anexo VI da IN nº 47/2025',W/2,731,12,true,'center');
 text('Termo de Justificativa para as Inconformidades',W/2,704,11,false,'center');
 text('Referência: '+d.reference,W/2,688,11,false,'center');
 let y=682,x=64,rowH=12.4,w0=18,w1=449;c+='0.65 w\n';
 for(const [key,labelRaw] of JUSTIFICATION_ITEMS){
  const label=String(labelRaw).replace(' - ',' – ').replace(/DEA's/g,'DEA’s'),selected=key===selectedItem;
  c+=`${x.toFixed(2)} ${(y-rowH).toFixed(2)} ${w0.toFixed(2)} ${rowH.toFixed(2)} re S\n${(x+w0).toFixed(2)} ${(y-rowH).toFixed(2)} ${w1.toFixed(2)} ${rowH.toFixed(2)} re S\n`;
  if(selected)text('X',x+w0/2,y-9.1,8.2,true,'center');
  text(label,x+w0+3.5,y-9.1,8.15,selected);
  y-=rowH;
 }
 text('Obs.: Marcar com “X” uma única opção em cada termo de justificativa.',x,y-10.5,8.5);
 const personRuns=[{text:'Eu,'},{text:d.person.name+',',bold:true},{text:d.person.role+','},{text:d.person.registration+',',bold:true},{text:'CPF'},{text:d.person.cpf+',',bold:true},{text:'lotado(a) na UG'},{text:d.ug.code+' – '+d.ug.name+',',bold:true},{text:'apresento para os devidos fins a(s) justificativa(s) para a(s) inconformidade(s) constatada(s) no documento marcado acima.'}];
 const personY=y-30,personLines=drawRuns(personRuns,x,personY,467,9.4,11.2);
 let justFont=9.2,justLh=10.8,justLines=wrapParagraphs(d.text,459,justFont);
 while(justLines.length>10&&justFont>7.8){justFont-=.2;justLh=justFont+1.4;justLines=wrapParagraphs(d.text,459,justFont)}
 const boxTop=personY-personLines*11.2-8,boxH=Math.max(66,justLines.length*justLh+21);
 c+=`${x.toFixed(2)} ${(boxTop-boxH).toFixed(2)} 467.00 ${boxH.toFixed(2)} re S\n`;
 text('Justificativa(s) para a(s) Inconformidade(s) Constatada(s):',W/2,boxTop-10.5,8.5,false,'center');
 drawParagraph(d.text,x+5,boxTop-23,457,justFont,justLh);
 const dateY=boxTop-boxH-14;
 text(`${d.location}, ${d.dateLong}.`,x,dateY,9.8);
 text(d.person.name,W/2,dateY-29,10.5,true,'center');
 text(d.person.signatureRole,W/2,dateY-43,10.5,true,'center');
 const contentBytes=new Uint8Array(cp1252(c)),content=add({dict:`<< /Length ${contentBytes.length} >>`,data:contentBytes}),page=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${fontR} 0 R /FB ${fontB} 0 R >> /XObject << /Im1 ${imgObj} 0 R >> >> /Contents ${content} 0 R >>`);objects[catalog]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;objects[pagesObj]=`<< /Type /Pages /Count 1 /Kids [${page} 0 R] >>`;return makePdf(objects,catalog,pagesObj)
}

window.exportJustificationPdf=function(){const d=justificationData();if(!d)return;downloadBytes(buildJustificationPdfBytes(d),'application/pdf',justificationFilename('pdf'));saveJustificationData(d);toast('PDF da justificativa gerado.')};
window.downloadSavedJustificationPdf=function(id){const x=justificationList().find(v=>v.id===id),d=x&&dataFromRecord(x);if(!d)return toast('Pessoa responsável não cadastrada para esta UG.');downloadBytes(buildJustificationPdfBytes(d),'application/pdf',justificationFilename('pdf'))};
window.downloadSavedJustificationWord=async function(id){const x=justificationList().find(v=>v.id===id),d=x&&dataFromRecord(x);if(!d)return toast('Pessoa responsável não cadastrada para esta UG.');try{downloadBytes(await buildJustificationWordBytes(d),'application/vnd.openxmlformats-officedocument.wordprocessingml.document',justificationFilename('docx'))}catch(err){toast(err.message||'Não foi possível gerar o Word.')}};
window.viewJustification=function(id){const x=justificationList().find(v=>v.id===id),ug=state.ugs.find(u=>u.id===x?.ugId),person=state.responsibles.find(r=>r.ugId===ug?.id);if(!x)return;document.getElementById('just-view-title').textContent=JUSTIFICATION_ITEMS.find(i=>i[0]===x.item)?.[1]||x.item;document.getElementById('just-view-meta').textContent=`Referência ${x.reference} · ${ug?.code||''} - ${ug?.acronym||''} · ${x.location}, ${x.dateLong}`;document.getElementById('just-view-text').textContent=x.text;document.getElementById('just-view-sign').innerHTML=`<strong>${esc(person?.name||'Pessoa responsável não cadastrada')}</strong><span>${esc(person?.signatureRole||'')}</span>`;document.getElementById('justification-view-modal').classList.add('open')};
function renderSavedJustifications(){const box=document.getElementById('saved-justifications-side');if(!box)return;const focus=focusReport(),all=justificationList(),list=focus==='Geral'?all:all.filter(x=>reportIdForItem(x.item)===focus),count=document.getElementById('justification-count-side');if(count)count.textContent=String(list.length);box.innerHTML=list.slice().reverse().map(x=>{const label=JUSTIFICATION_ITEMS.find(i=>i[0]===x.item)?.[1]||x.item;return `<div class="side-list-item"><div><strong>${esc(label)}</strong><span>${esc(x.reference)} · ${esc(x.dateLong)}${x.text?' · '+esc(x.text.slice(0,70))+(x.text.length>70?'…':''):''}</span></div><div class="side-item-actions"><button class="btn tiny" onclick="viewJustification('${x.id}')">Ver</button><button class="btn tiny" onclick="editJustification('${x.id}')">Editar</button><button class="btn tiny" onclick="downloadSavedJustificationWord('${x.id}')">Word</button><button class="btn tiny" onclick="downloadSavedJustificationPdf('${x.id}')">PDF</button><button class="btn tiny danger" onclick="deleteJustification('${x.id}')">Excluir</button></div></div>`}).join('')||'<div class="side-empty">Nenhuma justificativa para esta seleção.</div>'}
window.deleteJustification=function(id){const k=justificationKey();state.justifications[k]=(state.justifications[k]||[]).filter(x=>x.id!==id);persist();renderConference()};
function renderConferenceSidebar(){renderComplementary();renderSavedJustifications();const focus=focusReport(),label=document.getElementById('conference-side-focus-label');if(label)label.textContent=focus==='Geral'?'Todos / Geral':reportLabel(focus);const newBtn=document.getElementById('side-new-justification');if(newBtn)newBtn.onclick=()=>openJustification(focus==='Geral'?'':focus)}

window.renderConference=renderConference;
const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();fillConferenceUgs();fillFocusReports();renderConference()};
const baseSyncReference=syncReference;syncReference=function(){baseSyncReference();const ref=document.getElementById('global-year').value+'-'+document.getElementById('global-month').value;if(document.getElementById('conference-ref'))document.getElementById('conference-ref').value=ref;renderConference()};
const baseSync1=syncTopFromReport;syncTopFromReport=function(){baseSync1();if(document.getElementById('conference-ref'))document.getElementById('conference-ref').value=document.getElementById('report-ref').value;renderConference()};
const baseSync2=syncTopFromReport2;syncTopFromReport2=function(){baseSync2();if(document.getElementById('conference-ref'))document.getElementById('conference-ref').value=document.getElementById('report2-ref').value;renderConference()};
const baseSync3=syncTopFromReport3;syncTopFromReport3=function(){baseSync3();if(document.getElementById('conference-ref'))document.getElementById('conference-ref').value=document.getElementById('report3-ref').value;renderConference()};

fillConferenceUgs();fillFocusReports();
const initialRef=document.getElementById('report-ref')?.value||'2026-06';document.getElementById('conference-ref').value=initialRef;
renderConference();
})();
