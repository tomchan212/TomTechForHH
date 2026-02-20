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

  // 下載整個網站為壓縮檔
  var downloadSiteFiles = [
    'index.html',
    'styles.css',
    'app.js',
    'number.html',
    'number-styles.css',
    'number-app.js',
    'ws_money.html',
    'money-styles.css',
    'money-app.js'
  ];

  var downloadBtn = document.getElementById('download-site-btn');
  if (downloadBtn && typeof JSZip !== 'undefined') {
    downloadBtn.addEventListener('click', function () {
      if (window.location.protocol === 'file:') {
        alert('無法在直接開啟的檔案頁面下載。請用本機或網路伺服器（例如 http://localhost）開啟本網站後，再按「下載為本地使用」。');
        return;
      }
      var btn = this;
      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '正在打包…';
      var zip = new JSZip();
      var path = window.location.pathname.replace(/\/[^/]*$/, '') || '/';
      if (!path.endsWith('/')) path += '/';
      var base = window.location.origin + path;
      var done = 0;
      var total = downloadSiteFiles.length;
      var addedCount = 0;
      function tryFinish() {
        done += 1;
        if (done === total) {
          if (addedCount === 0) {
            btn.disabled = false;
            btn.textContent = originalText;
            alert('無法取得網站檔案，壓縮檔為空。請確認是透過 http 或 https 網址開啟本頁面（例如用本機伺服器），再試一次。');
            return;
          }
          zip.generateAsync({ type: 'blob' }).then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'TomTech-網站.zip';
            a.click();
            URL.revokeObjectURL(a.href);
            btn.disabled = false;
            btn.textContent = originalText;
          }).catch(function () {
            btn.disabled = false;
            btn.textContent = originalText;
          });
        }
      }
      downloadSiteFiles.forEach(function (filename) {
        var url = base + filename;
        fetch(url)
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
          })
          .then(function (text) {
            zip.file(filename, text);
            addedCount += 1;
            tryFinish();
          })
          .catch(function () {
            tryFinish();
          });
      });
    });
  }
})();
