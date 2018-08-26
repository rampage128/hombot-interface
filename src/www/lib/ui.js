define('ui', ['module', 'text!ui_templates.html', 'translator'], function (module, masterTemplate, t) {
    var menuElement;
    var toaster;
    var toasts = [];
    var spinner;
    var activeSite = null;
    var main = document.querySelector('#content');
    var templates = {};
    var masterConfig = (module.config && module.config()) || {};
    
    t.load('general', function() { createMenu(); });
    
    function getTemplate(name) {
        if (!templates[name]) {
            var tmp = document.createElement('DIV');
            tmp.innerHTML = masterTemplate;
            var templateWrapper = tmp.querySelector('#template_' + name);
            if (!!templateWrapper) {
                templates[name] = templateWrapper.innerHTML.trim();
            }
        }
        return templates[name];
    }
    
    function getMenuElement() {
        if (!menuElement) {
            menuElement = document.querySelector('.main-navigation');
        }
        return menuElement;
    }
    
    function hideMenu() {
        var menuElement = getMenuElement();
        menuElement.className = menuElement.className.replace(' active', '');
    }
    
    function loadStyles(site, name) {
        var id = 'site-styles_' + name;
        if (!document.querySelector('#'+id)) {
            var style = document.createElement("style");
            style.setAttribute('id', id);
            style.innerHTML = site.styles;
            document.getElementsByTagName("head")[0].appendChild(style);
        }
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
      
    function getToaster() {
        if (!toaster) {
            toaster = document.querySelector('#toaster');
            if (!toaster) {
                var temp = document.createElement('div');
                temp.innerHTML = getTemplate('toaster');
                toaster = temp.children[0];
                document.body.appendChild(toaster);
            }
        }
        return toaster;
    }
    
    function createToast(message, type) {
        var temp = document.createElement('div');
        temp.innerHTML = getTemplate('toast')
            .replace(/{message}/g, message)
            .replace(/{type}/g, type);
        return {
            'element' : temp.children[0],
            'timeout' : 0,
            'message' : message,
            'type' : type
        };
    }
        
    function createSpinner() {
        if (!spinner) {
            var container = document.createElement('DIV');
            container.innerHTML = getTemplate('spinner');
            spinner = container.children[0];
        }
        spinner.style.width = 0;
        spinner.style.height = 0;
        spinner.style.marginLeft = 0;
        spinner.style.marginTop = 0;
        return spinner;
    }
    
    function hideDialog() {
        var dialogElement = document.querySelector('#dialog');
        if (!!dialogElement) {
            dialogElement.className += ' is-hidden';
            dialogElement.remove();
        }
    }
       
    function createMenu() {
        var menuElement = getMenuElement().querySelector('ul');
        var menuItems = '';
        masterConfig.modules.forEach(function(module) {
            var menuItem = getTemplate('menuitem').replace(/{id}/g, module.id).replace(/{name}/g, t.get('module.' + module.id));
            menuItems += menuItem;
        });
        menuElement.innerHTML = menuItems;
    }
       
    return {
        showMenu: function() {
            var menuElement = getMenuElement();
            if (menuElement.className.indexOf('active') < 0) {
                menuElement.className = menuElement.className + ' active';
            }
        },
        hideMenu: function() {
            hideMenu();
        },
        navigate: function(siteName) {
            if (!siteName) {
                siteName = window.location.hash.replace('#', '');
            }
            t.load(siteName + '/strings', function() {
                require(['sites/' + siteName], function(site) {
                    if (!!activeSite) {
                        activeSite.dispose();
                    }
                    main.innerHTML = t.localize(site.template);
                    loadStyles(site, siteName);
                    site.init();
                    activeSite = site;

                    var oldNavItem = document.querySelector('.main-navigation li.active');
                    if (!!oldNavItem) {
                        oldNavItem.className = "";
                    }
                    var newNavItem = document.querySelector('.main-navigation a[href="#'+siteName+'"]').parentNode;
                    if (!!newNavItem) {
                        newNavItem.className = "active";
                    }

                    hideMenu();
                });
            });
        },
        showSpinner: function(element, context) {
            element = getSpinnerElement(element);
            var selector = getSpinnerSelector(context);
            if (document.querySelector(selector)) {
                return;
            }
            var spinner = createSpinner();
            if (!!context) {
                spinner.setAttribute('id', context);
            }
            if (element.hasChildNodes()) {
                element.insertBefore(spinner, element.children[0]);
            } else {
                element.appendChild(spinner);
            }
            /* 
             * We compute the final position and dimension after adding the 
             * spinner. This way we can honor paddings, border and other stuff
             * regardless of their unit. :-)
             */
            spinner.style.width = element.offsetWidth + 'px';
            spinner.style.height = element.offsetHeight + 'px';
            if (spinner.offsetLeft > 0) {
                spinner.style.marginLeft = element.offsetLeft - spinner.offsetLeft + 'px';
            }
            if (spinner.offsetTop > 0) {
                spinner.style.marginTop = element.offsetTop - spinner.offsetTop + 'px';
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
            if (type === 'error') {
                console.error(message);
            }
            
            var toaster = getToaster();
            var toast = null;
                       
            toasts.forEach(function(activeToast) {
                if (activeToast.message === message && activeToast.type === type) {
                    toast = activeToast;
                    if (!!toast.timeout) {
                        window.clearTimeout(toast.timeout);
                    }
                }
            });
            if (!toast) {
                toast = createToast(message, type);
                toasts.push(toast);
                if (!!toaster.lastElementChild) {
                    toaster.insertBefore(toast.element, toaster.lastElementChild);
                } else {
                    toaster.appendChild(toast.element);
                }
                while (toasts.length > 4) {
                    toasts.splice(0, 1).element.remove();
                }
            }       
            toast.timeout = window.setTimeout(function() {
                toast.element.remove();
                var toastIndex = toasts.indexOf(toast);
                if (toastIndex > -1) {
                    toasts.splice(toastIndex, 1);
                }
            }, 10000);
        },
        showDialog: function(title, content, actions) {
            var dialogElement = document.querySelector('#dialog');
            if (!!dialogElement) {
                dialogElement.remove();
            }
            var temp = document.createElement('DIV');
            temp.innerHTML = getTemplate('dialog');
            dialogElement = temp.children[0];
                    
            var actionBar = dialogElement.querySelector('.js_dialog_action_bar');
            if (actionBar.children.length > 0) {
                actionBar.innerHTML = '';
            }            
            actions.forEach(function(action) {
                var temp = document.createElement('DIV');
                temp.innerHTML = getTemplate('dialog_action')
                    .replace(/{label}/g, action.label);
                var actionElement = temp.children[0];
                
                var actionTarget = actionElement.querySelector('.js_dialog_action_target');
                actionTarget.addEventListener('click', action.event, true);
                
                if (!!action.type) {
                    actionElement.className += ' dialog-action__item--' + action.type;
                    if (action.type === 'cancel') {
                        var backElement = dialogElement.querySelector('.js_dialog_back');
                        backElement.addEventListener('click', action.event, true);
                    }
                }
                
                actionBar.appendChild(actionElement);
            });
            
            var contentContainer = dialogElement.querySelector('.js_dialog_content');
            if (content.nodeType > 0) {
                contentContainer.appendChild(content);
            } else {
                contentContainer.innerHTML = content;
            }
            var titleElement = dialogElement.querySelector('.js_dialog_title');
            if (!title) {
                titleElement.innerHTML = '';
                titleElement.className += ' is-hidden';
            } else {
                titleElement.innerHTML = title;
                titleElement.className = titleElement.className.replace(' is-hidden', '');
            }      
            
            document.body.appendChild(dialogElement);
        },
        hideDialog: function() {
            hideDialog();
        }
    };
});