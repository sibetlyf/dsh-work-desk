window.__ModuleLoader__.load({id:"dsh-work-desk",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var Fn=Object.create;var Ue=Object.defineProperty;var Un=Object.getOwnPropertyDescriptor;var Bn=Object.getOwnPropertyNames;var Wn=Object.getPrototypeOf,Yn=Object.prototype.hasOwnProperty;var Vn=(e,t)=>{for(var n in t)Ue(e,n,{get:t[n],enumerable:!0})},Et=(e,t,n,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Bn(t))!Yn.call(e,r)&&r!==n&&Ue(e,r,{get:()=>t[r],enumerable:!(a=Un(t,r))||a.enumerable});return e};var ee=(e,t,n)=>(n=e!=null?Fn(Wn(e)):{},Et(t||!e||!e.__esModule?Ue(n,"default",{value:e,enumerable:!0}):n,e)),Jn=e=>Et(Ue({},"__esModule",{value:!0}),e);var wi={};Vn(wi,{apply:()=>fi,inject:()=>mi});module.exports=Jn(wi);var I=ee(require("react"),1);var z=ee(require("react"),1);var Tt=ee(require("react"),1),It="work-desk/",At=null;function jt(e){At=e}function Oe(){return At}var re={ready:!1,error:null,state:null,quotes:{},quoteError:null,quotesAt:null,alerts:[],brief:null,canUndo:!1,model:null,modelOk:null,modelError:null,mail:{},view:"today",focusMailId:null,focusEventId:null,dockOpen:!0,thinking:!1,toast:null,dialog:null,settingsOpen:!1,settings:null,mailFilter:"all",mailQuery:"",composer:null,confirmSend:!1,sending:!1,selectedDay:null,monthCursor:null,calendarMode:"week",minute:null,minuteCode:null,minuteError:null,tick:0},ot=new Set;function y(e){re={...re,...typeof e=="function"?e(re):e},ot.forEach(t=>t())}function Kn(e){return ot.add(e),()=>ot.delete(e)}function $(e){return Tt.default.useSyncExternalStore(Kn,()=>e(re))}async function te(e,t){let n=await fetch(It+e,t===void 0?{headers:{"cache-control":"no-cache"}}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error(a.error||`\u8BF7\u6C42\u5931\u8D25\uFF08${n.status}\uFF09`);return a}var Ot=null;function J(e,{undo:t=!1,error:n=!1}={}){clearTimeout(Ot),e&&(y({toast:{text:e,undo:t,error:n,key:Date.now()}}),Ot=setTimeout(()=>y({toast:null}),t||String(e).length>24?6e3:3200))}function pe(e){J(e?.message||String(e),{error:!0})}async function ke(){try{let e=await te("state");y({ready:!0,error:null,state:e.state,quotes:e.quotes??{},quoteError:e.quoteError??null,quotesAt:e.quotesAt??null,alerts:e.alerts??[],brief:e.brief??null,canUndo:e.canUndo,model:e.model,modelOk:e.modelOk,modelError:e.modelError,mail:e.mail??{}});let t=await te("settings").catch(()=>null);t&&JSON.stringify(t)!==JSON.stringify(re.settings)&&y({settings:t})}catch(e){y({ready:!1,error:e.message})}}async function U(e,{label:t="\u64CD\u4F5C",undoable:n=!0,silent:a=!1}={}){try{let r=await te("ops",{ops:e,label:t,undoable:n});return y(i=>({state:r.state,canUndo:n||i.canUndo,quotes:i.quotes})),r.errors?.length?J(r.errors[0],{error:!0}):!a&&r.receipts?.[0]&&J(r.receipts[0].text,{undo:n}),r}catch(r){return pe(r),null}}async function Ne(){try{let e=await te("undo",{});y({state:e.state,canUndo:e.canUndo,toast:null}),e.label&&J(`\u5DF2\u64A4\u9500\uFF1A${e.label}`)}catch(e){pe(e)}}function Lt(){let e=setInterval(()=>{y(t=>({tick:t.tick+1}))},3e4);return()=>clearInterval(e)}async function Be(e=!1){try{let t=await te(`quotes?force=${e?1:0}`);return y({quotes:t.quotes??{},quoteError:t.error??null,quotesAt:t.fetchedAt??null}),t}catch(t){return y({quoteError:t.message}),null}}async function We(e){y({minuteCode:e,minuteError:null});try{let t=await te(`quote/minute?code=${encodeURIComponent(e)}`);return y({minute:t}),t}catch(t){return y({minute:null,minuteError:t.message}),null}}async function Ye(){try{let e=await te("mail/sync",{});return e.error?(J(e.error,{error:!0}),y({mail:{...re.mail,lastSyncError:e.error}}),null):(y({state:e.state,mail:{...re.mail,lastSyncAt:new Date().toISOString(),lastSyncError:null}}),J(e.added?`\u540C\u6B65\u5230 ${e.added} \u5C01\u65B0\u90AE\u4EF6`:"\u6CA1\u6709\u65B0\u90AE\u4EF6"),e)}catch(e){return pe(e),null}}async function ze(e){y({view:"mail",focusMailId:e,dockOpen:!1});try{let t=await te("mail/read",{id:e});return y({state:t.state,focusMailId:t.mail?.id??e}),t.mail}catch(t){return pe(t),null}}async function lt(e,t){try{let n=await te("mail/mark",{id:e,action:t});return y({state:n.state}),n.warning&&J(n.warning,{error:!0}),n}catch(n){return pe(n),null}}function Ve(e){y({composer:{to:"",cc:"",subject:"",text:"",...e},confirmSend:!1,sending:!1})}function Je(){y({composer:null,confirmSend:!1,sending:!1})}async function Pt(){let e=re.composer;if(!e)return!1;let t=(re.settings?.mail?.provider??re.mail?.provider)==="dsh-email";y({sending:!0});try{let n=await te(t?"mail/draft":"mail/send",e);return n.error?(J(n.error,{error:!0}),y({sending:!1}),!1):(y({composer:null,confirmSend:!1,sending:!1}),J(t?"\u8349\u7A3F\u5DF2\u5B58\u5230 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u5230 \u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u8349\u7A3F \u91CC\u786E\u8BA4\u53D1\u9001":"\u90AE\u4EF6\u53D1\u51FA\u53BB\u4E86"),!0)}catch(n){return pe(n),y({sending:!1}),!1}}async function dt(){try{let e=await te("brief/generate",{});return y({brief:e.brief,state:e.state}),J("\u6668\u62A5\u5199\u597D\u4E86"),e.brief}catch(e){return pe(e),null}}async function Ht(e){try{let t=await te("ics/import",{text:e});return y({state:t.state}),J(`\u5BFC\u5165 ${t.added} \u4E2A\u65E5\u7A0B${t.skipped?`\uFF0C\u8DF3\u8FC7 ${t.skipped} \u4E2A\u91CD\u590D\u89C4\u5219`:""}`),t}catch(t){return pe(t),null}}async function _t(){try{let e=await fetch(`${It}ics?range=all`);if(!e.ok)throw new Error("\u5BFC\u51FA\u5931\u8D25");let t=await e.text(),n=new Blob([t],{type:"text/calendar;charset=utf-8"}),a=URL.createObjectURL(n),r=document.createElement("a");r.href=a,r.download="\u529E\u516C\u5DE5\u4F5C\u53F0-\u65E5\u7A0B.ics",r.click(),setTimeout(()=>URL.revokeObjectURL(a),3e3),J("\u5DF2\u5BFC\u51FA .ics\uFF0C\u53EF\u4EE5\u5BFC\u5165\u5230\u624B\u673A\u6216\u4F01\u4E1A\u65E5\u5386")}catch(e){pe(e)}}function Gn(e){for(let t of e??[])t.type==="nav"&&t.view&&y({view:t.view}),t.type==="open_mail"&&t.id&&ze(t.id),t.type==="open_event"&&t.id&&y({view:"calendar",focusEventId:t.id}),t.type==="sync_mail"&&Ye(),t.type==="refresh_quotes"&&Be(!0),t.type==="brief"&&dt()}async function Ft(e){let t=String(e??"").trim();if(!(!t||re.thinking)){y(n=>({thinking:!0,state:{...n.state,chat:[...n.state.chat,{id:`tmp_${Date.now()}`,role:"user",text:t}]}}));try{let n=await te("chat",{message:t,focusId:re.focusMailId??void 0});y({state:n.state,canUndo:!0,modelOk:n.modelOk,modelError:n.modelError}),Gn(n.actions)}catch(n){pe(n),await ke()}finally{y({thinking:!1})}}}async function Ke(e){try{let t=await te("settings",e);return y({settings:t}),await ke(),J("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58"),!0}catch(t){return pe(t),!1}}async function pt(e){try{return await te("settings/test-mail",e)}catch(t){return{ok:!1,error:t.message}}}var A=ee(require("react"),1);var Ut={today:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2M12 2v2M12 20v2M2 12h2M20 12h2",grid:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",calendar:"M5 6h14v14H5zM5 10h14M9 3.5v4M15 3.5v4",mail:"M3 6h18v12H3zM3 7l9 6 9-6",chart:"M4 19V5M4 19h16M8 15l3-4 3 2 4-6",clock:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",check:"M5 12.5l4.5 4.5L19 7",plus:"M12 5v14M5 12h14",close:"M6 6l12 12M18 6L6 18",search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",gear:"M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",chevL:"M14.5 5.5L8 12l6.5 6.5",chevR:"M9.5 5.5L16 12l-6.5 6.5",chevD:"M6 9.5l6 6 6-6",chevU:"M6 14.5l6-6 6 6",refresh:"M19 8a8 8 0 0 0-14-1L4 9M5 16a8 8 0 0 0 14 1l1-2M4 4v5h5M20 20v-5h-5",star:"M12 4l2.4 5.2 5.6.7-4.2 3.8 1.1 5.6L12 16.5 7.1 19.3l1.1-5.6L4 9.9l5.6-.7z",archive:"M3 6h18v4H3zM5 10v9h14v-9M9.5 13h5",reply:"M9 7L4 12l5 5M4 12h9a6 6 0 0 1 6 6v1",bell:"M12 4a5 5 0 0 1 5 5v4l2 3H5l2-3V9a5 5 0 0 1 5-5zM10 19a2 2 0 0 0 4 0",trash:"M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13",edit:"M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",send:"M12 19V5M6 11l6-6 6 6",user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5",spark:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",external:"M14 5h5v5M19 5l-7 7M9 5H5v14h14v-4",filter:"M4 6h16l-6 7v5l-4 2v-7z",paperclip:"M8 12l6-6a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l7-7",upRight:"M7 17L17 7M8 7h9v9",downLeft:"M7 7l10 10M17 8v9H8",undo:"M8 6L4 10l4 4M4 10h10a5 5 0 0 1 0 10h-3",doc:"M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",target:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3",menu:"M4 6h16M4 12h16M4 18h16",eye:"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"};function M({name:e,size:t=16,fill:n=!1,stroke:a=1.6}){return A.default.createElement("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:a,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"},A.default.createElement("path",{d:Ut[e]??Ut.doc}))}function Y({icon:e,label:t,onClick:n,active:a,size:r=16,className:i="",...s}){return A.default.createElement("button",{type:"button",className:`wd-icon-btn ${a?"is-active":""} ${i}`,"aria-label":t,title:t,onClick:n,...s},A.default.createElement(M,{name:e,size:r}))}function Ge({value:e,options:t,onChange:n,label:a}){return A.default.createElement("div",{className:"wd-seg",role:"radiogroup","aria-label":a},t.map(r=>A.default.createElement("button",{key:r.value,type:"button",role:"radio","aria-checked":e===r.value,className:e===r.value?"is-on":"",onClick:()=>n(r.value),title:r.title??r.label},r.icon?A.default.createElement(M,{name:r.icon,size:14}):null,r.label?A.default.createElement("span",null,r.label):null)))}function Te({title:e,onClose:t,children:n,width:a=460,footer:r=null}){let i=A.default.useRef(null),s=A.default.useRef(t);return s.current=t,A.default.useEffect(()=>{let o=m=>{m.key==="Escape"&&(m.stopPropagation(),s.current())};window.addEventListener("keydown",o,!0);let c=i.current;return(c?.querySelector(".wd-dialog-head ~ * input, .wd-dialog-head ~ * textarea, .wd-dialog-head ~ * select")??c?.querySelector(".wd-dialog-head ~ * button"))?.focus(),()=>window.removeEventListener("keydown",o,!0)},[]),A.default.createElement("div",{className:"wd-dialog-mask",onPointerDown:o=>{o.target===o.currentTarget&&t()}},A.default.createElement("div",{className:"wd-dialog",role:"dialog","aria-modal":"true","aria-label":e,style:{width:a},ref:i},A.default.createElement("div",{className:"wd-dialog-head"},A.default.createElement("h2",null,e),A.default.createElement(Y,{icon:"close",label:"\u5173\u95ED",onClick:t})),n,r))}function Bt(){let e=$(i=>i.dialog),[t,n]=A.default.useState({});if(A.default.useEffect(()=>{e&&n(e.initial??{})},[e]),!e)return null;let a=()=>y({dialog:null}),r=i=>{i.preventDefault(),e.onSubmit(t),a()};return A.default.createElement(Te,{title:e.title,onClose:a,width:e.width??460},A.default.createElement("form",{className:"wd-form",onSubmit:r},e.fields.map(i=>i.type==="hidden"?A.default.createElement("p",{key:i.name,className:"wd-muted"},i.label):A.default.createElement("label",{key:i.name,className:"wd-field"},A.default.createElement("span",null,i.label),i.type==="textarea"?A.default.createElement("textarea",{rows:i.rows??3,value:t[i.name]??"",placeholder:i.placeholder,required:i.required,onChange:s=>n(o=>({...o,[i.name]:s.target.value}))}):i.type==="select"?A.default.createElement("select",{value:t[i.name]??"",required:i.required,onChange:s=>n(o=>({...o,[i.name]:s.target.value}))},(i.options??[]).map(s=>A.default.createElement("option",{key:s.value,value:s.value},s.label))):A.default.createElement("input",{type:i.type??"text",value:t[i.name]??"",placeholder:i.placeholder,required:i.required,onChange:s=>n(o=>({...o,[i.name]:s.target.value}))}),i.hint?A.default.createElement("small",null,i.hint):null)),A.default.createElement("div",{className:"wd-form-foot"},e.onDelete?A.default.createElement("button",{type:"button",className:"wd-btn is-danger",onClick:()=>{e.onDelete(),a()}},"\u5220\u9664"):null,A.default.createElement("span",{style:{flex:1}}),A.default.createElement("button",{type:"button",className:"wd-btn",onClick:a},"\u53D6\u6D88"),A.default.createElement("button",{type:"submit",className:"wd-btn is-primary"},e.submitLabel??"\u4FDD\u5B58"))))}function Wt(){let e=$(t=>t.toast);return e?A.default.createElement("div",{key:e.key,className:`wd-toast ${e.error?"is-error":""}`,role:e.error?"alert":"status"},e.undo?A.default.createElement(M,{name:"check",size:13}):null,A.default.createElement("span",null,e.text),e.undo?A.default.createElement("button",{type:"button",onClick:Ne},"\u64A4\u9500"):null):null}function we({title:e,hint:t,action:n}){return A.default.createElement("div",{className:"wd-empty"},A.default.createElement("p",{className:"wd-empty-title"},e),t?A.default.createElement("p",null,t):null,n)}function Xe({tone:e="",children:t}){return A.default.createElement("span",{className:`wd-tag ${e?`is-${e}`:""}`},t)}var u=ee(require("react"),1);var Ie=["\u5468\u4E00","\u5468\u4E8C","\u5468\u4E09","\u5468\u56DB","\u5468\u4E94","\u5468\u516D","\u5468\u65E5"],Yt=["\u4E00\u6708","\u4E8C\u6708","\u4E09\u6708","\u56DB\u6708","\u4E94\u6708","\u516D\u6708","\u4E03\u6708","\u516B\u6708","\u4E5D\u6708","\u5341\u6708","\u5341\u4E00\u6708","\u5341\u4E8C\u6708"],he=e=>String(e).padStart(2,"0");function V(e){let t=new Date(e);return`${t.getFullYear()}-${he(t.getMonth()+1)}-${he(t.getDate())}`}function Ce(e){let t=new Date(e);return t.setHours(0,0,0,0),t}function Se(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),n}function Ae(e){let t=Ce(e);return Se(t,-((t.getDay()+6)%7))}function Xn(e,t){return V(e)===V(t)}function P(e){if(!e)return"";let t=new Date(e);return`${he(t.getHours())}:${he(t.getMinutes())}`}function qe(e){let t=new Date(e);return`${t.getMonth()+1}\u6708${t.getDate()}\u65E5`}function ct(e){return`${qe(e)} ${P(e)}`}function ae(e,t=new Date){let n=Math.round((Ce(e)-Ce(t))/864e5);return n===0?"\u4ECA\u5929":n===1?"\u660E\u5929":n===2?"\u540E\u5929":n===-1?"\u6628\u5929":n<0&&n>-8?`${-n} \u5929\u524D`:qe(e)}function Vt(e,t=new Date){if(!e)return"";let n=new Date(e);return Xn(n,t)?P(n):n.getFullYear()===t.getFullYear()?qe(n):`${n.getFullYear()}/${n.getMonth()+1}/${n.getDate()}`}function se(e,t=new Date){let n=new Date(e)-t,a=Math.round(n/6e4);if(a<=0)return"\u5DF2\u5F00\u59CB";if(a<60)return`${a} \u5206\u949F\u540E`;let r=Math.floor(a/60),i=a%60;return r<24?i?`${r} \u5C0F\u65F6 ${i} \u5206\u540E`:`${r} \u5C0F\u65F6\u540E`:`${Math.round(r/24)} \u5929\u540E`}function ut(e){let t=new Date(e);return t.getHours()*60+t.getMinutes()}function mt(e,t){let n=Ce(e);return n.setMinutes(t),n}function ge(e,t=2){if(e==null||Number.isNaN(Number(e)))return"\u2014";let n=Number(e);return`${n>=0?"+":""}${n.toFixed(t)}%`}function oe(e){if(e==null)return"";let t=Number(e);return!Number.isFinite(t)||t===0?"":t>0?"is-up":"is-down"}function le(e,t=2){return e==null||Number.isNaN(Number(e))?"\u2014":Number(e).toLocaleString("zh-CN",{minimumFractionDigits:t,maximumFractionDigits:t})}function Jt(e){if(e==null)return"\u2014";let t=Number(e);return Number.isFinite(t)?Math.abs(t)>=1e8?`${(t/1e8).toFixed(2)} \u4EBF`:Math.abs(t)>=1e4?`${(t/1e4).toFixed(1)} \u4E07`:t.toLocaleString("zh-CN"):"\u2014"}function Kt(e){let t=e.filter(s=>!s.allDay).sort((s,o)=>new Date(s.start)-new Date(o.start)),n=[],a=[],r=0,i=()=>{if(!a.length)return;let s=[];for(let o of a){let c=s.findIndex(m=>m<=new Date(o.start).getTime());c<0&&(c=s.length,s.push(0)),s[c]=new Date(o.end).getTime(),n.push({event:o,lane:c,lanes:0})}for(let o of n)a.includes(o.event)&&(o.lanes=s.length);a=[],r=0};for(let s of t){let o=new Date(s.start).getTime();a.length&&o>=r&&i(),a.push(s),r=Math.max(r,new Date(s.end).getTime())}return i(),n}function Gt(e){return String(e??"").split(`
`).map(t=>t.trim()).filter(Boolean)}function je(e){if(!e)return"";let t=new Date(e);return`${t.getFullYear()}-${he(t.getMonth()+1)}-${he(t.getDate())}T${he(t.getHours())}:${he(t.getMinutes())}`}function ft(e={}){let t=e.start??(()=>{let n=new Date;return n.setMinutes(Math.ceil((n.getMinutes()+30)/15)*15,0,0),n})();y({dialog:{title:"\u65B0\u5EFA\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:"",start:je(t),minutes:30,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0,placeholder:"\u4EA7\u54C1\u5468\u4F1A"},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9",placeholder:"\u4F1A\u8BAE\u5BA4 / \u7EBF\u4E0A\u94FE\u63A5"}],onSubmit:n=>{let a=new Date(n.start),r=Math.max(5,Number(n.minutes)||30);U([{op:"add_event",title:n.title,start:a.toISOString(),end:new Date(a.getTime()+r*6e4).toISOString(),location:n.location??""}],{label:"\u65B0\u5EFA\u65E5\u7A0B"})}}})}function Qn({text:e}){let t=Gt(e);return u.default.createElement("div",{className:"wd-brief"},t.map((n,a)=>/^###\s+/.test(n)?u.default.createElement("h4",{key:a},n.replace(/^###\s+/,"")):/^[-·]\s+/.test(n)?u.default.createElement("p",{key:a,className:"wd-brief-li"},n.replace(/^[-·]\s+/,"")):u.default.createElement("p",{key:a},n)))}function Zn({events:e,now:t}){let a=e.filter(i=>V(i.start)===V(t)&&i.status!=="cancelled").filter(i=>!i.allDay).sort((i,s)=>new Date(i.start)-new Date(s.start)),r=a.find(i=>new Date(i.start)<=t&&new Date(i.end)>t);return u.default.createElement("section",{className:"wd-card wd-agenda"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u4ECA\u5929\u7684\u8BAE\u7A0B"),u.default.createElement("span",{className:"wd-card-meta"},a.length?`${a.length} \u4E2A\u4F1A`:"\u6CA1\u6709\u4F1A\u8BAE"),u.default.createElement("span",{style:{flex:1}}),u.default.createElement(Y,{icon:"plus",label:"\u65B0\u5EFA\u65E5\u7A0B",onClick:()=>ft()})),u.default.createElement("div",{className:"wd-agenda-body"},a.length===0?u.default.createElement(we,{title:"\u4ECA\u5929\u6CA1\u6709\u88AB\u7EA6\u6EE1",hint:"\u7559\u51FA\u6765\u7684\u6574\u5757\u65F6\u95F4\uFF0C\u9002\u5408\u505A\u9700\u8981\u8FDE\u7EED\u6CE8\u610F\u529B\u7684\u4E8B\u3002",action:u.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>ft()},"\u52A0\u4E00\u4E2A\u65E5\u7A0B")}):a.map(i=>{let s=r?.id===i.id,o=new Date(i.end)<=t;return u.default.createElement("article",{key:i.id,className:`wd-event ${s?"is-running":""} ${o?"is-past":""} tone-${i.color??"blue"}`},u.default.createElement("div",{className:"wd-event-time"},u.default.createElement("b",null,P(i.start)),u.default.createElement("small",null,P(i.end))),u.default.createElement("div",{className:"wd-event-bar","aria-hidden":"true"}),u.default.createElement("div",{className:"wd-event-main"},u.default.createElement("h3",null,i.title),u.default.createElement("p",null,i.location?u.default.createElement("span",null,i.location):null,i.attendees?.length?u.default.createElement("span",null,i.attendees.join("\u3001")):null,i.status==="tentative"?u.default.createElement(Xe,{tone:"amber"},"\u5F85\u5B9A"):null,s?u.default.createElement(Xe,{tone:"green"},"\u8FDB\u884C\u4E2D"):o?null:u.default.createElement("span",{className:"wd-muted"},se(i.start,t)))),u.default.createElement(Y,{icon:"edit",label:"\u7F16\u8F91",onClick:()=>Le(i)}))})),r?u.default.createElement("footer",{className:"wd-agenda-foot"},u.default.createElement(M,{name:"clock",size:13}),"\u73B0\u5728\u8FDB\u884C\uFF1A",r.title,"\uFF0C\u8FD8\u6709 ",Math.max(0,Math.round((new Date(r.end)-t)/6e4))," \u5206\u949F"):null)}function Le(e){y({dialog:{title:"\u7F16\u8F91\u65E5\u7A0B",submitLabel:"\u4FDD\u5B58",initial:{title:e.title,start:je(e.start),minutes:Math.max(5,Math.round((new Date(e.end)-new Date(e.start))/6e4)),location:e.location??"",notes:e.notes??""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"},{name:"notes",label:"\u5907\u6CE8",type:"textarea",rows:3}],onSubmit:t=>{let n=new Date(t.start),a=Math.max(5,Number(t.minutes)||30);U([{op:"update_event",id:e.id,title:t.title,start:n.toISOString(),end:new Date(n.getTime()+a*6e4).toISOString(),location:t.location??"",notes:t.notes??""}],{label:"\u4FEE\u6539\u65E5\u7A0B"})},onDelete:()=>U([{op:"delete_event",id:e.id}],{label:`\u5220\u9664\u300C${e.title.slice(0,10)}\u300D`})}})}function Rn({mails:e}){return u.default.createElement("section",{className:"wd-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u9700\u8981\u4F60\u56DE"),u.default.createElement("span",{className:"wd-card-meta"},e.length?`${e.length} \u5C01`:"\u6E05\u7A7A\u4E86"),u.default.createElement("span",{style:{flex:1}}),u.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({view:"mail"})},"\u5168\u90E8\u90AE\u4EF6")),e.length===0?u.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u90AE\u4EF6\u3002",u.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({settingsOpen:!0})},"\u53BB\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1")):u.default.createElement("ul",{className:"wd-mail-mini"},e.slice(0,4).map(t=>u.default.createElement("li",{key:t.id},u.default.createElement("button",{type:"button",onClick:()=>ze(t.id)},u.default.createElement("span",{className:"wd-dot"}),u.default.createElement("span",{className:"wd-mail-mini-main"},u.default.createElement("b",null,t.from?.name||t.from?.address),u.default.createElement("span",null,t.subject)),u.default.createElement("time",null,ae(t.date)))))))}function ea({tasks:e}){let t=e.filter(a=>!a.done),n=e.filter(a=>a.done).slice(0,3);return u.default.createElement("section",{className:"wd-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u5F85\u529E"),u.default.createElement("span",{className:"wd-card-meta"},t.length?`${t.length} \u6761`:"\u90FD\u505A\u5B8C\u4E86"),u.default.createElement("span",{style:{flex:1}}),u.default.createElement(Y,{icon:"plus",label:"\u52A0\u5F85\u529E",onClick:()=>Pe()})),u.default.createElement("ul",{className:"wd-tasks"},[...t,...n].map(a=>u.default.createElement("li",{key:a.id,className:a.done?"is-done":""},u.default.createElement("button",{type:"button",className:"wd-check","aria-label":a.done?"\u6807\u8BB0\u672A\u5B8C\u6210":"\u6807\u8BB0\u5B8C\u6210",onClick:()=>U([{op:"toggle_task",id:a.id}],{label:"\u66F4\u65B0\u5F85\u529E",silent:!0})},a.done?u.default.createElement(M,{name:"check",size:11,stroke:2.6}):null),u.default.createElement("span",{className:"wd-task-title"},a.title),a.due?u.default.createElement("time",{className:new Date(a.due)<new Date&&!a.done?"is-overdue":""},ae(a.due)," ",P(a.due)):null))))}function Pe(e={}){y({dialog:{title:"\u65B0\u5EFA\u5F85\u529E",submitLabel:"\u8BB0\u4E0B",initial:{title:"",due:"",priority:"0",...e},fields:[{name:"title",label:"\u5185\u5BB9",required:!0,placeholder:"\u56DE\u5468\u821F\u7684\u6539\u7248\u610F\u89C1"},{name:"due",label:"\u622A\u6B62",type:"datetime-local"},{name:"priority",label:"\u4F18\u5148\u7EA7",type:"select",options:[{value:"0",label:"\u666E\u901A"},{value:"1",label:"\u91CD\u8981"},{value:"2",label:"\u4ECA\u5929\u5FC5\u987B"}]}],onSubmit:t=>U([{op:"add_task",title:t.title,due:t.due?new Date(t.due).toISOString():null,priority:Number(t.priority)||0}],{label:"\u65B0\u5EFA\u5F85\u529E"})}})}function ta({events:e,now:t}){let n=e.filter(a=>a.status!=="cancelled"&&new Date(a.start)>t&&V(a.start)!==V(t)).sort((a,r)=>new Date(a.start)-new Date(r.start)).slice(0,5);return u.default.createElement("section",{className:"wd-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u63A5\u4E0B\u6765"),u.default.createElement("span",{className:"wd-card-meta"},n.length?`\u672A\u6765 ${n.length} \u4EF6`:"\u7A7A\u7684"),u.default.createElement("span",{style:{flex:1}}),u.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({view:"calendar"})},"\u6253\u5F00\u65E5\u5386")),n.length===0?u.default.createElement("p",{className:"wd-card-empty"},"\u63A5\u4E0B\u6765\u51E0\u5929\u8FD8\u6CA1\u6709\u5B89\u6392\u3002"):u.default.createElement("ul",{className:"wd-upcoming"},n.map(a=>u.default.createElement("li",{key:a.id},u.default.createElement("time",null,u.default.createElement("b",null,ae(a.start,t)),P(a.start)),u.default.createElement("span",{className:`wd-upcoming-dot tone-${a.color??"blue"}`,"aria-hidden":"true"}),u.default.createElement("button",{type:"button",className:"wd-upcoming-title",onClick:()=>Le(a)},a.title),a.status==="tentative"?u.default.createElement(Xe,{tone:"amber"},"\u5F85\u5B9A"):null))))}function na({positions:e,quotes:t}){if(!e.length)return null;let n=e.map(r=>{let i=t[r.code]?.price??null,s=i===null?null:i*r.shares,o=i===null?null:(i-r.cost)*r.shares;return{...r,price:i,value:s,pnl:o}}),a=n.reduce((r,i)=>r+(i.pnl??0),0);return u.default.createElement("section",{className:"wd-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u6301\u4ED3"),u.default.createElement("span",{className:`wd-card-meta ${oe(a)}`},a>=0?"+":"",le(a,0)),u.default.createElement("span",{style:{flex:1}}),u.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({view:"market"})},"\u884C\u60C5")),u.default.createElement("ul",{className:"wd-holdings"},n.map(r=>u.default.createElement("li",{key:r.id},u.default.createElement("span",null,r.name),u.default.createElement("b",null,r.price??"\u2014"),u.default.createElement("em",{className:oe(r.pnl)},r.pnl===null?"\u2014":`${r.pnl>=0?"+":""}${le(r.pnl,0)}`)))))}function aa({rows:e,onOpen:t}){return e.length?u.default.createElement("section",{className:"wd-strip","aria-label":"\u81EA\u9009\u884C\u60C5"},u.default.createElement("span",{className:"wd-strip-label"},u.default.createElement(M,{name:"chart",size:14}),"\u81EA\u9009"),u.default.createElement("div",{className:"wd-strip-list"},e.map(n=>u.default.createElement("button",{key:n.code,type:"button",className:`wd-strip-item ${oe(n.quote?.changePct)}`,onClick:()=>t(n.code)},u.default.createElement("span",{className:"wd-strip-name"},n.quote?.name??n.name),u.default.createElement("b",null,n.quote?.price??"\u2014"),u.default.createElement("small",null,ge(n.quote?.changePct))))),u.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({view:"market"})},"\u884C\u60C5\u9875")):null}function wt(){let e=$(N=>N.state),t=$(N=>N.quotes),n=$(N=>N.brief),a=$(N=>N.tick),[r,i]=u.default.useState(!1),s=u.default.useMemo(()=>new Date,[a]),o=e.events,c=e.tasks,m=o.filter(N=>V(N.start)===V(s)&&N.status!=="cancelled"),g=c.filter(N=>!N.done),p=e.mails.filter(N=>N.unread&&!N.sent).sort((N,k)=>Date.parse(k.date)-Date.parse(N.date)),l=m.filter(N=>new Date(N.end)>s&&!N.allDay).sort((N,k)=>new Date(N.start)-new Date(k.start))[0],S=e.watchlist.map(N=>({...N,quote:t[N.code]}));return u.default.createElement("div",{className:"wd-page wd-today"},u.default.createElement("header",{className:"wd-hero"},u.default.createElement("div",{className:"wd-hero-top"},u.default.createElement("div",null,u.default.createElement("p",{className:"wd-hero-date"},s.getFullYear()," \xB7 ",s.getMonth()+1," \u6708 ",s.getDate()," \u65E5 \xB7 ",Ie[(s.getDay()+6)%7]),u.default.createElement("h1",{className:"wd-hero-line"},"\u4ECA\u5929 ",u.default.createElement("b",null,m.length)," \u4E2A\u4F1A\uFF0C",u.default.createElement("b",null,g.length)," \u6761\u5F85\u529E\uFF0C",u.default.createElement("b",null,p.length)," \u5C01\u672A\u8BFB\u3002")),u.default.createElement("span",{className:"wd-stamp is-today","aria-hidden":"true",title:"\u4ECA\u5929"},u.default.createElement("b",null,s.getDate()),u.default.createElement("small",null,s.getMonth()+1," \u6708"))),l?u.default.createElement("p",{className:"wd-hero-next"},u.default.createElement(M,{name:"clock",size:14}),new Date(l.start)<=s?"\u6B63\u5728\u8FDB\u884C\uFF1A":"\u4E0B\u4E00\u4EF6\uFF1A",u.default.createElement("b",null,P(l.start))," ",l.title,u.default.createElement("span",{className:"wd-muted"},"\xB7 ",new Date(l.start)<=s?`\u8FD8\u6709 ${Math.max(0,Math.round((new Date(l.end)-s)/6e4))} \u5206\u949F`:se(l.start,s))):m.length?u.default.createElement("p",{className:"wd-hero-next"},"\u4ECA\u5929\u7684\u4F1A\u8BAE\u90FD\u7ED3\u675F\u4E86\u3002"):u.default.createElement("p",{className:"wd-hero-next"},"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392\uFF0C\u9002\u5408\u63A8\u8FDB\u4E00\u4EF6\u91CD\u8981\u7684\u4E8B\u3002"),u.default.createElement("div",{className:"wd-hero-actions"},u.default.createElement("button",{type:"button",className:"wd-btn is-primary",disabled:r,onClick:async()=>{i(!0),await dt(),i(!1)}},u.default.createElement(M,{name:"spark",size:14}),r?"\u6B63\u5728\u5199\u2026":n?"\u91CD\u65B0\u751F\u6210\u6668\u62A5":"\u751F\u6210\u6668\u62A5"),u.default.createElement("button",{type:"button",className:"wd-btn",onClick:()=>ft()},u.default.createElement(M,{name:"calendar",size:14}),"\u65B0\u5EFA\u65E5\u7A0B"),u.default.createElement("button",{type:"button",className:"wd-btn",onClick:()=>y({view:"mail",composer:{to:"",cc:"",subject:"",text:""}})},u.default.createElement(M,{name:"mail",size:14}),"\u5199\u90AE\u4EF6"))),u.default.createElement("div",{className:"wd-today-grid"},u.default.createElement("div",{className:"wd-today-left"},u.default.createElement(Zn,{events:o,now:s}),u.default.createElement("section",{className:"wd-card wd-brief-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u6668\u62A5"),n?u.default.createElement("span",{className:"wd-card-meta"},n.engine==="local"?"\u6A21\u677F\u62FC\u88C5":"\u6A21\u578B\u751F\u6210"," \xB7 ",P(n.createdAt)):null),n?u.default.createElement(Qn,{text:n.text}):u.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u6668\u62A5\u3002\u70B9\u4E0A\u9762\u7684\u300C\u751F\u6210\u6668\u62A5\u300D\uFF0C\u628A\u4ECA\u5929\u7684\u4F1A\u3001\u90AE\u4EF6\u548C\u884C\u60C5\u8BFB\u6210\u4E00\u6BB5\u8BDD\u3002")),u.default.createElement(ta,{events:e.events,now:s})),u.default.createElement("div",{className:"wd-today-right"},u.default.createElement(Rn,{mails:p}),u.default.createElement(ea,{tasks:c}),u.default.createElement(na,{positions:e.positions,quotes:t}))),u.default.createElement(aa,{rows:S,onOpen:N=>y({view:"market",minuteCode:N})}))}var me=8,Qe=21,De=1.05,Xt=(Qe-me)*60*De;function gt(e,t,n){return Math.min(n,Math.max(t,e))}function ia(e,t){let n=mt(e,t);y({dialog:{title:"\u65B0\u5EFA\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:"",start:je(n),minutes:45,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0,placeholder:"\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248\u7A3F"},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"}],onSubmit:a=>{let r=new Date(a.start),i=Math.max(5,Number(a.minutes)||45);U([{op:"add_event",title:a.title,start:r.toISOString(),end:new Date(r.getTime()+i*6e4).toISOString(),location:a.location??""}],{label:"\u65B0\u5EFA\u65E5\u7A0B"})}}})}function ra({weekStart:e,events:t,now:n}){let a=z.default.useRef(null),r=z.default.useRef(null),[,i]=z.default.useReducer(x=>x+1,0),s=Array.from({length:7},(x,C)=>Se(e,C)),o=V(n),c=Array.from({length:Qe-me},(x,C)=>me+C),m=z.default.useMemo(()=>{let x=new Map;for(let C of s){let B=V(C),L=t.filter(ne=>ne.status!=="cancelled"&&V(ne.start)===B);x.set(B,Kt(L))}return x},[t,e]),g=x=>(ut(x)-me*60)*De,p=(x,C)=>Math.max(20,(new Date(C)-new Date(x))/6e4*De-2),l=(x,C)=>{if(x.target.closest(".wd-cal-event"))return;let B=a.current.getBoundingClientRect(),L=gt(Math.round(((x.clientY-B.top)/De+me*60)/15)*15,me*60,Qe*60-15);ia(C,L)},S=(x,C)=>{if(x.button!==0)return;x.stopPropagation();let B=a.current.getBoundingClientRect(),L=new Date(C.end)-new Date(C.start);r.current={id:C.id,dayIndex:s.findIndex(K=>V(K)===V(C.start)),minutes:ut(C.start),moved:!1,span:L,startX:x.clientX,startY:x.clientY};let ne=K=>{let R=r.current;R&&(!R.moved&&Math.hypot(K.clientX-R.startX,K.clientY-R.startY)<4||(R.moved=!0,R.dayIndex=gt(Math.floor((K.clientX-B.left)/(B.width/7)),0,6),R.minutes=gt(Math.round(((K.clientY-B.top)/De+me*60)/15)*15,me*60,Qe*60-15),i()))},Q=async()=>{window.removeEventListener("pointermove",ne),window.removeEventListener("pointerup",Q);let K=r.current;if(r.current=null,i(),!K?.moved)return;let R=s[K.dayIndex],O=mt(R,K.minutes);await U([{op:"update_event",id:K.id,start:O.toISOString(),end:new Date(O.getTime()+K.span).toISOString()}],{label:"\u79FB\u52A8\u65E5\u7A0B",silent:!0})};window.addEventListener("pointermove",ne),window.addEventListener("pointerup",Q)},N=g(n),k=s.some(x=>V(x)===o)&&N>=0&&N<=Xt;return z.default.createElement("section",{className:"wd-card wd-cal"},z.default.createElement("header",{className:"wd-cal-head"},z.default.createElement("div",{className:"wd-cal-days"},z.default.createElement("span",{className:"wd-cal-gutter"}),s.map(x=>z.default.createElement("div",{key:V(x),className:`wd-cal-day ${V(x)===o?"is-today":""}`},z.default.createElement("small",null,Ie[(x.getDay()+6)%7]),z.default.createElement("b",null,x.getDate()))))),z.default.createElement("div",{className:"wd-cal-scroll"},z.default.createElement("div",{className:"wd-cal-body",ref:a,style:{height:Xt}},z.default.createElement("div",{className:"wd-cal-gutter"},c.map(x=>z.default.createElement("span",{key:x,style:{top:(x-me)*60*De}},String(x).padStart(2,"0"),":00"))),s.map(x=>{let C=V(x),B=m.get(C)??[];return z.default.createElement("div",{key:C,className:`wd-cal-col ${C===o?"is-today":""}`,onClick:L=>l(L,x)},B.map(({event:L,lane:ne,lanes:Q})=>{let K=r.current?.id===L.id&&r.current?.moved,R=K?(r.current.minutes-me*60)*De:g(L.start),O=Q>1?ne/Q*100:0,G=Q>1?100/Q-1:100;return z.default.createElement("article",{key:L.id,className:`wd-cal-event tone-${L.color??"blue"} ${L.status==="tentative"?"is-tentative":""} ${K?"is-dragging":""}`,style:{top:R,height:p(L.start,L.end),left:`${O}%`,width:`${G}%`},onPointerDown:X=>S(X,L),onDoubleClick:()=>Le(L),title:`${P(L.start)} ${L.title}`},z.default.createElement("b",null,L.title),z.default.createElement("span",null,P(L.start)),Q>1?z.default.createElement("i",{className:"wd-cal-conflict",title:"\u548C\u53E6\u4E00\u4E2A\u4F1A\u51B2\u7A81"},"\u51B2\u7A81"):null)}),k&&C===o?z.default.createElement("div",{className:"wd-cal-now",style:{top:N}},z.default.createElement("i",null)):null)}))),z.default.createElement("footer",{className:"wd-cal-foot"},z.default.createElement("span",{className:"wd-muted"},"\u62D6\u52A8\u4F1A\u8BAE\u6539\u65F6\u95F4\uFF0C\u53CC\u51FB\u7F16\u8F91\uFF1B\u7A7A\u767D\u5904\u70B9\u4E00\u4E0B\u6309\u90A3\u4E2A\u65F6\u95F4\u65B0\u5EFA\u3002")))}function sa({cursor:e,events:t,now:n,onOpenDay:a}){let r=e.getFullYear(),i=e.getMonth(),s=new Date(r,i,1),o=Ae(s),c=Array.from({length:42},(p,l)=>Se(o,l)),m=c[35].getMonth()===i?c:c.slice(0,35),g=V(n);return z.default.createElement("section",{className:"wd-card wd-month"},z.default.createElement("div",{className:"wd-month-week"},Ie.map(p=>z.default.createElement("span",{key:p},p))),z.default.createElement("div",{className:"wd-month-grid"},m.map(p=>{let l=V(p),S=t.filter(N=>N.status!=="cancelled"&&V(N.start)===l);return z.default.createElement("div",{key:l,className:`wd-month-cell ${p.getMonth()!==i?"is-outside":""} ${l===g?"is-today":""}`,onClick:()=>a(p)},z.default.createElement("span",{className:"wd-month-date"},p.getDate()),S.slice(0,3).map(N=>z.default.createElement("button",{key:N.id,type:"button",className:`wd-month-event tone-${N.color??"blue"}`,onClick:k=>{k.stopPropagation(),Le(N)}},z.default.createElement("time",null,P(N.start)),N.title)),S.length>3?z.default.createElement("span",{className:"wd-month-more"},"\u8FD8\u6709 ",S.length-3," \u4E2A"):null)})))}function oa(){y({dialog:{title:"\u5BFC\u5165 .ics \u65E5\u5386",submitLabel:"\u5BFC\u5165",width:560,fields:[{name:"text",label:"\u628A .ics \u6587\u4EF6\u91CC\u7684\u5185\u5BB9\u8D34\u8FDB\u6765\uFF08\u4E5F\u53EF\u4EE5\u76F4\u63A5\u62D6\u6587\u4EF6\u5230\u7A97\u53E3\uFF09",type:"textarea",rows:9,required:!0,placeholder:"BEGIN:VCALENDAR\u2026"}],onSubmit:e=>Ht(e.text)}})}function la({tasks:e}){let t=e.filter(n=>!n.done);return z.default.createElement("aside",{className:"wd-cal-rail"},z.default.createElement("section",{className:"wd-card"},z.default.createElement("header",{className:"wd-card-head"},z.default.createElement("h2",null,"\u5F85\u529E"),z.default.createElement("span",{className:"wd-card-meta"},t.length," \u6761"),z.default.createElement("span",{style:{flex:1}}),z.default.createElement(Y,{icon:"plus",label:"\u52A0\u5F85\u529E",onClick:()=>Pe()})),t.length===0?z.default.createElement("p",{className:"wd-card-empty"},"\u6CA1\u6709\u5F85\u529E\u3002"):z.default.createElement("ul",{className:"wd-tasks"},t.slice(0,8).map(n=>z.default.createElement("li",{key:n.id},z.default.createElement("button",{type:"button",className:"wd-check","aria-label":"\u6807\u8BB0\u5B8C\u6210",onClick:()=>U([{op:"toggle_task",id:n.id}],{label:"\u66F4\u65B0\u5F85\u529E",silent:!0})}),z.default.createElement("span",{className:"wd-task-title"},n.title),n.due?z.default.createElement("time",null,qe(n.due)):null)))),z.default.createElement("section",{className:"wd-card"},z.default.createElement("header",{className:"wd-card-head"},z.default.createElement("h2",null,"\u65E5\u5386")),z.default.createElement("div",{className:"wd-cal-actions"},z.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:oa},z.default.createElement(M,{name:"archive",size:13}),"\u5BFC\u5165 .ics"),z.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:_t},z.default.createElement(M,{name:"external",size:13}),"\u5BFC\u51FA .ics")),z.default.createElement("p",{className:"wd-muted wd-cal-hint"},"\u5BFC\u51FA\u7684\u6587\u4EF6\u53EF\u4EE5\u76F4\u63A5\u5BFC\u5165\u4F01\u4E1A\u5FAE\u4FE1\u3001\u98DE\u4E66\u6216\u624B\u673A\u65E5\u5386\uFF1B\u91CD\u590D\u65E5\u7A0B\uFF08RRULE\uFF09\u53EA\u5BFC\u5165\u7B2C\u4E00\u6761\u3002")))}function Qt(){let e=$(p=>p.state),t=$(p=>p.tick),n=$(p=>p.calendarMode),[a,r]=z.default.useState(()=>Ae(new Date)),[i,s]=z.default.useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1)),o=z.default.useMemo(()=>new Date,[t]),c=Ce(o),m=Se(a,6),g=e.events.filter(p=>p.status!=="cancelled"&&new Date(p.end)>o).sort((p,l)=>new Date(p.start)-new Date(l.start))[0];return z.default.createElement("div",{className:"wd-page wd-cal-page"},z.default.createElement("header",{className:"wd-page-head"},z.default.createElement("div",null,z.default.createElement("h1",null,n==="week"?`${a.getMonth()+1} \u6708 ${a.getDate()} \u65E5 \u2013 ${m.getMonth()+1} \u6708 ${m.getDate()} \u65E5`:`${i.getFullYear()} \u5E74 ${Yt[i.getMonth()]}`),z.default.createElement("p",{className:"wd-page-sub"},g?`\u4E0B\u4E00\u4EF6\uFF1A${qe(g.start)} ${P(g.start)} ${g.title}\uFF08${new Date(g.start)<=o?`\u8FDB\u884C\u4E2D\uFF0C\u8FD8\u6709 ${Math.max(0,Math.round((new Date(g.end)-o)/6e4))} \u5206\u949F`:se(g.start,o)}\uFF09`:"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392")),z.default.createElement("span",{className:"wd-stamp is-sm is-today","aria-hidden":"true",title:`${a.getMonth()+1} \u6708`},z.default.createElement("b",null,a.getMonth()+1),z.default.createElement("small",null,"\u6708")),z.default.createElement("span",{style:{flex:1}}),z.default.createElement(Y,{icon:"chevL",label:n==="week"?"\u4E0A\u4E00\u5468":"\u4E0A\u4E2A\u6708",onClick:()=>{n==="week"?r(Se(a,-7)):s(new Date(i.getFullYear(),i.getMonth()-1,1))}}),z.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>{r(Ae(new Date)),s(new Date(o.getFullYear(),o.getMonth(),1))}},"\u4ECA\u5929"),z.default.createElement(Y,{icon:"chevR",label:n==="week"?"\u4E0B\u4E00\u5468":"\u4E0B\u4E2A\u6708",onClick:()=>{n==="week"?r(Se(a,7)):s(new Date(i.getFullYear(),i.getMonth()+1,1))}}),z.default.createElement(Ge,{label:"\u89C6\u56FE",value:n,onChange:p=>y({calendarMode:p}),options:[{value:"week",label:"\u5468"},{value:"month",label:"\u6708"}]})),z.default.createElement("div",{className:"wd-cal-wrap"},n==="week"?z.default.createElement(ra,{weekStart:a,events:e.events,now:o}):z.default.createElement(sa,{cursor:i,events:e.events,now:o,onOpenDay:p=>{r(Ae(p)),y({calendarMode:"week"})}}),z.default.createElement(la,{tasks:e.tasks})))}var E=ee(require("react"),1);var T=ee(require("react"),1);var da={running:!1,openState:"cold"},pa={ids:[],byId:{},phase:"empty",projectionsBySession:{}};function Zt(e){return(e??[]).filter(t=>t?.type==="text"&&typeof t.text=="string").map(t=>t.text).join("")}function ca(e){return(e??[]).filter(t=>t?.type==="tool-call").map(t=>t.name).filter(Boolean)}function ua(e){let t=[];for(let n of e??[]){if(n?.type!=="event")continue;let a=n.event,r=a?.seq??0;if(a?.type==="user/message"){let i=a.data?.source?.kind;if(i&&i!=="user")continue;let s=Zt(a.data?.content).trim();s&&t.push({id:`u${r}`,role:"user",text:s})}else if(a?.type==="assistant/message"){let i=a.data?.message,s=Zt(i?.content).trim(),o=ca(i?.content);(s||o.length)&&t.push({id:`a${r}`,role:"assistant",text:s,tools:o})}}return t.slice(-40)}function ma(e){let t=T.default.useCallback(a=>e?e.subscribe(a):()=>{},[e]),n=T.default.useCallback(()=>e?e.getSnapshot():da,[e]);return T.default.useSyncExternalStore(t,n)}function fa(){try{let e=new URL(window.location.href),t=e.searchParams.get("session")||e.searchParams.get("sessionId");return t||(/(?:session|chat)[/=]([A-Za-z0-9_-]{6,})/.exec(`${e.pathname}${e.hash}`)?.[1]??null)}catch{return null}}function wa(e){if(!e)return!1;let t=/(明天|后天|今天|周[一二三四五六日天]|下周|\d{1,2}\s*[点:：]\s*\d{0,2}|\d{1,2}\s*月\s*\d{1,2}\s*[日号])/,n=/(会|安排|约|提醒|待办|截止|之前|前|记得|排期|复盘|交付)/;return t.test(e)&&n.test(e)}function Rt({useSessions:e,head:t}){let n=T.default.useMemo(()=>Oe()?.get?.("sessions")?.list??null,[]),a=T.default.useSyncExternalStore(T.default.useCallback(O=>n?n.subscribe(O):()=>{},[n]),T.default.useCallback(()=>n?n.getSnapshot():pa,[n])),[r,i]=T.default.useState(null),[s,o]=T.default.useState(null),[c,m]=T.default.useState([]),[g,p]=T.default.useState(null),[l,S]=T.default.useState(""),[N,k]=T.default.useState(!1),x=T.default.useRef(null),C=T.default.useMemo(()=>(a?.ids??[]).map(G=>({id:G,...a.byId?.[G]??{}})).sort((G,X)=>Number(G.blank??!1)-Number(X.blank??!1)||(X.updatedAt??0)-(G.updatedAt??0)),[a]),B=T.default.useMemo(()=>fa(),[]),L=(r&&C.some(O=>O.id===r)?r:null)??(B&&C.some(O=>O.id===B)?B:null)??C[0]?.id??null;T.default.useEffect(()=>{if(!L)return;let O=Oe()?.get("sessions");if(!O?.retain){p("\u8FD9\u4E2A\u73AF\u5883\u6CA1\u6709 sessions \u670D\u52A1\uFF0C\u4F1A\u8BDD\u955C\u50CF\u4E0D\u53EF\u7528");return}let G=!1,X=null,Fe=null;o(null),m([]),p(null);try{X=O.retain(L,{source:"work-desk"}),X.ready.then(de=>{if(G)return;o(de);let ve=()=>m(de.eventSource.getSnapshot().entries);ve(),Fe=de.eventSource.subscribe(ve)}).catch(de=>{G||p(de?.message??"\u6253\u4E0D\u5F00\u8FD9\u6761\u4F1A\u8BDD")})}catch(de){p(de?.message??"\u6253\u4E0D\u5F00\u8FD9\u6761\u4F1A\u8BDD")}return()=>{G=!0;try{Fe?.()}catch{}try{X?.release?.()}catch{}}},[L]);let ne=T.default.useMemo(()=>ua(c),[c]),Q=ma(s?.session??null);T.default.useEffect(()=>{x.current&&x.current.scrollTo({top:x.current.scrollHeight,behavior:"smooth"})},[ne.length,Q?.running]);let K=async O=>{let G=String(O??"").trim();if(!(!G||!s||N)){k(!0),O===void 0&&S("");try{let X=await s.session.prompt([{type:"text",text:G}],"queue");X&&X.ok===!1&&p(X.error?.message??"\u53D1\u9001\u5931\u8D25")}catch(X){p(X?.message??"\u53D1\u9001\u5931\u8D25")}finally{k(!1)}}},R=()=>K(l);return T.default.createElement("div",{className:"wd-chat"},T.default.createElement("header",{className:"wd-dock-head","data-window-drag":""},t,T.default.createElement("span",{className:"wd-engine is-live",title:"\u8FD9\u6761\u5C31\u662F DSH \u7684\u4F1A\u8BDD\uFF0C\u4E0D\u662F\u63D2\u4EF6\u81EA\u5DF1\u7684\u6A21\u578B\u8C03\u7528"},T.default.createElement("i",null),Q?.running?"\u8FD0\u884C\u4E2D":"\u4F1A\u8BDD"),T.default.createElement("span",{style:{flex:1}}),C.length>1?T.default.createElement("select",{className:"wd-session-pick","aria-label":"\u9009\u62E9\u4F1A\u8BDD",value:L??"",onChange:O=>i(O.target.value)},C.slice(0,12).map(O=>T.default.createElement("option",{key:O.id,value:O.id},(O.title??O.id).slice(0,18)))):null,T.default.createElement(Y,{icon:"close",label:"\u6536\u8D77\u5BF9\u8BDD",onClick:()=>y({dockOpen:!1})})),T.default.createElement("div",{className:"wd-dock-scroll",ref:x,"aria-live":"polite"},g?T.default.createElement("p",{className:"wd-msg-error"},g):null,!s&&!g?T.default.createElement("div",{className:"wd-dock-intro"},T.default.createElement("p",{className:"wd-shimmer"},"\u6B63\u5728\u63A5\u4E0A\u4F1A\u8BDD\u2026")):null,s&&ne.length===0?T.default.createElement("div",{className:"wd-dock-intro"},T.default.createElement("h3",null,"\u8FD9\u91CC\u5C31\u662F DSH \u7684\u4F1A\u8BDD\u3002"),T.default.createElement("p",null,"\u4F60\u5728\u8FD9\u91CC\u8BF4\u7684\u6BCF\u4E00\u53E5\u90FD\u4F1A\u8FDB\u540C\u4E00\u6761\u4F1A\u8BDD\uFF0CAgent \u52A0\u65E5\u7A0B\u3001\u8BB0\u5F85\u529E\uFF0C\u5DE5\u4F5C\u53F0\u4E5F\u4F1A\u540C\u6B65\u663E\u793A\u3002")):null,ne.map(O=>T.default.createElement("div",{key:O.id,className:`wd-msg is-${O.role==="user"?"user":"bot"}`},O.text?T.default.createElement("p",null,O.text):null,O.tools?.length?T.default.createElement("p",{className:"wd-msg-tool"},T.default.createElement(M,{name:"bolt",size:11}),O.tools.join(" \xB7 ")):null,O.role==="assistant"&&wa(O.text)?T.default.createElement("button",{type:"button",className:"wd-msg-action",onClick:()=>K(`\u628A\u4E0A\u9762\u8FD9\u6761\u5B89\u6392\u843D\u5230\u5DE5\u4F5C\u53F0\uFF1A${O.text.slice(0,300)}\u3002\u7528 work_desk_calendar \u6216 work_desk_task \u76F4\u63A5\u52A0\uFF0C\u4E0D\u7528\u518D\u95EE\u6211\u3002`)},T.default.createElement(M,{name:"plus",size:11}),"\u843D\u5230\u5DE5\u4F5C\u53F0"):null)),Q?.running?T.default.createElement("div",{className:"wd-msg is-bot"},T.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u5904\u7406\u2026\u2026")):null),T.default.createElement("form",{className:"wd-composer",onSubmit:O=>{O.preventDefault(),R()}},T.default.createElement("textarea",{rows:1,"aria-label":"\u7ED9\u4F1A\u8BDD\u53D1\u6D88\u606F",value:l,placeholder:s?"\u8BF4\u4E00\u53E5\u8BDD\uFF0C\u8FDB\u7684\u662F DSH \u540C\u4E00\u6761\u4F1A\u8BDD":"\u6B63\u5728\u63A5\u4E0A\u4F1A\u8BDD\u2026",disabled:!s||N,onChange:O=>S(O.target.value),onKeyDown:O=>{O.key==="Enter"&&!O.shiftKey&&!O.nativeEvent.isComposing&&(O.preventDefault(),R())}}),T.default.createElement("button",{type:"submit",className:"wd-send","aria-label":"\u53D1\u9001",disabled:!l.trim()||!s||N},T.default.createElement(M,{name:"send",size:15}))))}var ga=["\u4ECA\u5929\u6709\u51E0\u4E2A\u4F1A\uFF1F","\u660E\u5929\u4E0B\u5348\u4E09\u70B9\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248\uFF0C40 \u5206\u949F","\u8BB0\u4E00\u4E0B\uFF1A\u56DE\u5468\u821F\u7684\u6539\u7248\u610F\u89C1\uFF0C\u4ECA\u665A\u524D","\u8305\u53F0\u73B0\u5728\u591A\u5C11\uFF1F","\u5E2E\u6211\u5199\u5C01\u90AE\u4EF6\u7ED9\u738B\u5F3A\uFF0C\u8BF4\u7070\u5EA6\u540D\u5355\u5468\u4E8C\u4E0B\u73ED\u524D\u7ED9"];function ba({receipt:e}){return E.default.createElement("div",{className:"wd-receipt"},E.default.createElement("span",{className:"wd-receipt-check"},E.default.createElement(M,{name:"check",size:10,stroke:2.4})),E.default.createElement("span",null,e.text))}function ha({message:e,canUndo:t}){return e.role==="user"?E.default.createElement("div",{className:"wd-msg is-user"},e.text):E.default.createElement("div",{className:"wd-msg is-bot"},E.default.createElement("p",null,e.text),e.receipts?.map((n,a)=>E.default.createElement(ba,{key:a,receipt:n})),e.errors?.map((n,a)=>E.default.createElement("p",{key:a,className:"wd-msg-error"},n)),e.notice?E.default.createElement("p",{className:"wd-msg-note"},e.notice):null,E.default.createElement("footer",null,E.default.createElement("span",null,e.engine==="local"?"\u672C\u5730\u89C4\u5219":""),t?E.default.createElement("button",{type:"button",onClick:Ne},E.default.createElement(M,{name:"undo",size:11}),"\u64A4\u9500"):null))}function xa({head:e,suggestions:t,placeholder:n="\u60F3\u8BA9\u6211\u505A\u4EC0\u4E48\uFF0C\u76F4\u63A5\u8BF4",intro:a=!0}){let r=$(l=>l.state.chat??[]),i=$(l=>l.thinking),[s,o]=E.default.useState(""),c=E.default.useRef(null),m=E.default.useRef(null);E.default.useEffect(()=>{c.current&&c.current.scrollTo({top:c.current.scrollHeight,behavior:"smooth"})},[r.length,i]),E.default.useLayoutEffect(()=>{let l=m.current;l&&(l.style.height="auto",l.style.height=`${Math.min(l.scrollHeight,132)}px`)},[s]);let g=l=>{let S=String(l??s).trim();!S||i||(o(""),Ft(S))},p=[...r].reverse().find(l=>l.role==="assistant");return E.default.createElement("div",{className:"wd-chat"},E.default.createElement("header",{className:"wd-dock-head","data-window-drag":""},e),E.default.createElement("div",{className:"wd-dock-scroll",ref:c,"aria-live":"polite"},r.length===0&&a?E.default.createElement("div",{className:"wd-dock-intro"},E.default.createElement("h3",null,"\u8BF4\u4E00\u53E5\u8BDD\uFF0C",E.default.createElement("br",null),"\u65E5\u7A0B\u3001\u90AE\u4EF6\u548C\u6301\u4ED3\u6211\u4E00\u8D77\u6539\u3002"),E.default.createElement("p",null,"\u6BCF\u4E00\u6B65\u90FD\u80FD\u64A4\u9500\uFF1B\u53D1\u90AE\u4EF6\u53EA\u4F1A\u5199\u8349\u7A3F\uFF0C\u53D1\u4E0D\u53D1\u7531\u4F60\u70B9\u3002")):r.map(l=>E.default.createElement(ha,{key:l.id,message:l,canUndo:l===p&&l.undoable})),i?E.default.createElement("div",{className:"wd-msg is-bot"},E.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u5904\u7406\u2026\u2026")):null),t?.length?E.default.createElement("div",{className:"wd-suggest"},t.slice(0,r.length?2:4).map(l=>E.default.createElement("button",{type:"button",key:l,onClick:()=>g(l),disabled:i},l))):null,E.default.createElement("form",{className:"wd-composer",onSubmit:l=>{l.preventDefault(),g()}},E.default.createElement("textarea",{ref:m,rows:1,"aria-label":"\u7ED9\u52A9\u624B\u53D1\u6D88\u606F",value:s,placeholder:n,onChange:l=>o(l.target.value),onKeyDown:l=>{l.key==="Enter"&&!l.shiftKey&&!l.nativeEvent.isComposing&&(l.preventDefault(),g())}}),E.default.createElement("button",{type:"submit",className:"wd-send","aria-label":"\u53D1\u9001",disabled:!s.trim()||i},E.default.createElement(M,{name:"send",size:15}))))}function va(){let e=$(a=>a.model),t=$(a=>a.modelOk),n=$(a=>a.modelError);return E.default.createElement(xa,{head:E.default.createElement(E.default.Fragment,null,E.default.createElement("h2",null,"\u52A9\u624B"),E.default.createElement("span",{className:`wd-engine ${e?t===!1?"is-down":"is-live":""}`,title:n||(e?`\u4F7F\u7528 ${e}`:"\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u6A21\u578B\uFF0C\u53EA\u80FD\u5904\u7406\u5E38\u89C1\u8BF4\u6CD5")},E.default.createElement("i",null),e??"\u672C\u5730\u89C4\u5219"),E.default.createElement("span",{style:{flex:1}}),E.default.createElement(Y,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>y({settingsOpen:!0})}),E.default.createElement(Y,{icon:"close",label:"\u6536\u8D77\u5BF9\u8BDD",onClick:()=>y({dockOpen:!1})})),suggestions:ga,placeholder:"\u6BD4\u5982\uFF1A\u660E\u5929\u4E0B\u5348\u4E09\u70B9\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248"})}function en({useSessions:e}){let t=Oe()?.get?.("sessions");return!!t?.retain&&!!t?.list?E.default.createElement("aside",{className:"wd-dock","aria-label":"DSH \u4F1A\u8BDD"},E.default.createElement(Rt,{useSessions:e,head:E.default.createElement(E.default.Fragment,null,E.default.createElement("h2",null,"\u4F1A\u8BDD"),E.default.createElement(Y,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>y({settingsOpen:!0})}))})):E.default.createElement("aside",{className:"wd-dock","aria-label":"\u5BF9\u8BDD\u52A9\u624B"},E.default.createElement(va,null))}var h=ee(require("react"),1);var d=ee(require("react"),1);var $e={s:1,m:2,l:5};function xe(e,t,n){return d.default.createElement("footer",{className:"fw-foot"},d.default.createElement("span",null,e),t?d.default.createElement("button",{type:"button",onClick:n},t," \u2197"):null)}function ya(e,t){let n=t.toDateString();return e.events.filter(a=>a.status!=="cancelled"&&new Date(a.start).toDateString()===n).sort((a,r)=>new Date(a.start)-new Date(r.start))}function tn(e,t){return e.events.filter(n=>n.status!=="cancelled"&&new Date(n.end??n.start)>t).sort((n,a)=>new Date(n.start)-new Date(a.start))[0]}function ka(e,t){let{state:n,now:a,size:r,openCalendar:i}=t,s=ya(n,a),o=tn(n,a),c=n.events.filter(m=>m.status!=="cancelled"&&new Date(m.start)>a&&new Date(m.start).toDateString()!==a.toDateString()).sort((m,g)=>new Date(m.start)-new Date(g.start)).slice(0,3);return r==="s"?d.default.createElement("button",{type:"button",className:"fw-link",onClick:i},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},a.getDate()),d.default.createElement("div",null,d.default.createElement("strong",null,s.length?`${s.length} \u573A\u4F1A\u8BAE`:"\u4ECA\u5929\u6CA1\u6709\u4F1A"),d.default.createElement("small",null,o?`\u4E0B\u4E00\u573A ${P(o.start)}`:"\u65E5\u5386\u7A7A\u7740")))):r==="m"?d.default.createElement("button",{type:"button",className:"fw-link",onClick:i},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},a.getDate()),d.default.createElement("div",null,d.default.createElement("strong",null,o?o.title:"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392"),d.default.createElement("small",null,o?`${P(o.start)} \xB7 ${se(o.start,a)}`:`${s.length} \u573A\u4F1A\u8BAE\u5DF2\u7ED3\u675F`)))):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-hero",style:{flex:"none",marginBottom:2}},d.default.createElement("span",{className:"fw-display"},a.getDate()),d.default.createElement("div",null,d.default.createElement("strong",null,o?o.title:"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392"),d.default.createElement("small",null,o?`${P(o.start)} \xB7 ${se(o.start,a)}`:`\u5171 ${s.length} \u573A`))),d.default.createElement("hr",{className:"fw-rule"}),d.default.createElement("div",{className:"fw-list"},s.length===0?d.default.createElement("p",{className:"fw-empty"},"\u4ECA\u5929\u6CA1\u6709\u4F1A\u8BAE\u3002"):s.slice(0,4).map(m=>{let g=new Date(m.start)<=a&&new Date(m.end??m.start)>a,p=new Date(m.end??m.start)<=a;return d.default.createElement("div",{key:m.id,className:`fw-row ${g?"is-now":""} ${p?"is-muted":""}`},d.default.createElement("time",null,P(m.start)),d.default.createElement("span",{className:"fw-dot"}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,m.title),d.default.createElement("small",null,m.location||(g?"\u8FDB\u884C\u4E2D":""))))}),c.length?d.default.createElement("hr",{className:"fw-rule",style:{margin:"6px 0"}}):null,c.map(m=>d.default.createElement("div",{key:m.id,className:"fw-row"},d.default.createElement("time",null,ae(m.start,a)),d.default.createElement("span",{className:"fw-dot",style:{background:"transparent"}}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,m.title),d.default.createElement("small",null,P(m.start)))))),xe(`${s.length} \u573A \xB7 \u65E5\u5386`,"\u6253\u5F00",i))}function Na(e,t){let{state:n,size:a,toggleTask:r,openToday:i}=t,s=n.tasks.filter(c=>!c.done),o=s.slice().sort((c,m)=>(c.due?new Date(c.due):1/0)-(m.due?new Date(m.due):1/0))[0];return a==="s"?d.default.createElement("button",{type:"button",className:"fw-link",onClick:i},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},s.length),d.default.createElement("div",null,d.default.createElement("strong",null,"\u6761\u5F85\u529E"),d.default.createElement("small",null,o?o.due?`${ae(o.due)} ${P(o.due)}`:"\u6CA1\u6709\u622A\u6B62":"\u90FD\u505A\u5B8C\u4E86")))):a==="m"?d.default.createElement(d.default.Fragment,null,s.length===0?d.default.createElement("p",{className:"fw-empty"},"\u90FD\u505A\u5B8C\u4E86\u3002"):s.slice(0,$e.m).map(c=>d.default.createElement("div",{key:c.id,className:"fw-row"},d.default.createElement("button",{type:"button",className:"fw-check","aria-pressed":"false","aria-label":`\u5B8C\u6210 ${c.title}`,onClick:()=>r(c.id)}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,c.title)),d.default.createElement("span",{className:"fw-label"},c.due?ae(c.due):"")))):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-list"},s.length===0?d.default.createElement("p",{className:"fw-empty"},"\u90FD\u505A\u5B8C\u4E86\u3002"):s.slice(0,$e.l).map(c=>d.default.createElement("div",{key:c.id,className:"fw-row"},d.default.createElement("button",{type:"button",className:"fw-check","aria-pressed":"false","aria-label":`\u5B8C\u6210 ${c.title}`,onClick:()=>r(c.id)}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,c.title)),d.default.createElement("span",{className:"fw-label"},c.due?`${ae(c.due)}`:"\u65E0\u622A\u6B62")))),xe(`${s.length} \u6761\u672A\u5B8C\u6210`,"\u5168\u90E8",i))}function za(e,t){let{state:n,size:a,openMail:r,mail:i}=t,s=n.mails.filter(g=>g.unread),o=n.mails.slice().sort((g,p)=>new Date(p.date)-new Date(g.date)),c=i?.provider==="dsh-email"?"\u672C\u5730\u672A\u67E5\u770B":"\u6536\u4EF6\u7BB1";if(a==="s")return d.default.createElement("button",{type:"button",className:"fw-link",onClick:()=>r(null)},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},s.length),d.default.createElement("div",null,d.default.createElement("strong",null,c),d.default.createElement("small",null,o[0]?o[0].from?.name||"\u65B0\u90AE\u4EF6":"\u6CA1\u6709\u90AE\u4EF6"))));let m=o.slice(0,a==="m"?$e.m:$e.l);return d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-list"},m.length===0?d.default.createElement("p",{className:"fw-empty"},"\u6536\u4EF6\u7BB1\u662F\u7A7A\u7684\u3002"):m.map(g=>d.default.createElement("button",{key:g.id,type:"button",className:"fw-row fw-row-btn",onClick:()=>r(g.id)},d.default.createElement("span",{className:"fw-dot",style:{background:g.unread?void 0:"transparent"}}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,g.subject||"\uFF08\u65E0\u4E3B\u9898\uFF09"),d.default.createElement("small",null,g.from?.name||g.from?.address||"\u672A\u77E5\u53D1\u4EF6\u4EBA")),d.default.createElement("span",{className:"fw-label"},ae(g.date))))),a==="l"?xe(`${s.length} \u5C01\u672C\u5730\u672A\u67E5\u770B \xB7 ${c}`,"\u6253\u5F00\u90AE\u4EF6",()=>r(null)):null)}function Sa(e,t){let{state:n,quotes:a,size:r,openMarket:i}=t,s=n.watchlist.map(o=>({...o,quote:a[o.code]})).filter(o=>o.quote);if(r==="s"){let o=s[0];return o?d.default.createElement("button",{type:"button",className:"fw-link",onClick:i},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},o.quote.price),d.default.createElement("div",null,d.default.createElement("strong",null,o.quote.name||o.name||o.code),d.default.createElement("small",{className:oe(o.quote.changePct)},ge(o.quote.changePct))))):d.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009\u3002")}return d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-list"},s.length===0?d.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009\u3002"):s.slice(0,r==="m"?$e.m:$e.l).map(o=>d.default.createElement("div",{key:o.code,className:"fw-quote"},d.default.createElement("span",{className:"fw-quote-name"},o.quote.name||o.name||o.code),d.default.createElement("span",{className:"fw-num"},le(o.quote.price,2)),d.default.createElement("span",{className:`fw-pct ${oe(o.quote.changePct)}`},ge(o.quote.changePct))))),r==="l"?xe(`${s.length} \u53EA\u81EA\u9009 \xB7 \u793A\u610F\u884C\u60C5`,"\u884C\u60C5\u9875",i):null)}function Da(e,t){let{state:n,size:a,openToday:r}=t,i=n.brief;if(!i)return d.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u6668\u62A5\u3002\u5230\u4ECA\u65E5\u9875\u751F\u6210\u4E00\u4EFD\uFF0C\u628A\u4ECA\u5929\u7684\u4F1A\u8BAE\u3001\u90AE\u4EF6\u548C\u884C\u60C5\u8BFB\u6210\u4E00\u6BB5\u8BDD\u3002");let s=String(i.text||"").split(`
`).filter(g=>g.trim()),o=s[0]?.replace(/^#+\s*/,"")||"\u4ECA\u5929\u5148\u505A\u4EC0\u4E48",c=s.slice(1).join(`
`)||s[0];return d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-brief",style:{"--fw-lines":a==="s"?2:a==="m"?3:8}},a==="l"?d.default.createElement("h3",null,o):null,d.default.createElement("p",{className:"fw-clamp"},a==="l"?c:s.join(" "))),a==="l"?xe(`${i.engine==="local"?"\u6A21\u677F\u62FC\u88C5":"\u6A21\u578B\u751F\u6210"} \xB7 ${P(i.createdAt)}`,"\u4ECA\u65E5\u9875",r):null,a==="s"?d.default.createElement("span",{className:"fw-label"},i.engine==="local"?"\u6A21\u677F":"\u751F\u6210"):null)}function $a(e,t){let{alerts:n,size:a,openToday:r}=t;return n?.length?a==="s"?d.default.createElement("button",{type:"button",className:"fw-link",onClick:r},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display"},n.length),d.default.createElement("div",null,d.default.createElement("strong",null,"\u6761\u63D0\u9192"),d.default.createElement("small",null,n[0].text.slice(0,6))))):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-list"},n.slice(0,a==="m"?$e.m:6).map((i,s)=>d.default.createElement("div",{key:s,className:"fw-row"},d.default.createElement("span",{className:"fw-dot",style:{background:i.level==="down"?"var(--fw-accent)":void 0}}),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,i.text))))),a==="l"?xe(`${n.length} \u6761 \xB7 \u6765\u81EA\u65E5\u7A0B\u4E0E\u884C\u60C5`,"\u4ECA\u65E5\u9875",r):null):d.default.createElement("p",{className:"fw-empty"},"\u6CA1\u6709\u9700\u8981\u63D0\u9192\u7684\u4E8B\u3002")}function Ma(e,t){let{now:n,size:a}=t,r=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`,i=["\u5468\u65E5","\u5468\u4E00","\u5468\u4E8C","\u5468\u4E09","\u5468\u56DB","\u5468\u4E94","\u5468\u516D"][n.getDay()],s=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(n.getFullYear(),0,1))/864e5)+1,o=Math.round((n.getHours()*60+n.getMinutes())/1440*100);return a==="s"?d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display",style:{fontSize:30}},r)):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-hero",style:{flex:"none"}},d.default.createElement("span",{className:"fw-display"},r),d.default.createElement("div",null,d.default.createElement("strong",null,`${n.getMonth()+1} \u6708 ${n.getDate()} \u65E5`),d.default.createElement("small",null,i))),a==="l"?d.default.createElement(d.default.Fragment,null,d.default.createElement("hr",{className:"fw-rule"}),d.default.createElement("div",{className:"fw-label"},"\u7B2C ",s," \u5929 \xB7 \u4ECA\u5929\u5DF2\u8FC7 ",o,"%"),d.default.createElement("div",{className:"fw-track","aria-hidden":"true"},d.default.createElement("i",{style:{width:`${o}%`}}))):null)}function Ca(e,t){let{state:n,now:a,size:r,openCalendar:i}=t,s=tn(n,a);return s?r==="s"?d.default.createElement("button",{type:"button",className:"fw-link",onClick:i},d.default.createElement("div",{className:"fw-hero"},d.default.createElement("span",{className:"fw-display",style:{fontSize:26}},P(s.start)))):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-hero",style:{flex:"none"}},d.default.createElement("span",{className:"fw-display",style:{fontSize:28}},P(s.start)),d.default.createElement("div",null,d.default.createElement("strong",null,s.title),d.default.createElement("small",null,se(s.start,a),s.location?` \xB7 ${s.location}`:""))),r==="l"?d.default.createElement(d.default.Fragment,null,d.default.createElement("hr",{className:"fw-rule"}),d.default.createElement("div",{className:"fw-list"},n.events.filter(o=>o.status!=="cancelled"&&new Date(o.start)>new Date(s.start)).sort((o,c)=>new Date(o.start)-new Date(c.start)).slice(0,3).map(o=>d.default.createElement("div",{key:o.id,className:"fw-row"},d.default.createElement("time",null,ae(o.start,a)),d.default.createElement("div",{className:"fw-row-main"},d.default.createElement("b",null,o.title),d.default.createElement("small",null,P(o.start))))))):null,r==="l"?xe("\u63A5\u4E0B\u6765\u7684\u5B89\u6392","\u65E5\u5386",i):null):d.default.createElement("p",{className:"fw-empty"},"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392\u3002")}function qa(e,t){let{size:n,openToday:a,openCalendar:r,openMail:i,openMarket:s}=t,o=[["\u4ECA\u65E5",a],["\u65E5\u7A0B",r],["\u90AE\u4EF6",i],["\u884C\u60C5",s]];return n==="s"?d.default.createElement("div",{className:"fw-list",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,alignContent:"center"}},o.map(([c,m])=>d.default.createElement("button",{key:c,type:"button",className:"fw-btn",style:{height:26,padding:0,fontSize:10.5},onClick:()=>m(null)},c))):d.default.createElement(d.default.Fragment,null,d.default.createElement("div",{className:"fw-list",style:{justifyContent:"center",gap:6}},o.map(([c,m])=>d.default.createElement("button",{key:c,type:"button",className:"fw-btn",style:{textAlign:"left"},onClick:()=>m(null)},c," \u2197"))),n==="l"?xe("\u56DB\u4E2A\u9875\u9762\u4ECD\u5728\uFF0C\u5DE5\u4F5C\u53F0\u662F\u65B0\u7684\u5165\u53E3","",null):null)}var Ea={calendar:ka,tasks:Na,mail:za,quotes:Sa,brief:Da,alerts:$a,clock:Ma,next:Ca,quick:qa};function nn(e,t){let n=Ea[e.type];return n?n(e,{...t,size:e.size}):d.default.createElement("p",{className:"fw-empty"},"\u672A\u77E5\u7EC4\u4EF6\uFF1A",e.type)}var be=ee(require("react"),1),Re="work-desk/",an={instrument:{bg:"rgba(16,18,22,.74)",solid:"#101216",fg:"#e9ecef",accent:"#7de2c4",onAccent:"#0b1512",radius:22,padding:18,shadow:!0},paper:{bg:"#f3eee3",solid:"#f3eee3",fg:"#1f1c18",accent:"#c23b2b",onAccent:"#fff8ef",radius:6,padding:18,shadow:!0},type:{bg:"rgba(10,15,36,0)",solid:"#0a0f24",fg:"#ffffff",accent:"#9ccfff",onAccent:"#04131c",radius:18,padding:12,shadow:!1}},Ze=null,Ee=new Map;function sn(){let[e,t]=be.default.useState({ready:!1,widgets:[],error:null});return be.default.useEffect(()=>{Ze||(Ze=fetch(Re+"fw/widgets").then(a=>a.ok?a.json():Promise.reject(new Error(`HTTP ${a.status}`))).then(a=>a.widgets??[]).catch(a=>{throw Ze=null,a}));let n=!0;return Ze.then(a=>n&&t({ready:!0,widgets:a,error:null})).catch(a=>n&&t({ready:!0,widgets:[],error:a.message})),()=>{n=!1}},[]),e}async function bt(e,t){let n=`${e}/${t}`;return Ee.has(n)||Ee.set(n,fetch(`${Re}fw/file?id=${encodeURIComponent(e)}&name=${encodeURIComponent(t)}`).then(a=>a.ok?a.text():"")),Ee.get(n)}async function rn(e){let t=`sdk/${e}`;return Ee.has(t)||Ee.set(t,fetch(`${Re}fw/sdk?name=${encodeURIComponent(e)}`).then(n=>n.ok?n.text():"")),Ee.get(t)}function on(e){let{width:t=260,height:n=160,minWidth:a=160,minHeight:r=100}=e.size??{};return r>=220||n>=260?"l":a<=150&&t<=200?"s":"m"}function Oa(e,t,n,a,r){let i=[];return`<script>
(function(){
const listeners={};const local=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v['zh-CN']??v.zh??v.en??Object.values(v)[0]):v;
const values=${JSON.stringify(a)};
const store=${JSON.stringify(r)};
const persist=()=>{try{localStorage.setItem(${JSON.stringify("fw-atom-"+t)},JSON.stringify(store))}catch{}};
const t=local;
const noop=()=>{};
const notify=()=>Promise.reject(new Error('workbench: \u9884\u89C8\u73AF\u5883\u4E0D\u652F\u6301\u7CFB\u7EDF\u901A\u77E5'));
notify.cancel=async()=>{};
window.widget={
  apiVersion:1,hostVersion:'workbench',id:${JSON.stringify(e)},instanceId:${JSON.stringify(t)},
  locale:'zh-CN',developer:false,permissions:[],locked:false,layer:'normal',theme:${JSON.stringify(n)},
  t,
  settings:{get:k=>k?values[k]:values,set:async(k,v)=>{values[k]=v;(listeners.settings||[]).forEach(f=>f(values))},onChange:f=>{(listeners.settings??=[]).push(f);return()=>{}}},
  storage:{get:async k=>store[k]??null,set:async(k,v)=>{store[k]=v;persist()},remove:async k=>{delete store[k];persist()},keys:async()=>Object.keys(store)},
  appearance:{get:()=>({theme:${JSON.stringify(n)}}),onChange:f=>()=>{}},
  on:(n,f)=>{(listeners[n]??=[]).push(f);return()=>{}},
  log:(...a)=>console.log(...a),
  notify,
  window:{startDrag:noop,setSize:async()=>({width:innerWidth,height:innerHeight})},
  fetch:(url,init)=>fetch(url,init),
  shell:{open:async url=>{window.open(url,'_blank','noopener');return true},launch:async()=>{throw new Error('workbench: \u4E0D\u652F\u6301\u542F\u52A8\u672C\u673A\u7A0B\u5E8F')},pick:async()=>null,info:async()=>null,paths:async()=>[]},
  system:{subscribe:()=>noop,history:async()=>({now:Date.now(),points:[]}),info:async()=>{throw new Error('workbench: \u65E0\u7CFB\u7EDF\u4FE1\u606F\u6743\u9650')},adapters:async()=>[],ping:async()=>null},
  media:{onChange:()=>noop,lyrics:async()=>null},
  audio:{onChange:()=>noop,set:async()=>{}},
  notifyNote:noop
};
})();
<\/script>`}async function Ta(e,t,n,a){let[r,i,s,o,c]=await Promise.all([bt(e.id,"index.html"),bt(e.id,"style.css"),bt(e.id,"main.js"),rn("base.css"),rn(`themes/${n}/theme.css`)]),m=an[n]??an.instrument,g={};for(let S of e.settings??[]){let N=a?.[S.key];g[S.key]=N!==void 0?N:ht(S.default)}let p={},l=`:root{--w-bg:${m.bg};--w-bg-solid:${m.solid};--w-fg:${m.fg};--w-accent:${m.accent};--w-on-accent:${m.onAccent};--w-radius:${m.radius}px;--w-padding:${m.padding}px;--w-margin:8px;--w-size-scale:1${m.shadow?"":";--w-shadow:none"}}`;return`<html lang="zh-CN" data-theme="${n}" data-style="transparent"><style>${o}</style><style>${c}</style><style>${l}</style><style>${i}</style><style>html,body{background:transparent}body{margin:0}</style>${r.replace(/^[\s\S]*?<body[^>]*>/i,"<body>").replace(/<\/body>[\s\S]*$/i,"").replace(/<script[^>]*src=[^>]*>\s*<\/script>/gi,"")}${Oa(e.id,t,n,g,p)}<script>${s}<\/script></body></html>`}function ht(e){return e&&typeof e=="object"&&!Array.isArray(e)?e["zh-CN"]??e.zh??e.en??Object.values(e)[0]:e}function ln({widget:e,instanceId:t,theme:n,config:a}){let[r,i]=be.default.useState(""),[s,o]=be.default.useState("");return be.default.useEffect(()=>{let c=!0;return Ta(e,t,n,a??{}).then(m=>c&&i(m)).catch(m=>c&&o(m.message)),()=>{c=!1}},[e.id,t,n,JSON.stringify(a??{})]),s?be.default.createElement("p",{className:"fw-empty"},"\u7EC4\u4EF6\u52A0\u8F7D\u5931\u8D25\uFF1A",s):r?be.default.createElement("iframe",{className:"fw-frame",title:ht(e.name),srcDoc:r,sandbox:"allow-scripts allow-same-origin allow-forms allow-popups",loading:"lazy"}):be.default.createElement("p",{className:"fw-empty"},"\u6B63\u5728\u52A0\u8F7D ",ht(e.name),"\u2026")}function xt(e){return`${Re}fw/file?id=${encodeURIComponent(e)}&name=icon.svg`}var j=ee(require("react"),1);function pn(e){let t=Number(e);return!Number.isFinite(t)||t<=0?8:t<=560?2:t<=880?4:8}var ce={s:{w:1,h:1,label:"\u5C0F"},m:{w:2,h:1,label:"\u4E2D"},l:{w:4,h:3,label:"\u5927"}},He={calendar:{label:"\u65E5\u5386",hint:"\u65E5\u671F\u3001\u4E0B\u4E00\u573A\u3001\u5F53\u65E5\u8BAE\u7A0B"},next:{label:"\u4E0B\u4E00\u4EF6\u4E8B",hint:"\u65F6\u95F4\u3001\u6807\u9898\u3001\u63A5\u4E0B\u6765\u7684\u5B89\u6392"},tasks:{label:"\u5F85\u529E",hint:"\u8BA1\u6570\u3001\u4E24\u6761\u9884\u89C8\u3001\u5B8C\u6574\u6E05\u5355"},mail:{label:"\u90AE\u4EF6",hint:"\u672A\u67E5\u770B\u6570\u3001\u6700\u8FD1\u4E24\u5C01\u3001\u5217\u8868"},quotes:{label:"\u884C\u60C5",hint:"\u5355\u53EA\u3001\u4E24\u53EA\u3001\u81EA\u9009\u8868"},brief:{label:"\u4ECA\u5929\u5148\u505A\u4EC0\u4E48",hint:"\u4E00\u53E5\u3001\u6458\u8981\u3001\u5168\u6587"},clock:{label:"\u65F6\u949F",hint:"\u65F6\u95F4\u3001\u65E5\u671F\u3001\u4ECA\u5929\u5DF2\u8FC7\u591A\u5C11"},alerts:{label:"\u63D0\u9192",hint:"\u6761\u6570\u3001\u524D\u4E24\u6761\u3001\u5168\u90E8"},quick:{label:"\u5FEB\u6377\u5165\u53E3",hint:"\u4ECA\u65E5\u3001\u65E5\u7A0B\u3001\u90AE\u4EF6\u3001\u884C\u60C5"}},Ia=24,cn="wd-fw-layout-v1";function un(e="fw"){let t=Math.random().toString(36).slice(2,8);return`${e}-${Date.now().toString(36)}-${t}`}function vt(){return{theme:"instrument",atoms:[{id:"fw-cal",type:"calendar",size:"l"},{id:"fw-next",type:"next",size:"m"},{id:"fw-tasks",type:"tasks",size:"m"},{id:"fw-mail",type:"mail",size:"m"},{id:"fw-quotes",type:"quotes",size:"m"},{id:"fw-brief",type:"brief",size:"m"},{id:"fw-clock",type:"clock",size:"m"},{id:"fw-alerts",type:"alerts",size:"s"},{id:"fw-quick",type:"quick",size:"s"}]}}var Aa=/^fw:[a-z0-9-]{1,32}$/,ja=new Set(Object.keys(He)),La=["instrument","paper","type"],Pa=["text","stat","badge","progress","list","keyvalue","steps","callout","chart","divider"],yt=new Set(Pa),Ha=6,_a=4096;function kt(e){let t=_a,n=(a,r)=>!a||typeof a!="object"?!0:r>Ha||(t-=1)<0?!1:Array.isArray(a)?a.every(i=>n(i,r+1)):Object.values(a).every(i=>n(i,r+1));return n(e,0)}function dn(e){return(Array.isArray(e?.items)?e.items:[]).some(t=>t&&typeof t=="object"&&typeof t.type=="string"&&yt.has(t.type))}function Nt(e){return!e||typeof e!="object"||Array.isArray(e)||!kt(e)?!1:dn(e)?!0:e.views&&typeof e.views=="object"&&!Array.isArray(e.views)?["s","m","l"].some(t=>dn(e.views[t])):!1}function mn(e){return typeof e=="string"&&(ja.has(e)||e==="genui"||Aa.test(e))}function fn(){try{let e=JSON.parse(localStorage.getItem(cn)||"null");return zt(e)??vt()}catch{return vt()}}function et(e){try{return localStorage.setItem(cn,JSON.stringify(e)),!0}catch{return!1}}function zt(e){if(!e||typeof e!="object")return null;let t=La.includes(e.theme)?e.theme:"instrument",n=Array.isArray(e.atoms)?e.atoms:[],a=new Set,r=[];for(let i of n.slice(0,Ia)){if(!i||typeof i!="object"||typeof i.id!="string"||a.has(i.id)||!mn(i.type)||!ce[i.size])continue;a.add(i.id);let s={id:i.id,type:i.type,size:i.size};i.config&&typeof i.config=="object"&&!Array.isArray(i.config)&&(s.config=i.config),i.type==="genui"&&i.spec&&typeof i.spec=="object"&&Nt(i.spec)&&(s.spec=i.spec),r.push(s)}return r.length?{theme:t,atoms:r}:null}function wn(e){return e.reduce((t,n)=>{let a=ce[n.size]??ce.m;return t+a.w*a.h},0)}function gn(e,t=8){let n=Math.max(1,Math.min(8,Number(t)||8)),a=[],r=[],i=0,s=(c,m,g,p)=>{for(let l=c;l<c+p;l++)for(let S=m;S<m+g;S++)if(S>=n||a[l]?.[S])return!1;return!0},o=(c,m,g,p)=>{for(let l=c;l<c+p;l++){let S=a[l]??=[];for(let N=m;N<m+g;N++)S[N]=!0}};for(let c of e){let m=ce[c.size]??ce.m,g=Math.min(m.w,n),p=m.h,l=0,S=0,N=!1;for(l=0;!N;l++)for(S=0;S+g<=n;S++)if(s(l,S,g,p)){N=!0;break}l-=1,o(l,S,g,p),i=Math.max(i,l+p),r.push({id:c.id,row:l,col:S,w:g,h:p})}return{placed:r,rows:Math.max(i,1),columns:n}}var Fa=40,Ua=400,bn=["accent","success","warning","danger","muted"];function Z(e){return typeof e=="string"?e.slice(0,Ua):""}function Ba(e,t){if(!e||typeof e!="object")return null;let n=e.views;if(n&&typeof n=="object"){let a=n[t]??n.m??Object.values(n)[0];if(a&&typeof a=="object")return a}return e}function hn(e){return Nt(e)}function Wa(e){if(!e||typeof e!="object"||Array.isArray(e)||!kt(e))return null;let n=(Array.isArray(e.items)?e.items.slice(0,Fa):[]).filter(a=>a&&typeof a=="object"&&typeof a.type=="string").filter(a=>yt.has(a.type));return n.length?{title:Z(e.title),items:n}:null}function Ya({label:e,tone:t}){let n=bn.includes(t)?t:"accent";return j.default.createElement("span",{className:`fw-badge is-${n}`},Z(e))}function Va({node:e}){switch(e.type){case"text":return j.default.createElement("p",{className:`fw-gtext is-${Z(e.size)||"body"}`},Z(e.content));case"stat":return j.default.createElement("div",{className:"fw-gstat"},j.default.createElement("span",{className:"fw-gstat-value fw-display"},Z(e.value)),j.default.createElement("span",{className:"fw-label"},Z(e.label)),e.delta?j.default.createElement("span",{className:`fw-gdelta ${String(e.delta).startsWith("-")?"is-down":"is-up"}`},Z(e.delta)):null);case"badge":return j.default.createElement(Ya,{label:e.label,tone:e.tone});case"progress":{let t=Math.max(0,Math.min(100,Number(e.value)||0));return j.default.createElement("div",{className:"fw-gprogress"},j.default.createElement("div",{className:"fw-grow"},j.default.createElement("span",{className:"fw-label"},Z(e.label)),j.default.createElement("div",{className:"fw-track"},j.default.createElement("i",{style:{width:`${t}%`}}))),j.default.createElement("span",{className:"fw-num"},t,"%"))}case"list":return j.default.createElement("ul",{className:"fw-glist"},(Array.isArray(e.items)?e.items:[]).slice(0,8).map((t,n)=>j.default.createElement("li",{key:n},j.default.createElement("b",null,Z(typeof t=="string"?t:t?.title)),typeof t=="object"&&t?.desc?j.default.createElement("small",null,Z(t.desc)):null)));case"keyvalue":return j.default.createElement("dl",{className:"fw-gkv"},(Array.isArray(e.pairs)?e.pairs:[]).slice(0,8).map((t,n)=>j.default.createElement(j.default.Fragment,{key:n},j.default.createElement("dt",null,Z(t?.key)),j.default.createElement("dd",null,Z(t?.value)))));case"steps":{let t=Math.max(0,Math.min(6,Number(e.current)||0));return j.default.createElement("ol",{className:"fw-gsteps"},(Array.isArray(e.steps)?e.steps:[]).slice(0,6).map((n,a)=>j.default.createElement("li",{key:a,className:a<=t?"is-on":""},Z(typeof n=="string"?n:n?.title))))}case"callout":return j.default.createElement("div",{className:`fw-gcallout is-${bn.includes(e.tone)?e.tone:"accent"}`},j.default.createElement("b",null,Z(e.title)),j.default.createElement("p",null,Z(e.content)));case"chart":{let t=(Array.isArray(e.data)?e.data:[]).slice(0,8),n=Math.max(1,...t.map(a=>Number(a?.value)||0));return j.default.createElement("div",{className:"fw-gchart"},t.map((a,r)=>j.default.createElement("div",{key:r,className:"fw-gbar",title:`${Z(a?.label)} ${Number(a?.value)||0}`},j.default.createElement("i",{style:{height:`${Math.round((Number(a?.value)||0)/n*100)}%`}}),j.default.createElement("span",null,Z(a?.label)))))}case"divider":return j.default.createElement("hr",{className:"fw-rule"});default:return null}}function xn({spec:e,size:t}){let n=Ba(e,t??"m"),a=Wa(n);return a?j.default.createElement("div",{className:"fw-genui"},a.title?j.default.createElement("h3",null,a.title):null,a.items.map((r,i)=>j.default.createElement(Va,{key:i,node:r}))):j.default.createElement("p",{className:"fw-empty"},"\u8FD9\u5F20\u751F\u6210\u5F0F\u5361\u7247\u6CA1\u6709\u9002\u5408\u5F53\u524D\u5C3A\u5BF8\u7684\u89C4\u683C\u3002")}var Ja=[{id:"instrument",label:"\u91CF\u88AB\u753B\u51FA\u6765"},{id:"paper",label:"\u4E66\u684C\u4E0A\u7684\u7EB8"},{id:"type",label:"\u73BB\u7483\u4E0A\u7684\u5B57"}],_e=['{"title":"\u672C\u5468\u6982\u89C8","items":[{"type":"stat","label":"\u4F1A\u8BAE","value":"6"},{"type":"progress","label":"\u5F85\u529E\u5B8C\u6210\u5EA6","value":60},{"type":"chart","data":[{"label":"\u5468\u4E00","value":2},{"label":"\u5468\u4E8C","value":1},{"label":"\u5468\u4E09","value":3}]}]}','{"title":"\u98CE\u9669\u63D0\u793A","items":[{"type":"callout","tone":"warning","title":"\u4E24\u5C01\u90AE\u4EF6\u5F85\u56DE\u590D","content":"\u9648\u6B23\u4E0E\u5468\u821F\u90FD\u5728\u7B49\u786E\u8BA4\u3002"},{"type":"steps","current":1,"steps":["\u786E\u8BA4\u4F1A\u8BAE\u65F6\u95F4","\u56DE\u590D\u8BC4\u5BA1\u6750\u6599"]}]}','{"title":"\u4ECA\u65E5\u4E09\u4EF6\u4E8B","items":[{"type":"list","items":[{"title":"\u51C6\u5907\u8BC4\u5BA1\u6750\u6599","desc":"14:00 \u524D"},{"title":"\u56DE\u590D\u4F1A\u8BAE\u786E\u8BA4","desc":"\u4ECA\u5929"},{"title":"\u6574\u7406\u9879\u76EE\u8FDB\u5C55","desc":"\u660E\u5929"}]}]}','{"title":"\u4E09\u6863\u89C4\u683C","items":[],"views":{"s":{"title":"6 \u4E2A\u4F1A","items":[{"type":"stat","label":"\u4ECA\u5929","value":"6"}]},"m":{"title":"\u672C\u5468\u6982\u89C8","items":[{"type":"progress","label":"\u5F85\u529E\u5B8C\u6210","value":60},{"type":"list","items":["\u51C6\u5907\u8BC4\u5BA1\u6750\u6599","\u56DE\u590D\u4F1A\u8BAE\u786E\u8BA4"]}]},"l":{"title":"\u672C\u5468\u5DE5\u4F5C\u6982\u89C8","items":[{"type":"chart","data":[{"label":"\u5468\u4E00","value":2},{"label":"\u5468\u4E8C","value":1},{"label":"\u5468\u4E09","value":3},{"label":"\u5468\u56DB","value":2}]},{"type":"keyvalue","pairs":[{"key":"\u4F1A\u8BAE","value":"6 \u573A"},{"key":"\u5F85\u529E","value":"4 \u6761"}]}]}}}'];function St(e,t){let n=t.startsWith("fw:")?t.slice(3):"";return e.find(a=>a.id===n)}function tt(e){return e&&typeof e=="object"&&!Array.isArray(e)?e["zh-CN"]??e.zh??e.en??Object.values(e)[0]:e}function Ka({widget:e,atom:t,onClose:n,onSave:a}){let r=e?.settings??[];return h.default.createElement("div",{className:"fw-modal",role:"dialog","aria-modal":"true","aria-label":"\u7EC4\u4EF6\u8BBE\u7F6E",onClick:s=>{s.target===s.currentTarget&&n()}},h.default.createElement("form",{className:"fw-modal-card",onSubmit:s=>{s.preventDefault();let o=new FormData(s.currentTarget),c={};for(let m of r){let g=m.key;m.type==="toggle"?c[g]=o.get(g)==="on":m.type==="number"?c[g]=Number(o.get(g)):c[g]=String(o.get(g)??"")}a(c)}},h.default.createElement("header",null,h.default.createElement("h3",null,tt(e?.name)||"\u7EC4\u4EF6\u8BBE\u7F6E"),h.default.createElement("button",{type:"button",onClick:n,"aria-label":"\u5173\u95ED"},"\xD7")),r.length===0?h.default.createElement("p",{className:"fw-hint"},"\u8FD9\u4E2A\u7EC4\u4EF6\u6CA1\u6709\u53EF\u914D\u7F6E\u9879\u3002"):r.map(s=>{let o=s.key,c=t.config?.[o]??tt(s.default),m=tt(s.label)||o;return s.type==="toggle"?h.default.createElement("label",{key:o,className:"fw-field is-toggle"},h.default.createElement("span",null,m),h.default.createElement("input",{type:"checkbox",name:o,defaultChecked:!!c})):s.type==="select"?h.default.createElement("label",{key:o,className:"fw-field"},h.default.createElement("span",null,m),h.default.createElement("select",{name:o,defaultValue:c??""},(s.options??[]).map(g=>h.default.createElement("option",{key:g.value,value:g.value},tt(g.label)||g.value)))):h.default.createElement("label",{key:o,className:"fw-field"},h.default.createElement("span",null,m),h.default.createElement("input",{name:o,type:s.type==="number"?"number":"text",defaultValue:c??""}))}),h.default.createElement("footer",null,h.default.createElement("button",{type:"button",className:"fw-btn",onClick:n},"\u53D6\u6D88"),h.default.createElement("button",{type:"submit",className:"fw-btn is-on"},"\u4FDD\u5B58"))))}function vn(e,t){if(He[t.type])return He[t.type].label;if(t.type==="genui")return t.spec?.title||"\u751F\u6210\u5F0F\u5361\u7247";let n=St(e,t.type);if(!n)return"\u7EC4\u4EF6\u672A\u52A0\u8F7D";let a=n.name;return typeof a=="object"?a["zh-CN"]??a.zh??a.en??n.id:a}async function yn(){let e=await fetch("work-desk/workbench");if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}function kn(){let e=$(b=>b.state),t=$(b=>b.quotes),n=$(b=>b.alerts),a=$(b=>b.mail),r=sn(),[i,s]=h.default.useState(()=>fn()),[o,c]=h.default.useState(0),[m,g]=h.default.useState(null),[p,l]=h.default.useState(!1),[S,N]=h.default.useState(null),[k,x]=h.default.useState(""),[C,B]=h.default.useState(_e[0]),L=h.default.useRef(null),[ne,Q]=h.default.useState(null),[K,R]=h.default.useState(()=>new Date),[O,G]=h.default.useState(null),[X,Fe]=h.default.useState(8),de=h.default.useRef(null),ve=h.default.useRef(0),Me=h.default.useRef(""),ye=h.default.useRef(!1),$t=h.default.useRef(null);h.default.useEffect(()=>{let b=setInterval(()=>R(new Date),3e4);return()=>clearInterval(b)},[]),h.default.useEffect(()=>{let b=$t.current;if(!b)return;let D=new ResizeObserver(_=>{let F=_[_.length-1];F&&Fe(pn(F.contentRect.width))});return D.observe(b),()=>D.disconnect()},[]);let at=b=>{let D=zt({theme:b?.theme,atoms:b?.atoms});return D?(s(D),c(b.revision),ve.current=b.revision,Me.current=JSON.stringify(D),ye.current=!1,g(!0),!0):!1},Mt=async()=>{try{let b=await yn();at(b)}catch{g(!1)}};h.default.useEffect(()=>{let b=!0,D=async()=>{if(!(!b||ye.current))try{let ie=await yn();at(ie)}catch{b&&g(!1)}};D();let _=setInterval(D,15e3),F=()=>D();return window.addEventListener("focus",F),()=>{b=!1,clearInterval(_),window.removeEventListener("focus",F)}},[]),h.default.useEffect(()=>{if(m===null)return;let b=JSON.stringify(i);if(m===!1){b!==Me.current&&(et(i),Me.current=b,ye.current=!1);return}if(!(!ye.current||b===Me.current))return clearTimeout(de.current),de.current=setTimeout(async()=>{try{let _=await(await fetch("work-desk/workbench",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({baseRevision:ve.current,requestId:`ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,ops:[{op:"replace",layout:{theme:i.theme,atoms:i.atoms}}],source:"ui"})})).json().catch(()=>({}));if(_.conflict){try{let F=await(await fetch("work-desk/workbench")).json();ve.current=F.revision,c(F.revision);let ie={theme:i.theme,atoms:[...i.atoms,...(F.atoms??[]).filter(st=>!i.atoms.some(_n=>_n.id===st.id))]},ue=await(await fetch("work-desk/workbench",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({baseRevision:F.revision,requestId:`ui-rebase-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,ops:[{op:"replace",layout:ie}],source:"ui"})})).json().catch(()=>({}));if(ue.ok){Me.current=JSON.stringify(ie),ye.current=!1,et(ie),at({theme:ie.theme,atoms:ie.atoms,revision:ue.revision}),J("\u5E03\u5C40\u5DF2\u88AB\u522B\u5904\u6539\u8FC7\uFF0C\u5DF2\u6309\u4F60\u7684\u8FD9\u6B21\u6539\u52A8\u5408\u5E76\u4FDD\u5B58",{});return}}catch{}J("\u5E03\u5C40\u5DF2\u88AB\u522B\u5904\u6539\u8FC7\uFF0C\u5DF2\u91CD\u65B0\u8BFB\u53D6",{error:!0}),await Mt();return}if(!_.ok){J((_.errors??[_.error??"\u4FDD\u5B58\u5931\u8D25"])[0],{error:!0}),await Mt();return}Me.current=b,ye.current=!1,c(_.revision),ve.current=_.revision,et(i)}catch{g(!1)}},350),()=>clearTimeout(de.current)},[i,m]);let fe=b=>{ye.current=!0,s(D=>{let _={...D,atoms:D.atoms.map(F=>({...F}))};return b(_),_})},it=gn(i.atoms,X),jn={state:e??{events:[],tasks:[],mails:[],watchlist:[],brief:null},quotes:t,alerts:n,mail:a,now:K,openCalendar:()=>y({view:"calendar"}),openToday:()=>y({view:"today"}),openMarket:()=>y({view:"market"}),openMail:b=>{b?ze(b):y({view:"mail"})},toggleTask:b=>{U([{op:"toggle_task",id:b}],{label:"\u5B8C\u6210\u5F85\u529E"})}},Ln=(b,D)=>{b==null||D==null||b===D||fe(_=>{let[F]=_.atoms.splice(b,1);_.atoms.splice(D,0,F)})},Ct=(b,D)=>{let _=b+D;_<0||_>=i.atoms.length||fe(F=>{let[ie]=F.atoms.splice(b,1);F.atoms.splice(_,0,ie)})},rt=b=>{if(i.atoms.length>=24){J("\u6700\u591A 24 \u4E2A\u7EC4\u4EF6\u4F4D",{error:!0});return}fe(D=>{D.atoms.push({id:un(),...b})}),N(null)},Pn=b=>rt({type:`fw:${b.id}`,size:on(b)}),Hn=()=>{let b;try{b=JSON.parse(C)}catch(D){J(`JSON \u89E3\u6790\u5931\u8D25\uFF1A${D.message}`,{error:!0});return}if(!hn(b)){J("\u89C4\u683C\u4E0D\u5408\u6CD5\uFF1A\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u767D\u540D\u5355\u7EC4\u4EF6",{error:!0});return}rt({type:"genui",size:"m",spec:b})},qt=r.widgets.filter(b=>{if(!k.trim())return!0;let D=typeof b.name=="object"?JSON.stringify(b.name):String(b.name);return`${b.id} ${D} ${b.category}`.toLowerCase().includes(k.trim().toLowerCase())});return h.default.createElement("div",{className:"wd-page wd-bench-page"},h.default.createElement("div",{className:`wd-fw ${p?"is-editing":""}`,"data-fw-theme":i.theme,ref:$t},h.default.createElement("header",{className:"fw-bar"},h.default.createElement("div",null,h.default.createElement("h1",null,"\u5DE5\u4F5C\u53F0")),h.default.createElement("span",{className:"fw-sub"},"8 \u5217 \xB7 1\xD71 / 2\xD71 / 4\xD73 \xB7 ",i.atoms.length," \u4E2A\u7EC4\u4EF6 \xB7 ",r.widgets.length?`FullWidget ${r.widgets.length} \u4E2A\u539F\u751F\u7EC4\u4EF6\u53EF\u7528`:"\u6B63\u5728\u8BFB\u53D6 FullWidget \u7EC4\u4EF6"),h.default.createElement("span",{className:"fw-grow"}),h.default.createElement("div",{className:"fw-seg",role:"group","aria-label":"\u5916\u89C2\u4E3B\u9898"},Ja.map(b=>h.default.createElement("button",{key:b.id,type:"button","aria-pressed":i.theme===b.id,onClick:()=>fe(D=>{D.theme=b.id})},b.label))),h.default.createElement("button",{type:"button",className:"fw-btn",onClick:()=>N(S==="add"?null:"add"),"aria-expanded":S==="add"},"\uFF0B \u6DFB\u52A0\u7EC4\u4EF6"),h.default.createElement("button",{type:"button",className:`fw-btn ${p?"is-on":""}`,"aria-label":p?"\u5B8C\u6210\u7F16\u8F91":"\u7F16\u8F91\u5E03\u5C40","aria-pressed":p,onClick:()=>l(b=>!b)},p?"\u2713 \u5B8C\u6210\u7F16\u8F91":"\u7F16\u8F91\u5E03\u5C40")),r.error?h.default.createElement("p",{className:"fw-hint"},"FullWidget \u7EC4\u4EF6\u6CA1\u8BFB\u5230\uFF1A",r.error):null,S==="add"?h.default.createElement("div",{className:"fw-panel"},h.default.createElement("div",{className:"fw-panel-section"},h.default.createElement("h3",null,"\u5185\u7F6E\u539F\u5B50"),h.default.createElement("div",{className:"fw-chiprow"},Object.entries(He).map(([b,D])=>h.default.createElement("button",{key:b,type:"button",className:"fw-btn",title:D.hint,onClick:()=>rt({type:b,size:"m"})},D.label)))),h.default.createElement("div",{className:"fw-panel-section"},h.default.createElement("h3",null,"FullWidget \u539F\u751F\u7EC4\u4EF6 ",h.default.createElement("span",{className:"fw-label"},qt.length,"/",r.widgets.length)),h.default.createElement("input",{className:"fw-input",value:k,onChange:b=>x(b.target.value),placeholder:"\u6309\u540D\u5B57\u6216\u5206\u7C7B\u7B5B\u9009\uFF0C\u4F8B\u5982 clock\u3001weather\u3001todo\u2026","aria-label":"\u7B5B\u9009 FullWidget \u7EC4\u4EF6"}),h.default.createElement("div",{className:"fw-widgetgrid"},qt.map(b=>h.default.createElement("button",{key:b.id,type:"button",className:"fw-widgetchip",onClick:()=>Pn(b),title:`${b.id} \xB7 ${b.category}`},h.default.createElement("img",{src:xt(b.id),alt:"",width:18,height:18,loading:"lazy"}),h.default.createElement("span",null,typeof b.name=="object"?b.name["zh-CN"]??b.id:b.name))))),h.default.createElement("div",{className:"fw-panel-section"},h.default.createElement("h3",null,"\u751F\u6210\u5F0F\u5361\u7247"),h.default.createElement("textarea",{className:"fw-input",rows:5,value:C,onChange:b=>B(b.target.value),"aria-label":"\u751F\u6210\u5F0F\u5361\u7247 JSON",spellCheck:!1}),h.default.createElement("div",{className:"fw-chiprow"},h.default.createElement("button",{type:"button",className:"fw-btn",onClick:Hn},"\u52A0\u5165\u5DE5\u4F5C\u53F0"),h.default.createElement("button",{type:"button",className:"fw-btn",onClick:()=>B(_e[(_e.indexOf(C)+1)%_e.length]??_e[0])},"\u6362\u4E2A\u793A\u4F8B"),h.default.createElement("span",{className:"fw-label"},"\u767D\u540D\u5355\uFF1Atext / stat / badge / progress / list / keyvalue / steps / callout / chart / divider")))):null,p?h.default.createElement("p",{className:"fw-hint"},"\u62D6\u52A8\u5361\u7247\u6362\u4F4D\u7F6E\uFF1A\u865A\u7EBF\u683C\u5B50\u662F\u53EF\u7528\u4F4D\u7F6E\uFF1B\u53F3\u4E0A\u89D2\u5207 \u5C0F\uFF0F\u4E2D\uFF0F\u5927 \u6216\u79FB\u9664\u3002"):null,h.default.createElement("div",{className:"fw-grid","aria-label":"\u5DE5\u4F5C\u53F0\u7EC4\u4EF6\u7F51\u683C",style:{"--fw-cols":X}},p?h.default.createElement("div",{className:"fw-cells","aria-hidden":"true",style:{gridRow:`1 / span ${it.rows}`}},Array.from({length:it.rows*X},(b,D)=>h.default.createElement("i",{key:D}))):null,i.atoms.map((b,D)=>{let _=it.placed[D]??{row:0,col:0,w:1,h:1},F=St(r.widgets,b.type),ie=b.type==="genui";return h.default.createElement("div",{key:b.id,className:["fw-slot",`is-${b.size}`,p?"is-editing":"",ne===D&&L.current!==D?"is-drop":"",L.current===D?"is-dragging":""].filter(Boolean).join(" "),style:{gridColumn:`${_.col+1} / span ${_.w}`,gridRow:`${_.row+1} / span ${_.h}`},draggable:p,tabIndex:p?0:void 0,"aria-label":p?`${vn(r.widgets,b)}\uFF08${ce[b.size].label}\uFF09\uFF0C\u65B9\u5411\u952E \u2190/\u2192 \u79FB\u52A8`:void 0,onKeyDown:H=>{p&&(H.key==="ArrowLeft"?(H.preventDefault(),Ct(D,-1)):H.key==="ArrowRight"&&(H.preventDefault(),Ct(D,1)))},onDragStart:H=>{L.current=D;try{H.dataTransfer?.setData("text/plain",String(D)),H.dataTransfer&&(H.dataTransfer.effectAllowed="move")}catch{}},onDragOver:H=>{p&&(H.preventDefault(),H.dataTransfer&&(H.dataTransfer.dropEffect="move"),Q(D))},onDragLeave:()=>Q(H=>H===D?null:H),onDrop:H=>{p&&(H.preventDefault(),Ln(L.current,D),L.current=null,Q(null))},onDragEnd:()=>{L.current=null,Q(null)}},h.default.createElement("article",{className:`fw-card ${F?"is-widget":""} ${ie?"is-genui":""}`},h.default.createElement("header",{className:"fw-head"},F?h.default.createElement("img",{className:"fw-icon",src:xt(F.id),alt:"",width:14,height:14,loading:"lazy"}):null,h.default.createElement("h2",null,vn(r.widgets,b)),h.default.createElement("span",{className:"fw-meta"},ce[b.size].label)),h.default.createElement("div",{className:"fw-body"},F?h.default.createElement(ln,{widget:F,instanceId:b.id,theme:i.theme,config:b.config}):ie?h.default.createElement(xn,{spec:b.spec,size:b.size}):e?nn(b,jn):h.default.createElement("p",{className:"fw-empty"},"\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u53F0\u2026"))),p?h.default.createElement("div",{className:"fw-edit"},h.default.createElement("button",{type:"button",className:"fw-drag","aria-label":"\u62D6\u52A8\u6392\u5E8F",title:"\u6309\u4F4F\u62D6\u52A8"},"\u283F"),b.size==="s"?null:h.default.createElement(h.default.Fragment,null,h.default.createElement("button",{type:"button","aria-label":"\u524D\u79FB",title:"\u524D\u79FB",onClick:()=>fe(H=>{if(D>0){let[ue]=H.atoms.splice(D,1);H.atoms.splice(D-1,0,ue)}})},"\u2190"),h.default.createElement("button",{type:"button","aria-label":"\u540E\u79FB",title:"\u540E\u79FB",onClick:()=>fe(H=>{if(D<H.atoms.length-1){let[ue]=H.atoms.splice(D,1);H.atoms.splice(D+1,0,ue)}})},"\u2192")),h.default.createElement("button",{type:"button",className:"fw-size","aria-label":`\u5C3A\u5BF8\uFF1A${ce[b.size].label}\uFF0C\u70B9\u51FB\u5207\u6362\u4E0B\u4E00\u6863`,title:`\u5F53\u524D ${ce[b.size].label}\uFF0C\u70B9\u4E00\u4E0B\u6362\u4E0B\u4E00\u6863`,onClick:()=>fe(H=>{let ue=["s","m","l"],st=ue[(ue.indexOf(b.size)+1)%ue.length];H.atoms[D].size=st})},ce[b.size].label),F&&(F.settings??[]).length?h.default.createElement("button",{type:"button",onClick:()=>G(D),"aria-label":"\u7EC4\u4EF6\u8BBE\u7F6E"},"\u2699"):null,h.default.createElement("button",{type:"button","aria-label":"\u79FB\u9664\u7EC4\u4EF6",onClick:()=>fe(H=>{H.atoms.splice(D,1)})},"\xD7")):null)})),h.default.createElement("p",{className:"fw-hint"},"\u5360\u7528 ",wn(i.atoms)," \u683C \xB7 ",m===!0?`Host \u4FDD\u5B58\uFF08revision ${o}\uFF09\xB7 Agent \u53EF\u901A\u8FC7 workbench_inspect / workbench_apply \u4FEE\u6539`:m===!1?"Host \u63A5\u53E3\u4E0D\u53EF\u7528\uFF0C\u6682\u5B58\u672C\u673A\u6D4F\u89C8\u5668\uFF08\u91CD\u542F Harness \u540E\u81EA\u52A8\u5207\u6362\u4E3A Host \u4FDD\u5B58\uFF09":"\u6B63\u5728\u8BFB\u53D6 Host \u5E03\u5C40\u2026"),O!=null&&i.atoms[O]?h.default.createElement(Ka,{widget:St(r.widgets,i.atoms[O].type),atom:i.atoms[O],onClose:()=>G(null),onSave:b=>{let D=O;fe(_=>{_.atoms[D].config=b}),G(null)}}):null))}var W=ee(require("react"),1),Nn="work-desk/",Ga=[{id:"instrument",label:"\u91CF\u88AB\u753B\u51FA\u6765",hint:"\u70DF\u718F\u77F3\u58A8\u5361\u7247\uFF0C\u7B49\u5BBD\u6570\u5B57"},{id:"paper",label:"\u4E66\u684C\u4E0A\u7684\u7EB8",hint:"\u7C73\u767D\u7EB8\u5361\uFF0C\u886C\u7EBF\u6570\u5B57"},{id:"type",label:"\u73BB\u7483\u4E0A\u7684\u5B57",hint:"\u65E0\u5361\u7247\uFF0C\u5927\u53F7\u7EC6\u4F53\u6570\u5B57"}],Dt={border:"1px solid var(--dsw-alias-border-l2)",borderRadius:12,padding:"14px 16px",background:"var(--dsw-alias-bg-layer-2)",display:"flex",flexDirection:"column",gap:10},nt={color:"var(--dsw-alias-label-secondary)",fontSize:11.5,lineHeight:1.6};function zn(){let[e,t]=W.default.useState(null),[n,a]=W.default.useState(""),[r,i]=W.default.useState(""),s=W.default.useCallback(async()=>{try{let c=await fetch(Nn+"workbench");if(!c.ok)throw new Error(`HTTP ${c.status}`);t(await c.json()),i("")}catch(c){i(`\u8BFB\u4E0D\u5230\u5DE5\u4F5C\u53F0\u5E03\u5C40\uFF08${c.message}\uFF09\u3002\u91CD\u542F Harness \u540E\u8FD9\u91CC\u624D\u6709\u6570\u636E\u3002`)}},[]);W.default.useEffect(()=>{s()},[s]);let o=async(c,m)=>{if(e){a(m);try{let p=await(await fetch(Nn+"workbench",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({baseRevision:e.revision,requestId:`settings-${m}-${Date.now()}`,ops:c,source:"settings"})})).json();if(!p.ok)throw new Error((p.errors??[p.error??"\u4FDD\u5B58\u5931\u8D25"])[0]);t({revision:p.revision,theme:p.layout.theme,atoms:p.layout.atoms}),i("")}catch(g){i(g.message),await s()}finally{a("")}}};return W.default.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12,maxWidth:640}},W.default.createElement("div",{style:Dt},W.default.createElement("strong",{style:{fontSize:13}},"\u5916\u89C2"),W.default.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},Ga.map(c=>W.default.createElement("button",{key:c.id,type:"button",disabled:n===c.id||!e,"aria-pressed":e?.theme===c.id,onClick:()=>o([{op:"theme",theme:c.id}],c.id),title:c.hint,style:{cursor:"pointer",border:"1px solid var(--dsw-alias-border-l2)",borderRadius:9,padding:"7px 11px",fontSize:12,background:e?.theme===c.id?"var(--dsw-alias-brand-primary)":"var(--dsw-alias-bg-layer-1)",color:e?.theme===c.id?"var(--dsw-alias-label-primary-inverted)":"var(--dsw-alias-label-primary)"}},c.label))),W.default.createElement("span",{style:nt},"\u4E3B\u9898\u540C\u65F6\u4F5C\u7528\u4E8E\u5185\u7F6E\u539F\u5B50\u4E0E FullWidget \u539F\u751F\u7EC4\u4EF6\u3002")),W.default.createElement("div",{style:Dt},W.default.createElement("strong",{style:{fontSize:13}},"\u5E03\u5C40"),W.default.createElement("span",{style:nt},e?`revision ${e.revision} \xB7 ${e.atoms.length} \u4E2A\u7EC4\u4EF6 \xB7 8 \u5217\uFF0C\u5C0F 1\xD71 / \u4E2D 2\xD71 / \u5927 4\xD73`:"\u6B63\u5728\u8BFB\u53D6\u2026"),W.default.createElement("div",{style:{display:"flex",gap:8}},W.default.createElement("button",{type:"button",disabled:n==="reload"||!e,onClick:s,style:{cursor:"pointer",border:"1px solid var(--dsw-alias-border-l2)",borderRadius:9,padding:"7px 11px",fontSize:12,background:"var(--dsw-alias-bg-layer-1)",color:"var(--dsw-alias-label-primary)"}},"\u91CD\u65B0\u8BFB\u53D6"),W.default.createElement("button",{type:"button",disabled:n==="reset"||!e,onClick:()=>o([{op:"replace",layout:{theme:"instrument",atoms:[{id:"cal",type:"calendar",size:"l"},{id:"next",type:"next",size:"m"},{id:"tasks",type:"tasks",size:"m"},{id:"mail",type:"mail",size:"m"},{id:"quotes",type:"quotes",size:"m"},{id:"brief",type:"brief",size:"m"},{id:"clock",type:"clock",size:"m"},{id:"alerts",type:"alerts",size:"s"},{id:"quick",type:"quick",size:"s"}]}}],"reset"),style:{cursor:"pointer",border:"1px solid var(--dsw-alias-border-l2)",borderRadius:9,padding:"7px 11px",fontSize:12,background:"var(--dsw-alias-bg-layer-1)",color:"var(--dsw-alias-label-primary)"}},"\u6062\u590D\u9ED8\u8BA4\u5E03\u5C40")),W.default.createElement("span",{style:nt},"\u6062\u590D\u9ED8\u8BA4\u53EA\u6539\u5E03\u5C40\uFF0C\u4E0D\u52A8\u90AE\u4EF6\u3001\u65E5\u7A0B\u3001\u5F85\u529E\u7B49\u4E1A\u52A1\u6570\u636E\u3002")),W.default.createElement("div",{style:Dt},W.default.createElement("strong",{style:{fontSize:13}},"Agent"),W.default.createElement("span",{style:nt},"\u5BF9\u8BDD\u91CC\u53EF\u4EE5\u76F4\u63A5\u8BF4\u300C\u628A\u5F85\u529E\u6539\u6210\u5927\u5361\uFF0C\u52A0\u4E00\u5F20\u672C\u5468\u6982\u89C8\u300D\u3002Agent \u901A\u8FC7 workbench_inspect \u8BFB\u5E03\u5C40\u3001workbench_apply \u6539\u5E03\u5C40\uFF0C\u6539\u52A8\u4E0E\u672C\u9875\u8FD9\u4EFD\u5E03\u5C40\u662F\u540C\u4E00\u4EFD\u6570\u636E\u3002")),r?W.default.createElement("p",{style:{color:"var(--dsw-alias-state-error-primary)",fontSize:12}},r):null)}var Sn=`/* \u5DE5\u4F5C\u53F0\uFF08\u539F\u5B50\u684C\u9762\uFF09\u6837\u5F0F\u3002
 *
 * \u5916\u89C2\u8BED\u8A00\u6765\u81EA FullWidget \u7684 SDK \u4E0E\u4E09\u5957\u5B98\u65B9\u4E3B\u9898\uFF08sdk/base.css\u3001sdk/themes/*\uFF09\uFF1A
 * \u5361\u7247\u6750\u8D28\u3001\u6570\u5B57\u6392\u7248\u3001\u63A7\u4EF6\u4E0E\u5706\u89D2\u90FD\u6CBF\u7528\u5B83\u7684\u53D8\u91CF\u4F53\u7CFB\uFF0C\u8FD9\u91CC\u53EA\u662F\u628A\u4F5C\u7528\u57DF\u6536\u5230 .wd-fw \u91CC\uFF0C
 * \u907F\u514D html/body \u7EA7\u89C4\u5219\u5F71\u54CD DSH \u5BFC\u822A\u3001\u4F1A\u8BDD\u548C\u5176\u5B83\u63D2\u4EF6\u3002
 * \u6765\u6E90\uFF1Ahmgvibe/FullWidget\uFF0Csdk/ \u4E0E themes/ \u4E3A MIT\uFF1B\u58F0\u660E\u89C1 vendor/fullwidget/NOTICE.md\u3002
 */

.wd-fw {
  --fw-cols: 8;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 14px 18px 18px;
  container-type: inline-size;
  overflow: clip;
  background: var(--fw-stage);
  color: var(--fw-fg);
  font-family: var(--fw-font);
}

/* \u5DE5\u4F5C\u53F0\u9875\u5BB9\u5668\uFF1A\u7559\u5728\u9876\u680F\u4E0B\u65B9\uFF0C\u6EDA\u52A8\u4EA4\u7ED9\u5185\u90E8\u7F51\u683C */
.wd-bench-page { overflow: hidden; }
.wd-bench-page > .wd-fw { height: 100%; }

/* \u2500\u2500 \u4E3B\u9898\uFF1A\u4E09\u5957\u5B98\u65B9\u5916\u89C2\u7684\u53D8\u91CF\u843D\u5730 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wd-fw[data-fw-theme="instrument"] {
  --fw-stage: radial-gradient(ellipse at 78% 0%, #46516066, transparent 55%), #1b222b;
  --fw-font: "Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", sans-serif;
  --fw-font-num: "Cascadia Mono", "Cascadia Code", Consolas, monospace;
  --fw-num-weight: 400;
  --fw-display-weight: 300;
  --fw-display-tracking: -.03em;
  --fw-card: rgba(16, 18, 22, .74);
  --fw-card-solid: #101216;
  --fw-fg: #e9ecef;
  --fw-fg-muted: rgba(233, 236, 239, .58);
  --fw-accent: #7de2c4;
  --fw-on-accent: #0b1512;
  --fw-border: rgba(255, 255, 255, .07);
  --fw-rule: rgba(255, 255, 255, .08);
  --fw-track: rgba(255, 255, 255, .09);
  --fw-control: rgba(255, 255, 255, .06);
  --fw-hover: rgba(255, 255, 255, .07);
  --fw-radius: 22px;
  --fw-pad: 18px;
  --fw-shadow: 0 10px 26px rgba(0, 0, 0, .34);
  --fw-warn: #ffb547;
  color-scheme: dark;
}

.wd-fw[data-fw-theme="paper"] {
  --fw-stage: radial-gradient(ellipse at 82% 4%, #d7c3a3aa, transparent 58%), #b7b0a2;
  --fw-font: "Microsoft YaHei UI", "Microsoft JhengHei UI", "Noto Sans SC", sans-serif;
  --fw-font-num: Georgia, "Noto Serif TC", serif;
  --fw-font-title: "Noto Serif SC", "Source Han Serif SC", STSong, serif;
  --fw-num-weight: 400;
  --fw-display-weight: 400;
  --fw-display-tracking: -.01em;
  --fw-card: #f3eee3;
  --fw-card-solid: #f3eee3;
  --fw-fg: #1f1c18;
  --fw-fg-muted: rgba(31, 28, 24, .64);
  --fw-accent: #c23b2b;
  --fw-on-accent: #fff8ef;
  --fw-border: rgba(31, 28, 24, .06);
  --fw-rule: rgba(31, 28, 24, .16);
  --fw-track: rgba(31, 28, 24, .1);
  --fw-control: rgba(31, 28, 24, .04);
  --fw-hover: rgba(31, 28, 24, .06);
  --fw-radius: 6px;
  --fw-pad: 18px;
  --fw-shadow: 0 1px 2px rgba(0, 0, 0, .22), 0 8px 16px rgba(0, 0, 0, .3);
  --fw-warn: var(--fw-accent);
  color-scheme: light;
}

.wd-fw[data-fw-theme="type"] {
  --fw-stage: radial-gradient(ellipse at 20% 0%, #5c6f8a55, transparent 62%), #101a28;
  --fw-font: "Segoe UI Variable Display", "Segoe UI", "Microsoft YaHei UI", sans-serif;
  --fw-font-num: var(--fw-font);
  --fw-num-weight: 600;
  --fw-display-weight: 200;
  --fw-display-tracking: -.035em;
  --fw-card: rgba(10, 15, 36, .0);
  --fw-card-solid: #0a0f24;
  --fw-fg: #ffffff;
  --fw-fg-muted: rgba(255, 255, 255, .72);
  --fw-accent: #9ccfff;
  --fw-on-accent: #04131c;
  --fw-border: transparent;
  --fw-rule: rgba(255, 255, 255, .3);
  --fw-track: rgba(255, 255, 255, .22);
  --fw-control: rgba(255, 255, 255, .1);
  --fw-hover: rgba(255, 255, 255, .1);
  --fw-radius: 18px;
  --fw-pad: 12px;
  --fw-shadow: none;
  --fw-warn: #ffc46b;
  color-scheme: dark;
}

.wd-fw[data-fw-theme="type"] .fw-card { box-shadow: none; backdrop-filter: none; }
.wd-fw[data-fw-theme="type"] .fw-card:hover,
.wd-fw[data-fw-theme="type"] .fw-card:focus-within { background: rgba(8, 12, 30, .42); }

/* \u2500\u2500 \u9876\u680F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: none;
  color: var(--fw-fg);
}
.fw-bar h1 { margin: 0; font-size: 19px; font-weight: 500; letter-spacing: -.01em; }
.fw-bar .fw-sub { color: var(--fw-fg-muted); font-size: 11px; }
.fw-bar .fw-grow { flex: 1; }
.fw-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: var(--fw-control);
  border: 1px solid var(--fw-border);
  flex-wrap: wrap;
}
.fw-seg button {
  height: 26px;
  padding: 0 9px;
  border: 0;
  border-radius: 7px;
  background: none;
  color: var(--fw-fg-muted);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.fw-seg button[aria-pressed="true"] { background: var(--fw-card-solid); color: var(--fw-fg); }
.wd-fw[data-fw-theme="instrument"] .fw-seg button[aria-pressed="true"],
.wd-fw[data-fw-theme="type"] .fw-seg button[aria-pressed="true"] { background: rgba(255, 255, 255, .14); }

.fw-btn {
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--fw-border);
  border-radius: 9px;
  background: var(--fw-control);
  color: var(--fw-fg);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}
.fw-btn:hover { background: var(--fw-hover); }
.fw-btn.is-on { background: var(--fw-accent); color: var(--fw-on-accent); border-color: transparent; font-weight: 600; }

/* \u2500\u2500 \u7F51\u683C\uFF1A8 \u5217\uFF0C1\xD71 / 2\xD71 / 4\xD73 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-grid {
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: repeat(var(--fw-cols), minmax(0, 1fr));
  grid-auto-rows: var(--fw-cell);
  gap: var(--fw-gap);
  align-content: start;
  overflow-y: auto;
  padding-bottom: 4px;
  --fw-gap: 12px;
  --fw-cell: clamp(104px, calc((100cqw - 36px - 7 * var(--fw-gap)) / 8), 168px);
}

.fw-slot { position: relative; min-width: 0; min-height: 0; }
.fw-slot.is-s { grid-column: span 1; grid-row: span 1; }
.fw-slot.is-m { grid-column: span 2; grid-row: span 1; }
.fw-slot.is-l { grid-column: span 4; grid-row: span 3; }

/* \u2500\u2500 \u5361\u7247\uFF1AFullWidget body \u7684\u6750\u8D28 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-width: 0;
  padding: var(--fw-pad);
  border-radius: var(--fw-radius);
  background: var(--fw-card);
  box-shadow: var(--fw-shadow), inset 0 0 0 1px var(--fw-border);
  color: var(--fw-fg);
  overflow: hidden;
  font-family: var(--fw-font);
}

.fw-head {
  display: flex;
  align-items: baseline;
  gap: 7px;
  flex: none;
  min-width: 0;
}
.fw-head h2 {
  margin: 0;
  font-family: var(--fw-font-title, var(--fw-font));
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fw-head .fw-meta { margin-left: auto; color: var(--fw-fg-muted); font-size: 10px; white-space: nowrap; }
.fw-body { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

/* FullWidget kit\uFF1Alabel / display / num / rule / check / track / btn */
.fw-label { font-size: 11px; color: var(--fw-fg-muted); letter-spacing: .01em; white-space: nowrap; }
.fw-num { font-family: var(--fw-font-num); font-weight: var(--fw-num-weight); font-variant-numeric: tabular-nums; }
.fw-display {
  font-family: var(--fw-font-num);
  font-weight: var(--fw-display-weight);
  letter-spacing: var(--fw-display-tracking);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.fw-rule { height: 1px; margin: 0; border: 0; background: var(--fw-rule); flex: none; }
.fw-check {
  flex: none;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1.5px solid var(--fw-fg-muted);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  position: relative;
}
.fw-check[aria-pressed="true"] { background: var(--fw-accent); border-color: var(--fw-accent); }
.fw-check[aria-pressed="true"]::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 7px;
  border: solid var(--fw-on-accent);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.wd-fw[data-fw-theme="paper"] .fw-check { border-radius: 3px; border-color: var(--fw-fg); }
.wd-fw[data-fw-theme="paper"] .fw-check[aria-pressed="true"] { background: transparent; }
.wd-fw[data-fw-theme="paper"] .fw-check[aria-pressed="true"]::after { border-color: var(--fw-fg); }

/* \u2500\u2500 \u7EC4\u4EF6\u5185\u5BB9\uFF1A\u540C\u4E00\u7EC4\u4EF6\u5728\u4E09\u4E2A\u5C3A\u5BF8\u4E0B\u7684\u4E0D\u540C\u4FE1\u606F\u5C42\u7EA7 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-hero { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
.fw-hero .fw-display { font-size: clamp(30px, 9cqw, 54px); }
.fw-hero div { min-width: 0; }
.fw-hero strong { display: block; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fw-hero small { display: block; margin-top: 4px; color: var(--fw-fg-muted); font-size: 10px; }

.fw-list { display: flex; flex-direction: column; gap: 2px; min-height: 0; overflow: hidden; flex: 1; }
.fw-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; min-width: 0; font-size: 12px; }
.fw-row time { flex: none; width: 36px; color: var(--fw-fg-muted); font-family: var(--fw-font-num); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.fw-row .fw-row-main { flex: 1; min-width: 0; }
.fw-row b { display: block; font-weight: 500; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fw-row small { display: block; margin-top: 2px; color: var(--fw-fg-muted); font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fw-row .fw-dot { flex: none; width: 5px; height: 5px; border-radius: 50%; background: var(--fw-fg-muted); }
.fw-row.is-now { background: var(--fw-hover); border-radius: 8px; margin: 0 -6px; padding-left: 6px; padding-right: 6px; }
.fw-row.is-now .fw-dot { background: var(--fw-accent); }
.fw-row.is-muted { opacity: .5; }

.fw-quote { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 4px 0; min-width: 0; }
.fw-quote .fw-quote-name { flex: 1; min-width: 0; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fw-quote .fw-num { font-size: 13px; }
.fw-quote .fw-pct { width: 52px; text-align: right; font-size: 10.5px; font-variant-numeric: tabular-nums; }
.fw-up { color: #e0a49c; }
.fw-down { color: #9ccdb2; }
.wd-fw[data-fw-theme="paper"] .fw-up { color: #b3261e; }
.wd-fw[data-fw-theme="paper"] .fw-down { color: #1b6b46; }

.fw-brief { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 6px; }
.fw-brief h3 { margin: 0; font-family: var(--fw-font-title, var(--fw-font)); font-size: 14px; font-weight: 500; line-height: 1.4; }
.fw-brief p { margin: 0; font-size: 11px; line-height: 1.65; color: var(--fw-fg-muted); }
.fw-brief .fw-clamp { display: -webkit-box; -webkit-line-clamp: var(--fw-lines, 3); -webkit-box-orient: vertical; overflow: hidden; }

.fw-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 7px;
  border-top: 1px solid var(--fw-rule);
  color: var(--fw-fg-muted);
  font-size: 9.5px;
}
.fw-foot button { margin-left: auto; border: 0; background: none; color: var(--fw-accent); font: inherit; font-size: 10px; cursor: pointer; }

.fw-empty { color: var(--fw-fg-muted); font-size: 11px; padding: 2px 0; }
/* \u6574\u5361\u53EF\u70B9\u7684\u5C0F\u5361\u6309\u94AE\uFF1A\u5FC5\u987B\u6709\u771F\u5B9E\u76D2\u5B50\uFF08display:contents \u4F1A\u8BA9\u7126\u70B9\u6846\u548C\u70B9\u51FB\u533A\u57DF\u90FD\u6D88\u5931\uFF09 */
.fw-link {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* \u53EF\u70B9\u51FB\u7684\u5217\u8868\u884C\uFF1A\u6309\u94AE\u5916\u89C2\u5168\u90E8\u91CD\u7F6E\uFF0C\u53EA\u4FDD\u7559\u884C\u672C\u8EAB\u7684\u6392\u7248 */
.fw-row-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}
.fw-row-btn:hover b { text-decoration: underline; }

/* 24 \u5C0F\u65F6\u8FDB\u5EA6\u6761\uFF08\u65F6\u949F\u7684\u5927\u5C3A\u5BF8\uFF09 */
.fw-track { height: 4px; border-radius: 99px; background: var(--fw-track); overflow: hidden; flex: none; }
.fw-track > i { display: block; height: 100%; border-radius: inherit; background: var(--fw-accent); }

/* \u5C0F\u5361\u53EA\u7559\u4E00\u53E5\u5224\u65AD\uFF1A1\xD71 \u91CC\u4E0D\u5806\u4E24\u884C\u6B8B\u53E5 */
.wd-fw .fw-slot.is-s .fw-card { padding: 14px; gap: 5px; }
.wd-fw .fw-slot.is-s .fw-head h2 { font-size: 11px; }
.wd-fw .fw-slot.is-s .fw-hero { overflow: hidden; }
.wd-fw .fw-slot.is-s .fw-hero small,
.wd-fw .fw-slot.is-s .fw-hero strong {
  font-size: 10px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.wd-fw .fw-slot.is-s .fw-hero small { max-height: 13px; }
.wd-fw .fw-slot.is-s .fw-hero div { max-width: calc(100% - 56px); }
.wd-fw .fw-slot.is-s .fw-hero .fw-display { flex: none; }

/* \u4E2D\u5361\uFF1A\u5217\u8868\u884C\u53EA\u4FDD\u7559\u53EF\u626B\u8BFB\u7684\u4E24\u7EA7\u4FE1\u606F\uFF0C\u8D85\u51FA\u7684\u7531\u5927\u5361\u627F\u62C5 */
.wd-fw .fw-slot.is-m .fw-row { padding: 3px 0; }
.wd-fw .fw-slot.is-m .fw-row b { font-size: 11.5px; }
.wd-fw .fw-slot.is-m .fw-row small { font-size: 9px; }
.wd-fw .fw-slot.is-m .fw-body { overflow: hidden; }

/* \u2500\u2500 \u7F16\u8F91\u6001 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wd-fw.is-editing .fw-slot { outline: 1px dashed color-mix(in srgb, var(--fw-accent) 65%, transparent); outline-offset: 2px; border-radius: calc(var(--fw-radius) + 2px); }
.wd-fw.is-editing .fw-card .fw-body,
.wd-fw.is-editing .fw-card .fw-foot { pointer-events: none; }
.fw-edit {
  position: absolute;
  inset: -11px 4px auto auto;
  display: none;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--fw-card-solid) 92%, #000 8%);
  box-shadow: 0 6px 18px rgba(0, 0, 0, .35);
  z-index: 3;
  color: var(--fw-fg);
}
.fw-slot.is-editing .fw-edit { display: flex; }
.fw-edit button {
  height: 22px;
  min-width: 22px;
  padding: 0 6px;
  border: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, .1);
  color: #fff;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.wd-fw[data-fw-theme="paper"] .fw-edit { background: #2c2a25; }
.wd-fw[data-fw-theme="paper"] .fw-edit button { color: #f6f2ea; }
.fw-edit button[aria-pressed="true"] { background: var(--fw-accent); color: var(--fw-on-accent); }
.fw-edit .fw-drag { cursor: grab; background: rgba(255, 255, 255, .18); }
.fw-slot.is-dragging { opacity: .35; }
.fw-slot.is-drop { outline: 2px solid var(--fw-accent); outline-offset: 2px; }
.fw-hint { flex: none; font-size: 10px; color: var(--fw-fg-muted); }

/* \u2500\u2500 \u54CD\u5E94\u5F0F\uFF1A\u6309\u4E1A\u52A1\u5BB9\u5668\u5BBD\u5EA6\uFF0C\u800C\u4E0D\u662F\u6574\u7A97 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@container (max-width: 880px) {
  .fw-grid {
    --fw-cols: 4;
    --fw-cell: clamp(112px, calc((100cqw - 36px - 3 * var(--fw-gap)) / 4), 190px);
  }
  .fw-slot.is-l { grid-column: span 4; grid-row: span 3; }
}
@container (max-width: 560px) {
  .fw-grid {
    --fw-cols: 2;
    --fw-cell: clamp(118px, calc((100cqw - 36px - var(--fw-gap)) / 2), 210px);
  }
  .fw-slot.is-s { grid-column: span 1; grid-row: span 1; }
  .fw-slot.is-m { grid-column: span 2; grid-row: span 1; }
  /* \u624B\u673A\u4E0A\u7684\u5927\u5361\uFF1A\u6EE1\u5BBD\uFF0C\u4ECD\u4FDD\u6301\u4E09\u6BB5\u4FE1\u606F\u5C42\u7EA7\uFF0C\u4E0D\u6309\u684C\u9762\u957F\u5BBD\u6BD4\u538B\u7F29 */
  .fw-slot.is-l { grid-column: span 2; grid-row: span 3; }
  .fw-bar h1 { font-size: 16px; }
  .fw-bar .fw-sub { display: none; }
  /* \u89E6\u5C4F\u4E0B\u9876\u680F\u6309\u94AE\u4E0E\u683C\u5B50\u91CC\u7684\u7F16\u8F91\u63A7\u4EF6\u90FD\u6309 44px \u6700\u5C0F\u70B9\u51FB\u9AD8\u5EA6 */
  .fw-bar .fw-btn { height: 44px; padding: 0 14px; }
  .fw-edit button { height: 44px; min-width: 30px; }
  .fw-foot { font-size: 9px; }
}
@container (max-width: 380px) {
  .fw-hero .fw-display { font-size: 30px; }
  .fw-head .fw-meta { display: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .fw-card { transition: box-shadow .2s ease, transform .2s ease; }
  .fw-slot:hover .fw-card { transform: translateY(-1px); }
}

/* \u2500\u2500 \u7F16\u8F91\u6001\u7F51\u683C\uFF1A\u62D6\u52A8\u65F6\u770B\u5F97\u89C1\u6BCF\u4E2A\u53EF\u7528\u683C\u5B50 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-cells {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(var(--fw-cols), minmax(0, 1fr));
  grid-auto-rows: var(--fw-cell);
  gap: var(--fw-gap);
  pointer-events: none;
  align-content: start;
}
.fw-cells > i {
  display: block;
  border: 1px dashed color-mix(in srgb, var(--fw-accent) 26%, transparent);
  border-radius: calc(var(--fw-radius) / 2);
  background: color-mix(in srgb, var(--fw-accent) 3%, transparent);
}
.wd-fw.is-editing .fw-grid { gap: var(--fw-gap); }
.wd-fw.is-editing .fw-slot.is-drop .fw-card { box-shadow: 0 0 0 2px var(--fw-accent), var(--fw-shadow); }

/* \u2500\u2500 FullWidget \u539F\u751F\u7EC4\u4EF6\u5BB9\u5668 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-card.is-widget { padding: 8px 10px; gap: 4px; }
.fw-card.is-widget .fw-head { padding: 2px 2px 4px; }
.fw-card.is-widget .fw-icon { width: 14px; height: 14px; flex: none; opacity: .85; }
.fw-frame { width: 100%; height: 100%; min-height: 0; border: 0; display: block; background: transparent; }

/* \u2500\u2500 \u6DFB\u52A0\u7EC4\u4EF6\u9762\u677F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-panel {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 14px;
  padding: 12px 14px;
  border-radius: calc(var(--fw-radius) / 1.4);
  background: color-mix(in srgb, var(--fw-card-solid) 80%, transparent);
  border: 1px solid var(--fw-border);
  max-height: 46vh;
  overflow: auto;
}
.fw-panel-section { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.fw-panel-section h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--fw-fg);
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.fw-chiprow { display: flex; flex-wrap: wrap; gap: 5px; }
.fw-input {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--fw-border);
  border-radius: 8px;
  background: var(--fw-control);
  color: var(--fw-fg);
  font: inherit;
  font-size: 11.5px;
  font-family: var(--fw-font-num);
  outline: none;
}
.fw-input:focus { border-color: color-mix(in srgb, var(--fw-accent) 70%, transparent); }
.fw-widgetgrid { display: flex; flex-wrap: wrap; gap: 5px; max-height: 30vh; overflow: auto; }
.fw-widgetchip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid var(--fw-border);
  border-radius: 8px;
  background: var(--fw-control);
  color: var(--fw-fg);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.fw-widgetchip:hover { background: var(--fw-hover); }
.fw-widgetchip img { width: 16px; height: 16px; }

/* \u2500\u2500 \u751F\u6210\u5F0F\u5361\u7247 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-genui { display: flex; flex-direction: column; gap: 7px; min-height: 0; overflow: hidden; }
.fw-genui h3 { margin: 0; font-family: var(--fw-font-title, var(--fw-font)); font-size: 14px; font-weight: 600; }
.fw-gtext { margin: 0; font-size: 11.5px; line-height: 1.6; color: var(--fw-fg-muted); }
.fw-gtext.is-title { font-size: 15px; color: var(--fw-fg); font-weight: 600; }
.fw-gstat { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.fw-gstat-value { font-size: 26px; }
.fw-gdelta { font-size: 10.5px; font-variant-numeric: tabular-nums; }
.fw-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 99px;
  font-size: 10px;
  border: 1px solid var(--fw-border);
  color: var(--fw-fg);
  align-self: flex-start;
}
.fw-badge.is-success { border-color: #7fbfa0; color: #a7d8c1; }
.fw-badge.is-warning { border-color: #d6ab6a; color: #e7c58f; }
.fw-badge.is-danger { border-color: #cf8a83; color: #e9ada4; }
.fw-badge.is-muted { color: var(--fw-fg-muted); }
.fw-badge.is-accent { border-color: var(--fw-accent); color: var(--fw-accent); }
.fw-gprogress { display: flex; align-items: center; gap: 10px; }
.fw-gprogress .fw-grow { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.fw-gprogress .fw-num { font-size: 12px; }
.fw-glist { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
.fw-glist li b { display: block; font-size: 11.5px; font-weight: 500; }
.fw-glist li small { display: block; color: var(--fw-fg-muted); font-size: 9.5px; }
.fw-gkv { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 11.5px; }
.fw-gkv dt { color: var(--fw-fg-muted); }
.fw-gkv dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
.fw-gsteps { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.fw-gsteps li { font-size: 10.5px; padding: 3px 8px; border-radius: 99px; border: 1px solid var(--fw-border); color: var(--fw-fg-muted); }
.fw-gsteps li.is-on { border-color: var(--fw-accent); color: var(--fw-fg); }
.fw-gcallout { padding: 8px 10px; border-radius: 8px; border-left: 3px solid var(--fw-accent); background: var(--fw-control); }
.fw-gcallout b { display: block; font-size: 11.5px; margin-bottom: 3px; }
.fw-gcallout p { margin: 0; font-size: 10.5px; color: var(--fw-fg-muted); }
.fw-gcallout.is-warning { border-left-color: #d6ab6a; }
.fw-gcallout.is-danger { border-left-color: #cf8a83; }
.fw-gcallout.is-success { border-left-color: #7fbfa0; }
.fw-gchart { display: flex; align-items: flex-end; gap: 8px; height: 90px; min-height: 0; }
.fw-gbar { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; height: 100%; min-width: 0; }
.fw-gbar i { width: 100%; max-width: 26px; border-radius: 3px; background: var(--fw-accent); opacity: .85; min-height: 2px; }
.fw-gbar span { font-size: 9px; color: var(--fw-fg-muted); white-space: nowrap; }

/* \u2500\u2500 \u7EC4\u4EF6\u8BBE\u7F6E\u5F39\u5C42 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fw-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 12, 22, .55);
  backdrop-filter: blur(6px);
}
.fw-modal-card {
  width: min(420px, 92vw);
  max-height: 82vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--fw-card-solid);
  color: var(--fw-fg);
  border: 1px solid var(--fw-border);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .45);
}
.fw-modal-card header { display: flex; align-items: center; gap: 8px; }
.fw-modal-card h3 { margin: 0; font-size: 14px; flex: 1; }
.fw-modal-card header button { border: 0; background: none; color: var(--fw-fg-muted); font-size: 16px; cursor: pointer; }
.fw-field { display: flex; align-items: center; gap: 12px; font-size: 12px; }
.fw-field > span { flex: 1; color: var(--fw-fg-muted); }
.fw-field input[type="text"], .fw-field input[type="number"], .fw-field select {
  min-width: 0;
  max-width: 58%;
  padding: 6px 8px;
  border: 1px solid var(--fw-border);
  border-radius: 7px;
  background: var(--fw-control);
  color: var(--fw-fg);
  font: inherit;
  font-size: 11.5px;
}
.fw-field.is-toggle input { width: 18px; height: 18px; flex: none; }
.fw-modal-card footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }

@container (max-width: 880px) {
  .fw-panel { grid-template-columns: minmax(0, 1fr); max-height: 52vh; }
}

`;var q=ee(require("react"),1);function Dn(e,t){return Math.max(0,Math.round((new Date(e)-t)/6e4))}function $n(){let e=$(l=>l.state),t=$(l=>l.quotes),[n,a]=q.default.useState(!1);if(!e)return null;let r=new Date,i=e.events.filter(l=>l.status!=="cancelled"&&new Date(l.end??l.start)>r).sort((l,S)=>new Date(l.start)-new Date(S.start)),s=i[0]??null,o=e.tasks.filter(l=>!l.done),c=e.mails.filter(l=>l.unread),m=e.watchlist.map(l=>({...l,quote:t[l.code]})).filter(l=>l.quote),g=m[0]??null,p=[s?{key:"next",icon:"clock",text:`${P(s.start)} ${s.title}`,hint:Dn(s.start,r)>0?`${se(s.start,r)}`:"\u8FDB\u884C\u4E2D"}:null,o.length?{key:"task",icon:"check",text:`${o.length} \u6761\u5F85\u529E`,hint:o[0].title}:null,c.length?{key:"mail",icon:"mail",text:`${c.length} \u5C01\u672A\u8BFB`,hint:c[0].subject}:null,g?{key:"quote",icon:"chart",text:`${g.quote.name} ${g.quote.price}`,hint:`${g.quote.changePct>=0?"+":""}${Number(g.quote.changePct).toFixed(2)}%`}:null].filter(Boolean);return q.default.createElement("div",{className:`wd-island ${n?"is-open":""}`,"aria-label":"\u7075\u52A8\u5C9B"},q.default.createElement("div",{className:"wd-island-pill"},q.default.createElement("span",{className:"wd-island-live","aria-hidden":"true"}),p.slice(0,2).map(l=>q.default.createElement("span",{key:l.key,className:"wd-island-item"},q.default.createElement(M,{name:l.icon,size:12}),q.default.createElement("b",null,l.text),q.default.createElement("small",null,l.hint))),q.default.createElement("button",{type:"button",className:"wd-island-toggle",onClick:()=>a(l=>!l),"aria-expanded":n},q.default.createElement(M,{name:n?"chevU":"chevD",size:13}),n?"\u6536\u8D77":"\u5C55\u5F00")),n?q.default.createElement("div",{className:"wd-island-grid"},q.default.createElement("section",{className:"wd-island-atom is-2x2"},q.default.createElement("header",null,q.default.createElement("h3",null,"\u4E0B\u4E00\u4EF6"),q.default.createElement("span",null,i.length," \u4E2A\u4F1A")),q.default.createElement("ul",null,i.slice(0,3).map(l=>q.default.createElement("li",{key:l.id},q.default.createElement("b",null,P(l.start)),q.default.createElement("span",null,l.title),q.default.createElement("small",null,Dn(l.start,r)>0?se(l.start,r):"\u8FDB\u884C\u4E2D"))),i.length===0?q.default.createElement("li",{className:"is-empty"},"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392"):null)),q.default.createElement("section",{className:"wd-island-atom is-2x2"},q.default.createElement("header",null,q.default.createElement("h3",null,"\u5F85\u529E"),q.default.createElement("span",null,o.length," \u6761")),q.default.createElement("ul",null,o.slice(0,3).map(l=>q.default.createElement("li",{key:l.id},q.default.createElement("b",null,l.title),q.default.createElement("small",null,l.due?P(l.due):"\u65E0\u622A\u6B62"))),o.length===0?q.default.createElement("li",{className:"is-empty"},"\u90FD\u505A\u5B8C\u4E86"):null),q.default.createElement("button",{type:"button",className:"wd-island-link",onClick:()=>y({view:"today"})},"\u6253\u5F00\u4ECA\u65E5",q.default.createElement(M,{name:"arrow",size:11}))),q.default.createElement("section",{className:"wd-island-atom is-2x2"},q.default.createElement("header",null,q.default.createElement("h3",null,"\u672A\u8BFB"),q.default.createElement("span",null,c.length," \u5C01")),q.default.createElement("ul",null,c.slice(0,3).map(l=>q.default.createElement("li",{key:l.id},q.default.createElement("b",null,l.from?.name||l.from?.address),q.default.createElement("span",null,l.subject))),c.length===0?q.default.createElement("li",{className:"is-empty"},"\u6CA1\u6709\u672A\u8BFB"):null),q.default.createElement("button",{type:"button",className:"wd-island-link",onClick:()=>y({view:"mail"})},"\u53BB\u90AE\u4EF6",q.default.createElement(M,{name:"arrow",size:11}))),q.default.createElement("section",{className:"wd-island-atom is-2x2"},q.default.createElement("header",null,q.default.createElement("h3",null,"\u81EA\u9009"),q.default.createElement("span",null,m.length," \u53EA")),q.default.createElement("ul",{className:"is-quotes"},m.slice(0,4).map(l=>q.default.createElement("li",{key:l.code},q.default.createElement("b",null,l.quote.name),q.default.createElement("span",{className:l.quote.changePct>=0?"is-up":"is-down"},le(l.quote.price,2)),q.default.createElement("small",{className:l.quote.changePct>=0?"is-up":"is-down"},l.quote.changePct>=0?"+":"",Number(l.quote.changePct).toFixed(2),"%"))),m.length===0?q.default.createElement("li",{className:"is-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009"):null))):null)}var f=ee(require("react"),1);function Qa({value:e,onChange:t,counts:n}){let a=[{value:"all",label:`\u5168\u90E8 ${n.all}`},{value:"unread",label:`\u672A\u8BFB ${n.unread}`},{value:"starred",label:`\u661F\u6807 ${n.starred}`},{value:"drafts",label:`\u8349\u7A3F ${n.drafts}`}];return f.default.createElement("div",{className:"wd-mail-filters",role:"tablist","aria-label":"\u90AE\u4EF6\u7B5B\u9009"},a.map(r=>f.default.createElement("button",{key:r.value,type:"button",role:"tab","aria-selected":e===r.value,className:e===r.value?"is-on":"",onClick:()=>t(r.value)},r.label)))}function Za({mail:e,active:t,onClick:n}){return f.default.createElement("button",{type:"button",className:`wd-mail-row ${e.unread?"is-unread":""} ${t?"is-active":""}`,onClick:n},f.default.createElement("span",{className:`wd-mail-dot ${e.unread?"is-unread":""}`,"aria-hidden":"true"}),f.default.createElement("span",{className:"wd-mail-row-main"},f.default.createElement("span",{className:"wd-mail-row-top"},f.default.createElement("b",null,e.from?.name||e.from?.address||"\u6211"),f.default.createElement("time",null,Vt(e.date))),f.default.createElement("span",{className:"wd-mail-row-subject"},e.starred?f.default.createElement(M,{name:"star",size:11,fill:!0}):null,e.hasAttachments?f.default.createElement(M,{name:"paperclip",size:11}):null,e.subject),f.default.createElement("span",{className:"wd-mail-row-snippet"},e.snippet||"\uFF08\u65E0\u6B63\u6587\u9884\u89C8\uFF09")))}function Ra(e){let t=new Date(Date.now()+18e5);t.setSeconds(0,0),y({dialog:{title:"\u628A\u90AE\u4EF6\u53D8\u6210\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:e.subject,start:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}T${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,minutes:30,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"}],onSubmit:n=>{let a=new Date(n.start);U([{op:"add_event",title:n.title,start:a.toISOString(),end:new Date(a.getTime()+Math.max(5,Number(n.minutes)||30)*6e4).toISOString(),location:n.location??"",notes:e.snippet??"",mailId:e.id,source:"mail"}],{label:"\u4ECE\u90AE\u4EF6\u65B0\u5EFA\u65E5\u7A0B"})}}})}function ei({mail:e}){if(!e)return f.default.createElement(we,{title:"\u9009\u4E00\u5C01\u90AE\u4EF6",hint:"\u5DE6\u8FB9\u5217\u8868\u91CC\u70B9\u4E00\u5C01\uFF0C\u8FD9\u91CC\u663E\u793A\u6B63\u6587\u3002\u90AE\u4EF6\u6B63\u6587\u6309\u7EAF\u6587\u672C\u6E32\u67D3\uFF0C\u4E0D\u52A0\u8F7D\u8FDC\u7A0B\u56FE\u7247\u3002"});let t=e.from??{};return f.default.createElement("article",{className:"wd-reader"},f.default.createElement("header",{className:"wd-reader-head"},f.default.createElement("h2",null,e.subject),f.default.createElement("div",{className:"wd-reader-meta"},f.default.createElement("span",null,f.default.createElement("b",null,t.name||t.address)," ",t.name?`<${t.address}>`:""),f.default.createElement("span",null,ct(e.date)),e.folder?f.default.createElement("span",{className:"wd-muted"},e.folder):null),f.default.createElement("div",{className:"wd-reader-actions"},f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Ve({to:t.address??"",subject:/^re:/i.test(e.subject)?e.subject:`Re: ${e.subject}`,text:"",replyToId:e.id})},f.default.createElement(M,{name:"reply",size:13}),"\u56DE\u590D"),f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>lt(e.id,e.starred?"unstar":"star")},f.default.createElement(M,{name:"star",size:13,fill:e.starred}),e.starred?"\u53D6\u6D88\u661F\u6807":"\u661F\u6807"),f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>lt(e.id,e.unread?"read":"unread")},f.default.createElement(M,{name:"eye",size:13}),e.unread?"\u6807\u4E3A\u5DF2\u8BFB":"\u6807\u4E3A\u672A\u8BFB"),f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Ra(e)},f.default.createElement(M,{name:"calendar",size:13}),"\u8F6C\u65E5\u7A0B"),f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Pe({title:`\u56DE\u590D\uFF1A${e.subject.slice(0,30)}`,mailId:e.id})},f.default.createElement(M,{name:"check",size:13}),"\u8F6C\u5F85\u529E"))),e.attachments?.length?f.default.createElement("ul",{className:"wd-reader-files"},e.attachments.map((n,a)=>f.default.createElement("li",{key:a},f.default.createElement(M,{name:"paperclip",size:12}),n.filename,f.default.createElement("small",null,Math.round((n.size??0)/1024)," KB")))):null,f.default.createElement("pre",{className:"wd-reader-body"},e.body||e.snippet||"\uFF08\u8FD9\u5C01\u90AE\u4EF6\u6CA1\u6709\u6B63\u6587\uFF09"))}function ti(){let e=$(p=>p.composer),t=$(p=>p.confirmSend),n=$(p=>p.sending),a=$(p=>p.settings),[r,i]=f.default.useState(e??{});if(f.default.useEffect(()=>i(e??{}),[e]),!e)return null;let s=(p,l)=>i(S=>({...S,[p]:l})),c=(a?.mail?.provider??"demo")==="dsh-email",m=c||!!a?.mail?.smtp?.host,g=async()=>{let p={to:r.to,cc:r.cc??"",subject:r.subject,text:r.text,replyToId:r.replyToId??null};(r.id?await U([{op:"update_draft",id:r.id,...p}],{label:"\u4FDD\u5B58\u8349\u7A3F"}):await U([{op:"add_draft",...p}],{label:"\u4FDD\u5B58\u8349\u7A3F"}))&&Je()};return f.default.createElement(Te,{title:r.replyToId?"\u56DE\u590D":"\u5199\u90AE\u4EF6",onClose:Je,width:620},f.default.createElement("div",{className:"wd-form"},f.default.createElement("label",{className:"wd-field"},f.default.createElement("span",null,"\u6536\u4EF6\u4EBA"),f.default.createElement("input",{value:r.to??"",onChange:p=>s("to",p.target.value),placeholder:"name@company.com"})),f.default.createElement("label",{className:"wd-field"},f.default.createElement("span",null,"\u6284\u9001"),f.default.createElement("input",{value:r.cc??"",onChange:p=>s("cc",p.target.value),placeholder:"\u53EF\u7559\u7A7A"})),f.default.createElement("label",{className:"wd-field"},f.default.createElement("span",null,"\u4E3B\u9898"),f.default.createElement("input",{value:r.subject??"",onChange:p=>s("subject",p.target.value)})),f.default.createElement("label",{className:"wd-field"},f.default.createElement("span",null,"\u6B63\u6587"),f.default.createElement("textarea",{rows:10,value:r.text??"",onChange:p=>s("text",p.target.value),placeholder:"\u5199\u6E05\u695A\u8981\u5BF9\u65B9\u505A\u4EC0\u4E48\u3001\u4EC0\u4E48\u65F6\u5019\u8981\u3002"})),f.default.createElement("div",{className:"wd-form-foot"},c?null:f.default.createElement("button",{type:"button",className:"wd-btn",onClick:g},"\u5B58\u8349\u7A3F"),f.default.createElement("span",{style:{flex:1}}),f.default.createElement("button",{type:"button",className:"wd-btn",onClick:Je},"\u53D6\u6D88"),f.default.createElement("button",{type:"button",className:"wd-btn is-primary",disabled:n||!r.to||!r.subject,onClick:()=>y({confirmSend:!0})},c?"\u5B58\u4E3A\u8349\u7A3F":m?"\u53D1\u9001":"\u53D1\u9001\uFF08\u672A\u914D\u7F6E SMTP\uFF09")),t?f.default.createElement("div",{className:"wd-confirm"},c?f.default.createElement("p",null,"\u786E\u8BA4\u628A\u8FD9\u5C01\u653E\u8FDB DSH \u90AE\u4EF6\u63D2\u4EF6\u7684\u8349\u7A3F\u7BB1\uFF1F",f.default.createElement("b",null,"\u5B83\u4E0D\u4F1A\u76F4\u63A5\u53D1\u51FA\u53BB"),"\uFF0C\u8981\u4F60\u5728 \u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u8349\u7A3F \u91CC\u9884\u89C8\u540E\u518D\u786E\u8BA4\u3002"):f.default.createElement("p",null,"\u786E\u8BA4\u53D1\u7ED9 ",f.default.createElement("b",null,r.to),"\uFF1F\u53D1\u51FA\u540E\u4E0D\u53EF\u64A4\u56DE\u3002"),f.default.createElement("div",null,f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>y({confirmSend:!1})},"\u518D\u770B\u770B"),f.default.createElement("button",{type:"button",className:"wd-btn is-small is-primary",disabled:n,onClick:Pt},n?"\u5904\u7406\u4E2D\u2026":c?"\u5199\u5165\u8349\u7A3F":"\u786E\u8BA4\u53D1\u9001"))):null,!m&&!c?f.default.createElement("p",{className:"wd-muted wd-composer-hint"},"\u8FD8\u6CA1\u6709\u914D\u7F6E SMTP\uFF0C\u53D1\u4E0D\u51FA\u53BB\u3002\u5148\u5B58\u8349\u7A3F\uFF0C\u6216\u8005\u5230\u8BBE\u7F6E\u91CC\u586B\u53D1\u4FE1\u670D\u52A1\u5668\u3002"):null,c?f.default.createElement("p",{className:"wd-muted wd-composer-hint"},"\u53D1\u9001\u7531 DSH \u90AE\u4EF6\u63D2\u4EF6\u8D1F\u8D23\uFF0C\u5DE5\u4F5C\u53F0\u53EA\u5199\u8349\u7A3F\uFF0C\u4E0D\u78B0\u4F60\u7684\u6388\u6743\u7801\u3002"):null))}function ni(){let e=$(t=>t.mail);return f.default.createElement("div",{className:"wd-connect"},f.default.createElement("h2",null,"\u5148\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1"),f.default.createElement("p",null,"\u5DE5\u4F5C\u53F0\u4E0D\u653E\u793A\u4F8B\u90AE\u4EF6\u3002",e.pluginAvailable?"\u68C0\u6D4B\u5230\u4F60\u88C5\u4E86 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u76F4\u63A5\u7528\u5B83\u6700\u7701\u4E8B\uFF1A":"\u4E24\u79CD\u63A5\u6CD5\uFF0C\u4EFB\u9009\u4E00\u79CD\uFF1A"),f.default.createElement("div",{className:"wd-connect-opts"},e.pluginAvailable?f.default.createElement("button",{type:"button",className:"wd-connect-opt",onClick:async()=>{await Ke({mail:{provider:"dsh-email"}}),(await Ye())?.ok||y({settingsOpen:!0})}},f.default.createElement("b",null,"\u4E00\u952E\u63A5\u5165 DSH \u90AE\u4EF6\u63D2\u4EF6",e.account?`\uFF08${e.account}\uFF09`:""),f.default.createElement("span",null,"\u8D26\u53F7\u3001\u6388\u6743\u7801\u3001\u540C\u6B65\u90FD\u5728 dsh-email \u91CC\uFF1B\u5DE5\u4F5C\u53F0\u53EA\u8BFB\u5B83\u3001\u5199\u8349\u7A3F\uFF0C\u53D1\u9001\u7559\u5728\u5B83\u7684\u8349\u7A3F\u7BB1\u786E\u8BA4\u3002")):null,f.default.createElement("button",{type:"button",className:"wd-connect-opt",onClick:()=>y({settingsOpen:!0})},f.default.createElement("b",null,e.pluginAvailable?"\u6539\u7528\u81EA\u5DF1\u586B\u7684 IMAP / SMTP":"\u586B IMAP / SMTP"),f.default.createElement("span",null,"QQ / 163 \u7528\u6388\u6743\u7801\uFF0CGmail \u7528\u5E94\u7528\u4E13\u7528\u5BC6\u7801\uFF1B\u586B\u5B8C\u70B9\u300C\u6D4B\u8BD5\u8FDE\u63A5\u300D\u3002"))),f.default.createElement("p",{className:"wd-muted"},"\u8DEF\u5F84\uFF1A\u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u90AE\u4EF6\u6765\u6E90\u3002\u63A5\u597D\u540E\u56DE\u5230\u8FD9\u91CC\u70B9\u300C\u540C\u6B65\u300D\u3002"))}function Mn(){let e=$(p=>p.state),t=$(p=>p.mailFilter),n=$(p=>p.mailQuery),a=$(p=>p.focusMailId),r=$(p=>p.mail),i=e.drafts??[],s={all:e.mails.length,unread:e.mails.filter(p=>p.unread).length,starred:e.mails.filter(p=>p.starred).length,drafts:i.length},o=f.default.useMemo(()=>{let p=n.trim().toLowerCase();return e.mails.filter(l=>t==="unread"&&!l.unread||t==="starred"&&!l.starred||t==="drafts"?!1:p?[l.subject,l.snippet,l.from?.name,l.from?.address].some(S=>String(S??"").toLowerCase().includes(p)):!0)},[e.mails,t,n]),c=e.mails.find(p=>p.id===a)??null,m=t==="drafts"?i.find(p=>p.id===a):null,g=e.mails.length===0;return f.default.createElement("div",{className:"wd-page wd-mail-page"},f.default.createElement("aside",{className:"wd-mail-side"},f.default.createElement("button",{type:"button",className:"wd-btn is-primary is-wide",onClick:()=>Ve({to:"",cc:"",subject:"",text:""})},f.default.createElement(M,{name:"edit",size:14}),"\u5199\u90AE\u4EF6"),f.default.createElement(Qa,{value:t,onChange:p=>y({mailFilter:p}),counts:s}),f.default.createElement("div",{className:"wd-mail-account"},r.provider==="demo"&&r.pluginAvailable?f.default.createElement("p",{className:"wd-mail-hint"},"\u68C0\u6D4B\u5230 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u53EF\u4EE5\u76F4\u63A5\u590D\u7528\u5B83\u7684\u8D26\u53F7\u3002",f.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>y({settingsOpen:!0})},"\u53BB\u63A5\u5165")):null,f.default.createElement("p",null,r.provider==="dsh-email"?`DSH \u90AE\u4EF6${r.account?` \xB7 ${r.account}`:""}`:r.provider==="imap"?r.address||"IMAP":"\u672A\u63A5\u5165\u90AE\u7BB1"),f.default.createElement("small",null,r.provider==="dsh-email"&&!r.pluginAvailable?"\u6CA1\u68C0\u6D4B\u5230 dsh-email \u7684\u90AE\u4EF6\u5DE5\u5177":r.provider==="demo"?"\u8BBE\u7F6E\u91CC\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1":r.lastSyncAt?`\u4E0A\u6B21\u540C\u6B65 ${P(r.lastSyncAt)}`:r.configured?"\u7B49\u5F85\u540C\u6B65":"\u8BBE\u7F6E\u91CC\u63A5\u5165\u81EA\u5DF1\u7684\u90AE\u7BB1"),r.lastSyncError?f.default.createElement("small",{className:"wd-error"},r.lastSyncError):null,f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:Ye,disabled:r.provider==="demo"||r.provider==="dsh-email"&&!r.pluginAvailable},f.default.createElement(M,{name:"refresh",size:12}),"\u540C\u6B65"),r.provider==="dsh-email"?f.default.createElement("small",null,"\u8BFB\u4FE1\u548C\u6807\u8BB0\u8D70 dsh-email\uFF0C\u53D1\u4FE1\u53EA\u5728\u5B83\u7684\u8349\u7A3F\u91CC\u786E\u8BA4\u3002"):null),f.default.createElement("p",{className:"wd-muted wd-mail-tip"},"\u6B63\u6587\u6309\u7EAF\u6587\u672C\u663E\u793A\uFF0C\u4E0D\u52A0\u8F7D\u8FDC\u7A0B\u56FE\u7247\uFF0C\u8FFD\u8E2A\u50CF\u7D20\u4E0D\u4F1A\u8BB0\u5F55\u4F60\u6253\u5F00\u8FC7\u3002")),f.default.createElement("section",{className:"wd-mail-list"},f.default.createElement("header",{className:"wd-mail-search"},f.default.createElement("label",{className:"wd-search"},f.default.createElement(M,{name:"search",size:15}),f.default.createElement("input",{value:n,onChange:p=>y({mailQuery:p.target.value}),placeholder:"\u641C\u53D1\u4EF6\u4EBA\u3001\u4E3B\u9898\u3001\u6B63\u6587\u6458\u8981","aria-label":"\u641C\u7D22\u90AE\u4EF6"}))),f.default.createElement("div",{className:"wd-mail-rows"},t==="drafts"?i.length===0?f.default.createElement("p",{className:"wd-card-empty"},"\u6CA1\u6709\u8349\u7A3F\u3002"):i.map(p=>f.default.createElement("button",{key:p.id,type:"button",className:`wd-mail-row ${p.id===a?"is-active":""}`,onClick:()=>y({focusMailId:p.id})},f.default.createElement("span",{className:"wd-mail-dot"}),f.default.createElement("span",{className:"wd-mail-row-main"},f.default.createElement("span",{className:"wd-mail-row-top"},f.default.createElement("b",null,"\u8349\u7A3F"),f.default.createElement("time",null,ae(p.createdAt))),f.default.createElement("span",{className:"wd-mail-row-subject"},p.subject||"\uFF08\u65E0\u4E3B\u9898\uFF09"),f.default.createElement("span",{className:"wd-mail-row-snippet"},p.to)))):o.length===0?f.default.createElement(we,{title:g?"\u8FD8\u6CA1\u6709\u90AE\u4EF6":"\u6CA1\u6709\u5339\u914D\u7684\u90AE\u4EF6",hint:g?"\u53F3\u8FB9\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1\uFF0C\u6216\u5728\u8BBE\u7F6E\u91CC\u63A5 DSH \u90AE\u4EF6\u63D2\u4EF6\u3002":n?"\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002":"\u70B9\u53F3\u4E0A\u89D2\u540C\u6B65\uFF0C\u6216\u8005\u5728\u8BBE\u7F6E\u91CC\u63A5\u5165\u90AE\u7BB1\u3002"}):o.map(p=>f.default.createElement(Za,{key:p.id,mail:p,active:p.id===a,onClick:()=>ze(p.id)})))),f.default.createElement("section",{className:"wd-mail-read"},g&&t!=="drafts"?f.default.createElement(ni,null):m?f.default.createElement("article",{className:"wd-reader"},f.default.createElement("header",{className:"wd-reader-head"},f.default.createElement("h2",null,m.subject),f.default.createElement("div",{className:"wd-reader-meta"},f.default.createElement("span",null,"\u53D1\u7ED9 ",m.to),f.default.createElement("span",null,ct(m.createdAt))),f.default.createElement("div",{className:"wd-reader-actions"},f.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Ve(m)},f.default.createElement(M,{name:"edit",size:13}),"\u7EE7\u7EED\u5199"),f.default.createElement("button",{type:"button",className:"wd-btn is-small is-danger",onClick:()=>U([{op:"delete_draft",id:m.id}],{label:"\u4E22\u5F03\u8349\u7A3F"})},f.default.createElement(M,{name:"trash",size:13}),"\u4E22\u5F03"))),f.default.createElement("pre",{className:"wd-reader-body"},m.text||"\uFF08\u8FD8\u6CA1\u5199\u6B63\u6587\uFF09")):f.default.createElement(ei,{mail:c})),f.default.createElement(ti,null))}var w=ee(require("react"),1);function Cn({quote:e,points:t,width:n=84,height:a=26}){if(t&&t.length>=3){let i=t.map(p=>p.price),s=Math.min(...i),c=Math.max(...i)-s||1,m=i.map((p,l)=>`${l?"L":"M"} ${l/(i.length-1)*n} ${a-(p-s)/c*(a-2)-1}`).join(" "),g=i[i.length-1]>=i[0];return w.default.createElement("svg",{className:`wd-spark ${g?"is-up":"is-down"}`,width:n,height:a,viewBox:`0 0 ${n} ${a}`,"aria-hidden":"true"},w.default.createElement("path",{d:m,fill:"none",stroke:"currentColor",strokeWidth:"1.4",strokeLinejoin:"round",strokeLinecap:"round"}))}if(!e)return w.default.createElement("span",{className:"wd-spark is-empty"});let r=e.changePct??0;return w.default.createElement("span",{className:`wd-spark-bar ${r>=0?"is-up":"is-down"}`,title:`${r>=0?"+":""}${r.toFixed(2)}%`,"aria-hidden":"true"},w.default.createElement("i",{style:{width:`${Math.min(100,Math.abs(r)*14+10)}%`}}))}function ai({data:e,quote:t}){let n=e?.points??[],a=e?.prevClose??t?.prevClose??null;if(n.length<2)return w.default.createElement("div",{className:"wd-chart-empty"},"\u8FD8\u6CA1\u6709\u5206\u65F6\u6570\u636E",a?"":"\uFF0C\u884C\u60C5\u6E90\u6CA1\u8FD4\u56DE","\u3002\u4EA4\u6613\u65F6\u6BB5\u5185\u5237\u65B0\u4E00\u4E0B\u8BD5\u8BD5\u3002");let r=n.map(x=>x.price);a&&r.push(a);let i=Math.min(...r),o=Math.max(...r)-i||1,c=600,m=200,g=x=>x/(n.length-1)*c,p=x=>m-(x-i)/o*(m-16)-8,l=n.map((x,C)=>`${C?"L":"M"} ${g(C).toFixed(1)} ${p(x.price).toFixed(1)}`).join(" "),S=`${l} L ${c} ${m} L 0 ${m} Z`,N=n[n.length-1],k=a?N.price>=a:!0;return w.default.createElement("div",{className:`wd-minute ${k?"is-up":"is-down"}`},w.default.createElement("svg",{viewBox:`0 0 ${c} ${m}`,preserveAspectRatio:"none",role:"img","aria-label":"\u5206\u65F6\u8D70\u52BF"},a?w.default.createElement(w.default.Fragment,null,w.default.createElement("line",{x1:"0",x2:c,y1:p(a),y2:p(a),className:"wd-minute-base"}),w.default.createElement("text",{x:"6",y:p(a)-5,className:"wd-minute-label"},a)):null,w.default.createElement("path",{d:S,className:"wd-minute-area"}),w.default.createElement("path",{d:l,className:"wd-minute-line"})),w.default.createElement("div",{className:"wd-minute-axis"},w.default.createElement("span",null,"09:30"),w.default.createElement("span",null,"11:30 / 13:00"),w.default.createElement("span",null,"15:00")))}function ii(e){let t=String(e??"").trim();t&&U([{op:"add_watch",code:t}],{label:`\u6DFB\u52A0\u81EA\u9009 ${t}`})}function qn(e){y({dialog:{title:`\u7ED9 ${e?.name??"\u8FD9\u53EA"} \u52A0\u63D0\u9192`,submitLabel:"\u52A0\u63D0\u9192",initial:{code:e?.symbol??"",threshold:"3",direction:"up"},fields:[{name:"code",label:"\u4EE3\u7801",required:!0},{name:"threshold",label:"\u6DA8\u8DCC\u5E45\u9608\u503C\uFF08%\uFF09",type:"number",required:!0},{name:"direction",label:"\u65B9\u5411",type:"select",options:[{value:"up",label:"\u6DA8\u8D85\u8FC7"},{value:"down",label:"\u8DCC\u8D85\u8FC7"}]}],onSubmit:t=>U([{op:"add_alert",kind:"price",code:t.code,threshold:Number(t.threshold)||3,direction:t.direction}],{label:"\u6DFB\u52A0\u80A1\u4EF7\u63D0\u9192"})}})}function En(){y({dialog:{title:"\u8BB0\u4E00\u7B14\u6301\u4ED3",submitLabel:"\u4FDD\u5B58",initial:{code:"",shares:"100",cost:""},fields:[{name:"code",label:"\u4EE3\u7801",required:!0,placeholder:"600519 / hk00700 / AAPL"},{name:"shares",label:"\u80A1\u6570",type:"number",required:!0},{name:"cost",label:"\u6210\u672C\u4EF7",type:"number",required:!0}],onSubmit:e=>U([{op:"add_position",code:e.code,shares:Number(e.shares),cost:Number(e.cost)}],{label:"\u8BB0\u4E00\u7B14\u6301\u4ED3"})}})}function ri({code:e,quotes:t,minute:n,positions:a,alerts:r}){let i=t[e],s=a.find(g=>g.code===e),o=r.find(g=>g.code===e);if(!e)return w.default.createElement(we,{title:"\u9009\u4E00\u53EA\u770B\u8BE6\u60C5",hint:"\u5DE6\u8FB9\u70B9\u4E00\u884C\uFF0C\u53F3\u8FB9\u51FA\u5206\u65F6\u548C\u6301\u4ED3\u3002"});let c=s&&i?(i.price-s.cost)*s.shares:null,m=s&&i&&s.cost?(i.price-s.cost)/s.cost*100:null;return w.default.createElement("section",{className:"wd-card wd-quote"},w.default.createElement("header",{className:"wd-quote-head"},w.default.createElement("div",null,w.default.createElement("h2",null,i?.name??e),w.default.createElement("p",{className:"wd-muted"},e.toUpperCase()," \xB7 ",(i?.quotedAt??"\u7B49\u5F85\u884C\u60C5").replace("T"," "))),w.default.createElement("span",{style:{flex:1}}),w.default.createElement("div",{className:`wd-quote-price ${oe(i?.changePct)}`},w.default.createElement("b",null,i?.price??"\u2014"),w.default.createElement("small",null,ge(i?.changePct))),w.default.createElement(Y,{icon:"bell",label:"\u52A0\u63D0\u9192",onClick:()=>qn(i??{symbol:e})}),w.default.createElement(Y,{icon:"refresh",label:"\u5237\u65B0\u5206\u65F6",onClick:()=>We(e)})),w.default.createElement("dl",{className:"wd-quote-grid"},w.default.createElement("div",null,w.default.createElement("dt",null,"\u4ECA\u5F00"),w.default.createElement("dd",null,i?.open??"\u2014")),w.default.createElement("div",null,w.default.createElement("dt",null,"\u6628\u6536"),w.default.createElement("dd",null,i?.prevClose??"\u2014")),w.default.createElement("div",null,w.default.createElement("dt",null,"\u6700\u9AD8"),w.default.createElement("dd",{className:"is-up"},i?.high??"\u2014")),w.default.createElement("div",null,w.default.createElement("dt",null,"\u6700\u4F4E"),w.default.createElement("dd",{className:"is-down"},i?.low??"\u2014")),w.default.createElement("div",null,w.default.createElement("dt",null,"\u6210\u4EA4\u91CF"),w.default.createElement("dd",null,Jt(i?.volume))),w.default.createElement("div",null,w.default.createElement("dt",null,"\u5E01\u79CD"),w.default.createElement("dd",null,i?.currency??"\u2014"))),w.default.createElement(ai,{data:n,quote:i}),s?w.default.createElement("div",{className:"wd-position-mini"},w.default.createElement("span",null,"\u6301\u4ED3 ",s.shares," \u80A1 \xB7 \u6210\u672C ",s.cost),w.default.createElement("b",{className:oe(c)},c>=0?"+":"",le(c),"\uFF08",ge(m),"\uFF09")):w.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:En},w.default.createElement(M,{name:"plus",size:12}),"\u8BB0\u4E00\u7B14\u6301\u4ED3"),o?w.default.createElement("p",{className:"wd-muted"},"\u63D0\u9192\uFF1A",o.direction==="down"?"\u8DCC":"\u6DA8","\u8D85\u8FC7 ",o.threshold,"% \u65F6\u63D0\u793A"):null)}function On(){let e=$(x=>x.state),t=$(x=>x.quotes),n=$(x=>x.quotesAt),a=$(x=>x.quoteError),r=$(x=>x.minute),i=$(x=>x.minuteCode),[s,o]=w.default.useState("watch"),[c,m]=w.default.useState(""),g=i??e.watchlist[0]?.code??null;w.default.useEffect(()=>{if(!g)return;(!r||i!==g)&&We(g);let x=setInterval(()=>Be(!1),8e3);return()=>clearInterval(x)},[g]);let p=e.watchlist,l=e.positions,S=l.reduce((x,C)=>x+(t[C.code]?.price??0)*C.shares,0),N=l.reduce((x,C)=>x+C.cost*C.shares,0),k=S-N;return w.default.createElement("div",{className:"wd-page wd-market-page"},w.default.createElement("header",{className:"wd-page-head"},w.default.createElement("div",null,w.default.createElement("h1",null,"\u884C\u60C5"),w.default.createElement("p",{className:"wd-page-sub"},n?`\u884C\u60C5\u65F6\u95F4 ${P(n)}`:"\u7B49\u5F85\u7B2C\u4E00\u6B21\u5237\u65B0",a?` \xB7 \u6700\u8FD1\u4E00\u6B21\u5931\u8D25\uFF1A${a}`:""," \xB7 \u6570\u636E\u6765\u81EA\u817E\u8BAF\u516C\u5F00\u884C\u60C5\uFF0C\u4EC5\u4F9B\u53C2\u8003\uFF0C\u4E0D\u6784\u6210\u6295\u8D44\u5EFA\u8BAE\u3002")),w.default.createElement("span",{style:{flex:1}}),w.default.createElement("form",{className:"wd-add-watch",onSubmit:x=>{x.preventDefault(),ii(c),m("")}},w.default.createElement(M,{name:"plus",size:14}),w.default.createElement("input",{value:c,onChange:x=>m(x.target.value),placeholder:"600519 / 00700 / AAPL","aria-label":"\u6DFB\u52A0\u81EA\u9009"}),w.default.createElement("button",{type:"submit",className:"wd-btn is-small"},"\u52A0\u81EA\u9009")),w.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Be(!0)},w.default.createElement(M,{name:"refresh",size:13}),"\u5237\u65B0"),w.default.createElement(Ge,{label:"\u5217\u8868",value:s,onChange:o,options:[{value:"watch",label:"\u81EA\u9009"},{value:"positions",label:"\u6301\u4ED3"}]})),w.default.createElement("div",{className:"wd-market-wrap"},w.default.createElement("section",{className:"wd-card wd-market-list"},w.default.createElement("table",{className:"wd-table"},w.default.createElement("thead",null,w.default.createElement("tr",null,w.default.createElement("th",null,"\u540D\u79F0"),w.default.createElement("th",{className:"is-num"},"\u73B0\u4EF7"),w.default.createElement("th",{className:"is-num"},"\u6DA8\u8DCC"),w.default.createElement("th",{className:"is-num"},"\u6DA8\u8DCC\u5E45"),w.default.createElement("th",null,"\u5206\u65F6"),w.default.createElement("th",null))),w.default.createElement("tbody",null,(s==="watch"?p:l).map(x=>{let C=t[x.code],B=g===x.code;return w.default.createElement("tr",{key:x.id??x.code,className:`${B?"is-selected":""} ${oe(C?.changePct)}`,onClick:()=>{y({minuteCode:x.code}),We(x.code)}},w.default.createElement("td",null,w.default.createElement("span",{className:"wd-quote-name"},C?.name??x.name),w.default.createElement("small",null,x.code.toUpperCase())),w.default.createElement("td",{className:"is-num"},w.default.createElement("b",null,C?.price??"\u2014")),w.default.createElement("td",{className:"is-num"},C?.change===null||C?.change===void 0?"\u2014":`${C.change>=0?"+":""}${C.change.toFixed(2)}`),w.default.createElement("td",{className:"is-num"},ge(C?.changePct)),w.default.createElement("td",null,B&&r?.points?.length?w.default.createElement(Cn,{points:r.points}):w.default.createElement(Cn,{quote:C})),w.default.createElement("td",{className:"is-right"},w.default.createElement("button",{type:"button",className:"wd-icon-btn","aria-label":"\u52A0\u63D0\u9192",onClick:L=>{L.stopPropagation(),qn(C??{symbol:x.code})}},w.default.createElement(M,{name:"bell",size:13}))))}))),s==="positions"&&l.length?w.default.createElement("footer",{className:"wd-market-total"},w.default.createElement("span",null,"\u5E02\u503C ",w.default.createElement("b",null,le(S,0))),w.default.createElement("span",null,"\u6210\u672C ",w.default.createElement("b",null,le(N,0))),w.default.createElement("span",{className:oe(k)},"\u6D6E\u76C8 ",w.default.createElement("b",null,k>=0?"+":"",le(k,0)))):null,s==="watch"&&p.length===0?w.default.createElement(we,{title:"\u8FD8\u6CA1\u6709\u81EA\u9009",hint:"\u5728\u4E0A\u9762\u8F93\u5165\u4EE3\u7801\uFF0C\u52A0\u4E00\u53EA\u770B\u770B\u3002"}):null,s==="positions"&&l.length===0?w.default.createElement(we,{title:"\u8FD8\u6CA1\u6709\u6301\u4ED3",hint:"\u8BB0\u4E00\u7B14\u4E4B\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6309\u73B0\u4EF7\u7B97\u6D6E\u52A8\u76C8\u4E8F\u3002",action:w.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:En},"\u8BB0\u4E00\u7B14")}):null),w.default.createElement("aside",{className:"wd-market-side"},w.default.createElement(ri,{code:g,quotes:t,minute:i===g?r:null,positions:l,alerts:e.alerts}),w.default.createElement("section",{className:"wd-card"},w.default.createElement("header",{className:"wd-card-head"},w.default.createElement("h2",null,"\u6211\u7684\u63D0\u9192")),e.alerts.length===0?w.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u63D0\u9192\u3002\u7ED9\u4E00\u53EA\u7968\u52A0\u4E2A\u9608\u503C\uFF0C\u76D8\u4E2D\u8D8A\u8FC7\u5C31\u4F1A\u51FA\u73B0\u5728\u4ECA\u65E5\u9875\u3002"):w.default.createElement("ul",{className:"wd-alert-list"},e.alerts.map(x=>w.default.createElement("li",{key:x.id},w.default.createElement(M,{name:"bell",size:12}),w.default.createElement("span",null,x.code?.toUpperCase()," ",x.direction==="down"?"\u8DCC":"\u6DA8","\u8D85 ",x.threshold,"%"),w.default.createElement(Y,{icon:"trash",label:"\u5220\u9664\u63D0\u9192",onClick:()=>U([{op:"remove_alert",id:x.id}],{label:"\u5220\u9664\u63D0\u9192"})}))))))))}var v=ee(require("react"),1);var si=[{value:"dsh-email",label:"DSH \u90AE\u4EF6\u63D2\u4EF6"},{value:"imap",label:"\u81EA\u5EFA IMAP / SMTP"},{value:"demo",label:"\u793A\u4F8B\u90AE\u7BB1"}],oi=[{id:"qq",label:"QQ \u90AE\u7BB1",imap:"imap.qq.com",smtp:"smtp.qq.com"},{id:"exmail",label:"\u817E\u8BAF\u4F01\u4E1A\u90AE",imap:"imap.exmail.qq.com",smtp:"smtp.exmail.qq.com"},{id:"163",label:"\u7F51\u6613 163",imap:"imap.163.com",smtp:"smtp.163.com"},{id:"aliyun",label:"\u963F\u91CC\u4F01\u4E1A\u90AE",imap:"imap.qiye.aliyun.com",smtp:"smtp.qiye.aliyun.com"},{id:"gmail",label:"Gmail",imap:"imap.gmail.com",smtp:"smtp.gmail.com"},{id:"outlook",label:"Outlook",imap:"outlook.office365.com",smtp:"smtp.office365.com"}];function Tn(){let e=$(k=>k.settingsOpen),t=$(k=>k.settings),n=$(k=>k.mail.pluginAvailable),[a,r]=v.default.useState(null),[i,s]=v.default.useState(null),[o,c]=v.default.useState(!1),m=v.default.useRef(!1);if(v.default.useEffect(()=>{if(!e){m.current=!1;return}!t||m.current||(m.current=!0,r({provider:t.mail.provider,account:t.mail.account??"",address:t.mail.address,folder:t.mail.folder,syncSec:t.mail.syncSec,imap:{host:t.mail.imap.host,port:t.mail.imap.port,secure:t.mail.imap.secure,user:t.mail.imap.user,pass:""},smtp:{host:t.mail.smtp.host,port:t.mail.smtp.port,secure:t.mail.smtp.secure,user:t.mail.smtp.user,pass:""},quotes:{enabled:t.quotes.enabled,intervalSec:t.quotes.intervalSec}}),s(null))},[e,t]),!e||!a)return null;let g=()=>y({settingsOpen:!1}),p=(k,x)=>r(C=>({...C,[k]:x})),l=(k,x,C)=>r(B=>({...B,[k]:{...B[k],[x]:C}})),S=k=>r(x=>({...x,provider:"imap",imap:{...x.imap,host:k.imap,port:993,secure:!0},smtp:{...x.smtp,host:k.smtp,port:465,secure:!0}})),N=()=>({mail:{provider:a.provider,account:a.account,address:a.address,folder:a.folder,syncSec:Number(a.syncSec),imap:{host:a.imap.host,port:Number(a.imap.port),secure:a.imap.secure,user:a.imap.user,pass:a.imap.pass},smtp:{host:a.smtp.host,port:Number(a.smtp.port),secure:a.smtp.secure,user:a.smtp.user,pass:a.smtp.pass}},quotes:{enabled:a.quotes.enabled,intervalSec:Number(a.quotes.intervalSec)}});return v.default.createElement(Te,{title:"\u8BBE\u7F6E",onClose:g,width:620},v.default.createElement("form",{className:"wd-form",onSubmit:async k=>{k.preventDefault(),await Ke(N())&&g()}},v.default.createElement("div",{className:"wd-field"},v.default.createElement("span",null,"\u90AE\u4EF6\u6765\u6E90"),v.default.createElement("div",{className:"wd-presets",role:"radiogroup","aria-label":"\u90AE\u4EF6\u6765\u6E90"},si.map(k=>v.default.createElement("button",{type:"button",key:k.value,role:"radio","aria-checked":a.provider===k.value,className:a.provider===k.value?"is-on":"",onClick:()=>p("provider",k.value)},k.label))),v.default.createElement("small",null,a.provider==="dsh-email"?"\u590D\u7528 dsh-email \u91CC\u5DF2\u7ECF\u914D\u597D\u7684\u8D26\u53F7\uFF1A\u5DE5\u4F5C\u53F0\u53EA\u8C03\u5B83\u7684\u8BFB\u4FE1/\u6807\u8BB0/\u5199\u8349\u7A3F\u5DE5\u5177\uFF0C\u4E0D\u8BFB\u6388\u6743\u7801\u3002":a.provider==="imap"?"\u5DE5\u4F5C\u53F0\u81EA\u5DF1\u8FDE IMAP\uFF1B\u540C\u6B65\u53EA\u62C9\u6700\u8FD1 40 \u5C01\u7684\u5934\u90E8\u548C\u6B63\u6587\u524D 2KB\uFF0C\u6253\u5F00\u65F6\u624D\u4E0B\u8F7D\u5168\u6587\u3002":"\u73B0\u5728\u7528\u7684\u662F\u793A\u4F8B\u90AE\u4EF6\uFF0C\u53EF\u4EE5\u968F\u4FBF\u70B9\u3001\u968F\u4FBF\u8BD5\u3002")),a.provider==="dsh-email"?v.default.createElement(v.default.Fragment,null,v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"\u590D\u7528\u54EA\u4E2A\u8D26\u53F7"),v.default.createElement("input",{value:a.account,onChange:k=>p("account",k.target.value),placeholder:"\u7559\u7A7A\u7528 dsh-email \u7684\u9ED8\u8BA4\u8D26\u53F7"}),v.default.createElement("small",null,"\u8D26\u53F7\u540D\u5C31\u662F dsh-email \u8BBE\u7F6E\u91CC\u7684\u540D\u5B57\uFF08\u591A\u4E2A\u8D26\u53F7\u65F6\u7528\u5B83\u533A\u5206\uFF09\u3002\u53D1\u4FE1\u6309\u94AE\u4F1A\u53D8\u6210\u300C\u5B58\u4E3A\u8349\u7A3F\u300D\uFF0C\u53D1\u9001\u5728 DSH \u7684\u8349\u7A3F\u7BB1\u91CC\u786E\u8BA4\u3002")),v.default.createElement("div",{className:"wd-test-row"},v.default.createElement("button",{type:"button",className:"wd-btn is-small",disabled:o,onClick:async()=>{c(!0),s(null),s(await pt({provider:"dsh-email"})),c(!1)}},o?"\u6B63\u5728\u8FDE\u63A5\u2026":"\u6D4B\u8BD5\u8FDE\u63A5"),n===!1?v.default.createElement("span",{className:"wd-error"},"\u6CA1\u68C0\u6D4B\u5230 dsh-email \u7684\u90AE\u4EF6\u5DE5\u5177"):null,i?v.default.createElement("span",{className:i.ok?"wd-ok":"wd-error"},i.ok?`\u8FDE\u4E0A\u4E86\uFF1A\u8D26\u53F7 ${i.account}\uFF0C${i.folders?.length??0} \u4E2A\u6587\u4EF6\u5939`:i.error):null),i?.folders?.length?v.default.createElement("p",{className:"wd-muted"},"\u53EF\u7528\u6587\u4EF6\u5939\uFF1A",i.folders.slice(0,8).join("\u3001")):null):null,a.provider==="imap"?v.default.createElement(v.default.Fragment,null,v.default.createElement("div",{className:"wd-field"},v.default.createElement("span",null,"\u5E38\u7528\u90AE\u7BB1"),v.default.createElement("div",{className:"wd-presets"},oi.map(k=>v.default.createElement("button",{type:"button",key:k.id,className:a.imap.host===k.imap?"is-on":"",onClick:()=>S(k)},k.label))),v.default.createElement("small",null,"QQ / 163 \u9700\u8981\u300C\u6388\u6743\u7801\u300D\uFF0C\u4E0D\u662F\u767B\u5F55\u5BC6\u7801\u3002Gmail \u9700\u8981\u5E94\u7528\u4E13\u7528\u5BC6\u7801\u3002")),v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"\u90AE\u7BB1\u5730\u5740"),v.default.createElement("input",{value:a.address,onChange:k=>p("address",k.target.value),placeholder:"you@company.com"})),v.default.createElement("div",{className:"wd-field-row"},v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"IMAP \u670D\u52A1\u5668"),v.default.createElement("input",{value:a.imap.host,onChange:k=>l("imap","host",k.target.value),placeholder:"imap.exmail.qq.com"})),v.default.createElement("label",{className:"wd-field is-small"},v.default.createElement("span",null,"\u7AEF\u53E3"),v.default.createElement("input",{value:a.imap.port,onChange:k=>l("imap","port",k.target.value)}))),v.default.createElement("div",{className:"wd-field-row"},v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"IMAP \u8D26\u53F7"),v.default.createElement("input",{value:a.imap.user,onChange:k=>l("imap","user",k.target.value),placeholder:"\u9ED8\u8BA4\u7528\u90AE\u7BB1\u5730\u5740"})),v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"\u6388\u6743\u7801",t.mail.imap.hasPass?`\uFF08\u5DF2\u4FDD\u5B58 \xB7 \u672B\u56DB\u4F4D ${t.mail.imap.passHint}\uFF09`:""),v.default.createElement("input",{type:"password",autoComplete:"off",value:a.imap.pass,onChange:k=>l("imap","pass",k.target.value),placeholder:t.mail.imap.hasPass?"\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539":"\u6388\u6743\u7801"}))),v.default.createElement("div",{className:"wd-field-row"},v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"SMTP \u670D\u52A1\u5668"),v.default.createElement("input",{value:a.smtp.host,onChange:k=>l("smtp","host",k.target.value),placeholder:"smtp.exmail.qq.com"})),v.default.createElement("label",{className:"wd-field is-small"},v.default.createElement("span",null,"\u7AEF\u53E3"),v.default.createElement("input",{value:a.smtp.port,onChange:k=>l("smtp","port",k.target.value)}))),v.default.createElement("div",{className:"wd-field-row"},v.default.createElement("label",{className:"wd-field"},v.default.createElement("span",null,"\u6536\u4EF6\u7BB1\u6587\u4EF6\u5939"),v.default.createElement("input",{value:a.folder,onChange:k=>p("folder",k.target.value),placeholder:"INBOX"})),v.default.createElement("label",{className:"wd-field is-small"},v.default.createElement("span",null,"\u540C\u6B65\u95F4\u9694\uFF08\u79D2\uFF09"),v.default.createElement("input",{type:"number",min:"30",max:"3600",value:a.syncSec,onChange:k=>p("syncSec",k.target.value)}))),v.default.createElement("div",{className:"wd-test-row"},v.default.createElement("button",{type:"button",className:"wd-btn is-small",disabled:o,onClick:async()=>{c(!0),s(null);let k=await pt({address:a.address,folder:a.folder,imap:{host:a.imap.host,port:Number(a.imap.port),secure:a.imap.secure,user:a.imap.user||a.address,pass:a.imap.pass}});s(k),c(!1)}},o?"\u6B63\u5728\u8FDE\u63A5\u2026":"\u6D4B\u8BD5\u8FDE\u63A5"),i?v.default.createElement("span",{className:i.ok?"wd-ok":"wd-error"},i.ok?`\u8FDE\u4E0A\u4E86\uFF0C${a.folder} \u91CC\u6709 ${i.exists} \u5C01\u90AE\u4EF6`:i.error):null),v.default.createElement("p",{className:"wd-muted"},"\u6388\u6743\u7801\u53EA\u5199\u8FDB\u672C\u673A\u7684 settings.json\uFF08\u6743\u9650 600\uFF09\uFF0C\u4E0D\u4F1A\u56DE\u4F20\u7ED9\u6D4F\u89C8\u5668\uFF0C\u4E5F\u4E0D\u4F1A\u8FDB\u5185\u5BB9\u6570\u636E\u3002")):null,v.default.createElement("div",{className:"wd-field"},v.default.createElement("span",null,"\u884C\u60C5\u5237\u65B0"),v.default.createElement("div",{className:"wd-field-row"},v.default.createElement("label",{className:"wd-field is-small"},v.default.createElement("span",null,"\u5F00\u5173"),v.default.createElement("select",{value:a.quotes.enabled?"on":"off",onChange:k=>l("quotes","enabled",k.target.value==="on")},v.default.createElement("option",{value:"on"},"\u5F00"),v.default.createElement("option",{value:"off"},"\u5173"))),v.default.createElement("label",{className:"wd-field is-small"},v.default.createElement("span",null,"\u95F4\u9694\uFF08\u79D2\uFF09"),v.default.createElement("input",{type:"number",min:"3",max:"300",value:a.quotes.intervalSec,onChange:k=>l("quotes","intervalSec",k.target.value)}))),v.default.createElement("small",null,"\u53EA\u5728\u540E\u53F0\u6309\u95F4\u9694\u62C9\u4E00\u6B21\u516C\u5F00\u884C\u60C5\uFF1B\u884C\u60C5\u9875\u6253\u5F00\u65F6\u524D\u7AEF\u4E5F\u4F1A\u8DDF\u7740\u5237\u3002")),v.default.createElement("div",{className:"wd-field"},v.default.createElement("span",null,"\u793A\u4F8B\u6570\u636E"),v.default.createElement("div",{className:"wd-cal-actions"},v.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:async()=>{await U([{op:"load_samples"}],{label:"\u8F7D\u5165\u793A\u4F8B\u6570\u636E"})&&y({settingsOpen:!1})}},"\u8F7D\u5165\u793A\u4F8B\u6570\u636E"),v.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>U([{op:"clear_samples"}],{label:"\u6E05\u7A7A\u793A\u4F8B\u6570\u636E"})},"\u6E05\u7A7A\u793A\u4F8B\u6570\u636E")),v.default.createElement("small",null,"\u9ED8\u8BA4\u4E0D\u585E\u4EFB\u4F55\u5047\u6570\u636E\uFF1B\u8F7D\u5165\u7684\u793A\u4F8B\u90FD\u5E26 sample \u6807\u8BB0\uFF0C\u968F\u65F6\u80FD\u4E00\u952E\u6E05\u6389\uFF0C\u4E0D\u4F1A\u52A8\u4F60\u81EA\u5DF1\u7684\u6761\u76EE\u3002")),v.default.createElement("div",{className:"wd-form-foot"},v.default.createElement("span",{className:"wd-muted",style:{flex:1}},"\u52A9\u624B\u7528\u7684\u6A21\u578B\u8DDF\u968F DeepSeek Harness \u5F53\u524D\u9ED8\u8BA4\u6A21\u578B\u3002"),v.default.createElement("button",{type:"button",className:"wd-btn",onClick:g},"\u53D6\u6D88"),v.default.createElement("button",{type:"submit",className:"wd-btn is-primary"},v.default.createElement(M,{name:"check",size:14}),"\u4FDD\u5B58"))))}var In=`/* \u6240\u6709\u989C\u8272\u8D70 DSH \u8BED\u4E49 token\uFF0C\u660E\u6697\u4E3B\u9898\u7531\u5BBF\u4E3B\u8D1F\u8D23\u3002\u529E\u516C\u53F0\u6BD4\u521B\u4F5C\u53F0\u66F4\u5BC6\u3001\u66F4\u5E73\u3002 */
.wd-root {
  --ink: var(--dsw-alias-label-primary);
  --ink2: var(--dsw-alias-label-secondary);
  --ink3: var(--dsw-alias-label-tertiary);
  --on-primary: var(--dsw-alias-label-primary-inverted);
  --primary: var(--dsw-alias-button-primary-fill);
  --primary-hover: var(--dsw-alias-button-primary-hover);
  --line: var(--dsw-alias-border-l2);
  --line-strong: var(--dsw-alias-border-l4);
  --hover: var(--dsw-alias-interactive-bg-hover);
  --active: var(--dsw-alias-interactive-bg-active);
  --bg: var(--dsw-alias-bg-base);
  --card: var(--dsw-alias-bg-layer-2);
  --accent: var(--dsw-alias-link);
  --up: #c8453c;
  --down: #1e8a52;
  --r-sm: var(--dsw-radius-sm, 8px);
  --r-md: var(--dsw-radius-md, 12px);
  --r-lg: var(--dsw-radius-lg, 16px);
  --ease: cubic-bezier(.2, .8, .2, 1);
  --serif: "Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
  --latin-serif: "Iowan Old Style", "Palatino", Georgia, "Songti SC", serif;
  --dock-w: 340px;
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: clip;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--dsw-font-family);
  font-size: 13.5px;
  line-height: 21px;
  -webkit-font-smoothing: antialiased;
}
.wd-root *, .wd-root *::before, .wd-root *::after { box-sizing: border-box; }
:where(.wd-root) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; }
:where(.wd-root) button:disabled { cursor: default; opacity: .5; }
:where(.wd-root) :is(h1, h2, h3, h4, p, dl, dd, dt, ul, ol) { margin: 0; padding: 0; }
:where(.wd-root) :is(ul, ol) { list-style: none; }
.wd-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
:where(.wd-root) :is(input, textarea, select) { font: inherit; color: inherit; }
body[data-ds-dark-theme] .wd-root { color-scheme: dark; }
.wd-root :is(option, optgroup) { background-color: var(--card); color: var(--ink); }
.wd-muted { color: var(--ink3); }
.wd-error { color: var(--up); }
.wd-ok { color: var(--down); }
.is-up { color: var(--up); }
.is-down { color: var(--down); }
.wd-shimmer { background: linear-gradient(100deg, var(--ink3) 30%, var(--ink) 50%, var(--ink3) 70%); background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: wd-shimmer 1.6s linear infinite; }
@keyframes wd-shimmer { to { background-position: -220% 0; } }
@keyframes wd-rise { from { opacity: 0; transform: translateY(6px); } }

/* ------------------------------- \u63A7\u4EF6 ------------------------------- */
.wd-icon-btn { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 30px; height: 30px; border-radius: var(--r-sm); color: var(--ink2); transition: background .15s, color .15s; }
.wd-icon-btn:hover { background: var(--hover); color: var(--ink); }
.wd-icon-btn.is-active { background: var(--active); color: var(--ink); }
.wd-root .wd-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 13px; border-radius: var(--r-md); border: .5px solid var(--line-strong); background: var(--card); font-size: 13px; white-space: nowrap; transition: background .15s, transform .2s var(--ease); }
.wd-root .wd-btn:hover { background: var(--hover); }
.wd-root .wd-btn:active { transform: scale(.98); }
.wd-root .wd-btn.is-primary { background: var(--primary); color: var(--on-primary); border-color: transparent; }
.wd-root .wd-btn.is-primary:hover { background: var(--primary-hover); }
.wd-root .wd-btn.is-small { height: 28px; padding: 0 10px; border-radius: var(--r-sm); font-size: 12px; }
.wd-root .wd-btn.is-wide { width: 100%; }
.wd-root .wd-btn.is-danger { color: var(--up); border-color: color-mix(in srgb, var(--up) 40%, transparent); }
.wd-link { color: var(--accent); font-size: 12.5px; }
.wd-link:hover { text-decoration: underline; }
.wd-seg { display: inline-flex; gap: 0; padding: 3px; border-radius: var(--r-md); background: var(--hover); flex: none; }
.wd-seg button { display: inline-flex; align-items: center; gap: 5px; height: 26px; min-width: 30px; padding: 0 9px; border-radius: var(--r-sm); color: var(--ink3); font-size: 12px; transition: background .18s, color .18s; }
.wd-seg button.is-on { background: var(--card); color: var(--ink); box-shadow: var(--dsw-elevation-soft); }
.wd-tag { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 4px; font-size: 11px; background: var(--hover); color: var(--ink2); }
.wd-tag.is-green { color: var(--down); background: color-mix(in srgb, var(--down) 14%, transparent); }
.wd-tag.is-amber { color: #a4761a; background: color-mix(in srgb, #d8a12a 18%, transparent); }

/* \u8868\u5355\u4E0E\u5BF9\u8BDD\u6846 */
.wd-form { display: flex; flex-direction: column; gap: 12px; padding: 4px 20px 18px; overflow-y: auto; }
.wd-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.wd-field > span { color: var(--ink2); font-size: 12px; }
.wd-field small { color: var(--ink3); font-size: 11.5px; line-height: 17px; }
.wd-field input, .wd-field textarea, .wd-field select { width: 100%; min-width: 0; padding: 7px 10px; border-radius: var(--r-sm); border: .5px solid var(--line-strong); background: var(--bg); font-size: 13px; outline: none; }
.wd-field input:focus, .wd-field textarea:focus, .wd-field select:focus { border-color: var(--accent); }
.wd-field textarea { resize: vertical; line-height: 20px; }
.wd-field-row { display: grid; grid-template-columns: 1fr 96px; gap: 10px; }
.wd-field-row:has(.wd-field:nth-child(2):last-child) { grid-template-columns: 1fr 110px; }
.wd-field.is-small { max-width: 130px; }
.wd-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.wd-presets button { height: 28px; padding: 0 10px; border-radius: 999px; border: .5px solid var(--line-strong); color: var(--ink2); font-size: 12px; }
.wd-presets button.is-on { background: var(--primary); color: var(--on-primary); border-color: transparent; }
.wd-form-foot { display: flex; align-items: center; gap: 8px; padding-top: 4px; }
.wd-test-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.wd-dialog-mask { position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 24px; background: color-mix(in srgb, #000 28%, transparent); backdrop-filter: blur(2px); animation: wd-fade .18s var(--ease) both; }
@keyframes wd-fade { from { opacity: 0; } }
.wd-dialog { max-width: 100%; max-height: 88%; display: flex; flex-direction: column; border-radius: var(--r-lg); background: var(--card); box-shadow: var(--dsw-elevation-prominent); overflow: hidden; animation: wd-rise .24s var(--ease) both; }
.wd-dialog-head { flex: none; display: flex; align-items: center; gap: 8px; padding: 14px 12px 10px 20px; }
.wd-dialog-head h2 { flex: 1; font-size: 15px; font-weight: 500; }
.wd-toast { position: absolute; left: 50%; bottom: 26px; z-index: 70; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 8px; max-width: min(560px, 90%); padding: 9px 14px; border-radius: 999px; background: var(--ink); color: var(--bg); font-size: 12.5px; box-shadow: 0 10px 30px -10px rgb(0 0 0 / .4); animation: wd-rise .2s var(--ease) both; }
.wd-toast.is-error { background: var(--up); color: #fff; }
.wd-toast button { color: inherit; font-weight: 500; text-decoration: underline; }
.wd-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; text-align: center; color: var(--ink3); }
.wd-empty-title { color: var(--ink); font-size: 14px; }

/* ------------------------------- \u5916\u58F3 ------------------------------- */
.wd-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.wd-topbar { position: absolute; z-index: 30; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 6px; padding: 12px 16px 12px max(16px, var(--dsh-frame-leading-clearance, 0px)); pointer-events: none; }
.wd-topbar > * { pointer-events: auto; }
.wd-nav { display: flex; gap: 2px; padding: 3px; border-radius: var(--r-lg); background: color-mix(in srgb, var(--card) 72%, transparent); backdrop-filter: blur(20px) saturate(150%); box-shadow: var(--dsw-elevation-soft); }
.wd-nav button { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: var(--r-md); color: var(--ink2); font-size: 12.5px; transition: background .16s var(--ease), color .16s; white-space: nowrap; }
.wd-nav button:hover { background: var(--hover); color: var(--ink); }
.wd-nav button.is-on { background: var(--primary); color: var(--on-primary); }
.wd-topbar .wd-icon-btn { width: 32px; height: 32px; background: color-mix(in srgb, var(--card) 72%, transparent); backdrop-filter: blur(20px); box-shadow: var(--dsw-elevation-soft); }
.wd-open-dock { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: var(--r-md); background: color-mix(in srgb, var(--card) 72%, transparent); backdrop-filter: blur(20px); box-shadow: var(--dsw-elevation-soft); font-size: 12.5px; }
.wd-alerts { position: relative; }
.wd-bell { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--r-md); background: color-mix(in srgb, var(--card) 72%, transparent); backdrop-filter: blur(20px); box-shadow: var(--dsw-elevation-soft); color: var(--ink2); }
.wd-bell i { position: absolute; top: 4px; right: 4px; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 7px; background: var(--up); color: #fff; font-size: 9px; line-height: 14px; font-style: normal; text-align: center; }
.wd-alerts-pop { position: absolute; right: 0; top: 38px; z-index: 40; width: 300px; padding: 10px 12px; border-radius: var(--r-md); background: var(--card); box-shadow: var(--dsw-elevation-prominent); animation: wd-rise .18s var(--ease) both; }
.wd-alerts-pop p { display: flex; align-items: flex-start; gap: 6px; padding: 4px 0; font-size: 12.5px; line-height: 18px; }
.wd-alerts-pop p svg { flex: none; margin-top: 2px; color: var(--ink3); }
.wd-alerts-pop p.is-overdue { color: var(--up); }
.wd-alerts-pop p.is-down { color: var(--down); }
.wd-content { flex: 1; min-height: 0; position: relative; }
.wd-loading { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--ink3); }

/* \u5BF9\u8BDD\u680F */
.wd-dock { position: relative; z-index: 26; flex: none; width: var(--dock-w); display: flex; min-height: 0; border-left: .5px solid var(--line); background: color-mix(in srgb, var(--card) 60%, transparent); backdrop-filter: blur(26px) saturate(150%); animation: wd-rise .3s var(--ease) both; }
.wd-root.is-narrow .wd-dock { position: absolute; right: 8px; top: 56px; bottom: 8px; z-index: 34; width: min(360px, calc(100% - 16px)); border: .5px solid var(--line); border-radius: var(--r-lg); box-shadow: var(--dsw-elevation-prominent); background: color-mix(in srgb, var(--card) 94%, transparent); overflow: hidden; }
.wd-chat { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.wd-dock-head { flex: none; display: flex; align-items: center; gap: 6px; padding: 12px 10px 6px 16px; }
.wd-dock-head h2 { font-size: 14px; font-weight: 500; }
.wd-engine { display: inline-flex; align-items: center; gap: 5px; padding: 1px 7px; border-radius: 999px; background: var(--hover); color: var(--ink3); font-size: 11px; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-engine i { width: 6px; height: 6px; border-radius: 50%; background: var(--ink3); }
.wd-engine.is-live i { background: var(--down); }
.wd-engine.is-down i { background: var(--up); }
.wd-session-pick { max-width: 150px; height: 26px; border-radius: 6px; border: .5px solid var(--line-strong); background: var(--card); color: var(--ink2); font-size: 11.5px; padding: 0 4px; }
.wd-msg-tool { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; color: var(--ink3); font-size: 11.5px; }
.wd-msg-action { display: inline-flex; align-items: center; gap: 3px; margin-top: 5px; padding: 3px 8px; border-radius: 999px; border: .5px solid var(--line-strong); color: var(--ink2); font-size: 11.5px; }
.wd-msg-action:hover { background: var(--hover); color: var(--ink); }
.wd-dock-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 16px 12px; display: flex; flex-direction: column; gap: 12px; }
.wd-dock-intro { margin: auto 0; padding-bottom: 10px; }
.wd-dock-intro h3 { font-size: 16px; font-weight: 400; line-height: 26px; letter-spacing: .2px; }
.wd-dock-intro p { margin-top: 8px; color: var(--ink3); font-size: 12.5px; line-height: 20px; }
.wd-msg { font-size: 13px; line-height: 21px; }
.wd-msg.is-user { align-self: flex-end; max-width: 88%; padding: 8px 12px; border-radius: 12px 12px 3px 12px; background: var(--active); }
.wd-msg.is-bot { padding: 2px 0; }
.wd-msg.is-bot p { white-space: pre-wrap; }
.wd-msg-error { color: var(--up); font-size: 12.5px; }
.wd-msg-note { color: var(--ink3); font-size: 12px; }
.wd-msg footer { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: var(--ink3); font-size: 11.5px; }
.wd-msg footer button { display: inline-flex; align-items: center; gap: 3px; color: var(--ink2); }
.wd-receipt { display: flex; align-items: flex-start; gap: 6px; margin-top: 4px; color: var(--ink2); font-size: 12.5px; line-height: 18px; }
.wd-receipt-check { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 15px; height: 15px; margin-top: 1px; border-radius: 50%; background: color-mix(in srgb, var(--down) 16%, transparent); color: var(--down); }
.wd-suggest { flex: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 8px; }
.wd-suggest button { max-width: 100%; padding: 5px 9px; border-radius: 999px; border: .5px solid var(--line-strong); color: var(--ink2); font-size: 12px; text-align: left; }
.wd-suggest button:hover { background: var(--hover); color: var(--ink); }
.wd-composer { flex: none; margin: 0 12px 12px; padding: 5px 5px 5px 12px; display: flex; align-items: flex-end; gap: 6px; border-radius: 14px; background: var(--card); box-shadow: inset 0 0 0 .5px var(--line-strong); }
.wd-composer textarea { flex: 1; min-width: 0; resize: none; border: 0; outline: 0; background: none; font-size: 13px; line-height: 20px; padding: 5px 0; max-height: 132px; }
.wd-send { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: var(--on-primary); }

/* ------------------------------- \u9875\u9762 ------------------------------- */
.wd-page { position: absolute; inset: 0; overflow-y: auto; padding: 66px 22px 24px; animation: wd-rise .3s var(--ease) both; }
.wd-page-head { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.wd-page-head h1 { font-size: 26px; line-height: 34px; font-weight: 300; letter-spacing: -.01em; }
.wd-page-sub { color: var(--ink3); font-size: 12px; line-height: 18px; margin-top: 2px; }
.wd-card { display: flex; flex-direction: column; min-width: 0; border-radius: var(--r-lg); background: color-mix(in srgb, var(--card) 94%, transparent); box-shadow: inset 0 0 0 .5px var(--line), 0 1px 2px rgb(0 0 0 / .03); overflow: hidden; }
.wd-card-head { flex: none; display: flex; align-items: center; gap: 6px; min-height: 42px; padding: 0 8px 0 14px; }
.wd-card-head h2 { font-size: 12.5px; font-weight: 500; color: var(--ink2); letter-spacing: .06em; }
.wd-card-meta { color: var(--ink3); font-size: 11.5px; }
.wd-card-empty { padding: 5px 14px 14px; color: var(--ink3); font-size: 12.5px; line-height: 19px; }

/* \u4ECA\u65E5 */
.wd-today { display: flex; flex-direction: column; gap: 12px; min-height: 100%; }
.wd-hero { padding: 2px 2px 6px; }
.wd-hero-date { color: var(--ink3); font-size: 12px; letter-spacing: .08em; }
.wd-hero-line { margin-top: 8px; font-size: 31px; font-weight: 300; line-height: 44px; letter-spacing: -.015em; color: var(--ink3); }
.wd-hero-line b { font-weight: 400; color: var(--ink); font-family: var(--latin-serif); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.wd-hero-next { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: var(--ink2); font-size: 12.5px; }
.wd-hero-next svg { color: var(--ink3); }
.wd-hero-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.wd-today-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 12px; align-items: start; }
.wd-today-left, .wd-today-right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.wd-agenda-body { padding: 0 6px 6px; display: flex; flex-direction: column; }
.wd-event { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 8px 6px 8px 4px; border-radius: var(--r-md); }
.wd-event:hover { background: var(--hover); }
.wd-event.is-past { opacity: .5; }
.wd-event.is-running { background: color-mix(in srgb, var(--down) 7%, transparent); }
.wd-event-time { flex: none; width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
.wd-event-time b { display: block; font-size: 13px; font-weight: 500; }
.wd-event-time small { color: var(--ink3); font-size: 11px; }
.wd-event-bar { flex: none; width: 3px; align-self: stretch; border-radius: 2px; background: var(--ink3); }
.wd-event.tone-blue .wd-event-bar { background: #3d6fd4; }
.wd-event.tone-violet .wd-event-bar { background: #7a5ad6; }
.wd-event.tone-amber .wd-event-bar { background: #c58a1e; }
.wd-event.tone-green .wd-event-bar { background: var(--down); }
.wd-event.tone-rose .wd-event-bar { background: #c34e73; }
.wd-event-main { flex: 1; min-width: 0; }
.wd-event-main h3 { font-size: 13.5px; font-weight: 500; line-height: 20px; }
.wd-event-main p { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin-top: 2px; color: var(--ink3); font-size: 11.5px; }
.wd-agenda-foot { display: flex; align-items: center; gap: 6px; padding: 8px 14px 12px; color: var(--ink2); font-size: 12px; border-top: .5px solid var(--line); }
.wd-brief { padding: 0 14px 14px; color: var(--ink2); font-size: 12.5px; line-height: 21px; }
.wd-brief h4 { margin: 10px 0 2px; color: var(--ink); font-size: 12px; font-weight: 500; }
.wd-brief h4:first-child { margin-top: 0; }
.wd-brief p { margin: 2px 0; }
.wd-brief-li { padding-left: 12px; position: relative; }
.wd-brief-li::before { content: '\xB7'; position: absolute; left: 2px; color: var(--ink3); }
.wd-mail-mini li + li { border-top: .5px solid var(--line); }.wd-mail-mini button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 14px; text-align: left; }
.wd-mail-mini button:hover { background: var(--hover); }
.wd-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.wd-mail-mini-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.wd-mail-mini-main b { font-size: 12.5px; font-weight: 500; }
.wd-mail-mini-main span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink2); font-size: 12px; }
.wd-mail-mini time { flex: none; color: var(--ink3); font-size: 11px; }
.wd-tasks { padding: 0 6px 6px; }
.wd-tasks li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--r-sm); font-size: 12.5px; }
.wd-tasks li:hover { background: var(--hover); }
.wd-tasks li.is-done .wd-task-title { color: var(--ink3); text-decoration: line-through; }
.wd-check { flex: none; width: 16px; height: 16px; border-radius: 5px; border: 1.2px solid var(--line-strong); display: inline-flex; align-items: center; justify-content: center; color: var(--on-primary); }
.wd-tasks li.is-done .wd-check { background: var(--down); border-color: var(--down); }
.wd-task-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-tasks time { flex: none; color: var(--ink3); font-size: 11px; }
.wd-tasks time.is-overdue { color: var(--up); }
.wd-strip { display: flex; align-items: center; gap: 12px; margin-top: auto; padding: 10px 6px 0; border-top: .5px solid var(--line); overflow-x: auto; }
.wd-strip-label { display: inline-flex; align-items: center; gap: 5px; flex: none; color: var(--ink3); font-size: 11.5px; }
.wd-strip-list { display: flex; gap: 4px; flex: 1; min-width: 0; }
.wd-strip-item { display: inline-flex; align-items: baseline; gap: 6px; flex: none; padding: 4px 10px; border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 .5px var(--line); font-size: 12px; }
.wd-strip-item:hover { background: var(--hover); }
.wd-strip-name { color: var(--ink2); }
.wd-strip-item b { font-weight: 500; font-variant-numeric: tabular-nums; }
.wd-strip-item small { font-size: 11px; }
.wd-upcoming { padding: 0 8px 8px; }
.wd-upcoming li { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: var(--r-sm); font-size: 12.5px; }
.wd-upcoming li:hover { background: var(--hover); }
.wd-upcoming time { flex: none; width: 74px; display: flex; flex-direction: column; color: var(--ink3); font-size: 10.5px; line-height: 15px; font-variant-numeric: tabular-nums; }
.wd-upcoming time b { color: var(--ink2); font-size: 11.5px; font-weight: 500; }
.wd-upcoming-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: #3d6fd4; }
.wd-upcoming-dot.tone-violet { background: #7a5ad6; }
.wd-upcoming-dot.tone-amber { background: #c58a1e; }
.wd-upcoming-dot.tone-green { background: var(--down); }
.wd-upcoming-dot.tone-rose { background: #c34e73; }
.wd-upcoming-dot.tone-slate { background: #667085; }
.wd-upcoming-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.wd-holdings { padding: 0 8px 8px; }
.wd-holdings li { display: grid; grid-template-columns: minmax(0, 1fr) 64px 76px; gap: 8px; align-items: baseline; padding: 5px 8px; border-radius: var(--r-sm); font-size: 12.5px; }
.wd-holdings li:hover { background: var(--hover); }
.wd-holdings li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-holdings b, .wd-holdings em { text-align: right; font-style: normal; font-variant-numeric: tabular-nums; }
.wd-holdings b { font-weight: 500; }

/* \u65E5\u7A0B */
.wd-cal-page { display: flex; flex-direction: column; overflow: hidden; }
.wd-cal-wrap { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 256px; gap: 12px; }
.wd-cal { min-height: 0; }
.wd-cal-head { flex: none; border-bottom: .5px solid var(--line); }
.wd-cal-days { display: grid; grid-template-columns: 52px repeat(7, minmax(0, 1fr)); align-items: end; padding: 6px 0 4px; }
.wd-cal-day { text-align: center; padding-bottom: 4px; }
.wd-cal-day small { display: block; color: var(--ink3); font-size: 11px; }
.wd-cal-day b { font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; }
.wd-cal-day.is-today b { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: var(--on-primary); }
.wd-cal-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.wd-cal-body { position: relative; display: grid; grid-template-columns: 52px repeat(7, minmax(0, 1fr)); }
.wd-cal-gutter { position: relative; }
.wd-cal-gutter span { position: absolute; right: 6px; transform: translateY(-50%); color: var(--ink3); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.wd-cal-gutter span:first-child { transform: none; }
.wd-cal-col { position: relative; border-left: .5px solid var(--line); background-image: repeating-linear-gradient(to bottom, transparent 0 44px, color-mix(in srgb, var(--ink) 5%, transparent) 44px 45px); cursor: pointer; }
.wd-cal-col.is-today { background-color: color-mix(in srgb, var(--primary) 3%, transparent); }
.wd-cal-event { position: absolute; display: flex; flex-direction: column; gap: 0; padding: 2px 6px; margin-left: 1px; border-radius: 6px; overflow: hidden; cursor: grab; background: color-mix(in srgb, #3d6fd4 20%, var(--card)); border-left: 2px solid #3d6fd4; transition: box-shadow .18s var(--ease), transform .18s var(--ease); }
.wd-cal-event:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -10px rgb(0 0 0 / .45); }
/* \u4F1A\u8BAE\u5757\u91CC\u7684\u4E24\u884C\u6587\u5B57\u4E0D\u80FD\u88AB flex \u538B\u7F29\uFF1A\u77EE\u7684\u65F6\u5019\u5B81\u53EF\u88C1\u6389\u65F6\u95F4\uFF0C\u4E5F\u8981\u7559\u4F4F\u6807\u9898 */
.wd-cal-event b { flex: none; font-size: 11px; font-weight: 500; line-height: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-cal-event span { flex: none; color: var(--ink3); font-size: 10px; line-height: 13px; font-variant-numeric: tabular-nums; }
.wd-cal-event.tone-violet { background: color-mix(in srgb, #7a5ad6 20%, var(--card)); border-color: #7a5ad6; }
.wd-cal-event.tone-amber { background: color-mix(in srgb, #c58a1e 22%, var(--card)); border-color: #c58a1e; }
.wd-cal-event.tone-green { background: color-mix(in srgb, #1e8a52 20%, var(--card)); border-color: #1e8a52; }
.wd-cal-event.tone-rose { background: color-mix(in srgb, #c34e73 20%, var(--card)); border-color: #c34e73; }
.wd-cal-event.tone-slate { background: color-mix(in srgb, #667085 20%, var(--card)); border-color: #667085; }
.wd-cal-event.is-tentative { border-style: dashed; opacity: .78; }
.wd-cal-event.is-dragging { cursor: grabbing; z-index: 5; box-shadow: var(--dsw-elevation-prominent); opacity: .9; }
.wd-cal-conflict { position: absolute; top: 2px; right: 3px; color: var(--up); font-size: 9px; font-style: normal; }
.wd-cal-now { position: absolute; left: 0; right: 0; height: 0; border-top: 1.5px solid var(--up); pointer-events: none; z-index: 4; }
.wd-cal-now i { position: absolute; left: -3px; top: -4px; width: 6px; height: 6px; border-radius: 50%; background: var(--up); }
.wd-cal-foot { flex: none; padding: 8px 14px; border-top: .5px solid var(--line); font-size: 11.5px; }
.wd-cal-rail { display: flex; flex-direction: column; gap: 12px; min-width: 0; overflow-y: auto; }
.wd-cal-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
.wd-cal-hint { padding: 0 14px 12px; font-size: 11.5px; line-height: 18px; }

/* \u6708\u89C6\u56FE */
.wd-month { min-height: 0; overflow: hidden; }
.wd-month-week { display: grid; grid-template-columns: repeat(7, 1fr); padding: 8px 0 4px; color: var(--ink3); font-size: 11px; text-align: center; }
.wd-month-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(74px, 1fr); }
.wd-month-cell { padding: 4px 5px; border-top: .5px solid var(--line); border-left: .5px solid var(--line); min-width: 0; cursor: pointer; overflow: hidden; }
.wd-month-cell:hover { background: var(--hover); }
.wd-month-cell.is-outside { opacity: .38; }
.wd-month-date { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; color: var(--ink2); font-size: 11.5px; }
.wd-month-cell.is-today .wd-month-date { border-radius: 50%; background: var(--primary); color: var(--on-primary); }
.wd-month-event { display: block; width: 100%; margin-top: 2px; padding: 1px 4px; border-radius: 4px; background: color-mix(in srgb, #3d6fd4 12%, transparent); font-size: 10.5px; line-height: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; border-left: 2px solid #3d6fd4; }
.wd-month-event time { color: var(--ink3); margin-right: 4px; }
.wd-month-more { display: block; color: var(--ink3); font-size: 10px; }

/* \u90AE\u4EF6 */
.wd-mail-page { display: grid; grid-template-columns: 200px 320px minmax(0, 1fr); padding: 66px 0 0; overflow: hidden; }
.wd-mail-side { display: flex; flex-direction: column; gap: 12px; padding: 8px 12px 16px; overflow-y: auto; border-right: .5px solid var(--line); }
.wd-mail-filters { display: flex; flex-direction: column; gap: 1px; }
.wd-mail-filters button { display: flex; align-items: center; justify-content: space-between; height: 30px; padding: 0 10px; border-radius: var(--r-sm); color: var(--ink2); font-size: 12.5px; text-align: left; }
.wd-mail-filters button:hover { background: var(--hover); }
.wd-mail-filters button.is-on { background: var(--active); color: var(--ink); }
.wd-mail-account { margin-top: auto; display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: var(--r-md); background: color-mix(in srgb, var(--card) 60%, transparent); }
.wd-mail-account p { font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.wd-mail-account small { color: var(--ink3); font-size: 11px; }
.wd-mail-tip { color: var(--ink3); font-size: 11px; line-height: 17px; }
.wd-connect { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 28px 26px; max-width: 560px; }
.wd-connect h2 { font-size: 17px; font-weight: 500; }
.wd-connect p { color: var(--ink2); font-size: 12.5px; line-height: 20px; }
.wd-connect-opts { display: flex; flex-direction: column; gap: 8px; margin: 4px 0; }
.wd-connect-opt { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: var(--r-md); border: .5px solid var(--line-strong); background: var(--card); text-align: left; }
.wd-connect-opt:hover { background: var(--hover); }
.wd-connect-opt b { font-size: 13px; font-weight: 500; }
.wd-connect-opt span { color: var(--ink3); font-size: 12px; line-height: 18px; }
.wd-mail-list { display: flex; flex-direction: column; min-height: 0; border-right: .5px solid var(--line); }
.wd-mail-search { flex: none; padding: 8px 12px; border-bottom: .5px solid var(--line); }
.wd-search { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px; border-radius: var(--r-sm); background: var(--hover); color: var(--ink3); }
.wd-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font-size: 12.5px; }
.wd-mail-rows { flex: 1; min-height: 0; overflow-y: auto; }
.wd-mail-row { display: flex; gap: 8px; width: 100%; padding: 9px 12px; border-bottom: .5px solid var(--line); text-align: left; }
.wd-mail-row:hover { background: var(--hover); }
.wd-mail-row.is-active { background: var(--active); }
.wd-mail-dot { flex: none; width: 6px; height: 6px; margin-top: 7px; border-radius: 50%; background: transparent; }
.wd-mail-dot.is-unread { background: var(--accent); }
.wd-mail-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.wd-mail-row-top { display: flex; align-items: baseline; gap: 6px; }
.wd-mail-row-top b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; font-weight: 400; }
.wd-mail-row.is-unread .wd-mail-row-top b { font-weight: 600; }
.wd-mail-row-top time { flex: none; color: var(--ink3); font-size: 10.5px; }
.wd-mail-row-subject { display: flex; align-items: center; gap: 4px; color: var(--ink2); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-mail-row.is-unread .wd-mail-row-subject { color: var(--ink); }
.wd-mail-row-subject svg { flex: none; color: var(--ink3); }
.wd-mail-row-snippet { color: var(--ink3); font-size: 11.5px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-mail-read { display: flex; min-width: 0; min-height: 0; overflow: hidden; }
.wd-reader { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 16px 22px 0; overflow: hidden; }
.wd-reader-head { flex: none; display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; border-bottom: .5px solid var(--line); }
.wd-reader-head h2 { font-size: 17px; font-weight: 500; line-height: 26px; }
.wd-reader-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--ink3); font-size: 12px; }
.wd-reader-meta b { color: var(--ink2); font-weight: 500; }
.wd-reader-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.wd-reader-files { flex: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; border-bottom: .5px solid var(--line); font-size: 11.5px; }
.wd-reader-files li { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: var(--hover); }
.wd-reader-files small { color: var(--ink3); }
.wd-reader-body { flex: 1; min-height: 0; overflow-y: auto; margin: 0; padding: 14px 0 24px; font-family: inherit; font-size: 13px; line-height: 23px; white-space: pre-wrap; word-break: break-word; }
.wd-confirm { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: var(--r-md); background: color-mix(in srgb, var(--up) 8%, transparent); }
.wd-confirm p { font-size: 12.5px; }
.wd-confirm > div { display: flex; gap: 8px; justify-content: flex-end; }
.wd-composer-hint { font-size: 11.5px; }

/* \u884C\u60C5 */
.wd-market-page { display: flex; flex-direction: column; gap: 12px; }
.wd-add-watch { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 6px 0 10px; border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 0 0 .5px var(--line); color: var(--ink3); }
.wd-add-watch input { width: 150px; border: 0; outline: 0; background: none; font-size: 12.5px; }
.wd-market-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 12px; align-items: start; }
.wd-market-list { overflow: hidden; }
.wd-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.wd-table th { padding: 8px 12px; color: var(--ink3); font-size: 11px; font-weight: 400; text-align: left; border-bottom: .5px solid var(--line); white-space: nowrap; }
.wd-table td { padding: 8px 12px; border-bottom: .5px solid var(--line); vertical-align: middle; }
.wd-table tbody tr { cursor: pointer; }
.wd-table tbody tr:hover { background: var(--hover); }
.wd-table tbody tr.is-selected { background: var(--active); }
.wd-table .is-num { text-align: right; font-variant-numeric: tabular-nums; }
.wd-table .is-right { text-align: right; }
.wd-quote-name { display: block; font-weight: 500; }
.wd-table small { display: block; color: var(--ink3); font-size: 10.5px; }
.wd-market-total { display: flex; flex-wrap: wrap; gap: 18px; padding: 10px 12px; border-top: .5px solid var(--line); font-size: 12px; color: var(--ink2); }
.wd-market-total b { font-weight: 500; color: var(--ink); }
.wd-market-side { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.wd-quote { padding-bottom: 12px; }
.wd-quote-head { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px 8px; }
.wd-quote-head h2 { font-size: 16px; font-weight: 500; }
.wd-quote-price { text-align: right; font-variant-numeric: tabular-nums; }
.wd-quote-price b { display: block; font-size: 26px; font-weight: 400; line-height: 32px; font-family: var(--latin-serif); letter-spacing: -.01em; }
.wd-quote-price small { font-size: 12px; }
.wd-quote-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 10px; padding: 4px 14px 10px; }
.wd-quote-grid dt { color: var(--ink3); font-size: 10.5px; }
.wd-quote-grid dd { font-size: 12.5px; font-variant-numeric: tabular-nums; }
.wd-minute { position: relative; margin: 0 14px; }
.wd-minute svg { display: block; width: 100%; height: 130px; }
.wd-minute-line { fill: none; stroke: currentColor; stroke-width: 1.6; vector-effect: non-scaling-stroke; }
.wd-minute-area { fill: currentColor; opacity: .08; }
.wd-minute-base { stroke: var(--line-strong); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.wd-minute-label { fill: var(--ink3); font-size: 9px; }
.wd-minute.is-up { color: var(--up); }
.wd-minute.is-down { color: var(--down); }
.wd-minute-axis { display: flex; justify-content: space-between; padding: 2px 0 8px; color: var(--ink3); font-size: 10px; }
.wd-chart-empty { padding: 18px 14px; color: var(--ink3); font-size: 12px; }
.wd-spark { display: block; color: var(--ink3); }
.wd-spark.is-up { color: var(--up); }
.wd-spark.is-down { color: var(--down); }
.wd-spark.is-empty { display: inline-block; width: 84px; height: 26px; }
.wd-spark-bar { position: relative; display: inline-flex; align-items: center; width: 84px; height: 26px; }
.wd-spark-bar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--line-strong); opacity: .45; }
.wd-spark-bar i { position: relative; display: block; height: 3px; border-radius: 2px; background: currentColor; opacity: .8; }
.wd-position-mini { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 14px; padding: 8px 10px; border-radius: var(--r-md); background: var(--hover); font-size: 12px; }
.wd-position-mini b { font-weight: 500; font-variant-numeric: tabular-nums; }
.wd-alert-list { padding: 0 6px 8px; }
.wd-alert-list li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; font-size: 12px; }
.wd-alert-list li span { flex: 1; min-width: 0; }
.wd-alert-list svg { color: var(--ink3); }

/* ------------------------------- \u7A84\u5C4F ------------------------------- */
.wd-root.is-narrow .wd-today-grid { grid-template-columns: minmax(0, 1fr); }
.wd-root.is-narrow .wd-market-wrap { grid-template-columns: minmax(0, 1fr); }
.wd-root.is-narrow .wd-cal-wrap { grid-template-columns: minmax(0, 1fr); }
.wd-root.is-narrow .wd-cal-rail { display: none; }
.wd-root.is-compact .wd-mail-page { grid-template-columns: minmax(0, 1fr); }
.wd-root.is-compact .wd-mail-side { display: none; }
.wd-root.is-compact .wd-mail-list { border-right: 0; }
.wd-root.is-compact .wd-mail-read { display: none; }
.wd-root.is-compact .wd-hero-line { font-size: 24px; line-height: 34px; }
.wd-root.is-compact .wd-nav button span { display: none; }
/* \u7A84\u5C4F\u9876\u680F\u6536\u7D27\uFF1A\u53EA\u7559\u56FE\u6807\uFF0C\u53F3\u4FA7\u6309\u94AE\u5FC5\u987B\u5B8C\u6574\u843D\u5728\u53EF\u89C6\u533A\u5185 */
.wd-root.is-compact .wd-topbar { gap: 4px; padding: 8px 8px 8px max(8px, var(--dsh-frame-leading-clearance, 0px)); }
.wd-root.is-compact .wd-nav { gap: 1px; padding: 2px; }
.wd-root.is-compact .wd-nav button { padding: 0 7px; height: 28px; }
.wd-root.is-compact .wd-topbar .wd-icon-btn { width: 28px; height: 28px; }
@media (max-width: 1180px) {
  .wd-mail-page { grid-template-columns: 180px 300px minmax(0, 1fr); }
}

/* \u90AE\u6233\uFF1A\u501F media-desk \u7684\u9F7F\u5B54\u906E\u7F69\uFF0C\u7528\u5728\u300C\u4ECA\u5929\u300D\u548C\u65E5\u671F\u4E0A */
.wd-stamp {
  --s: 9px; --hole: 2.4px;
  position: relative; display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  width: 54px; aspect-ratio: 4 / 5; flex: none; overflow: hidden; background: var(--card); color: var(--ink2);
  -webkit-mask: radial-gradient(circle var(--hole), transparent 97%, #000) calc(var(--s) / -2) calc(var(--s) / -2) / var(--s) var(--s),
    linear-gradient(#000 0 0) center / calc(100% - var(--s)) calc(100% - var(--s)) no-repeat;
  mask: radial-gradient(circle var(--hole), transparent 97%, #000) calc(var(--s) / -2) calc(var(--s) / -2) / var(--s) var(--s),
    linear-gradient(#000 0 0) center / calc(100% - var(--s)) calc(100% - var(--s)) no-repeat;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / .1));
  transition: transform .35s cubic-bezier(.2, 1.4, .4, 1);
}
.wd-stamp b { font-family: var(--latin-serif); font-size: 22px; line-height: 24px; font-weight: 400; letter-spacing: -.02em; }
.wd-stamp small { margin-top: 1px; font-size: 9px; letter-spacing: .12em; color: var(--ink3); }
.wd-stamp.is-today { background: color-mix(in srgb, var(--primary) 5%, var(--card)); color: var(--ink); box-shadow: inset 0 0 0 .5px color-mix(in srgb, var(--ink) 12%, transparent); animation: wd-breathe 2.6s ease-in-out infinite; }
.wd-stamp.is-today b { color: var(--ink); }
.wd-stamp.is-today small { margin-top: 2px; color: var(--ink2); }
.wd-stamp.is-sm { --s: 5px; --hole: 1.2px; width: 34px; }
.wd-stamp.is-sm b { font-size: 14px; line-height: 16px; }
.wd-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
@keyframes wd-breathe { 50% { opacity: .7; } }

/* \u4ECA\u65E5\u9875\u57AB\u4E00\u5C42\u5F88\u6DE1\u7684\u70B9\u9635\u7EB8\uFF0C\u5F80\u7F16\u8F91\u611F\u9760 */
.wd-today::before {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image: radial-gradient(circle, color-mix(in srgb, var(--ink) 9%, transparent) 1px, transparent 1.2px);
  background-size: 26px 26px; opacity: .55;
  -webkit-mask-image: linear-gradient(#000, transparent 58%);
  mask-image: linear-gradient(#000, transparent 58%);
}
.wd-today > * { position: relative; z-index: 1; }

/* \u6668\u62A5\u7528\u886C\u7EBF\u6B63\u6587\uFF0C\u50CF\u8BFB\u4E00\u6BB5\u8BDD\u800C\u4E0D\u662F\u770B\u8868\u683C */
.wd-brief { font-family: var(--serif); font-size: 13px; line-height: 22px; }
.wd-brief h4 { font-family: var(--dsw-font-family); }

/* --------------------- \u7075\u52A8\u5C9B\uFF08M1 \u5F62\u6001\u9A8C\u8BC1\uFF09 --------------------- */
.wd-island { position: absolute; z-index: 28; top: 10px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: min(520px, calc(100% - 500px)); pointer-events: none; }
.wd-island > * { pointer-events: auto; }
.wd-island-pill { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 8px 0 14px; border-radius: 999px; background: color-mix(in srgb, var(--card) 80%, transparent); backdrop-filter: blur(28px) saturate(160%); box-shadow: var(--dsw-elevation-soft), inset 0 0 0 .5px var(--line); transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
.wd-island-pill:hover { transform: translateY(-1px); box-shadow: var(--dsw-elevation-prominent), inset 0 0 0 .5px var(--line); }
.wd-island-live { width: 7px; height: 7px; border-radius: 50%; background: var(--down); box-shadow: 0 0 0 3px color-mix(in srgb, var(--down) 16%, transparent); animation: wd-pulse 2.4s ease-in-out infinite; flex: none; }
.wd-island-item { display: inline-flex; align-items: baseline; gap: 5px; min-width: 0; font-size: 12px; color: var(--ink2); white-space: nowrap; }
.wd-island-item b { font-weight: 500; color: var(--ink); }
.wd-island-item small { max-width: 120px; overflow: hidden; text-overflow: ellipsis; color: var(--ink3); }
.wd-island-toggle { display: inline-flex; align-items: center; gap: 3px; height: 28px; padding: 0 10px; border-radius: 999px; background: var(--hover); color: var(--ink2); font-size: 11.5px; flex: none; }
.wd-island-toggle:hover { color: var(--ink); }
.wd-island-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: 100%; animation: wd-island-in .28s var(--ease) both; }
@keyframes wd-island-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } }
.wd-island-atom { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: var(--r-lg); background: color-mix(in srgb, var(--card) 96%, transparent); box-shadow: inset 0 0 0 .5px var(--line), 0 14px 36px -22px rgb(0 0 0 / .4); }
.wd-island-atom header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.wd-island-atom h3 { font-size: 12.5px; font-weight: 500; letter-spacing: .05em; color: var(--ink2); }
.wd-island-atom header span { font-size: 11px; color: var(--ink3); }
.wd-island-atom ul { display: flex; flex-direction: column; gap: 5px; min-height: 42px; }
.wd-island-atom li { display: flex; align-items: baseline; gap: 8px; min-width: 0; font-size: 12.5px; line-height: 19px; }
.wd-island-atom li b { font-weight: 500; white-space: nowrap; }
.wd-island-atom li span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-island-atom li small { margin-left: auto; color: var(--ink3); font-size: 11px; white-space: nowrap; }
.wd-island-atom .is-quotes li span { font-family: var(--latin-serif); font-variant-numeric: tabular-nums; }
.wd-island-atom .is-empty { color: var(--ink3); }
.wd-island-link { display: inline-flex; align-items: center; gap: 3px; align-self: flex-end; color: var(--accent); font-size: 11.5px; }
.wd-root.is-narrow .wd-island { max-width: calc(100% - 140px); }
.wd-root.is-narrow .wd-island-grid { grid-template-columns: minmax(0, 1fr); }

/* --------------------- \u6C1B\u56F4\u4E0E\u7EC6\u8282\uFF08\u5BF9\u9F50 media-desk \u7684\u89C2\u611F\uFF09 --------------------- *//* \u80CC\u666F\u4E09\u56E2\u5F88\u6DE1\u7684\u5F69\u8272\u5149\u6591\uFF0C\u7F13\u6162\u6F02\u79FB\uFF1B\u53EA\u505A\u6C1B\u56F4\uFF0C\u4E0D\u62E6\u622A\u70B9\u51FB */
.wd-ambient { position: absolute; inset: 0; z-index: 0; overflow: clip; pointer-events: none; }
.wd-ambient i {
  position: absolute; width: 54vmax; height: 54vmax; border-radius: 50%;
  filter: blur(76px); opacity: .68; animation: wd-drift 44s ease-in-out infinite alternate;
}
.wd-ambient i:nth-child(1) { left: -18vmax; top: -26vmax; background: radial-gradient(circle, color-mix(in srgb, #dbe5ff 58%, transparent), transparent 68%); }
.wd-ambient i:nth-child(2) { right: -16vmax; top: -10vmax; background: radial-gradient(circle, color-mix(in srgb, #f7e3ef 54%, transparent), transparent 68%); animation-delay: -15s; }
.wd-ambient i:nth-child(3) { left: 20vmax; bottom: -34vmax; background: radial-gradient(circle, color-mix(in srgb, #e3f4e1 52%, transparent), transparent 68%); animation-delay: -29s; }
body[data-ds-dark-theme] .wd-ambient i { opacity: .26; }
@keyframes wd-drift { to { transform: translate3d(5vmax, 3.5vmax, 0) scale(1.1); } }
.wd-main, .wd-dock { z-index: 1; }

/* \u5361\u7247\u8F7B\u5FAE\u4E0A\u6D6E\uFF0C\u5217\u8868\u884C\u6709\u8FC7\u6E21 */
.wd-card { transition: transform .22s var(--ease), box-shadow .22s var(--ease); }
.wd-card:hover { transform: translateY(-1px); box-shadow: inset 0 0 0 .5px var(--line), var(--dsw-elevation-soft); }
.wd-mail-row { transition: background .14s var(--ease), box-shadow .14s var(--ease); }
.wd-mail-row:hover { background: var(--hover); }
.wd-mail-row.is-unread { box-shadow: inset 2.5px 0 0 var(--primary); }

/* \u9996\u5C4F\u6807\u9898\u540E\u9762\u4E00\u5C42\u5F88\u6DE1\u7684\u4E3B\u8272\u6655 */
.wd-hero { border-radius: var(--r-lg); background: radial-gradient(120% 92% at 6% -12%, color-mix(in srgb, var(--primary) 7%, transparent), transparent 62%); }

/* \u5F39\u7A97\u3001\u6D6E\u5C42\u3001toast \u5404\u81EA\u5165\u573A */
.wd-dialog-mask { animation: wd-fade .18s var(--ease) both; }
.wd-dialog { animation: wd-pop .24s var(--ease) both; }
@keyframes wd-pop { from { opacity: 0; transform: scale(.96) translateY(8px); } }
.wd-toast { animation: wd-toast .22s var(--ease) both; }
@keyframes wd-toast { from { opacity: 0; transform: translate(-50%, 10px) scale(.97); } }

/* \u5206\u65F6\u7EBF\u753B\u51FA\u6765\uFF1B\u6570\u5B57\u7528\u7B49\u5BBD\uFF0C\u6DA8\u8DCC\u4E0D\u8DF3\u5217 */
.wd-spark path { stroke-dasharray: 260; stroke-dashoffset: 260; animation: wd-draw 1s var(--ease) forwards; }
@keyframes wd-draw { to { stroke-dashoffset: 0; } }
.wd-quote-price, .wd-card-meta, .wd-hero-line b, .wd-time { font-variant-numeric: tabular-nums; }

/* \u6EDA\u52A8\u6761\u7EC6\u4E00\u70B9\uFF0C\u522B\u62A2\u6CE8\u610F\u529B */
.wd-root :is(.wd-page, .wd-dock-scroll, .wd-mail-rows, .wd-mail-read) { scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent; }

/* \u4E3B\u6309\u94AE\u5E26\u4E00\u70B9\u6295\u5F71\u548C\u4E0A\u6D6E\uFF0C\u5728\u7EBF\u72B6\u6001\u70B9\u4F1A\u547C\u5438 */
.wd-root .wd-btn.is-primary { box-shadow: 0 6px 18px -12px color-mix(in srgb, var(--primary) 70%, transparent); }
.wd-root .wd-btn.is-primary:hover { transform: translateY(-1px); }
.wd-engine.is-live i { box-shadow: 0 0 0 3px color-mix(in srgb, var(--down) 16%, transparent); animation: wd-pulse 2.4s ease-in-out infinite; }
@keyframes wd-pulse { 50% { opacity: .45; } }

/* \u7CFB\u7EDF\u8BBE\u4E86\u51CF\u5C11\u52A8\u6548\u5C31\u5168\u90E8\u505C\u4E0B */
@media (prefers-reduced-motion: reduce) {
  .wd-ambient i, .wd-page, .wd-dock, .wd-dialog, .wd-toast, .wd-spark path, .wd-msg.is-user, .wd-engine.is-live i { animation: none !important; }
  .wd-card:hover { transform: none; }
}
`;var An="work-desk",di=[{id:"bench",label:"\u5DE5\u4F5C\u53F0",icon:"grid"},{id:"today",label:"\u4ECA\u65E5",icon:"today"},{id:"calendar",label:"\u65E5\u7A0B",icon:"calendar"},{id:"mail",label:"\u90AE\u4EF6",icon:"mail"},{id:"market",label:"\u884C\u60C5",icon:"chart"}],pi={bench:kn,today:wt,calendar:Qt,mail:Mn,market:On};function ci(){let e=$(a=>a.alerts),[t,n]=I.default.useState(!1);return e.length?I.default.createElement("div",{className:"wd-alerts"},I.default.createElement("button",{type:"button",className:"wd-bell","aria-label":`${e.length} \u6761\u63D0\u9192`,onClick:()=>n(a=>!a)},I.default.createElement(M,{name:"bell",size:16}),I.default.createElement("i",null,e.length)),t?I.default.createElement("div",{className:"wd-alerts-pop",role:"dialog","aria-label":"\u63D0\u9192"},e.map((a,r)=>I.default.createElement("p",{key:r,className:`is-${a.level}`},I.default.createElement(M,{name:a.kind==="price"?"chart":a.kind==="task"?"check":"clock",size:12}),a.text)),I.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>{n(!1),y({view:"today"})}},"\u53BB\u4ECA\u65E5\u9875")):null):null}function ui(e){let t=$(S=>S.ready),n=$(S=>S.error),a=$(S=>S.view),r=$(S=>S.dockOpen),i=$(S=>S.canUndo),s=I.default.useRef(null),[o,c]=I.default.useState(1440),m=o<1180,g=o<820;I.default.useEffect(()=>{ke();let S=Lt(),N=setInterval(()=>{document.visibilityState==="visible"&&ke()},3e4),k=()=>{document.visibilityState==="visible"&&ke()};return document.addEventListener("visibilitychange",k),window.addEventListener("focus",k),()=>{S(),clearInterval(N),document.removeEventListener("visibilitychange",k),window.removeEventListener("focus",k)}},[]),I.default.useEffect(()=>{m&&y({dockOpen:!1})},[m]),I.default.useEffect(()=>{let S=s.current;if(!S)return;let N=new ResizeObserver(([k])=>c(k.contentRect.width));return N.observe(S),()=>N.disconnect()},[]),I.default.useEffect(()=>{let S=N=>{let k=/^(INPUT|TEXTAREA|SELECT)$/.test(N.target.tagName)||N.target.isContentEditable;(N.metaKey||N.ctrlKey)&&N.key==="z"&&!N.shiftKey&&!k&&i&&(N.preventDefault(),Ne()),N.key==="/"&&!k&&a==="mail"&&(N.preventDefault(),document.querySelector(".wd-search input")?.focus())};return window.addEventListener("keydown",S),()=>window.removeEventListener("keydown",S)},[i,a]);let p=pi[a]??wt,l=r;return I.default.createElement("div",{className:`wd-root ${m?"is-narrow":""} ${g?"is-compact":""} ${l?"has-dock":""}`,ref:s},I.default.createElement("style",null,In,Sn),I.default.createElement("div",{className:"wd-ambient","aria-hidden":"true"},I.default.createElement("i",null),I.default.createElement("i",null),I.default.createElement("i",null)),I.default.createElement("div",{className:"wd-main"},I.default.createElement("header",{className:"wd-topbar","data-window-drag":""},I.default.createElement("nav",{className:"wd-nav","aria-label":"\u5DE5\u4F5C\u53F0\u5BFC\u822A"},di.map(S=>I.default.createElement("button",{type:"button",key:S.id,className:a===S.id?"is-on":"","aria-current":a===S.id?"page":void 0,onClick:()=>y({view:S.id})},I.default.createElement(M,{name:S.icon,size:14}),I.default.createElement("span",null,S.label)))),I.default.createElement("span",{style:{flex:1}}),I.default.createElement(ci,null),i?I.default.createElement(Y,{icon:"undo",label:"\u64A4\u9500\u4E0A\u4E00\u6B65",onClick:Ne}):null,I.default.createElement(Y,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>y({settingsOpen:!0})}),l?null:I.default.createElement("button",{type:"button",className:"wd-open-dock",onClick:()=>y({dockOpen:!0})},I.default.createElement(M,{name:"spark",size:14}),"\u52A9\u624B")),t&&a!=="bench"?I.default.createElement($n,null):null,I.default.createElement("main",{className:"wd-content",key:a},n?I.default.createElement("div",{className:"wd-page"},I.default.createElement("p",{className:"wd-muted"},"\u5DE5\u4F5C\u53F0\u52A0\u8F7D\u5931\u8D25\uFF1A",n),I.default.createElement("button",{type:"button",className:"wd-btn",onClick:ke},"\u91CD\u8BD5")):t?I.default.createElement(p,null):I.default.createElement("div",{className:"wd-loading"},I.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u628A\u4ECA\u5929\u94FA\u5F00\u2026")))),t&&l?I.default.createElement(en,{useSessions:e.useSessions}):null,I.default.createElement(Bt,null),t?I.default.createElement(Tn,null):null,I.default.createElement(Wt,null))}var mi=["slots"];function fi(e){jt(e),e.slots.inject("main",()=>e.slots.register({name:"main",key:An},ui)),e.slots.inject("sidebar.panellist",()=>e.slots.register({name:"sidebar.panellist",id:An,order:5,label:()=>"\u529E\u516C\u5DE5\u4F5C\u53F0"},({size:t})=>I.default.createElement(M,{name:"calendar",size:t}))),e.slots.inject("settings.section",()=>e.slots.register({name:"settings.section",id:"work-desk-workbench",order:55,label:()=>"\u5DE5\u4F5C\u53F0"},zn))}
return module.exports}})
