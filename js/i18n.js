(function () {
  window.addEventListener('load', function () {
    const translate = chrome.i18n.getMessage;
    // replace content
    const toTranslate = document.querySelectorAll('[data-i18n]');
    if (toTranslate) {
      for (let i = 0, l = toTranslate.length; i < l; i++) {
        let element = toTranslate[i];
        element.innerHTML = translate(element.dataset.i18n);
      }
    }
    // replace attributes
    const toTranslateAtr = document.querySelectorAll('[attr-i18n]');
    if (toTranslateAtr) {
      for (let i = 0, l = toTranslateAtr.length; i < l; i++) {
        let element = toTranslateAtr[i];
        let set = element.attributes['attr-i18n'].value.split(':');
        element.setAttribute(set[0], translate(set[1]));
      }
    }
  });
}.call(this));