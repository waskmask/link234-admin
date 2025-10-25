// Preline auto-init for components (modals, dropdowns, selects, etc.)
document.addEventListener("DOMContentLoaded", () => {
  window.HSStaticMethods?.autoInit();
});

// Show password for N milliseconds, then revert
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-toggle-password]");
  if (!btn) return;

  const id = btn.getAttribute("aria-controls");
  const input = document.getElementById(id);
  if (!input) return;

  const timeout = parseInt(btn.dataset.timeout || "2000", 10);

  // show
  input.type = "text";
  btn.querySelector(".eye-on")?.classList.add("hidden");
  btn.querySelector(".eye-off")?.classList.remove("hidden");

  // hide after N ms
  setTimeout(() => {
    input.type = "password";
    btn.querySelector(".eye-on")?.classList.remove("hidden");
    btn.querySelector(".eye-off")?.classList.add("hidden");
  }, timeout);
});

// logout handler (works if #logoutBtn exists and onclick="logout()")
window.logout = async function () {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    try {
      await axios.post("/auth/logout");
      location.href = "/";
    } catch (e) {
      if (blogoutBtntn) {
        btn.disabled = false;
        btn.classList.remove("opacity-50", "pointer-events-none");
      }
      alert(
        (window.translations && window.translations.logout_failed) ||
          "Logout failed"
      );
      console.error(e);
    }
  }
};
