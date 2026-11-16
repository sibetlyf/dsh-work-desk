// Independent creation acceptance: real host + dist + Chromium, MOCK sessions/LLM only.
// Never drives the UI through host mutation APIs; host GET is read-only evidence.
import http from 'node:http'
import { mkdtemp, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fakeHome = await mkdtemp(join(tmpdir(), 'wd-creation-home-'))
process.env.HOME = process.env.USERPROFILE = process.env.DSH_HOME = fakeHome
const reactBundle = join(root, 'docs', '.e2e-creation-react.js')
await build({stdin:{contents:"import * as React from 'react'; import * as ReactDOMClient from 'react-dom/client'; window.React=React; window.ReactDOMClient=ReactDOMClient",resolveDir:root,loader:'js'},bundle:true,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},minify:true,outfile:reactBundle,logLevel:'silent'})
const {default:plugin} = await import('../src/host.js')
const routes=[], cleanups=[]
plugin.apply({effect(fn){const off=fn();if(typeof off==='function')cleanups.push(off);return off},get(name){if(name==='connection')return {requestRejection:()=>undefined}},webServer:{register(def){routes.push(def);return ()=>{}}}})
// Same shell/tokens/React bootstrap as e2e-workbench, with contract-compatible ctx.get.
const template = await readFile(join(root,'scripts','e2e-workbench.mjs'),'utf8')
const tokens = template.match(/const TOKENS = `([\s\S]*?)`/)[1]
const mock = String.raw`
function store(value){const listeners=new Set();return {getSnapshot:()=>value,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn)},set(next){value=next;for(const fn of listeners)fn()}}}
const audit=window.audit={created:[],retains:[],releases:[],prompts:[],navigations:[],failNext:false,maxTextareas:0,maxChats:0};
new MutationObserver(()=>{audit.maxTextareas=Math.max(audit.maxTextareas,document.querySelectorAll('textarea').length);audit.maxChats=Math.max(audit.maxChats,document.querySelectorAll('.wd-chat').length)}).observe(document.getElementById('root'),{childList:true,subtree:true});
const bindings={};let seq=0;
function event(type,data,transient=false){return {type:transient?'transient':'event',event:{type,seq:++seq,data}}}
function binding(id){if(bindings[id])return bindings[id];const eventSource=store({entries:id==='old-session'?[event('assistant/message',{message:{content:[{type:'text',text:'旧会话历史'}]}})]:[]});const snap=store({running:false,openState:'ready'});return bindings[id]={sessionId:id,ctx:{},eventSource,session:{...snap,async prompt(content,mode){audit.prompts.push({id,content,mode});eventSource.set({entries:[...eventSource.getSnapshot().entries,event('user/message',{content,source:{kind:'user'}})]});return {ok:true}}}}}
const list=store({ids:['old-session'],byId:{'old-session':{title:'旧会话',cwd:'G:/fixture',updatedAt:1,blank:false}},phase:'ready',projectionsBySession:{}});
const sessions={list,async create(opts){if(audit.failNext){audit.failNext=false;throw Error('fixture 创建失败')}const id='new-session-'+(audit.created.length+1);audit.created.push({id,opts});const prev=list.getSnapshot();list.set({...prev,ids:[...prev.ids,id],byId:{...prev.byId,[id]:{title:'新会话 '+id,blank:true,updatedAt:2}}});return id},retain(id,opts){audit.retains.push({id,opts});const bound=binding(id);let released=false;return {sessionId:id,binding:bound,ready:Promise.resolve(bound),release(){if(released)throw Error('double release');released=true;audit.releases.push(id)}}}};
window.fixture={stream(id,text,attempt='attempt-1'){const b=binding(id);b.session.set({running:true,openState:'ready'});b.eventSource.set({entries:[...b.eventSource.getSnapshot().entries,event('assistant/live-chunk',{attemptId:attempt,chunk:{type:'text-delta',text}},true)]})},finish(id,text){const b=binding(id);b.eventSource.set({entries:[...b.eventSource.getSnapshot().entries,event('assistant/message',{message:{content:[{type:'text',text}]}})]});b.session.set({running:false,openState:'ready'})}};
const uiWorkspace={startSession(...args){audit.navigations.push(['startSession',args])},openSession(...args){audit.navigations.push(['openSession',args])}};
const panels={};const ctx={get(name){return name==='sessions'?sessions:name==='uiWorkspace'?uiWorkspace:undefined},slots:{inject(_name,fn){fn()},register(def,Comp){panels[def.name]=Comp;return ()=>{}}}};
window.__modules['dsh-work-desk'].apply(ctx);
window.ReactDOMClient.createRoot(document.getElementById('root')).render(window.React.createElement(panels.main));
`
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}${tokens}</style></head><body><div id="root"></div><script src="/react.js"></script><script>window.__modules={};window.__ModuleLoader__={load({id,factory}){window.__modules[id]=factory(name=>name==='react'?window.React:{})}};</script><script src="/client.js"></script><script>${mock}</script></body></html>`
const writes=[]
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');if(url.pathname==='/'){res.setHeader('content-type','text/html; charset=utf-8');return res.end(html)}if(['/react.js','/client.js'].includes(url.pathname)){res.setHeader('content-type','text/javascript');return res.end(await readFile(url.pathname==='/react.js'?reactBundle:join(root,'dist','client.js')))}if(url.pathname.startsWith('/work-desk/')){if(req.method==='POST'&&url.pathname==='/work-desk/workbench')writes.push(Date.now());return routes[0].handler(req,res)}res.statusCode=404;res.end()}catch(err){res.statusCode=500;res.end(err.message)}})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const base=`http://127.0.0.1:${server.address().port}`
const pw=await import(pathToFileURL(process.env.PLAYWRIGHT_ENTRY||'E:/NodeJS/node_global/node_modules/playwright/index.js').href)
const browser=await (pw.chromium??pw.default.chromium).launch()
const page=await browser.newPage({viewport:{width:1500,height:800}})
const errors=[];page.on('pageerror',err=>errors.push(err.message))
const hostLayout=async()=>await(await fetch(base+'/work-desk/workbench')).json()
const audit=()=>page.evaluate(()=>window.audit)
const one=async()=>{assert.equal(await page.locator('textarea').count(),1);assert.equal(await page.locator('.wd-chat').count(),1);assert.equal(await page.locator('.fw-rail .wd-chat').count(),1);assert.deepEqual((await audit()).navigations,[]);assert.equal((await audit()).maxTextareas,1);assert.equal((await audit()).maxChats,1);assert.equal(page.url(),base+'/')}
async function ready(){await page.locator('.wd-nav button:has-text("工作台")').click();await page.waitForSelector('.fw-grid');await page.locator('textarea[aria-label="给会话发消息"]').waitFor();await page.waitForFunction(()=>!document.querySelector('.wd-composer textarea')?.disabled)}
async function click(locator){await locator.scrollIntoViewIfNeeded();await locator.click()}
let passed=0
async function check(name,fn){await fn();await one();passed++;console.log('PASS '+name)}
try{
 await page.goto(base,{waitUntil:'networkidle'});await ready()
 await check('one embedded session, no second ChatDock',async()=>{assert.equal(await page.locator('.wd-chat').getAttribute('data-session-id'),'old-session')})
 await check('create retains in same frame without prompt or navigation',async()=>{await click(page.getByRole('button',{name:'新建会话',exact:true}));await page.waitForFunction(()=>document.querySelector('.wd-chat').dataset.sessionId==='new-session-1');await ready();const a=await audit();assert.equal(a.created.length,1);assert.equal(a.prompts.length,0);assert.ok(a.retains.some(x=>x.id==='new-session-1'));assert.ok(a.releases.includes('old-session'))})
 await check('failed creation keeps current session',async()=>{await page.evaluate(()=>window.audit.failNext=true);await click(page.getByRole('button',{name:'新建会话',exact:true}));await page.getByText('fixture 创建失败',{exact:true}).waitFor();assert.equal(await page.locator('.wd-chat').getAttribute('data-session-id'),'new-session-1')})
 await check('switch old session and prompt through retained binding',async()=>{await page.getByLabel('选择会话').selectOption('old-session');await ready();await page.getByText('旧会话历史',{exact:true}).waitFor();await page.getByLabel('给会话发消息').fill('继续旧会话并生成 UI');await click(page.getByRole('button',{name:'发送',exact:true}));await page.waitForFunction(()=>window.audit.prompts.length===1);const a=await audit();assert.equal(a.prompts[0].id,'old-session');assert.equal(a.prompts[0].mode,'queue');assert.match(a.prompts[0].content[0].text,/workbench-ui/);assert.ok(a.releases.includes('new-session-1'))})
 const prefix='```workbench-ui\n'+JSON.stringify({title:'验收流式卡片',items:[{type:'stat',label:'完成节点',value:'7'}]}).slice(0,-2)+','
 const suffix='{"type":"text","content":"第二段完成"}]}\n```'
 const before=await hostLayout()
 await check('partial text-delta previews completed object on left but cannot add',async()=>{await page.evaluate(text=>window.fixture.stream('old-session',text),prefix);await page.locator('.fw-live-preview').waitFor();assert.match(await page.locator('.fw-preview-body').innerText(),/完成节点/);assert.equal(await page.locator('.fw-live-preview button').last().isDisabled(),true);const boxes=await page.evaluate(()=>({p:document.querySelector('.fw-live-preview').getBoundingClientRect().right,r:document.querySelector('.fw-rail').getBoundingClientRect().left}));assert.ok(boxes.p<=boxes.r);assert.equal((await hostLayout()).revision,before.revision);assert.equal(writes.length,0)})
 await check('final delta enables add; real scroll and double click add once through Host',async()=>{await page.evaluate(text=>window.fixture.stream('old-session',text),suffix);const button=page.locator('.fw-live-preview button').last();await page.waitForFunction(()=>!document.querySelector('.fw-live-preview header > button:last-child').disabled);assert.match(await page.locator('.fw-preview-body').innerText(),/第二段完成/);await button.scrollIntoViewIfNeeded();await button.dblclick();await page.waitForFunction(()=>document.querySelector('.fw-live-preview header > button:last-child').disabled);await page.waitForResponse(r=>r.url().endsWith('/work-desk/workbench')&&r.request().method()==='POST'&&r.status()===200);const after=await hostLayout();assert.equal(after.revision,before.revision+1);assert.equal(after.atoms.length,before.atoms.length+1);assert.equal(after.atoms.filter(a=>a.spec?.title==='验收流式卡片').length,1);assert.equal(writes.length,1);await page.evaluate(text=>window.fixture.finish('old-session',text),prefix+suffix)})
 await check('illegal HTML/script specification never renders or saves',async()=>{await click(page.getByRole('button',{name:'新建会话',exact:true}));await ready();await page.waitForFunction(()=>document.querySelector('.wd-chat').dataset.sessionId==='new-session-2');const bad='```workbench-ui\n'+JSON.stringify({title:'恶意',items:[{type:'script',content:'<script>window.__unsafe=1</script>'},{type:'html',content:'<img src=x onerror="window.__unsafe=2">'}]})+'\n```';await page.evaluate(text=>window.fixture.finish('new-session-2',text),bad);await page.waitForTimeout(200);assert.equal(await page.locator('.fw-live-preview').count(),0);assert.equal(await page.locator('.fw-preview-body script,.fw-preview-body img,.fw-preview-body iframe').count(),0);assert.equal(await page.evaluate(()=>window.__unsafe),undefined);assert.equal((await hostLayout()).revision,before.revision+1)})
 const ownership=await audit();assert.equal(ownership.retains.length-ownership.releases.length,1,'exactly one active retained reference');assert.equal(ownership.retains.filter(x=>x.id==='new-session-1').length,ownership.releases.filter(id=>id==='new-session-1').length,'switched-out session fully released');console.log('RETAIN/RELEASE '+JSON.stringify(ownership))
 await check('reload preserves actual Host layout and rendered card',async()=>{await page.reload({waitUntil:'networkidle'});await ready();const card=page.locator('.fw-slot').filter({has:page.locator('h2:text-is("验收流式卡片")')});await card.waitFor();await card.scrollIntoViewIfNeeded();assert.match(await card.innerText(),/第二段完成/);assert.equal((await hostLayout()).atoms.filter(a=>a.spec?.title==='验收流式卡片').length,1);assert.equal(writes.length,1)})
 assert.deepEqual(errors,[])
 console.log(`Creation acceptance: ${passed}/8 PASS. Real host+dist+Chromium; MOCK sessions/eventSource/LLM; temp HOME ${fakeHome}. No installed-Harness or real-model claim.`)
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await unlink(reactBundle).catch(()=>{});for(const off of cleanups.reverse())off()}
