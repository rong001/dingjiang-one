/* Operational workspaces backed by the active business book. */
const opSum = (rows, value) => rows.reduce((total, row) => total + Number(value(row) || 0), 0);
const opNumber = value => Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const opProduct = sku => product(sku) || { sku, name: sku || '未指定产品', cost: 0, stock: 0, supplier: '待指定', warehouse: '待指定' };
const opAttributes = id => `data-id="${esc(id)}"`;
const opLink = (label, action, id) => `<button class="text-btn highlight" data-action="${action}" ${opAttributes(id)}>${esc(label)}</button>`;
const opMeta = (primary, secondary = '') => `<strong>${esc(primary)}</strong>${secondary ? `<small>${esc(secondary)}</small>` : ''}`;
const opDetails = rows => `<div class="detail-grid">${rows.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
const opTable = (columns, rows, empty = '暂无记录。') => `<div class="table-wrap"><table><thead><tr>${columns.map(column => `<th scope="col">${esc(column)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>${rows.length ? '' : `<div class="empty">${esc(empty)}</div>`}</div>`;
const opPanel = (title, note, body, extraClass = '') => `<section class="panel table-panel ${extraClass}"><div class="panel-head"><h2>${esc(title)}</h2><small>${esc(note)}</small></div>${body}</section>`;
const opSource = source => {
  if (!source) return '<span class="subtext">库存补给</span>';
  if (state.orders.some(order => order.id === source)) return opLink(source, 'order-detail', source);
  if (state.purchaseOrders.some(order => order.id === source)) return opLink(source, 'po-detail', source);
  if (state.workOrders.some(order => order.id === source)) return opLink(source, 'manufacturing-detail', source);
  return `<span class="mono">${esc(source)}</span>`;
};
const opCustomerOrders = customer => state.orders.filter(order => order.customerId === customer.id || order.customer === customer.name || (customer.channel && order.channel === customer.channel));
const opSupplierOrders = supplier => state.purchaseOrders.filter(order => order.supplierId === supplier.id || order.supplier === supplier.name || (!order.supplierId && opProduct(order.sku).supplierId === supplier.id));
const opOrderRows = orders => opTable(['订单', '渠道 / 产品', '数量', '订单金额', '状态'], orders.map(order => `<tr><td>${opLink(order.id, 'order-detail', order.id)}<small>${esc(order.date || '—')}</small></td><td>${opMeta(order.channel, opProduct(order.sku).name)}</td><td>${opNumber(order.qty)}</td><td>${money(amount(order))}</td><td>${statusBadge(order.status)}</td></tr>`), '暂无关联订单。');
const opPurchaseRows = orders => opTable(['采购单 / 供应商', '产品', '需求来源', '数量 / 金额', '预计到货', '状态', '操作'], orders.map(order => {
  const p = opProduct(order.sku);
  return `<tr><td>${opLink(order.id, 'po-detail', order.id)}<small>${esc(order.supplier || p.supplier)}</small></td><td>${opMeta(p.name, order.sku)}</td><td>${opSource(order.sourceOrder)}</td><td>${opNumber(order.qty)} ${esc(p.unit || '件')}<small>${money(order.qty * (order.unitCost ?? p.cost))}</small></td><td>${esc(order.expectedDate || '待安排')}</td><td>${statusBadge(order.status)}</td><td>${order.status === '已收货' ? btn('收货记录', 'po-detail', 'small secondary', opAttributes(order.id)) : btn(order.status === '待审核' ? '审批采购' : '确认收货', 'po-next', 'small secondary', opAttributes(order.id))}</td></tr>`;
}), '暂无采购订单。可从产品需求发起采购申请。');
const opMovementRows = movements => opTable(['日期 / 流水号', '产品 / 仓库', '业务类型', '来源单据', '入库', '出库'], movements.map(movement => {
  const p = opProduct(movement.sku);
  return `<tr><td>${esc(movement.date || '—')}<small>${esc(movement.id)}</small></td><td>${opMeta(p.name, movement.warehouse || p.warehouse)}</td><td>${badge(esc(movement.type), movement.qty > 0 ? 'good' : '')}</td><td>${opSource(movement.source)}${movement.sourceOrder && movement.sourceOrder !== movement.source ? `<small>需求 ${opSource(movement.sourceOrder)}</small>` : ''}</td><td class="positive">${movement.qty > 0 ? '+' + opNumber(movement.qty) : '—'}</td><td>${movement.qty < 0 ? opNumber(-movement.qty) : '—'}</td></tr>`;
}), '暂无库存流水。收货、成品入库或销售出库后将形成记录。');

function customersPage() {
  const customers = state.customers || [];
  const active = customers.filter(customer => opCustomerOrders(customer).length > 0);
  const distribution = customers.filter(customer => !customer.channel);
  const rows = customers.map(customer => {
    const orders = opCustomerOrders(customer);
    const pending = orders.filter(order => order.status === '待结算');
    return `<tr><td>${opLink(customer.name, 'customer-detail', customer.id)}<small>${esc(customer.id)}</small></td><td>${opMeta(customer.region, customer.tier)}</td><td>${esc(customer.owner || '待指定')}</td><td>${opNumber(orders.length)} 笔<small>${money(opSum(orders, amount))}</small></td><td>${money(opSum(pending, net))}</td><td>${esc(customer.terms)}<small>${customer.creditLimit ? '授信额度 ' + money(customer.creditLimit) : '按渠道账单结算'}</small></td><td>${badge(esc(customer.status), customer.status === '正常' ? 'good' : 'warn')}</td><td>${btn('客户档案', 'customer-detail', 'small secondary', opAttributes(customer.id))}</td></tr>`;
  });
  return head('客户档案', 'CUSTOMER ACCOUNTS', '统一客户关系、交易记录与结算条款。', btn(icon('search') + '搜索订单', 'search')) +
    kpis([
      ['客户账户', opNumber(customers.length), '个', `${distribution.length} 家分销客户 · ${customers.length - distribution.length} 个零售账户`, 'users'],
      ['有交易客户', opNumber(active.length), '个', '按当前账簿订单汇总', 'orders'],
      ['待结算净额', money(opSum(state.orders.filter(order => order.status === '待结算'), net)), '', '扣除渠道费、履约费及调整', 'finance']
    ]) + opPanel('客户与结算关系', `${customers.length} 个账户`, opTable(['客户 / 编号', '区域 / 层级', '客户负责人', '订单数 / 金额', '待结算净额', '结算条款', '状态', '操作'], rows));
}

function channelsPage() {
  const channels = [...new Set(state.orders.map(order => order.channel))].map(name => {
    const orders = state.orders.filter(order => order.channel === name);
    const posted = orders.filter(order => order.status === '已入账');
    return { name, orders, posted, volume: opSum(orders, amount), pending: orders.filter(order => order.status === '待结算'), quantity: opSum(orders, order => order.qty) };
  }).sort((a, b) => b.volume - a.volume);
  const total = opSum(channels, channel => channel.volume);
  const rows = channels.map(channel => `<tr><td>${opLink(channel.name, 'channel-detail', channel.name)}<small>${esc([...new Set(channel.orders.map(order => order.region))].join(' / '))}</small></td><td>${businessLabel(channel.orders[0].biz)}</td><td>${channel.orders.length} 笔<small>${opNumber(channel.quantity)} 件</small></td><td>${money(channel.volume)}<div class="bar progress"><span style="width:${total ? Math.round(channel.volume / total * 100) : 0}%"></span></div></td><td>${money(opSum(channel.pending, net))}<small>${channel.pending.length} 笔待核对</small></td><td>${money(opSum(channel.posted, profit))}<small>${channel.posted.length} 笔已入账订单</small></td><td>${btn('渠道明细', 'channel-detail', 'small secondary', opAttributes(channel.name))}</td></tr>`);
  return head('渠道经营', 'CHANNEL PERFORMANCE', '按渠道查看订单规模、结算进度与贡献利润。') +
    kpis([
      ['经营渠道', channels.length, '个', '平台、直营与经销商', 'globe'],
      ['订单总额', money(total), '', '人民币 · 不含税', 'orders'],
      ['渠道待结算', money(opSum(state.orders.filter(order => order.status === '待结算'), net)), '', '当前待核对净额', 'finance']
    ]) + opPanel('渠道经营明细', '贡献利润按已入账订单计算', opTable(['渠道 / 区域', '业务类型', '订单 / 数量', '订单金额 / 占比', '待结算净额', '已入账贡献利润', '操作'], rows));
}

function procurementPage() {
  const orders = state.purchaseOrders || [];
  const reviewing = orders.filter(order => order.status === '待审核');
  const incoming = orders.filter(order => order.status === '待收货');
  const received = orders.filter(order => order.status === '已收货');
  return head('采购管理', 'PROCUREMENT', '由业务需求驱动采购，贯通审批、到货与库存。', btn(icon('plus') + '创建采购单', 'new-po', 'primary')) +
    kpis([
      ['待审批采购', reviewing.length, '笔', money(opSum(reviewing, order => order.qty * (order.unitCost ?? opProduct(order.sku).cost))), 'orders'],
      ['采购在途', opNumber(opSum(incoming, order => order.qty)), '件', `${incoming.length} 笔订单待收货`, 'truck'],
      ['已收货数量', opNumber(opSum(received, order => order.qty)), '件', `${received.length} 笔采购完成入库`, 'check']
    ]) + opPanel('采购订单', '点击需求来源追溯销售订单', opPurchaseRows(orders));
}

function warehousePage() {
  const products = state.products || [];
  const movements = [...(state.stockMovements || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  const rows = products.map(p => {
    const incoming = opSum(state.purchaseOrders.filter(order => order.sku === p.sku && order.status === '待收货'), order => order.qty);
    const pending = opSum(state.orders.filter(order => order.sku === p.sku && order.status === '待发货'), order => order.qty);
    const cover = p.daily ? (p.stock / p.daily).toFixed(1) : '—';
    return `<tr><td>${opLink(p.name, 'stock-ledger', p.sku)}<small>${esc(p.sku)}</small></td><td>${esc(p.warehouse)}</td><td><strong>${opNumber(p.stock)}</strong><small>安全库存 ${opNumber(p.safety)}</small></td><td>${opNumber(pending)}</td><td>${opNumber(incoming)}</td><td>${cover} 天</td><td>${p.stock < p.safety ? badge('补货关注', 'warn') : badge('库存正常', 'good')}</td><td><div class="actions">${btn('库存流水', 'stock-ledger', 'small secondary', opAttributes(p.sku))}${btn('补货', 'new-po', 'small', `data-sku="${esc(p.sku)}"`)}</div></td></tr>`;
  });
  return head('仓储与库存', 'WAREHOUSE & INVENTORY', '查看可用库存、采购在途及每一笔收发记录。', btn(icon('list') + '全部库存流水', 'stock-ledger', '', opAttributes('all'))) +
    kpis([
      ['可用库存', opNumber(opSum(products, p => p.stock)), '件', `${new Set(products.map(p => p.warehouse)).size} 个履约仓库`, 'supply'],
      ['采购在途', opNumber(opSum(state.purchaseOrders.filter(order => order.status === '待收货'), order => order.qty)), '件', '仅计入已审批、未收货采购', 'truck'],
      ['库存流水', movements.length, '笔', '采购入库 · 生产入库 · 销售出库', 'list']
    ]) + opPanel('库存余额', '待发货需求未从可用库存中预扣', opTable(['产品 / SKU', '仓库', '可用 / 安全', '待发货需求', '采购在途', '覆盖天数', '状态', '操作'], rows)) +
    opPanel('最近收发记录', '按业务日期排序', opMovementRows(movements.slice(0, 12)), 'tabs-spacer');
}

function productsPage() {
  const products = state.products || [];
  const rows = products.map(p => {
    const orders = state.orders.filter(order => order.sku === p.sku);
    return `<tr><td>${opLink(p.name, 'product-detail', p.sku)}<small>${esc(p.sku)} · ${esc(p.family)}</small></td><td>${esc(p.bom)}</td><td>${money(p.price)}<small>标准成本 ${money(p.cost)}</small></td><td>${opNumber(p.stock)} ${esc(p.unit || '件')}<small>${esc(p.warehouse)}</small></td><td>${esc(p.supplier)}<small>交付周期 ${opNumber(p.leadDays)} 天</small></td><td>${orders.length} 笔<small>${opNumber(opSum(orders, order => order.qty))} 件</small></td><td><div class="actions">${btn('产品档案', 'product-detail', 'small secondary', opAttributes(p.sku))}${btn('查看 BOM', 'bom', 'small', `data-sku="${esc(p.sku)}"`)}</div></td></tr>`;
  });
  return head('产品与物料', 'PRODUCT MASTER', '连接产品编码、BOM 基线、供应关系与业务单据。') +
    kpis([
      ['产品档案', products.length, '个 SKU', `${new Set(products.map(p => p.family)).size} 个产品系列`, 'layers'],
      ['BOM 基线', new Set(products.map(p => p.bom)).size, '个', '生产工单按版本引用', 'factory'],
      ['库存标准成本', money(opSum(products, p => p.stock * p.cost)), '', '可用数量 × 固定标准成本', 'finance']
    ]) + opPanel('产品主数据', '人民币 · 不含税', opTable(['产品 / 系列', 'BOM 版本', '销售单价 / 成本', '库存 / 仓库', '供应商', '关联订单', '操作'], rows));
}

function qualityPage() {
  const pending = state.workOrders.filter(order => order.status === '待质检');
  const completed = state.workOrders.filter(order => order.status === '已完工');
  const progressing = state.workOrders.filter(order => ['待排产', '生产中'].includes(order.status));
  const rows = [...pending, ...progressing, ...completed].map(order => `<tr><td>${opLink(order.id, 'manufacturing-detail', order.id)}<small>${esc(order.lot || '待生成批次')}</small></td><td>${opMeta(opProduct(order.sku).name, 'BOM ' + order.bom)}</td><td>${opSource(order.sourceOrder)}</td><td>${opNumber(order.qty)} 台</td><td>${esc(order.line)}</td><td>${statusBadge(order.status)}</td><td>${order.status === '待质检' ? btn('质检并入库', 'mo-next', 'small primary', opAttributes(order.id)) : order.status === '已完工' ? btn('追溯批次', 'manufacturing-detail', 'small secondary', opAttributes(order.id)) : btn('查看工单', 'manufacturing-detail', 'small secondary', opAttributes(order.id))}</td></tr>`);
  return head('质量管理', 'QUALITY OPERATIONS', '承接生产报工，核对质量结果并追溯入库批次。') +
    kpis([
      ['待质检工单', pending.length, '笔', `${opNumber(opSum(pending, order => order.qty))} 台待确认`, 'quality'],
      ['在制工单', progressing.length, '笔', '排产与生产中工单', 'factory'],
      ['已入库成品', opNumber(opSum(completed, order => order.qty)), '台', `${completed.length} 个工单完成质检入库`, 'check']
    ]) + opPanel('质量与批次记录', '质检入库按当前工单全批合格数量确认', opTable(['工单 / 批次', '产品 / BOM', '需求来源', '数量', '执行单元', '状态', '操作'], rows));
}

function receivablesPage() {
  const pending = state.orders.filter(order => order.status === '待结算');
  const posted = state.orders.filter(order => order.status === '已入账');
  const rows = [...pending, ...posted].map(order => `<tr><td>${opLink(order.settlementId || 'ST-' + order.id.replace('SO-', ''), 'order-detail', order.id)}<small>${esc(order.id)}</small></td><td>${opMeta(order.customer, order.channel)}</td><td>${esc(order.terms || (order.biz === 'b2b' ? '交付后结算' : '平台结算'))}</td><td>${money(amount(order))}</td><td>${money(net(order))}<small>费用及调整 ${money(fee(order) + freight(order) + order.variance)}</small></td><td>${order.variance ? badge('调整 ' + money(order.variance), 'warn') : badge('无差异', 'good')}</td><td>${statusBadge(order.status)}</td><td>${order.status === '待结算' ? btn('核对结算', 'reconcile', 'small secondary', opAttributes(order.id)) : btn('查看凭证', 'journal-detail', 'small secondary', opAttributes(order.id))}</td></tr>`);
  return head('应收与结算', 'RECEIVABLES & SETTLEMENT', '汇总已履约订单的待结算净额与入账凭证。', btn(icon('check') + '月结检查', 'close-month', 'primary')) +
    kpis([
      ['待结算净额', money(opSum(pending, net)), '', `${pending.length} 笔已履约订单待核对`, 'finance'],
      ['已入账净额', money(opSum(posted, net)), '', `${posted.length} 笔订单已生成凭证`, 'receipt'],
      ['待核对调整', money(opSum(pending, order => order.variance)), '', '核实原因后计入销售费用', 'alert']
    ]) + opPanel('结算与凭证台账', '净额 = 订单金额 − 平台费 − 履约费 − 调整', opTable(['结算单 / 订单', '结算主体 / 渠道', '结算条款', '订单金额', '结算净额', '费用调整', '状态', '操作'], rows), '');
}

function suppliersPage() {
  const suppliers = state.suppliers || [];
  const rows = suppliers.map(supplier => {
    const orders = opSupplierOrders(supplier);
    const incoming = orders.filter(order => order.status === '待收货');
    return `<tr><td>${opLink(supplier.name, 'supplier-detail', supplier.id)}<small>${esc(supplier.id)} · ${esc(supplier.region)}</small></td><td>${esc(supplier.category)}</td><td>${supplier.leadDays} 天</td><td>${supplier.score.toFixed(1)}<small>${esc(supplier.sla)}</small></td><td>${orders.length} 笔<small>${money(opSum(orders, order => order.qty * (order.unitCost ?? opProduct(order.sku).cost)))}</small></td><td>${opNumber(opSum(incoming, order => order.qty))} 件<small>${incoming.length} 笔待收货</small></td><td>${badge(esc(supplier.status), supplier.status === '合格' ? 'good' : 'warn')}</td><td>${btn('供应商档案', 'supplier-detail', 'small secondary', opAttributes(supplier.id))}</td></tr>`;
  });
  return head('供应商管理', 'SUPPLIER RELATIONSHIPS', '管理供货范围、交付要求与采购往来。') +
    kpis([
      ['供应商档案', suppliers.length, '家', `${suppliers.filter(supplier => supplier.status === '合格').length} 家合格供应商`, 'building'],
      ['平均评估分', suppliers.length ? (opSum(suppliers, supplier => supplier.score) / suppliers.length).toFixed(1) : '—', '', '当前供应商评估结果', 'quality'],
      ['待收货采购', state.purchaseOrders.filter(order => order.status === '待收货').length, '笔', '关注到货日期与供应商履约', 'truck']
    ]) + opPanel('供应商与履约', '点击名称查看关联产品与采购订单', opTable(['供应商 / 区域', '供货范围', '交付周期', '评估分 / SLA', '采购往来', '采购在途', '状态', '操作'], rows));
}

function integrationsPage() {
  const integrations = state.integrations || [];
  const configured = integrations.filter(item => item.connectionConfig?.endpoint);
  const rows = integrations.map(item => {
    const latest = state.audit.find(entry => entry.object === item.id && entry.action !== '登记连接配置');
    return `<tr><td>${opLink(item.name, 'integration-config', item.id)}<small>${esc(item.id)}</small></td><td>${esc(item.domain)}</td><td>${badge(item.connectionConfig?.endpoint ? '配置已登记' : '连接待配置', item.connectionConfig?.endpoint ? 'purple' : '')}</td><td>${opNumber(item.count)}</td><td>${latest ? opMeta(latest.action, latest.time) : '<span class="subtext">暂无执行记录</span>'}</td><td><div class="actions">${btn('连接配置', 'integration-config', 'small secondary', opAttributes(item.id))}${btn('最近批次', 'integration-batch', 'small', opAttributes(item.id))}</div></td></tr>`;
  });
  return head('接口集成', 'INTEGRATION DIRECTORY', '集中维护连接配置与业务消息处理记录。') +
    kpis([
      ['接口目录', integrations.length, '项', '财务、仓储、制造与客户系统', 'link'],
      ['待配置连接', integrations.length - configured.length, '项', '配置登记后另行安排联调', 'settings'],
      ['消息记录', opNumber(opSum(integrations, item => item.count)), '条', '当前账簿累计记录数量', 'database']
    ]) + opPanel('业务系统连接', '配置登记不代表连接已验证', opTable(['系统', '集成对象', '连接配置', '消息记录', '最近批次', '操作'], rows));
}

Object.assign(actions, {
  'customer-detail': element => {
    const customer = (state.customers || []).find(item => item.id === element.dataset.id);
    if (!customer) return toast('客户档案不存在。');
    const orders = opCustomerOrders(customer);
    modal(esc(customer.name), opDetails([
      ['客户编号', customer.id], ['客户负责人', customer.owner || '待指定'], ['区域 / 层级', `${customer.region} / ${customer.tier}`],
      ['结算条款', customer.terms], ['授信额度', customer.creditLimit ? money(customer.creditLimit) : '平台结算'], ['交易总额', money(opSum(orders, amount))]
    ]) + '<h3 class="section-title">关联订单</h3>' + opOrderRows(orders), btn('关闭', 'close'));
  },
  'channel-detail': element => {
    const name = element.dataset.id;
    const orders = state.orders.filter(order => order.channel === name);
    if (!orders.length) return toast('该渠道暂无订单。');
    modal(esc(name) + ' · 渠道经营', opDetails([
      ['订单数量', orders.length + ' 笔'], ['订单金额', money(opSum(orders, amount))],
      ['待结算净额', money(opSum(orders.filter(order => order.status === '待结算'), net))], ['已入账净额', money(opSum(orders.filter(order => order.status === '已入账'), net))]
    ]) + opOrderRows(orders), btn('关闭', 'close'));
  },
  'po-detail': element => {
    const order = state.purchaseOrders.find(item => item.id === element.dataset.id);
    if (!order) return toast('采购订单不存在。');
    const p = opProduct(order.sku);
    const movements = (state.stockMovements || []).filter(item => item.source === order.id);
    modal(esc(order.id) + ' · 采购详情', opDetails([
      ['供应商', order.supplier || p.supplier], ['采购产品', p.name], ['采购数量', opNumber(order.qty) + ' ' + (p.unit || '件')],
      ['采购金额', money(order.qty * (order.unitCost ?? p.cost))], ['收货仓库', order.warehouse || p.warehouse], ['当前状态', order.status],
      ['预计到货', order.expectedDate || '待安排'], ['收货日期', order.receivedDate || '尚未收货']
    ]) + `<div class="list-row"><span>需求来源</span>${opSource(order.sourceOrder)}</div><p class="subtext">${esc(order.reason || '库存补给')}</p>` +
      (movements.length ? '<h3 class="section-title">关联库存流水</h3>' + opMovementRows(movements) : ''),
      btn('关闭', 'close') + (order.status === '已收货' ? '' : btn(order.status === '待审核' ? '审批采购' : '确认收货', 'po-next', 'primary', opAttributes(order.id))));
  },
  'stock-ledger': element => {
    const sku = element.dataset.id;
    const p = sku === 'all' ? null : product(sku);
    if (sku !== 'all' && !p) return toast('产品档案不存在。');
    const movements = (state.stockMovements || []).filter(item => !p || item.sku === sku).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const hasOpening = p && Number.isFinite(p.openingStock);
    const bookBalance = hasOpening ? p.openingStock + opSum(movements, item => item.qty) : null;
    const balance = p ? opDetails([
      ['期初数量', hasOpening ? opNumber(p.openingStock) : '待登记'], ['入库数量', opNumber(opSum(movements.filter(item => item.qty > 0), item => item.qty))],
      ['出库数量', opNumber(-opSum(movements.filter(item => item.qty < 0), item => item.qty))], ['当前可用', opNumber(p.stock)]
    ]) + (hasOpening ? `<div class="list-row"><span>期初 + 入库 − 出库</span><strong>${opNumber(bookBalance)} ${badge(bookBalance === p.stock ? '余额一致' : '余额待核对', bookBalance === p.stock ? 'good' : 'warn')}</strong></div>` : '') : '';
    modal(p ? esc(p.name) + ' · 库存流水' : '全部库存流水', balance + opMovementRows(movements), btn('关闭', 'close'));
  },
  'product-detail': element => {
    const p = product(element.dataset.id);
    if (!p) return toast('产品档案不存在。');
    modal(esc(p.name) + ' · 产品档案', opDetails([
      ['产品编码', p.sku], ['产品系列', p.family], ['BOM 基线', p.bom], ['计量单位', p.unit || '件'],
      ['销售单价', money(p.price)], ['标准成本', money(p.cost)], ['主要供应商', p.supplier], ['履约仓库', p.warehouse]
    ]) + '<h3 class="section-title">关联订单</h3>' + opOrderRows(state.orders.filter(order => order.sku === p.sku)),
      btn('关闭', 'close') + btn('查看 BOM', 'bom', 'primary', `data-sku="${esc(p.sku)}"`));
  },
  'manufacturing-detail': element => {
    const order = state.workOrders.find(item => item.id === element.dataset.id);
    if (!order) return toast('生产工单不存在。');
    const movements = (state.stockMovements || []).filter(item => item.source === order.id);
    const records = state.audit.filter(entry => entry.object === order.id);
    modal(esc(order.id) + ' · 工单追溯', opDetails([
      ['产品', opProduct(order.sku).name], ['生产数量', opNumber(order.qty) + ' 台'], ['BOM 版本', order.bom], ['执行单元', order.line],
      ['当前状态', order.status], ['成品批次', order.lot || '待生成'], ['计划完成', order.dueDate || '待安排'], ['责任团队', order.owner || '制造运营部']
    ]) + `<div class="list-row"><span>需求来源</span>${opSource(order.sourceOrder)}</div>` +
      (movements.length ? '<h3 class="section-title">成品入库记录</h3>' + opMovementRows(movements) : '') +
      '<h3 class="section-title">操作记录</h3>' + (records.length ? records.slice(0, 6).map(entry => `<div class="list-row"><div><strong>${esc(entry.action)}</strong><div class="subtext">${esc(entry.detail)}</div><small>${esc(entry.time)} · ${esc(entry.actor)}</small></div></div>`).join('') : '<div class="empty">暂无操作记录。</div>'),
      btn('关闭', 'close') + (order.status === '待质检' ? btn('质检并入库', 'mo-next', 'primary', opAttributes(order.id)) : ''));
  },
  'supplier-detail': element => {
    const supplier = (state.suppliers || []).find(item => item.id === element.dataset.id);
    if (!supplier) return toast('供应商档案不存在。');
    const products = state.products.filter(p => p.supplierId === supplier.id || p.supplier === supplier.name);
    modal(esc(supplier.name), opDetails([
      ['供应商编码', supplier.id], ['所属区域', supplier.region], ['供货类别', supplier.category], ['交付周期', supplier.leadDays + ' 天'],
      ['质量与服务要求', supplier.sla], ['评估状态', `${supplier.status} · ${supplier.score.toFixed(1)} 分`]
    ]) + '<h3 class="section-title">关联产品</h3><div class="actions">' +
      (products.length ? products.map(p => btn(esc(p.sku), 'product-detail', 'small secondary', opAttributes(p.sku))).join('') : '<span class="subtext">暂无关联产品</span>') +
      '</div><h3 class="section-title tabs-spacer">采购往来</h3>' + opPurchaseRows(opSupplierOrders(supplier)), btn('关闭', 'close'));
  },
  'integration-config': element => {
    const integration = state.integrations.find(item => item.id === element.dataset.id);
    if (!integration) return toast('接口目录不存在。');
    const config = integration.connectionConfig || {};
    if (!allowed('admin')) {
      modal(esc(integration.name) + ' · 连接配置', opDetails([
        ['集成对象', integration.domain], ['连接地址', config.endpoint || '待配置'], ['责任人', config.owner || '待指定'], ['执行频率', config.frequency || '手动触发']
      ]) + '<p class="subtext">连接配置由 IT 负责人维护。</p>', btn('关闭', 'close'));
      return;
    }
    formModal(esc(integration.name) + ' · 连接配置', `<div class="form-grid">${field('连接地址', `<input class="input" name="endpoint" type="url" maxlength="240" value="${esc(config.endpoint || '')}" placeholder="https://api.company.com" required>`, true)}${field('责任人', `<input class="input" name="owner" maxlength="40" value="${esc(config.owner || '')}" placeholder="请输入连接负责人" required>`)}${field('执行频率', `<select class="input" name="frequency">${['手动触发', '每小时', '每日'].map(value => `<option ${config.frequency === value ? 'selected' : ''}>${value}</option>`).join('')}</select>`)}</div><p class="subtext">登记连接参数后安排联调。请勿在地址中填写密码或访问令牌。</p>`, '保存配置', values => {
      if (!guard('admin')) return;
      let endpoint;
      try { endpoint = new URL(values.endpoint); } catch { throw Error('请输入有效的 HTTP 或 HTTPS 连接地址。'); }
      if (!['https:', 'http:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw Error('连接地址应使用 HTTP 或 HTTPS，且不包含账号、密码、查询参数或片段。');
      const owner = values.owner.trim();
      if (!owner) throw Error('请填写连接负责人。');
      if (!['手动触发', '每小时', '每日'].includes(values.frequency)) throw Error('请选择有效的执行频率。');
      integration.connectionConfig = { endpoint: endpoint.href, owner, frequency: values.frequency, updatedAt: new Date().toLocaleString('sv-SE') };
      log('登记连接配置', integration.id, `${integration.name}；责任人 ${owner}；执行频率 ${values.frequency}；待联调。`);
      finish('连接配置已保存，待安排联调。');
    });
  },
  'integration-batch': element => {
    const integration = state.integrations.find(item => item.id === element.dataset.id);
    if (!integration) return toast('接口目录不存在。');
    const records = state.audit.filter(entry => entry.object === integration.id && entry.action !== '登记连接配置');
    modal(esc(integration.name) + ' · 最近批次', opDetails([
      ['集成对象', integration.domain], ['累计消息记录', opNumber(integration.count)], ['连接配置', integration.connectionConfig?.endpoint ? '配置已登记 · 待联调' : '连接待配置'], ['批次记录', records.length + ' 条']
    ]) + opTable(['时间', '操作', '处理详情'], records.slice(0, 10).map(entry => `<tr><td>${esc(entry.time)}</td><td>${esc(entry.action)}</td><td class="line-clamp">${esc(entry.detail)}</td></tr>`), '暂无批次执行记录。完成连接配置与联调后可开展同步。'), btn('关闭', 'close') + btn('连接配置', 'integration-config', 'primary', opAttributes(integration.id)));
  }
});
