(function () {
  // ========= helpers =========
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const strip = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || "").trim();
  };

  // ========= data =========
  const src = Array.isArray(window.PURCHASES) ? window.PURCHASES : [];

  // ========= state =========
  let filterMode = "all"; // 'all' | 'paid' | 'unpaid'

  // ========= utils =========
  const CURRENCY_SYMBOL = { EUR: "€", USD: "$", INR: "₹" };
  const sym = (code) => CURRENCY_SYMBOL[code] || code || "";

  // ========= filtering =========
  const filtered = () =>
    src.filter((r) => {
      if (filterMode === "paid") return !!r.paid;
      if (filterMode === "unpaid") return !r.paid;
      return true;
    });

  // ========= cell builders (return {text,num,html}) =========
  function PlanCell(r) {
    const plan = r.planName || "—";
    const dur = r.durationDays ?? "—";
    const text = `${plan} (${dur} days)`;
    const html = `
      <div class="flex items-center gap-2">
        <span class="font-medium">${esc(plan)}</span>
        <span class="text-xs text-gray-500">(${esc(dur)} days)</span>
      </div>`;
    return { text, html };
  }

  function TxnCell(r) {
    const id = r.transactionId || "";
    if (!id) return { text: "—", html: "—" };
    const safe = esc(id);
    const html = `
      <span class="sr-only">${safe}</span>
      <span class="inline-block max-w-[80px] align-middle truncate" title="${safe}">
        ${safe}
      </span>`;
    return { text: id, html };
  }

  function AmountCell(r) {
    const amt = Number(r.final ?? 0);
    const code = r.currency || "";
    const txt = `${sym(code)}${amt.toFixed(2)}`;
    return { text: txt, num: amt, html: esc(txt) };
  }

  function StatusCell(r) {
    const paid = !!r.paid;
    const text = paid ? "Paid" : "Pending";
    const num = paid ? 1 : 0;
    const html = paid
      ? `
        <span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full dark:bg-teal-500/10 dark:text-teal-500">
          <svg class="shrink-0 size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          Paid
        </span>`
      : `
        <span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full dark:bg-amber-500/10 dark:text-amber-500">
          <svg class="shrink-0 size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="m15 9-6 6"></path>
            <path d="m9 9 6 6"></path>
          </svg>
          Pending
        </span>`;
    return { text, num, html };
  }

  function DateCell(r) {
    const d = new Date(r.createdAt);
    const ts = d.getTime();
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const html = `
      <div class="leading-tight">
        <div>${esc(date)}</div>
        <div class="text-xs text-gray-500">${esc(time)}</div>
      </div>`;
    return { text: `${date} ${time}`, num: ts, html };
  }

  // ========= rows =========
  function toRows(arr) {
    return arr.map((r) => {
      const username = r.username || r.userName || "—";
      const profileUrl =
        username !== "—"
          ? `https://link234.com/${encodeURIComponent(username)}`
          : "#";

      return [
        gridjs.html(
          `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
          ${esc(r.userName || "—")}
        </a>`
        ),
        r.userEmail || "—", // 1 Email
        PlanCell(r), // 2 Plan (html)
        (r.provider || "").toUpperCase(),
        TxnCell(r),
        r.couponCode || "—",
        AmountCell(r),
        r.region || "—",
        StatusCell(r),
        DateCell(r),
      ];
    });
  }

  // ========= Grid.js =========
  const grid = new gridjs.Grid({
    columns: [
      { name: "User", sort: true },
      { name: "Email", sort: true },
      {
        // Plan
        name: "Plan",
        sort: {
          compare: (a, b) =>
            (a?.text || strip(a?.html || String(a || ""))).localeCompare(
              b?.text || strip(b?.html || String(b || ""))
            ),
        },
        formatter: (cell) => gridjs.html(cell?.html ?? esc(cell?.text ?? "")),
      },
      { name: "Provider", sort: true },
      {
        // Txn ID
        name: "Txn ID",
        sort: {
          compare: (a, b) =>
            (a?.text || strip(a?.html || "")).localeCompare(
              b?.text || strip(b?.html || "")
            ),
        },
        formatter: (cell) => gridjs.html(cell?.html ?? esc(cell?.text ?? "")),
      },
      { name: "Coupon", sort: true },
      {
        // Amount
        name: "Amount",
        sort: {
          compare: (a, b) =>
            (Number(a?.num ?? parseFloat(a?.text)) || 0) -
            (Number(b?.num ?? parseFloat(b?.text)) || 0),
        },
        formatter: (cell) => cell?.html ?? esc(cell?.text ?? ""),
      },
      { name: "Region", sort: true },
      {
        // Status
        name: "Status",
        sort: {
          compare: (a, b) =>
            (Number(a?.num ?? a?.text === "Paid") || 0) -
            (Number(b?.num ?? b?.text === "Paid") || 0),
        },
        formatter: (cell) => gridjs.html(cell?.html ?? esc(cell?.text ?? "")),
      },
      {
        // Date
        name: "Date",
        sort: {
          compare: (a, b) => (Number(a?.num) || 0) - (Number(b?.num) || 0),
        },
        formatter: (cell) => gridjs.html(cell?.html ?? esc(cell?.text ?? "")),
      },
    ],
    data: toRows(filtered()),
    search: {
      enabled: true,
      selector: (cell) => {
        // Prefer semantic text if present
        if (cell && typeof cell === "object") {
          if ("text" in cell && cell.text != null) return String(cell.text);
          if ("html" in cell && cell.html != null) return strip(cell.html);
          if ("content" in cell) {
            const tmp = document.createElement("div");
            tmp.innerHTML = cell.content;
            return tmp.textContent || "";
          }
        }
        return cell ?? "";
      },
    },
    sort: true,
    pagination: { enabled: true, limit: 20 },
    className: {
      table:
        "w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
      thead: "bg-gray-50",
      th: "text-left font-semibold text-gray-700 px-4 py-3 border-b border-gray-200",
      td: "px-4 py-3 border-b border-gray-100 text-sm",
      tbody: "divide-y divide-gray-100",
      footer: "px-4 py-3",
    },
    style: {
      th: { "white-space": "nowrap" },
      td: { "vertical-align": "middle" },
    },
  }).render(document.getElementById("grid"));

  // ========= refresh =========
  function refresh() {
    const rows = toRows(filtered());
    grid
      .updateConfig({
        data: rows,
        pagination: { enabled: true, limit: 20, page: 1 },
      })
      .forceRender();

    const count = rows.length;
    document.title = `Memberships (${count}) · Link234`;
    console.log("[Memberships] refresh => rows:", count, { filterMode });
  }

  // ========= toolbar: Paid / Unpaid only =========
  $("#btnPaid")?.addEventListener("click", () => {
    if (filterMode === "paid") {
      filterMode = "all";
      $("#btnPaid").classList.remove("bg-gray-900", "text-white");
    } else {
      filterMode = "paid";
      $("#btnPaid").classList.add("bg-gray-900", "text-white");
      $("#btnUnpaid")?.classList.remove("bg-gray-900", "text-white");
    }
    refresh();
  });

  $("#btnUnpaid")?.addEventListener("click", () => {
    if (filterMode === "unpaid") {
      filterMode = "all";
      $("#btnUnpaid").classList.remove("bg-gray-900", "text-white");
    } else {
      filterMode = "unpaid";
      $("#btnUnpaid").classList.add("bg-gray-900", "text-white");
      $("#btnPaid")?.classList.remove("bg-gray-900", "text-white");
    }
    refresh();
  });

  // ========= place toolbar next to search (optional) =========
  let moved = false;
  function placeToolbar() {
    if (moved) return;
    const head =
      document.querySelector("#grid .gridjs-head") ||
      document.querySelector(".gridjs-head");
    if (!head) return;
    head.classList.add("flex", "items-center", "gap-3");
    const search = head.querySelector(".gridjs-search");
    if (search) {
      search.classList.add("order-2", "flex-1");
      const tb = $("#gridToolbar");
      if (tb) {
        tb.classList.add("order-1", "mb-0", "flex-1");
        head.prepend(tb);
        moved = true;
      }
    }
  }
  grid.on("ready", placeToolbar);
  grid.on("updated", placeToolbar);

  // ========= initial render =========
  refresh();
})();
