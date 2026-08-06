(function(){
'use strict';
const SET_ID='ug-set';
const SET_ACCOUNT='SET-TESOURO-SEFAZ';
const isSetSelected=()=>document.getElementById('report3-ug')?.value===SET_ID;

const baseReport3Rows=window.report3Rows||report3Rows;
window.report3Rows=function(){
 if(isSetSelected())return [{account:SET_ACCOUNT,current:false,investment:false,pdf:true,accountingCurrent:0,accountingInvestment:0,setTreasury:true}];
 return baseReport3Rows();
};
report3Rows=window.report3Rows;

function buildSetPdf(){
 const asset=window.TRANCELIM_ANEXO3_SET_ASSETS;
 if(!asset?.jpeg)throw new Error('Modelo oficial do Anexo III da SET não encontrado.');
 const ref=document.getElementById('report3-ref')?.value||'2026-07';
 const W=595.32,H=841.92,objects=[null],add=o=>(objects.push(o),objects.length-1),catalog=add(''),pagesObj=add('');
 const fontR=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
 const fontB=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
 const img=b64ToBytes(asset.jpeg),imgObj=add({dict:`<< /Type /XObject /Subtype /Image /Width ${asset.iw} /Height ${asset.ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>`,data:img});
 let c=`q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /BG Do Q\n`;
 const whiteTop=(x0,top,x1,bottom)=>{const y=H-bottom;c+=`1 1 1 rg ${x0.toFixed(2)} ${y.toFixed(2)} ${(x1-x0).toFixed(2)} ${(bottom-top).toFixed(2)} re f 0 g\n`};
 const textWidth=(v,size,bold=false)=>pdfTextWidth(String(v??''),size,bold);
 const textTop=(v,x,baselineTop,size,bold=false,align='left')=>{v=String(v??'');let tx=x,w=textWidth(v,size,bold);if(align==='center')tx-=w/2;else if(align==='right')tx-=w;c+=`0 g BT /${bold?'FB':'FR'} ${size.toFixed(2)} Tf 1 0 0 1 ${tx.toFixed(2)} ${(H-baselineTop).toFixed(2)} Tm (${pdfStr(v)}) Tj ET\n`};
 if(ref!=='2026-06'){
   whiteTop(225.5,196.4,369.5,211.8);
   textTop('Referência: '+formatRef(ref),297.66,208.9,8.35,false,'center');
   whiteTop(110.2,281.2,253.0,291.1);
   textTop('SALDO DO EXTRATO BANCÁRIO EM '+a3EndDate(ref),112.1,289.25,5.15,false,'left');
 }
 const contentBytes=new Uint8Array(cp1252(c)),content=add({dict:`<< /Length ${contentBytes.length} >>`,data:contentBytes});
 const page=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${fontR} 0 R /FB ${fontB} 0 R >> /XObject << /BG ${imgObj} 0 R >> >> /Contents ${content} 0 R >>`);
 objects[catalog]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;objects[pagesObj]=`<< /Type /Pages /Count 1 /Kids [${page} 0 R] >>`;
 const parts=[new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n')],offset=[0];let len=parts[0].length;
 for(let n=1;n<objects.length;n++){offset[n]=len;const o=objects[n],head=new TextEncoder().encode(`${n} 0 obj\n`),tail=new TextEncoder().encode('\nendobj\n');parts.push(head);len+=head.length;if(typeof o==='string'){const b=new Uint8Array(cp1252(o));parts.push(b);len+=b.length}else{const h=new Uint8Array(cp1252(o.dict+'\nstream\n'));parts.push(h,o.data,new TextEncoder().encode('\nendstream'));len+=h.length+o.data.length+10}parts.push(tail);len+=tail.length}
 const xref=len;let xs=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let n=1;n<objects.length;n++)xs+=String(offset[n]).padStart(10,'0')+' 00000 n \n';xs+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(new Uint8Array(cp1252(xs)));
 const total=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let pos=0;for(const b of parts){out.set(b,pos);pos+=b.length}return out;
}

const baseBuildPdf=window.buildAnexo3PdfBytes||buildAnexo3PdfBytes;
window.buildAnexo3PdfBytes=function(account){
 if(isSetSelected()&&account===SET_ACCOUNT)return buildSetPdf();
 return baseBuildPdf(account);
};
buildAnexo3PdfBytes=window.buildAnexo3PdfBytes;

const baseBuildExcel=window.buildAnexo3ExcelBytes||buildAnexo3ExcelBytes;
window.buildAnexo3ExcelBytes=async function(){
 if(!isSetSelected())return baseBuildExcel();
 const asset=window.TRANCELIM_ANEXO3_SET_ASSETS;
 if(!asset?.xlsx)throw new Error('Modelo oficial do Excel do Anexo III da SET não encontrado.');
 const ref=document.getElementById('report3-ref')?.value||'2026-07';
 const zip=await JSZip.loadAsync(asset.xlsx,{base64:true}),reference='Referência: '+formatRef(ref),endLabel='SALDO DO EXTRATO BANCÁRIO EM '+a3EndDate(ref),month=a3MonthUpper(ref);
 for(const [name,entry] of Object.entries(zip.files)){if(entry.dir||!name.endsWith('.xml'))continue;let xml=await entry.async('string');xml=xml.replace(/Referência: 06\/2026/g,reference).replace(/SALDO DO EXTRATO BANCÁRIO EM 30\/06\/2026/g,endLabel).replace(/JUNHO/g,month);zip.file(name,xml)}
 zip.remove('xl/calcChain.xml');
 const rel=zip.file('xl/_rels/workbook.xml.rels');if(rel){let xml=await rel.async('string');xml=xml.replace(/<Relationship[^>]+relationships\/calcChain[^>]+\/>/g,'');zip.file('xl/_rels/workbook.xml.rels',xml)}
 const ct=zip.file('[Content_Types].xml');if(ct){let xml=await ct.async('string');xml=xml.replace(/<Override[^>]+calcChain[^>]+\/>/g,'');zip.file('[Content_Types].xml',xml)}
 return zip.generateAsync({type:'uint8array',compression:'STORE',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
};
buildAnexo3ExcelBytes=window.buildAnexo3ExcelBytes;

const baseDownloadPdf=window.downloadAnexo3Pdf||downloadAnexo3Pdf;
window.downloadAnexo3Pdf=function(account){
 if(!isSetSelected())return baseDownloadPdf(account);
 try{downloadBytes(buildSetPdf(),'application/pdf','Anexo III - Grade de Conciliação Bancária - SET.pdf');toast('PDF padrão da SET baixado.')}catch(err){toast(err.message||'Não foi possível gerar o PDF da SET.')}
};
downloadAnexo3Pdf=window.downloadAnexo3Pdf;

const baseDownloadZip=window.downloadAnexo3Zip||downloadAnexo3Zip;
window.downloadAnexo3Zip=async function(){
 if(!isSetSelected())return baseDownloadZip();
 const ref=document.getElementById('report3-ref')?.value||'2026-07';
 try{
  const out=new JSZip(),excel=await window.buildAnexo3ExcelBytes(),pdf=buildSetPdf();
  out.file('Anexo III - Grade de Conciliação Bancária.xlsx',excel,{binary:true,compression:'STORE'});
  out.file('Anexo III - Grade de Conciliação Bancária - SET.pdf',pdf,{binary:true,compression:'STORE'});
  const bytes=await out.generateAsync({type:'uint8array',compression:'STORE',mimeType:'application/zip'});
  downloadBytes(bytes,'application/zip',`Anexo III - SET - ${formatRef(ref).replace('/','-')}.zip`);
  toast('ZIP da SET gerado com o PDF e o Excel padrão.');
 }catch(err){toast(err.message||'Não foi possível gerar o ZIP da SET.')}
};
downloadAnexo3Zip=window.downloadAnexo3Zip;

const baseMetrics=window.anexo3DocumentMetrics||anexo3DocumentMetrics;
window.anexo3DocumentMetrics=function(ugId,ref){
 if(ugId===SET_ID){const key=`${ugId}|${ref}`,done=state.anexo3Closed?.[key]?1:0;return{total:1,done,accounts:0,accountingTotal:0,accountingDone:0,statementTotal:0,statementDone:0,closeDone:done}}
 return baseMetrics(ugId,ref);
};
anexo3DocumentMetrics=window.anexo3DocumentMetrics;

const baseRender=window.renderReport3||renderReport3;
window.renderReport3=function(){
 baseRender();
 const set=isSetSelected(),status=document.getElementById('a3-accounting-status'),box=status?.closest('.upload-box'),uploadBtn=box?.querySelector('button'),mini=box?.querySelector('.a3-mini'),demo=document.getElementById('a3-demo-note'),note=document.querySelector('#page-report3 .a3-note'),reportNote=document.querySelector('#page-report3 .report-note');
 if(uploadBtn)uploadBtn.style.display=set?'none':'';
 if(mini)mini.style.display=set?'none':'';
 if(set){
  if(status)status.innerHTML='<span class="file-ok">Não se aplica à SET.</span><span>As contas cadastradas pertencem ao Tesouro/SEFAZ. Não há relatório da contabilidade nem extratos bancários a anexar.</span>';
  if(demo){demo.style.display='block';demo.textContent='Para a UG SET, o Anexo III é sempre emitido no modelo padrão zerado, sem contas próprias, sem relatório contábil e sem extratos.'}
  if(note){if(!note.dataset.defaultText)note.dataset.defaultText=note.textContent;note.textContent='Documento padrão da SET, pois as contas utilizadas são do Tesouro/SEFAZ e não pertencem à Unidade Gestora.'}
  if(reportNote){if(!reportNote.dataset.defaultText)reportNote.dataset.defaultText=reportNote.textContent;reportNote.textContent='O ZIP da SET contém um PDF padrão de uma página e o Excel padrão, ambos zerados e com a referência selecionada.'}
  const row=document.querySelector('#a3-table-body tr');if(row){const strong=row.querySelector('.anexo3-account strong'),small=row.querySelector('.anexo3-account small'),cells=row.querySelectorAll('td');if(strong)strong.textContent='SET - Tesouro/SEFAZ';if(small)small.textContent='PDF padrão com 1 página';if(cells[6])cells[6].innerHTML='<span class="badge-ok">● Sem contabilidade e extratos</span>'}
  const labels=document.querySelectorAll('#page-report3 .anexo3-kpi small');if(labels[0])labels[0].textContent='Documento padrão';if(labels[1])labels[1].textContent='PDF individual';
 }else{
  if(note?.dataset.defaultText)note.textContent=note.dataset.defaultText;
  if(reportNote?.dataset.defaultText)reportNote.textContent=reportNote.dataset.defaultText;
  const labels=document.querySelectorAll('#page-report3 .anexo3-kpi small');if(labels[0])labels[0].textContent='Contas na grade';if(labels[1])labels[1].textContent='PDFs individuais';
 }
};
renderReport3=window.renderReport3;

if(document.getElementById('page-report3'))window.renderReport3();
})();
