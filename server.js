import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/model.js':'model.js'};
const types = {html:'text/html',css:'text/css',js:'text/javascript'};
const server = http.createServer(async (req,res) => {
  const file = files[new URL(req.url,'http://localhost').pathname];
  if (!file) {res.writeHead(404);res.end('Nicht gefunden');return;}
  try {const data=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':`${types[file.split('.').pop()]}; charset=utf-8`,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(data);}
  catch {res.writeHead(500);res.end('Datei konnte nicht geladen werden');}
});
server.listen(Number(process.env.PORT || 3000),process.env.HOST || '127.0.0.1',()=>console.log('KanzleiZeit gestartet, Port '+server.address().port));
