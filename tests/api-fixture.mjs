// Local synthetic HTTP fixture for manual browser QA, never a production backend.
import { createServer } from 'node:http'
import {mockSnapshot} from '../src/data/dashboard.ts'
let revision=0
const server=createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5174')
 res.setHeader('Content-Type','application/json')
 const url=new URL(req.url,'http://localhost')
 if(url.pathname!='/dashboard'){res.writeHead(404);res.end('{}');return}
 const current=++revision
 if(current===3){res.writeHead(503);res.end('{}');return}
 const base=mockSnapshot({period:'today',timezone:'America/Chicago'},false)
 const start=url.searchParams.get('start'),end=url.searchParams.get('end')
 const point=current>=4?[{at:end,count:1500+current}]:[{at:start,count:450},{at:new Date((Date.parse(start)+Date.parse(end))/2).toISOString(),count:null},{at:end,count:1500+current}]
 setTimeout(()=>res.end(JSON.stringify({...base,version:1,range:{...base.range,start,end},capturedAt:new Date().toISOString(),connected:1500+current,capacity:1800,peak:1500+current,peakAt:end,voiceP95:null,health:[{name:'Local synthetic fixture',status:'Unknown'}],alerts:[],forecast:null,concurrency:point,sessions:[]})),current===1?1500:300)
})
server.listen(5180,'127.0.0.1',()=>console.log('Synthetic API fixture: http://127.0.0.1:5180/dashboard'))
