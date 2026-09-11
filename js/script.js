let monthlyIncome = Number(localStorage.getItem("monthlyIncome")) || 0;

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets")) || {};

let expenseChart = null;

/* =========================================================
   2. GET HTML ELEMENTS
========================================================= */

const budgetForm = document.getElementById("budgetForm");

const expenseForm = document.getElementById("expenseForm");

const expenseList = document.getElementById("expenseList");

const incomeElement = document.getElementById("displayIncome");

const expenseElement = document.getElementById("displayExpense");

const balanceElement = document.getElementById("displayBalance");

const searchInput = document.getElementById("search");

const categoryFilter = document.getElementById("filterCategory");

const budgetLimitForm = document.getElementById("budgetLimitForm");

const budgetLimitList = document.getElementById("budgetLimitList");

const budgetMessage = document.getElementById("budgetMessage");

const budgetPercentage = document.getElementById("budgetPercentage");

const monthlyHistory = document.getElementById("monthlyHistory");

/* =========================================================
   3. SETUP PAGE
========================================================= */

if (budgetForm) {
  budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const incomeInput = document.getElementById("monthlyIncome");

    if (!incomeInput) {
      return;
    }

    const income = Number(incomeInput.value);

    if (income <= 0 || isNaN(income)) {
      alert("Please enter a valid monthly income.");

      return;
    }

    monthlyIncome = income;

    localStorage.setItem("monthlyIncome", monthlyIncome);

    window.location.href = "dashboard.html";
  });
}

/* =========================================================
   4. SAVE EXPENSES
========================================================= */

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

/* =========================================================
   5. ADD EXPENSE
========================================================= */

if (expenseForm) {
  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    addExpense();
  });
}

/* =========================================================
   6. ADD EXPENSE FUNCTION
========================================================= */

function addExpense() {
  const descriptionElement = document.getElementById("description");

  const amountElement = document.getElementById("amount");

  const categoryElement = document.getElementById("category");

  const dateElement = document.getElementById("expenseDate");

  const billInput = document.getElementById("billImage");

  if (
    !descriptionElement ||
    !amountElement ||
    !categoryElement ||
    !dateElement
  ) {
    alert("Expense form fields are missing.");

    return;
  }

  const description = descriptionElement.value.trim();

  const amount = Number(amountElement.value);

  const category = categoryElement.value;

  const date = dateElement.value;

  /* ---------- VALIDATION ---------- */

  if (description === "") {
    alert("Please enter a description.");

    return;
  }

  if (amount <= 0 || isNaN(amount)) {
    alert("Please enter a valid amount.");

    return;
  }

  if (category === "") {
    alert("Please select a category.");

    return;
  }

  if (date === "") {
    alert("Please select a date.");

    return;
  }

  /* =====================================================
       BILL IMAGE
    ===================================================== */

  if (billInput && billInput.files && billInput.files.length > 0) {
    const file = billInput.files[0];

    /* Check image */

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid bill image.");

      return;
    }

    /* File size limit - 5 MB */

    if (file.size > 5 * 1024 * 1024) {
      alert("Bill image is too large. Please choose an image below 5 MB.");

      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      const billImage = event.target.result;

      createExpense(description, amount, category, date, billImage);
    };

    reader.readAsDataURL(file);
  } else {
    createExpense(description, amount, category, date, "");
  }
}

/* =========================================================
   7. CREATE EXPENSE OBJECT
========================================================= */

function createExpense(description, amount, category, date, billImage) {
  const expense = {
    id: Date.now(),

    description: description,

    amount: Number(amount),

    category: category,

    date: date,

    billImage: billImage || "",
  };

  /* Add expense to array */

  expenses.push(expense);

  /* Save */

  saveExpenses();

  /* Update everything */

  displaySummary();

  displayExpenses();

  displayExpenseChart();

  updateBudgetWarning();

  displayCategoryBudgets();

  displayMonthlyHistory();

  /* Reset form */

  if (expenseForm) {
    expenseForm.reset();
  }

  /* Success message */

  if (billImage) {
    alert("Expense and bill added successfully!");
  } else {
    alert("Expense added successfully!");
  }
}

