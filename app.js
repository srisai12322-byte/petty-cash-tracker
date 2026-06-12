/* ==========================================================================
   FLOATLY CORE APPLICATION LOGIC - SIMPLIFIED SITE PETTY CASH TRACKER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --------------------------------------------------------------------------
  // A. Global State & Seed Data (INR / Construction Focus)
  // --------------------------------------------------------------------------
  let state = {
    boxes: [], // Represents Project Sites
    transactions: [], // Represents Site Transactions
    currentBoxId: null, // Represents Active Site ID
    currentTab: 'dashboard'
  };

  // Mock Project Sites Seed
  const DEFAULT_BOXES = [
    {
      id: "box-1",
      name: "CMRU SOET Block",
      custodian: "Manoj Kumar",
      initialFloat: 500000.00,
      currentFloat: 293900.00, // 5,00,000 - 2,06,100 (total expenses)
      threshold: 100000.00,
      status: "healthy"
    },
    {
      id: "box-2",
      name: "CMRU Hostel Block",
      custodian: "Amit Sharma",
      initialFloat: 300000.00,
      currentFloat: 80000.00,
      threshold: 100000.00,
      status: "low" // Below warning threshold
    },
    {
      id: "box-3",
      name: "Campus Extension Site",
      custodian: "Rajesh Patil",
      initialFloat: 1000000.00,
      currentFloat: 950000.00,
      threshold: 200000.00,
      status: "healthy"
    }
  ];

  // Mock Transactions Seed (Matching the screenshot data dated 31-10-2025)
  const DEFAULT_TRANSACTIONS = [
    // CMRU SOET Block Approved Expenses (Exact match with user's image)
    {
      id: "TRANS-000101",
      date: "2025-10-31",
      boxId: "box-1",
      category: "Staff Advances",
      description: "Ayappa Adv",
      recipient: "Ayappa",
      amount: 100000.00
    },
    {
      id: "TRANS-000102",
      date: "2025-10-31",
      boxId: "box-1",
      category: "Staff Advances",
      description: "Vonodh Mishra Adv",
      recipient: "Vonodh Mishra",
      amount: 100000.00
    },
    {
      id: "TRANS-000103",
      date: "2025-10-31",
      boxId: "box-1",
      category: "Fuel & Petrol",
      description: "Govind raju Petrol",
      recipient: "Govind raju",
      amount: 1000.00
    },
    {
      id: "TRANS-000104",
      date: "2025-10-31",
      boxId: "box-1",
      category: "Fuel & Petrol",
      description: "Rahasya Petrol",
      recipient: "Rahasya",
      amount: 1000.00
    },
    {
      id: "TRANS-000105",
      date: "2025-10-31",
      boxId: "box-1",
      category: "Labor & Wages",
      description: "Fundappa 4 Loas + 1 day",
      recipient: "Fundappa",
      amount: 4100.00
    },
    {
      id: "REFILL-00001",
      date: "2025-10-25",
      boxId: "box-1",
      category: "Refill Funds",
      description: "Initial Float Allocation - Bank Transfer",
      recipient: "Corporate Finance HQ",
      amount: 500000.00
    },
    // CMRU Hostel Block Data
    {
      id: "TRANS-000201",
      date: "2025-10-28",
      boxId: "box-2",
      category: "Labor & Wages",
      description: "Concrete mixing crew wages (2 days)",
      recipient: "Shankar Labor Contractor",
      amount: 120000.00
    },
    {
      id: "TRANS-000202",
      date: "2025-10-30",
      boxId: "box-2",
      category: "Material & Construction Supplies",
      description: "Sand truck load (3 units)",
      recipient: "Ganga Sand Suppliers",
      amount: 100000.00
    },
    {
      id: "TRANS-000203",
      date: "2025-10-31",
      boxId: "box-2",
      category: "Food & Snacks",
      description: "Tea and refreshments for site laborers",
      recipient: "Prabhu Tea Stall",
      amount: 3500.00
    },
    {
      id: "REFILL-00002",
      date: "2025-10-20",
      boxId: "box-2",
      category: "Refill Funds",
      description: "Initial Float Allocation - Cash Vault",
      recipient: "Main Safe Cashier",
      amount: 300000.00
    }
  ];

  // Colors for Category Chart
  const CATEGORY_COLORS = {
    "Staff Advances": "#2e7d32",                    // Forest Green
    "Fuel & Petrol": "#f59e0b",                     // Amber
    "Labor & Wages": "#0284c7",                     // Blue/Sky
    "Material & Construction Supplies": "#7c2d12",  // Burnt Sienna
    "Food & Snacks": "#e11d48",                     // Rose
    "Repairs & Maintenance": "#8b5cf6",             // Purple
    "Miscellaneous": "#64748b"                      // Slate
  };

  // --------------------------------------------------------------------------
  // B. State Persistence & Initialization (v3 keys)
  // --------------------------------------------------------------------------
  function loadState() {
    const savedBoxes = localStorage.getItem('floatly_site_boxes_v3');
    const savedTransactions = localStorage.getItem('floatly_site_transactions_v3');
    const savedBoxId = localStorage.getItem('floatly_current_box_id');
    const savedTheme = localStorage.getItem('floatly_theme') || 'light';

    if (savedBoxes) {
      state.boxes = JSON.parse(savedBoxes);
    } else {
      state.boxes = [...DEFAULT_BOXES];
      localStorage.setItem('floatly_site_boxes_v3', JSON.stringify(state.boxes));
    }

    if (savedTransactions) {
      state.transactions = JSON.parse(savedTransactions);
    } else {
      state.transactions = [...DEFAULT_TRANSACTIONS];
      localStorage.setItem('floatly_site_transactions_v3', JSON.stringify(state.transactions));
    }

    if (savedBoxId && state.boxes.some(b => b.id === savedBoxId)) {
      state.currentBoxId = savedBoxId;
    } else if (state.boxes.length > 0) {
      state.currentBoxId = state.boxes[0].id;
    }

    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function saveState() {
    localStorage.setItem('floatly_site_boxes_v3', JSON.stringify(state.boxes));
    localStorage.setItem('floatly_site_transactions_v3', JSON.stringify(state.transactions));
    localStorage.setItem('floatly_current_box_id', state.currentBoxId);
  }

  // --------------------------------------------------------------------------
  // C. UI Helper Functions
  // --------------------------------------------------------------------------
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function generateUniqueId(prefix = 'TRANS') {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${num}`;
  }

  function checkBoxStatus(box) {
    return box.currentFloat <= box.threshold ? 'low' : 'healthy';
  }

  function updateBoxFloat(boxId, amount, isIncrease = false) {
    const box = state.boxes.find(b => b.id === boxId);
    if (!box) return;

    if (isIncrease) {
      box.currentFloat += amount;
    } else {
      box.currentFloat -= amount;
    }

    box.status = checkBoxStatus(box);
    saveState();
  }

  // --------------------------------------------------------------------------
  // D. Rendering Modules
  // --------------------------------------------------------------------------

  // Render Select Pickers
  function renderSelectors() {
    const headerSelect = document.getElementById('header-box-select');
    const expenseSelect = document.getElementById('expense-box');
    const transferSource = document.getElementById('transfer-source-box');
    const transferTarget = document.getElementById('transfer-target-box');
    const reportSelect = document.getElementById('report-box-select');
    const ledgerFilterBox = document.getElementById('ledger-filter-box');

    const selectedHeader = state.currentBoxId;
    const selectedReport = reportSelect.value || 'all';

    headerSelect.innerHTML = '';
    expenseSelect.innerHTML = '';
    transferSource.innerHTML = '<option value="" disabled selected>Select source site...</option>';
    transferTarget.innerHTML = '<option value="" disabled selected>Select target site...</option>';
    reportSelect.innerHTML = '<option value="all">All Project Sites</option>';
    ledgerFilterBox.innerHTML = '<option value="all">All Project Sites</option>';

    state.boxes.forEach(box => {
      // Header Selector
      const opt1 = document.createElement('option');
      opt1.value = box.id;
      opt1.textContent = `${box.name} (${formatCurrency(box.currentFloat)})`;
      opt1.selected = box.id === selectedHeader;
      headerSelect.appendChild(opt1);

      // Ledger Filter Box
      const optFilter = document.createElement('option');
      optFilter.value = box.id;
      optFilter.textContent = box.name;
      ledgerFilterBox.appendChild(optFilter);

      // Form Add Expense Selector
      const opt2 = document.createElement('option');
      opt2.value = box.id;
      opt2.textContent = box.name;
      opt2.selected = box.id === selectedHeader;
      expenseSelect.appendChild(opt2);

      // Transfer selectors
      const optSource = document.createElement('option');
      optSource.value = box.id;
      optSource.textContent = `${box.name} (${formatCurrency(box.currentFloat)})`;
      transferSource.appendChild(optSource);

      const optTarget = document.createElement('option');
      optTarget.value = box.id;
      optTarget.textContent = box.name;
      transferTarget.appendChild(optTarget);

      // Report Selector
      const opt3 = document.createElement('option');
      opt3.value = box.id;
      opt3.textContent = box.name;
      opt3.selected = box.id === selectedReport;
      reportSelect.appendChild(opt3);
    });
  }

  // Render KPIs on Dashboard
  function renderKPIs() {
    const box = state.boxes.find(b => b.id === state.currentBoxId);
    if (!box) return;

    document.getElementById('kpi-cash-on-hand').textContent = formatCurrency(box.currentFloat);
    document.getElementById('kpi-cash-box-name').textContent = box.name;

    // Calculate disbursed funds for this month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const currentMonthClaims = state.transactions.filter(t => {
      if (t.boxId !== state.currentBoxId || t.category === 'Refill Funds' || t.id.includes('TXFR-IN')) return false;
      const transDate = new Date(t.date);
      return transDate.getFullYear() === currentYear && transDate.getMonth() === currentMonth;
    });

    const totalDisbursed = currentMonthClaims.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('kpi-total-disbursed').textContent = formatCurrency(totalDisbursed);
    
    const disbursedPct = box.initialFloat > 0 ? Math.round((totalDisbursed / box.initialFloat) * 100) : 0;
    document.getElementById('kpi-disbursed-pct').textContent = `${disbursedPct}% of initial float`;

    // Total Transactions in ledger for this box
    const totalCount = state.transactions.filter(t => t.boxId === state.currentBoxId).length;
    document.getElementById('kpi-pending-count').textContent = totalCount;
    document.getElementById('kpi-pending-value').textContent = `Total Entries`;

    // Status State
    const statusCard = document.getElementById('kpi-box-status-card');
    const statusState = document.getElementById('kpi-status-state');
    const statusDesc = document.getElementById('kpi-status-desc');
    const statusIcon = document.getElementById('kpi-status-icon');

    statusCard.className = 'kpi-card bg-glass';
    statusIcon.className = 'kpi-icon';

    if (box.currentFloat <= box.threshold) {
      statusState.textContent = 'Low Balance';
      statusState.className = 'kpi-val text-danger';
      statusDesc.textContent = `Below threshold ${formatCurrency(box.threshold)}`;
      statusCard.classList.add('border-danger-glow');
      statusIcon.classList.add('text-danger');
      statusIcon.innerHTML = '<i data-lucide="alert-circle"></i>';
    } else {
      statusState.textContent = 'Healthy';
      statusState.className = 'kpi-val text-success';
      statusDesc.textContent = 'Float reserves secure';
      statusIcon.classList.add('text-success');
      statusIcon.innerHTML = '<i data-lucide="activity"></i>';
    }

    lucide.createIcons();
  }

  // Render Budget Capacity Progress Box (Dashboard Left Panel)
  function renderBudgetProgress() {
    const box = state.boxes.find(b => b.id === state.currentBoxId);
    if (!box) return;

    const progressRatioText = `${formatCurrency(box.currentFloat)} / ${formatCurrency(box.initialFloat)}`;
    document.getElementById('dashboard-progress-ratio').textContent = progressRatioText;

    const progressPct = box.initialFloat > 0 ? Math.min((box.currentFloat / box.initialFloat) * 100, 100) : 0;
    const fillBar = document.getElementById('dashboard-progress-bar');
    fillBar.style.width = `${progressPct}%`;

    if (progressPct <= 20) {
      fillBar.style.background = 'linear-gradient(to right, #ef4444, #f43f5e)';
    } else if (progressPct <= 50) {
      fillBar.style.background = 'linear-gradient(to right, #f59e0b, #eab308)';
    } else {
      fillBar.style.background = 'linear-gradient(to right, var(--color-primary), #4caf50)';
    }

    const warningAlert = document.getElementById('dashboard-warning-alert');
    const safeAlert = document.getElementById('dashboard-safe-alert');

    if (box.currentFloat <= box.threshold) {
      warningAlert.style.display = 'inline-flex';
      safeAlert.style.display = 'none';
    } else {
      warningAlert.style.display = 'none';
      safeAlert.style.display = 'inline-flex';
    }

    document.getElementById('dashboard-initial-float').textContent = formatCurrency(box.initialFloat);
    document.getElementById('dashboard-threshold-float').textContent = formatCurrency(box.threshold);
    document.getElementById('dashboard-custodian-name').textContent = box.custodian;
  }

  // Render Recent Activity list on Dashboard (Bottom Table)
  function renderRecentActivity() {
    const tbody = document.querySelector('#dashboard-recent-table tbody');
    tbody.innerHTML = '';

    const boxTrans = state.transactions
      .filter(t => t.boxId === state.currentBoxId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (boxTrans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center;" class="text-secondary">
            No recent activity recorded for this Project Site.
          </td>
        </tr>
      `;
      return;
    }

    boxTrans.forEach(t => {
      const tr = document.createElement('tr');
      const isRefill = t.category === 'Refill Funds' || t.id.includes('-IN');
      const isTransferOut = t.id.includes('-OUT');
      
      let amountClass = 'font-bold';
      let amountPrefix = '-';
      if (isRefill) {
        amountClass += ' text-success';
        amountPrefix = '+';
      } else if (isTransferOut) {
        amountClass += ' text-warning';
        amountPrefix = '-';
      }

      tr.innerHTML = `
        <td>${formatDate(t.date)}</td>
        <td>
          <div class="font-bold">${t.description}</div>
          <div class="font-xs text-tertiary">ID: ${t.id}</div>
        </td>
        <td>
          <span class="category-lbl-tag font-xs">
            <span class="category-indicator-dot" style="background-color: ${CATEGORY_COLORS[t.category] || 'var(--color-primary)'}"></span>
            ${t.category}
          </span>
        </td>
        <td>${t.recipient}</td>
        <td class="${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</td>
      `;

      tbody.appendChild(tr);
    });

    lucide.createIcons();
  }

  // Renders the full ledger search/table (Ledger Tab)
  function renderLedger() {
    const tbody = document.querySelector('#ledger-full-table tbody');
    const emptyState = document.getElementById('ledger-empty-state');
    const tableEl = document.getElementById('ledger-full-table');
    
    tbody.innerHTML = '';

    const searchVal = document.getElementById('ledger-search').value.toLowerCase().trim();
    const filterBox = document.getElementById('ledger-filter-box').value;
    const filterCategory = document.getElementById('ledger-filter-category').value;

    let filtered = [...state.transactions];

    if (filterBox !== 'all') {
      filtered = filtered.filter(t => t.boxId === filterBox);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    if (searchVal) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchVal) ||
        t.recipient.toLowerCase().includes(searchVal) ||
        t.id.toLowerCase().includes(searchVal)
      );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      tableEl.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    tableEl.style.display = 'table';
    emptyState.style.display = 'none';

    filtered.forEach(t => {
      const box = state.boxes.find(b => b.id === t.boxId);
      const boxName = box ? box.name : 'Unknown Site';

      const tr = document.createElement('tr');
      const isRefill = t.category === 'Refill Funds' || t.id.includes('-IN');
      const isTransferOut = t.id.includes('-OUT');
      
      let amountClass = 'font-bold';
      let amountPrefix = '-';
      if (isRefill) {
        amountClass += ' text-success';
        amountPrefix = '+';
      } else if (isTransferOut) {
        amountClass += ' text-warning';
        amountPrefix = '-';
      }

      tr.innerHTML = `
        <td><span class="font-xs monospace text-secondary">${t.id}</span></td>
        <td>${formatDate(t.date)}</td>
        <td><div class="font-bold">${t.description}</div></td>
        <td><span class="text-secondary font-sm">${boxName}</span></td>
        <td>
          <span class="category-lbl-tag font-xs">
            <span class="category-indicator-dot" style="background-color: ${CATEGORY_COLORS[t.category] || 'var(--color-primary)'}"></span>
            ${t.category}
          </span>
        </td>
        <td>${t.recipient}</td>
        <td class="${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</td>
        <td>
          <button class="btn-icon-sm delete-transaction-btn text-danger" data-id="${t.id}" title="Delete Transaction (Correction Utility)">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    lucide.createIcons();
    bindLedgerActions();
  }

  // Correction Utility Deletion Binding
  function bindLedgerActions() {
    document.querySelectorAll('.delete-transaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const transId = e.currentTarget.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete transaction "${transId}"? This will reverse the amount and adjust the site balances.`)) {
          deleteTransaction(transId);
        }
      });
    });
  }

  // Deletion logic (Correction Utility)
  function deleteTransaction(transId) {
    const index = state.transactions.findIndex(t => t.id === transId);
    if (index === -1) return;

    const t = state.transactions[index];
    
    // Check if it is a Transfer transaction
    // Transfers are logged as two entries: TXFR-XXXX-OUT and TXFR-XXXX-IN
    if (t.id.includes('TXFR-')) {
      const baseId = t.id.replace(/-OUT|-IN/, '');
      const outId = `${baseId}-OUT`;
      const inId = `${baseId}-IN`;

      const outTrans = state.transactions.find(item => item.id === outId);
      const inTrans = state.transactions.find(item => item.id === inId);

      if (outTrans) {
        // Reverse OUT: Add cash back to source
        updateBoxFloat(outTrans.boxId, outTrans.amount, true);
      }
      if (inTrans) {
        // Reverse IN: Deduct cash from target
        updateBoxFloat(inTrans.boxId, inTrans.amount, false);
      }

      // Remove both from transactions
      state.transactions = state.transactions.filter(item => item.id !== outId && item.id !== inId);
    } 
    // If it is a normal Refill
    else if (t.category === 'Refill Funds') {
      // Reverse Refill: Subtract cash
      updateBoxFloat(t.boxId, t.amount, false);
      state.transactions.splice(index, 1);
    } 
    // If it is a normal Expense
    else {
      // Reverse Expense: Add cash back
      updateBoxFloat(t.boxId, t.amount, true);
      state.transactions.splice(index, 1);
    }

    saveState();
    renderAll();
    alert(`Transaction ${transId} deleted. Site balances successfully restored.`);
  }

  // Renders the cards in the Cash Boxes grid (Project Sites Tab)
  function renderBoxes() {
    const gridContainer = document.getElementById('boxes-grid-container');
    gridContainer.innerHTML = '';

    state.boxes.forEach(box => {
      const card = document.createElement('div');
      card.className = `box-card bg-glass ${box.status === 'low' ? 'border-danger-glow' : ''}`;

      const progressPct = box.initialFloat > 0 ? Math.min((box.currentFloat / box.initialFloat) * 100, 100) : 0;
      
      const boxTrans = state.transactions.filter(t => t.boxId === box.id);
      const expenses = boxTrans.filter(t => t.category !== 'Refill Funds' && !t.id.includes('-IN'));
      const refills = boxTrans.filter(t => t.category === 'Refill Funds' || t.id.includes('-IN'));
      
      const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalRefilled = refills.reduce((sum, t) => sum + t.amount, 0);

      card.innerHTML = `
        <div class="box-card-header">
          <div class="box-name-badge">
            <h4>${box.name}</h4>
            <span class="box-badge-role">Supervisor: <strong>${box.custodian}</strong></span>
          </div>
          <span class="status-pill status-pill-${box.status}">${box.status === 'low' ? 'Low Float' : 'Healthy'}</span>
        </div>

        <div class="box-card-balance">
          <span class="lbl">Current Balance</span>
          <div class="val">${formatCurrency(box.currentFloat)}</div>
        </div>

        <div class="box-card-progress">
          <div class="ratio">
            <span class="fraction">${formatCurrency(box.currentFloat)} / ${formatCurrency(box.initialFloat)}</span>
            <span class="percent font-bold">${Math.round(progressPct)}%</span>
          </div>
          <div class="progress-bar-bg" style="margin-bottom: 0;">
            <div class="progress-bar-fill" style="width: ${progressPct}%; background: ${
              progressPct <= 20 ? '#ef4444' : progressPct <= 50 ? '#f59e0b' : 'linear-gradient(to right, var(--color-primary), #4caf50)'
            }"></div>
          </div>
        </div>

        <div class="box-card-stats">
          <div class="stat-col">
            <span class="stat-lbl">Disbursed Spend</span>
            <span class="stat-val text-danger">${formatCurrency(totalSpent)}</span>
          </div>
          <div class="stat-col">
            <span class="stat-lbl">Total Refills</span>
            <span class="stat-val text-success">${formatCurrency(totalRefilled)}</span>
          </div>
        </div>

        <div class="box-card-actions">
          <button class="btn btn-secondary select-box-btn" data-id="${box.id}">
            <i data-lucide="eye"></i>
            <span>Select</span>
          </button>
          <button class="btn btn-primary refill-box-btn" data-id="${box.id}">
            <i data-lucide="plus-circle"></i>
            <span>Refill</span>
          </button>
        </div>
      `;

      gridContainer.appendChild(card);
    });

    lucide.createIcons();

    document.querySelectorAll('.select-box-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        state.currentBoxId = id;
        saveState();
        renderSelectors();
        renderKPIs();
        renderBudgetProgress();
        renderRecentActivity();
        switchTab('dashboard');
      });
    });

    document.querySelectorAll('.refill-box-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const boxId = e.currentTarget.getAttribute('data-id');
        const box = state.boxes.find(b => b.id === boxId);
        if (box) {
          openRefillModal(box);
        }
      });
    });
  }

  // Renders the stats & tables in Reports Tab
  function renderReports() {
    const reportBoxId = document.getElementById('report-box-select').value;
    const timeHorizon = document.getElementById('report-time-select').value;

    let targetTransactions = [...state.transactions];

    if (reportBoxId !== 'all') {
      targetTransactions = targetTransactions.filter(t => t.boxId === reportBoxId);
    }

    // Filter by Time Horizon
    const now = new Date();
    if (timeHorizon === '30') {
      const cutDate = new Date();
      cutDate.setDate(now.getDate() - 30);
      targetTransactions = targetTransactions.filter(t => new Date(t.date) >= cutDate);
    } else if (timeHorizon === '90') {
      const cutDate = new Date();
      cutDate.setDate(now.getDate() - 90);
      targetTransactions = targetTransactions.filter(t => new Date(t.date) >= cutDate);
    } else if (timeHorizon === 'this-month') {
      targetTransactions = targetTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    let totalFloat = 0;
    if (reportBoxId === 'all') {
      totalFloat = state.boxes.reduce((sum, b) => sum + b.initialFloat, 0);
    } else {
      const targetBox = state.boxes.find(b => b.id === reportBoxId);
      totalFloat = targetBox ? targetBox.initialFloat : 0;
    }

    const expenses = targetTransactions.filter(t => t.category !== 'Refill Funds' && !t.id.includes('-IN'));
    const refills = targetTransactions.filter(t => t.category === 'Refill Funds' || t.id.includes('-IN'));

    const totalSpend = expenses.reduce((sum, t) => sum + t.amount, 0);
    const avgClaim = expenses.length > 0 ? (totalSpend / expenses.length) : 0;

    const refillCount = refills.length;
    const refillTotal = refills.reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('report-total-float').textContent = formatCurrency(totalFloat);
    document.getElementById('report-total-spend').textContent = formatCurrency(totalSpend);
    document.getElementById('report-avg-claim').textContent = formatCurrency(avgClaim);
    document.getElementById('report-refill-count').textContent = refillCount;
    document.getElementById('report-refilled-total').textContent = formatCurrency(refillTotal);

    const categorySums = {};
    const categoriesList = [
      "Staff Advances", "Fuel & Petrol", "Labor & Wages", 
      "Material & Construction Supplies", "Food & Snacks", "Repairs & Maintenance", "Miscellaneous"
    ];

    categoriesList.forEach(c => categorySums[c] = 0);
    expenses.forEach(t => {
      if (categorySums[t.category] !== undefined) {
        categorySums[t.category] += t.amount;
      }
    });

    const categoryListContainer = document.getElementById('report-category-list');
    categoryListContainer.innerHTML = '';

    categoriesList.forEach(cat => {
      const spent = categorySums[cat] || 0;
      const pct = totalSpend > 0 ? Math.round((spent / totalSpend) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <div class="category-row-meta">
          <span class="category-lbl-tag">
            <span class="category-indicator-dot" style="background-color: ${CATEGORY_COLORS[cat]}"></span>
            <strong>${cat}</strong>
          </span>
          <span class="category-values">${formatCurrency(spent)} <span class="text-tertiary">(${pct}%)</span></span>
        </div>
        <div class="category-progress-bg">
          <div class="category-progress-fill" style="width: ${pct}%; background-color: ${CATEGORY_COLORS[cat]}"></div>
        </div>
      `;
      categoryListContainer.appendChild(row);
    });

    renderCharts(expenses);
  }

  // --------------------------------------------------------------------------
  // F. Chart rendering using Chart.js
  // --------------------------------------------------------------------------
  function renderCharts(expensesData = null) {
    let targetExpenses = expensesData;
    if (!targetExpenses) {
      targetExpenses = state.transactions.filter(t => 
        t.boxId === state.currentBoxId && 
        t.category !== 'Refill Funds' && 
        !t.id.includes('-IN')
      );
    }

    const categoryChartCanvas = document.getElementById('categoryChart');
    const categoryEmptyState = document.getElementById('category-chart-empty');

    if (targetExpenses.length === 0) {
      categoryChartCanvas.style.display = 'none';
      categoryEmptyState.style.display = 'flex';
      if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
      }
    } else {
      categoryChartCanvas.style.display = 'block';
      categoryEmptyState.style.display = 'none';

      const labels = ["Staff Advances", "Fuel & Petrol", "Labor & Wages", "Material & Construction Supplies", "Food & Snacks", "Repairs & Maintenance", "Miscellaneous"];
      const sums = labels.map(label => {
        return targetExpenses.filter(t => t.category === label).reduce((sum, t) => sum + t.amount, 0);
      });

      const activeLabels = [];
      const activeData = [];
      const activeColors = [];

      labels.forEach((lbl, i) => {
        if (sums[i] > 0) {
          activeLabels.push(lbl);
          activeData.push(sums[i]);
          activeColors.push(CATEGORY_COLORS[lbl]);
        }
      });

      if (categoryChartInstance) {
        categoryChartInstance.destroy();
      }

      const currentTheme = document.documentElement.getAttribute('data-theme');
      const labelColor = currentTheme === 'dark' ? '#94a3b8' : '#475569';

      categoryChartInstance = new Chart(categoryChartCanvas, {
        type: 'doughnut',
        data: {
          labels: activeLabels,
          datasets: [{
            data: activeData,
            backgroundColor: activeColors,
            borderColor: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: labelColor,
                font: { family: 'Inter', size: 11 },
                boxWidth: 12
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` ${context.label}: ₹${context.raw.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 2. Spend Trend Chart
    const trendCanvas = document.getElementById('trendChart');
    const trendEmptyState = document.getElementById('trend-chart-empty');

    const expensesAll = state.transactions.filter(t => t.category !== 'Refill Funds' && !t.id.includes('-IN'));

    if (expensesAll.length === 0) {
      trendCanvas.style.display = 'none';
      trendEmptyState.style.display = 'flex';
      if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
      }
    } else {
      trendCanvas.style.display = 'block';
      trendEmptyState.style.display = 'none';

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlySpend = Array(12).fill(0);

      expensesAll.forEach(t => {
        const dateObj = new Date(t.date);
        const monthIndex = dateObj.getMonth();
        monthlySpend[monthIndex] += t.amount;
      });

      const activeMonths = [];
      const activeSpend = [];
      
      monthNames.forEach((month, i) => {
        if (monthlySpend[i] > 0 || i === 9 || i === 10) {
          activeMonths.push(month);
          activeSpend.push(monthlySpend[i]);
        }
      });

      if (trendChartInstance) {
        trendChartInstance.destroy();
      }

      const currentTheme = document.documentElement.getAttribute('data-theme');
      const labelColor = currentTheme === 'dark' ? '#94a3b8' : '#475569';
      const gridColor = currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

      trendChartInstance = new Chart(trendCanvas, {
        type: 'bar',
        data: {
          labels: activeMonths,
          datasets: [{
            label: 'Monthly Expenditures (₹)',
            data: activeSpend,
            backgroundColor: 'rgba(46, 125, 50, 0.85)',
            hoverBackgroundColor: '#2e7d32',
            borderRadius: 6,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` Expenditures: ₹${context.raw.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: labelColor, font: { family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: labelColor,
                font: { family: 'Inter' },
                callback: function(value) {
                  return '₹' + value.toLocaleString('en-IN');
                }
              }
            }
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // G. Modals Logic
  // --------------------------------------------------------------------------
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal-active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('modal-active');
      document.body.style.overflow = '';
      
      const form = modal.querySelector('form');
      if (form) form.reset();

      const alerts = modal.querySelectorAll('.alert');
      alerts.forEach(a => a.style.display = 'none');
    }
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.currentTarget.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  function openRefillModal(box) {
    document.getElementById('refill-box-name').value = box.name;
    document.getElementById('refill-box-name').setAttribute('data-box-id', box.id);
    openModal('modal-refill-box');
  }

  // --------------------------------------------------------------------------
  // H. Form Submissions
  // --------------------------------------------------------------------------

  // Form Submit: Log Expense
  const formExpense = document.getElementById('form-log-expense');
  formExpense.addEventListener('submit', (e) => {
    e.preventDefault();

    const boxId = document.getElementById('expense-box').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const recipient = document.getElementById('expense-recipient').value.trim();
    const description = document.getElementById('expense-desc').value.trim();
    const date = document.getElementById('expense-date').value;

    const errorAlert = document.getElementById('expense-form-error');
    errorAlert.style.display = 'none';

    // Validation
    const box = state.boxes.find(b => b.id === boxId);
    if (!box) {
      showExpenseError("Selected Project Site is invalid.");
      return;
    }

    if (amount > box.currentFloat) {
      showExpenseError(`Insufficient funds. The active site only has ${formatCurrency(box.currentFloat)} left.`);
      return;
    }

    const newTrans = {
      id: generateUniqueId('TRANS'),
      date: date,
      boxId: boxId,
      category: category,
      description: description,
      recipient: recipient,
      amount: amount
    };

    state.transactions.push(newTrans);
    updateBoxFloat(boxId, amount, false); // deduct balance

    saveState();
    renderAll();
    closeModal('modal-request-expense');
    alert(`Expense logged successfully. ${formatCurrency(amount)} has been deducted from ${box.name}.`);
  });

  function showExpenseError(msg) {
    const err = document.getElementById('expense-form-error');
    err.querySelector('.error-msg').textContent = msg;
    err.style.display = 'flex';
  }

  // Form Submit: Refill Box
  const formRefill = document.getElementById('form-refill-box');
  formRefill.addEventListener('submit', (e) => {
    e.preventDefault();

    const boxId = document.getElementById('refill-box-name').getAttribute('data-box-id');
    const amount = parseFloat(document.getElementById('refill-amount').value);
    const source = document.getElementById('refill-source').value;
    const notes = document.getElementById('refill-notes').value.trim();

    const box = state.boxes.find(b => b.id === boxId);
    if (!box) return;

    const newRefill = {
      id: generateUniqueId('REFILL'),
      date: new Date().toISOString().split('T')[0],
      boxId: boxId,
      category: "Refill Funds",
      description: `Refilled via ${source}. Notes: ${notes || 'N/A'}`,
      recipient: source,
      amount: amount
    };

    state.transactions.push(newRefill);
    updateBoxFloat(boxId, amount, true); // add cash
    
    saveState();
    renderAll();
    closeModal('modal-refill-box');
    alert(`Refilled ${formatCurrency(amount)} into ${box.name}.`);
  });

  // Form Submit: Transfer Cash
  const formTransfer = document.getElementById('form-transfer-cash');
  formTransfer.addEventListener('submit', (e) => {
    e.preventDefault();

    const srcId = document.getElementById('transfer-source-box').value;
    const destId = document.getElementById('transfer-target-box').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    const errorDiv = document.getElementById('transfer-form-error');
    errorDiv.style.display = 'none';

    if (srcId === destId) {
      errorDiv.querySelector('.error-msg').textContent = "Source and Target sites must be different.";
      errorDiv.style.display = 'flex';
      return;
    }

    const srcBox = state.boxes.find(b => b.id === srcId);
    const destBox = state.boxes.find(b => b.id === destId);

    if (!srcBox || !destBox) return;

    if (amount > srcBox.currentFloat) {
      errorDiv.querySelector('.error-msg').textContent = `Insufficient funds in source site. Available: ${formatCurrency(srcBox.currentFloat)}`;
      errorDiv.style.display = 'flex';
      return;
    }

    const dateToday = new Date().toISOString().split('T')[0];
    const transId = generateUniqueId('TXFR');

    const outTrans = {
      id: `${transId}-OUT`,
      date: dateToday,
      boxId: srcId,
      category: "Miscellaneous",
      description: `Transfer to Site: ${destBox.name}`,
      recipient: destBox.custodian,
      amount: amount
    };

    const inTrans = {
      id: `${transId}-IN`,
      date: dateToday,
      boxId: destId,
      category: "Refill Funds",
      description: `Transfer from Site: ${srcBox.name}`,
      recipient: srcBox.custodian,
      amount: amount
    };

    state.transactions.push(outTrans);
    state.transactions.push(inTrans);

    updateBoxFloat(srcId, amount, false); // deduct
    updateBoxFloat(destId, amount, true); // add

    saveState();
    renderAll();
    closeModal('modal-transfer-cash');
    alert(`Transferred ${formatCurrency(amount)} from ${srcBox.name} to ${destBox.name}.`);
  });

  // Form Submit: Create New Project Site
  const formCreateBox = document.getElementById('form-create-box');
  formCreateBox.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('new-box-name').value.trim();
    const custodian = document.getElementById('new-box-custodian').value.trim();
    const initial = parseFloat(document.getElementById('new-box-initial').value);
    const alertThreshold = parseFloat(document.getElementById('new-box-alert').value);

    const newId = `box-${state.boxes.length + 1}`;
    const newBox = {
      id: newId,
      name: name,
      custodian: custodian,
      initialFloat: initial,
      currentFloat: initial,
      threshold: alertThreshold,
      status: "healthy"
    };

    state.boxes.push(newBox);
    state.currentBoxId = newId; // switch to newly created site
    
    const creationRefill = {
      id: generateUniqueId('REFILL'),
      date: new Date().toISOString().split('T')[0],
      boxId: newId,
      category: "Refill Funds",
      description: `Initial site petty cash float allocation`,
      recipient: "Corporate HQ",
      amount: initial
    };
    state.transactions.push(creationRefill);

    saveState();
    renderAll();
    closeModal('modal-create-box');
    alert(`New Project Site "${name}" created successfully with initial float of ${formatCurrency(initial)}.`);
  });

  // --------------------------------------------------------------------------
  // I. CSV Export Module
  // --------------------------------------------------------------------------
  const btnExport = document.getElementById('btn-export-csv');
  btnExport.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction ID,Date,Description,Project Site,Category,Recipient,Amount (INR)\n";
    
    state.transactions.forEach(t => {
      const box = state.boxes.find(b => b.id === t.boxId);
      const boxName = box ? box.name : 'Unknown Site';
      
      const id = t.id;
      const date = formatDate(t.date);
      const desc = `"${t.description.replace(/"/g, '""')}"`;
      const bName = `"${boxName.replace(/"/g, '""')}"`;
      const cat = t.category;
      const rec = `"${t.recipient.replace(/"/g, '""')}"`;
      const amount = t.amount.toFixed(2);
      
      csvContent += `${id},${date},${desc},${bName},${cat},${rec},${amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `floatly_site_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // --------------------------------------------------------------------------
  // J. Navigation Tabs & Mode Toggles
  // --------------------------------------------------------------------------
  function switchTab(tabId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
      if (tab.id === `tab-${tabId}`) {
        tab.classList.add('active-tab');
      } else {
        tab.classList.remove('active-tab');
      }
    });

    const titleMap = {
      'dashboard': 'Dashboard',
      'ledger': 'Site Ledger Audit',
      'boxes': 'Active Project Sites',
      'reports': 'Spending Analytics'
    };

    const subtitleMap = {
      'dashboard': 'Welcome back, track your site petty cash spendings here.',
      'ledger': 'Full audit trail of project site disbursements.',
      'boxes': 'Manage floats, transfer funds, and review supervisors.',
      'reports': 'Deep dive spending statistics and category distributions.'
    };

    document.getElementById('page-title').textContent = titleMap[tabId] || 'Dashboard';
    document.getElementById('page-subtitle').textContent = subtitleMap[tabId] || '';

    state.currentTab = tabId;
    
    if (tabId === 'ledger') {
      renderLedger();
    } else if (tabId === 'boxes') {
      renderBoxes();
    } else if (tabId === 'reports') {
      renderReports();
    } else if (tabId === 'dashboard') {
      renderKPIs();
      renderBudgetProgress();
      renderRecentActivity();
      renderCharts();
    }
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = e.currentTarget.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('floatly_theme', newTheme);
    renderCharts();
  });

  // --------------------------------------------------------------------------
  // K. Event Listeners
  // --------------------------------------------------------------------------
  document.getElementById('header-box-select').addEventListener('change', (e) => {
    state.currentBoxId = e.target.value;
    saveState();
    renderKPIs();
    renderBudgetProgress();
    renderRecentActivity();
    renderCharts();
    document.getElementById('expense-box').value = state.currentBoxId;
  });

  document.getElementById('report-box-select').addEventListener('change', () => {
    renderReports();
  });

  document.getElementById('report-time-select').addEventListener('change', () => {
    renderReports();
  });

  document.getElementById('ledger-search').addEventListener('input', () => renderLedger());
  document.getElementById('ledger-filter-box').addEventListener('change', () => renderLedger());
  document.getElementById('ledger-filter-category').addEventListener('change', () => renderLedger());

  document.getElementById('btn-request-cash').addEventListener('click', () => {
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-box').value = state.currentBoxId;
    openModal('modal-request-expense');
  });

  document.getElementById('btn-refill-cash').addEventListener('click', () => {
    const box = state.boxes.find(b => b.id === state.currentBoxId);
    if (box) {
      openRefillModal(box);
    }
  });

  document.getElementById('btn-create-box-trigger').addEventListener('click', () => {
    openModal('modal-create-box');
  });

  document.getElementById('btn-view-all-ledger').addEventListener('click', () => {
    switchTab('ledger');
  });

  const transferSrcSelect = document.getElementById('transfer-source-box');
  transferSrcSelect.addEventListener('change', (e) => {
    const boxId = e.target.value;
    const box = state.boxes.find(b => b.id === boxId);
    const balSpan = document.getElementById('transfer-source-balance');
    if (box) {
      balSpan.textContent = `Available: ${formatCurrency(box.currentFloat)}`;
    } else {
      balSpan.textContent = `Available: ₹0.00`;
    }
  });

  // --------------------------------------------------------------------------
  // L. Unified Render Hub
  // --------------------------------------------------------------------------
  function renderAll() {
    renderSelectors();
    renderKPIs();
    renderBudgetProgress();
    renderRecentActivity();
    
    if (state.currentTab === 'ledger') {
      renderLedger();
    } else if (state.currentTab === 'boxes') {
      renderBoxes();
    } else if (state.currentTab === 'reports') {
      renderReports();
    }
  }

  // --------------------------------------------------------------------------
  // M. Initialization Entry Point
  // --------------------------------------------------------------------------
  function init() {
    loadState();
    renderAll();
    renderCharts();
    lucide.createIcons();
  }

  init();
});
