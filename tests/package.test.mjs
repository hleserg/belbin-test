import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validBlock,score,restore} from '../src/core.js';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const source=JSON.parse(fs.readFileSync(new URL('../src/data.json',import.meta.url),'utf8'));
const embedded=JSON.parse(html.match(/<script id="test-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
test('Все формулировки и описания включены в поставку без изменений',()=>{
 assert.deepEqual(embedded.blocks,source.blocks);assert.deepEqual(embedded.roles,source.roles);assert.equal(embedded.instruction,source.instruction);assert.deepEqual(embedded.key,source.key);
 assert.equal(embedded.fixture,undefined);
});
test('Собранный JavaScript синтаксически корректен',()=>{
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];assert.doesNotThrow(()=>new vm.Script(code));
});
test('Страница не зависит от внешних JS, CSS, шрифтов или картинок',()=>{
 assert.equal(/<script[^>]+src=|<link[^>]+href=|@import|url\(\s*https?:|fetch\(/i.test(html),false);
});
test('Полное прохождение с сохранением после каждого блока даёт 70 баллов',()=>{
 let state={version:1,answers:Array.from({length:7},()=>Array(8).fill(0)),comments:Array(8).fill(''),step:0};
 for(let i=0;i<7;i++){state.answers[i]=[6,2,2,0,0,0,0,0];state.step=i;state=restore(JSON.stringify(state));assert.equal(state.answers.filter(validBlock).length,i+1);}
 state.step=7;state.comments[1]='Да, это про меня';const loaded=restore(JSON.stringify(state));
 assert.equal(loaded.step,7);assert.equal(loaded.comments[1],state.comments[1]);assert.equal(score(loaded.answers,source.key).reduce((a,b)=>a+b,0),70);
 loaded.answers[0][0]=4;assert.equal(restore(JSON.stringify(loaded)).step,0);
});
test('Фиксированные граничные распределения сохраняют сумму в результатах',()=>{
 for(let shift=0;shift<8;shift++){
  const answers=Array.from({length:7},(_,b)=>Array.from({length:8},(_,q)=>q===(b+shift)%8?10:0));
  assert.equal(answers.every(validBlock),true);assert.equal(score(answers,source.key).reduce((a,b)=>a+b,0),70);
 }
});

test('Корневая страница для Pages совпадает с проверенной сборкой',()=>assert.equal(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),html));

test('Мобильная шапка сохраняет пробел, PDF и текст содержат ссылку на сайт',()=>{
 assert.ok(html.includes('Командные <br>роли'));
 assert.ok(html.includes('Поделиться как PDF'));
 assert.ok(html.includes("'Пройти тест: '+SITE_URL"));
 assert.ok(html.includes('class="small report-site"'));
 assert.ok(html.includes('aria-hidden="true" focusable="false"'));
});
