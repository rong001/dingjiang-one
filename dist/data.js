const STORAGE_KEY='dingjiang-one-demo-v1';
const seed=()=>({version:1,orders:[
{id:'SO-260901',channel:'Amazon US',biz:'b2c',region:'美国',sku:'BT100',qty:24,price:560,status:'待结算',customer:'零售客户 · 已脱敏',date:'2026-09-24',variance:128},
{id:'SO-260902',channel:'欧洲经销商',biz:'b2b',region:'欧洲',sku:'PHX-L3',qty:10,price:4800,status:'待审核',customer:'EU Partner A · 模拟客户',date:'2026-09-25',variance:0},
{id:'SO-260903',channel:'独立站 EU',biz:'b2c',region:'欧洲',sku:'TC001',qty:8,price:1580,status:'待发货',customer:'区域客户 · 已脱敏',date:'2026-09-25',variance:0},
{id:'SO-260904',channel:'Amazon US',biz:'b2c',region:'美国',sku:'TOPSCAN',qty:35,price:420,status:'待结算',customer:'零售客户 · 已脱敏',date:'2026-09-26',variance:0},
{id:'SO-260905',channel:'欧洲经销商',biz:'b2b',region:'欧洲',sku:'TC001',qty:60,price:1320,status:'待审核',customer:'EU Partner B · 模拟客户',date:'2026-09-26',variance:0},
{id:'SO-260906',channel:'独立站 US',biz:'b2c',region:'美国',sku:'PHX-L3',qty:2,price:5680,status:'待发货',customer:'区域客户 · 已脱敏',date:'2026-09-26',variance:0}],
products:[{sku:'BT100',name:'BT100 电池检测仪',stock:128,safety:240,daily:16,cost:220,price:560,warehouse:'美国演示仓',supplier:'电测组件供应商 A',bom:'BOM-BT100-R3',family:'电池服务'},{sku:'TC001',name:'TC001 热成像仪',stock:386,safety:200,daily:16,cost:670,price:1580,warehouse:'欧洲演示仓',supplier:'热成像模组供应商 B',bom:'BOM-TC001-R2',family:'热成像'},{sku:'PHX-L3',name:'Phoenix Lite 3',stock:74,safety:50,daily:3,cost:2350,price:5680,warehouse:'深圳演示仓',supplier:'诊断设备供应商 C',bom:'BOM-PHX-R5',family:'专业诊断'},{sku:'TOPSCAN',name:'TopScan 蓝牙诊断仪',stock:760,safety:220,daily:12,cost:145,price:420,warehouse:'美国演示仓',supplier:'诊断设备供应商 C',bom:'BOM-TSC-R2',family:'DIY 诊断'}],
purchaseOrders:[],journals:[],workOrders:[{id:'MO-260918',sku:'BT100',qty:300,status:'待排产',line:'装配线 A · 演示',bom:'R3'},{id:'MO-260919',sku:'TC001',qty:120,status:'生产中',line:'装配线 B · 演示',bom:'R2'}],
quality:[{id:'DQ-001',type:'物料映射',desc:'Amazon ASIN 演示码 BT-US-01 未关联标准 SKU',source:'TOC → MDM',target:'BT100',status:'待处理'},{id:'DQ-002',type:'客户去重',desc:'分销客户 EU Partner A 在 ERP / CRM 存在重复编码',source:'CRM → ERP',target:'CUST-EU-001',status:'待处理'},{id:'DQ-003',type:'账务维度',desc:'独立站运费字段待映射至 6601-02 履约费用',source:'独立站 → 财务中台',target:'6601-02',status:'待处理'}],
controls:[{id:'ITGC-01',title:'特权账号季度复核',category:'访问管理',owner:'信息安全负责人',risk:'高',evidence:'账号清单、授权记录、离职回收核对',status:'待复核'},{id:'FIN-02',title:'平台结算差异闭环',category:'财务内控',owner:'财务经理',risk:'高',evidence:'结算单、差异归因、借贷平衡凭证',status:'待复核'},{id:'PRIV-03',title:'区域数据与像素同意',category:'隐私治理',owner:'区域数据负责人',risk:'中',evidence:'区域目录、同意记录、标签触发日志',status:'待复核'},{id:'DR-04',title:'备份恢复抽样演练',category:'业务连续性',owner:'基础设施负责人',risk:'中',evidence:'恢复时间记录、完整性比对报告',status:'待复核'},{id:'SCM-05',title:'采购订单与收货匹配',category:'供应链内控',owner:'供应链经理',risk:'低',evidence:'采购订单、收货单、匹配结果',status:'已留证'},{id:'SEC-06',title:'跨主体授权与网络隔离',category:'平台治理',owner:'IT 总监',risk:'中',evidence:'主体授权台账、网络分区记录',status:'已留证'}],
integrations:[{id:'ERP',name:'ERP 财务总账',domain:'凭证 / 核算维度',status:'正常',count:1248},{id:'WMS',name:'WMS 仓储执行',domain:'库存 / 收发货',status:'重试待处理',count:836},{id:'MES',name:'MES 制造执行',domain:'工单 / 质量追溯',status:'正常',count:128},{id:'PLM',name:'PLM 研发管理',domain:'BOM / 版本变更',status:'正常',count:64},{id:'TOC',name:'TOC 业务中台',domain:'订单 / 结算 / 广告',status:'正常',count:8624}],
projects:[{id:'P01',name:'财务中台与结算对账',owner:'财务 + IT',budget:180,spent:62,committed:40,phase:'进行中'},{id:'P02',name:'产供销数据链路',owner:'供应链 + IT',budget:240,spent:45,committed:68,phase:'进行中'},{id:'P03',name:'主数据与审计底座',owner:'IT + 内审',budget:120,spent:36,committed:24,phase:'规划中'},{id:'P04',name:'跨境基础设施治理',owner:'IT + 区域负责人',budget:90,spent:21,committed:15,phase:'规划中'}],
audit:[{id:'AUD-0001',time:'2026-09-26 09:00:00',actor:'系统演示',action:'初始化演示工作空间',object:'DEMO-2026',detail:'载入模拟订单、库存、审计控制与集成状态；无真实业务连接。'}],privacyConsent:false,restored:false,monthClosed:false});
let state;let storageAvailable=true;try{const raw=localStorage.getItem(STORAGE_KEY);state=raw?JSON.parse(raw):seed();if(state.version!==1||!Array.isArray(state.orders))state=seed()}catch{state=seed();storageAvailable=false}
let tab='';let orderQuery='';let statusFilter='all';let dataTab='quality';let complianceTab='controls';let strategyTab='blueprint';let adRegion='all';let financeTab='settlements';
const product=sku=>state.products.find(p=>p.sku===sku);
const amount=o=>Math.round(o.qty*o.price*100)/100;
const cost=o=>product(o.sku).cost*o.qty;
const fee=o=>Math.round(amount(o)*(o.biz==='b2b'?.025:.15)*100)/100;
const freight=o=>o.qty*(o.biz==='b2b'?35:26);
const net=o=>Math.round((amount(o)-fee(o)-freight(o)-o.variance)*100)/100;
const profit=o=>amount(o)-cost(o)-fee(o)-freight(o)-o.variance;
const fmt=n=>Number(n).toLocaleString('zh-CN');
const statusBadge=s=>badge(esc(s),({'已入账':'good','已收货':'good','已留证':'good','已修复':'good','已完工':'good','正常':'good','待审核':'purple','待结算':'warn','待复核':'warn','待处理':'warn','待收货':'purple','生产中':'purple','待质检':'warn','重试待处理':'bad','待发货':'purple'})[s]||'');
const businessLabel=b=>b==='b2b'?'TOB 分销':'TOC 零售';
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true}catch{storageAvailable=false;toast('浏览器存储不可用，本次操作仅保留到页面关闭。')}}
function log(action,object,detail){state.audit.unshift({id:'AUD-'+String(state.audit.length+1).padStart(4,'0'),time:new Date().toLocaleString('sv-SE'),actor:role,action,object,detail});persist()}
function allowed(domain){return role==='IT 总监'||(domain==='finance'&&role==='财务经理')||(domain==='supply'&&role==='供应链经理')}
function guard(domain){if(allowed(domain))return true;toast('当前角色无此操作权限，请切换至相应负责人。');return false}
function permissionNote(domain){return allowed(domain)?'':`<div class="notice">当前角色：${esc(role)}，可查看此模块。写入操作需要${domain==='finance'?'财务经理':domain==='supply'?'供应链经理':'IT 总监'}角色。</div>`}
function footer(){return `<footer class="pagefoot"><span>产品名称参考 TOPDON 公开资料 · 数字、仓库、客户与系统均为模拟设定</span><span>${storageAvailable?'本浏览器独立保存':'存储不可用 · 临时会话'} · ${btn('重置演示','reset','small')}</span></footer>`}
