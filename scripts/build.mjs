import fs from 'node:fs/promises';
const parts=['lessons-01-18.json','lessons-19-35.json','lessons-36-50.json'];
const lessons=(await Promise.all(parts.map(p=>fs.readFile('data/'+p,'utf8').then(JSON.parse)))).flat().sort((a,b)=>a.id-b.id);
await fs.writeFile('data/lessons.json',JSON.stringify(lessons,null,2)+'\n');
await fs.mkdir('dist',{recursive:true});
for(const file of ['index.html','app.js','logic.js','styles.css','favicon.svg','.nojekyll'])await fs.copyFile(file,'dist/'+file);
for(const dir of ['data','audio'])await fs.cp(dir,'dist/'+dir,{recursive:true});
console.log('Static course built: dist/ ('+lessons.length+' modules)');
