const http=require('http'),fs=require('fs'),path=require('path');
const game=path.resolve(__dirname,'../outputs/bridge-assault-3d.html');
http.createServer((req,res)=>{if(req.url.split('?')[0]!=='/'){res.writeHead(404);res.end();return}fs.readFile(game,(err,data)=>{if(err){res.writeHead(500);res.end('Game unavailable');return}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data)})}).listen(8766,'127.0.0.1',()=>console.log('Game ready on http://127.0.0.1:8766/'));
