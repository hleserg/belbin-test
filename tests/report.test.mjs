import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {layoutReport,reportPrintHtml,createReportPdf} from '../src/pdf.js';
import {sharePdfFile} from '../src/share.js';
const data=JSON.parse(fs.readFileSync('src/data.json'));
const font=JSON.parse(fs.readFileSync('src/pdf-font.json'));
const answers=Array.from({length:7},()=>[6,2,2,0,0,0,0,0]);
test('Full report preserves descriptions, comments, chart and calculation table in both formats',()=>{
 const comments=Array(8).fill('Это мой комментарий.');
 const layout=layoutReport(data,answers,comments,font);
 const text=layout.flat().filter(n=>n.type==='text'&&n.y!==812).map(n=>n.text).join(' ').replace(/\s+/g,' ');
 for(const r of data.roles)assert.ok(text.includes(r.description.replace(/\s+/g,' ')));
 assert.equal(text.match(/Это мой комментарий\./g).length,8);
 assert.ok(text.includes('Проверить расчёт по блокам'));
 assert.ok(layout.flat().filter(n=>n.type==='rect').length>=16);
 const html=reportPrintHtml(layout);assert.ok(html.includes('Это мой комментарий.'));
 const pdf=createReportPdf(layout,font);assert.ok(new TextDecoder().decode(pdf).startsWith('%PDF'));
 fs.mkdirSync('tmp/pdfs',{recursive:true});fs.writeFileSync('tmp/pdfs/full-report.pdf',pdf);
});
test('Long comments paginate within page bounds without dropping text',()=>{
 const layout=layoutReport(data,answers,Array(8).fill('я'.repeat(5000)),font);
 assert.equal(layout.flat().filter(n=>n.type==='text').map(n=>n.text).join('').split('я').length-1>=40000,true);
 assert.ok(layout.flat().every(n=>n.y>=24&&n.y<=812));
});
test('Direct file sharing does not invoke printing or download on cancellation',async()=>{
 const file=new File(['pdf'],'belbin-result.pdf',{type:'application/pdf'});let payload;
 assert.equal(await sharePdfFile(file,{canShare:()=>true,share:async p=>payload=p}),'shared');assert.equal(payload.files[0],file);
 assert.equal(await sharePdfFile(file,{canShare:()=>true,share:async()=>{throw {name:'AbortError'};}}),'cancelled');
 assert.equal(await sharePdfFile(file,{}),'unavailable');
});
