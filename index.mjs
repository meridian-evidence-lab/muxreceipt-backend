import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {readFile} from 'node:fs/promises';
import * as engine from '../muxreceipt-core/index.mjs';
import {render} from '../muxreceipt-review/index.mjs';
import {digest,mappingProposal,anchorProposal} from '../muxreceipt-contracts/proposal.mjs';
const muxreceipt='muxreceipt';
function reply(res,status,value,type='application/json'){res.writeHead(status,{'content-type':type+'; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'"});res.end(type==='application/json'?JSON.stringify(value):value);}
async function body(req){if(!String(req.headers['content-type']).startsWith('application/json'))throw Object.assign(new Error('Use application/json'),{status:415});let n=0,parts=[];for await(const chunk of req){n+=chunk.length;if(n>1048576)throw Object.assign(new Error('Input exceeds 1 MiB'),{status:413});parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}}
function bounded(input){if(muxreceipt==='muxreceipt'){if(!Array.isArray(input.events)||input.events.length>10000||!Array.isArray(input.mappings)||input.mappings.length>512)throw new Error('Expected events <= 10000 and mappings <= 512');if(input.events.some(e=>!e||typeof e!=='object'||Array.isArray(e)))throw new Error('Events must be objects');}else{for(const x of [input.left,input.right])if(!x||!Array.isArray(x.events)||x.events.length>10000||!Array.isArray(x.ranges)||x.ranges.length>10000)throw new Error('Expected bounded left/right exports');}}
export function createApp({database=':memory:',token='',rpcUrl='',allowedOrigins=['http://127.0.0.1:4310','http://localhost:4310']}={}){
 if(database!==':memory:')mkdirSync(dirname(database),{recursive:true});const db=new DatabaseSync(database);
 db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS audits(id TEXT PRIMARY KEY,created_at TEXT NOT NULL,input TEXT NOT NULL,report TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);');
 const get=id=>{const row=db.prepare('SELECT * FROM audits WHERE id=?').get(id);return row?{id:row.id,createdAt:row.created_at,input:JSON.parse(row.input),report:JSON.parse(row.report)}:null;};
 const server=createServer(async(req,res)=>{
  try{
   const host=String(req.headers.host??'').split(':')[0];if(!['127.0.0.1','localhost'].includes(host))return reply(res,403,{error:'Loopback host required'});
   const path=new URL(req.url,'http://localhost').pathname;
   if(req.headers.origin&&!allowedOrigins.includes(req.headers.origin))return reply(res,403,{error:'Origin not allowed'});
   if(path==='/api/health')return reply(res,200,{project:muxreceipt,version:'0.2.0',mode:'local-development',database:'sqlite',contracts:'unsigned-proposals'});
   if(token&&req.headers.authorization!==`Bearer ${token}`)return reply(res,401,{error:'API authorization required'});
   if(req.method==='GET'&&path==='/api/sample'){const sample=JSON.parse(await readFile(new URL('../muxreceipt-core/sample.json',import.meta.url),'utf8'));return reply(res,200,sample);}
   if(req.method==='GET'&&path==='/api/audits')return reply(res,200,db.prepare('SELECT id,created_at,report FROM audits ORDER BY rowid DESC LIMIT 100').all().map(x=>({id:x.id,createdAt:x.created_at,status:JSON.parse(x.report).status})));
   const match=path.match(/^\/api\/audits\/([a-f0-9-]+)(\/html)?$/);
   if(req.method==='GET'&&match){const record=get(match[1]);if(!record)return reply(res,404,{error:'Audit not found'});return match[2]?reply(res,200,render(record.report),'text/html'):reply(res,200,record);}
   if(path==='/api/mappings'&&muxreceipt==='muxreceipt'){
    if(req.method==='GET')return reply(res,200,JSON.parse(db.prepare("SELECT value FROM settings WHERE key='mappings'").get()?.value??'[]'));
    if(req.method==='PUT'){const input=await body(req);if(!Array.isArray(input)||input.length>512)throw new Error('Mappings must be an array of at most 512');engine.audit({schemaVersion:1,mappings:input,events:[]});db.prepare("INSERT INTO settings VALUES('mappings',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(input));return reply(res,200,{saved:input.length});}
   }
   if(req.method==='POST'&&path==='/api/audits'){
    const input=await body(req);if(muxreceipt==='muxreceipt'&&!input.mappings)input.mappings=JSON.parse(db.prepare("SELECT value FROM settings WHERE key='mappings'").get()?.value??'[]');bounded(input);
    const report=muxreceipt==='muxreceipt'?engine.audit(input):engine.compare(input.left,input.right);report.provenance={inputDigest:digest(input),coreVersion:'0.1.0',normalization:'caller-supplied'};
    const id=randomUUID(),createdAt=new Date().toISOString();db.prepare('INSERT INTO audits VALUES(?,?,?,?)').run(id,createdAt,JSON.stringify(input),JSON.stringify(report));return reply(res,201,{id,createdAt,report});
   }
   if(req.method==='POST'&&path==='/api/contracts/proposals'){
    const x=await body(req);let proposal;
    if(muxreceipt==='muxreceipt'){engine.audit({schemaVersion:1,mappings:[x.mapping],events:[]});proposal=mappingProposal(x.mapping,x.expectedRevision,x.salt);}
    else{const stored=get(x.auditId);if(!stored)return reply(res,404,{error:'Audit not found'});proposal=anchorProposal(stored.report,stored.input,x.publisher);}
    return reply(res,200,{...proposal,contractId:process.env.CONTRACT_ID??null,network:'operator-configured',submitted:false});
   }
   if(req.method==='GET'&&path==='/api/network'){
    if(!rpcUrl)return reply(res,200,{configured:false,notice:'Set RPC_URL to enable read-only network health checks'});
    const url=new URL(rpcUrl);if(url.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('RPC requires HTTPS');
    const rpc=async(method)=>{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method}),signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('RPC unavailable');const x=await r.json();if(x.error)throw new Error('RPC error');return x.result;};
    try{return reply(res,200,{configured:true,network:await rpc('getNetwork'),health:await rpc('getHealth'),trust:'provider-reported'});}catch{return reply(res,502,{error:'Configured RPC health check failed'});}
   }
   reply(res,404,{error:'Route not found'});
  }catch(e){reply(res,e.status??422,{error:e.message});}
 });
 server.on('close',()=>db.close());return server;
}
