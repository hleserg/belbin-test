const buttonIcons={"share": "<path d=\"M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7\"/>", "pdf": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5\"/>", "copy": "<rect x=\"8\" y=\"8\" width=\"12\" height=\"13\" rx=\"2\"/><path d=\"M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4\"/>", "download": "<path d=\"M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5\"/>", "print": "<path d=\"M6 9V2h12v7M6 18H3V9h18v9h-3M6 14h12v8H6zM17 12h1\"/>", "edit": "<path d=\"m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z\"/>", "back": "<path d=\"M20 12H4m7-7-7 7 7 7\"/>", "next": "<path d=\"M4 12h16m-7-7 7 7-7 7\"/>", "reset": "<path d=\"M3 10a9 9 0 1 1 1 8M3 3v7h7\"/>"};
const icon=name=>`<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${buttonIcons[name]}</svg>`;
const data=JSON.parse(document.getElementById('test-data').textContent);
const storageKey='belbin-volunteer-v1';
const blank=()=>({version:1,answers:Array.from({length:7},()=>Array(8).fill(0)),comments:Array(8).fill(''),step:-1});
let state=blank(),storageAvailable=true;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(message){$('notice').textContent=message;$('notice').hidden=!message;}
try{const raw=localStorage.getItem(storageKey);if(raw){const loaded=restore(raw);if(loaded)state=loaded;else notice('Сохранённые ответы повреждены или относятся к другой версии. Они не загружены. Можно начать новое прохождение.');}}
catch{storageAvailable=false;notice('Браузер не разрешает сохранять прогресс. Тест работает, но при закрытии страницы ответы могут потеряться.');}
function persist(){
 try{localStorage.setItem(storageKey,JSON.stringify(state));storageAvailable=true;$('save-status').textContent='✓ Сохранено в этом браузере';}
 catch{storageAvailable=false;$('save-status').textContent='Прогресс не сохраняется';notice('Не удалось сохранить ответы. Не закрывайте страницу до завершения; готовый результат можно скачать.');}
}
const completed=()=>state.answers.filter(validBlock).length;
function chrome(){
 const count=completed();$('progress-label').textContent=`Пройдено ${count} из 7 · осталось ${7-count}`;$('progress-fill').style.width=`${count/7*100}%`;
 $('steps').innerHTML=`<button class="step" data-step="-1" ${state.step===-1?'aria-current="step"':''} aria-label="Инструкция"><span class="step-number" aria-hidden="true">i</span><span class="step-title">Инструкция</span></button>`+data.blocks.map((b,i)=>`<button class="step ${validBlock(state.answers[i])?'done':''}" data-step="${i}" ${state.step===i?'aria-current="step"':''} aria-label="Блок ${i+1}${validBlock(state.answers[i])?', завершён':''}"><span class="step-number" aria-hidden="true">${validBlock(state.answers[i])?'✓':i+1}</span><span class="step-title">Блок ${i+1}</span></button>`).join('')+`<button class="step" data-step="7" ${state.step===7?'aria-current="step"':''} ${count!==7?'disabled':''} aria-label="Результаты"><span class="step-number" aria-hidden="true">↗</span><span class="step-title">Результаты</span></button>`;
}
function go(step){if(step===7&&completed()!==7)return;state.step=step;persist();render();$('main').focus();window.scrollTo({top:0,behavior:'instant'});}
function intro(){
 $('main').innerHTML=`<p class="eyebrow">7 блоков · 56 утверждений · 8 ролей</p><h1 class="hero-title">Ваша роль<br>в общей работе.</h1><p class="lead">Тест Белбина на определение ключевых командных ролей</p><div class="intro-grid"><section class="panel"><h2>Инструкция</h2><p class="source-text">${esc(data.instruction)}</p><details><summary>Введение из исходного документа</summary><p>${esc(data.intro)}</p></details></section><section class="panel accent-panel"><p class="eyebrow">В каждом блоке</p><p class="big-number">10<span style="font:18px system-ui"> баллов</span></p><p class="source-text">Между этими 8 фразами нужно распределить 10 баллов.</p><p class="source-text">Нельзя 1 балл. 2-10 можно. Остальные не трогаете.</p><p class="small">Уточнение организатора. Незаполненное утверждение обозначается нулём. В каждом блоке сумма должна быть ровно 10.</p></section></div><div class="start-row"><button class="primary" id="start">${state.answers.some(b=>b.some(v=>v>0))?'Продолжить тест':'Начать тест'} ${icon('next')}</button><span class="small">Можно вернуться к любому блоку.<br>Прогресс сохраняется на этом устройстве.</span></div><p class="small source-note">Формулировки и описания — из предоставленного PDF. Подсчёт — по его таблице-ключу, сверенной с Excel. Сайт не отправляет ваши ответы другим людям.</p>`;
 $('start').onclick=()=>{const next=state.answers.findIndex(b=>!validBlock(b));go(next===-1?7:next);};
}
function allocation(){
 const sum=state.answers[state.step].reduce((s,v)=>s+v,0);const valid=validBlock(state.answers[state.step]);
 $('allocation').classList.toggle('invalid',sum>10);$('allocation-total').textContent=`${sum} / 10`;
 $('allocation-status').textContent=sum===10?'Все 10 баллов распределены':sum>10?`Уберите ${sum-10} балл(а), чтобы сумма была 10`:`Осталось распределить: ${10-sum}`;
 $('next').disabled=!valid;chrome();
}
function block(){
 const i=state.step,b=data.blocks[i];
 $('main').innerHTML=`<p class="eyebrow">Блок ${i+1} из 7</p><h1>${esc(b.title)}</h1><div class="allocation" id="allocation"><div><p id="allocation-status" role="status" aria-live="polite"></p><p>Допустимые баллы: 0 и 2–10. Один балл присваивать нельзя.</p></div><strong id="allocation-total" aria-label="Сумма баллов в блоке"></strong></div><div class="question-list">${b.questions.map((q,j)=>`<div class="question ${state.answers[i][j]?'selected':''}"><span class="question-id" aria-hidden="true">${q.id}.</span><label id="label-${q.id}" for="q-${q.id}">${esc(q.text)}</label><select id="q-${q.id}" data-question="${j}" aria-labelledby="label-${q.id}">${[0,2,3,4,5,6,7,8,9,10].map(v=>`<option value="${v}" ${state.answers[i][j]===v?'selected':''}>${v}</option>`).join('')}</select></div>`).join('')}</div><p class="block-hint">0 — оставить утверждение без баллов. Переход дальше доступен при сумме 10.</p><div class="block-nav"><button class="secondary" id="back">${icon('back')} ${i===0?'Инструкция':'Назад'}</button><button class="primary" id="next">${i===6?'Показать результаты':'Следующий блок'} ${icon('next')}</button></div>`;
 $('main').querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{state.answers[i][Number(el.dataset.question)]=Number(el.value);el.closest('.question').classList.toggle('selected',Number(el.value)>0);persist();allocation();}));
 $('back').onclick=()=>go(i-1);$('next').onclick=()=>{if(validBlock(state.answers[i])){if(i===6&&completed()!==7)go(state.answers.findIndex(b=>!validBlock(b)));else go(i+1);}};allocation();
}
function reportText(){
 const scores=score(state.answers,data.key),{high,low}=extremes(scores);
 const list=indices=>indices.map(i=>`${data.roles[i].name}: ${scores[i]}`).join('\n');
 return ['Тест Белбина — результаты','Баллы: 70 из 70. В каждом блоке: 10.','','Наибольшие баллы (три роли, включая равенства на границе):',list(high),'','Наименьшие баллы (три роли, включая равенства на границе):',list(low),'','Все роли:',...scores.map((_,i)=>i).sort((a,b)=>scores[b]-scores[a]||a-b).map(i=>`${data.roles[i].name}: ${scores[i]}${state.comments[i].trim()?'\nМой комментарий: '+state.comments[i]:''}`),'','Ответы по блокам:',...data.blocks.map((b,i)=>`Блок ${i+1}: `+b.questions.map((q,j)=>`${q.id}=${state.answers[i][j]}`).join(', ')),'','Источник: '+data.source.url,'','Пройти тест: '+SITE_URL].join('\n');
}
function downloadText(){const url=URL.createObjectURL(new Blob([reportText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='belbin-result.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('action-status').textContent='Файл результата подготовлен к скачиванию.';}
async function copyText(){try{await navigator.clipboard.writeText(reportText());$('action-status').textContent='Результаты и ваши комментарии скопированы.';}catch{$('action-status').textContent='Автоматическое копирование недоступно. Выделите текст ниже или скачайте файл.';let area=$('copy-fallback');if(!area){area=document.createElement('textarea');area.id='copy-fallback';area.readOnly=true;area.setAttribute('aria-label','Текст результата для ручного копирования');$('action-status').after(area);}area.value=reportText();area.focus();area.select();}}
async function shareText(){
 const button=$('share');button.disabled=true;
 const outcome=await shareReport(reportText(),navigator);
 button.disabled=false;
 const messages={shared:'Результат передан выбранному приложению.',cancelled:'Отправка отменена.',unavailable:'Этот браузер не поддерживает меню отправки. Нажмите «Скопировать результат» или «Скачать текст».',failed:'Не удалось открыть отправку. Нажмите «Скопировать результат» или «Скачать текст».'};
 $('action-status').textContent=messages[outcome];
 if(outcome==='unavailable'||outcome==='failed')$('copy').focus();
}
const pdfFont=JSON.parse($('pdf-font').textContent);
if(document.fonts)document.fonts.load('10px BelbinReport').catch(()=>{});
let reportCache=null;
function fullReport(){
 const signature=JSON.stringify([state.answers,state.comments]);
 if(reportCache?.signature!==signature){const pages=layoutReport(data,state.answers,state.comments,pdfFont);reportCache={signature,pages,file:new File([createReportPdf(pages,pdfFont)],'belbin-result.pdf',{type:'application/pdf'})};}
 return reportCache;
}
function downloadPdf(file){
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function sharePdf(){
 const button=$('share-pdf');button.disabled=true;
 try{
  const file=fullReport().file;
  const outcome=await sharePdfFile(file,navigator);
  if(outcome==='shared')$('action-status').textContent='PDF передан выбранному приложению.';
  else if(outcome==='cancelled')$('action-status').textContent='Отправка отменена.';
  else if(outcome==='unavailable'){downloadPdf(file);$('action-status').textContent='Браузер не поддерживает отправку файлов. PDF подготовлен к скачиванию.';}
  else{$('action-status').textContent='Не удалось отправить PDF. ';const save=document.createElement('button');save.className='secondary';save.innerHTML=icon('download')+'Скачать PDF';save.onclick=()=>downloadPdf(file);$('action-status').append(save);}
 }catch{$('action-status').textContent='Не удалось подготовить PDF. Попробуйте ещё раз.';}
 finally{button.disabled=false;}
}
function preparePrint(){
 if(state.step!==7||completed()!==7)return;
 $('print-report').innerHTML=reportPrintHtml(fullReport().pages);document.body.classList.add('printing-report');
}
function finishPrint(){document.body.classList.remove('printing-report');$('print-report').innerHTML='';}
function printReport(){preparePrint();window.print();}
window.addEventListener('beforeprint',preparePrint);window.addEventListener('afterprint',finishPrint);
function result(){
 const scores=score(state.answers,data.key),{high,low}=extremes(scores);const order=scores.map((v,i)=>i).sort((a,b)=>scores[b]-scores[a]||a-b);
 const list=ids=>`<ol>${ids.map(i=>`<li>${esc(data.roles[i].name)} <span class="score-number">${scores[i]}</span></li>`).join('')}</ol>`;
 $('main').innerHTML=`<p class="eyebrow">Тест завершён · 70 из 70 баллов</p><h1>Ваши командные роли</h1><p class="lead">Посмотрите на роли с наибольшими и наименьшими баллами. Прочитайте их описание и отметьте, насколько это про вас.</p><div class="result-summary"><section class="panel accent-panel"><p class="eyebrow">Наибольшие баллы</p><h2>Ведущие роли</h2>${list(high)}</section><section class="panel"><p class="eyebrow">Наименьшие баллы</p><h2>Роли с меньшими баллами</h2>${list(low)}</section></div>${high.length>3||low.length>3?'<p class="tie-note">На границе тройки есть одинаковые баллы: показаны все роли с этим результатом. В исходнике нет правила выбора между равными результатами.</p>':''}<section class="panel"><h2>Все восемь ролей</h2><div class="chart">${order.map(i=>`<div><div class="bar-label"><span>${esc(data.roles[i].name)}</span><span class="score-number">${scores[i]} / 70</span></div><div class="bar-track" aria-hidden="true"><div class="bar-fill ${high.includes(i)?'high':''}" style="width:${scores[i]/70*100}%"></div></div></div>`).join('')}</div><p class="small">Баллы по исходному ключу. Это не проценты и не оценка «хорошо / плохо».</p><details><summary>Проверить расчёт по блокам</summary><div class="table-wrap"><table><thead><tr><th scope="col">Блок</th>${data.roles.map(r=>`<th scope="col">${esc(r.name)}</th>`).join('')}<th scope="col">Сумма</th></tr></thead><tbody>${data.key.map((row,b)=>`<tr><th scope="row">${b+1}</th>${row.map(q=>`<td>${state.answers[b][q-(b+1)*10]}</td>`).join('')}<td>10</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Итого</th>${scores.map(v=>`<td>${v}</td>`).join('')}<td>70</td></tr></tfoot></table></div></details></section><h2 class="reflection-title">Насколько это про вас?</h2><p class="small">Откройте описания ролей и добавьте свои комментарии. Они попадут в текст результата вместе с баллами.</p><div class="roles">${order.map(i=>`<details class="role"><summary>${esc(data.roles[i].name)} · ${scores[i]}${high.includes(i)?'<span class="pill">Наибольшие баллы</span>':''}${low.includes(i)?'<span class="pill">Наименьшие баллы</span>':''}</summary><p class="role-description">${esc(data.roles[i].description)}</p><label for="comment-${i}">Мой комментарий: насколько это про меня</label><textarea id="comment-${i}" data-role="${i}" maxlength="5000" placeholder="Ваши впечатления после прочтения…">${esc(state.comments[i])}</textarea></details>`).join('')}</div><div class="actions"><button class="primary" id="share">${icon('share')}Поделиться результатом</button><button class="secondary" id="share-pdf">${icon('pdf')}Поделиться PDF</button><button class="secondary" id="copy">${icon('copy')}Скопировать результат</button><button class="secondary" id="download">${icon('download')}Скачать текст</button><button class="secondary" id="print">${icon('print')}Печать / PDF</button><button class="secondary" id="edit">${icon('edit')}Изменить ответы</button></div><p class="small" id="action-status" role="status" aria-live="polite"></p><p class="small report-site">Пройти тест: <a href="${SITE_URL}">${SITE_URL}</a></p><p class="small source-note">Описания приведены по исходному документу без изменения формулировок. Результаты и комментарии никуда не отправляются автоматически.</p>`;
 $('main').querySelectorAll('textarea[data-role]').forEach(el=>el.addEventListener('input',()=>{state.comments[Number(el.dataset.role)]=el.value;persist();}));
 fullReport();$('share').onclick=shareText;$('share-pdf').onclick=sharePdf;$('copy').onclick=copyText;$('download').onclick=downloadText;$('print').onclick=printReport;$('edit').onclick=()=>go(0);
}
function render(){chrome();if(state.step===-1)intro();else if(state.step===7)result();else block();}
 $('steps').addEventListener('click',e=>{const el=e.target.closest('[data-step]');if(el&&!el.disabled)go(Number(el.dataset.step));});
 $('home').onclick=e=>{e.preventDefault();go(-1);};
 $('reset').onclick=()=>{if(window.confirm('Удалить все ответы и комментарии в этом браузере и начать заново?')){state=blank();notice('');persist();render();$('main').focus();}};
 if(!storageAvailable)$('save-status').textContent='Прогресс не сохраняется';
 render();

$('reset').innerHTML=icon('reset')+'Начать заново';
