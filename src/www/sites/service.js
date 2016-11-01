define(function(require) {
    var elements = null;
    
    var loader = require('loader');
    var ui = require('ui');
        
    return {
        template: require('text!./service/service.html'),
        styles: require('text!./service/service.css'),
        init: function() {
            elements = {
                
            };           
                
            
        },
        dispose: function() {

        }
    };
});