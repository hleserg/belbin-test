export async function shareReport(text, browser) {
  if (typeof browser.share !== 'function') return 'unavailable';
  try {
    await browser.share({title:'Тест Белбина — результаты',text});
    return 'shared';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
