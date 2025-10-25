// Simple, CSP-safe, and ordered init
(function () {
  // This file itself loading proves scripts are executing
  console.log("[preline-init] file loaded");

  function init() {
    console.log("[preline-init] DOM ready");
    console.log(
      "[preline-init] VanillaCalendar present:",
      !!window.VanillaCalendar
    );
    console.log("[preline-init] Preline present:", !!window.HSStaticMethods);

    // Initialize all Preline components (datepicker wrapper included)
    window.HSStaticMethods && window.HSStaticMethods.autoInit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM already parsed
    init();
  }
})();
