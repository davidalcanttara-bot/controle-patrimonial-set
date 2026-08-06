(function(){
  'use strict';

  const buildAnterior = window.buildAnexo3PdfBytes;

  function montarPdfFerdtZerado(account){
    const ref = document.getElementById('report3-ref')?.value || '2026-07';
    const tpl = window.TRANCILIM_A3_PDF_TEMPLATES?.[account]?.current
      || window.TRANCILIM_ANEXO3_FERDT_ASSETS?.template;
    if(!tpl) throw new Error('Modelo oficial do PDF do FERDT não encontrado.');

    const W=595.32,H=841.92,objects=[null];
    const add=o=>(objects.push(o),objects.length-1);
    const catalog=add(''),pagesObj=add('');
    const fontR=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
    const img=b64ToBytes(tpl.jpeg);
    const imgObj=add({dict:`<< /Type /XObject /Subtype /Image /Width ${tpl.iw} /Height ${tpl.ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>`,data:img});

    let c=`q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /BG Do Q\n`;
    const textWidth=(v,size)=>pdfTextWidth(String(v??''),size,false);
    const white=(x0,top,x1,bottom)=>{
      c+=`1 1 1 rg ${x0.toFixed(2)} ${(H-bottom).toFixed(2)} ${(x1-x0).toFixed(2)} ${(bottom-top).toFixed(2)} re f 0 g\n`;
    };
    const textRight=(v,right,baselineTop,size)=>{
      const x=right-textWidth(v,size);
      c+=`BT /FR ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${(H-baselineTop).toFixed(2)} Tm (${pdfStr(v)}) Tj ET\n`;
    };

    // O modelo oficial já contém todos os R$ 0,00. Para o FERDT zerado,
    // altera somente a competência e a data final do mês, sem redesenhar valores.
    if(ref!=='2026-06'){
      const rb=tpl.refbox;
      white(rb[0]-1.0,rb[1]-1.0,rb[2]+1.0,rb[3]+1.0);
      textRight(formatRef(ref),rb[2],rb[3]-1.74,8.40);

      const db=tpl.datebox;
      white(db[0]-1.0,db[1]-1.0,db[2]+1.0,db[3]+1.0);
      textRight(a3EndDate(ref),db[2],db[3]-1.03,5.55);
    }

    const contentBytes=new Uint8Array(cp1252(c));
    const content=add({dict:`<< /Length ${contentBytes.length} >>`,data:contentBytes});
    const page=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${fontR} 0 R >> /XObject << /BG ${imgObj} 0 R >> >> /Contents ${content} 0 R >>`);
    objects[catalog]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
    objects[pagesObj]=`<< /Type /Pages /Count 1 /Kids [${page} 0 R] >>`;

    const parts=[new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n')],offset=[0];
    let len=parts[0].length;
    for(let n=1;n<objects.length;n++){
      offset[n]=len;
      const o=objects[n],head=new TextEncoder().encode(`${n} 0 obj\n`),tail=new TextEncoder().encode('\nendobj\n');
      parts.push(head);len+=head.length;
      if(typeof o==='string'){
        const b=new Uint8Array(cp1252(o));parts.push(b);len+=b.length;
      }else{
        const h=new Uint8Array(cp1252(o.dict+'\nstream\n'));
        const end=new TextEncoder().encode('\nendstream');
        parts.push(h,o.data,end);len+=h.length+o.data.length+end.length;
      }
      parts.push(tail);len+=tail.length;
    }
    const xref=len;
    let xs=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for(let n=1;n<objects.length;n++) xs+=String(offset[n]).padStart(10,'0')+' 00000 n \n';
    xs+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    parts.push(new Uint8Array(cp1252(xs)));

    const total=parts.reduce((sum,b)=>sum+b.length,0),out=new Uint8Array(total);
    let pos=0;for(const b of parts){out.set(b,pos);pos+=b.length;}
    return out;
  }

  window.buildAnexo3PdfBytes=function(account){
    const ugId=document.getElementById('report3-ug')?.value;
    if(ugId==='ug-ferdt') return montarPdfFerdtZerado(account);
    return buildAnterior(account);
  };
  buildAnexo3PdfBytes=window.buildAnexo3PdfBytes;
})();
