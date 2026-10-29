// State & Variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let spendingLimit = parseFloat(localStorage.getItem('spendingLimit')) || 0;
let chartInstance = null;

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const themeToggleBtn = document.getElementById('themeToggle');
const budgetLimitInput = document.getElementById('budgetLimit');
const limitWarningEl = document.getElementById('limitWarning');
const sortBySelect = document.getElementById('sortBy');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  if (isDarkMode) document.body.classList.add('dark-mode');
  themeToggleBtn.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  
  if (spendingLimit > 0) budgetLimitInput.value = spendingLimit;

  initChart();
  renderApp();
});

// Event Listeners
transactionForm.addEventListener('submit', addTransaction);
themeToggleBtn.addEventListener('click', toggleTheme);
budgetLimitInput.addEventListener('input', updateLimit);
sortBySelect.addEventListener('change', renderApp);

// Add Transaction
function addTransaction(e) {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (!name || isNaN(amount) || amount <= 0 || !category) {
    alert('Harap isi semua field dengan benar!');
    return;
  }

  const newTransaction = {
    id: Date.now(),
    name,
    amount,
    category
  };

  transactions.push(newTransaction);
  saveAndRender();

  // Reset Form
  itemNameInput.value = '';
  amountInput.value = '';
  categoryInput.value = 'Food';
}

// Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveAndRender();
}

// Save to LocalStorage & Render UI
function saveAndRender() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderApp();
}

// Render App Data
function renderApp() {
  renderList();
  renderBalance();
  updateChart();
}

// Render Transaction List (with Sort option)
function renderList() {
  transactionList.innerHTML = '';

  let sortedTransactions = [...transactions];
  const sortVal = sortBySelect.value;

  if (sortVal === 'amount-high') {
    sortedTransactions.sort((a, b) => b.amount - a.amount);
  } else if (sortVal === 'amount-low') {
    sortedTransactions.sort((a, b) => a.amount - b.amount);
  } else if (sortVal === 'category') {
    sortedTransactions.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // Newest first
    sortedTransactions.sort((a, b) => b.id - a.id);
  }

  sortedTransactions.forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.innerHTML = `
      <div class="item-info">
        <div class="item-name">${escapeHtml(t.name)}</div>
        <div class="item-amount">$${t.amount.toFixed(2)}</div>
        <div class="item-category">${t.category}</div>
      </div>
      <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
    `;
    transactionList.appendChild(li);
  });
}

// Render Total Balance & Check Limit
function renderBalance() {
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  totalBalanceEl.textContent = `$${total.toFixed(2)}`;

  // Limit Highlight Challenge
  if (spendingLimit > 0 && total > spendingLimit) {
    limitWarningEl.classList.remove('hidden');
    totalBalanceEl.style.color = '#e53e3e';
  } else {
    limitWarningEl.classList.add('hidden');
    totalBalanceEl.style.color = '';
  }
}

// Set Budget Limit
function updateLimit(e) {
  spendingLimit = parseFloat(e.target.value) || 0;
  localStorage.setItem('spendingLimit', spendingLimit);
  renderBalance();
}

// Dark Mode Toggle
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('darkMode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Chart.js Setup
function initChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Food', 'Transport', 'Fun'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#48bb78', '#4299e1', '#ed8936']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Update Chart Data
function updateChart() {
  const categoryTotals = { Food: 0, Transport: 0, Fun: 0 };

  transactions.forEach(t => {
    if (categoryTotals[t.category] !== undefined) {
      categoryTotals[t.category] += t.amount;
    }
  });

  chartInstance.data.datasets[0].data = [
    categoryTotals.Food,
    categoryTotals.Transport,
    categoryTotals.Fun
  ];
  chartInstance.update();
}

// Utility function to prevent XSS
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}