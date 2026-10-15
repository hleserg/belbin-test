import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,'src',name),'utf8');
const data=JSON.parse(read('data.json'));delete data.fixture;
let page=read('page.html').replace('/* STYLES */',()=>read('style.css')+'\n@font-face{font-family:BelbinReport;src:url(data:font/ttf;base64,'+JSON.parse(read('pdf-font.json')).base64+') format("truetype");font-weight:400;font-style:normal}').replace('/* DATA */',()=>JSON.stringify(data).replace(/</g,'\\u003c')).replace('/* CORE */',()=>read('core.js').replace(/^export /gm,'')).replace('/* SHARE */',()=>read('share.js').replace(/^export /gm,'')).replace('/* FONT */',()=>read('pdf-font.json')).replace('/* PDF */',()=>read('pdf.js').replace(/^export /gm,'')).replace('/* APP */',()=>read('app.js'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist','index.html'),page);
fs.writeFileSync(path.join(root,'dist','.nojekyll'),'');
console.log(`Built dist/index.html (${Buffer.byteLength(page)} bytes); no network dependencies.`);

fs.writeFileSync(path.join(root,'index.html'),page);
fs.writeFileSync(path.join(root,'.nojekyll'),'');
