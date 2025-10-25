(function () {
  const gridEl = document.getElementById("grid");
  if (!gridEl) return;

  const DEFAULT_AVATAR =
    window.DEFAULT_AVATAR_URL || "/public/images/avatar-placeholder.png";

  const BASE = "https://api.link234.com";
  const withBase = (p) => {
    if (!p) return "";
    const s = String(p).trim();
    if (/^https?:\/\//i.test(s)) return s;
    return `${BASE}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const tones = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    red: "bg-rose-100 text-rose-800 border-rose-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
  };

  const avatar = (url) => {
    const src = url && String(url).trim() ? withBase(url) : "";
    return (
      src ||
      window.DEFAULT_AVATAR_URL ||
      "/public/images/avatar-placeholder.png"
    );
  };

  const icon = {
    check: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
    warn: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 1.05 1.82 15a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 1.05a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  };

  const iconBadge = (svg, tone = "gray") =>
    `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full border ${
      tones[tone] || tones.gray
    }">${svg}</span>`;

  // ---------- data ----------
  async function fetchUsers() {
    const { data } = await axios.get(
      window.APP_USERS_DATA_URL || "/users/data"
    );
    return Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];
  }

  // ---------- cell builders ----------
  function profileCell(u) {
    const url = `https://link234.com/${encodeURIComponent(u.username || "")}`;
    const imgSrc = avatar(u.profileImg); // your helper that prefixes the base
    const name = u.profileName || "—";
    const uname = u.username || "—";

    return gridjs.html(`
    <a href="${esc(url)}" target="_blank" rel="noopener noreferrer"
       class="flex items-center gap-3 text-left">
      <img
        class="user-avatar w-9 h-9 rounded-full object-cover border border-gray-200 bg-gray-100"
        src="${esc(imgSrc)}"
        alt="${esc(name)}"
        loading="lazy"
        fetchpriority="low"
        data-fallback="${esc(DEFAULT_AVATAR)}"
        onerror="this.onerror=null; this.src=this.dataset.fallback;"
      />
      <div class="leading-tight">
        <div class="font-medium text-gray-900">${esc(name)}</div>
        <div class="text-xs text-gray-500">@${esc(uname)}</div>
      </div>
    </a>
  `);
  }

  function emailCell(u) {
    const v = !!u.verified;
    const tone = v ? "green" : "red";
    const ico = v ? icon.check : icon.warn;

    const joined = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

    return gridjs.html(`
    <div class="flex flex-col">
      <div class="flex items-center gap-2">
        ${iconBadge(ico, tone)}
        <div class="text-sm text-gray-900">${esc(u.email || "—")}</div>
      </div>
      <div class="text-xs text-gray-500 ml-8 mt-0.5">Joined: ${esc(
        joined
      )}</div>
    </div>
  `);
  }

  function statusCell(u) {
    const isActive = String(u.status || "").toLowerCase() === "active";
    const tone = isActive ? "green" : "red";
    const ico = isActive ? icon.check : icon.warn;
    return gridjs.html(iconBadge(ico, tone));
  }

  const countryCell = (u) => esc(u.country || "—");
  const phoneCell = (u) => esc(u.phoneNumber || "—");

  function toggleCell(u) {
    const isActive = String(u.status || "").toLowerCase() === "active";
    const id = u._id || "";
    return gridjs.html(`
      <label class="user-toggle inline-flex items-center gap-2 cursor-pointer select-none" data-id="${esc(
        id
      )}">
        <input type="checkbox" class="sr-only user-toggle-input" data-id="${esc(
          id
        )}" ${isActive ? "checked" : ""} />
        <span class="relative inline-block w-10 h-6 rounded-full transition ${
          isActive ? "bg-teal-500" : "bg-gray-300"
        }">
          <span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            isActive ? "translate-x-4" : ""
          }"></span>
        </span>
        <span class="text-sm ${isActive ? "text-teal-700" : "text-gray-600"}">
          ${isActive ? "Active" : "Inactive"}
        </span>
      </label>
    `);
  }

  // ---------- grid init ----------
  (async function init() {
    let users = [];
    try {
      users = await fetchUsers();
    } catch (e) {
      const root = $("#toastRoot");
      const t = document.createElement("div");
      t.className =
        "rounded-xl border p-3 bg-white border-rose-200 shadow text-sm";
      t.textContent =
        e?.response?.data?.message || e.message || "Failed to load users";
      root?.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }

    const rows = users.map((u) => {
      const name = (u.profileName || "").trim();
      const uname = (u.username || "").trim();
      const email = (u.email || "").trim();
      const status = String(u.status || "")
        .trim()
        .toLowerCase(); // "active"/"inactive"
      const country = (u.country || "").trim();
      const phone = (u.phoneNumber || "").trim();

      // all searchable text in one hidden column (lowercased for case-insensitive matches)
      const searchText = [name, uname, email, status, country, phone]
        .join(" ")
        .toLowerCase();

      return [
        profileCell(u),
        emailCell(u),
        statusCell(u),
        countryCell(u),
        phoneCell(u),
        toggleCell(u),
        searchText, // <- hidden search column
      ];
    });

    const grid = new gridjs.Grid({
      columns: [
        { name: "User", sort: true },
        { name: "Email / Verified", sort: true },
        { name: "Status", sort: true },
        { name: "Country", sort: true },
        { name: "Phone", sort: true },
        { name: "Toggle", sort: false },
      ],
      data: rows,
      // keep built-in search UI, but we'll drive it ourselves
      search: { enabled: true },
      pagination: { enabled: true, limit: 20 },
      sort: true,
      className: {
        table:
          "w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
        thead: "bg-gray-50",
        th: "text-left font-semibold text-gray-700 px-4 py-3 border-b border-gray-200",
        td: "px-4 py-3 border-b border-gray-100 text-sm",
        tbody: "divide-y divide-gray-100",
      },
      style: { th: { "white-space": "nowrap" } },
    });

    grid.on("ready", () => {
      // find Grid.js' own search input
      const searchInput =
        gridEl.querySelector(".gridjs-search input.gridjs-input") ||
        gridEl.querySelector('input[type="search"].gridjs-input');

      if (!searchInput) return;

      const selector = (cell) => {
        // turn HTML cells (gridjs.html) into text
        if (cell && typeof cell === "object" && "content" in cell) {
          const div = document.createElement("div");
          div.innerHTML = cell.content;
          return (div.textContent || "").trim().toLowerCase();
        }
        return String(cell ?? "")
          .trim()
          .toLowerCase();
      };

      // drive filtering explicitly on every keystroke
      searchInput.addEventListener("input", (e) => {
        const keyword = (e.target.value || "").toLowerCase();
        grid
          .updateConfig({
            search: { keyword, selector },
          })
          .forceRender();
      });
    });

    grid.render(gridEl);

    // Toggle handler
    gridEl.addEventListener("change", (e) => {
      const input = e.target.closest(".user-toggle-input");
      if (!input) return;
      const id = input.getAttribute("data-id");
      const wrap = input.closest(".user-toggle");
      const bar = wrap?.children[1];
      const text = wrap?.children[2];
      const knob = bar?.firstElementChild;
      const on = input.checked;

      bar?.classList.toggle("bg-teal-500", on);
      bar?.classList.toggle("bg-gray-300", !on);
      knob?.classList.toggle("translate-x-4", on);
      text && (text.textContent = on ? "Active" : "Inactive");
      text?.classList.toggle("text-teal-700", on);
      text?.classList.toggle("text-gray-600", !on);

      // TODO: wire API
      // axios.patch(`/api/admin/users/${id}/status`, { status: on ? "active" : "inactive" });
    });

    grid.render(gridEl);
  })();
})();
