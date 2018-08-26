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
    var ui = require('ui');

    if(!!window.location.hash) {
        ui.navigate();
    } else {
        ui.navigate('overview');
    }

    window.onhashchange = function() {
        ui.navigate();
    };

    document.querySelector('.main-navigation__toggle').onclick = function() {
        ui.showMenu();
    };

    document.querySelector('.main-navigation__shadow').onclick = function() {
        ui.hideMenu();
    };
});