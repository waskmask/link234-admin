(function () {
  let ITEMS = []; // keep fetched items

  const gridEl = document.getElementById("grid");
  if (!gridEl) return;

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const normType = (t) => (t || "").toString().trim().toLowerCase();

  const dateCell = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return gridjs.html(
      `<div class="leading-tight">
         <div>${esc(date)}</div>
         <div class="text-xs text-gray-500">${esc(time)}</div>
       </div>`
    );
  };

  const badge = (type) => {
    const t = normType(type);
    const isNewsletter = t === "newsletter";
    const cls = isNewsletter
      ? "bg-blue-100 text-blue-800"
      : "bg-emerald-100 text-emerald-800";
    const label = isNewsletter ? "newsletter" : t || "contact";
    return gridjs.html(
      `<span class="capitalize inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cls}">
         ${esc(label)}
       </span>`
    );
  };

  // prefer first non-empty among several candidate keys
  const pick = (obj, keys, fallback = "") => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return fallback;
  };

  // ---------- data ----------
  async function load() {
    try {
      const { data } = await axios.get("/form/submissions/data");
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      return items;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load form submissions";
      console.error("[form-submissions] load error:", err);

      const root =
        document.getElementById("toastRoot") ||
        (() => {
          const el = document.createElement("div");
          el.id = "toastRoot";
          el.className = "fixed bottom-4 right-4 space-y-3 z-[200]";
          document.body.appendChild(el);
          return el;
        })();

      const t = document.createElement("div");
      t.className = "rounded-xl border p-3 bg-white border-rose-200 shadow";
      t.textContent = msg;
      root.appendChild(t);
      setTimeout(() => t.remove(), 4000);

      return [];
    }
  }

  // ---------- cells ----------
  function nameCell(row, idx) {
    const type = normType(pick(row, ["form_type", "type"]));
    const fullName = pick(row, ["fullName", "name", "full_name"], "—");
    // Only clickable for contact; for newsletter render plain text
    if (type !== "contact") {
      return esc(fullName);
    }

    // put ALL values directly on the button (no JSON in attributes)
    const id = pick(row, ["_id", "id"], String(idx));
    const email = pick(row, ["email", "mail"]);
    const phone = pick(row, ["phoneNumber", "phone", "phone_number"]);
    const country = pick(row, ["country", "country_name"]);
    const message = pick(row, ["message", "msg", "body", "content"]);
    const createdAt = pick(row, ["createdAt", "created_at", "created"]);

    const attr = (v) => String(v ?? "").replace(/"/g, "&quot;");

    return gridjs.html(`
  <button
    type="button"
    class="contact-view text-blue-600 hover:underline"
    data-id="${attr(id)}"
    data-fullname="${attr(fullName)}"
    data-email="${attr(email)}"
    data-phone="${attr(phone)}"
    data-country="${attr(country)}"
    data-message="${attr(message)}"
    data-created="${attr(createdAt)}"
    data-search="${attr(fullName.toLowerCase())}"
  >${esc(fullName)}</button>
`);
  }

  function toRows(items) {
    return items.map((r, i) => {
      const name = pick(r, ["fullName", "name", "full_name"], "");
      const email = pick(r, ["email", "mail"], "");
      const type = pick(r, ["form_type", "type"], "contact");
      const created = pick(r, ["createdAt", "created_at", "created"], "");
      const search = [name, email, type, created].join(" ").toLowerCase();

      return [
        nameCell(r, i),
        email || "—",
        badge(type),
        dateCell(created),
        search, // 🔍 hidden column purely for search
      ];
    });
  }

  // ---------- delegate once ----------
  function delegateOnce() {
    if (delegateOnce._bound) return;
    delegateOnce._bound = true;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".contact-view");
      if (!btn) return;

      // Prefer values already on the button (works even after sorting/pagination)
      const fullName = btn.dataset.fullname || "—";
      const email = btn.dataset.email || "—";
      const phone = btn.dataset.phone || "—";
      const country = btn.dataset.country || "—";
      const message = btn.dataset.message || "—";
      const createdAt = btn.dataset.created || "";

      const modal = document.getElementById("submissionModal");
      if (!modal) return;

      const setText = (id, val) => {
        const el = modal.querySelector("#" + id);
        if (el) el.textContent = (val ?? "—").toString();
      };

      setText("m_fullName", fullName);
      setText("m_email", email);
      setText("m_phone", phone);
      setText("m_country", country);
      setText("m_message", message);

      if (createdAt) {
        const d = new Date(createdAt);
        setText(
          "m_created",
          isNaN(d)
            ? "—"
            : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`
        );
      } else {
        setText("m_created", "—");
      }

      // Open modal (Preline + fallback)
      // Open modal (Preline if present, else our fallback)
      try {
        window.HSOverlay?.autoInit?.();
        if (window.HSOverlay?.open) {
          window.HSOverlay.open(modal);
        } else {
          forceOpenModal(modal);
        }
      } catch {
        forceOpenModal(modal);
      }
    });
  }

  // ---------- init ----------
  (async function init() {
    ITEMS = await load();
    const rows = toRows(ITEMS);

    const grid = new gridjs.Grid({
      columns: [
        { name: "Full Name", sort: true },
        { name: "Email", sort: true },
        { name: "Form Type", sort: true },
        { name: "Created", sort: true },
        { name: "_search", hidden: true }, // 👈 hidden searchable text
      ],
      data: rows,
      search: {
        enabled: true,
        selector: (cell) => String(cell || "").toLowerCase(),
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
    });

    delegateOnce();
    function forceOpenModal(modal) {
      modal.classList.remove("hidden", "pointer-events-none");
      const target =
        modal.querySelector(".hs-overlay-animation-target") ||
        modal.firstElementChild;
      if (target) {
        target.classList.remove("opacity-0", "scale-95");
        target.classList.add("opacity-100", "scale-100");
      }
      modal.setAttribute("aria-hidden", "false");
    }

    function forceCloseModal(modal) {
      const target =
        modal.querySelector(".hs-overlay-animation-target") ||
        modal.firstElementChild;
      if (target) {
        target.classList.add("opacity-0", "scale-95");
        target.classList.remove("opacity-100", "scale-100");
      }
      // tiny delay to allow transition (optional)
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
      }, 150);
    }

    grid.render(gridEl);
  })();
})();