/* =========================================================
   8. DISPLAY SUMMARY
========================================================= */

function displaySummary() {
  const totalExpenses = expenses.reduce(function (total, expense) {
    return total + Number(expense.amount);
  }, 0);

  const remainingBalance = monthlyIncome - totalExpenses;

  if (incomeElement) {
    incomeElement.textContent = "₹" + monthlyIncome.toLocaleString("en-IN");
  }

  if (expenseElement) {
    expenseElement.textContent = "₹" + totalExpenses.toLocaleString("en-IN");
  }

  if (balanceElement) {
    balanceElement.textContent = "₹" + remainingBalance.toLocaleString("en-IN");
  }
}

/* =========================================================
   9. DISPLAY EXPENSES IN TABLE
========================================================= */

function displayExpenses() {
  if (!expenseList) {
    console.error("expenseList element was not found.");

    return;
  }

  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const selectedCategory = categoryFilter ? categoryFilter.value : "All";

  /* Filter expenses */

  const filteredExpenses = expenses.filter(function (expense) {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchText);

    const matchesCategory =
      selectedCategory === "All" || expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  /* Clear old table */

  expenseList.innerHTML = "";

  /* =====================================================
       NO EXPENSES
    ===================================================== */

  if (filteredExpenses.length === 0) {
    const row = document.createElement("tr");

    const cell = document.createElement("td");

    /*
           IMPORTANT:
           6 columns:
           Description
           Amount
           Category
           Date
           Bill
           Action
        */

    cell.colSpan = 6;

    cell.textContent =
      expenses.length === 0
        ? "No expenses found."
        : "No expenses match your search.";

    cell.style.textAlign = "center";

    cell.style.padding = "30px";

    cell.style.color = "#7b8782";

    row.appendChild(cell);

    expenseList.appendChild(row);

    return;
  }

  /* =====================================================
       CREATE TABLE ROWS
    ===================================================== */

  filteredExpenses.forEach(function (expense) {
    const row = document.createElement("tr");

    /* ---------- DESCRIPTION ---------- */

    const descriptionCell = document.createElement("td");

    descriptionCell.textContent = expense.description;

    /* ---------- AMOUNT ---------- */

    const amountCell = document.createElement("td");

    amountCell.textContent =
      "₹" + Number(expense.amount).toLocaleString("en-IN");

    /* ---------- CATEGORY ---------- */

    const categoryCell = document.createElement("td");

    categoryCell.textContent = expense.category;

    /* ---------- DATE ---------- */

    const dateCell = document.createElement("td");

    dateCell.textContent = formatDate(expense.date);

    /* ---------- BILL ---------- */

    const billCell = document.createElement("td");

    if (expense.billImage) {
      const viewBillButton = document.createElement("button");

      viewBillButton.type = "button";

      viewBillButton.className = "bill-btn";

      viewBillButton.textContent = "🧾 View Bill";

      viewBillButton.addEventListener("click", function () {
        viewBill(expense.billImage);
      });

      billCell.appendChild(viewBillButton);
    } else {
      billCell.textContent = "No Bill";
    }

    /* ---------- DELETE ---------- */

    const actionCell = document.createElement("td");

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className = "delete-btn";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
      deleteExpense(expense.id);
    });

    actionCell.appendChild(deleteButton);

    /* ---------- ADD CELLS ---------- */

    row.appendChild(descriptionCell);

    row.appendChild(amountCell);

    row.appendChild(categoryCell);

    row.appendChild(dateCell);

    row.appendChild(billCell);

    row.appendChild(actionCell);

    expenseList.appendChild(row);
  });
}

