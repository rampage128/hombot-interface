require.config({
    enforceDefine: true,
    baseUrl: 'lib',
    catchError: true,
    paths: {
        sites: '../sites',
        nls: '../nls'
    },
    config: {
        ui: {
            modules: ['moduleDefinition']
        }
    }
});

requirejs.onError = function (err) { 
    var ui = require('ui');
    ui.toast(err.message, 'error');
    throw err;
};

define(function(require) {
    var activeSite = null;
    var ui = require('ui');
    var main = document.querySelector('#content');
    var t = require('translator');
    t.load('general');
    
    function loadStyles(site, name) {
        var id = 'site-styles_' + name;
        if (!document.querySelector('#'+id)) {
            var style = document.createElement("style");
            style.setAttribute('id', id);
            style.innerHTML = site.styles;
            document.getElementsByTagName("head")[0].appendChild(style);
        }
    }
    
    function navigate(siteName) {
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

                ui.hideMenu();
            });
        });
    }
       
    ui.createMenu();
       
    if(!!window.location.hash) {
        navigate();
    } else {
        navigate('overview');
    }
    
    window.onhashchange = function() {
        navigate();
    };

    document.querySelector('.main-navigation__toggle').onclick = function() {
        ui.showMenu();
    };
    
    document.querySelector('.main-navigation__shadow').onclick = function() {
        ui.hideMenu();
    };
});