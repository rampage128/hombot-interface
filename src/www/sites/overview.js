define(function(require) {
    var elements = null;
    var updateTimer = null;
    var ui = require('ui');
    var loader = require('loader');
    var t = require('translator');
    var Joystick = require('sites/overview/joystick');
    var joystick = null;
    
    var currentStatus = null;
    
    function send(command, update, source) {
        if (!!source) {
            ui.showSpinner(source, 'action_command');
        }
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
                currentStatus = status;
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
                elements.controls.startstop.icon.setAttribute('xlink:href', status.robot.state !== 'WORKING' ? '#icon-action_start' : '#icon-state_pause');
                elements.controls.startstop.label.innerHTML = t.get(status.robot.state !== 'WORKING' ? 'Start' : 'Pause');
                elements.controls.homeundock.icon.setAttribute('xlink:href', status.robot.state !== 'CHARGING' ? '#icon-state_homing' : '#icon-state_backmoving_init');
                elements.controls.homeundock.label.innerHTML = t.get(status.robot.state !== 'CHARGING' ? 'Home' : 'Undock');
                
                if (status.robot.state !== 'STANDBY') {
                    joystick.stopListening();
                    if (elements.joystick.container.className.indexOf('joystick__move--disabled') === -1) {
                        elements.joystick.container.className += ' joystick__move--disabled';
                    }
                } else {
                    joystick.startListening();
                    elements.joystick.container.className = elements.joystick.container.className.replace(/ joystick__move--disabled/,'');
                }
            },
            error: function(code) {
                currentStatus = null;
                elements.state.label.innerHTML = '-';
                elements.repeat.label.innerHTML = '-';
                elements.mode.label.innerHTML = '-';
                elements.turbo.label.innerHTML = '-';
                elements.battery.progress.style.width = '0%';
                elements.cpu.progress.style.width = '0%';                
                joystick.stopListening();
                if (elements.joystick.container.className.indexOf('joystick__move--disabled') === -1) {
                    elements.joystick.container.className += ' joystick__move--disabled';
                }
                ui.toast(t.get('overview_error', [code.message]), 'error');
            },
            always: callback
        });
        
        var context = elements.camera.canvas.getContext('2d');
        var width = elements.camera.canvas.width;
        var height = elements.camera.canvas.height;
        var outputImage = context.createImageData(width, height);
        var outputImageData = outputImage.data;
        
        loader.load({
            href: 'images/snapshot.yuv',
            type: 'arraybuffer',
            success: function(response) {
                var yuvData = new Uint8Array(response), y, u, v;
                for (var i = 0, p = 0; i < outputImageData.length; i += 4, p += 1) {
                    y = yuvData[ p ];
                    v = yuvData[ Math.floor(width * height * 1.5 + p /2) ];
                    u = yuvData[ Math.floor(width * height + p / 2) ];
                    outputImageData[i]   = y + 1.371 * (v - 128);
                    outputImageData[i+1] = y - 0.336 * (u - 128) - 0.698 * (v - 128);
                    outputImageData[i+2] = y + 1.732 * (u - 128);
                    outputImageData[i+3] = 255;
                }
                context.putImageData(outputImage,0,0);
            },
            error: function(code) {
                context.clearRect(0, 0, elements.camera.canvas.width, elements.camera.canvas.height);
            }
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
                },
                camera: {
                    canvas: document.querySelector('#camera_canvas')
                },
                controls: {
                    startstop: {
                        icon: document.querySelector('#control_startstop use'),
                        button: document.querySelector('#control_startstop'),
                        label: document.querySelector('#control_startstop figcaption')
                    },
                    homeundock: {
                        icon: document.querySelector('#control_homeundock use'),
                        button: document.querySelector('#control_homeundock'),
                        label: document.querySelector('#control_homeundock figcaption')
                    }
                },
                joystick: {
                    container: document.querySelector('#joystick_container'),
                    stick: document.querySelector('#joystick_stick')
                }
            };
                       
            elements.mode.button.onclick = function() { send('mode', true, this); };
            elements.turbo.button.onclick = function() { send('turbo', true, this); };
            elements.repeat.button.onclick = function() { send('repeat', true, this); };
            elements.controls.startstop.button.onclick = function() { 
                if (!!currentStatus) {
                    if (currentStatus.robot.state !== 'WORKING') {
                        send('{\"COMMAND\":\"CLEAN_START\"}', false, this);
                    } else {
                        send('{\"COMMAND\":\"PAUSE\"}', false, this);
                    }
                }
            };
            elements.controls.homeundock.button.onclick = function() { 
                if (!!currentStatus) {
                    if (currentStatus.robot.state !== 'CHARGING') {
                        send('{\"COMMAND\":\"HOMING\"}', false, this);
                    } else {
                        send('{\"JOY\":\"BACKWARD\"}', false, this);
                    }
                }
            };
            
            joystick = new Joystick(elements.joystick.container, elements.joystick.stick, {
                release: function() {
                    send('{\"JOY\":\"RELEASE\"}');
                },
                forward: function() {
                    send('{\"JOY\":\"FORWARD\"}');
                },
                backward: function() {
                    send('{\"JOY\":\"BACKWARD\"}');
                },
                left: function() {
                    send('{\"JOY\":\"LEFT\"}');
                },
                right: function() {
                    send('{\"JOY\":\"RIGHT\"}');
                }
            });
            
            update();
        },
        dispose: function() {
            if (!!updateTimer) {
                window.clearTimeout(updateTimer);
                updateTimer = null;
            }
            if (!!joystick) {
                joystick.stopListening();
            }
        }
    };
});