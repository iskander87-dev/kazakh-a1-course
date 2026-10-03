"""Recreate bundled synthetic Kazakh audio. pip install edge-tts mutagen"""
import asyncio, hashlib, json, pathlib, sys
import edge_tts
from mutagen.mp3 import MP3
ROOT = pathlib.Path(__file__).resolve().parents[1]
VOICE = 'kk-KZ-AigulNeural'
async def main():
    lessons=json.loads((ROOT/'data/lessons.json').read_text(encoding='utf-8'))
    manifest={}
    previous_path=ROOT/'data/audio-manifest.json'
    previous=json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}
    gate=asyncio.Semaphore(3)
    async def clip(l,kind,text):
        key=f'{l["id"]:02d}-{kind}'
        path=ROOT/'audio'/f'{key}.mp3'
        text_hash=hashlib.sha256(text.encode()).hexdigest()
        async with gate:
            for attempt in range(4):
                try:
                    if not path.exists() or path.stat().st_size < 1000 or previous.get(key,{}).get('textSha256') != text_hash:
                        await edge_tts.Communicate(text,VOICE).save(str(path))
                    duration=MP3(path).info.length
                    if duration<1: raise ValueError('Audio too short')
                    manifest[key]={'path':f'audio/{key}.mp3','voice':VOICE,'synthetic':True,'nativeReviewed':False,'durationSeconds':round(duration,2),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'textSha256':text_hash,'text':text}
                    print(f'{key} {duration:.1f}s',flush=True)
                    return
                except Exception as error:
                    if path.exists(): path.unlink()
                    if attempt==3: raise
                    await asyncio.sleep(2*(attempt+1))
    tasks=[]
    for l in lessons:
        texts={'A':'. '.join(w['kk'] for w in l['words'])+'.','B':' '.join(w['kk'] for w in l['phrases']),'C':' '.join(w['kk'] for w in l['dialogue'])}
        for kind,text in texts.items(): tasks.append(clip(l,kind,text))
    await asyncio.gather(*tasks)
    (ROOT/'data/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Generated {len(manifest)} audio clips',flush=True)
if __name__=='__main__': asyncio.run(main())
