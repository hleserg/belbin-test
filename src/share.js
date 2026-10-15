export async function shareReport(text, browser) {
  if (typeof browser.share !== 'function') return 'unavailable';
  try {
    await browser.share({title:'Тест Белбина — результаты',text});
    return 'shared';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

export async function sharePdfFile(file,browser){
 try{
  if(typeof browser.share!=='function'||typeof browser.canShare!=='function'||!browser.canShare({files:[file]}))return 'unavailable';
  await browser.share({files:[file],title:'Тест Белбина — результаты'});return 'shared';
 }catch(error){return error?.name==='AbortError'?'cancelled':'failed';}
}
