export function normalizeAnswer(s){return String(s??'').normalize('NFC').toLocaleLowerCase('kk-KZ').replace(/[.,!?;:«»“”"']/g,'').replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ').trim();}
export function isCorrect(ex,value){if(value===undefined||value===null||value==='')return false;return ex.type==='input'?ex.answers.some(a=>normalizeAnswer(a)===normalizeAnswer(value)):+value===ex.answer;}
export function completionState(s){const score=Number(s.score)>=80,heard=['A','B','C'].every(k=>s.heard?.[k]===true),oral=s.oral===true,listening=s.listeningCorrect===true;return {score,heard,oral,listening,ready:score&&heard&&oral&&listening};}

export async function loadCourseData(fetcher=fetch){
  const response=await fetcher('./data/lessons.json');
  if(!response.ok)throw Error('lessons unavailable');
  const lessons=await response.json();
  let manifest={};
  // Audio also works with the standard paths when optional metadata is unavailable.
  try{
    const audio=await fetcher('./data/audio-manifest.json');
    if(audio.ok){
      const data=await audio.json();
      if(data&&typeof data==='object'&&!Array.isArray(data))manifest=data;
    }
  }catch{}
  return {lessons,manifest};
}
