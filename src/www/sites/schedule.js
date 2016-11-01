define(function(require) {
    var elements = null;
    var t = require('translator');
    
    var subviews = { 
        row: require('text!./schedule/row.html')
    };
    var weekDays = [
        'MONDAY', 
        'TUESDAY', 
        'WEDNESDAY', 
        'THURSDAY', 
        'FRIDAY', 
        'SATURDAY', 
        'SUNDAY'
    ];
    var loader = require('loader');
    var ui = require('ui');
    
    function initCheckBox(field) {
        field.check.onclick = function() {
            field.time.disabled = field.type.disabled = !field.check.checked;
        };
    }
        
    function getSchedule() {
        ui.showSpinner(elements.form, 'schedule_spinner');
        loader.load({
            href: 'sites/schedule/status.html',
            type: 'json',
            success: function(schedule) {
                var rowContainer = document.querySelector('#schedule_list');
                for (var i = 0; i < schedule.length; i++) {
                    var rowView = rowContainer.querySelector('[data-row="' + i + '"]');
                    
                    var scheduleItem = schedule[i];
                    var time = '';
                    var type = 'ZZ';
                    if (scheduleItem.length >= 7 && scheduleItem.indexOf(':') > -1) {
                        var hour = scheduleItem.substring(0, 2);
                        var minute = scheduleItem.substring(3, 5);
                        var phase = scheduleItem.substring(5, 7);

                        if (phase === 'PM') {
                            hour = 12 + parseInt(hour);
                        }
                        time = hour + ":" + minute;                   
                    }
                    if (scheduleItem.length > 7) {
                        type = scheduleItem.substring(8, 10);
                    }
                    
                    if (!elements.fields[i]) {
                        rowView = document.createElement('div');
                        rowView.innerHTML = subviews.row.replace(/{index}/g, i)
                            .replace(/{checked}/g, time !== '' ? 'checked' : '')
                            .replace(/{disabled}/g, time === '' ? 'disabled' : '')
                            .replace(/{day}/g, t.get(weekDays[i].toLowerCase()))
                            .replace(/{time}/g, time)
                            .replace(/{selected_zz}/g, type !== 'SB' ? 'selected' : '')
                            .replace(/{selected_sb}/g, type === 'SB' ? 'selected' : '')
                            .replace(/{ZZ}/g, t.get('ZZ'))
                            .replace(/{SB}/g, t.get('SB'));
                        rowView = rowView.children[0];
                        rowContainer.insertBefore(rowView, rowContainer.lastElementChild);
                        elements.fields[i] = {
                            check: rowView.querySelector('[name="check_' + i + '"]'),
                            time: rowView.querySelector('[name="time_' + i + '"]'),
                            type: rowView.querySelector('[name="type_' + i + '"]')
                        }
                        initCheckBox(elements.fields[i]);
                    } else {
                        elements.fields[i].time.value = time;
                        elements.fields[i].type.selectedIndex = type === 'SB' ? 1 : 0;
                        elements.fields[i].check.checked = (time !== '');
                        elements.fields[i].time.disabled = elements.fields[i].type.disabled = (time === '');
                    }
                }
                ui.hideSpinner('schedule_spinner');
            },
            error: function(code) {
                alert('Error loading schedule: ' + code);
            }
        });
    }
    
    function saveSchedule() {
        var erroneous = false;
        
        var values = [];
        for (var i = 0; i < 7; i++) {
            var statusItem = '';
            var field = elements.fields[i];
            var timeField = field.time;
            var time = timeField.value;
            if (time !== '' && field.check.checked) {
                if (!/^[0-9]{2}:[0-9]{2}$/.test(time)) {
                    timeField.className = 'error';
                    erroneous = true;
                } else {
                    timeField.className = '';
                }
                
                var components = time.split(':');
                var hour = parseInt(components[0]);
                var phase = 'AM';
                if (hour > 12) {
                    hour -= 12;
                    phase = 'PM';
                }
                statusItem = (hour < 10 ? '0' + hour : hour) + ':' + components[1] + phase + ',' + field.type.value;
            }
            values.push(statusItem);
        }
        
        if (!erroneous) {
            ui.showSpinner(elements.form, 'schedule_spinner');
            
            var href = '/sites/schedule.html?SEND=Save';
            for (var i = 0; i < values.length; i++) {
                href += '&' + weekDays[i] + '=' + values[i];
            }
            
            loader.load({
                href: href,
                type: 'plain',
                success: function(response) {
                    ui.toast(t.get('schedule_save_success'), 'success')
                },
                error: function(code) {
                    throw code;
                }, 
                always: function() {
                    getSchedule();
                    ui.hideSpinner('schedule_spinner');
                }
            });
        } else {
            ui.toast(t.get('schedule_save_error', [t.get('invalid_input')]), 'error');
        }
    }
    
    return {
        template: require('text!./schedule/schedule.html'),
        styles: require('text!./schedule/schedule.css'),
        init: function() {
            elements = {
                form: document.querySelector('#schedule_form'),
                submit: document.querySelector('#schedule_submit'),
                reset: document.querySelector('#schedule_reset'),
                fields: []
            };           
                               
            elements.form.onsubmit = function() {
                saveSchedule();
                return false;
            };
            
            elements.reset.onclick = function() {
                getSchedule();
                return false;
            };
            
            getSchedule.apply(this);
        },
        dispose: function() {

        }
    };
});