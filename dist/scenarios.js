/* Independent operating books. All amounts use CNY and fixed standard costs. */
const SCENARIOS = [
  {id:'global',name:'稳健经营',subtitle:'集团全渠道经营',description:'关注订单履约、海外库存与渠道利润'},
  {id:'growth',name:'渠道拓展',subtitle:'分销网络与新品增长',description:'关注新渠道订单、交付产能与补货协同'},
  {id:'closing',name:'月结冲刺',subtitle:'结算对账与内控闭环',description:'关注平台差异、会计凭证与关账检查'}
];
const SCENARIO_PREFERENCES_KEY = 'dingjiang-one-preferences-v2';
const scenarioStorageKey = id => 'dingjiang-one-v2:' + id;
const SCENARIO_THEMES = ['indigo','graphite','midnight'];
const SCENARIO_DENSITIES = ['comfortable','compact'];
let activeScenario = 'global';
let uiTheme = 'indigo';
let uiDensity = 'comfortable';

function buildScenario(id) {
  if (!SCENARIOS.some(s => s.id === id)) id = 'global';
  const book = JSON.parse(JSON.stringify(seed()));
  const setup = {
    global: {offset:0,posted:6,settling:6,shipping:6,quantity:1,stocks:[128,386,74,760],daily:[16,16,3,12]},
    growth: {offset:1,posted:4,settling:5,shipping:7,quantity:1.65,stocks:[82,224,38,428],daily:[24,22,5,21]},
    closing:{offset:2,posted:8,settling:10,shipping:3,quantity:1.2,stocks:[264,418,96,684],daily:[18,17,4,15]}
  }[id];
  const round = n => Math.round(n * 100) / 100;
  const day = d => '2026-09-' + String(Math.min(30, Math.max(1,d))).padStart(2,'0');
  const ownerNames = ['林予安','周奕辰','许知远','陈安宁'];
  book.version = 2;
  book.scenarioId = id;
  book.asOf = '2026-09-27';
  book.period = '2026-09';
  book.currency = 'CNY';
  book.accountingPolicy = {currency:'CNY',taxBasis:'不含税',costMethod:'固定标准成本',retailFeeRate:0.15,distributionFeeRate:0.025,retailFreight:26,distributionFreight:35};
  book.customers = [
    {id:'CUST-US-001',name:'北辰汽车服务集团',region:'美国',tier:'战略客户',creditLimit:1200000,terms:'交付后 30 天',owner:'林予安',status:'正常'},
    {id:'CUST-EU-001',name:'欧陆精工服务网络',region:'欧洲',tier:'战略客户',creditLimit:1800000,terms:'交付后 30 天',owner:'周奕辰',status:'正常'},
    {id:'CUST-EU-002',name:'莱茵智检贸易',region:'欧洲',tier:'核心经销商',creditLimit:800000,terms:'预付 30% / 交付后结清',owner:'周奕辰',status:'正常'},
    {id:'CUST-AP-001',name:'星港机电方案',region:'亚太',tier:'核心经销商',creditLimit:650000,terms:'交付后 15 天',owner:'许知远',status:id==='growth'?'信用复核':'正常'},
    {id:'CUST-US-002',name:'远行工具供应',region:'美国',tier:'授权渠道',creditLimit:500000,terms:'预付全款',owner:'林予安',status:'正常'},
    {id:'CUST-UK-001',name:'英桥诊断设备',region:'英国',tier:'核心经销商',creditLimit:750000,terms:'交付后 30 天',owner:'陈安宁',status:'正常'},
    {id:'CUST-AP-002',name:'南湾工业技术',region:'亚太',tier:'授权渠道',creditLimit:350000,terms:'预付 50% / 发货前结清',owner:'许知远',status:'正常'},
    {id:'CUST-EU-003',name:'北陆车检装备',region:'欧洲',tier:id==='growth'?'新签渠道':'授权渠道',creditLimit:id==='growth'?250000:450000,terms:'预付全款',owner:'周奕辰',status:'正常'}
  ];
  book.suppliers = [
    {id:'SUP-001',name:'启衡精密电子',category:'电池检测组件',region:'东莞',sla:'准时交付 ≥ 98%',score:96.8,leadDays:14,status:'合格'},
    {id:'SUP-002',name:'澄源光电科技',category:'热成像模组',region:'苏州',sla:'来料合格 ≥ 99.5%',score:97.4,leadDays:21,status:'合格'},
    {id:'SUP-003',name:'拓原智联设备',category:'诊断主板与整机',region:'深圳',sla:'准时交付 ≥ 97%',score:id==='growth'?91.6:95.1,leadDays:18,status:id==='growth'?'交付关注':'合格'},
    {id:'SUP-004',name:'海川精工材料',category:'结构件与包装',region:'惠州',sla:'响应时效 ≤ 24 小时',score:94.6,leadDays:10,status:'合格'}
  ];
  const warehouses = ['洛杉矶履约中心','鹿特丹分拨中心','深圳交付中心','达拉斯履约中心'];
  book.products = book.products.map((p,i) => ({...p,stock:setup.stocks[i],daily:setup.daily[i],warehouse:warehouses[i],supplier:book.suppliers[i===0?0:i===1?1:2].name,supplierId:book.suppliers[i===0?0:i===1?1:2].id,unit:'台',leadDays:book.suppliers[i===0?0:i===1?1:2].leadDays}));
  const productsBySku = Object.fromEntries(book.products.map(p => [p.sku,p]));
  const channelRows = [
    ['Amazon US','b2c','美国',0],['独立站 EU','b2c','欧洲',2],
    ['欧洲经销商','b2b','欧洲',1],['北美经销商','b2b','美国',4],
    ['Amazon DE','b2c','欧洲',7],['亚太经销商','b2b','亚太',3],
    ['独立站 US','b2c','美国',0],['英国经销商','b2b','英国',5]
  ];
  channelRows.filter(c=>c[1]==='b2c').forEach((channel,i)=>book.customers.push({id:'CUST-RETAIL-'+String(i+1).padStart(3,'0'),name:channel[0]+' 零售结算账户',region:channel[2],tier:'直营与平台',creditLimit:0,terms:'平台结算',owner:ownerNames[i%4],status:'正常',channel:channel[0]}));
  const skus = ['BT100','TC001','PHX-L3','TOPSCAN'];
  book.orders = Array.from({length:24},(_,i) => {
    const channel = channelRows[(i + setup.offset * 2) % channelRows.length];
    const customer = channel[1]==='b2b'?book.customers[channel[3]]:book.customers.find(c=>c.channel===channel[0]);
    const p = productsBySku[skus[(i + Math.floor(i / 4) + setup.offset) % skus.length]];
    const status = i < setup.posted ? '已入账' : i < setup.posted + setup.settling ? '待结算' : i < setup.posted + setup.settling + setup.shipping ? '待发货' : '待审核';
    const baseQty = p.sku==='PHX-L3'?4+(i%5)*2:12+(i%6)*7;
    const qty = Math.max(1,Math.round(baseQty * setup.quantity * (channel[1]==='b2b'?1.8:1)));
    const variance = (status==='已入账'||status==='待结算') && (i+setup.offset)%3===0 ? [128,86,214,320][i%4] : 0;
    return {
      id:'SO-'+String(260901+i),channel:channel[0],biz:channel[1],region:channel[2],sku:p.sku,qty,
      price:round(p.price*(channel[1]==='b2b'?0.84:1)),status,
      customer:customer.name,customerId:customer.id,
      date:day(2+i),variance,currency:'CNY',owner:ownerNames[(i+setup.offset)%4],
      promisedDate:day(Math.max(24,Math.min(30,i+5))),terms:channel[1]==='b2b'?customer.terms:'平台结算',
      sourceChannel:channel[0],settlementId:'ST-'+String(260901+i),
      warehouse:p.warehouse,priority:id==='growth'&&channel[1]==='b2b'?'优先':'标准',
      fulfilledDate:['已入账','待结算'].includes(status)?day(3+i):null
    };
  }).reverse();
  // Keep all calculations local: the active global state belongs to the currently open book.
  const orderAmount = o => round(o.qty * o.price);
  const orderCost = o => round(productsBySku[o.sku].cost * o.qty);
  const orderFee = o => round(orderAmount(o) * (o.biz==='b2b'?0.025:0.15));
  const orderFreight = o => o.qty * (o.biz==='b2b'?35:26);
  const orderNet = o => round(orderAmount(o)-orderFee(o)-orderFreight(o)-o.variance);
  book.journals = book.orders.filter(o => o.status==='已入账').sort((a,b) => a.id.localeCompare(b.id)).map((o,i) => {
    const lines = [
      {account:'1002 银行存款',debit:orderNet(o),credit:0},
      {account:'6601 销售费用',debit:round(orderFee(o)+orderFreight(o)+o.variance),credit:0},
      {account:'6001 主营业务收入',debit:0,credit:orderAmount(o)},
      {account:'6401 主营业务成本',debit:orderCost(o),credit:0},
      {account:'1405 库存商品',debit:0,credit:orderCost(o)}
    ];
    return {id:'JV-202609-'+String(i+1).padStart(4,'0'),order:o.id,lines,total:round(lines.reduce((n,l)=>n+l.debit,0)),reason:o.variance?'平台仓储服务费调整':'无差异',actor:'财务经理',date:day(18+i),period:'2026-09',status:'已过账'};
  }).reverse();
  const poStatuses = ['待审核','待收货','已收货','待审核','待收货','已收货'];
  book.purchaseOrders = Array.from({length:6},(_,i) => {
    const sku = skus[(i+setup.offset)%4];
    const p = productsBySku[sku];
    const source = book.orders.find(o=>o.sku===sku && o.status===(i%3===2?'已入账':'待发货')) || book.orders.find(o=>o.sku===sku);
    const qty = Math.round((sku==='PHX-L3'?40:160+i*30)*setup.quantity);
    const createdDay=Math.max(10+i*2,Number(source.date.slice(-2)));
    return {
      id:'PO-2609-'+String(i+1).padStart(3,'0'),sku,qty,status:poStatuses[i],
      reason:(id==='growth'?'渠道首单备货':'区域库存补给')+' · '+source.id,
      sourceOrder:source.id,supplierId:p.supplierId,supplier:p.supplier,
      warehouse:p.warehouse,date:day(createdDay),expectedDate:day(Math.max(23+i,createdDay+3)),unitCost:p.cost,
      owner:'供应链经理',receivedDate:poStatuses[i]==='已收货'?day(Math.max(22+i,createdDay)):null
    };
  }).reverse();
  const workStatuses = ['待排产','生产中','待质检','已完工','生产中','已完工'];
  book.workOrders = Array.from({length:6},(_,i) => {
    const p = productsBySku[skus[(i+setup.offset)%4]];
    const source = book.orders.find(o=>o.sku===p.sku&&o.status===(workStatuses[i]==='已完工'?'已入账':'待发货'))||book.orders.find(o=>o.sku===p.sku);
    const createdDay=Math.max(15+i,Number(source.date.slice(-2)));
    return {id:'MO-2609-'+String(i+1).padStart(3,'0'),sku:p.sku,qty:Math.round((p.sku==='PHX-L3'?30:100+i*20)*setup.quantity),status:workStatuses[i],line:['电测装配一线','光电装配二线','诊断装配三线'][i%3],bom:p.bom.split('-').pop(),sourceOrder:source.id,date:day(createdDay),dueDate:day(Math.max(25+i,createdDay+3)),owner:'制造运营部',lot:'LOT-'+p.sku+'-2609-'+String(i+1).padStart(2,'0')};
  });
  book.quality = [
    {id:'DQ-001',type:'物料映射',desc:'渠道商品 BT-US-01 待关联集团标准 SKU',source:'TOC → MDM',target:'BT100',status:id==='closing'?'已修复':'待处理'},
    {id:'DQ-002',type:'客户去重',desc:'欧陆精工服务网络在 ERP / CRM 存在重复客户编码',source:'CRM → ERP',target:'CUST-EU-001',status:'待处理'},
    {id:'DQ-003',type:'账务维度',desc:'独立站运费待映射至 6601-02 履约费用',source:'独立站 → 财务中台',target:'6601-02',status:id==='growth'?'已修复':'待处理'},
    {id:'DQ-004',type:'供应商准入',desc:'澄源光电科技质量等级与采购主数据待同步',source:'SRM → ERP',target:'SUP-002',status:'待处理'},
    {id:'DQ-005',type:'仓库维度',desc:'欧洲仓库地区代码已统一至 EU-NL-01',source:'WMS → MDM',target:'EU-NL-01',status:'已修复'},
    {id:'DQ-006',type:'BOM 版本',desc:'Phoenix Lite 3 生产基线与研发发布版本一致',source:'PLM → MES',target:'BOM-PHX-R5',status:'已修复'}
  ];
  book.controls = book.controls.map((c,i) => ({...c,status:(id==='closing'?i>1:i>3)?'已留证':'待复核',lastReviewed:(id==='closing'?i>1:i>3)?day(24+i%3):null}));
  book.integrations = book.integrations.map((item,i)=>({...item,count:item.count+setup.offset*(i+1)*47}));
  book.integrations.push({id:'CRM',name:'CRM 渠道管理',domain:'客户 / 合同 / 商机',status:'正常',count:248+setup.offset*36});
  book.projects = book.projects.map((p,i)=>({...p,spent:p.spent+setup.offset*(i+2),committed:p.committed+(id==='growth'?8:0)}));
  book.privacyConsent = id!=='global';
  book.restored = id==='closing';
  book.monthClosed = false;
  book.audit = [];
  const appendAudit = (time,actor,action,object,detail) => book.audit.push({id:'AUD-'+String(book.audit.length+1).padStart(4,'0'),time,actor,action,object,detail});
  book.journals.slice().reverse().forEach(j => {
    const o = book.orders.find(o=>o.id===j.order);
    appendAudit(o.date+' 10:30:00','供应链经理','订单审核通过',o.id,'客户档案、标准 SKU 与交付条件核对完成。');
    appendAudit(day(Number(o.date.slice(-2))+1)+' 14:20:00','供应链经理','订单发货',o.id,`${o.sku} 发出 ${o.qty} 台；履约仓库 ${productsBySku[o.sku].warehouse}。`);
    appendAudit(j.date+' 16:45:00','财务经理','对账并生成凭证',o.id,`${j.id}；${j.reason}；借贷合计 ¥${j.total.toFixed(2)}。`);
  });
  book.purchaseOrders.forEach(po=>appendAudit((po.receivedDate||po.date)+' 09:15:00','供应链经理',po.status==='已收货'?'采购收货入库':po.status==='待收货'?'采购审批通过':'创建采购申请',po.id,`${po.sku} × ${po.qty}；需求来源 ${po.sourceOrder}；${po.supplier}。`));
  book.workOrders.forEach(w=>appendAudit(w.date+' 11:10:00','制造运营部','生产工单更新',w.id,`${w.sku} × ${w.qty}；BOM ${w.bom}；${w.status}；需求来源 ${w.sourceOrder}。`));
  appendAudit('2026-09-27 08:45:00','数据平台主管','主数据日检','MDM-20260927','物料、客户、供应商、仓库与会计维度完成交叉校验。');
  book.audit.sort((a,b)=>b.time.localeCompare(a.time));
  // Opening balances reconcile with the current snapshot and completed material flows.
  book.stockMovements = [];
  book.products.forEach(p=>{
    const receipts = book.purchaseOrders.filter(po=>po.sku===p.sku&&po.status==='已收货');
    const completed = book.workOrders.filter(w=>w.sku===p.sku&&w.status==='已完工');
    const shipments = book.orders.filter(o=>o.sku===p.sku&&['待结算','已入账'].includes(o.status));
    p.openingStock = p.stock-receipts.reduce((n,po)=>n+po.qty,0)-completed.reduce((n,w)=>n+w.qty,0)+shipments.reduce((n,o)=>n+o.qty,0);
    // Historical opening stock includes any prior-period inventory already available.
    if(p.openingStock<0){const adjustment=-p.openingStock;p.openingStock=0;p.stock+=adjustment;}
    receipts.forEach(po=>book.stockMovements.push({id:'MV-'+po.id,sku:p.sku,source:po.id,sourceOrder:po.sourceOrder,type:'采购入库',qty:po.qty,date:po.receivedDate}));
    completed.forEach(w=>book.stockMovements.push({id:'MV-'+w.id,sku:p.sku,source:w.id,sourceOrder:w.sourceOrder,type:'生产入库',qty:w.qty,date:w.date}));
    shipments.forEach(o=>book.stockMovements.push({id:'MV-'+o.id,sku:p.sku,source:o.id,sourceOrder:o.id,type:'销售出库',qty:-o.qty,date:o.fulfilledDate}));
  });
  return book;
}

