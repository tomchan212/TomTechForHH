(function () {
  'use strict';

  const STORAGE_KEYS = {
    residents: 'yumcha_residents',
    restricted: 'yumcha_restricted',
    outpatient: 'yumcha_outpatient',
    orders: 'yumcha_orders'
  };

  const MENU_ITEMS = [
    '蝦餃', '布拉腸', '燒賣', '流沙包', '上湯鮮竹卷', '小籠包', '牛肉球', '鮮蝦腐皮卷',
    '棉花雞', '叉燒包', '牛肉腸', 'XO醬蘿蔔糕', '叉燒腸', '馬拉糕', '蝦腸', '煎蘿蔔糕', '鳳爪'
  ];

  let state = {
    residents: [],
    restricted: [],
    outpatient: [],
    orders: [],
    currentResident: null,
    currentMealType: '正餐',
    currentSelections: [],
    currentRemark: '',
    editingOrderId: null
  };

  function loadFromStorage() {
    try {
      state.residents = JSON.parse(localStorage.getItem(STORAGE_KEYS.residents) || '[]');
      state.restricted = JSON.parse(localStorage.getItem(STORAGE_KEYS.restricted) || '[]');
      state.outpatient = JSON.parse(localStorage.getItem(STORAGE_KEYS.outpatient) || '[]');
      state.orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || '[]');
    } catch (e) {
      state.residents = [];
      state.restricted = [];
      state.outpatient = [];
      state.orders = [];
    }
    // 若儲存的是舊範例院友名單，自動清空
    var oldSample = ['陳大文', '李芳芳', '黃美玲', '張志明', '王婆婆'];
    if (state.residents.length === oldSample.length && state.residents.every(function (name, i) { return name === oldSample[i]; })) {
      state.residents = [];
      state.orders = [];
      saveAll();
    }
  }

  function saveAll() {
    localStorage.setItem(STORAGE_KEYS.residents, JSON.stringify(state.residents));
    localStorage.setItem(STORAGE_KEYS.restricted, JSON.stringify(state.restricted));
    localStorage.setItem(STORAGE_KEYS.outpatient, JSON.stringify(state.outpatient));
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
  }

  function showToast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(function () {
      el.classList.add('hidden');
    }, 2500);
  }

  function switchTab(tabId) {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    var panel = document.getElementById('panel-' + tabId);
    var btn = document.querySelector('.nav-btn[data-tab="' + tabId + '"]');
    if (panel) panel.classList.add('active');
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  }

  function renderListNames(containerId, list) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<span class="list-name list-name-empty">（暫無）</span>';
      return;
    }
    var first = '<span class="list-name">姓名： ' + escapeHtml(list[0]) + '</span>';
    var rest = list.slice(1).map(function (name) {
      return '<span class="list-name">' + escapeHtml(name) + '</span>';
    }).join('');
    el.innerHTML = first + rest;
  }

  function renderListTables() {
    renderListNames('list-names-residents', state.residents);
    renderListNames('list-names-restricted', state.restricted);
    renderListNames('list-names-outpatient', state.outpatient);
    var trEl = document.getElementById('textarea-restricted');
    var toEl = document.getElementById('textarea-outpatient');
    if (trEl) trEl.value = state.restricted.join('\n');
    if (toEl) toEl.value = state.outpatient.join('\n');
  }

  function parseLines(text) {
    return (text || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function parseTxtFile(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var text = reader.result || '';
      var names = text.split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
      cb(names);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function renderDatalist() {
    var dl = document.getElementById('resident-datalist');
    if (!dl) return;
    dl.innerHTML = state.residents.map(function (name) {
      return '<option value="' + escapeHtml(name) + '">';
    }).join('');
  }

  function showOrderSelect() {
    document.getElementById('order-select-screen').classList.remove('hidden');
    document.getElementById('order-cart-screen').classList.add('hidden');
    document.getElementById('resident-search').value = '';
    state.currentResident = null;
    state.currentSelections = [];
    state.currentRemark = '';
    state.editingOrderId = null;
  }

  function showOrderCart(name, orderToEdit) {
    state.currentResident = name;
    state.editingOrderId = orderToEdit ? orderToEdit.id : null;
    if (orderToEdit) {
      state.currentMealType = orderToEdit.mealType || '正餐';
      state.currentSelections = (orderToEdit.items || []).slice();
      state.currentRemark = orderToEdit.remark || '';
    } else {
      state.currentMealType = '正餐';
      state.currentSelections = [];
      state.currentRemark = '';
    }
    document.getElementById('order-select-screen').classList.add('hidden');
    document.getElementById('order-cart-screen').classList.remove('hidden');
    document.getElementById('cart-resident-name').textContent = name;
    document.getElementById('meal-regular').classList.toggle('active', state.currentMealType === '正餐');
    document.getElementById('meal-pureed').classList.toggle('active', state.currentMealType === '正餐剪碎');
    document.getElementById('remark-textarea').value = state.currentRemark;
    renderItemButtons();
  }

  function renderItemButtons() {
    var grid = document.getElementById('items-grid');
    if (!grid) return;
    grid.innerHTML = MENU_ITEMS.map(function (item) {
      var selected = state.currentSelections.indexOf(item) !== -1;
      return '<button type="button" class="item-btn' + (selected ? ' selected' : '') + '" data-item="' + escapeHtml(item) + '">' + escapeHtml(item) + '</button>';
    }).join('');
  }

  function renderOrdersTable() {
    var tbody = document.getElementById('tbody-orders');
    if (!tbody) return;
    tbody.innerHTML = state.orders.map(function (o) {
      var itemsStr = (o.items || []).join(' • ');
      return '<tr data-order-id="' + escapeHtml(o.id) + '">' +
        '<td>' + escapeHtml(o.residentName) + '</td>' +
        '<td>' + escapeHtml(itemsStr) + '</td>' +
        '<td>' + escapeHtml(o.remark || '') + '</td>' +
        '<td>' + escapeHtml(o.status || '已確認') + '</td>' +
        '<td><button type="button" class="btn-edit" data-action="edit">編輯</button> <button type="button" class="btn-delete" data-action="delete">刪除</button></td>' +
        '</tr>';
    }).join('');
  }

  function openRemarkModal() {
    document.getElementById('remark-textarea').value = state.currentRemark;
    document.getElementById('remark-modal').classList.remove('hidden');
    document.getElementById('remark-modal').setAttribute('aria-hidden', 'false');
  }

  function closeRemarkModal() {
    state.currentRemark = document.getElementById('remark-textarea').value.trim();
    document.getElementById('remark-modal').classList.add('hidden');
    document.getElementById('remark-modal').setAttribute('aria-hidden', 'true');
  }

  function generateId() {
    return 'o' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
  }

  function deriveStatus(remark, mealType) {
    if (remark && remark.indexOf('未落住') !== -1) return '未落住';
    if (remark && remark.indexOf('半份') !== -1) return '半份';
    if (mealType === '正餐剪碎' || (remark && remark.indexOf('純碎餐') !== -1)) return '剪碎';
    return '已確認';
  }

  function submitOrder() {
    var name = state.currentResident;
    var items = state.currentSelections.slice();
    var remark = state.currentRemark.trim();
    var mealType = state.currentMealType;
    if (!name) {
      showToast('請先選擇院友');
      return;
    }
    if (items.length === 0) {
      showToast('請至少選擇一項點心');
      return;
    }
    var status = deriveStatus(remark, mealType);
    if (state.editingOrderId) {
      var idx = state.orders.findIndex(function (o) { return o.id === state.editingOrderId; });
      if (idx !== -1) {
        state.orders[idx] = { id: state.orders[idx].id, residentName: name, mealType: mealType, items: items, remark: remark, status: status };
      }
      showToast('訂單已更新');
    } else {
      state.orders.push({ id: generateId(), residentName: name, mealType: mealType, items: items, remark: remark, status: status });
      showToast('落單成功');
    }
    saveAll();
    renderOrdersTable();
    showOrderSelect();
  }

  function renderNotesContent() {
    var html = '<h2>一盅兩件落單流程及注意事項</h2>' +
      '<p>本系統僅供<strong>正餐</strong>或<strong>正餐剪碎</strong>院友使用，請勿為其他餐型院友落單。</p>' +
      '<h2>流程概覽</h2>' +
      '<ul>' +
      '<li><strong>名單管理</strong>：先匯入院友名單 (.txt，一行一個姓名)。可選匯入「最近需戒口名單」及「覆診/外出名單」，以便對照。</li>' +
      '<li><strong>落單</strong>：在落單頁選擇院友，確認後進入點心選擇畫面。可切換「正餐」或「正餐剪碎」，點選點心（可多選），需要時填寫備注（如半份、未落住、純碎餐等），最後按「確認落單」。</li>' +
      '<li><strong>訂單總覽</strong>：可檢視、編輯或刪除訂單，並可「生成Excel表格」匯出供存檔或列印。</li>' +
      '</ul>' +
      '<h2>注意事項（要點）</h2>' +
      '<div class="check-item"><span class="check-icon">✓</span><span>確認院友為正餐或正餐剪碎，並未在戒口/覆診名單中需排除。</span></div>' +
      '<div class="check-item"><span class="check-icon">✓</span><span>半份或需拼單時，請在備注中註明「半份（需另一院友拼單）」。</span></div>' +
      '<div class="check-item"><span class="check-icon">✓</span><span>若暫未落住，請在備注選「標記為未落住」。</span></div>' +
      '<div class="check-item"><span class="check-icon">✓</span><span>純碎餐或駱劉xx類型（吃不完整份）等特殊情況，請在備注中清楚標示。</span></div>' +
      '<div class="check-item"><span class="check-icon">✓</span><span>落單完成後請在訂單總覽再次核對，並生成Excel存檔備查。</span></div>' +
      '<div class="reminder-box">落單後請樓層主管、ST馮姑娘、兩位社工過目。</div>';
    var el = document.getElementById('notes-content');
    if (el) el.innerHTML = html;
  }

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('Excel 庫未載入');
      return;
    }
    var headers = ['院友姓名', '餐型', '訂購項目', '備注', '狀態'];
    var rows = state.orders.map(function (o) {
      return [
        o.residentName || '',
        o.mealType || '正餐',
        (o.items || []).join(' • '),
        o.remark || '',
        o.status || '已確認'
      ];
    });
    var data = [headers].concat(rows);
    var ws = XLSX.utils.aoa_to_sheet(data);
    var colWidths = [{ wch: 14 }, { wch: 12 }, { wch: 36 }, { wch: 20 }, { wch: 10 }];
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '訂單總覽');
    var filename = '一盅兩件訂單_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(wb, filename);
    showToast('已生成 Excel 表格');
  }

  function bindEvents() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    document.getElementById('file-residents').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      parseTxtFile(file, function (names) {
        state.residents = names;
        saveAll();
        renderListTables();
        renderDatalist();
        showToast('已匯入院友名單，共 ' + names.length + ' 人');
      });
      e.target.value = '';
    });
    document.getElementById('btn-save-restricted').addEventListener('click', function () {
      var text = document.getElementById('textarea-restricted').value || '';
      state.restricted = parseLines(text);
      saveAll();
      renderListTables();
      showToast('已儲存戒口名單，共 ' + state.restricted.length + ' 人');
    });
    document.getElementById('btn-save-outpatient').addEventListener('click', function () {
      var text = document.getElementById('textarea-outpatient').value || '';
      state.outpatient = parseLines(text);
      saveAll();
      renderListTables();
      showToast('已儲存覆診/外出名單，共 ' + state.outpatient.length + ' 人');
    });

    document.getElementById('btn-confirm-resident').addEventListener('click', function () {
      var input = document.getElementById('resident-search');
      var name = (input.value || '').trim();
      if (!name) {
        showToast('請輸入或選擇院友姓名');
        return;
      }
      showOrderCart(name, null);
    });

    document.getElementById('meal-regular').addEventListener('click', function () {
      state.currentMealType = '正餐';
      document.getElementById('meal-regular').classList.add('active');
      document.getElementById('meal-pureed').classList.remove('active');
    });
    document.getElementById('meal-pureed').addEventListener('click', function () {
      state.currentMealType = '正餐剪碎';
      document.getElementById('meal-pureed').classList.add('active');
      document.getElementById('meal-regular').classList.remove('active');
    });

    document.getElementById('items-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('.item-btn');
      if (!btn) return;
      var item = btn.getAttribute('data-item');
      var idx = state.currentSelections.indexOf(item);
      if (idx === -1) state.currentSelections.push(item);
      else state.currentSelections.splice(idx, 1);
      renderItemButtons();
    });

    document.getElementById('btn-remark').addEventListener('click', openRemarkModal);
    document.getElementById('remark-close').addEventListener('click', closeRemarkModal);
    document.getElementById('remark-modal').addEventListener('click', function (e) {
      if (e.target.id === 'remark-modal') closeRemarkModal();
    });
    document.querySelectorAll('.remark-quick-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var tag = b.getAttribute('data-tag');
        var ta = document.getElementById('remark-textarea');
        var cur = ta.value.trim();
        ta.value = cur ? cur + ' ' + tag : tag;
      });
    });

    document.getElementById('btn-cancel-order').addEventListener('click', showOrderSelect);
    document.getElementById('btn-submit-order').addEventListener('click', submitOrder);

    document.getElementById('btn-export-excel').addEventListener('click', exportExcel);

    document.getElementById('tbody-orders').addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var row = e.target.closest('tr');
      var orderId = row ? row.getAttribute('data-order-id') : null;
      var order = state.orders.find(function (o) { return o.id === orderId; });
      if (!order) return;
      if (btn.getAttribute('data-action') === 'edit') {
        showOrderCart(order.residentName, order);
        switchTab('order');
      } else if (btn.getAttribute('data-action') === 'delete') {
        state.orders = state.orders.filter(function (o) { return o.id !== orderId; });
        saveAll();
        renderOrdersTable();
        showToast('已刪除該訂單');
      }
    });
  }

  function init() {
    loadFromStorage();
    renderListTables();
    renderDatalist();
    renderOrdersTable();
    renderNotesContent();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
