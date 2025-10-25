// public/js/admins-list.js
(function () {
  const gridEl = document.getElementById("grid");
  if (!gridEl) return;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const roleTone = {
    superadmin: "bg-purple-100 text-purple-800 border-purple-200",
    admin: "bg-blue-100 text-blue-800 border-blue-200",
    moderator: "bg-amber-100 text-amber-800 border-amber-200",
    sales: "bg-emerald-100 text-emerald-800 border-emerald-200",
    default: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const statusTone = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    inactive: "bg-rose-100 text-rose-800 border-rose-200",
  };

  const roleBadge = (role) => {
    const r = (role || "").toString().toLowerCase();
    const cls = roleTone[r] || roleTone.default;
    const label =
      r === "superadmin"
        ? "Super Admin"
        : r === "admin"
        ? "Admin"
        : r === "moderator"
        ? "Moderator"
        : r === "sales"
        ? "Sales"
        : role || "—";
    return `<span class="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${cls}">${esc(
      label
    )}</span>`;
  };

  const nameCell = (u) => {
    const url = `/admin/${encodeURIComponent(u._id || "")}`;
    const name = u.name || "—";
    return gridjs.html(`
      <a href="${esc(url)}" class="text-blue-600 hover:underline">${esc(
      name
    )}</a>
    `);
  };

  const emailCell = (u) => esc(u.email || "—");

  const roleCell = (u) => gridjs.html(roleBadge(u.role));
  const statusBadge = (isActive) => {
    const on = !!isActive;
    const cls = on ? statusTone.active : statusTone.inactive;
    const label = on ? "Active" : "Inactive";
    return `<span class="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${cls}">${label}</span>`;
  };
  const statusCell = (u) => gridjs.html(statusBadge(u.isActive));
  const createdCell = (u) => {
    const d = u.createdAt ? new Date(u.createdAt) : null;
    if (!d || isNaN(d)) return "—";
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return gridjs.html(`
      <div class="leading-tight">
        <div>${esc(date)}</div>
        <div class="text-xs text-gray-500">${esc(time)}</div>
      </div>
    `);
  };

  // Build grid rows from API items
  const toRows = (items) =>
    items.map((u) => [
      nameCell(u),
      emailCell(u),
      roleCell(u),
      statusCell(u),
      createdCell(u),
    ]);

  // Local state for filters & pagination
  let state = {
    page: 1,
    limit: 20,
    q: "",
    role: "",
    status: "",
  };

  async function fetchPage() {
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
      q: state.q,
      role: state.role,
      status: state.status,
    });
    const { data } = await axios.get(`/admins/data?${params.toString()}`);
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total || 0),
      page: Number(data?.page || state.page),
      limit: Number(data?.limit || state.limit),
    };
  }

  function renderGrid({ items, total }) {
    const rows = toRows(items);

    // Destroy previous grid if re-rendering
    if (renderGrid._grid) {
      renderGrid._grid.updateConfig({ data: rows }).forceRender();
      // Update footer text for total (since gridjs doesn't know server-side total natively)
      const totalEl = document.querySelector("#adminsTotal");
      if (totalEl) totalEl.textContent = total.toString();
      return;
    }

    const grid = new gridjs.Grid({
      columns: [
        { name: "Name", sort: false },
        { name: "Email", sort: false },
        { name: "Role", sort: false },
        { name: "Status", sort: false },
        { name: "Created", sort: false },
      ],
      data: rows,
      pagination: {
        enabled: true,
        limit: state.limit,
      },
      search: {
        enabled: true,
        selector: (cell) => {
          // Make HTML cells searchable by visible text
          if (cell && typeof cell === "object" && "content" in cell) {
            const div = document.createElement("div");
            div.innerHTML = cell.content;
            return (div.textContent || "").trim().toLowerCase();
          }
          return String(cell ?? "")
            .trim()
            .toLowerCase();
        },
      },
      className: {
        table:
          "w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
        thead: "bg-gray-50",
        th: "text-left font-semibold text-gray-700 px-4 py-3 border-b border-gray-200",
        td: "px-4 py-3 border-b border-gray-100 text-sm",
        tbody: "divide-y divide-gray-100",
        footer: "px-4 py-3",
      },
      style: { th: { "white-space": "nowrap" } },
    });

    renderGrid._grid = grid;
    grid.render(gridEl);

    // Show total count under the grid
    let footer = document.getElementById("adminsTotalWrap");
    if (!footer) {
      footer = document.createElement("div");
      footer.id = "adminsTotalWrap";
      footer.className = "mt-3 text-sm text-gray-600";
      footer.innerHTML = `Total admins: <span id="adminsTotal">${total}</span>`;
      gridEl.parentElement.appendChild(footer);
    } else {
      const totalEl = footer.querySelector("#adminsTotal");
      if (totalEl) totalEl.textContent = total.toString();
    }
  }

  async function loadAndRender() {
    try {
      const pageData = await fetchPage();
      renderGrid(pageData);
    } catch (e) {
      console.error("[admins] load error:", e);
      const root = document.getElementById("grid");
      if (root) {
        root.innerHTML = `<div class="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          Failed to load admin users.
        </div>`;
      }
    }
  }

  // Hook up toolbar
  const searchInput = $("#searchInput");
  const roleFilter = $("#roleFilter");
  const statusFilter = $("#statusFilter");
  const applyFilters = $("#applyFilters");

  // Debounce search
  let t;
  searchInput?.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = searchInput.value.trim();
      state.page = 1;
      loadAndRender();
    }, 250);
  });

  applyFilters?.addEventListener("click", () => {
    state.role = roleFilter.value.trim();
    state.status = statusFilter.value.trim();
    state.page = 1;
    loadAndRender();
  });

  // Initial load
  loadAndRender();
})();
