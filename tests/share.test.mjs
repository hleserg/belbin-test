import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareReport} from '../src/share.js';
test('Передаёт полный текст результата системному меню',async()=>{
 let received;const text='Дипломат: 18\nМой комментарий: это про меня';
 assert.equal(await shareReport(text,{share:async payload=>{received=payload;}}),'shared');
 assert.deepEqual(received,{title:'Тест Белбина — результаты',text});
});
test('Отмена отправки не запускает запасную отправку',async()=>{
 assert.equal(await shareReport('result',{share:async()=>{throw Object.assign(new Error(),{name:'AbortError'});}}),'cancelled');
});
test('Неподдерживаемые браузеры и ошибки возвращают явный статус',async()=>{
 assert.equal(await shareReport('result',{}),'unavailable');
 assert.equal(await shareReport('result',{share:async()=>{throw new Error('blocked');}}),'failed');
});
