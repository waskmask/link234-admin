document.addEventListener("DOMContentLoaded", async () => {
  const gridEl = document.getElementById("grid");
  if (!gridEl) return;

  // ------- helpers -------
  const $ = (sel, root = document) => root.querySelector(sel);
  const money = (minor) =>
    typeof minor === "number" ? (minor / 100).toFixed(2) : "—";

  function toast(text, type = "success") {
    const root = document.getElementById("toastRoot");
    if (!root) return alert(text);
    const el = document.createElement("div");
    el.className = `pointer-events-auto rounded-xl border p-3 shadow-md bg-white ${
      type === "error" ? "border-rose-200" : "border-green-200"
    }`;
    el.innerHTML = `
      <div class="flex items-start gap-3">
        <div>${type === "error" ? "⚠️" : "✅"}</div>
        <div class="text-sm text-gray-800 flex-1">${text}</div>
        <button class="shrink-0 text-gray-500 hover:text-gray-800">✖</button>
      </div>`;
    el.querySelector("button").onclick = () => el.remove();
    root.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function setModalText(id, val) {
    const modal = document.getElementById("couponModal");
    if (!modal) return;
    const el = modal.querySelector("#" + id);
    if (el) el.textContent = (val ?? "—").toString();
  }

  function fillModal(c) {
    setModalText("m_code", c?.code || "—");
    setModalText("m_type", c?.type || "—");

    const val =
      c?.type === "percent"
        ? c?.value != null
          ? `${c.value}%`
          : "—"
        : c?.type === "amount"
        ? money(c?.amountMinor ?? c?.valueMinor)
        : c?.value ?? "—";
    setModalText("m_value", val);

    setModalText("m_active", c?.isActive ? "Active" : "Inactive");

    const regions =
      typeof c?.regions === "string"
        ? c.regions
        : Array.isArray(c?.regions)
        ? c.regions.join(", ")
        : "—";
    setModalText("m_regions", regions);

    setModalText("m_max", money(c?.maxDiscountMinor));
    setModalText(
      "m_starts",
      c?.startsAt ? new Date(c.startsAt).toLocaleString() : "—"
    );
    setModalText(
      "m_ends",
      c?.endsAt ? new Date(c.endsAt).toLocaleString() : "—"
    );
    setModalText("m_usage", c?.usageLimit ?? "—");
    setModalText("m_peruser", c?.perUserLimit ?? "—");
    setModalText("m_notes", c?.notes || "—");
    setModalText(
      "m_stats",
      c?.stats ? `Total redemptions: ${c.stats.totalRedemptions ?? 0}` : "—"
    );
  }

  function openModal() {
    const modal = document.getElementById("couponModal");
    if (!modal) return;
    if (window.HSOverlay && typeof window.HSOverlay.open === "function") {
      window.HSOverlay.open(modal);
    } else {
      modal.classList.remove("hidden");
    }
  }

  // ------- data -------
  const { data } = await axios.get("/coupons/data");
  const coupons = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  // Row builder — put individual fields directly on the button to avoid JSON-in-attribute gotchas
  const rows = coupons.map((c) => {
    const id = c._id || c.id || "";
    const regionsAttr = Array.isArray(c.regions)
      ? c.regions.join(",")
      : c.regions || "";
    const amountMinor =
      typeof c.amountMinor === "number"
        ? c.amountMinor
        : typeof c.valueMinor === "number"
        ? c.valueMinor
        : "";

    const codeBtnHTML = `
      <button
        class="coupon-btn py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none text-blue-600 hover:underline"
        data-id="${id}"
        data-code="${c.code || ""}"
        data-type="${c.type || ""}"
        data-value="${c.value ?? ""}"
        data-amountminor="${amountMinor}"
        data-regions="${regionsAttr}"
        data-maxdiscountminor="${c.maxDiscountMinor ?? ""}"
        data-starts="${c.startsAt || ""}"
        data-ends="${c.endsAt || ""}"
        data-usagelimit="${c.usageLimit ?? ""}"
        data-peruserlimit="${c.perUserLimit ?? ""}"
        data-notes="${(c.notes || "").toString().replace(/"/g, "&quot;")}"
        data-isactive="${c.isActive ? "true" : "false"}"
        data-totalredemptions="${c.stats?.totalRedemptions ?? ""}"
      >${c.code}</button>
    `;

    const code = gridjs.html(codeBtnHTML);

    const discount =
      c.type === "percent"
        ? `${c.value}%`
        : c.type === "amount"
        ? money(
            typeof c.amountMinor === "number" ? c.amountMinor : c.valueMinor
          )
        : "—";

    const regions = Array.isArray(c.regions) ? c.regions.join(", ") : "—";

    const isOn = !!c.isActive;
    const toggle = gridjs.html(`
      <label class="coupon-toggle-wrap inline-flex items-center gap-2 cursor-pointer select-none" data-id="${id}">
        <input type="checkbox" class="coupon-toggle sr-only" data-id="${id}" ${
      isOn ? "checked" : ""
    } />
        <span class="toggle-bar relative inline-block w-10 h-6 rounded-full transition ${
          isOn ? "bg-teal-500" : "bg-gray-300"
        }">
          <span class="toggle-knob absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            isOn ? "translate-x-4" : ""
          }"></span>
        </span>
        <span class="toggle-text text-sm ${
          isOn ? "text-teal-700" : "text-gray-600"
        }">${isOn ? "Active" : "Inactive"}</span>
      </label>
    `);

    return [code, discount, regions, toggle];
  });

  // ------- grid -------
  const grid = new gridjs.Grid({
    columns: [
      { name: "Code", sort: true },
      { name: "Discount", sort: true },
      { name: "Regions", sort: true },
      { name: "Status", sort: true },
    ],
    data: rows,
    search: {
      enabled: true,
      selector: (cell) => {
        if (cell && typeof cell === "object" && "content" in cell) {
          const tmp = document.createElement("div");
          tmp.innerHTML = cell.content;
          return tmp.textContent || "";
        }
        return cell ?? "";
      },
    },
    pagination: { enabled: true, limit: 20 },
    sort: true,
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

  // Delegated events (works after any rerender/pagination)
  function delegateHandlers() {
    // Open modal on code click
    gridEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".coupon-btn");
      if (!btn) return;

      const couponObj = {
        id: btn.dataset.id || "",
        code: btn.dataset.code || "",
        type: btn.dataset.type || "",
        value: btn.dataset.value ? Number(btn.dataset.value) : undefined,
        amountMinor: btn.dataset.amountminor
          ? Number(btn.dataset.amountminor)
          : undefined,
        regions: btn.dataset.regions
          ? btn.dataset.regions.split(",").filter(Boolean)
          : [],
        maxDiscountMinor: btn.dataset.maxdiscountminor
          ? Number(btn.dataset.maxdiscountminor)
          : undefined,
        startsAt: btn.dataset.starts || "",
        endsAt: btn.dataset.ends || "",
        usageLimit: btn.dataset.usagelimit
          ? Number(btn.dataset.usagelimit)
          : undefined,
        perUserLimit: btn.dataset.peruserlimit
          ? Number(btn.dataset.peruserlimit)
          : undefined,
        notes: btn.dataset.notes || "",
        isActive: btn.dataset.isactive === "true",
        stats: {
          totalRedemptions: btn.dataset.totalredemptions
            ? Number(btn.dataset.totalredemptions)
            : 0,
        },
      };

      fillModal(couponObj);
      openModal();
    });

    // Toggle change
    gridEl.addEventListener("change", async (e) => {
      const input = e.target.closest(".coupon-toggle");
      if (!input) return;

      const id = input.getAttribute("data-id");
      const row = coupons.find((x) => (x._id || x.id) === id) || {
        code: `#${id}`,
      }; // fallback for toast

      const newVal = input.checked;
      const wrap = input.closest(".coupon-toggle-wrap");
      const bar = $(".toggle-bar", wrap);
      const knob = $(".toggle-knob", wrap);
      const text = $(".toggle-text", wrap);

      const setVisual = (on) => {
        if (bar) {
          bar.classList.toggle("bg-teal-500", on);
          bar.classList.toggle("bg-gray-300", !on);
        }
        if (knob) knob.classList.toggle("translate-x-4", on);
        if (text) {
          text.textContent = on ? "Active" : "Inactive";
          text.classList.toggle("text-teal-700", on);
          text.classList.toggle("text-gray-600", !on);
        }
      };
      const prev = !!row.isActive;
      setVisual(newVal);

      try {
        await axios.patch(`/coupons/${id}/toggle`, { isActive: newVal });
        row.isActive = newVal;
        toast(`Coupon ${row.code} ${newVal ? "activated" : "deactivated"}.`);
      } catch (err) {
        input.checked = prev;
        setVisual(prev);
        toast(
          err?.response?.data?.message || "Failed to toggle coupon.",
          "error"
        );
      }
    });
  }

  delegateHandlers();
  grid.render(gridEl);
});