/* =========================================================
   10. FORMAT DATE
========================================================= */

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const year = Number(parts[0]);

  const month = Number(parts[1]) - 1;

  const day = Number(parts[2]);

  const date = new Date(year, month, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   11. DELETE EXPENSE
========================================================= */

function deleteExpense(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this expense?",
  );

  if (!confirmDelete) {
    return;
  }

  expenses = expenses.filter(function (expense) {
    return expense.id !== id;
  });

  saveExpenses();

  /* Update all sections */

  displaySummary();

  displayExpenses();

  displayExpenseChart();

  updateBudgetWarning();

  displayCategoryBudgets();

  displayMonthlyHistory();
}

/* =========================================================
   12. SEARCH
========================================================= */

if (searchInput) {
  searchInput.addEventListener("input", function () {
    displayExpenses();
  });
}

/* =========================================================
   13. CATEGORY FILTER
========================================================= */

if (categoryFilter) {
  categoryFilter.addEventListener("change", function () {
    displayExpenses();
  });
}

/* =========================================================
   14. VIEW BILL
========================================================= */

function viewBill(billImage) {
  if (!billImage) {
    return;
  }

  const overlay = document.createElement("div");

  overlay.className = "bill-modal";

  const image = document.createElement("img");

  image.src = billImage;

  image.className = "bill-preview";

  const closeButton = document.createElement("button");

  closeButton.type = "button";

  closeButton.className = "close-bill-btn";

  closeButton.textContent = "✕";

  closeButton.addEventListener("click", function () {
    overlay.remove();
  });

  overlay.appendChild(closeButton);

  overlay.appendChild(image);

  document.body.appendChild(overlay);

  /* Close when clicking outside image */

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      overlay.remove();
    }
  });
}

/* =========================================================
   15. BUDGET WARNING
========================================================= */

function updateBudgetWarning() {
  if (!budgetMessage || !budgetPercentage) {
    return;
  }

  const totalExpenses = expenses.reduce(function (total, expense) {
    return total + Number(expense.amount);
  }, 0);

  if (monthlyIncome <= 0) {
    budgetPercentage.textContent = "0% Used";

    budgetMessage.textContent = "Please set your monthly income first.";

    return;
  }

  const percentageUsed = (totalExpenses / monthlyIncome) * 100;

  budgetPercentage.textContent = percentageUsed.toFixed(1) + "% Used";

  if (percentageUsed < 50) {
    budgetMessage.textContent = "🟢 Good! Your spending is under control.";
  } else if (percentageUsed <= 75) {
    budgetMessage.textContent =
      "🟡 Moderate spending. Keep monitoring your expenses.";
  } else if (percentageUsed <= 90) {
    budgetMessage.textContent =
      "🟠 Warning! You are using a large portion of your income.";
  } else {
    budgetMessage.textContent =
      "🔴 Critical! You have used most of your income.";
  }
}

/* =========================================================
   16. CATEGORY BUDGET FORM
========================================================= */

if (budgetLimitForm) {
  budgetLimitForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const categoryElement = document.getElementById("budgetCategory");

    const limitElement = document.getElementById("budgetLimit");

    if (!categoryElement || !limitElement) {
      return;
    }

    const category = categoryElement.value;

    const limit = Number(limitElement.value);

    if (category === "") {
      alert("Please select a category.");

      return;
    }

    if (limit <= 0 || isNaN(limit)) {
      alert("Please enter a valid limit.");

      return;
    }

    categoryBudgets[category] = limit;

    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));

    displayCategoryBudgets();

    budgetLimitForm.reset();

    alert(category + " budget limit set successfully!");
  });
}

/* =========================================================
   17. GET CATEGORY EXPENSE
========================================================= */

function getCategoryExpense(category) {
  return expenses.reduce(function (total, expense) {
    if (expense.category === category) {
      return total + Number(expense.amount);
    }

    return total;
  }, 0);
}

/* =========================================================
   18. DISPLAY CATEGORY BUDGETS
========================================================= */

