// Offline PDF writer: embedded TrueType, selectable Unicode text, A4 pages.
export const SITE_URL='https://hleserg.github.io/belbin-test/';
export function createReportPdf(text,font){
 const enc=new TextEncoder(),objects=[null],used=new Map();
 const add=value=>(objects.push(value),objects.length-1);
 const bytes=s=>enc.encode(s);
 const concat=parts=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
 const stream=(data,extra='')=>concat([bytes(`<< /Length ${data.length} ${extra} >>\nstream\n`),data,bytes('\nendstream')]);
 const info=char=>font.chars[char.codePointAt(0)]||font.chars[63];
 const width=(s,size)=>Array.from(s).reduce((n,c)=>n+info(c)[1]*size/1000,0);
 const hex=s=>Array.from(s).map(c=>{const cp=c.codePointAt(0),key=font.chars[cp]?cp:63;if(!used.has(key))used.set(key,used.size+1);return used.get(key).toString(16).padStart(4,'0');}).join('');
 const utf16=cp=>cp<=65535?cp.toString(16).padStart(4,'0'):[0xd800+((cp-65536)>>10),0xdc00+((cp-65536)&1023)].map(n=>n.toString(16)).join('');
 const catalog=add(''),pagesId=add(''),fontId=add('');
 const rows=[];
 for(const [index,line] of text.replace(/\r\n?/g,'\n').split('\n').entries()){
  const size=index===0?19:10.5;let row='';
  for(const word of line.split(/(\s+)/)){
   if(row&&width(row+word,size)>499){rows.push({text:row.trimEnd(),size});row='';}
   for(const c of word){if(row&&width(row+c,size)>499){rows.push({text:row,size});row='';}row+=c;}
  }
  rows.push({text:row.trimEnd(),size});
 }
 const chunks=[];let chunk=[],height=0;
 for(const row of rows){const h=row.size===19?34:16;if(height+h>700){chunks.push(chunk);chunk=[];height=0;}chunk.push(row);height+=h;}
 if(chunk.length)chunks.push(chunk);
 const pageIds=[];
 const draw=(s,x,y,size,color='0.10 0.20 0.17')=>`BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm <${hex(s)}> Tj ET\n`;
 chunks.forEach((lines,index)=>{
  let y=790,content='';for(const row of lines){content+=draw(row.text,48,y,row.size);y-=row.size===19?34:16;}
  content+='0.75 0.82 0.77 RG 48 65 m 547 65 l S\n';
  content+=draw('Пройти тест: '+SITE_URL,48,47,8.5);
  content+=draw(`${index+1} / ${chunks.length}`,510,30,8);
  const link=add(`<< /Type /Annot /Subtype /Link /Rect [48 42 455 60] /Border [0 0 0] /A << /S /URI /URI (${SITE_URL}) >> >>`);
  const contentId=add(stream(bytes(content)));
  pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R /Annots [${link} 0 R] >>`));
 });
 const fontBytes=Uint8Array.from(atob(font.base64),c=>c.charCodeAt(0));
 const fileId=add(stream(fontBytes,`/Length1 ${fontBytes.length}`));
 const descriptor=add(`<< /Type /FontDescriptor /FontName /DejaVuSans /Flags 32 /FontBBox [-1100 -500 2200 1300] /ItalicAngle 0 /Ascent 928 /Descent -236 /CapHeight 729 /StemV 80 /FontFile2 ${fileId} 0 R >>`);
 const gidMap=new Uint8Array((used.size+1)*2);const widths=[];const mappings=[];
 for(const [cp,cid] of used){const [gid,w]=font.chars[cp];gidMap[cid*2]=gid>>8;gidMap[cid*2+1]=gid&255;widths.push(`${cid} [${w}]`);mappings.push(`<${cid.toString(16).padStart(4,'0')}> <${utf16(cp)}>`);}
 const gidId=add(stream(gidMap));
 let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /BelbinUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <ffff>\nendcodespacerange\n';
 for(let i=0;i<mappings.length;i+=100){const batch=mappings.slice(i,i+100);cmap+=`${batch.length} beginbfchar\n${batch.join('\n')}\nendbfchar\n`;}
 cmap+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
 const unicode=add(stream(bytes(cmap)));
 const descendant=add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /DejaVuSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /W [${widths.join(' ')}] /CIDToGIDMap ${gidId} 0 R >>`);
 objects[fontId]=`<< /Type /Font /Subtype /Type0 /BaseFont /DejaVuSans /Encoding /Identity-H /DescendantFonts [${descendant} 0 R] /ToUnicode ${unicode} 0 R >>`;
 objects[catalog]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
 objects[pagesId]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`;
 const parts=[bytes('%PDF-1.4\n')],offsets=[0];let offset=parts[0].length;
 for(let i=1;i<objects.length;i++){offsets[i]=offset;const body=objects[i] instanceof Uint8Array?objects[i]:bytes(objects[i]);const part=concat([bytes(`${i} 0 obj\n`),body,bytes('\nendobj\n')]);parts.push(part);offset+=part.length;}
 parts.push(bytes(`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${offset}\n%%EOF\n`));
 return concat(parts);
}
