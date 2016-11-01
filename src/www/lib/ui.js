define(['text!toaster.html', 'text!toast.html', 'text!spinner.html'], function (toasterTemplate, toastTemplate, spinnerTemplate) {
    var menuElement;
    var toaster;
    var spinner;
    
    function getMenuElement() {
        if (!menuElement) {
            menuElement = document.querySelector('.main-navigation');
        }
        return menuElement;
    }
    
    function getSpinnerElement(element) {
        if (!element) {
            element = document.body;
        }
        return element;
    }
    
    function getSpinnerSelector(context) {
        var selector = '.spinner__wrapper';
        if (!!context) {
            selector = '#' + context;
        }
        return selector;
    }
    
    function getSpinnerSize(element) {
        return {
            width: element.clientWidth,
            height: element.clientHeight
        };
    }
    
    function getToaster() {
        if (!toaster) {
            toaster = document.querySelector('#toaster');
            if (!toaster) {
                var temp = document.createElement('div');
                temp.innerHTML = toasterTemplate;
                toaster = temp.children[0];
                document.body.appendChild(toaster);
            }
        }
        return toaster;
    }
    
    function createToast(message, type) {
        var temp = document.createElement('div');
        temp.innerHTML = toastTemplate
            .replace(/{message}/g, message)
            .replace(/{type}/g, type);
        return temp.children[0];
    }
    
    function createSpinner() {
        if (!spinner) {
            var container = document.createElement('DIV');
            container.innerHTML = spinnerTemplate;
            spinner = container.children[0];
        }
        return spinner;
    }
       
    return {
        showMenu: function() {
            var menuElement = getMenuElement();
            if (menuElement.className.indexOf('active') < 0) {
                menuElement.className = menuElement.className + ' active';
            }
        },
        hideMenu: function() {
            var menuElement = getMenuElement();
            menuElement.className = menuElement.className.replace(' active', '');
        },
        showSpinner: function(element, context) {
            element = getSpinnerElement(element);
            var selector = getSpinnerSelector(context);
            if (document.querySelector(selector)) {
                return;
            }
            var position = getSpinnerSize(element);
            var spinner = createSpinner();
            if (!!context) {
                spinner.setAttribute('id', context);
            }
            spinner.style.width = position.width + 'px';
            spinner.style.height = position.height + 'px';
            if (element.hasChildNodes()) {
                element.insertBefore(spinner, element.children[0]);
            } else {
                element.appendChild(spinner);
            }
        },
        hideSpinner: function(context) {
            var selector = getSpinnerSelector(context);
            var spinner = document.querySelector(selector);
            if (spinner) {
                spinner.remove();
            }
        },
        toast: function(message, type) {
            var toaster = getToaster();
            var toast = createToast(message, type);
            if (!!toaster.lastElementChild) {
                toaster.insertBefore(toast, toaster.lastElementChild);
            } else {
                toaster.appendChild(toast);
            }
            window.setTimeout(function() {
                toast.remove();
            }, 10000);
        }
    };
});