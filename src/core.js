export const validValue = v => Number.isInteger(v) && (v === 0 || (v >= 2 && v <= 10));
export const validBlock = b => Array.isArray(b) && b.length === 8 && b.every(validValue) && b.reduce((s,v)=>s+v,0) === 10;
export function score(answers,key) {
  return Array.from({length:8},(_,role)=>key.reduce((sum,row,b)=>sum+answers[b][row[role]-(b+1)*10],0));
}
export function extremes(scores) {
  const ordered=[...scores].sort((a,b)=>b-a);
  return {high:scores.flatMap((v,i)=>v>=ordered[2]?[i]:[]).sort((a,b)=>scores[b]-scores[a]||a-b),low:scores.flatMap((v,i)=>v<=ordered[5]?[i]:[]).sort((a,b)=>scores[a]-scores[b]||a-b)};
}
export function restore(raw) {
  try {
    const s=JSON.parse(raw);
    if(!s || s.version!==1 || !Number.isInteger(s.step) || s.step < -1 || s.step > 7) return null;
    if(!Array.isArray(s.answers)||s.answers.length!==7||!s.answers.every(b=>Array.isArray(b)&&b.length===8&&b.every(validValue))) return null;
    if(!Array.isArray(s.comments)||s.comments.length!==8||!s.comments.every(c=>typeof c==='string'&&c.length<=5000)) return null;
    if(s.step===7&&!s.answers.every(validBlock))s.step=s.answers.findIndex(b=>!validBlock(b));
    return {version:1,answers:s.answers,comments:s.comments,step:s.step};
  } catch { return null; }
}