function displayCategoryBudgets() {
  if (!budgetLimitList) {
    return;
  }

  budgetLimitList.innerHTML = "";

  const categories = Object.keys(categoryBudgets);

  if (categories.length === 0) {
    const message = document.createElement("p");

    message.textContent = "No category budgets set yet.";

    message.style.color = "#7b8782";

    budgetLimitList.appendChild(message);

    return;
  }

  categories.forEach(function (category) {
    const limit = Number(categoryBudgets[category]);

    const spent = getCategoryExpense(category);

    const remaining = limit - spent;

    const card = document.createElement("div");

    card.className = "budget-card";

    const title = document.createElement("h3");

    title.textContent = category;

    const limitText = document.createElement("p");

    limitText.textContent = "Limit: ₹" + limit.toLocaleString("en-IN");

    const spentText = document.createElement("p");

    spentText.textContent = "Spent: ₹" + spent.toLocaleString("en-IN");

    const remainingText = document.createElement("p");

    if (remaining < 0) {
      remainingText.textContent =
        "⚠️ Exceeded by ₹" + Math.abs(remaining).toLocaleString("en-IN");

      remainingText.className = "budget-exceeded";
    } else {
      remainingText.textContent =
        "Remaining: ₹" + remaining.toLocaleString("en-IN");

      remainingText.className = "budget-remaining";
    }

    card.appendChild(title);

    card.appendChild(limitText);

    card.appendChild(spentText);

    card.appendChild(remainingText);

    budgetLimitList.appendChild(card);
  });
}

/* =========================================================
   19. MONTHLY EXPENSE HISTORY
========================================================= */

function displayMonthlyHistory() {
  if (!monthlyHistory) {
    return;
  }

  const monthlyTotals = {};

  expenses.forEach(function (expense) {
    if (!expense.date) {
      return;
    }

    const parts = expense.date.split("-");

    if (parts.length !== 3) {
      return;
    }

    const year = parts[0];

    const month = parts[1];

    const key = year + "-" + month;

    if (!monthlyTotals[key]) {
      monthlyTotals[key] = 0;
    }

    monthlyTotals[key] += Number(expense.amount);
  });

  monthlyHistory.innerHTML = "";

  const months = Object.keys(monthlyTotals).sort().reverse();

  if (months.length === 0) {
    const message = document.createElement("p");

    message.textContent = "No monthly expense history available.";

    message.style.color = "#7b8782";

    monthlyHistory.appendChild(message);

    return;
  }

  months.forEach(function (monthKey) {
    const parts = monthKey.split("-");

    const year = Number(parts[0]);

    const month = Number(parts[1]) - 1;

    const date = new Date(year, month, 1);

    const monthName = date.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });

    const card = document.createElement("div");

    card.className = "history-card";

    const monthTitle = document.createElement("h3");

    monthTitle.textContent = monthName;

    const amount = document.createElement("p");

    amount.textContent = "₹" + monthlyTotals[monthKey].toLocaleString("en-IN");

    card.appendChild(monthTitle);

    card.appendChild(amount);

    monthlyHistory.appendChild(card);
  });
}

/* =========================================================
   20. EXPENSE BAR CHART
========================================================= */

function displayExpenseChart() {
  const chartCanvas = document.getElementById("expenseChart");

  if (!chartCanvas) {
    return;
  }

  /* Chart.js not loaded */

  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");

    return;
  }

  const categoryTotals = {};

  expenses.forEach(function (expense) {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }

    categoryTotals[expense.category] += Number(expense.amount);
  });

  const labels = Object.keys(categoryTotals);

  const data = Object.values(categoryTotals);

  /* Destroy previous chart */

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(chartCanvas, {
    type: "bar",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Expenses",

          data: data,

          backgroundColor: "#2f6f62",

          borderRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: function (value) {
              return "₹" + Number(value).toLocaleString("en-IN");
            },
          },
        },
      },
    },
  });
}

/* =========================================================
   21. INITIALIZE DASHBOARD
========================================================= */

if (
  document.body.classList.contains("dashboard-page") ||
  document.getElementById("expenseList")
) {
  displaySummary();

  displayExpenses();

  updateBudgetWarning();

  displayCategoryBudgets();

  displayMonthlyHistory();

  displayExpenseChart();
}
