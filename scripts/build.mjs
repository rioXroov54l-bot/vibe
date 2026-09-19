import fs from 'node:fs/promises';
const files={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','cinema.html':'text/html; charset=utf-8','cinema.js':'text/javascript; charset=utf-8','cinema.css':'text/css; charset=utf-8'};
// app.js keeps the local shell; cloud-ui.js adds the connected layer and
// master-spec.js appends the master spec extensions inside the same closure,
// both injected right before the closing render() call.
const cloudUi=await fs.readFile('public/cloud-ui.js','utf8');
const masterSpec=await fs.readFile('public/master-spec.js','utf8');
const assets={};
for(const [name,type]of Object.entries(files)){
 const body=name==='app.js'
  ?(await fs.readFile('public/app.js','utf8')).replace(/render\(\);\s*\}\)\(\);\s*$/,()=>cloudUi+'\n'+masterSpec+'\nrender();\n})();')
  :await fs.readFile('public/'+name,'utf8');
 assets['/'+name]={type,body};
}
assets['/vibe-logo-320x132.png']={type:'image/png',base64:true,body:(await fs.readFile('public/vibe-logo-320x132.png')).toString('base64')};
const worker=await fs.readFile('server/worker.mjs','utf8');
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+await fs.readFile('server/cinema.mjs','utf8')+'\n'+await fs.readFile('server/cloud.mjs','utf8')+'\n'+worker);
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built self-contained Worker with embedded app assets.');

await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
