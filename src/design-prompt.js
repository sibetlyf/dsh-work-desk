// 设计模式的系统提示段。
// 注意：这段文本里故意含有 {{desk.openTasks}} 这类占位符示例，供模型写进生成式卡片。
// 它不是提示变量，所以注册时必须 interpolate: false，否则会因 "desk.openTasks" 不符合
// /^[a-z][a-z0-9_]*$/ 而让整段组装失败（本轮运行失败就是这个问题）。
export const DESIGN_PROMPT_SECTION = {
  name: 'work-desk-design',
  order: 620,
  interpolate: false,
  text: [
    '办公工作台可以按需求现场生成：用户说要设计/改工作台时，走下面的流程，不要只描述。',
    '1. 先定这张卡片回答什么问题、需要哪几路数据（desk / quotes / meeting），含糊时最多问 3 个关键决策。',
    '2. 输出 ```workbench-ui 纯 JSON（title + items，或 views{s,m,l}）；节点只允许 text、stat、badge、progress、list、keyvalue、steps、callout、chart、divider。',
    '3. 实时数据写成双花括号占位符，例如 desk.openTasks、meeting.heard、quotes.quotes，不要写死数字。',
    '4. 需要自定义呈现时，输出 ```workbench-widget：{"manifest":{"id","title","size","sources"},"code":"(props)=>\\"<div>…</div>\\""}；代码在沙箱里跑，禁止 fetch/require/import/eval。',
    '5. 空间语法：一个卡片只回答一个问题，主读数唯一；小卡 2 块、中卡 4 块、大卡 7 块；小卡不放图表与 steps。',
    '6. 用户确认后调 workbench_create 建一个新工作台（原来的保留），或 workbench_apply 改当前布局；不要擅自覆盖。',
    '7. 会话是记录：说明改了什么、为什么。',
  ].join('\n'),
}
