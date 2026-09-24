let transactions = JSON.parse(localStorage.getItem("expenseFlow")) || [];
let budget = Number(localStorage.getItem("expenseFlowBudget")) || 0;
let transactionType = "expense";

const money = value =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(value);

const today = new Date().toISOString().split("T")[0];
const currentMonth = new Date().toISOString().slice(0, 7);

function save() {
    localStorage.setItem("expenseFlow", JSON.stringify(transactions));
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function totals(list = transactions) {
    let income = 0;
    let expense = 0;

    list.forEach(t =>
        t.type === "income"
            ? income += Number(t.amount)
            : expense += Number(t.amount)
    );

    return {
        income,
        expense,
        balance: income - expense
    };
}

function monthly(month = currentMonth) {
    return transactions.filter(t => t.date.startsWith(month));
}

function deleteTransaction(id) {
    if (!confirm("Delete this transaction?")) return;

    transactions = transactions.filter(t => t.id !== id);
    save();
    renderAll();
}

function renderAll() {
    const t = totals();

    if (document.getElementById("totalIncome")) {
        document.getElementById("totalIncome").textContent = money(t.income);
    }

    if (document.getElementById("totalExpense")) {
        document.getElementById("totalExpense").textContent = money(t.expense);
    }

    if (document.getElementById("balance")) {
        document.getElementById("balance").textContent = money(t.balance);
    }

    renderTransactions();
    renderRecent();
    renderBudget();
    renderSummary();
}

function renderTransactions() {
    const list = document.getElementById("transactionList");

    if (!list) return;

    const search = (
        document.getElementById("searchInput")?.value || ""
    ).toLowerCase();

    const type =
        document.getElementById("filterType")?.value || "all";

    const cat =
        document.getElementById("filterCategory")?.value || "all";

    const filtered = transactions
        .filter(t =>
            (
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            ) &&
            (type === "all" || t.type === type) &&
            (cat === "all" || t.category === cat)
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = "";

    const empty = document.getElementById("emptyMessage");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }

    filtered.forEach(t => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${escapeHTML(t.description)}</strong>
            </td>
            <td>${escapeHTML(t.category)}</td>
            <td>
                ${new Date(t.date + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )}
            </td>
            <td>
                <span class="type ${t.type}">
                    ${t.type}
                </span>
            </td>
            <td class="${
                t.type === "income"
                    ? "amount-income"
                    : "amount-expense"
            }">
                ${t.type === "income" ? "+" : "-"}${money(t.amount)}
            </td>
            <td>
                <button
                    class="delete-btn"
                    onclick="deleteTransaction(${t.id})"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        list.appendChild(row);
    });

    const ic = document.getElementById("incomeCount");
    const ec = document.getElementById("expenseCount");
    const tc = document.getElementById("transactionCount");

    if (ic) {
        ic.textContent = transactions.filter(
            t => t.type === "income"
        ).length;
    }

    if (ec) {
        ec.textContent = transactions.filter(
            t => t.type === "expense"
        ).length;
    }

    if (tc) {
        tc.textContent = transactions.length;
    }
}

function renderRecent() {
    const box = document.getElementById("recentTransactions");

    if (!box) return;

    const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    box.innerHTML = recent.length
        ? recent
              .map(
                  t => `
                    <div class="recent-item">
                        <div>
                            <strong>${escapeHTML(t.description)}</strong>
                            <br>
                            <small>
                                ${escapeHTML(t.category)} · ${t.date}
                            </small>
                        </div>

                        <strong class="${
                            t.type === "income"
                                ? "amount-income"
                                : "amount-expense"
                        }">
                            ${t.type === "income" ? "+" : "-"}${money(t.amount)}
                        </strong>
                    </div>
                `
              )
              .join("")
        : `
            <div class="empty-message">
                <i class="fa-solid fa-receipt"></i>
                <p>No recent transactions.</p>
            </div>
        `;
}

function renderBudget() {
    const input = document.getElementById("budgetInput");

    if (input) {
        input.value = budget || "";
    }

    const month = monthly(currentMonth);
    const spent = totals(month).expense;
    const percent = budget
        ? Math.min((spent / budget) * 100, 100)
        : 0;

    const bar = document.getElementById("budgetProgress");
    const text = document.getElementById("budgetText");
    const status = document.getElementById("budgetStatus");

    if (bar) {
        bar.style.width = percent + "%";
    }

    if (text) {
        text.textContent = `${money(spent)} / ${money(budget)}`;
    }

    if (status) {
        status.textContent = budget
            ? spent > budget
                ? "Budget exceeded. Review your spending."
                : `${Math.round(percent)}% of your budget used.`
            : "Set a budget to monitor your spending.";
    }
}

