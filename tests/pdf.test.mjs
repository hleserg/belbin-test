import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createReportPdf,SITE_URL} from '../src/pdf.js';
import {sharePdfFile} from '../src/share.js';
const font=JSON.parse(fs.readFileSync(new URL('../src/pdf-font.json',import.meta.url)));
test('PDF contains embedded Cyrillic font, Unicode map, pagination and site link',()=>{
 const bytes=createReportPdf('Тест Белбина — результаты\nДипломат: 18\n'+('Мой комментарий: Да, это про меня.\n'.repeat(300)),font);
 const pdf=new TextDecoder().decode(bytes);
 assert.ok(pdf.startsWith('%PDF-1.4'));
 assert.match(pdf,/\/FontFile2/);assert.match(pdf,/\/ToUnicode/);assert.match(pdf,/\/Count [2-9]/);
 assert.ok(pdf.includes('/URI ('+SITE_URL+')'));
 fs.mkdirSync('tmp/pdfs',{recursive:true});fs.writeFileSync('tmp/pdfs/report.pdf',bytes);
});
test('PDF sharing checks file support and preserves cancellation',async()=>{
 const file=new File(['pdf'],'result.pdf',{type:'application/pdf'});let received;
 assert.equal(await sharePdfFile(file,{canShare:p=>p.files[0]===file,share:async p=>received=p}),'shared');
 assert.equal(received.files[0],file);
 assert.equal(await sharePdfFile(file,{}),'unavailable');
 assert.equal(await sharePdfFile(file,{canShare:()=>false}),'unavailable');
 assert.equal(await sharePdfFile(file,{canShare:()=>true,share:async()=>{throw {name:'AbortError'};}}),'cancelled');
 assert.equal(await sharePdfFile(file,{canShare:()=>true,share:async()=>{throw new Error();}}),'failed');
});
