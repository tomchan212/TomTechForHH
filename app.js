(function () {
  var THEME_KEY = 'tomtech-theme';

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function setTheme(mode) {
    var html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch (e) {}
    updateThemeButton();
  }

  function updateThemeButton() {
    var btn = document.getElementById('theme-btn');
    if (!btn) return;
    var isDark = document.documentElement.classList.contains('dark');
    btn.textContent = isDark ? '淺色模式' : '深色模式';
    btn.setAttribute('aria-label', isDark ? '切換淺色模式' : '切換深色模式');
  }

  // 套用儲存的主題
  setTheme(getTheme());

  // 深色模式按鈕
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // 私隱說明 modal
  var privacyBtn = document.getElementById('privacy-btn');
  var privacyModal = document.getElementById('privacy-modal');
  var privacyClose = document.getElementById('privacy-close');
  var privacyOverlay = privacyModal && privacyModal.querySelector('.privacy-modal-overlay');
  function openPrivacyModal() {
    if (privacyModal) {
      privacyModal.classList.add('is-open');
      privacyModal.setAttribute('aria-hidden', 'false');
    }
  }
  function closePrivacyModal() {
    if (privacyModal) {
      privacyModal.classList.remove('is-open');
      privacyModal.setAttribute('aria-hidden', 'true');
    }
  }
  if (privacyBtn) privacyBtn.addEventListener('click', openPrivacyModal);
  if (privacyClose) privacyClose.addEventListener('click', closePrivacyModal);
  if (privacyOverlay) privacyOverlay.addEventListener('click', closePrivacyModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && privacyModal && privacyModal.classList.contains('is-open')) closePrivacyModal();
  });

  // 所有 .html 網站清單（同一資料夾）
  var sites = [
    { name: 'Add Contacts（聯絡人）', file: 'number.html' },
    { name: '院友零用金 結欠/結餘 WhatsApp 追數', file: 'ws_money.html' }
  ];

  var listEl = document.getElementById('site-list');
  if (listEl) {
    sites.forEach(function (site) {
      var href = site.file;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = href;
      a.textContent = site.name;
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }
})();
