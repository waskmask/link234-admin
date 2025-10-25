// /public/js/app-shell.js
(() => {
  // ---- User menu ----
  const btn = document.getElementById("userMenuBtn");
  const menu = document.getElementById("userMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => menu.classList.toggle("hidden"), {
      passive: true,
    });
    document.addEventListener(
      "click",
      (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target))
          menu.classList.add("hidden");
      },
      { passive: true }
    );
  }

  // ---- Sidebar (mobile) ----
  const mq = window.matchMedia("(max-width: 1206px)");
  const sidebar = document.getElementById("appSidebar");
  const overlay = document.getElementById("appOverlay");
  const openers = document.querySelectorAll("[data-sidebar-open]");
  const closers = document.querySelectorAll("[data-sidebar-close]");
  const mobileLogo = document.getElementById("mobileLogo");

  // Use ONE class for hide/show on mobile
  const HIDE_CLASS = "max-[1206px]:-translate-x-full";

  function setLogoVisible(v) {
    if (!mobileLogo) return;
    // show only on mobile
    if (mq.matches) mobileLogo.classList.toggle("hidden", !v);
    else mobileLogo.classList.add("hidden");
  }

  function closeSidebar() {
    if (!sidebar) return;
    // always keep open on desktop
    if (mq.matches) {
      sidebar.classList.add(HIDE_CLASS);
      overlay?.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      setLogoVisible(true);
    } else {
      sidebar.classList.remove(HIDE_CLASS);
      overlay?.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      setLogoVisible(false);
    }
  }

  function openSidebar() {
    if (!sidebar) return;
    if (mq.matches) {
      sidebar.classList.remove(HIDE_CLASS);
      overlay?.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
      setLogoVisible(false);
    }
  }

  function onBreakpoint() {
    if (mq.matches) {
      // mobile starts CLOSED
      sidebar?.classList.add(HIDE_CLASS);
      overlay?.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      setLogoVisible(true);
    } else {
      // desktop always OPEN
      sidebar?.classList.remove(HIDE_CLASS);
      overlay?.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      setLogoVisible(false);
    }
  }

  openers.forEach((b) => b.addEventListener("click", openSidebar));
  closers.forEach((b) => b.addEventListener("click", closeSidebar));
  overlay?.addEventListener("click", closeSidebar);
  window.addEventListener("resize", onBreakpoint);

  onBreakpoint();
})();