function validScenarioBook(value,id) {
  if(!value||value.version!==2||value.scenarioId!==id)return false;
  const arrays=['orders','products','purchaseOrders','journals','workOrders','customers','suppliers','quality','controls','integrations','projects','audit'];
  if(arrays.some(key=>!Array.isArray(value[key])))return false;
  if(value.products.length<4||value.customers.length<6||value.suppliers.length<3)return false;
  const productIds=new Set(value.products.map(p=>p.sku));
  return value.orders.every(o=>o&&productIds.has(o.sku)&&Number.isFinite(o.qty)&&Number.isFinite(o.price)&&Number.isFinite(o.variance)) && value.journals.every(j=>j&&Array.isArray(j.lines)&&value.orders.some(o=>o.id===j.order));
}

function readScenario(id) {
  if(!SCENARIOS.some(s=>s.id===id))id='global';
  try {
    const raw=localStorage.getItem(scenarioStorageKey(id));
    if(raw){const stored=JSON.parse(raw);if(validScenarioBook(stored,id))return stored;}
  } catch { storageAvailable=false; }
  return buildScenario(id);
}

function savePreferences() {
  try {
    localStorage.setItem(SCENARIO_PREFERENCES_KEY,JSON.stringify({activeScenario,uiTheme,uiDensity}));
    storageAvailable=true;
  } catch { storageAvailable=false; }
}

function persist() {
  try {
    state.version=2;
    state.scenarioId=activeScenario;
    localStorage.setItem(scenarioStorageKey(activeScenario),JSON.stringify(state));
    storageAvailable=true;
  } catch {
    storageAvailable=false;
    if(typeof toast==='function')toast('浏览器存储不可用，本次操作仅保留到页面关闭。');
  }
}

function setActiveScenario(id) {
  if(!SCENARIOS.some(s=>s.id===id))return false;
  if(id===activeScenario)return true;
  persist();
  activeScenario=id;
  state=readScenario(id);
  savePreferences();
  return true;
}

try {
  const saved=JSON.parse(localStorage.getItem(SCENARIO_PREFERENCES_KEY)||'null');
  if(saved){
    if(SCENARIOS.some(s=>s.id===saved.activeScenario))activeScenario=saved.activeScenario;
    if(SCENARIO_THEMES.includes(saved.uiTheme))uiTheme=saved.uiTheme;
    if(SCENARIO_DENSITIES.includes(saved.uiDensity))uiDensity=saved.uiDensity;
  }
} catch { storageAvailable=false; }
state=readScenario(activeScenario);