function renderSummary() {
    const filter = document.getElementById("monthFilter");

    if (!filter) return;

    const month = filter.value || currentMonth;
    const list = monthly(month);
    const t = totals(list);

    document.getElementById("monthlyIncome").textContent =
        money(t.income);

    document.getElementById("monthlyExpense").textContent =
        money(t.expense);

    document.getElementById("monthlyBalance").textContent =
        money(t.balance);

    const percent = budget
        ? Math.min((t.expense / budget) * 100, 100)
        : 0;

    document.getElementById("summaryProgress").style.width =
        percent + "%";

    document.getElementById("summaryPercent").textContent =
        Math.round(percent) + "%";

    document.getElementById("summaryBudgetText").textContent =
        `${money(t.expense)} / ${money(budget)}`;

    document.getElementById("summaryStatus").textContent = budget
        ? t.expense > budget
            ? "Budget exceeded for this month."
            : "Spending is within your monthly budget."
        : "Set a budget from the dashboard.";

    const cats = {};

    list
        .filter(t => t.type === "expense")
        .forEach(t => {
            cats[t.category] =
                (cats[t.category] || 0) + Number(t.amount);
        });

    const total = t.expense;
    const box = document.getElementById("categoryBreakdown");

    if (!box) return;

    const entries = Object.entries(cats).sort(
        (a, b) => b[1] - a[1]
    );

    box.innerHTML = entries.length
        ? entries
              .map(([name, value]) => {
                  const p = total
                      ? (value / total) * 100
                      : 0;

                  return `
                    <div class="category-row">
                        <span>${escapeHTML(name)}</span>

                        <div class="category-track">
                            <div style="width: ${p}%"></div>
                        </div>

                        <strong>${money(value)}</strong>
                    </div>
                `;
              })
              .join("")
        : `
            <div class="empty-message">
                <p>No expense data for this month.</p>
            </div>
        `;
}

function exportCSV() {
    if (!transactions.length) {
        alert("There are no transactions to export.");
        return;
    }

    const rows = [
        [
            "Description",
            "Category",
            "Date",
            "Type",
            "Amount"
        ],
        ...transactions.map(t => [
            t.description,
            t.category,
            t.date,
            t.type,
            t.amount
        ])
    ];

    const csv = rows
        .map(row =>
            row
                .map(value =>
                    `"${String(value).replaceAll('"', '""')}"`
                )
                .join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "expenseflow-transactions.csv";
    a.click();

    URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
    const date = document.getElementById("date");

    if (date) {
        date.value = today;
    }

    const month = document.getElementById("monthFilter");

    if (month) {
        month.value = currentMonth;
    }

    document.querySelectorAll(".type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".type-btn")
                .forEach(x => x.classList.remove("active"));

            btn.classList.add("active");

            transactionType = btn.dataset.type;

            const c = document.getElementById("category");

            if (c) {
                c.innerHTML =
                    transactionType === "income"
                        ? `
                            <option>Salary</option>
                            <option>Business</option>
                            <option>Investment</option>
                            <option>Gift</option>
                            <option>Other</option>
                        `
                        : `
                            <option>Food</option>
                            <option>Transport</option>
                            <option>Shopping</option>
                            <option>Bills</option>
                            <option>Education</option>
                            <option>Entertainment</option>
                            <option>Health</option>
                            <option>Other</option>
                        `;
            }
        });
    });

    const form = document.getElementById("transactionForm");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();

            const description =
                document.getElementById("description").value.trim();

            const amount =
                Number(document.getElementById("amount").value);

            const date =
                document.getElementById("date").value;

            const category =
                document.getElementById("category").value;

            if (!description || amount <= 0 || !date) {
                alert("Please enter valid details.");
                return;
            }

            transactions.push({
                id: Date.now(),
                description,
                amount,
                date,
                category,
                type: transactionType
            });

            save();

            form.reset();

            document.getElementById("date").value = today;

            renderAll();
        });
    }

    const saveBudget = document.getElementById("saveBudget");

    if (saveBudget) {
        saveBudget.addEventListener("click", () => {
            budget =
                Number(
                    document.getElementById("budgetInput").value
                ) || 0;

            localStorage.setItem(
                "expenseFlowBudget",
                budget
            );

            renderAll();
        });
    }

    ["searchInput", "filterType", "filterCategory"].forEach(id => {
        const e = document.getElementById(id);

        if (e) {
            e.addEventListener("input", renderTransactions);
        }
    });

    const mf = document.getElementById("monthFilter");

    if (mf) {
        mf.addEventListener("change", renderSummary);
    }

    const ex = document.getElementById("exportBtn");

    if (ex) {
        ex.addEventListener("click", exportCSV);
    }

    renderAll();
});
