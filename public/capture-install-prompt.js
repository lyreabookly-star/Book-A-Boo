(function () {
  window.__BAB_DEFERRED_INSTALL_PROMPT = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__BAB_DEFERRED_INSTALL_PROMPT = event;
    window.dispatchEvent(new Event("babinstallpromptready"));
  });
  window.addEventListener("appinstalled", function () {
    window.__BAB_DEFERRED_INSTALL_PROMPT = null;
  });
})();
