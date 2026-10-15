import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const corePath = new URL('../src/core.js', import.meta.url);
test('Модуль расчёта существует', () => assert.ok(fs.existsSync(corePath)));
if (fs.existsSync(corePath)) {
const {validValue, validBlock, score, extremes, restore} = await import(corePath);
const data = JSON.parse(fs.readFileSync(new URL('../src/data.json',import.meta.url)));
test('Допустимы только 0 и целые 2–10',()=>{
 for(const v of [0,2,3,4,5,6,7,8,9,10]) assert.equal(validValue(v),true);
 for(const v of [1,-1,11,2.5,NaN,Infinity,null,'2',undefined]) assert.equal(validValue(v),false);
});
test('Блок завершён только при 8 допустимых оценках суммой 10',()=>{
 assert.equal(validBlock([6,2,2,0,0,0,0,0]),true);
 for(const b of [[8,0,0,0,0,0,0,0],[8,1,1,0,0,0,0,0],[10,2,0,0,0,0,0,0],[10],null]) assert.equal(validBlock(b),false);
});
test('Контрольные заполненные ответы Excel дают исходный итог',()=>{
 assert.deepEqual(score(data.fixture.answers,data.key),[14,0,10,7,4,6,18,11]);
});
test('Каждое из 56 утверждений поступает в правильную роль',()=>{
 for(let b=0;b<7;b++)for(let q=0;q<8;q++){
  const answers=Array.from({length:7},()=>Array(8).fill(0));answers[b][q]=10;
  const s=score(answers,data.key);const role=data.key[b].indexOf((b+1)*10+q);
  assert.equal(s[role],10);assert.equal(s.reduce((a,v)=>a+v,0),10);
 }
});
test('Равенства на границе тройки не разрываются произвольно',()=>{
 assert.deepEqual(extremes([20,15,10,10,6,4,3,2]).high,[0,1,2,3]);
 assert.deepEqual(extremes([20,15,10,9,4,4,4,4]).low,[4,5,6,7]);
 assert.equal(extremes(Array(8).fill(0)).high.length,8);
});
test('Восстановление сохраняет незавершённый прогресс и комментарии',()=>{
 const state={version:1,answers:Array.from({length:7},()=>Array(8).fill(0)),comments:Array(8).fill(''),step:3};
 state.answers[3][2]=4; state.comments[0]='Мой комментарий';
 assert.deepEqual(restore(JSON.stringify(state)),state);
 for(const raw of ['broken','null','{}',JSON.stringify({...state,version:2}),JSON.stringify({...state,step:12}),JSON.stringify({...state,answers:[[1]]})]) assert.equal(restore(raw),null);
 const unsafe=structuredClone(state);unsafe.answers[0][0]=1;assert.equal(restore(JSON.stringify(unsafe)),null);
});
}
