import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {normalizeAnswer,isCorrect,completionState} from '../logic.js';
const lessons=JSON.parse(fs.readFileSync('data/lessons.json','utf8')),plan=JSON.parse(fs.readFileSync('data/plan.json','utf8')),manifest=JSON.parse(fs.readFileSync('data/audio-manifest.json','utf8'));
assert.equal(lessons.length,50);assert.equal(Object.keys(manifest).length,150);
let exercises=0,seconds=0;
for(let i=0;i<50;i++){const l=lessons[i];assert.equal(l.id,i+1);assert.equal(l.title,plan[i].title);assert.ok(l.words.length>=8&&l.words.length<=12,`Vocabulary ${l.id}`);for(const w of l.words){assert.ok(w.kk&&w.ru);}
assert.ok(l.goal&&l.passText&&l.grammar.explanation&&l.reading.kk&&l.reading.ru);assert.ok(l.grammar.examples.length>=3&&l.phrases.length>=3&&l.dialogue.length>=4&&l.exercises.length>=5&&l.oral.length>=3&&l.review.length>=3);assert.ok(l.sourceTasks.length&&l.sourceTexts.length);
for(const ex of [...l.exercises,{...l.listening,type:'choice'}]){assert.ok(ex.prompt||ex.question);assert.ok(ex.explanation);if(ex.type==='input'){assert.ok(ex.answers.length);assert.ok(ex.answers.every(a=>typeof a==='string'&&a.length));}else{assert.equal(ex.type,'choice');assert.ok(ex.options.length>=2);assert.ok(Number.isInteger(ex.answer)&&ex.answer>=0&&ex.answer<ex.options.length,`Answer index ${l.id}: ${ex.prompt}`);}}exercises+=l.exercises.length;
const texts={A:l.words.map(w=>w.kk).join('. ')+'.',B:l.phrases.map(w=>w.kk).join(' '),C:l.dialogue.map(w=>w.kk).join(' ')};
for(const k of ['A','B','C']){const item=manifest[`${String(l.id).padStart(2,'0')}-${k}`];assert.ok(item.synthetic&&item.durationSeconds>1);const buf=fs.readFileSync(item.path);assert.equal(buf.length,item.bytes);assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),item.sha256);assert.equal(crypto.createHash('sha256').update(texts[k]).digest('hex'),item.textSha256);seconds+=item.durationSeconds;}}
assert.equal(normalizeAnswer('  СӘЛЕМЕТСІЗ  бе! '),'сәлеметсіз бе');assert.notEqual(normalizeAnswer('үл'),normalizeAnswer('ұл'));assert.notEqual(normalizeAnswer('қала'),normalizeAnswer('кала'));
assert.equal(isCorrect({type:'input',answers:['Менің атым Айгүл.']},' менің  атым айгүл '),true);assert.equal(isCorrect({type:'choice',answer:0},undefined),false);
assert.equal(completionState({score:80,heard:{A:true,B:true,C:true},oral:true,listeningCorrect:true}).ready,true);
for(const changed of [{score:79},{heard:{A:true,B:true}},{oral:false},{listeningCorrect:false}])assert.equal(completionState({score:80,heard:{A:true,B:true,C:true},oral:true,listeningCorrect:true,...changed}).ready,false);
assert.ok(lessons[0].grammar.explanation.includes('Ұ'));assert.ok(lessons[35].words.some(w=>w.kk==='қолтаңба'&&w.ru.includes('подпись')));assert.ok(lessons[49].oralRubric?.length>=5);
console.log(`PASS: 50 modules, ${exercises} exercises, 150 MP3 files, ${(seconds/60).toFixed(1)} minutes. Content structure, answer keys, audio hashes/transcripts and completion criteria checked.`);
