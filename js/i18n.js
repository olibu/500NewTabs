(function () {
  window.addEventListener('load', function () {
    const toTranslate = document.querySelectorAll('[data-i18n]');
    const translate = chrome.i18n.getMessage;
    for (var i = 0, l = toTranslate.length; i < l; i++) {
      var element = toTranslate[i];
      element.innerHTML = translate(element.dataset.i18n);
    }
  });
}.call(this));