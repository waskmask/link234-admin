(function () {
  const data = window.__DASHBOARD__ || {};
  const sum = data.summary || {};
  const charts = data.charts || {};

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const fmtNum = (v) => (typeof v === "number" ? v.toLocaleString() : "—");

  // Minor-unit map (extend as needed)
  const MINOR_UNITS = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    INR: 2,
    AED: 2,
    SAR: 2,
    JPY: 0,
    KRW: 0,
    KWD: 3,
    BHD: 3,
  };

  function minorToDisplay(minor, currency) {
    if (typeof minor !== "number") return "—";
    const dec = MINOR_UNITS[currency] ?? 2;
    const major = minor / Math.pow(10, dec);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: dec,
        minimumFractionDigits: dec,
      }).format(major);
    } catch {
      // Fallback if currency is unknown
      return `${major.toFixed(dec)} ${currency || ""}`.trim();
    }
  }

  function currenciesLine(obj) {
    if (!obj || typeof obj !== "object") return "—";
    const parts = Object.entries(obj).map(([cur, minor]) =>
      minorToDisplay(minor, cur)
    );
    return parts.length ? parts.join(" · ") : "—";
  }

  // ---------- KPIs ----------
  $("#kpi_usersTotal").textContent = fmtNum(sum.usersTotal);
  $("#kpi_usersActive").textContent = fmtNum(sum.usersActive);
  $("#kpi_usersInactive").textContent = fmtNum(sum.usersInactive);
  $("#kpi_usersVerified").textContent = fmtNum(sum.usersVerified);
  $("#kpi_usersUnverified").textContent = fmtNum(sum.usersUnverified);
  $("#kpi_purchasesTotal").textContent = fmtNum(sum.purchasesTotal);
  $("#kpi_couponsTotal").textContent = fmtNum(sum.couponsTotal);
  $("#kpi_formsTotal").textContent = fmtNum(sum.formsTotal);

  // Show revenue per currency (pretty, with symbols)
  // If there is only one currency, the KPI shows a single formatted amount.
  // If there are multiple currencies, it shows them joined by dots: "€1,234.56 · $789.00 · ₹500.00"
  const revByCur = sum.revenueByCurrency || {};
  const revLine = currenciesLine(revByCur);
  const singleCurrency =
    Object.keys(revByCur).length === 1
      ? minorToDisplay(Object.values(revByCur)[0], Object.keys(revByCur)[0])
      : null;

  // Prefer single pretty value if only one currency; otherwise show the combined line
  $("#kpi_revenueMinorTotal").textContent = singleCurrency || revLine;
  $("#kpi_revenueByCurrency").textContent = singleCurrency ? "" : revLine; // hide sub-line if single currency

  // ---------- Breakdown table (format each row with its currency) ----------
  const tbody = document.getElementById("rev_tbody");
  if (tbody && Array.isArray(sum.revenueBreakdown)) {
    tbody.innerHTML = sum.revenueBreakdown
      .map((r) => {
        const region = r.region || "—";
        const cur = r.currency || "USD";
        const tx = fmtNum(r.totalTransactions || 0);
        const amt = minorToDisplay(r.totalAmountMinor || 0, cur);
        return `
          <tr>
            <td class="py-2">${region}</td>
            <td class="py-2">${cur}</td>
            <td class="py-2 num">${tx}</td>
            <td class="py-2 num">${amt}</td>
          </tr>
        `;
      })
      .join("");
  }

  // ---------- Users chart (unchanged) ----------
  const usersSeries = (data.charts && data.charts.usersPerMonth) || {
    labels: [],
    data: [],
  };
  const ctx = document.getElementById("usersChart");
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: usersSeries.labels,
        datasets: [
          {
            label: "New users",
            data: usersSeries.data,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { drawBorder: false },
          },
          x: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.parsed.y.toLocaleString()} users`,
            },
          },
        },
      },
    });
  }
})();
