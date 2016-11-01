define(function(require) {
    var elements = null;
    var updateTimer = null;
    var ui = require('ui');
    var loader = require('loader');
    var t = require('translator');
    
    function send(command, update, source) {
        ui.showSpinner(source, 'action_command');
        loader.load({
            href: '/json.cgi?' +  command,
            success: function() {
                if (!!update) {
                    getStatus();
                }
            },
            error: function(code) {
                ui.toast(t.get('send_command_error', [command, code]), 'error');
            },
            always: function() {
                ui.hideSpinner('action_command');
            }
        });
    }
    
    function update() {
        getStatus(function() {
            updateTimer = window.setTimeout(
                function() { 
                    update(); 
                },
                3000
            );
        });
    }
        
    function getStatus(callback) {
        loader.load({
            href: 'sites/overview/status.html',
            type: 'json',
            success: function(status) {
                elements.state.label.innerHTML = t.get(status.robot.state);
                elements.state.icon.setAttribute('xlink:href', '#icon-state_' + status.robot.state.toLowerCase());
                elements.repeat.icon.setAttribute('xlink:href', '#icon-repeat_' + status.robot.repeat);
                elements.repeat.label.innerHTML = t.get('repeat_status', [(status.robot.repeat ? t.get('on') : t.get('off'))]);
                elements.mode.label.innerHTML = t.get(status.robot.mode);
                elements.mode.icon.setAttribute('xlink:href', '#icon-mode_' + status.robot.mode.toLowerCase());
                elements.turbo.label.innerHTML =  t.get('turbo_status', [(status.robot.turbo ? t.get('on') : t.get('off'))]);
                elements.turbo.icon.setAttribute('xlink:href', '#icon-turbo_' + status.robot.turbo);
                elements.battery.progress.style.width = status.robot.battery + '%';
                elements.cpu.progress.style.width = (100 - status.robot.cpu.idle) + '%';
            },
            error: function(code) {
                elements.state.label.innerHTML = '-';
                elements.repeat.label.innerHTML = '-';
                elements.mode.label.innerHTML = '-';
                elements.turbo.label.innerHTML = '-';
                elements.battery.progress.style.width = '0%';
                elements.cpu.progress.style.width = '0%';
                ui.toast(t.get('overview_error', [code.message]), 'error');
            },
            always: callback
        });
    };
    
    return {
        template: require('text!./overview/overview.html'),
        styles: require('text!./overview/overview.css'),
        init: function() {
            elements = {
                state: {
                    icon: document.querySelector('#status_state use'),
                    label: document.querySelector('#status_state figcaption')
                },
                repeat: {
                    button: document.querySelector('#status_repeat'),
                    icon: document.querySelector('#status_repeat use'),
                    label: document.querySelector('#status_repeat figcaption')
                },
                mode: {
                    button: document.querySelector('#status_mode'),
                    icon: document.querySelector('#status_mode use'),
                    label: document.querySelector('#status_mode figcaption')
                },
                turbo: {
                    button: document.querySelector('#status_turbo'),
                    icon: document.querySelector('#status_turbo use'),
                    label: document.querySelector('#status_turbo figcaption')
                },
                battery: {
                    label: document.querySelector('#status_battery .progressbar__label'),
                    progress: document.querySelector('#status_battery .progressbar__progress')
                },
                cpu: {
                    label: document.querySelector('#status_cpu .progressbar__label'),
                    progress: document.querySelector('#status_cpu .progressbar__progress')
                }
            };
            
            elements.battery.label.innerHTML = t.get('Battery');
            elements.cpu.label.innerHTML = t.get('CPU Load');
            
            elements.mode.button.onclick = function() { send('mode', true, this); };
            elements.turbo.button.onclick = function() { send('turbo', true, this); };
            elements.repeat.button.onclick = function() { send('repeat', true, this); };
            
            update();
        },
        dispose: function() {
            if (!!updateTimer) {
                window.clearTimeout(updateTimer);
                updateTimer = null;
            }
        }
    };
});