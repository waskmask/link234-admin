// /public/js/apicalls/add-coupon.js
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // lightweight toast
  const toast = (text, type = "success") => {
    let root = document.getElementById("toastRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "toastRoot";
      root.className = "fixed bottom-4 right-4 space-y-3 z-[200]";
      document.body.appendChild(root);
    }
    const el = document.createElement("div");
    el.className =
      "pointer-events-auto rounded-xl border p-3 shadow-md bg-white " +
      (type === "error" ? "border-rose-200" : "border-green-200");
    el.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-0.5">${type === "error" ? "⚠️" : "✅"}</div>
        <div class="text-sm text-gray-800 flex-1">${text}</div>
        <button class="shrink-0 text-gray-500 hover:text-gray-800">✖</button>
      </div>`;
    el.querySelector("button").onclick = () => el.remove();
    root.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  // parse dd-mm-yyyy → Date (at 00:00)
  const parseDMY = (s) => {
    const m = (s || "").trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const form = $("couponForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const subBtn = document.getElementById("btnSubmit");
    // read fields
    const code = $("code")?.value?.trim();
    const type = $("type")?.value?.trim();
    const valueRaw = $("value")?.value?.trim();
    const maxDiscountMinor = $("maxDiscountMinor")?.value?.trim();
    // SlimSelect writes to the underlying <select id="regions">; read selected <option>s
    const regionsSel = document.querySelectorAll("#regions option:checked");
    const regions = Array.from(regionsSel).map((o) => o.value);

    const startsAtStr = $("startsAt")?.value?.trim();
    const endsAtStr = $("endsAt")?.value?.trim();
    const usageLimit = $("usageLimit")?.value?.trim();
    const perUserLimit = $("perUserLimit")?.value?.trim();
    const isActive = $("isActive")?.checked;
    const notes = $("notes")?.value?.trim();

    // dates → ISO (endsAt end-of-day)
    const sDate = parseDMY(startsAtStr);
    const eDate = parseDMY(endsAtStr);
    const startsAt = sDate ? new Date(sDate.getTime()).toISOString() : null;
    let endsAt = null;
    if (eDate) {
      const t = new Date(eDate);
      t.setHours(23, 59, 59, 999);
      endsAt = new Date(t.getTime()).toISOString();
    }

    // build payload
    const numValue = valueRaw ? Number(valueRaw) : undefined;

    const payload = {
      code,
      type,
      // percent uses value, amount uses amountMinor
      value: type === "percent" ? numValue : undefined,
      amountMinor: type === "amount" ? numValue : undefined,
      maxDiscountMinor: maxDiscountMinor ? Number(maxDiscountMinor) : undefined,
      regions,
      startsAt,
      endsAt,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      isActive: !!isActive,
      notes,
    };

    subBtn.disabled = true;
    subBtn.innerText = "Saving...";

    // strip undefined
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k]
    );

    try {
      // POST to your frontend proxy route
      const { data } = await axios.post("/coupons", payload);
      toast("Coupon created successfully.");
      subBtn.disabled = false;
      subBtn.innerText = "Save coupon";
      // optional small delay then redirect
      setTimeout(() => (window.location.href = "/coupons"), 600);
    } catch (err) {
      subBtn.disabled = false;
      subBtn.innerText = "Save coupon";
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to create coupon.";
      toast(msg, "error");
    }
  });
});
