(function() {
    window.addEventListener('load', function() {
        var needsTranslation = document.querySelectorAll("[data-i18n]"),
            t = chrome.i18n.getMessage;
        for (var i = 0, l = needsTranslation.length; i < l; i++) {
            var element = needsTranslation[i]
            element.innerHTML = t(element.dataset.i18n);
        }
    });
    
    }
).call(this);