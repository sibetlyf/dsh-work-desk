window.__ModuleLoader__.load({id:"dsh-work-desk",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var jt=Object.create;var Ne=Object.defineProperty;var Pt=Object.getOwnPropertyDescriptor;var Ht=Object.getOwnPropertyNames;var _t=Object.getPrototypeOf,Ut=Object.prototype.hasOwnProperty;var Ft=(e,t)=>{for(var n in t)Ne(e,n,{get:t[n],enumerable:!0})},We=(e,t,n,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Ht(t))!Ut.call(e,i)&&i!==n&&Ne(e,i,{get:()=>t[i],enumerable:!(a=Pt(t,i))||a.enumerable});return e};var G=(e,t,n)=>(n=e!=null?jt(_t(e)):{},We(t||!e||!e.__esModule?Ne(n,"default",{value:e,enumerable:!0}):n,e)),Bt=e=>We(Ne({},"__esModule",{value:!0}),e);var Jn={};Ft(Jn,{apply:()=>Xn,inject:()=>Qn});module.exports=Bt(Jn);var E=G(require("react"),1);var y=G(require("react"),1);var Qe=G(require("react"),1),Xe="work-desk/",Je=null;function Ze(e){Je=e}function ge(){return Je}var X={ready:!1,error:null,state:null,quotes:{},quoteError:null,quotesAt:null,alerts:[],brief:null,canUndo:!1,model:null,modelOk:null,modelError:null,mail:{},view:"today",focusMailId:null,focusEventId:null,dockOpen:!0,thinking:!1,toast:null,dialog:null,settingsOpen:!1,settings:null,mailFilter:"all",mailQuery:"",composer:null,confirmSend:!1,sending:!1,selectedDay:null,monthCursor:null,calendarMode:"week",minute:null,minuteCode:null,minuteError:null,tick:0},Oe=new Set;function b(e){X={...X,...typeof e=="function"?e(X):e},Oe.forEach(t=>t())}function Yt(e){return Oe.add(e),()=>Oe.delete(e)}function z(e){return Qe.default.useSyncExternalStore(Yt,()=>e(X))}async function V(e,t){let n=await fetch(Xe+e,t===void 0?{headers:{"cache-control":"no-cache"}}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error(a.error||`\u8BF7\u6C42\u5931\u8D25\uFF08${n.status}\uFF09`);return a}var Ge=null;function Y(e,{undo:t=!1,error:n=!1}={}){clearTimeout(Ge),e&&(b({toast:{text:e,undo:t,error:n,key:Date.now()}}),Ge=setTimeout(()=>b({toast:null}),t||String(e).length>24?6e3:3200))}function ee(e){Y(e?.message||String(e),{error:!0})}async function se(){try{let e=await V("state");b({ready:!0,error:null,state:e.state,quotes:e.quotes??{},quoteError:e.quoteError??null,quotesAt:e.quotesAt??null,alerts:e.alerts??[],brief:e.brief??null,canUndo:e.canUndo,model:e.model,modelOk:e.modelOk,modelError:e.modelError,mail:e.mail??{}});let t=await V("settings").catch(()=>null);t&&JSON.stringify(t)!==JSON.stringify(X.settings)&&b({settings:t})}catch(e){b({ready:!1,error:e.message})}}async function P(e,{label:t="\u64CD\u4F5C",undoable:n=!0,silent:a=!1}={}){try{let i=await V("ops",{ops:e,label:t,undoable:n});return b(o=>({state:i.state,canUndo:n||o.canUndo,quotes:o.quotes})),i.errors?.length?Y(i.errors[0],{error:!0}):!a&&i.receipts?.[0]&&Y(i.receipts[0].text,{undo:n}),i}catch(i){return ee(i),null}}async function le(){try{let e=await V("undo",{});b({state:e.state,canUndo:e.canUndo,toast:null}),e.label&&Y(`\u5DF2\u64A4\u9500\uFF1A${e.label}`)}catch(e){ee(e)}}function Re(){let e=setInterval(()=>{b(t=>({tick:t.tick+1}))},3e4);return()=>clearInterval(e)}async function ze(e=!1){try{let t=await V(`quotes?force=${e?1:0}`);return b({quotes:t.quotes??{},quoteError:t.error??null,quotesAt:t.fetchedAt??null}),t}catch(t){return b({quoteError:t.message}),null}}async function Se(e){b({minuteCode:e,minuteError:null});try{let t=await V(`quote/minute?code=${encodeURIComponent(e)}`);return b({minute:t}),t}catch(t){return b({minute:null,minuteError:t.message}),null}}async function De(){try{let e=await V("mail/sync",{});return e.error?(Y(e.error,{error:!0}),b({mail:{...X.mail,lastSyncError:e.error}}),null):(b({state:e.state,mail:{...X.mail,lastSyncAt:new Date().toISOString(),lastSyncError:null}}),Y(e.added?`\u540C\u6B65\u5230 ${e.added} \u5C01\u65B0\u90AE\u4EF6`:"\u6CA1\u6709\u65B0\u90AE\u4EF6"),e)}catch(e){return ee(e),null}}async function de(e){b({view:"mail",focusMailId:e,dockOpen:!1});try{let t=await V("mail/read",{id:e});return b({state:t.state,focusMailId:t.mail?.id??e}),t.mail}catch(t){return ee(t),null}}async function Le(e,t){try{let n=await V("mail/mark",{id:e,action:t});return b({state:n.state}),n.warning&&Y(n.warning,{error:!0}),n}catch(n){return ee(n),null}}function Me(e){b({composer:{to:"",cc:"",subject:"",text:"",...e},confirmSend:!1,sending:!1})}function Ce(){b({composer:null,confirmSend:!1,sending:!1})}async function et(){let e=X.composer;if(!e)return!1;let t=(X.settings?.mail?.provider??X.mail?.provider)==="dsh-email";b({sending:!0});try{let n=await V(t?"mail/draft":"mail/send",e);return n.error?(Y(n.error,{error:!0}),b({sending:!1}),!1):(b({composer:null,confirmSend:!1,sending:!1}),Y(t?"\u8349\u7A3F\u5DF2\u5B58\u5230 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u5230 \u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u8349\u7A3F \u91CC\u786E\u8BA4\u53D1\u9001":"\u90AE\u4EF6\u53D1\u51FA\u53BB\u4E86"),!0)}catch(n){return ee(n),b({sending:!1}),!1}}async function Ae(){try{let e=await V("brief/generate",{});return b({brief:e.brief,state:e.state}),Y("\u6668\u62A5\u5199\u597D\u4E86"),e.brief}catch(e){return ee(e),null}}async function tt(e){try{let t=await V("ics/import",{text:e});return b({state:t.state}),Y(`\u5BFC\u5165 ${t.added} \u4E2A\u65E5\u7A0B${t.skipped?`\uFF0C\u8DF3\u8FC7 ${t.skipped} \u4E2A\u91CD\u590D\u89C4\u5219`:""}`),t}catch(t){return ee(t),null}}async function nt(){try{let e=await fetch(`${Xe}ics?range=all`);if(!e.ok)throw new Error("\u5BFC\u51FA\u5931\u8D25");let t=await e.text(),n=new Blob([t],{type:"text/calendar;charset=utf-8"}),a=URL.createObjectURL(n),i=document.createElement("a");i.href=a,i.download="\u529E\u516C\u5DE5\u4F5C\u53F0-\u65E5\u7A0B.ics",i.click(),setTimeout(()=>URL.revokeObjectURL(a),3e3),Y("\u5DF2\u5BFC\u51FA .ics\uFF0C\u53EF\u4EE5\u5BFC\u5165\u5230\u624B\u673A\u6216\u4F01\u4E1A\u65E5\u5386")}catch(e){ee(e)}}function Vt(e){for(let t of e??[])t.type==="nav"&&t.view&&b({view:t.view}),t.type==="open_mail"&&t.id&&de(t.id),t.type==="open_event"&&t.id&&b({view:"calendar",focusEventId:t.id}),t.type==="sync_mail"&&De(),t.type==="refresh_quotes"&&ze(!0),t.type==="brief"&&Ae()}async function at(e){let t=String(e??"").trim();if(!(!t||X.thinking)){b(n=>({thinking:!0,state:{...n.state,chat:[...n.state.chat,{id:`tmp_${Date.now()}`,role:"user",text:t}]}}));try{let n=await V("chat",{message:t,focusId:X.focusMailId??void 0});b({state:n.state,canUndo:!0,modelOk:n.modelOk,modelError:n.modelError}),Vt(n.actions)}catch(n){ee(n),await se()}finally{b({thinking:!1})}}}async function $e(e){try{let t=await V("settings",e);return b({settings:t}),await se(),Y("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58"),!0}catch(t){return ee(t),!1}}async function je(e){try{return await V("settings/test-mail",e)}catch(t){return{ok:!1,error:t.message}}}var T=G(require("react"),1);var it={today:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2M12 2v2M12 20v2M2 12h2M20 12h2",grid:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",calendar:"M5 6h14v14H5zM5 10h14M9 3.5v4M15 3.5v4",mail:"M3 6h18v12H3zM3 7l9 6 9-6",chart:"M4 19V5M4 19h16M8 15l3-4 3 2 4-6",clock:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",check:"M5 12.5l4.5 4.5L19 7",plus:"M12 5v14M5 12h14",close:"M6 6l12 12M18 6L6 18",search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",gear:"M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",chevL:"M14.5 5.5L8 12l6.5 6.5",chevR:"M9.5 5.5L16 12l-6.5 6.5",chevD:"M6 9.5l6 6 6-6",chevU:"M6 14.5l6-6 6 6",refresh:"M19 8a8 8 0 0 0-14-1L4 9M5 16a8 8 0 0 0 14 1l1-2M4 4v5h5M20 20v-5h-5",star:"M12 4l2.4 5.2 5.6.7-4.2 3.8 1.1 5.6L12 16.5 7.1 19.3l1.1-5.6L4 9.9l5.6-.7z",archive:"M3 6h18v4H3zM5 10v9h14v-9M9.5 13h5",reply:"M9 7L4 12l5 5M4 12h9a6 6 0 0 1 6 6v1",bell:"M12 4a5 5 0 0 1 5 5v4l2 3H5l2-3V9a5 5 0 0 1 5-5zM10 19a2 2 0 0 0 4 0",trash:"M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13",edit:"M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",send:"M12 19V5M6 11l6-6 6 6",user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5",spark:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",external:"M14 5h5v5M19 5l-7 7M9 5H5v14h14v-4",filter:"M4 6h16l-6 7v5l-4 2v-7z",paperclip:"M8 12l6-6a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l7-7",upRight:"M7 17L17 7M8 7h9v9",downLeft:"M7 7l10 10M17 8v9H8",undo:"M8 6L4 10l4 4M4 10h10a5 5 0 0 1 0 10h-3",doc:"M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",target:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3",menu:"M4 6h16M4 12h16M4 18h16",eye:"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"};function S({name:e,size:t=16,fill:n=!1,stroke:a=1.6}){return T.default.createElement("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:a,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"},T.default.createElement("path",{d:it[e]??it.doc}))}function U({icon:e,label:t,onClick:n,active:a,size:i=16,className:o="",...r}){return T.default.createElement("button",{type:"button",className:`wd-icon-btn ${a?"is-active":""} ${o}`,"aria-label":t,title:t,onClick:n,...r},T.default.createElement(S,{name:e,size:i}))}function qe({value:e,options:t,onChange:n,label:a}){return T.default.createElement("div",{className:"wd-seg",role:"radiogroup","aria-label":a},t.map(i=>T.default.createElement("button",{key:i.value,type:"button",role:"radio","aria-checked":e===i.value,className:e===i.value?"is-on":"",onClick:()=>n(i.value),title:i.title??i.label},i.icon?T.default.createElement(S,{name:i.icon,size:14}):null,i.label?T.default.createElement("span",null,i.label):null)))}function he({title:e,onClose:t,children:n,width:a=460,footer:i=null}){let o=T.default.useRef(null),r=T.default.useRef(t);return r.current=t,T.default.useEffect(()=>{let l=w=>{w.key==="Escape"&&(w.stopPropagation(),r.current())};window.addEventListener("keydown",l,!0);let f=o.current;return(f?.querySelector(".wd-dialog-head ~ * input, .wd-dialog-head ~ * textarea, .wd-dialog-head ~ * select")??f?.querySelector(".wd-dialog-head ~ * button"))?.focus(),()=>window.removeEventListener("keydown",l,!0)},[]),T.default.createElement("div",{className:"wd-dialog-mask",onPointerDown:l=>{l.target===l.currentTarget&&t()}},T.default.createElement("div",{className:"wd-dialog",role:"dialog","aria-modal":"true","aria-label":e,style:{width:a},ref:o},T.default.createElement("div",{className:"wd-dialog-head"},T.default.createElement("h2",null,e),T.default.createElement(U,{icon:"close",label:"\u5173\u95ED",onClick:t})),n,i))}function ot(){let e=z(o=>o.dialog),[t,n]=T.default.useState({});if(T.default.useEffect(()=>{e&&n(e.initial??{})},[e]),!e)return null;let a=()=>b({dialog:null}),i=o=>{o.preventDefault(),e.onSubmit(t),a()};return T.default.createElement(he,{title:e.title,onClose:a,width:e.width??460},T.default.createElement("form",{className:"wd-form",onSubmit:i},e.fields.map(o=>o.type==="hidden"?T.default.createElement("p",{key:o.name,className:"wd-muted"},o.label):T.default.createElement("label",{key:o.name,className:"wd-field"},T.default.createElement("span",null,o.label),o.type==="textarea"?T.default.createElement("textarea",{rows:o.rows??3,value:t[o.name]??"",placeholder:o.placeholder,required:o.required,onChange:r=>n(l=>({...l,[o.name]:r.target.value}))}):o.type==="select"?T.default.createElement("select",{value:t[o.name]??"",required:o.required,onChange:r=>n(l=>({...l,[o.name]:r.target.value}))},(o.options??[]).map(r=>T.default.createElement("option",{key:r.value,value:r.value},r.label))):T.default.createElement("input",{type:o.type??"text",value:t[o.name]??"",placeholder:o.placeholder,required:o.required,onChange:r=>n(l=>({...l,[o.name]:r.target.value}))}),o.hint?T.default.createElement("small",null,o.hint):null)),T.default.createElement("div",{className:"wd-form-foot"},e.onDelete?T.default.createElement("button",{type:"button",className:"wd-btn is-danger",onClick:()=>{e.onDelete(),a()}},"\u5220\u9664"):null,T.default.createElement("span",{style:{flex:1}}),T.default.createElement("button",{type:"button",className:"wd-btn",onClick:a},"\u53D6\u6D88"),T.default.createElement("button",{type:"submit",className:"wd-btn is-primary"},e.submitLabel??"\u4FDD\u5B58"))))}function rt(){let e=z(t=>t.toast);return e?T.default.createElement("div",{key:e.key,className:`wd-toast ${e.error?"is-error":""}`,role:e.error?"alert":"status"},e.undo?T.default.createElement(S,{name:"check",size:13}):null,T.default.createElement("span",null,e.text),e.undo?T.default.createElement("button",{type:"button",onClick:le},"\u64A4\u9500"):null):null}function ne({title:e,hint:t,action:n}){return T.default.createElement("div",{className:"wd-empty"},T.default.createElement("p",{className:"wd-empty-title"},e),t?T.default.createElement("p",null,t):null,n)}function Ee({tone:e="",children:t}){return T.default.createElement("span",{className:`wd-tag ${e?`is-${e}`:""}`},t)}var p=G(require("react"),1);var be=["\u5468\u4E00","\u5468\u4E8C","\u5468\u4E09","\u5468\u56DB","\u5468\u4E94","\u5468\u516D","\u5468\u65E5"],st=["\u4E00\u6708","\u4E8C\u6708","\u4E09\u6708","\u56DB\u6708","\u4E94\u6708","\u516D\u6708","\u4E03\u6708","\u516B\u6708","\u4E5D\u6708","\u5341\u6708","\u5341\u4E00\u6708","\u5341\u4E8C\u6708"],ie=e=>String(e).padStart(2,"0");function F(e){let t=new Date(e);return`${t.getFullYear()}-${ie(t.getMonth()+1)}-${ie(t.getDate())}`}function ue(e){let t=new Date(e);return t.setHours(0,0,0,0),t}function pe(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),n}function xe(e){let t=ue(e);return pe(t,-((t.getDay()+6)%7))}function Kt(e,t){return F(e)===F(t)}function A(e){if(!e)return"";let t=new Date(e);return`${ie(t.getHours())}:${ie(t.getMinutes())}`}function fe(e){let t=new Date(e);return`${t.getMonth()+1}\u6708${t.getDate()}\u65E5`}function Pe(e){return`${fe(e)} ${A(e)}`}function Q(e,t=new Date){let n=Math.round((ue(e)-ue(t))/864e5);return n===0?"\u4ECA\u5929":n===1?"\u660E\u5929":n===2?"\u540E\u5929":n===-1?"\u6628\u5929":n<0&&n>-8?`${-n} \u5929\u524D`:fe(e)}function lt(e,t=new Date){if(!e)return"";let n=new Date(e);return Kt(n,t)?A(n):n.getFullYear()===t.getFullYear()?fe(n):`${n.getFullYear()}/${n.getMonth()+1}/${n.getDate()}`}function J(e,t=new Date){let n=new Date(e)-t,a=Math.round(n/6e4);if(a<=0)return"\u5DF2\u5F00\u59CB";if(a<60)return`${a} \u5206\u949F\u540E`;let i=Math.floor(a/60),o=a%60;return i<24?o?`${i} \u5C0F\u65F6 ${o} \u5206\u540E`:`${i} \u5C0F\u65F6\u540E`:`${Math.round(i/24)} \u5929\u540E`}function He(e){let t=new Date(e);return t.getHours()*60+t.getMinutes()}function _e(e,t){let n=ue(e);return n.setMinutes(t),n}function ae(e,t=2){if(e==null||Number.isNaN(Number(e)))return"\u2014";let n=Number(e);return`${n>=0?"+":""}${n.toFixed(t)}%`}function Z(e){if(e==null)return"";let t=Number(e);return!Number.isFinite(t)||t===0?"":t>0?"is-up":"is-down"}function R(e,t=2){return e==null||Number.isNaN(Number(e))?"\u2014":Number(e).toLocaleString("zh-CN",{minimumFractionDigits:t,maximumFractionDigits:t})}function dt(e){if(e==null)return"\u2014";let t=Number(e);return Number.isFinite(t)?Math.abs(t)>=1e8?`${(t/1e8).toFixed(2)} \u4EBF`:Math.abs(t)>=1e4?`${(t/1e4).toFixed(1)} \u4E07`:t.toLocaleString("zh-CN"):"\u2014"}function pt(e){let t=e.filter(r=>!r.allDay).sort((r,l)=>new Date(r.start)-new Date(l.start)),n=[],a=[],i=0,o=()=>{if(!a.length)return;let r=[];for(let l of a){let f=r.findIndex(w=>w<=new Date(l.start).getTime());f<0&&(f=r.length,r.push(0)),r[f]=new Date(l.end).getTime(),n.push({event:l,lane:f,lanes:0})}for(let l of n)a.includes(l.event)&&(l.lanes=r.length);a=[],i=0};for(let r of t){let l=new Date(r.start).getTime();a.length&&l>=i&&o(),a.push(r),i=Math.max(i,new Date(r.end).getTime())}return o(),n}function mt(e){return String(e??"").split(`
`).map(t=>t.trim()).filter(Boolean)}function ve(e){if(!e)return"";let t=new Date(e);return`${t.getFullYear()}-${ie(t.getMonth()+1)}-${ie(t.getDate())}T${ie(t.getHours())}:${ie(t.getMinutes())}`}function Ue(e={}){let t=e.start??(()=>{let n=new Date;return n.setMinutes(Math.ceil((n.getMinutes()+30)/15)*15,0,0),n})();b({dialog:{title:"\u65B0\u5EFA\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:"",start:ve(t),minutes:30,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0,placeholder:"\u4EA7\u54C1\u5468\u4F1A"},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9",placeholder:"\u4F1A\u8BAE\u5BA4 / \u7EBF\u4E0A\u94FE\u63A5"}],onSubmit:n=>{let a=new Date(n.start),i=Math.max(5,Number(n.minutes)||30);P([{op:"add_event",title:n.title,start:a.toISOString(),end:new Date(a.getTime()+i*6e4).toISOString(),location:n.location??""}],{label:"\u65B0\u5EFA\u65E5\u7A0B"})}}})}function Wt({text:e}){let t=mt(e);return p.default.createElement("div",{className:"wd-brief"},t.map((n,a)=>/^###\s+/.test(n)?p.default.createElement("h4",{key:a},n.replace(/^###\s+/,"")):/^[-·]\s+/.test(n)?p.default.createElement("p",{key:a,className:"wd-brief-li"},n.replace(/^[-·]\s+/,"")):p.default.createElement("p",{key:a},n)))}function Gt({events:e,now:t}){let a=e.filter(o=>F(o.start)===F(t)&&o.status!=="cancelled").filter(o=>!o.allDay).sort((o,r)=>new Date(o.start)-new Date(r.start)),i=a.find(o=>new Date(o.start)<=t&&new Date(o.end)>t);return p.default.createElement("section",{className:"wd-card wd-agenda"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u4ECA\u5929\u7684\u8BAE\u7A0B"),p.default.createElement("span",{className:"wd-card-meta"},a.length?`${a.length} \u4E2A\u4F1A`:"\u6CA1\u6709\u4F1A\u8BAE"),p.default.createElement("span",{style:{flex:1}}),p.default.createElement(U,{icon:"plus",label:"\u65B0\u5EFA\u65E5\u7A0B",onClick:()=>Ue()})),p.default.createElement("div",{className:"wd-agenda-body"},a.length===0?p.default.createElement(ne,{title:"\u4ECA\u5929\u6CA1\u6709\u88AB\u7EA6\u6EE1",hint:"\u7559\u51FA\u6765\u7684\u6574\u5757\u65F6\u95F4\uFF0C\u9002\u5408\u505A\u9700\u8981\u8FDE\u7EED\u6CE8\u610F\u529B\u7684\u4E8B\u3002",action:p.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Ue()},"\u52A0\u4E00\u4E2A\u65E5\u7A0B")}):a.map(o=>{let r=i?.id===o.id,l=new Date(o.end)<=t;return p.default.createElement("article",{key:o.id,className:`wd-event ${r?"is-running":""} ${l?"is-past":""} tone-${o.color??"blue"}`},p.default.createElement("div",{className:"wd-event-time"},p.default.createElement("b",null,A(o.start)),p.default.createElement("small",null,A(o.end))),p.default.createElement("div",{className:"wd-event-bar","aria-hidden":"true"}),p.default.createElement("div",{className:"wd-event-main"},p.default.createElement("h3",null,o.title),p.default.createElement("p",null,o.location?p.default.createElement("span",null,o.location):null,o.attendees?.length?p.default.createElement("span",null,o.attendees.join("\u3001")):null,o.status==="tentative"?p.default.createElement(Ee,{tone:"amber"},"\u5F85\u5B9A"):null,r?p.default.createElement(Ee,{tone:"green"},"\u8FDB\u884C\u4E2D"):l?null:p.default.createElement("span",{className:"wd-muted"},J(o.start,t)))),p.default.createElement(U,{icon:"edit",label:"\u7F16\u8F91",onClick:()=>ye(o)}))})),i?p.default.createElement("footer",{className:"wd-agenda-foot"},p.default.createElement(S,{name:"clock",size:13}),"\u73B0\u5728\u8FDB\u884C\uFF1A",i.title,"\uFF0C\u8FD8\u6709 ",Math.max(0,Math.round((new Date(i.end)-t)/6e4))," \u5206\u949F"):null)}function ye(e){b({dialog:{title:"\u7F16\u8F91\u65E5\u7A0B",submitLabel:"\u4FDD\u5B58",initial:{title:e.title,start:ve(e.start),minutes:Math.max(5,Math.round((new Date(e.end)-new Date(e.start))/6e4)),location:e.location??"",notes:e.notes??""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"},{name:"notes",label:"\u5907\u6CE8",type:"textarea",rows:3}],onSubmit:t=>{let n=new Date(t.start),a=Math.max(5,Number(t.minutes)||30);P([{op:"update_event",id:e.id,title:t.title,start:n.toISOString(),end:new Date(n.getTime()+a*6e4).toISOString(),location:t.location??"",notes:t.notes??""}],{label:"\u4FEE\u6539\u65E5\u7A0B"})},onDelete:()=>P([{op:"delete_event",id:e.id}],{label:`\u5220\u9664\u300C${e.title.slice(0,10)}\u300D`})}})}function Qt({mails:e}){return p.default.createElement("section",{className:"wd-card"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u9700\u8981\u4F60\u56DE"),p.default.createElement("span",{className:"wd-card-meta"},e.length?`${e.length} \u5C01`:"\u6E05\u7A7A\u4E86"),p.default.createElement("span",{style:{flex:1}}),p.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({view:"mail"})},"\u5168\u90E8\u90AE\u4EF6")),e.length===0?p.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u90AE\u4EF6\u3002",p.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({settingsOpen:!0})},"\u53BB\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1")):p.default.createElement("ul",{className:"wd-mail-mini"},e.slice(0,4).map(t=>p.default.createElement("li",{key:t.id},p.default.createElement("button",{type:"button",onClick:()=>de(t.id)},p.default.createElement("span",{className:"wd-dot"}),p.default.createElement("span",{className:"wd-mail-mini-main"},p.default.createElement("b",null,t.from?.name||t.from?.address),p.default.createElement("span",null,t.subject)),p.default.createElement("time",null,Q(t.date)))))))}function Xt({tasks:e}){let t=e.filter(a=>!a.done),n=e.filter(a=>a.done).slice(0,3);return p.default.createElement("section",{className:"wd-card"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u5F85\u529E"),p.default.createElement("span",{className:"wd-card-meta"},t.length?`${t.length} \u6761`:"\u90FD\u505A\u5B8C\u4E86"),p.default.createElement("span",{style:{flex:1}}),p.default.createElement(U,{icon:"plus",label:"\u52A0\u5F85\u529E",onClick:()=>ke()})),p.default.createElement("ul",{className:"wd-tasks"},[...t,...n].map(a=>p.default.createElement("li",{key:a.id,className:a.done?"is-done":""},p.default.createElement("button",{type:"button",className:"wd-check","aria-label":a.done?"\u6807\u8BB0\u672A\u5B8C\u6210":"\u6807\u8BB0\u5B8C\u6210",onClick:()=>P([{op:"toggle_task",id:a.id}],{label:"\u66F4\u65B0\u5F85\u529E",silent:!0})},a.done?p.default.createElement(S,{name:"check",size:11,stroke:2.6}):null),p.default.createElement("span",{className:"wd-task-title"},a.title),a.due?p.default.createElement("time",{className:new Date(a.due)<new Date&&!a.done?"is-overdue":""},Q(a.due)," ",A(a.due)):null))))}function ke(e={}){b({dialog:{title:"\u65B0\u5EFA\u5F85\u529E",submitLabel:"\u8BB0\u4E0B",initial:{title:"",due:"",priority:"0",...e},fields:[{name:"title",label:"\u5185\u5BB9",required:!0,placeholder:"\u56DE\u5468\u821F\u7684\u6539\u7248\u610F\u89C1"},{name:"due",label:"\u622A\u6B62",type:"datetime-local"},{name:"priority",label:"\u4F18\u5148\u7EA7",type:"select",options:[{value:"0",label:"\u666E\u901A"},{value:"1",label:"\u91CD\u8981"},{value:"2",label:"\u4ECA\u5929\u5FC5\u987B"}]}],onSubmit:t=>P([{op:"add_task",title:t.title,due:t.due?new Date(t.due).toISOString():null,priority:Number(t.priority)||0}],{label:"\u65B0\u5EFA\u5F85\u529E"})}})}function Jt({events:e,now:t}){let n=e.filter(a=>a.status!=="cancelled"&&new Date(a.start)>t&&F(a.start)!==F(t)).sort((a,i)=>new Date(a.start)-new Date(i.start)).slice(0,5);return p.default.createElement("section",{className:"wd-card"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u63A5\u4E0B\u6765"),p.default.createElement("span",{className:"wd-card-meta"},n.length?`\u672A\u6765 ${n.length} \u4EF6`:"\u7A7A\u7684"),p.default.createElement("span",{style:{flex:1}}),p.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({view:"calendar"})},"\u6253\u5F00\u65E5\u5386")),n.length===0?p.default.createElement("p",{className:"wd-card-empty"},"\u63A5\u4E0B\u6765\u51E0\u5929\u8FD8\u6CA1\u6709\u5B89\u6392\u3002"):p.default.createElement("ul",{className:"wd-upcoming"},n.map(a=>p.default.createElement("li",{key:a.id},p.default.createElement("time",null,p.default.createElement("b",null,Q(a.start,t)),A(a.start)),p.default.createElement("span",{className:`wd-upcoming-dot tone-${a.color??"blue"}`,"aria-hidden":"true"}),p.default.createElement("button",{type:"button",className:"wd-upcoming-title",onClick:()=>ye(a)},a.title),a.status==="tentative"?p.default.createElement(Ee,{tone:"amber"},"\u5F85\u5B9A"):null))))}function Zt({positions:e,quotes:t}){if(!e.length)return null;let n=e.map(i=>{let o=t[i.code]?.price??null,r=o===null?null:o*i.shares,l=o===null?null:(o-i.cost)*i.shares;return{...i,price:o,value:r,pnl:l}}),a=n.reduce((i,o)=>i+(o.pnl??0),0);return p.default.createElement("section",{className:"wd-card"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u6301\u4ED3"),p.default.createElement("span",{className:`wd-card-meta ${Z(a)}`},a>=0?"+":"",R(a,0)),p.default.createElement("span",{style:{flex:1}}),p.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({view:"market"})},"\u884C\u60C5")),p.default.createElement("ul",{className:"wd-holdings"},n.map(i=>p.default.createElement("li",{key:i.id},p.default.createElement("span",null,i.name),p.default.createElement("b",null,i.price??"\u2014"),p.default.createElement("em",{className:Z(i.pnl)},i.pnl===null?"\u2014":`${i.pnl>=0?"+":""}${R(i.pnl,0)}`)))))}function Rt({rows:e,onOpen:t}){return e.length?p.default.createElement("section",{className:"wd-strip","aria-label":"\u81EA\u9009\u884C\u60C5"},p.default.createElement("span",{className:"wd-strip-label"},p.default.createElement(S,{name:"chart",size:14}),"\u81EA\u9009"),p.default.createElement("div",{className:"wd-strip-list"},e.map(n=>p.default.createElement("button",{key:n.code,type:"button",className:`wd-strip-item ${Z(n.quote?.changePct)}`,onClick:()=>t(n.code)},p.default.createElement("span",{className:"wd-strip-name"},n.quote?.name??n.name),p.default.createElement("b",null,n.quote?.price??"\u2014"),p.default.createElement("small",null,ae(n.quote?.changePct))))),p.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({view:"market"})},"\u884C\u60C5\u9875")):null}function Fe(){let e=z(N=>N.state),t=z(N=>N.quotes),n=z(N=>N.brief),a=z(N=>N.tick),[i,o]=p.default.useState(!1),r=p.default.useMemo(()=>new Date,[a]),l=e.events,f=e.tasks,w=l.filter(N=>F(N.start)===F(r)&&N.status!=="cancelled"),v=f.filter(N=>!N.done),c=e.mails.filter(N=>N.unread&&!N.sent).sort((N,x)=>Date.parse(x.date)-Date.parse(N.date)),d=w.filter(N=>new Date(N.end)>r&&!N.allDay).sort((N,x)=>new Date(N.start)-new Date(x.start))[0],M=e.watchlist.map(N=>({...N,quote:t[N.code]}));return p.default.createElement("div",{className:"wd-page wd-today"},p.default.createElement("header",{className:"wd-hero"},p.default.createElement("div",{className:"wd-hero-top"},p.default.createElement("div",null,p.default.createElement("p",{className:"wd-hero-date"},r.getFullYear()," \xB7 ",r.getMonth()+1," \u6708 ",r.getDate()," \u65E5 \xB7 ",be[(r.getDay()+6)%7]),p.default.createElement("h1",{className:"wd-hero-line"},"\u4ECA\u5929 ",p.default.createElement("b",null,w.length)," \u4E2A\u4F1A\uFF0C",p.default.createElement("b",null,v.length)," \u6761\u5F85\u529E\uFF0C",p.default.createElement("b",null,c.length)," \u5C01\u672A\u8BFB\u3002")),p.default.createElement("span",{className:"wd-stamp is-today","aria-hidden":"true",title:"\u4ECA\u5929"},p.default.createElement("b",null,r.getDate()),p.default.createElement("small",null,r.getMonth()+1," \u6708"))),d?p.default.createElement("p",{className:"wd-hero-next"},p.default.createElement(S,{name:"clock",size:14}),new Date(d.start)<=r?"\u6B63\u5728\u8FDB\u884C\uFF1A":"\u4E0B\u4E00\u4EF6\uFF1A",p.default.createElement("b",null,A(d.start))," ",d.title,p.default.createElement("span",{className:"wd-muted"},"\xB7 ",new Date(d.start)<=r?`\u8FD8\u6709 ${Math.max(0,Math.round((new Date(d.end)-r)/6e4))} \u5206\u949F`:J(d.start,r))):w.length?p.default.createElement("p",{className:"wd-hero-next"},"\u4ECA\u5929\u7684\u4F1A\u8BAE\u90FD\u7ED3\u675F\u4E86\u3002"):p.default.createElement("p",{className:"wd-hero-next"},"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392\uFF0C\u9002\u5408\u63A8\u8FDB\u4E00\u4EF6\u91CD\u8981\u7684\u4E8B\u3002"),p.default.createElement("div",{className:"wd-hero-actions"},p.default.createElement("button",{type:"button",className:"wd-btn is-primary",disabled:i,onClick:async()=>{o(!0),await Ae(),o(!1)}},p.default.createElement(S,{name:"spark",size:14}),i?"\u6B63\u5728\u5199\u2026":n?"\u91CD\u65B0\u751F\u6210\u6668\u62A5":"\u751F\u6210\u6668\u62A5"),p.default.createElement("button",{type:"button",className:"wd-btn",onClick:()=>Ue()},p.default.createElement(S,{name:"calendar",size:14}),"\u65B0\u5EFA\u65E5\u7A0B"),p.default.createElement("button",{type:"button",className:"wd-btn",onClick:()=>b({view:"mail",composer:{to:"",cc:"",subject:"",text:""}})},p.default.createElement(S,{name:"mail",size:14}),"\u5199\u90AE\u4EF6"))),p.default.createElement("div",{className:"wd-today-grid"},p.default.createElement("div",{className:"wd-today-left"},p.default.createElement(Gt,{events:l,now:r}),p.default.createElement("section",{className:"wd-card wd-brief-card"},p.default.createElement("header",{className:"wd-card-head"},p.default.createElement("h2",null,"\u6668\u62A5"),n?p.default.createElement("span",{className:"wd-card-meta"},n.engine==="local"?"\u6A21\u677F\u62FC\u88C5":"\u6A21\u578B\u751F\u6210"," \xB7 ",A(n.createdAt)):null),n?p.default.createElement(Wt,{text:n.text}):p.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u6668\u62A5\u3002\u70B9\u4E0A\u9762\u7684\u300C\u751F\u6210\u6668\u62A5\u300D\uFF0C\u628A\u4ECA\u5929\u7684\u4F1A\u3001\u90AE\u4EF6\u548C\u884C\u60C5\u8BFB\u6210\u4E00\u6BB5\u8BDD\u3002")),p.default.createElement(Jt,{events:e.events,now:r})),p.default.createElement("div",{className:"wd-today-right"},p.default.createElement(Qt,{mails:c}),p.default.createElement(Xt,{tasks:f}),p.default.createElement(Zt,{positions:e.positions,quotes:t}))),p.default.createElement(Rt,{rows:M,onOpen:N=>b({view:"market",minuteCode:N})}))}var te=8,Ie=21,me=1.05,ct=(Ie-te)*60*me;function Be(e,t,n){return Math.min(n,Math.max(t,e))}function en(e,t){let n=_e(e,t);b({dialog:{title:"\u65B0\u5EFA\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:"",start:ve(n),minutes:45,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0,placeholder:"\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248\u7A3F"},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"}],onSubmit:a=>{let i=new Date(a.start),o=Math.max(5,Number(a.minutes)||45);P([{op:"add_event",title:a.title,start:i.toISOString(),end:new Date(i.getTime()+o*6e4).toISOString(),location:a.location??""}],{label:"\u65B0\u5EFA\u65E5\u7A0B"})}}})}function tn({weekStart:e,events:t,now:n}){let a=y.default.useRef(null),i=y.default.useRef(null),[,o]=y.default.useReducer(g=>g+1,0),r=Array.from({length:7},(g,$)=>pe(e,$)),l=F(n),f=Array.from({length:Ie-te},(g,$)=>te+$),w=y.default.useMemo(()=>{let g=new Map;for(let $ of r){let _=F($),k=t.filter(L=>L.status!=="cancelled"&&F(L.start)===_);g.set(_,pt(k))}return g},[t,e]),v=g=>(He(g)-te*60)*me,c=(g,$)=>Math.max(20,(new Date($)-new Date(g))/6e4*me-2),d=(g,$)=>{if(g.target.closest(".wd-cal-event"))return;let _=a.current.getBoundingClientRect(),k=Be(Math.round(((g.clientY-_.top)/me+te*60)/15)*15,te*60,Ie*60-15);en($,k)},M=(g,$)=>{if(g.button!==0)return;g.stopPropagation();let _=a.current.getBoundingClientRect(),k=new Date($.end)-new Date($.start);i.current={id:$.id,dayIndex:r.findIndex(H=>F(H)===F($.start)),minutes:He($.start),moved:!1,span:k,startX:g.clientX,startY:g.clientY};let L=H=>{let B=i.current;B&&(!B.moved&&Math.hypot(H.clientX-B.startX,H.clientY-B.startY)<4||(B.moved=!0,B.dayIndex=Be(Math.floor((H.clientX-_.left)/(_.width/7)),0,6),B.minutes=Be(Math.round(((H.clientY-_.top)/me+te*60)/15)*15,te*60,Ie*60-15),o()))},j=async()=>{window.removeEventListener("pointermove",L),window.removeEventListener("pointerup",j);let H=i.current;if(i.current=null,o(),!H?.moved)return;let B=r[H.dayIndex],I=_e(B,H.minutes);await P([{op:"update_event",id:H.id,start:I.toISOString(),end:new Date(I.getTime()+H.span).toISOString()}],{label:"\u79FB\u52A8\u65E5\u7A0B",silent:!0})};window.addEventListener("pointermove",L),window.addEventListener("pointerup",j)},N=v(n),x=r.some(g=>F(g)===l)&&N>=0&&N<=ct;return y.default.createElement("section",{className:"wd-card wd-cal"},y.default.createElement("header",{className:"wd-cal-head"},y.default.createElement("div",{className:"wd-cal-days"},y.default.createElement("span",{className:"wd-cal-gutter"}),r.map(g=>y.default.createElement("div",{key:F(g),className:`wd-cal-day ${F(g)===l?"is-today":""}`},y.default.createElement("small",null,be[(g.getDay()+6)%7]),y.default.createElement("b",null,g.getDate()))))),y.default.createElement("div",{className:"wd-cal-scroll"},y.default.createElement("div",{className:"wd-cal-body",ref:a,style:{height:ct}},y.default.createElement("div",{className:"wd-cal-gutter"},f.map(g=>y.default.createElement("span",{key:g,style:{top:(g-te)*60*me}},String(g).padStart(2,"0"),":00"))),r.map(g=>{let $=F(g),_=w.get($)??[];return y.default.createElement("div",{key:$,className:`wd-cal-col ${$===l?"is-today":""}`,onClick:k=>d(k,g)},_.map(({event:k,lane:L,lanes:j})=>{let H=i.current?.id===k.id&&i.current?.moved,B=H?(i.current.minutes-te*60)*me:v(k.start),I=j>1?L/j*100:0,K=j>1?100/j-1:100;return y.default.createElement("article",{key:k.id,className:`wd-cal-event tone-${k.color??"blue"} ${k.status==="tentative"?"is-tentative":""} ${H?"is-dragging":""}`,style:{top:B,height:c(k.start,k.end),left:`${I}%`,width:`${K}%`},onPointerDown:W=>M(W,k),onDoubleClick:()=>ye(k),title:`${A(k.start)} ${k.title}`},y.default.createElement("b",null,k.title),y.default.createElement("span",null,A(k.start)),j>1?y.default.createElement("i",{className:"wd-cal-conflict",title:"\u548C\u53E6\u4E00\u4E2A\u4F1A\u51B2\u7A81"},"\u51B2\u7A81"):null)}),x&&$===l?y.default.createElement("div",{className:"wd-cal-now",style:{top:N}},y.default.createElement("i",null)):null)}))),y.default.createElement("footer",{className:"wd-cal-foot"},y.default.createElement("span",{className:"wd-muted"},"\u62D6\u52A8\u4F1A\u8BAE\u6539\u65F6\u95F4\uFF0C\u53CC\u51FB\u7F16\u8F91\uFF1B\u7A7A\u767D\u5904\u70B9\u4E00\u4E0B\u6309\u90A3\u4E2A\u65F6\u95F4\u65B0\u5EFA\u3002")))}function nn({cursor:e,events:t,now:n,onOpenDay:a}){let i=e.getFullYear(),o=e.getMonth(),r=new Date(i,o,1),l=xe(r),f=Array.from({length:42},(c,d)=>pe(l,d)),w=f[35].getMonth()===o?f:f.slice(0,35),v=F(n);return y.default.createElement("section",{className:"wd-card wd-month"},y.default.createElement("div",{className:"wd-month-week"},be.map(c=>y.default.createElement("span",{key:c},c))),y.default.createElement("div",{className:"wd-month-grid"},w.map(c=>{let d=F(c),M=t.filter(N=>N.status!=="cancelled"&&F(N.start)===d);return y.default.createElement("div",{key:d,className:`wd-month-cell ${c.getMonth()!==o?"is-outside":""} ${d===v?"is-today":""}`,onClick:()=>a(c)},y.default.createElement("span",{className:"wd-month-date"},c.getDate()),M.slice(0,3).map(N=>y.default.createElement("button",{key:N.id,type:"button",className:`wd-month-event tone-${N.color??"blue"}`,onClick:x=>{x.stopPropagation(),ye(N)}},y.default.createElement("time",null,A(N.start)),N.title)),M.length>3?y.default.createElement("span",{className:"wd-month-more"},"\u8FD8\u6709 ",M.length-3," \u4E2A"):null)})))}function an(){b({dialog:{title:"\u5BFC\u5165 .ics \u65E5\u5386",submitLabel:"\u5BFC\u5165",width:560,fields:[{name:"text",label:"\u628A .ics \u6587\u4EF6\u91CC\u7684\u5185\u5BB9\u8D34\u8FDB\u6765\uFF08\u4E5F\u53EF\u4EE5\u76F4\u63A5\u62D6\u6587\u4EF6\u5230\u7A97\u53E3\uFF09",type:"textarea",rows:9,required:!0,placeholder:"BEGIN:VCALENDAR\u2026"}],onSubmit:e=>tt(e.text)}})}function on({tasks:e}){let t=e.filter(n=>!n.done);return y.default.createElement("aside",{className:"wd-cal-rail"},y.default.createElement("section",{className:"wd-card"},y.default.createElement("header",{className:"wd-card-head"},y.default.createElement("h2",null,"\u5F85\u529E"),y.default.createElement("span",{className:"wd-card-meta"},t.length," \u6761"),y.default.createElement("span",{style:{flex:1}}),y.default.createElement(U,{icon:"plus",label:"\u52A0\u5F85\u529E",onClick:()=>ke()})),t.length===0?y.default.createElement("p",{className:"wd-card-empty"},"\u6CA1\u6709\u5F85\u529E\u3002"):y.default.createElement("ul",{className:"wd-tasks"},t.slice(0,8).map(n=>y.default.createElement("li",{key:n.id},y.default.createElement("button",{type:"button",className:"wd-check","aria-label":"\u6807\u8BB0\u5B8C\u6210",onClick:()=>P([{op:"toggle_task",id:n.id}],{label:"\u66F4\u65B0\u5F85\u529E",silent:!0})}),y.default.createElement("span",{className:"wd-task-title"},n.title),n.due?y.default.createElement("time",null,fe(n.due)):null)))),y.default.createElement("section",{className:"wd-card"},y.default.createElement("header",{className:"wd-card-head"},y.default.createElement("h2",null,"\u65E5\u5386")),y.default.createElement("div",{className:"wd-cal-actions"},y.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:an},y.default.createElement(S,{name:"archive",size:13}),"\u5BFC\u5165 .ics"),y.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:nt},y.default.createElement(S,{name:"external",size:13}),"\u5BFC\u51FA .ics")),y.default.createElement("p",{className:"wd-muted wd-cal-hint"},"\u5BFC\u51FA\u7684\u6587\u4EF6\u53EF\u4EE5\u76F4\u63A5\u5BFC\u5165\u4F01\u4E1A\u5FAE\u4FE1\u3001\u98DE\u4E66\u6216\u624B\u673A\u65E5\u5386\uFF1B\u91CD\u590D\u65E5\u7A0B\uFF08RRULE\uFF09\u53EA\u5BFC\u5165\u7B2C\u4E00\u6761\u3002")))}function ut(){let e=z(c=>c.state),t=z(c=>c.tick),n=z(c=>c.calendarMode),[a,i]=y.default.useState(()=>xe(new Date)),[o,r]=y.default.useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1)),l=y.default.useMemo(()=>new Date,[t]),f=ue(l),w=pe(a,6),v=e.events.filter(c=>c.status!=="cancelled"&&new Date(c.end)>l).sort((c,d)=>new Date(c.start)-new Date(d.start))[0];return y.default.createElement("div",{className:"wd-page wd-cal-page"},y.default.createElement("header",{className:"wd-page-head"},y.default.createElement("div",null,y.default.createElement("h1",null,n==="week"?`${a.getMonth()+1} \u6708 ${a.getDate()} \u65E5 \u2013 ${w.getMonth()+1} \u6708 ${w.getDate()} \u65E5`:`${o.getFullYear()} \u5E74 ${st[o.getMonth()]}`),y.default.createElement("p",{className:"wd-page-sub"},v?`\u4E0B\u4E00\u4EF6\uFF1A${fe(v.start)} ${A(v.start)} ${v.title}\uFF08${new Date(v.start)<=l?`\u8FDB\u884C\u4E2D\uFF0C\u8FD8\u6709 ${Math.max(0,Math.round((new Date(v.end)-l)/6e4))} \u5206\u949F`:J(v.start,l)}\uFF09`:"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392")),y.default.createElement("span",{className:"wd-stamp is-sm is-today","aria-hidden":"true",title:`${a.getMonth()+1} \u6708`},y.default.createElement("b",null,a.getMonth()+1),y.default.createElement("small",null,"\u6708")),y.default.createElement("span",{style:{flex:1}}),y.default.createElement(U,{icon:"chevL",label:n==="week"?"\u4E0A\u4E00\u5468":"\u4E0A\u4E2A\u6708",onClick:()=>{n==="week"?i(pe(a,-7)):r(new Date(o.getFullYear(),o.getMonth()-1,1))}}),y.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>{i(xe(new Date)),r(new Date(l.getFullYear(),l.getMonth(),1))}},"\u4ECA\u5929"),y.default.createElement(U,{icon:"chevR",label:n==="week"?"\u4E0B\u4E00\u5468":"\u4E0B\u4E2A\u6708",onClick:()=>{n==="week"?i(pe(a,7)):r(new Date(o.getFullYear(),o.getMonth()+1,1))}}),y.default.createElement(qe,{label:"\u89C6\u56FE",value:n,onChange:c=>b({calendarMode:c}),options:[{value:"week",label:"\u5468"},{value:"month",label:"\u6708"}]})),y.default.createElement("div",{className:"wd-cal-wrap"},n==="week"?y.default.createElement(tn,{weekStart:a,events:e.events,now:l}):y.default.createElement(nn,{cursor:o,events:e.events,now:l,onOpenDay:c=>{i(xe(c)),b({calendarMode:"week"})}}),y.default.createElement(on,{tasks:e.tasks})))}var C=G(require("react"),1);var q=G(require("react"),1);var rn={running:!1,openState:"cold"},sn={ids:[],byId:{},phase:"empty",projectionsBySession:{}};function ft(e){return(e??[]).filter(t=>t?.type==="text"&&typeof t.text=="string").map(t=>t.text).join("")}function ln(e){return(e??[]).filter(t=>t?.type==="tool-call").map(t=>t.name).filter(Boolean)}function dn(e){let t=[];for(let n of e??[]){if(n?.type!=="event")continue;let a=n.event,i=a?.seq??0;if(a?.type==="user/message"){let o=a.data?.source?.kind;if(o&&o!=="user")continue;let r=ft(a.data?.content).trim();r&&t.push({id:`u${i}`,role:"user",text:r})}else if(a?.type==="assistant/message"){let o=a.data?.message,r=ft(o?.content).trim(),l=ln(o?.content);(r||l.length)&&t.push({id:`a${i}`,role:"assistant",text:r,tools:l})}}return t.slice(-40)}function pn(e){let t=q.default.useCallback(a=>e?e.subscribe(a):()=>{},[e]),n=q.default.useCallback(()=>e?e.getSnapshot():rn,[e]);return q.default.useSyncExternalStore(t,n)}function mn(){try{let e=new URL(window.location.href),t=e.searchParams.get("session")||e.searchParams.get("sessionId");return t||(/(?:session|chat)[/=]([A-Za-z0-9_-]{6,})/.exec(`${e.pathname}${e.hash}`)?.[1]??null)}catch{return null}}function cn(e){if(!e)return!1;let t=/(明天|后天|今天|周[一二三四五六日天]|下周|\d{1,2}\s*[点:：]\s*\d{0,2}|\d{1,2}\s*月\s*\d{1,2}\s*[日号])/,n=/(会|安排|约|提醒|待办|截止|之前|前|记得|排期|复盘|交付)/;return t.test(e)&&n.test(e)}function wt({useSessions:e,head:t}){let n=q.default.useMemo(()=>ge()?.get?.("sessions")?.list??null,[]),a=q.default.useSyncExternalStore(q.default.useCallback(I=>n?n.subscribe(I):()=>{},[n]),q.default.useCallback(()=>n?n.getSnapshot():sn,[n])),[i,o]=q.default.useState(null),[r,l]=q.default.useState(null),[f,w]=q.default.useState([]),[v,c]=q.default.useState(null),[d,M]=q.default.useState(""),[N,x]=q.default.useState(!1),g=q.default.useRef(null),$=q.default.useMemo(()=>(a?.ids??[]).map(K=>({id:K,...a.byId?.[K]??{}})).sort((K,W)=>Number(K.blank??!1)-Number(W.blank??!1)||(W.updatedAt??0)-(K.updatedAt??0)),[a]),_=q.default.useMemo(()=>mn(),[]),k=(i&&$.some(I=>I.id===i)?i:null)??(_&&$.some(I=>I.id===_)?_:null)??$[0]?.id??null;q.default.useEffect(()=>{if(!k)return;let I=ge()?.get("sessions");if(!I?.retain){c("\u8FD9\u4E2A\u73AF\u5883\u6CA1\u6709 sessions \u670D\u52A1\uFF0C\u4F1A\u8BDD\u955C\u50CF\u4E0D\u53EF\u7528");return}let K=!1,W=null,Ve=null;l(null),w([]),c(null);try{W=I.retain(k,{source:"work-desk"}),W.ready.then(re=>{if(K)return;l(re);let Ke=()=>w(re.eventSource.getSnapshot().entries);Ke(),Ve=re.eventSource.subscribe(Ke)}).catch(re=>{K||c(re?.message??"\u6253\u4E0D\u5F00\u8FD9\u6761\u4F1A\u8BDD")})}catch(re){c(re?.message??"\u6253\u4E0D\u5F00\u8FD9\u6761\u4F1A\u8BDD")}return()=>{K=!0;try{Ve?.()}catch{}try{W?.release?.()}catch{}}},[k]);let L=q.default.useMemo(()=>dn(f),[f]),j=pn(r?.session??null);q.default.useEffect(()=>{g.current&&g.current.scrollTo({top:g.current.scrollHeight,behavior:"smooth"})},[L.length,j?.running]);let H=async I=>{let K=String(I??"").trim();if(!(!K||!r||N)){x(!0),I===void 0&&M("");try{let W=await r.session.prompt([{type:"text",text:K}],"queue");W&&W.ok===!1&&c(W.error?.message??"\u53D1\u9001\u5931\u8D25")}catch(W){c(W?.message??"\u53D1\u9001\u5931\u8D25")}finally{x(!1)}}},B=()=>H(d);return q.default.createElement("div",{className:"wd-chat"},q.default.createElement("header",{className:"wd-dock-head","data-window-drag":""},t,q.default.createElement("span",{className:"wd-engine is-live",title:"\u8FD9\u6761\u5C31\u662F DSH \u7684\u4F1A\u8BDD\uFF0C\u4E0D\u662F\u63D2\u4EF6\u81EA\u5DF1\u7684\u6A21\u578B\u8C03\u7528"},q.default.createElement("i",null),j?.running?"\u8FD0\u884C\u4E2D":"\u4F1A\u8BDD"),q.default.createElement("span",{style:{flex:1}}),$.length>1?q.default.createElement("select",{className:"wd-session-pick","aria-label":"\u9009\u62E9\u4F1A\u8BDD",value:k??"",onChange:I=>o(I.target.value)},$.slice(0,12).map(I=>q.default.createElement("option",{key:I.id,value:I.id},(I.title??I.id).slice(0,18)))):null,q.default.createElement(U,{icon:"close",label:"\u6536\u8D77\u5BF9\u8BDD",onClick:()=>b({dockOpen:!1})})),q.default.createElement("div",{className:"wd-dock-scroll",ref:g,"aria-live":"polite"},v?q.default.createElement("p",{className:"wd-msg-error"},v):null,!r&&!v?q.default.createElement("div",{className:"wd-dock-intro"},q.default.createElement("p",{className:"wd-shimmer"},"\u6B63\u5728\u63A5\u4E0A\u4F1A\u8BDD\u2026")):null,r&&L.length===0?q.default.createElement("div",{className:"wd-dock-intro"},q.default.createElement("h3",null,"\u8FD9\u91CC\u5C31\u662F DSH \u7684\u4F1A\u8BDD\u3002"),q.default.createElement("p",null,"\u4F60\u5728\u8FD9\u91CC\u8BF4\u7684\u6BCF\u4E00\u53E5\u90FD\u4F1A\u8FDB\u540C\u4E00\u6761\u4F1A\u8BDD\uFF0CAgent \u52A0\u65E5\u7A0B\u3001\u8BB0\u5F85\u529E\uFF0C\u5DE5\u4F5C\u53F0\u4E5F\u4F1A\u540C\u6B65\u663E\u793A\u3002")):null,L.map(I=>q.default.createElement("div",{key:I.id,className:`wd-msg is-${I.role==="user"?"user":"bot"}`},I.text?q.default.createElement("p",null,I.text):null,I.tools?.length?q.default.createElement("p",{className:"wd-msg-tool"},q.default.createElement(S,{name:"bolt",size:11}),I.tools.join(" \xB7 ")):null,I.role==="assistant"&&cn(I.text)?q.default.createElement("button",{type:"button",className:"wd-msg-action",onClick:()=>H(`\u628A\u4E0A\u9762\u8FD9\u6761\u5B89\u6392\u843D\u5230\u5DE5\u4F5C\u53F0\uFF1A${I.text.slice(0,300)}\u3002\u7528 work_desk_calendar \u6216 work_desk_task \u76F4\u63A5\u52A0\uFF0C\u4E0D\u7528\u518D\u95EE\u6211\u3002`)},q.default.createElement(S,{name:"plus",size:11}),"\u843D\u5230\u5DE5\u4F5C\u53F0"):null)),j?.running?q.default.createElement("div",{className:"wd-msg is-bot"},q.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u5904\u7406\u2026\u2026")):null),q.default.createElement("form",{className:"wd-composer",onSubmit:I=>{I.preventDefault(),B()}},q.default.createElement("textarea",{rows:1,"aria-label":"\u7ED9\u4F1A\u8BDD\u53D1\u6D88\u606F",value:d,placeholder:r?"\u8BF4\u4E00\u53E5\u8BDD\uFF0C\u8FDB\u7684\u662F DSH \u540C\u4E00\u6761\u4F1A\u8BDD":"\u6B63\u5728\u63A5\u4E0A\u4F1A\u8BDD\u2026",disabled:!r||N,onChange:I=>M(I.target.value),onKeyDown:I=>{I.key==="Enter"&&!I.shiftKey&&!I.nativeEvent.isComposing&&(I.preventDefault(),B())}}),q.default.createElement("button",{type:"submit",className:"wd-send","aria-label":"\u53D1\u9001",disabled:!d.trim()||!r||N},q.default.createElement(S,{name:"send",size:15}))))}var un=["\u4ECA\u5929\u6709\u51E0\u4E2A\u4F1A\uFF1F","\u660E\u5929\u4E0B\u5348\u4E09\u70B9\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248\uFF0C40 \u5206\u949F","\u8BB0\u4E00\u4E0B\uFF1A\u56DE\u5468\u821F\u7684\u6539\u7248\u610F\u89C1\uFF0C\u4ECA\u665A\u524D","\u8305\u53F0\u73B0\u5728\u591A\u5C11\uFF1F","\u5E2E\u6211\u5199\u5C01\u90AE\u4EF6\u7ED9\u738B\u5F3A\uFF0C\u8BF4\u7070\u5EA6\u540D\u5355\u5468\u4E8C\u4E0B\u73ED\u524D\u7ED9"];function fn({receipt:e}){return C.default.createElement("div",{className:"wd-receipt"},C.default.createElement("span",{className:"wd-receipt-check"},C.default.createElement(S,{name:"check",size:10,stroke:2.4})),C.default.createElement("span",null,e.text))}function wn({message:e,canUndo:t}){return e.role==="user"?C.default.createElement("div",{className:"wd-msg is-user"},e.text):C.default.createElement("div",{className:"wd-msg is-bot"},C.default.createElement("p",null,e.text),e.receipts?.map((n,a)=>C.default.createElement(fn,{key:a,receipt:n})),e.errors?.map((n,a)=>C.default.createElement("p",{key:a,className:"wd-msg-error"},n)),e.notice?C.default.createElement("p",{className:"wd-msg-note"},e.notice):null,C.default.createElement("footer",null,C.default.createElement("span",null,e.engine==="local"?"\u672C\u5730\u89C4\u5219":""),t?C.default.createElement("button",{type:"button",onClick:le},C.default.createElement(S,{name:"undo",size:11}),"\u64A4\u9500"):null))}function gn({head:e,suggestions:t,placeholder:n="\u60F3\u8BA9\u6211\u505A\u4EC0\u4E48\uFF0C\u76F4\u63A5\u8BF4",intro:a=!0}){let i=z(d=>d.state.chat??[]),o=z(d=>d.thinking),[r,l]=C.default.useState(""),f=C.default.useRef(null),w=C.default.useRef(null);C.default.useEffect(()=>{f.current&&f.current.scrollTo({top:f.current.scrollHeight,behavior:"smooth"})},[i.length,o]),C.default.useLayoutEffect(()=>{let d=w.current;d&&(d.style.height="auto",d.style.height=`${Math.min(d.scrollHeight,132)}px`)},[r]);let v=d=>{let M=String(d??r).trim();!M||o||(l(""),at(M))},c=[...i].reverse().find(d=>d.role==="assistant");return C.default.createElement("div",{className:"wd-chat"},C.default.createElement("header",{className:"wd-dock-head","data-window-drag":""},e),C.default.createElement("div",{className:"wd-dock-scroll",ref:f,"aria-live":"polite"},i.length===0&&a?C.default.createElement("div",{className:"wd-dock-intro"},C.default.createElement("h3",null,"\u8BF4\u4E00\u53E5\u8BDD\uFF0C",C.default.createElement("br",null),"\u65E5\u7A0B\u3001\u90AE\u4EF6\u548C\u6301\u4ED3\u6211\u4E00\u8D77\u6539\u3002"),C.default.createElement("p",null,"\u6BCF\u4E00\u6B65\u90FD\u80FD\u64A4\u9500\uFF1B\u53D1\u90AE\u4EF6\u53EA\u4F1A\u5199\u8349\u7A3F\uFF0C\u53D1\u4E0D\u53D1\u7531\u4F60\u70B9\u3002")):i.map(d=>C.default.createElement(wn,{key:d.id,message:d,canUndo:d===c&&d.undoable})),o?C.default.createElement("div",{className:"wd-msg is-bot"},C.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u5904\u7406\u2026\u2026")):null),t?.length?C.default.createElement("div",{className:"wd-suggest"},t.slice(0,i.length?2:4).map(d=>C.default.createElement("button",{type:"button",key:d,onClick:()=>v(d),disabled:o},d))):null,C.default.createElement("form",{className:"wd-composer",onSubmit:d=>{d.preventDefault(),v()}},C.default.createElement("textarea",{ref:w,rows:1,"aria-label":"\u7ED9\u52A9\u624B\u53D1\u6D88\u606F",value:r,placeholder:n,onChange:d=>l(d.target.value),onKeyDown:d=>{d.key==="Enter"&&!d.shiftKey&&!d.nativeEvent.isComposing&&(d.preventDefault(),v())}}),C.default.createElement("button",{type:"submit",className:"wd-send","aria-label":"\u53D1\u9001",disabled:!r.trim()||o},C.default.createElement(S,{name:"send",size:15}))))}function hn(){let e=z(a=>a.model),t=z(a=>a.modelOk),n=z(a=>a.modelError);return C.default.createElement(gn,{head:C.default.createElement(C.default.Fragment,null,C.default.createElement("h2",null,"\u52A9\u624B"),C.default.createElement("span",{className:`wd-engine ${e?t===!1?"is-down":"is-live":""}`,title:n||(e?`\u4F7F\u7528 ${e}`:"\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u6A21\u578B\uFF0C\u53EA\u80FD\u5904\u7406\u5E38\u89C1\u8BF4\u6CD5")},C.default.createElement("i",null),e??"\u672C\u5730\u89C4\u5219"),C.default.createElement("span",{style:{flex:1}}),C.default.createElement(U,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>b({settingsOpen:!0})}),C.default.createElement(U,{icon:"close",label:"\u6536\u8D77\u5BF9\u8BDD",onClick:()=>b({dockOpen:!1})})),suggestions:un,placeholder:"\u6BD4\u5982\uFF1A\u660E\u5929\u4E0B\u5348\u4E09\u70B9\u548C\u8BBE\u8BA1\u5BF9\u4E00\u4E0B\u6539\u7248"})}function gt({useSessions:e}){let t=ge()?.get?.("sessions");return!!t?.retain&&!!t?.list?C.default.createElement("aside",{className:"wd-dock","aria-label":"DSH \u4F1A\u8BDD"},C.default.createElement(wt,{useSessions:e,head:C.default.createElement(C.default.Fragment,null,C.default.createElement("h2",null,"\u4F1A\u8BDD"),C.default.createElement(U,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>b({settingsOpen:!0})}))})):C.default.createElement("aside",{className:"wd-dock","aria-label":"\u5BF9\u8BDD\u52A9\u624B"},C.default.createElement(hn,null))}var O=G(require("react"),1);var s=G(require("react"),1);var ce={s:1,m:2,l:5};function oe(e,t,n){return s.default.createElement("footer",{className:"fw-foot"},s.default.createElement("span",null,e),t?s.default.createElement("button",{type:"button",onClick:n},t," \u2197"):null)}function bn(e,t){let n=t.toDateString();return e.events.filter(a=>a.status!=="cancelled"&&new Date(a.start).toDateString()===n).sort((a,i)=>new Date(a.start)-new Date(i.start))}function ht(e,t){return e.events.filter(n=>n.status!=="cancelled"&&new Date(n.end??n.start)>t).sort((n,a)=>new Date(n.start)-new Date(a.start))[0]}function xn(e,t){let{state:n,now:a,size:i,openCalendar:o}=t,r=bn(n,a),l=ht(n,a),f=n.events.filter(w=>w.status!=="cancelled"&&new Date(w.start)>a&&new Date(w.start).toDateString()!==a.toDateString()).sort((w,v)=>new Date(w.start)-new Date(v.start)).slice(0,3);return i==="s"?s.default.createElement("button",{type:"button",className:"fw-link",onClick:o},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},a.getDate()),s.default.createElement("div",null,s.default.createElement("strong",null,r.length?`${r.length} \u573A\u4F1A\u8BAE`:"\u4ECA\u5929\u6CA1\u6709\u4F1A"),s.default.createElement("small",null,l?`\u4E0B\u4E00\u573A ${A(l.start)}`:"\u65E5\u5386\u7A7A\u7740")))):i==="m"?s.default.createElement("button",{type:"button",className:"fw-link",onClick:o},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},a.getDate()),s.default.createElement("div",null,s.default.createElement("strong",null,l?l.title:"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392"),s.default.createElement("small",null,l?`${A(l.start)} \xB7 ${J(l.start,a)}`:`${r.length} \u573A\u4F1A\u8BAE\u5DF2\u7ED3\u675F`)))):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-hero",style:{flex:"none",marginBottom:2}},s.default.createElement("span",{className:"fw-display"},a.getDate()),s.default.createElement("div",null,s.default.createElement("strong",null,l?l.title:"\u4ECA\u5929\u6CA1\u6709\u5B89\u6392"),s.default.createElement("small",null,l?`${A(l.start)} \xB7 ${J(l.start,a)}`:`\u5171 ${r.length} \u573A`))),s.default.createElement("hr",{className:"fw-rule"}),s.default.createElement("div",{className:"fw-list"},r.length===0?s.default.createElement("p",{className:"fw-empty"},"\u4ECA\u5929\u6CA1\u6709\u4F1A\u8BAE\u3002"):r.slice(0,4).map(w=>{let v=new Date(w.start)<=a&&new Date(w.end??w.start)>a,c=new Date(w.end??w.start)<=a;return s.default.createElement("div",{key:w.id,className:`fw-row ${v?"is-now":""} ${c?"is-muted":""}`},s.default.createElement("time",null,A(w.start)),s.default.createElement("span",{className:"fw-dot"}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,w.title),s.default.createElement("small",null,w.location||(v?"\u8FDB\u884C\u4E2D":""))))}),f.length?s.default.createElement("hr",{className:"fw-rule",style:{margin:"6px 0"}}):null,f.map(w=>s.default.createElement("div",{key:w.id,className:"fw-row"},s.default.createElement("time",null,Q(w.start,a)),s.default.createElement("span",{className:"fw-dot",style:{background:"transparent"}}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,w.title),s.default.createElement("small",null,A(w.start)))))),oe(`${r.length} \u573A \xB7 \u65E5\u5386`,"\u6253\u5F00",o))}function vn(e,t){let{state:n,size:a,toggleTask:i,openToday:o}=t,r=n.tasks.filter(f=>!f.done),l=r.slice().sort((f,w)=>(f.due?new Date(f.due):1/0)-(w.due?new Date(w.due):1/0))[0];return a==="s"?s.default.createElement("button",{type:"button",className:"fw-link",onClick:o},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},r.length),s.default.createElement("div",null,s.default.createElement("strong",null,"\u6761\u5F85\u529E"),s.default.createElement("small",null,l?l.due?`${Q(l.due)} ${A(l.due)}`:"\u6CA1\u6709\u622A\u6B62":"\u90FD\u505A\u5B8C\u4E86")))):a==="m"?s.default.createElement(s.default.Fragment,null,r.length===0?s.default.createElement("p",{className:"fw-empty"},"\u90FD\u505A\u5B8C\u4E86\u3002"):r.slice(0,ce.m).map(f=>s.default.createElement("div",{key:f.id,className:"fw-row"},s.default.createElement("button",{type:"button",className:"fw-check","aria-pressed":"false","aria-label":`\u5B8C\u6210 ${f.title}`,onClick:()=>i(f.id)}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,f.title)),s.default.createElement("span",{className:"fw-label"},f.due?Q(f.due):"")))):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-list"},r.length===0?s.default.createElement("p",{className:"fw-empty"},"\u90FD\u505A\u5B8C\u4E86\u3002"):r.slice(0,ce.l).map(f=>s.default.createElement("div",{key:f.id,className:"fw-row"},s.default.createElement("button",{type:"button",className:"fw-check","aria-pressed":"false","aria-label":`\u5B8C\u6210 ${f.title}`,onClick:()=>i(f.id)}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,f.title)),s.default.createElement("span",{className:"fw-label"},f.due?`${Q(f.due)}`:"\u65E0\u622A\u6B62")))),oe(`${r.length} \u6761\u672A\u5B8C\u6210`,"\u5168\u90E8",o))}function yn(e,t){let{state:n,size:a,openMail:i,mail:o}=t,r=n.mails.filter(v=>v.unread),l=n.mails.slice().sort((v,c)=>new Date(c.date)-new Date(v.date)),f=o?.provider==="dsh-email"?"\u672C\u5730\u672A\u67E5\u770B":"\u6536\u4EF6\u7BB1";if(a==="s")return s.default.createElement("button",{type:"button",className:"fw-link",onClick:()=>i(null)},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},r.length),s.default.createElement("div",null,s.default.createElement("strong",null,f),s.default.createElement("small",null,l[0]?l[0].from?.name||"\u65B0\u90AE\u4EF6":"\u6CA1\u6709\u90AE\u4EF6"))));let w=l.slice(0,a==="m"?ce.m:ce.l);return s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-list"},w.length===0?s.default.createElement("p",{className:"fw-empty"},"\u6536\u4EF6\u7BB1\u662F\u7A7A\u7684\u3002"):w.map(v=>s.default.createElement("button",{key:v.id,type:"button",className:"fw-row fw-row-btn",onClick:()=>i(v.id)},s.default.createElement("span",{className:"fw-dot",style:{background:v.unread?void 0:"transparent"}}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,v.subject||"\uFF08\u65E0\u4E3B\u9898\uFF09"),s.default.createElement("small",null,v.from?.name||v.from?.address||"\u672A\u77E5\u53D1\u4EF6\u4EBA")),s.default.createElement("span",{className:"fw-label"},Q(v.date))))),a==="l"?oe(`${r.length} \u5C01\u672C\u5730\u672A\u67E5\u770B \xB7 ${f}`,"\u6253\u5F00\u90AE\u4EF6",()=>i(null)):null)}function kn(e,t){let{state:n,quotes:a,size:i,openMarket:o}=t,r=n.watchlist.map(l=>({...l,quote:a[l.code]})).filter(l=>l.quote);if(i==="s"){let l=r[0];return l?s.default.createElement("button",{type:"button",className:"fw-link",onClick:o},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},l.quote.price),s.default.createElement("div",null,s.default.createElement("strong",null,l.quote.name||l.name||l.code),s.default.createElement("small",{className:Z(l.quote.changePct)},ae(l.quote.changePct))))):s.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009\u3002")}return s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-list"},r.length===0?s.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009\u3002"):r.slice(0,i==="m"?ce.m:ce.l).map(l=>s.default.createElement("div",{key:l.code,className:"fw-quote"},s.default.createElement("span",{className:"fw-quote-name"},l.quote.name||l.name||l.code),s.default.createElement("span",{className:"fw-num"},R(l.quote.price,2)),s.default.createElement("span",{className:`fw-pct ${Z(l.quote.changePct)}`},ae(l.quote.changePct))))),i==="l"?oe(`${r.length} \u53EA\u81EA\u9009 \xB7 \u793A\u610F\u884C\u60C5`,"\u884C\u60C5\u9875",o):null)}function Nn(e,t){let{state:n,size:a,openToday:i}=t,o=n.brief;if(!o)return s.default.createElement("p",{className:"fw-empty"},"\u8FD8\u6CA1\u6709\u6668\u62A5\u3002\u5230\u4ECA\u65E5\u9875\u751F\u6210\u4E00\u4EFD\uFF0C\u628A\u4ECA\u5929\u7684\u4F1A\u8BAE\u3001\u90AE\u4EF6\u548C\u884C\u60C5\u8BFB\u6210\u4E00\u6BB5\u8BDD\u3002");let r=String(o.text||"").split(`
`).filter(v=>v.trim()),l=r[0]?.replace(/^#+\s*/,"")||"\u4ECA\u5929\u5148\u505A\u4EC0\u4E48",f=r.slice(1).join(`
`)||r[0];return s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-brief",style:{"--fw-lines":a==="s"?2:a==="m"?3:8}},a==="l"?s.default.createElement("h3",null,l):null,s.default.createElement("p",{className:"fw-clamp"},a==="l"?f:r.join(" "))),a==="l"?oe(`${o.engine==="local"?"\u6A21\u677F\u62FC\u88C5":"\u6A21\u578B\u751F\u6210"} \xB7 ${A(o.createdAt)}`,"\u4ECA\u65E5\u9875",i):null,a==="s"?s.default.createElement("span",{className:"fw-label"},o.engine==="local"?"\u6A21\u677F":"\u751F\u6210"):null)}function zn(e,t){let{alerts:n,size:a,openToday:i}=t;return n?.length?a==="s"?s.default.createElement("button",{type:"button",className:"fw-link",onClick:i},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display"},n.length),s.default.createElement("div",null,s.default.createElement("strong",null,"\u6761\u63D0\u9192"),s.default.createElement("small",null,n[0].text.slice(0,6))))):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-list"},n.slice(0,a==="m"?ce.m:6).map((o,r)=>s.default.createElement("div",{key:r,className:"fw-row"},s.default.createElement("span",{className:"fw-dot",style:{background:o.level==="down"?"var(--fw-accent)":void 0}}),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,o.text))))),a==="l"?oe(`${n.length} \u6761 \xB7 \u6765\u81EA\u65E5\u7A0B\u4E0E\u884C\u60C5`,"\u4ECA\u65E5\u9875",i):null):s.default.createElement("p",{className:"fw-empty"},"\u6CA1\u6709\u9700\u8981\u63D0\u9192\u7684\u4E8B\u3002")}function Sn(e,t){let{now:n,size:a}=t,i=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`,o=["\u5468\u65E5","\u5468\u4E00","\u5468\u4E8C","\u5468\u4E09","\u5468\u56DB","\u5468\u4E94","\u5468\u516D"][n.getDay()],r=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(n.getFullYear(),0,1))/864e5)+1,l=Math.round((n.getHours()*60+n.getMinutes())/1440*100);return a==="s"?s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display",style:{fontSize:30}},i)):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-hero",style:{flex:"none"}},s.default.createElement("span",{className:"fw-display"},i),s.default.createElement("div",null,s.default.createElement("strong",null,`${n.getMonth()+1} \u6708 ${n.getDate()} \u65E5`),s.default.createElement("small",null,o))),a==="l"?s.default.createElement(s.default.Fragment,null,s.default.createElement("hr",{className:"fw-rule"}),s.default.createElement("div",{className:"fw-label"},"\u7B2C ",r," \u5929 \xB7 \u4ECA\u5929\u5DF2\u8FC7 ",l,"%"),s.default.createElement("div",{className:"fw-track","aria-hidden":"true"},s.default.createElement("i",{style:{width:`${l}%`}}))):null)}function Dn(e,t){let{state:n,now:a,size:i,openCalendar:o}=t,r=ht(n,a);return r?i==="s"?s.default.createElement("button",{type:"button",className:"fw-link",onClick:o},s.default.createElement("div",{className:"fw-hero"},s.default.createElement("span",{className:"fw-display",style:{fontSize:26}},A(r.start)))):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-hero",style:{flex:"none"}},s.default.createElement("span",{className:"fw-display",style:{fontSize:28}},A(r.start)),s.default.createElement("div",null,s.default.createElement("strong",null,r.title),s.default.createElement("small",null,J(r.start,a),r.location?` \xB7 ${r.location}`:""))),i==="l"?s.default.createElement(s.default.Fragment,null,s.default.createElement("hr",{className:"fw-rule"}),s.default.createElement("div",{className:"fw-list"},n.events.filter(l=>l.status!=="cancelled"&&new Date(l.start)>new Date(r.start)).sort((l,f)=>new Date(l.start)-new Date(f.start)).slice(0,3).map(l=>s.default.createElement("div",{key:l.id,className:"fw-row"},s.default.createElement("time",null,Q(l.start,a)),s.default.createElement("div",{className:"fw-row-main"},s.default.createElement("b",null,l.title),s.default.createElement("small",null,A(l.start))))))):null,i==="l"?oe("\u63A5\u4E0B\u6765\u7684\u5B89\u6392","\u65E5\u5386",o):null):s.default.createElement("p",{className:"fw-empty"},"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392\u3002")}function Mn(e,t){let{size:n,openToday:a,openCalendar:i,openMail:o,openMarket:r}=t,l=[["\u4ECA\u65E5",a],["\u65E5\u7A0B",i],["\u90AE\u4EF6",o],["\u884C\u60C5",r]];return n==="s"?s.default.createElement("div",{className:"fw-list",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,alignContent:"center"}},l.map(([f,w])=>s.default.createElement("button",{key:f,type:"button",className:"fw-btn",style:{height:26,padding:0,fontSize:10.5},onClick:()=>w(null)},f))):s.default.createElement(s.default.Fragment,null,s.default.createElement("div",{className:"fw-list",style:{justifyContent:"center",gap:6}},l.map(([f,w])=>s.default.createElement("button",{key:f,type:"button",className:"fw-btn",style:{textAlign:"left"},onClick:()=>w(null)},f," \u2197"))),n==="l"?oe("\u56DB\u4E2A\u9875\u9762\u4ECD\u5728\uFF0C\u5DE5\u4F5C\u53F0\u662F\u65B0\u7684\u5165\u53E3","",null):null)}var Cn={calendar:xn,tasks:vn,mail:yn,quotes:kn,brief:Nn,alerts:zn,clock:Sn,next:Dn,quick:Mn};function bt(e,t){let n=Cn[e.type];return n?n(e,{...t,size:e.size}):s.default.createElement("p",{className:"fw-empty"},"\u672A\u77E5\u7EC4\u4EF6\uFF1A",e.type)}var we={s:{w:1,h:1,label:"\u5C0F"},m:{w:2,h:1,label:"\u4E2D"},l:{w:4,h:3,label:"\u5927"}},Te={calendar:{label:"\u65E5\u5386",hint:"\u65E5\u671F\u3001\u4E0B\u4E00\u573A\u3001\u5F53\u65E5\u8BAE\u7A0B"},next:{label:"\u4E0B\u4E00\u4EF6\u4E8B",hint:"\u65F6\u95F4\u3001\u6807\u9898\u3001\u63A5\u4E0B\u6765\u7684\u5B89\u6392"},tasks:{label:"\u5F85\u529E",hint:"\u8BA1\u6570\u3001\u4E24\u6761\u9884\u89C8\u3001\u5B8C\u6574\u6E05\u5355"},mail:{label:"\u90AE\u4EF6",hint:"\u672A\u67E5\u770B\u6570\u3001\u6700\u8FD1\u4E24\u5C01\u3001\u5217\u8868"},quotes:{label:"\u884C\u60C5",hint:"\u5355\u53EA\u3001\u4E24\u53EA\u3001\u81EA\u9009\u8868"},brief:{label:"\u4ECA\u5929\u5148\u505A\u4EC0\u4E48",hint:"\u4E00\u53E5\u3001\u6458\u8981\u3001\u5168\u6587"},clock:{label:"\u65F6\u949F",hint:"\u65F6\u95F4\u3001\u65E5\u671F\u3001\u4ECA\u5929\u5DF2\u8FC7\u591A\u5C11"},alerts:{label:"\u63D0\u9192",hint:"\u6761\u6570\u3001\u524D\u4E24\u6761\u3001\u5168\u90E8"},quick:{label:"\u5FEB\u6377\u5165\u53E3",hint:"\u4ECA\u65E5\u3001\u65E5\u7A0B\u3001\u90AE\u4EF6\u3001\u884C\u60C5"}},$n=24,xt="wd-fw-layout-v1";function vt(e="fw"){let t=Math.random().toString(36).slice(2,8);return`${e}-${Date.now().toString(36)}-${t}`}function Ye(){return{theme:"instrument",atoms:[{id:"fw-cal",type:"calendar",size:"l"},{id:"fw-next",type:"next",size:"m"},{id:"fw-tasks",type:"tasks",size:"m"},{id:"fw-mail",type:"mail",size:"m"},{id:"fw-quotes",type:"quotes",size:"m"},{id:"fw-brief",type:"brief",size:"m"},{id:"fw-clock",type:"clock",size:"m"},{id:"fw-alerts",type:"alerts",size:"s"},{id:"fw-quick",type:"quick",size:"s"}]}}var qn=["instrument","paper","type"];function yt(){try{let e=JSON.parse(localStorage.getItem(xt)||"null");return Nt(e)??Ye()}catch{return Ye()}}function kt(e){try{return localStorage.setItem(xt,JSON.stringify(e)),!0}catch{return!1}}function Nt(e){if(!e||typeof e!="object")return null;let t=qn.includes(e.theme)?e.theme:"instrument",n=Array.isArray(e.atoms)?e.atoms:[],a=new Set,i=[];for(let o of n.slice(0,$n))!o||typeof o!="object"||typeof o.id!="string"||a.has(o.id)||Te[o.type]&&we[o.size]&&(a.add(o.id),i.push({id:o.id,type:o.type,size:o.size}));return i.length?{theme:t,atoms:i}:null}function zt(e){return e.reduce((t,n)=>t+we[n.size].w*we[n.size].h,0)}var En=[{id:"instrument",label:"\u91CF\u88AB\u753B\u51FA\u6765"},{id:"paper",label:"\u4E66\u684C\u4E0A\u7684\u7EB8"},{id:"type",label:"\u73BB\u7483\u4E0A\u7684\u5B57"}];function St(){let e=z(k=>k.state),t=z(k=>k.quotes),n=z(k=>k.alerts),a=z(k=>k.mail),[i,o]=O.default.useState(()=>yt()),[r,l]=O.default.useState(!1),[f,w]=O.default.useState(!1),v=O.default.useRef(null),[c,d]=O.default.useState(null),[M,N]=O.default.useState(()=>new Date);O.default.useEffect(()=>{let k=setInterval(()=>N(new Date),3e4);return()=>clearInterval(k)},[]),O.default.useEffect(()=>{kt(i)},[i]);let x=k=>o(L=>{let j={...L,atoms:L.atoms.map(H=>({...H}))};return k(j),j}),g={state:e??{events:[],tasks:[],mails:[],watchlist:[],brief:null},quotes:t,alerts:n,mail:a,now:M,openCalendar:()=>b({view:"calendar"}),openToday:()=>b({view:"today"}),openMarket:()=>b({view:"market"}),openMail:k=>{k?de(k):b({view:"mail"})},toggleTask:k=>{P([{op:"toggle_task",id:k}],{label:"\u5B8C\u6210\u5F85\u529E"})}},$=(k,L)=>{k==null||L==null||k===L||x(j=>{let[H]=j.atoms.splice(k,1);j.atoms.splice(L,0,H)})},_=k=>{if(i.atoms.length>=24){Y("\u6700\u591A 24 \u4E2A\u7EC4\u4EF6\u4F4D",{error:!0});return}x(L=>{L.atoms.push({id:vt(),type:k,size:"m"})}),w(!1)};return O.default.createElement("div",{className:"wd-page wd-bench-page"},O.default.createElement("div",{className:"wd-fw","data-fw-theme":i.theme},O.default.createElement("header",{className:"fw-bar"},O.default.createElement("div",null,O.default.createElement("h1",null,"\u5DE5\u4F5C\u53F0")),O.default.createElement("span",{className:"fw-sub"},"8 \u5217 \xB7 \u5C0F 1\xD71 / \u4E2D 2\xD71 / \u5927 4\xD73 \xB7 ",i.atoms.length," \u4E2A\u7EC4\u4EF6"),O.default.createElement("span",{className:"fw-grow"}),O.default.createElement("div",{className:"fw-seg",role:"group","aria-label":"\u5916\u89C2\u4E3B\u9898"},En.map(k=>O.default.createElement("button",{key:k.id,type:"button","aria-pressed":i.theme===k.id,onClick:()=>x(L=>{L.theme=k.id})},k.label))),O.default.createElement("button",{type:"button",className:"fw-btn",onClick:()=>w(k=>!k),"aria-expanded":f},"\uFF0B \u6DFB\u52A0\u7EC4\u4EF6"),O.default.createElement("button",{type:"button",className:`fw-btn ${r?"is-on":""}`,onClick:()=>l(k=>!k)},r?"\u2713 \u5B8C\u6210\u7F16\u8F91":"\u7F16\u8F91\u5E03\u5C40")),f?O.default.createElement("div",{className:"fw-seg",style:{alignSelf:"flex-start"}},Object.entries(Te).map(([k,L])=>O.default.createElement("button",{key:k,type:"button",onClick:()=>_(k),title:L.hint},L.label))):null,r?O.default.createElement("p",{className:"fw-hint"},"\u62D6\u52A8\u5361\u7247\u6362\u4F4D\u7F6E\uFF1B\u6BCF\u5F20\u5361\u53F3\u4E0A\u89D2\u53EF\u5207 \u5C0F\uFF0F\u4E2D\uFF0F\u5927 \u6216\u79FB\u9664\u3002\u5E03\u5C40\u53EA\u5B58\u5728\u8FD9\u53F0\u673A\u5668\u7684\u6D4F\u89C8\u5668\u91CC\u3002"):null,O.default.createElement("div",{className:"fw-grid","aria-label":"\u5DE5\u4F5C\u53F0\u7EC4\u4EF6\u7F51\u683C"},i.atoms.map((k,L)=>O.default.createElement("div",{key:k.id,className:["fw-slot",`is-${k.size}`,r?"is-editing":"",c===L&&v.current!==L?"is-drop":"",v.current===L?"is-dragging":""].filter(Boolean).join(" "),draggable:r,onDragStart:()=>{v.current=L},onDragOver:j=>{r&&(j.preventDefault(),d(L))},onDragLeave:()=>d(j=>j===L?null:j),onDrop:j=>{r&&(j.preventDefault(),$(v.current,L),v.current=null,d(null))},onDragEnd:()=>{v.current=null,d(null)}},O.default.createElement("article",{className:"fw-card"},O.default.createElement("header",{className:"fw-head"},O.default.createElement("h2",null,Te[k.type].label),O.default.createElement("span",{className:"fw-meta"},we[k.size].label)),O.default.createElement("div",{className:"fw-body"},e?bt(k,g):O.default.createElement("p",{className:"fw-empty"},"\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u53F0\u2026"))),r?O.default.createElement("div",{className:"fw-edit"},O.default.createElement("button",{type:"button",className:"fw-drag","aria-label":"\u62D6\u52A8\u6392\u5E8F",title:"\u6309\u4F4F\u62D6\u52A8"},"\u283F"),Object.entries(we).map(([j,H])=>O.default.createElement("button",{key:j,type:"button","aria-pressed":k.size===j,onClick:()=>x(B=>{B.atoms[L].size=j})},H.label)),O.default.createElement("button",{type:"button","aria-label":"\u79FB\u9664\u7EC4\u4EF6",onClick:()=>x(j=>{j.atoms.splice(L,1)})},"\xD7")):null))),O.default.createElement("p",{className:"fw-hint"},"\u5360\u7528 ",zt(i.atoms)," \u683C \xB7 \u5E03\u5C40\u6682\u5B58\u672C\u673A\u6D4F\u89C8\u5668\uFF08Host \u6743\u5A01\u5B58\u50A8\u4E0E Agent \u7F16\u6392\u5728\u540E\u7EED\u6B65\u9AA4\u63A5\u5165\uFF09")))}var Dt=`/* \u5DE5\u4F5C\u53F0\uFF08\u539F\u5B50\u684C\u9762\uFF09\u6837\u5F0F\u3002
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
.fw-link { border: 0; background: none; color: inherit; font: inherit; text-align: left; padding: 0; cursor: pointer; display: contents; }

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
  .fw-edit button { height: 30px; min-width: 30px; }
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
`;var D=G(require("react"),1);function Mt(e,t){return Math.max(0,Math.round((new Date(e)-t)/6e4))}function Ct(){let e=z(d=>d.state),t=z(d=>d.quotes),[n,a]=D.default.useState(!1);if(!e)return null;let i=new Date,o=e.events.filter(d=>d.status!=="cancelled"&&new Date(d.end??d.start)>i).sort((d,M)=>new Date(d.start)-new Date(M.start)),r=o[0]??null,l=e.tasks.filter(d=>!d.done),f=e.mails.filter(d=>d.unread),w=e.watchlist.map(d=>({...d,quote:t[d.code]})).filter(d=>d.quote),v=w[0]??null,c=[r?{key:"next",icon:"clock",text:`${A(r.start)} ${r.title}`,hint:Mt(r.start,i)>0?`${J(r.start,i)}`:"\u8FDB\u884C\u4E2D"}:null,l.length?{key:"task",icon:"check",text:`${l.length} \u6761\u5F85\u529E`,hint:l[0].title}:null,f.length?{key:"mail",icon:"mail",text:`${f.length} \u5C01\u672A\u8BFB`,hint:f[0].subject}:null,v?{key:"quote",icon:"chart",text:`${v.quote.name} ${v.quote.price}`,hint:`${v.quote.changePct>=0?"+":""}${Number(v.quote.changePct).toFixed(2)}%`}:null].filter(Boolean);return D.default.createElement("div",{className:`wd-island ${n?"is-open":""}`,"aria-label":"\u7075\u52A8\u5C9B"},D.default.createElement("div",{className:"wd-island-pill"},D.default.createElement("span",{className:"wd-island-live","aria-hidden":"true"}),c.slice(0,2).map(d=>D.default.createElement("span",{key:d.key,className:"wd-island-item"},D.default.createElement(S,{name:d.icon,size:12}),D.default.createElement("b",null,d.text),D.default.createElement("small",null,d.hint))),D.default.createElement("button",{type:"button",className:"wd-island-toggle",onClick:()=>a(d=>!d),"aria-expanded":n},D.default.createElement(S,{name:n?"chevU":"chevD",size:13}),n?"\u6536\u8D77":"\u5C55\u5F00")),n?D.default.createElement("div",{className:"wd-island-grid"},D.default.createElement("section",{className:"wd-island-atom is-2x2"},D.default.createElement("header",null,D.default.createElement("h3",null,"\u4E0B\u4E00\u4EF6"),D.default.createElement("span",null,o.length," \u4E2A\u4F1A")),D.default.createElement("ul",null,o.slice(0,3).map(d=>D.default.createElement("li",{key:d.id},D.default.createElement("b",null,A(d.start)),D.default.createElement("span",null,d.title),D.default.createElement("small",null,Mt(d.start,i)>0?J(d.start,i):"\u8FDB\u884C\u4E2D"))),o.length===0?D.default.createElement("li",{className:"is-empty"},"\u63A5\u4E0B\u6765\u6CA1\u6709\u5B89\u6392"):null)),D.default.createElement("section",{className:"wd-island-atom is-2x2"},D.default.createElement("header",null,D.default.createElement("h3",null,"\u5F85\u529E"),D.default.createElement("span",null,l.length," \u6761")),D.default.createElement("ul",null,l.slice(0,3).map(d=>D.default.createElement("li",{key:d.id},D.default.createElement("b",null,d.title),D.default.createElement("small",null,d.due?A(d.due):"\u65E0\u622A\u6B62"))),l.length===0?D.default.createElement("li",{className:"is-empty"},"\u90FD\u505A\u5B8C\u4E86"):null),D.default.createElement("button",{type:"button",className:"wd-island-link",onClick:()=>b({view:"today"})},"\u6253\u5F00\u4ECA\u65E5",D.default.createElement(S,{name:"arrow",size:11}))),D.default.createElement("section",{className:"wd-island-atom is-2x2"},D.default.createElement("header",null,D.default.createElement("h3",null,"\u672A\u8BFB"),D.default.createElement("span",null,f.length," \u5C01")),D.default.createElement("ul",null,f.slice(0,3).map(d=>D.default.createElement("li",{key:d.id},D.default.createElement("b",null,d.from?.name||d.from?.address),D.default.createElement("span",null,d.subject))),f.length===0?D.default.createElement("li",{className:"is-empty"},"\u6CA1\u6709\u672A\u8BFB"):null),D.default.createElement("button",{type:"button",className:"wd-island-link",onClick:()=>b({view:"mail"})},"\u53BB\u90AE\u4EF6",D.default.createElement(S,{name:"arrow",size:11}))),D.default.createElement("section",{className:"wd-island-atom is-2x2"},D.default.createElement("header",null,D.default.createElement("h3",null,"\u81EA\u9009"),D.default.createElement("span",null,w.length," \u53EA")),D.default.createElement("ul",{className:"is-quotes"},w.slice(0,4).map(d=>D.default.createElement("li",{key:d.code},D.default.createElement("b",null,d.quote.name),D.default.createElement("span",{className:d.quote.changePct>=0?"is-up":"is-down"},R(d.quote.price,2)),D.default.createElement("small",{className:d.quote.changePct>=0?"is-up":"is-down"},d.quote.changePct>=0?"+":"",Number(d.quote.changePct).toFixed(2),"%"))),w.length===0?D.default.createElement("li",{className:"is-empty"},"\u8FD8\u6CA1\u6709\u81EA\u9009"):null))):null)}var m=G(require("react"),1);function Tn({value:e,onChange:t,counts:n}){let a=[{value:"all",label:`\u5168\u90E8 ${n.all}`},{value:"unread",label:`\u672A\u8BFB ${n.unread}`},{value:"starred",label:`\u661F\u6807 ${n.starred}`},{value:"drafts",label:`\u8349\u7A3F ${n.drafts}`}];return m.default.createElement("div",{className:"wd-mail-filters",role:"tablist","aria-label":"\u90AE\u4EF6\u7B5B\u9009"},a.map(i=>m.default.createElement("button",{key:i.value,type:"button",role:"tab","aria-selected":e===i.value,className:e===i.value?"is-on":"",onClick:()=>t(i.value)},i.label)))}function On({mail:e,active:t,onClick:n}){return m.default.createElement("button",{type:"button",className:`wd-mail-row ${e.unread?"is-unread":""} ${t?"is-active":""}`,onClick:n},m.default.createElement("span",{className:`wd-mail-dot ${e.unread?"is-unread":""}`,"aria-hidden":"true"}),m.default.createElement("span",{className:"wd-mail-row-main"},m.default.createElement("span",{className:"wd-mail-row-top"},m.default.createElement("b",null,e.from?.name||e.from?.address||"\u6211"),m.default.createElement("time",null,lt(e.date))),m.default.createElement("span",{className:"wd-mail-row-subject"},e.starred?m.default.createElement(S,{name:"star",size:11,fill:!0}):null,e.hasAttachments?m.default.createElement(S,{name:"paperclip",size:11}):null,e.subject),m.default.createElement("span",{className:"wd-mail-row-snippet"},e.snippet||"\uFF08\u65E0\u6B63\u6587\u9884\u89C8\uFF09")))}function Ln(e){let t=new Date(Date.now()+18e5);t.setSeconds(0,0),b({dialog:{title:"\u628A\u90AE\u4EF6\u53D8\u6210\u65E5\u7A0B",submitLabel:"\u52A0\u5230\u65E5\u5386",initial:{title:e.subject,start:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}T${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,minutes:30,location:""},fields:[{name:"title",label:"\u4E3B\u9898",required:!0},{name:"start",label:"\u5F00\u59CB",type:"datetime-local",required:!0},{name:"minutes",label:"\u65F6\u957F\uFF08\u5206\u949F\uFF09",type:"number"},{name:"location",label:"\u5730\u70B9"}],onSubmit:n=>{let a=new Date(n.start);P([{op:"add_event",title:n.title,start:a.toISOString(),end:new Date(a.getTime()+Math.max(5,Number(n.minutes)||30)*6e4).toISOString(),location:n.location??"",notes:e.snippet??"",mailId:e.id,source:"mail"}],{label:"\u4ECE\u90AE\u4EF6\u65B0\u5EFA\u65E5\u7A0B"})}}})}function An({mail:e}){if(!e)return m.default.createElement(ne,{title:"\u9009\u4E00\u5C01\u90AE\u4EF6",hint:"\u5DE6\u8FB9\u5217\u8868\u91CC\u70B9\u4E00\u5C01\uFF0C\u8FD9\u91CC\u663E\u793A\u6B63\u6587\u3002\u90AE\u4EF6\u6B63\u6587\u6309\u7EAF\u6587\u672C\u6E32\u67D3\uFF0C\u4E0D\u52A0\u8F7D\u8FDC\u7A0B\u56FE\u7247\u3002"});let t=e.from??{};return m.default.createElement("article",{className:"wd-reader"},m.default.createElement("header",{className:"wd-reader-head"},m.default.createElement("h2",null,e.subject),m.default.createElement("div",{className:"wd-reader-meta"},m.default.createElement("span",null,m.default.createElement("b",null,t.name||t.address)," ",t.name?`<${t.address}>`:""),m.default.createElement("span",null,Pe(e.date)),e.folder?m.default.createElement("span",{className:"wd-muted"},e.folder):null),m.default.createElement("div",{className:"wd-reader-actions"},m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Me({to:t.address??"",subject:/^re:/i.test(e.subject)?e.subject:`Re: ${e.subject}`,text:"",replyToId:e.id})},m.default.createElement(S,{name:"reply",size:13}),"\u56DE\u590D"),m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Le(e.id,e.starred?"unstar":"star")},m.default.createElement(S,{name:"star",size:13,fill:e.starred}),e.starred?"\u53D6\u6D88\u661F\u6807":"\u661F\u6807"),m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Le(e.id,e.unread?"read":"unread")},m.default.createElement(S,{name:"eye",size:13}),e.unread?"\u6807\u4E3A\u5DF2\u8BFB":"\u6807\u4E3A\u672A\u8BFB"),m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Ln(e)},m.default.createElement(S,{name:"calendar",size:13}),"\u8F6C\u65E5\u7A0B"),m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>ke({title:`\u56DE\u590D\uFF1A${e.subject.slice(0,30)}`,mailId:e.id})},m.default.createElement(S,{name:"check",size:13}),"\u8F6C\u5F85\u529E"))),e.attachments?.length?m.default.createElement("ul",{className:"wd-reader-files"},e.attachments.map((n,a)=>m.default.createElement("li",{key:a},m.default.createElement(S,{name:"paperclip",size:12}),n.filename,m.default.createElement("small",null,Math.round((n.size??0)/1024)," KB")))):null,m.default.createElement("pre",{className:"wd-reader-body"},e.body||e.snippet||"\uFF08\u8FD9\u5C01\u90AE\u4EF6\u6CA1\u6709\u6B63\u6587\uFF09"))}function jn(){let e=z(c=>c.composer),t=z(c=>c.confirmSend),n=z(c=>c.sending),a=z(c=>c.settings),[i,o]=m.default.useState(e??{});if(m.default.useEffect(()=>o(e??{}),[e]),!e)return null;let r=(c,d)=>o(M=>({...M,[c]:d})),f=(a?.mail?.provider??"demo")==="dsh-email",w=f||!!a?.mail?.smtp?.host,v=async()=>{let c={to:i.to,cc:i.cc??"",subject:i.subject,text:i.text,replyToId:i.replyToId??null};(i.id?await P([{op:"update_draft",id:i.id,...c}],{label:"\u4FDD\u5B58\u8349\u7A3F"}):await P([{op:"add_draft",...c}],{label:"\u4FDD\u5B58\u8349\u7A3F"}))&&Ce()};return m.default.createElement(he,{title:i.replyToId?"\u56DE\u590D":"\u5199\u90AE\u4EF6",onClose:Ce,width:620},m.default.createElement("div",{className:"wd-form"},m.default.createElement("label",{className:"wd-field"},m.default.createElement("span",null,"\u6536\u4EF6\u4EBA"),m.default.createElement("input",{value:i.to??"",onChange:c=>r("to",c.target.value),placeholder:"name@company.com"})),m.default.createElement("label",{className:"wd-field"},m.default.createElement("span",null,"\u6284\u9001"),m.default.createElement("input",{value:i.cc??"",onChange:c=>r("cc",c.target.value),placeholder:"\u53EF\u7559\u7A7A"})),m.default.createElement("label",{className:"wd-field"},m.default.createElement("span",null,"\u4E3B\u9898"),m.default.createElement("input",{value:i.subject??"",onChange:c=>r("subject",c.target.value)})),m.default.createElement("label",{className:"wd-field"},m.default.createElement("span",null,"\u6B63\u6587"),m.default.createElement("textarea",{rows:10,value:i.text??"",onChange:c=>r("text",c.target.value),placeholder:"\u5199\u6E05\u695A\u8981\u5BF9\u65B9\u505A\u4EC0\u4E48\u3001\u4EC0\u4E48\u65F6\u5019\u8981\u3002"})),m.default.createElement("div",{className:"wd-form-foot"},f?null:m.default.createElement("button",{type:"button",className:"wd-btn",onClick:v},"\u5B58\u8349\u7A3F"),m.default.createElement("span",{style:{flex:1}}),m.default.createElement("button",{type:"button",className:"wd-btn",onClick:Ce},"\u53D6\u6D88"),m.default.createElement("button",{type:"button",className:"wd-btn is-primary",disabled:n||!i.to||!i.subject,onClick:()=>b({confirmSend:!0})},f?"\u5B58\u4E3A\u8349\u7A3F":w?"\u53D1\u9001":"\u53D1\u9001\uFF08\u672A\u914D\u7F6E SMTP\uFF09")),t?m.default.createElement("div",{className:"wd-confirm"},f?m.default.createElement("p",null,"\u786E\u8BA4\u628A\u8FD9\u5C01\u653E\u8FDB DSH \u90AE\u4EF6\u63D2\u4EF6\u7684\u8349\u7A3F\u7BB1\uFF1F",m.default.createElement("b",null,"\u5B83\u4E0D\u4F1A\u76F4\u63A5\u53D1\u51FA\u53BB"),"\uFF0C\u8981\u4F60\u5728 \u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u8349\u7A3F \u91CC\u9884\u89C8\u540E\u518D\u786E\u8BA4\u3002"):m.default.createElement("p",null,"\u786E\u8BA4\u53D1\u7ED9 ",m.default.createElement("b",null,i.to),"\uFF1F\u53D1\u51FA\u540E\u4E0D\u53EF\u64A4\u56DE\u3002"),m.default.createElement("div",null,m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>b({confirmSend:!1})},"\u518D\u770B\u770B"),m.default.createElement("button",{type:"button",className:"wd-btn is-small is-primary",disabled:n,onClick:et},n?"\u5904\u7406\u4E2D\u2026":f?"\u5199\u5165\u8349\u7A3F":"\u786E\u8BA4\u53D1\u9001"))):null,!w&&!f?m.default.createElement("p",{className:"wd-muted wd-composer-hint"},"\u8FD8\u6CA1\u6709\u914D\u7F6E SMTP\uFF0C\u53D1\u4E0D\u51FA\u53BB\u3002\u5148\u5B58\u8349\u7A3F\uFF0C\u6216\u8005\u5230\u8BBE\u7F6E\u91CC\u586B\u53D1\u4FE1\u670D\u52A1\u5668\u3002"):null,f?m.default.createElement("p",{className:"wd-muted wd-composer-hint"},"\u53D1\u9001\u7531 DSH \u90AE\u4EF6\u63D2\u4EF6\u8D1F\u8D23\uFF0C\u5DE5\u4F5C\u53F0\u53EA\u5199\u8349\u7A3F\uFF0C\u4E0D\u78B0\u4F60\u7684\u6388\u6743\u7801\u3002"):null))}function Pn(){let e=z(t=>t.mail);return m.default.createElement("div",{className:"wd-connect"},m.default.createElement("h2",null,"\u5148\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1"),m.default.createElement("p",null,"\u5DE5\u4F5C\u53F0\u4E0D\u653E\u793A\u4F8B\u90AE\u4EF6\u3002",e.pluginAvailable?"\u68C0\u6D4B\u5230\u4F60\u88C5\u4E86 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u76F4\u63A5\u7528\u5B83\u6700\u7701\u4E8B\uFF1A":"\u4E24\u79CD\u63A5\u6CD5\uFF0C\u4EFB\u9009\u4E00\u79CD\uFF1A"),m.default.createElement("div",{className:"wd-connect-opts"},e.pluginAvailable?m.default.createElement("button",{type:"button",className:"wd-connect-opt",onClick:async()=>{await $e({mail:{provider:"dsh-email"}}),(await De())?.ok||b({settingsOpen:!0})}},m.default.createElement("b",null,"\u4E00\u952E\u63A5\u5165 DSH \u90AE\u4EF6\u63D2\u4EF6",e.account?`\uFF08${e.account}\uFF09`:""),m.default.createElement("span",null,"\u8D26\u53F7\u3001\u6388\u6743\u7801\u3001\u540C\u6B65\u90FD\u5728 dsh-email \u91CC\uFF1B\u5DE5\u4F5C\u53F0\u53EA\u8BFB\u5B83\u3001\u5199\u8349\u7A3F\uFF0C\u53D1\u9001\u7559\u5728\u5B83\u7684\u8349\u7A3F\u7BB1\u786E\u8BA4\u3002")):null,m.default.createElement("button",{type:"button",className:"wd-connect-opt",onClick:()=>b({settingsOpen:!0})},m.default.createElement("b",null,e.pluginAvailable?"\u6539\u7528\u81EA\u5DF1\u586B\u7684 IMAP / SMTP":"\u586B IMAP / SMTP"),m.default.createElement("span",null,"QQ / 163 \u7528\u6388\u6743\u7801\uFF0CGmail \u7528\u5E94\u7528\u4E13\u7528\u5BC6\u7801\uFF1B\u586B\u5B8C\u70B9\u300C\u6D4B\u8BD5\u8FDE\u63A5\u300D\u3002"))),m.default.createElement("p",{className:"wd-muted"},"\u8DEF\u5F84\uFF1A\u8BBE\u7F6E \u2192 \u90AE\u4EF6 \u2192 \u90AE\u4EF6\u6765\u6E90\u3002\u63A5\u597D\u540E\u56DE\u5230\u8FD9\u91CC\u70B9\u300C\u540C\u6B65\u300D\u3002"))}function $t(){let e=z(c=>c.state),t=z(c=>c.mailFilter),n=z(c=>c.mailQuery),a=z(c=>c.focusMailId),i=z(c=>c.mail),o=e.drafts??[],r={all:e.mails.length,unread:e.mails.filter(c=>c.unread).length,starred:e.mails.filter(c=>c.starred).length,drafts:o.length},l=m.default.useMemo(()=>{let c=n.trim().toLowerCase();return e.mails.filter(d=>t==="unread"&&!d.unread||t==="starred"&&!d.starred||t==="drafts"?!1:c?[d.subject,d.snippet,d.from?.name,d.from?.address].some(M=>String(M??"").toLowerCase().includes(c)):!0)},[e.mails,t,n]),f=e.mails.find(c=>c.id===a)??null,w=t==="drafts"?o.find(c=>c.id===a):null,v=e.mails.length===0;return m.default.createElement("div",{className:"wd-page wd-mail-page"},m.default.createElement("aside",{className:"wd-mail-side"},m.default.createElement("button",{type:"button",className:"wd-btn is-primary is-wide",onClick:()=>Me({to:"",cc:"",subject:"",text:""})},m.default.createElement(S,{name:"edit",size:14}),"\u5199\u90AE\u4EF6"),m.default.createElement(Tn,{value:t,onChange:c=>b({mailFilter:c}),counts:r}),m.default.createElement("div",{className:"wd-mail-account"},i.provider==="demo"&&i.pluginAvailable?m.default.createElement("p",{className:"wd-mail-hint"},"\u68C0\u6D4B\u5230 DSH \u90AE\u4EF6\u63D2\u4EF6\uFF0C\u53EF\u4EE5\u76F4\u63A5\u590D\u7528\u5B83\u7684\u8D26\u53F7\u3002",m.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>b({settingsOpen:!0})},"\u53BB\u63A5\u5165")):null,m.default.createElement("p",null,i.provider==="dsh-email"?`DSH \u90AE\u4EF6${i.account?` \xB7 ${i.account}`:""}`:i.provider==="imap"?i.address||"IMAP":"\u672A\u63A5\u5165\u90AE\u7BB1"),m.default.createElement("small",null,i.provider==="dsh-email"&&!i.pluginAvailable?"\u6CA1\u68C0\u6D4B\u5230 dsh-email \u7684\u90AE\u4EF6\u5DE5\u5177":i.provider==="demo"?"\u8BBE\u7F6E\u91CC\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1":i.lastSyncAt?`\u4E0A\u6B21\u540C\u6B65 ${A(i.lastSyncAt)}`:i.configured?"\u7B49\u5F85\u540C\u6B65":"\u8BBE\u7F6E\u91CC\u63A5\u5165\u81EA\u5DF1\u7684\u90AE\u7BB1"),i.lastSyncError?m.default.createElement("small",{className:"wd-error"},i.lastSyncError):null,m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:De,disabled:i.provider==="demo"||i.provider==="dsh-email"&&!i.pluginAvailable},m.default.createElement(S,{name:"refresh",size:12}),"\u540C\u6B65"),i.provider==="dsh-email"?m.default.createElement("small",null,"\u8BFB\u4FE1\u548C\u6807\u8BB0\u8D70 dsh-email\uFF0C\u53D1\u4FE1\u53EA\u5728\u5B83\u7684\u8349\u7A3F\u91CC\u786E\u8BA4\u3002"):null),m.default.createElement("p",{className:"wd-muted wd-mail-tip"},"\u6B63\u6587\u6309\u7EAF\u6587\u672C\u663E\u793A\uFF0C\u4E0D\u52A0\u8F7D\u8FDC\u7A0B\u56FE\u7247\uFF0C\u8FFD\u8E2A\u50CF\u7D20\u4E0D\u4F1A\u8BB0\u5F55\u4F60\u6253\u5F00\u8FC7\u3002")),m.default.createElement("section",{className:"wd-mail-list"},m.default.createElement("header",{className:"wd-mail-search"},m.default.createElement("label",{className:"wd-search"},m.default.createElement(S,{name:"search",size:15}),m.default.createElement("input",{value:n,onChange:c=>b({mailQuery:c.target.value}),placeholder:"\u641C\u53D1\u4EF6\u4EBA\u3001\u4E3B\u9898\u3001\u6B63\u6587\u6458\u8981","aria-label":"\u641C\u7D22\u90AE\u4EF6"}))),m.default.createElement("div",{className:"wd-mail-rows"},t==="drafts"?o.length===0?m.default.createElement("p",{className:"wd-card-empty"},"\u6CA1\u6709\u8349\u7A3F\u3002"):o.map(c=>m.default.createElement("button",{key:c.id,type:"button",className:`wd-mail-row ${c.id===a?"is-active":""}`,onClick:()=>b({focusMailId:c.id})},m.default.createElement("span",{className:"wd-mail-dot"}),m.default.createElement("span",{className:"wd-mail-row-main"},m.default.createElement("span",{className:"wd-mail-row-top"},m.default.createElement("b",null,"\u8349\u7A3F"),m.default.createElement("time",null,Q(c.createdAt))),m.default.createElement("span",{className:"wd-mail-row-subject"},c.subject||"\uFF08\u65E0\u4E3B\u9898\uFF09"),m.default.createElement("span",{className:"wd-mail-row-snippet"},c.to)))):l.length===0?m.default.createElement(ne,{title:v?"\u8FD8\u6CA1\u6709\u90AE\u4EF6":"\u6CA1\u6709\u5339\u914D\u7684\u90AE\u4EF6",hint:v?"\u53F3\u8FB9\u63A5\u4E00\u4E2A\u771F\u5B9E\u90AE\u7BB1\uFF0C\u6216\u5728\u8BBE\u7F6E\u91CC\u63A5 DSH \u90AE\u4EF6\u63D2\u4EF6\u3002":n?"\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002":"\u70B9\u53F3\u4E0A\u89D2\u540C\u6B65\uFF0C\u6216\u8005\u5728\u8BBE\u7F6E\u91CC\u63A5\u5165\u90AE\u7BB1\u3002"}):l.map(c=>m.default.createElement(On,{key:c.id,mail:c,active:c.id===a,onClick:()=>de(c.id)})))),m.default.createElement("section",{className:"wd-mail-read"},v&&t!=="drafts"?m.default.createElement(Pn,null):w?m.default.createElement("article",{className:"wd-reader"},m.default.createElement("header",{className:"wd-reader-head"},m.default.createElement("h2",null,w.subject),m.default.createElement("div",{className:"wd-reader-meta"},m.default.createElement("span",null,"\u53D1\u7ED9 ",w.to),m.default.createElement("span",null,Pe(w.createdAt))),m.default.createElement("div",{className:"wd-reader-actions"},m.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>Me(w)},m.default.createElement(S,{name:"edit",size:13}),"\u7EE7\u7EED\u5199"),m.default.createElement("button",{type:"button",className:"wd-btn is-small is-danger",onClick:()=>P([{op:"delete_draft",id:w.id}],{label:"\u4E22\u5F03\u8349\u7A3F"})},m.default.createElement(S,{name:"trash",size:13}),"\u4E22\u5F03"))),m.default.createElement("pre",{className:"wd-reader-body"},w.text||"\uFF08\u8FD8\u6CA1\u5199\u6B63\u6587\uFF09")):m.default.createElement(An,{mail:f})),m.default.createElement(jn,null))}var u=G(require("react"),1);function qt({quote:e,points:t,width:n=84,height:a=26}){if(t&&t.length>=3){let o=t.map(c=>c.price),r=Math.min(...o),f=Math.max(...o)-r||1,w=o.map((c,d)=>`${d?"L":"M"} ${d/(o.length-1)*n} ${a-(c-r)/f*(a-2)-1}`).join(" "),v=o[o.length-1]>=o[0];return u.default.createElement("svg",{className:`wd-spark ${v?"is-up":"is-down"}`,width:n,height:a,viewBox:`0 0 ${n} ${a}`,"aria-hidden":"true"},u.default.createElement("path",{d:w,fill:"none",stroke:"currentColor",strokeWidth:"1.4",strokeLinejoin:"round",strokeLinecap:"round"}))}if(!e)return u.default.createElement("span",{className:"wd-spark is-empty"});let i=e.changePct??0;return u.default.createElement("span",{className:`wd-spark-bar ${i>=0?"is-up":"is-down"}`,title:`${i>=0?"+":""}${i.toFixed(2)}%`,"aria-hidden":"true"},u.default.createElement("i",{style:{width:`${Math.min(100,Math.abs(i)*14+10)}%`}}))}function Hn({data:e,quote:t}){let n=e?.points??[],a=e?.prevClose??t?.prevClose??null;if(n.length<2)return u.default.createElement("div",{className:"wd-chart-empty"},"\u8FD8\u6CA1\u6709\u5206\u65F6\u6570\u636E",a?"":"\uFF0C\u884C\u60C5\u6E90\u6CA1\u8FD4\u56DE","\u3002\u4EA4\u6613\u65F6\u6BB5\u5185\u5237\u65B0\u4E00\u4E0B\u8BD5\u8BD5\u3002");let i=n.map(g=>g.price);a&&i.push(a);let o=Math.min(...i),l=Math.max(...i)-o||1,f=600,w=200,v=g=>g/(n.length-1)*f,c=g=>w-(g-o)/l*(w-16)-8,d=n.map((g,$)=>`${$?"L":"M"} ${v($).toFixed(1)} ${c(g.price).toFixed(1)}`).join(" "),M=`${d} L ${f} ${w} L 0 ${w} Z`,N=n[n.length-1],x=a?N.price>=a:!0;return u.default.createElement("div",{className:`wd-minute ${x?"is-up":"is-down"}`},u.default.createElement("svg",{viewBox:`0 0 ${f} ${w}`,preserveAspectRatio:"none",role:"img","aria-label":"\u5206\u65F6\u8D70\u52BF"},a?u.default.createElement(u.default.Fragment,null,u.default.createElement("line",{x1:"0",x2:f,y1:c(a),y2:c(a),className:"wd-minute-base"}),u.default.createElement("text",{x:"6",y:c(a)-5,className:"wd-minute-label"},a)):null,u.default.createElement("path",{d:M,className:"wd-minute-area"}),u.default.createElement("path",{d,className:"wd-minute-line"})),u.default.createElement("div",{className:"wd-minute-axis"},u.default.createElement("span",null,"09:30"),u.default.createElement("span",null,"11:30 / 13:00"),u.default.createElement("span",null,"15:00")))}function _n(e){let t=String(e??"").trim();t&&P([{op:"add_watch",code:t}],{label:`\u6DFB\u52A0\u81EA\u9009 ${t}`})}function Et(e){b({dialog:{title:`\u7ED9 ${e?.name??"\u8FD9\u53EA"} \u52A0\u63D0\u9192`,submitLabel:"\u52A0\u63D0\u9192",initial:{code:e?.symbol??"",threshold:"3",direction:"up"},fields:[{name:"code",label:"\u4EE3\u7801",required:!0},{name:"threshold",label:"\u6DA8\u8DCC\u5E45\u9608\u503C\uFF08%\uFF09",type:"number",required:!0},{name:"direction",label:"\u65B9\u5411",type:"select",options:[{value:"up",label:"\u6DA8\u8D85\u8FC7"},{value:"down",label:"\u8DCC\u8D85\u8FC7"}]}],onSubmit:t=>P([{op:"add_alert",kind:"price",code:t.code,threshold:Number(t.threshold)||3,direction:t.direction}],{label:"\u6DFB\u52A0\u80A1\u4EF7\u63D0\u9192"})}})}function It(){b({dialog:{title:"\u8BB0\u4E00\u7B14\u6301\u4ED3",submitLabel:"\u4FDD\u5B58",initial:{code:"",shares:"100",cost:""},fields:[{name:"code",label:"\u4EE3\u7801",required:!0,placeholder:"600519 / hk00700 / AAPL"},{name:"shares",label:"\u80A1\u6570",type:"number",required:!0},{name:"cost",label:"\u6210\u672C\u4EF7",type:"number",required:!0}],onSubmit:e=>P([{op:"add_position",code:e.code,shares:Number(e.shares),cost:Number(e.cost)}],{label:"\u8BB0\u4E00\u7B14\u6301\u4ED3"})}})}function Un({code:e,quotes:t,minute:n,positions:a,alerts:i}){let o=t[e],r=a.find(v=>v.code===e),l=i.find(v=>v.code===e);if(!e)return u.default.createElement(ne,{title:"\u9009\u4E00\u53EA\u770B\u8BE6\u60C5",hint:"\u5DE6\u8FB9\u70B9\u4E00\u884C\uFF0C\u53F3\u8FB9\u51FA\u5206\u65F6\u548C\u6301\u4ED3\u3002"});let f=r&&o?(o.price-r.cost)*r.shares:null,w=r&&o&&r.cost?(o.price-r.cost)/r.cost*100:null;return u.default.createElement("section",{className:"wd-card wd-quote"},u.default.createElement("header",{className:"wd-quote-head"},u.default.createElement("div",null,u.default.createElement("h2",null,o?.name??e),u.default.createElement("p",{className:"wd-muted"},e.toUpperCase()," \xB7 ",(o?.quotedAt??"\u7B49\u5F85\u884C\u60C5").replace("T"," "))),u.default.createElement("span",{style:{flex:1}}),u.default.createElement("div",{className:`wd-quote-price ${Z(o?.changePct)}`},u.default.createElement("b",null,o?.price??"\u2014"),u.default.createElement("small",null,ae(o?.changePct))),u.default.createElement(U,{icon:"bell",label:"\u52A0\u63D0\u9192",onClick:()=>Et(o??{symbol:e})}),u.default.createElement(U,{icon:"refresh",label:"\u5237\u65B0\u5206\u65F6",onClick:()=>Se(e)})),u.default.createElement("dl",{className:"wd-quote-grid"},u.default.createElement("div",null,u.default.createElement("dt",null,"\u4ECA\u5F00"),u.default.createElement("dd",null,o?.open??"\u2014")),u.default.createElement("div",null,u.default.createElement("dt",null,"\u6628\u6536"),u.default.createElement("dd",null,o?.prevClose??"\u2014")),u.default.createElement("div",null,u.default.createElement("dt",null,"\u6700\u9AD8"),u.default.createElement("dd",{className:"is-up"},o?.high??"\u2014")),u.default.createElement("div",null,u.default.createElement("dt",null,"\u6700\u4F4E"),u.default.createElement("dd",{className:"is-down"},o?.low??"\u2014")),u.default.createElement("div",null,u.default.createElement("dt",null,"\u6210\u4EA4\u91CF"),u.default.createElement("dd",null,dt(o?.volume))),u.default.createElement("div",null,u.default.createElement("dt",null,"\u5E01\u79CD"),u.default.createElement("dd",null,o?.currency??"\u2014"))),u.default.createElement(Hn,{data:n,quote:o}),r?u.default.createElement("div",{className:"wd-position-mini"},u.default.createElement("span",null,"\u6301\u4ED3 ",r.shares," \u80A1 \xB7 \u6210\u672C ",r.cost),u.default.createElement("b",{className:Z(f)},f>=0?"+":"",R(f),"\uFF08",ae(w),"\uFF09")):u.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:It},u.default.createElement(S,{name:"plus",size:12}),"\u8BB0\u4E00\u7B14\u6301\u4ED3"),l?u.default.createElement("p",{className:"wd-muted"},"\u63D0\u9192\uFF1A",l.direction==="down"?"\u8DCC":"\u6DA8","\u8D85\u8FC7 ",l.threshold,"% \u65F6\u63D0\u793A"):null)}function Tt(){let e=z(g=>g.state),t=z(g=>g.quotes),n=z(g=>g.quotesAt),a=z(g=>g.quoteError),i=z(g=>g.minute),o=z(g=>g.minuteCode),[r,l]=u.default.useState("watch"),[f,w]=u.default.useState(""),v=o??e.watchlist[0]?.code??null;u.default.useEffect(()=>{if(!v)return;(!i||o!==v)&&Se(v);let g=setInterval(()=>ze(!1),8e3);return()=>clearInterval(g)},[v]);let c=e.watchlist,d=e.positions,M=d.reduce((g,$)=>g+(t[$.code]?.price??0)*$.shares,0),N=d.reduce((g,$)=>g+$.cost*$.shares,0),x=M-N;return u.default.createElement("div",{className:"wd-page wd-market-page"},u.default.createElement("header",{className:"wd-page-head"},u.default.createElement("div",null,u.default.createElement("h1",null,"\u884C\u60C5"),u.default.createElement("p",{className:"wd-page-sub"},n?`\u884C\u60C5\u65F6\u95F4 ${A(n)}`:"\u7B49\u5F85\u7B2C\u4E00\u6B21\u5237\u65B0",a?` \xB7 \u6700\u8FD1\u4E00\u6B21\u5931\u8D25\uFF1A${a}`:""," \xB7 \u6570\u636E\u6765\u81EA\u817E\u8BAF\u516C\u5F00\u884C\u60C5\uFF0C\u4EC5\u4F9B\u53C2\u8003\uFF0C\u4E0D\u6784\u6210\u6295\u8D44\u5EFA\u8BAE\u3002")),u.default.createElement("span",{style:{flex:1}}),u.default.createElement("form",{className:"wd-add-watch",onSubmit:g=>{g.preventDefault(),_n(f),w("")}},u.default.createElement(S,{name:"plus",size:14}),u.default.createElement("input",{value:f,onChange:g=>w(g.target.value),placeholder:"600519 / 00700 / AAPL","aria-label":"\u6DFB\u52A0\u81EA\u9009"}),u.default.createElement("button",{type:"submit",className:"wd-btn is-small"},"\u52A0\u81EA\u9009")),u.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>ze(!0)},u.default.createElement(S,{name:"refresh",size:13}),"\u5237\u65B0"),u.default.createElement(qe,{label:"\u5217\u8868",value:r,onChange:l,options:[{value:"watch",label:"\u81EA\u9009"},{value:"positions",label:"\u6301\u4ED3"}]})),u.default.createElement("div",{className:"wd-market-wrap"},u.default.createElement("section",{className:"wd-card wd-market-list"},u.default.createElement("table",{className:"wd-table"},u.default.createElement("thead",null,u.default.createElement("tr",null,u.default.createElement("th",null,"\u540D\u79F0"),u.default.createElement("th",{className:"is-num"},"\u73B0\u4EF7"),u.default.createElement("th",{className:"is-num"},"\u6DA8\u8DCC"),u.default.createElement("th",{className:"is-num"},"\u6DA8\u8DCC\u5E45"),u.default.createElement("th",null,"\u5206\u65F6"),u.default.createElement("th",null))),u.default.createElement("tbody",null,(r==="watch"?c:d).map(g=>{let $=t[g.code],_=v===g.code;return u.default.createElement("tr",{key:g.id??g.code,className:`${_?"is-selected":""} ${Z($?.changePct)}`,onClick:()=>{b({minuteCode:g.code}),Se(g.code)}},u.default.createElement("td",null,u.default.createElement("span",{className:"wd-quote-name"},$?.name??g.name),u.default.createElement("small",null,g.code.toUpperCase())),u.default.createElement("td",{className:"is-num"},u.default.createElement("b",null,$?.price??"\u2014")),u.default.createElement("td",{className:"is-num"},$?.change===null||$?.change===void 0?"\u2014":`${$.change>=0?"+":""}${$.change.toFixed(2)}`),u.default.createElement("td",{className:"is-num"},ae($?.changePct)),u.default.createElement("td",null,_&&i?.points?.length?u.default.createElement(qt,{points:i.points}):u.default.createElement(qt,{quote:$})),u.default.createElement("td",{className:"is-right"},u.default.createElement("button",{type:"button",className:"wd-icon-btn","aria-label":"\u52A0\u63D0\u9192",onClick:k=>{k.stopPropagation(),Et($??{symbol:g.code})}},u.default.createElement(S,{name:"bell",size:13}))))}))),r==="positions"&&d.length?u.default.createElement("footer",{className:"wd-market-total"},u.default.createElement("span",null,"\u5E02\u503C ",u.default.createElement("b",null,R(M,0))),u.default.createElement("span",null,"\u6210\u672C ",u.default.createElement("b",null,R(N,0))),u.default.createElement("span",{className:Z(x)},"\u6D6E\u76C8 ",u.default.createElement("b",null,x>=0?"+":"",R(x,0)))):null,r==="watch"&&c.length===0?u.default.createElement(ne,{title:"\u8FD8\u6CA1\u6709\u81EA\u9009",hint:"\u5728\u4E0A\u9762\u8F93\u5165\u4EE3\u7801\uFF0C\u52A0\u4E00\u53EA\u770B\u770B\u3002"}):null,r==="positions"&&d.length===0?u.default.createElement(ne,{title:"\u8FD8\u6CA1\u6709\u6301\u4ED3",hint:"\u8BB0\u4E00\u7B14\u4E4B\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6309\u73B0\u4EF7\u7B97\u6D6E\u52A8\u76C8\u4E8F\u3002",action:u.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:It},"\u8BB0\u4E00\u7B14")}):null),u.default.createElement("aside",{className:"wd-market-side"},u.default.createElement(Un,{code:v,quotes:t,minute:o===v?i:null,positions:d,alerts:e.alerts}),u.default.createElement("section",{className:"wd-card"},u.default.createElement("header",{className:"wd-card-head"},u.default.createElement("h2",null,"\u6211\u7684\u63D0\u9192")),e.alerts.length===0?u.default.createElement("p",{className:"wd-card-empty"},"\u8FD8\u6CA1\u6709\u63D0\u9192\u3002\u7ED9\u4E00\u53EA\u7968\u52A0\u4E2A\u9608\u503C\uFF0C\u76D8\u4E2D\u8D8A\u8FC7\u5C31\u4F1A\u51FA\u73B0\u5728\u4ECA\u65E5\u9875\u3002"):u.default.createElement("ul",{className:"wd-alert-list"},e.alerts.map(g=>u.default.createElement("li",{key:g.id},u.default.createElement(S,{name:"bell",size:12}),u.default.createElement("span",null,g.code?.toUpperCase()," ",g.direction==="down"?"\u8DCC":"\u6DA8","\u8D85 ",g.threshold,"%"),u.default.createElement(U,{icon:"trash",label:"\u5220\u9664\u63D0\u9192",onClick:()=>P([{op:"remove_alert",id:g.id}],{label:"\u5220\u9664\u63D0\u9192"})}))))))))}var h=G(require("react"),1);var Fn=[{value:"dsh-email",label:"DSH \u90AE\u4EF6\u63D2\u4EF6"},{value:"imap",label:"\u81EA\u5EFA IMAP / SMTP"},{value:"demo",label:"\u793A\u4F8B\u90AE\u7BB1"}],Bn=[{id:"qq",label:"QQ \u90AE\u7BB1",imap:"imap.qq.com",smtp:"smtp.qq.com"},{id:"exmail",label:"\u817E\u8BAF\u4F01\u4E1A\u90AE",imap:"imap.exmail.qq.com",smtp:"smtp.exmail.qq.com"},{id:"163",label:"\u7F51\u6613 163",imap:"imap.163.com",smtp:"smtp.163.com"},{id:"aliyun",label:"\u963F\u91CC\u4F01\u4E1A\u90AE",imap:"imap.qiye.aliyun.com",smtp:"smtp.qiye.aliyun.com"},{id:"gmail",label:"Gmail",imap:"imap.gmail.com",smtp:"smtp.gmail.com"},{id:"outlook",label:"Outlook",imap:"outlook.office365.com",smtp:"smtp.office365.com"}];function Ot(){let e=z(x=>x.settingsOpen),t=z(x=>x.settings),n=z(x=>x.mail.pluginAvailable),[a,i]=h.default.useState(null),[o,r]=h.default.useState(null),[l,f]=h.default.useState(!1),w=h.default.useRef(!1);if(h.default.useEffect(()=>{if(!e){w.current=!1;return}!t||w.current||(w.current=!0,i({provider:t.mail.provider,account:t.mail.account??"",address:t.mail.address,folder:t.mail.folder,syncSec:t.mail.syncSec,imap:{host:t.mail.imap.host,port:t.mail.imap.port,secure:t.mail.imap.secure,user:t.mail.imap.user,pass:""},smtp:{host:t.mail.smtp.host,port:t.mail.smtp.port,secure:t.mail.smtp.secure,user:t.mail.smtp.user,pass:""},quotes:{enabled:t.quotes.enabled,intervalSec:t.quotes.intervalSec}}),r(null))},[e,t]),!e||!a)return null;let v=()=>b({settingsOpen:!1}),c=(x,g)=>i($=>({...$,[x]:g})),d=(x,g,$)=>i(_=>({..._,[x]:{..._[x],[g]:$}})),M=x=>i(g=>({...g,provider:"imap",imap:{...g.imap,host:x.imap,port:993,secure:!0},smtp:{...g.smtp,host:x.smtp,port:465,secure:!0}})),N=()=>({mail:{provider:a.provider,account:a.account,address:a.address,folder:a.folder,syncSec:Number(a.syncSec),imap:{host:a.imap.host,port:Number(a.imap.port),secure:a.imap.secure,user:a.imap.user,pass:a.imap.pass},smtp:{host:a.smtp.host,port:Number(a.smtp.port),secure:a.smtp.secure,user:a.smtp.user,pass:a.smtp.pass}},quotes:{enabled:a.quotes.enabled,intervalSec:Number(a.quotes.intervalSec)}});return h.default.createElement(he,{title:"\u8BBE\u7F6E",onClose:v,width:620},h.default.createElement("form",{className:"wd-form",onSubmit:async x=>{x.preventDefault(),await $e(N())&&v()}},h.default.createElement("div",{className:"wd-field"},h.default.createElement("span",null,"\u90AE\u4EF6\u6765\u6E90"),h.default.createElement("div",{className:"wd-presets",role:"radiogroup","aria-label":"\u90AE\u4EF6\u6765\u6E90"},Fn.map(x=>h.default.createElement("button",{type:"button",key:x.value,role:"radio","aria-checked":a.provider===x.value,className:a.provider===x.value?"is-on":"",onClick:()=>c("provider",x.value)},x.label))),h.default.createElement("small",null,a.provider==="dsh-email"?"\u590D\u7528 dsh-email \u91CC\u5DF2\u7ECF\u914D\u597D\u7684\u8D26\u53F7\uFF1A\u5DE5\u4F5C\u53F0\u53EA\u8C03\u5B83\u7684\u8BFB\u4FE1/\u6807\u8BB0/\u5199\u8349\u7A3F\u5DE5\u5177\uFF0C\u4E0D\u8BFB\u6388\u6743\u7801\u3002":a.provider==="imap"?"\u5DE5\u4F5C\u53F0\u81EA\u5DF1\u8FDE IMAP\uFF1B\u540C\u6B65\u53EA\u62C9\u6700\u8FD1 40 \u5C01\u7684\u5934\u90E8\u548C\u6B63\u6587\u524D 2KB\uFF0C\u6253\u5F00\u65F6\u624D\u4E0B\u8F7D\u5168\u6587\u3002":"\u73B0\u5728\u7528\u7684\u662F\u793A\u4F8B\u90AE\u4EF6\uFF0C\u53EF\u4EE5\u968F\u4FBF\u70B9\u3001\u968F\u4FBF\u8BD5\u3002")),a.provider==="dsh-email"?h.default.createElement(h.default.Fragment,null,h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"\u590D\u7528\u54EA\u4E2A\u8D26\u53F7"),h.default.createElement("input",{value:a.account,onChange:x=>c("account",x.target.value),placeholder:"\u7559\u7A7A\u7528 dsh-email \u7684\u9ED8\u8BA4\u8D26\u53F7"}),h.default.createElement("small",null,"\u8D26\u53F7\u540D\u5C31\u662F dsh-email \u8BBE\u7F6E\u91CC\u7684\u540D\u5B57\uFF08\u591A\u4E2A\u8D26\u53F7\u65F6\u7528\u5B83\u533A\u5206\uFF09\u3002\u53D1\u4FE1\u6309\u94AE\u4F1A\u53D8\u6210\u300C\u5B58\u4E3A\u8349\u7A3F\u300D\uFF0C\u53D1\u9001\u5728 DSH \u7684\u8349\u7A3F\u7BB1\u91CC\u786E\u8BA4\u3002")),h.default.createElement("div",{className:"wd-test-row"},h.default.createElement("button",{type:"button",className:"wd-btn is-small",disabled:l,onClick:async()=>{f(!0),r(null),r(await je({provider:"dsh-email"})),f(!1)}},l?"\u6B63\u5728\u8FDE\u63A5\u2026":"\u6D4B\u8BD5\u8FDE\u63A5"),n===!1?h.default.createElement("span",{className:"wd-error"},"\u6CA1\u68C0\u6D4B\u5230 dsh-email \u7684\u90AE\u4EF6\u5DE5\u5177"):null,o?h.default.createElement("span",{className:o.ok?"wd-ok":"wd-error"},o.ok?`\u8FDE\u4E0A\u4E86\uFF1A\u8D26\u53F7 ${o.account}\uFF0C${o.folders?.length??0} \u4E2A\u6587\u4EF6\u5939`:o.error):null),o?.folders?.length?h.default.createElement("p",{className:"wd-muted"},"\u53EF\u7528\u6587\u4EF6\u5939\uFF1A",o.folders.slice(0,8).join("\u3001")):null):null,a.provider==="imap"?h.default.createElement(h.default.Fragment,null,h.default.createElement("div",{className:"wd-field"},h.default.createElement("span",null,"\u5E38\u7528\u90AE\u7BB1"),h.default.createElement("div",{className:"wd-presets"},Bn.map(x=>h.default.createElement("button",{type:"button",key:x.id,className:a.imap.host===x.imap?"is-on":"",onClick:()=>M(x)},x.label))),h.default.createElement("small",null,"QQ / 163 \u9700\u8981\u300C\u6388\u6743\u7801\u300D\uFF0C\u4E0D\u662F\u767B\u5F55\u5BC6\u7801\u3002Gmail \u9700\u8981\u5E94\u7528\u4E13\u7528\u5BC6\u7801\u3002")),h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"\u90AE\u7BB1\u5730\u5740"),h.default.createElement("input",{value:a.address,onChange:x=>c("address",x.target.value),placeholder:"you@company.com"})),h.default.createElement("div",{className:"wd-field-row"},h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"IMAP \u670D\u52A1\u5668"),h.default.createElement("input",{value:a.imap.host,onChange:x=>d("imap","host",x.target.value),placeholder:"imap.exmail.qq.com"})),h.default.createElement("label",{className:"wd-field is-small"},h.default.createElement("span",null,"\u7AEF\u53E3"),h.default.createElement("input",{value:a.imap.port,onChange:x=>d("imap","port",x.target.value)}))),h.default.createElement("div",{className:"wd-field-row"},h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"IMAP \u8D26\u53F7"),h.default.createElement("input",{value:a.imap.user,onChange:x=>d("imap","user",x.target.value),placeholder:"\u9ED8\u8BA4\u7528\u90AE\u7BB1\u5730\u5740"})),h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"\u6388\u6743\u7801",t.mail.imap.hasPass?`\uFF08\u5DF2\u4FDD\u5B58 \xB7 \u672B\u56DB\u4F4D ${t.mail.imap.passHint}\uFF09`:""),h.default.createElement("input",{type:"password",autoComplete:"off",value:a.imap.pass,onChange:x=>d("imap","pass",x.target.value),placeholder:t.mail.imap.hasPass?"\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539":"\u6388\u6743\u7801"}))),h.default.createElement("div",{className:"wd-field-row"},h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"SMTP \u670D\u52A1\u5668"),h.default.createElement("input",{value:a.smtp.host,onChange:x=>d("smtp","host",x.target.value),placeholder:"smtp.exmail.qq.com"})),h.default.createElement("label",{className:"wd-field is-small"},h.default.createElement("span",null,"\u7AEF\u53E3"),h.default.createElement("input",{value:a.smtp.port,onChange:x=>d("smtp","port",x.target.value)}))),h.default.createElement("div",{className:"wd-field-row"},h.default.createElement("label",{className:"wd-field"},h.default.createElement("span",null,"\u6536\u4EF6\u7BB1\u6587\u4EF6\u5939"),h.default.createElement("input",{value:a.folder,onChange:x=>c("folder",x.target.value),placeholder:"INBOX"})),h.default.createElement("label",{className:"wd-field is-small"},h.default.createElement("span",null,"\u540C\u6B65\u95F4\u9694\uFF08\u79D2\uFF09"),h.default.createElement("input",{type:"number",min:"30",max:"3600",value:a.syncSec,onChange:x=>c("syncSec",x.target.value)}))),h.default.createElement("div",{className:"wd-test-row"},h.default.createElement("button",{type:"button",className:"wd-btn is-small",disabled:l,onClick:async()=>{f(!0),r(null);let x=await je({address:a.address,folder:a.folder,imap:{host:a.imap.host,port:Number(a.imap.port),secure:a.imap.secure,user:a.imap.user||a.address,pass:a.imap.pass}});r(x),f(!1)}},l?"\u6B63\u5728\u8FDE\u63A5\u2026":"\u6D4B\u8BD5\u8FDE\u63A5"),o?h.default.createElement("span",{className:o.ok?"wd-ok":"wd-error"},o.ok?`\u8FDE\u4E0A\u4E86\uFF0C${a.folder} \u91CC\u6709 ${o.exists} \u5C01\u90AE\u4EF6`:o.error):null),h.default.createElement("p",{className:"wd-muted"},"\u6388\u6743\u7801\u53EA\u5199\u8FDB\u672C\u673A\u7684 settings.json\uFF08\u6743\u9650 600\uFF09\uFF0C\u4E0D\u4F1A\u56DE\u4F20\u7ED9\u6D4F\u89C8\u5668\uFF0C\u4E5F\u4E0D\u4F1A\u8FDB\u5185\u5BB9\u6570\u636E\u3002")):null,h.default.createElement("div",{className:"wd-field"},h.default.createElement("span",null,"\u884C\u60C5\u5237\u65B0"),h.default.createElement("div",{className:"wd-field-row"},h.default.createElement("label",{className:"wd-field is-small"},h.default.createElement("span",null,"\u5F00\u5173"),h.default.createElement("select",{value:a.quotes.enabled?"on":"off",onChange:x=>d("quotes","enabled",x.target.value==="on")},h.default.createElement("option",{value:"on"},"\u5F00"),h.default.createElement("option",{value:"off"},"\u5173"))),h.default.createElement("label",{className:"wd-field is-small"},h.default.createElement("span",null,"\u95F4\u9694\uFF08\u79D2\uFF09"),h.default.createElement("input",{type:"number",min:"3",max:"300",value:a.quotes.intervalSec,onChange:x=>d("quotes","intervalSec",x.target.value)}))),h.default.createElement("small",null,"\u53EA\u5728\u540E\u53F0\u6309\u95F4\u9694\u62C9\u4E00\u6B21\u516C\u5F00\u884C\u60C5\uFF1B\u884C\u60C5\u9875\u6253\u5F00\u65F6\u524D\u7AEF\u4E5F\u4F1A\u8DDF\u7740\u5237\u3002")),h.default.createElement("div",{className:"wd-field"},h.default.createElement("span",null,"\u793A\u4F8B\u6570\u636E"),h.default.createElement("div",{className:"wd-cal-actions"},h.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:async()=>{await P([{op:"load_samples"}],{label:"\u8F7D\u5165\u793A\u4F8B\u6570\u636E"})&&b({settingsOpen:!1})}},"\u8F7D\u5165\u793A\u4F8B\u6570\u636E"),h.default.createElement("button",{type:"button",className:"wd-btn is-small",onClick:()=>P([{op:"clear_samples"}],{label:"\u6E05\u7A7A\u793A\u4F8B\u6570\u636E"})},"\u6E05\u7A7A\u793A\u4F8B\u6570\u636E")),h.default.createElement("small",null,"\u9ED8\u8BA4\u4E0D\u585E\u4EFB\u4F55\u5047\u6570\u636E\uFF1B\u8F7D\u5165\u7684\u793A\u4F8B\u90FD\u5E26 sample \u6807\u8BB0\uFF0C\u968F\u65F6\u80FD\u4E00\u952E\u6E05\u6389\uFF0C\u4E0D\u4F1A\u52A8\u4F60\u81EA\u5DF1\u7684\u6761\u76EE\u3002")),h.default.createElement("div",{className:"wd-form-foot"},h.default.createElement("span",{className:"wd-muted",style:{flex:1}},"\u52A9\u624B\u7528\u7684\u6A21\u578B\u8DDF\u968F DeepSeek Harness \u5F53\u524D\u9ED8\u8BA4\u6A21\u578B\u3002"),h.default.createElement("button",{type:"button",className:"wd-btn",onClick:v},"\u53D6\u6D88"),h.default.createElement("button",{type:"submit",className:"wd-btn is-primary"},h.default.createElement(S,{name:"check",size:14}),"\u4FDD\u5B58"))))}var Lt=`/* \u6240\u6709\u989C\u8272\u8D70 DSH \u8BED\u4E49 token\uFF0C\u660E\u6697\u4E3B\u9898\u7531\u5BBF\u4E3B\u8D1F\u8D23\u3002\u529E\u516C\u53F0\u6BD4\u521B\u4F5C\u53F0\u66F4\u5BC6\u3001\u66F4\u5E73\u3002 */
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
`;var At="work-desk",Vn=[{id:"bench",label:"\u5DE5\u4F5C\u53F0",icon:"grid"},{id:"today",label:"\u4ECA\u65E5",icon:"today"},{id:"calendar",label:"\u65E5\u7A0B",icon:"calendar"},{id:"mail",label:"\u90AE\u4EF6",icon:"mail"},{id:"market",label:"\u884C\u60C5",icon:"chart"}],Kn={bench:St,today:Fe,calendar:ut,mail:$t,market:Tt};function Wn(){let e=z(a=>a.alerts),[t,n]=E.default.useState(!1);return e.length?E.default.createElement("div",{className:"wd-alerts"},E.default.createElement("button",{type:"button",className:"wd-bell","aria-label":`${e.length} \u6761\u63D0\u9192`,onClick:()=>n(a=>!a)},E.default.createElement(S,{name:"bell",size:16}),E.default.createElement("i",null,e.length)),t?E.default.createElement("div",{className:"wd-alerts-pop",role:"dialog","aria-label":"\u63D0\u9192"},e.map((a,i)=>E.default.createElement("p",{key:i,className:`is-${a.level}`},E.default.createElement(S,{name:a.kind==="price"?"chart":a.kind==="task"?"check":"clock",size:12}),a.text)),E.default.createElement("button",{type:"button",className:"wd-link",onClick:()=>{n(!1),b({view:"today"})}},"\u53BB\u4ECA\u65E5\u9875")):null):null}function Gn(e){let t=z(M=>M.ready),n=z(M=>M.error),a=z(M=>M.view),i=z(M=>M.dockOpen),o=z(M=>M.canUndo),r=E.default.useRef(null),[l,f]=E.default.useState(1440),w=l<1180,v=l<820;E.default.useEffect(()=>{se();let M=Re(),N=setInterval(()=>{document.visibilityState==="visible"&&se()},3e4),x=()=>{document.visibilityState==="visible"&&se()};return document.addEventListener("visibilitychange",x),window.addEventListener("focus",x),()=>{M(),clearInterval(N),document.removeEventListener("visibilitychange",x),window.removeEventListener("focus",x)}},[]),E.default.useEffect(()=>{w&&b({dockOpen:!1})},[w]),E.default.useEffect(()=>{let M=r.current;if(!M)return;let N=new ResizeObserver(([x])=>f(x.contentRect.width));return N.observe(M),()=>N.disconnect()},[]),E.default.useEffect(()=>{let M=N=>{let x=/^(INPUT|TEXTAREA|SELECT)$/.test(N.target.tagName)||N.target.isContentEditable;(N.metaKey||N.ctrlKey)&&N.key==="z"&&!N.shiftKey&&!x&&o&&(N.preventDefault(),le()),N.key==="/"&&!x&&a==="mail"&&(N.preventDefault(),document.querySelector(".wd-search input")?.focus())};return window.addEventListener("keydown",M),()=>window.removeEventListener("keydown",M)},[o,a]);let c=Kn[a]??Fe,d=i;return E.default.createElement("div",{className:`wd-root ${w?"is-narrow":""} ${v?"is-compact":""} ${d?"has-dock":""}`,ref:r},E.default.createElement("style",null,Lt,Dt),E.default.createElement("div",{className:"wd-ambient","aria-hidden":"true"},E.default.createElement("i",null),E.default.createElement("i",null),E.default.createElement("i",null)),E.default.createElement("div",{className:"wd-main"},E.default.createElement("header",{className:"wd-topbar","data-window-drag":""},E.default.createElement("nav",{className:"wd-nav","aria-label":"\u5DE5\u4F5C\u53F0\u5BFC\u822A"},Vn.map(M=>E.default.createElement("button",{type:"button",key:M.id,className:a===M.id?"is-on":"","aria-current":a===M.id?"page":void 0,onClick:()=>b({view:M.id})},E.default.createElement(S,{name:M.icon,size:14}),M.label))),E.default.createElement("span",{style:{flex:1}}),E.default.createElement(Wn,null),o?E.default.createElement(U,{icon:"undo",label:"\u64A4\u9500\u4E0A\u4E00\u6B65",onClick:le}):null,E.default.createElement(U,{icon:"gear",label:"\u8BBE\u7F6E",onClick:()=>b({settingsOpen:!0})}),d?null:E.default.createElement("button",{type:"button",className:"wd-open-dock",onClick:()=>b({dockOpen:!0})},E.default.createElement(S,{name:"spark",size:14}),"\u52A9\u624B")),t&&a!=="bench"?E.default.createElement(Ct,null):null,E.default.createElement("main",{className:"wd-content",key:a},n?E.default.createElement("div",{className:"wd-page"},E.default.createElement("p",{className:"wd-muted"},"\u5DE5\u4F5C\u53F0\u52A0\u8F7D\u5931\u8D25\uFF1A",n),E.default.createElement("button",{type:"button",className:"wd-btn",onClick:se},"\u91CD\u8BD5")):t?E.default.createElement(c,null):E.default.createElement("div",{className:"wd-loading"},E.default.createElement("span",{className:"wd-shimmer"},"\u6B63\u5728\u628A\u4ECA\u5929\u94FA\u5F00\u2026")))),t&&d?E.default.createElement(gt,{useSessions:e.useSessions}):null,E.default.createElement(ot,null),t?E.default.createElement(Ot,null):null,E.default.createElement(rt,null))}var Qn=["slots"];function Xn(e){Ze(e),e.slots.inject("main",()=>e.slots.register({name:"main",key:At},Gn)),e.slots.inject("sidebar.panellist",()=>e.slots.register({name:"sidebar.panellist",id:At,order:5,label:()=>"\u529E\u516C\u5DE5\u4F5C\u53F0"},({size:t})=>E.default.createElement(S,{name:"calendar",size:t})))}
return module.exports}})
