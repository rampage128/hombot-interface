define(function(require) {
    var elements = null;
    var t = require('translator');
    
    var loader = require('loader');
    var ui = require('ui');
    
    function initCheckBox(field) {
        field.check.onclick = function() {
            field.time.disabled = field.type.disabled = !field.check.checked;
        };
    }
        
    function getConfig() {
        ui.showSpinner(elements.form, 'mail_spinner');
        loader.load({
            href: 'sites/mail/status.html',
            type: 'json',
            success: function(config) {
                var reception = config.reception.active === 'checked';
                var dispatch = config.dispatch.active === 'checked';
                
                elements.reception.checkbox.checked = reception;
                elements.reception.sign.disabled =
                    elements.reception.server.disabled =
                    elements.reception.cycle.disabled =
                    elements.reception.username.disabled =
                    elements.reception.password.disabled = 
                    elements.reception.receive.disabled = !reception;
            
                if (reception) {
                    for (key in config.reception) {
                        var field = elements.reception[key];
                        if (!!field) {
                            field.value = config.reception[key];
                        }
                    }
                }
                
                elements.dispatch.checkbox.checked = dispatch;
                elements.dispatch.server.disabled =
                    elements.dispatch.recipient.disabled =
                    elements.dispatch.username.disabled =
                    elements.dispatch.password.disabled = 
                    elements.dispatch.dispatch.disabled = !dispatch;
                
                if (dispatch) {
                    for (var key in config.dispatch) {
                        var field = elements.dispatch[key];
                        if (!!field) {
                            field.value = config.dispatch[key];
                        }
                    }
                }
            },
            error: function(code) {
                ui.toast(t.get('mail_load_error', [code]), 'error');
            },
            always: function(status) {
                ui.hideSpinner('mail_spinner');
            }
        });
    }
   
    function evaluateTest(type) {
        ui.showSpinner(elements.form, 'mail_spinner');
        loader.load({
            href: 'sites/mail/status.html',
            type: 'json',
            success: function(data) {
                var result = 'success';
                if (data.response.indexOf('err') > -1) {
                    result = 'error';
                }
                ui.toast(t.get('mail_' + type + '_' + result, [data.response]), result);
            },
            error: function(code) {
                ui.toast(t.get('mail_' + type +  '_error', [code]), 'error');
            },
            always: function(status) {
                ui.hideSpinner('mail_spinner');
            }
        });
        
    }
   
    function testDispatch() {
        sendConfig("Test", function(data) {
            evaluateTest('test');
        });
    }
    
    function testReceive() {
        sendConfig("Recv", function(data) {
            evaluateTest('recv');
        });
    }
    
    function saveConfig() {
        sendConfig("Save", function(data) {
            ui.toast(t.get('mail_save_success'), 'success');
            getConfig();
        });
    }
    
    function sendConfig(action, callback) {
        var erroneous = false;
               
        var get = '?ACTION=' + action;
        if (elements.reception.checkbox.checked) {
            // TODO ERROR CHECKING
            get +=  '&P3ENABLE=yes' +
                    '&P3SIGN=' + encodeURIComponent(elements.reception.sign.value) +
                    '&P3SERVER=' + encodeURIComponent(elements.reception.server.value) +
                    '&P3CYCLE=' + encodeURIComponent(elements.reception.cycle.value) +
                    '&P3USER=' + encodeURIComponent(elements.reception.username.value) +
                    '&P3PASS=' + encodeURIComponent(elements.reception.password.value);
        }        
        if (elements.dispatch.checkbox.checked) {
            // TODO ERROR CHECKING
            get +=  '&SLENABLE=yes' +
                    '&RECEIVER=' + encodeURIComponent(elements.dispatch.recipient.value) +
                    '&GATEWAY=' + encodeURIComponent(elements.dispatch.server.value) +
                    '&USER=' + encodeURIComponent(elements.dispatch.username.value) +
                    '&PASS=' + encodeURIComponent(elements.dispatch.password.value);
        }
        
        if (!erroneous) {
            ui.showSpinner(elements.form, 'mail_spinner');
            
            var href = '/sites/mailcfg.html' + get;
            
            loader.load({
                href: href,
                type: 'plain',
                success: callback,
                error: function(code) {
                    throw code;
                }, 
                always: function() {
                    ui.hideSpinner('mail_spinner');
                }
            });
        } else {
            ui.toast(t.get('mail_' + action.toLowerCase() + '_error', [t.get('invalid_input')]), 'error');
        }
    }
    
    return {
        template: require('text!./mail/mail.html'),
        styles: require('text!./mail/mail.css'),
        init: function() {
            elements = {
                form: document.querySelector('#mail_form'),
                submit: document.querySelector('#mail_submit'),
                reset: document.querySelector('#mail_reset'),
                reception: {
                    sign: document.querySelector('#P3SIGN'),
                    server: document.querySelector('#P3SERVER'),
                    cycle: document.querySelector('#P3CYCLE'),
                    username: document.querySelector('#P3USER'),
                    password: document.querySelector('#P3PASS'),
                    checkbox: document.querySelector('#P3ENABLE'),
                    receive: document.querySelector('#mail_receive')
                },
                dispatch: {
                    recipient: document.querySelector('#RECEIVER'),
                    server: document.querySelector('#GATEWAY'),
                    username: document.querySelector('#USER'),
                    password: document.querySelector('#PASS'),
                    checkbox: document.querySelector('#SLENABLE'),
                    dispatch: document.querySelector('#mail_dispatch')
                }
            };           
                                              
            elements.form.onsubmit = function() {
                saveConfig();
                return false;
            };
            
            elements.dispatch.dispatch.onclick = function() {
                testDispatch();
                return false;
            };
            
            elements.reception.receive.onclick = function() {
                testReceive();
                return false;
            };
            
            elements.reset.onclick = function() {
                getConfig();
                return false;
            };
            
            elements.reception.checkbox.onclick = function() {
                var state = elements.reception.checkbox.checked;
                elements.reception.sign.disabled =
                    elements.reception.server.disabled =
                    elements.reception.cycle.disabled =
                    elements.reception.username.disabled =
                    elements.reception.password.disabled = 
                    elements.reception.receive.disabled = !state;
            };
            
            elements.dispatch.checkbox.onclick = function() {
                var state = elements.dispatch.checkbox.checked;
                elements.dispatch.recipient.disabled =
                    elements.dispatch.server.disabled =
                    elements.dispatch.username.disabled =
                    elements.dispatch.password.disabled = 
                    elements.dispatch.dispatch.disabled = !state;
            };
            
            getConfig();
        },
        dispose: function() {

        }
    };
});