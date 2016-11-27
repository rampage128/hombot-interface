define(function(require) {
    var elements = null;
    var xmlEditor = null;
    
    var subviews = { 
        xml_form: require('text!./service/xml_form.html'),
        xml_row: require('text!./service/xml_row.html')
    };
    
    var loader = require('loader');
    var ui = require('ui');
    var t = require('translator');
    var XMLEditor = require('sites/service/xmleditor');
        
    function getResponseData(response) {
        var tempContainer = document.createElement('DIV');
        tempContainer.innerHTML = response;
        
        var type = null;
        if (!!tempContainer.querySelector('#install')) {
            type = "INSTALL";
        } else if (!!tempContainer.querySelector('#delete')) {
            type = "DELETE";
        }
        
        return  {
            fileName: tempContainer.querySelector('#fname').innerHTML,
            type: type
        };
    }
    
    function getUploadFileName() {
        var fileName = elements.upload.field.value.split('/');
        if (fileName[0].indexOf('\\') > -1) {
            fileName = elements.upload.field.value.split('\\');
        }
        return fileName[fileName.length - 1];
    }
        
    var events = {
        upload: function(event) {
            event.preventDefault();
            
            var fileName = getUploadFileName();
            
            ui.showSpinner(elements.upload.button.parentNode, 'software_update');
            
            loader.load({
                href: '/upload.html',
                method: 'POST',
                data: new FormData(elements.upload.form),
                success: function(response) {
                    var data = getResponseData(response);

                    elements.upload.form.removeEventListener('submit', events.upload, true);
                    if (data.type === "INSTALL") {
                        elements.upload.response.innerHTML = t.get('install_cta', [data.fileName]);
                        elements.upload.button.value = t.get('Install');
                        elements.upload.form.addEventListener('submit', events.install, true);
                    } else {
                        elements.upload.response.innerHTML = t.get('delete_cta', [data.fileName]);
                        elements.upload.button.value = t.get('Delete');
                        elements.upload.form.addEventListener('submit', events.delete, true);
                    }
                    
                    elements.upload.field.className = 'is-hidden';
                    elements.upload.response.className = '';
                    
                    ui.toast(t.get('upload_success', [fileName]), 'success');
                },
                error: function(code) {
                    ui.toast(t.get('upload_error', [fileName, code]), 'error');
                },
                always: function() {
                    ui.hideSpinner('software_update');
                }
            });
        },
        install: function(event) {
            event.preventDefault();
                      
            ui.showSpinner(elements.upload.button.parentNode, 'software_update');
            elements.upload.field.disabled = true;
            var fileName = getUploadFileName();
                      
            loader.load({
                href: '/activate?' + fileName,
                success: function(response) { 
                    var timer = 5;
                    
                    ui.toast(t.get('install_success'), 'success');
                    elements.upload.form.removeEventListener('submit', events.install, true);
                    elements.upload.response.innerHTML = t.get('reload_cta', timer);
                    
                    var closeInterval = window.setInterval(function() {
                        elements.upload.response.innerHTML = t.get('reload_cta', [--timer]);
                        if (timer < 1) {
                            ui.showSpinner(document.querySelector('#content'), 'reload');
                        }
                        if (timer < 0) {
                            window.clearInterval(closeInterval);
                            window.location.reload();
                        }
                    }, 1000);
                    
                    ui.hideSpinner('software_update');
                    ui.showSpinner(elements.upload.button.parentNode, 'software_update');
                },
                error: function(code) {                   
                    ui.toast(t.get('install_error', [code]), 'error');
                    ui.hideSpinner('software_update');
                },
                always: function() {
                    elements.upload.field.disabled = false;
                }
            });
        },
        delete: function(event) {
            event.preventDefault();
            
            var fileName = getUploadFileName();
                      
            ui.showSpinner(elements.upload.button.parentNode, 'software_update');
            loader.load({
                href: '/remove?' + fileName,
                success: function(response) { 
                    ui.toast(t.get('delete_success'), 'success');
                    elements.upload.form.removeEventListener('submit', events.delete, true);
                    elements.upload.form.addEventListener('submit', events.upload, true);
                    elements.upload.button.value = t.get('Upload');
                    elements.upload.form.reset();

                    elements.upload.response.className = 'is-hidden';
                    elements.upload.field.className = '';
                },
                error: function(code) {                   
                    ui.toast(t.get('delete_error', [code]), 'error');
                },
                always: function() {
                    ui.hideSpinner('software_update');
                }
            });
        },
        xmlEdit: function(event) {
            event.preventDefault();
            
            var xmlFile = event.currentTarget;
            
            ui.showSpinner(xmlFile.parentNode.parentNode, 'xml_edit');
            
            xmlEditor = new XMLEditor(xmlFile.href);
            xmlEditor.load({
                success: function(parameters) {
                    var fileName = xmlFile.href.split('/');
                    fileName = fileName[fileName.length-1];

                    var temp = document.createElement('DIV');
                    temp.innerHTML = subviews.xml_form;
                    var xmlForm = temp.children[0];
                    var parameterContainer = xmlForm.querySelector('.js_parameter_list');

                    Object.keys(parameters).forEach(function(name) {
                        var param = parameters[name];
                        var row = subviews.xml_row
                                .replace(/{Reset}/g, t.get('Reset'))
                                .replace(/{name}/g, name)
                                .replace(/{value}/g, param.value)
                                .replace(/{default_value}/g, '')
                                .replace(/{param_default}/g, t.get('default_value', [param.defaultValue]))
                                .replace(/{label}/g, t.get(name, [name]).replace(/_/g, '_&#8203;'));
                        var temp = document.createElement('DIV');
                        temp.innerHTML = row;
                        var resetButton = temp.querySelector('.js_parameter_reset');
                        var input = temp.querySelector('.js_parameter_input');
                        input.addEventListener('change', function() {
                            xmlEditor.set(name, input.value);
                        }, true);
                        resetButton.addEventListener('click', function(event) {
                            event.preventDefault();
                            
                            xmlEditor.reset(name, function(name, value) {
                                input.value = value;
                            });
                        }, true);
                        var children = temp.children;
                        while(children.length > 0) {
                            parameterContainer.appendChild(children[0]);
                        };
                    });
                    
                    xmlForm.addEventListener('submit', function(event) {
                        events.xmlSave(event);
                    }, true);

                    ui.showDialog(t.get('edit_xml', [fileName]), xmlForm, [
                        {
                            label: t.get('Reset'),
                            event: events.xmlReset,
                            type: 'additional'
                        },
                        {
                            label: t.get('Cancel'),
                            event: events.xmlCancel,
                            type: 'cancel'
                        },
                        {
                            label: t.get('Save'),
                            event: events.xmlSave,
                            type: 'default'
                        }
                    ]);
                },
                error: function(code) {
                    ui.toast(t.get('xml_edit_error', [code]), 'error');
                },
                always: function(code) {
                    ui.hideSpinner('xml_edit');
                }
            });
        },
        xmlCancel: function(event) {
            ui.hideDialog();
        },
        xmlReset: function(event) {
            if (!confirm(t.get('xml_resetall_confirm'))) {
                return;
            }
            var counter = 0;
            xmlEditor.resetAll(function(name, value) {
                document.querySelector('#PARAM_' + name).value = value;
                counter++;
            });
            if (counter > 0) {
                ui.toast(t.get('xml_resetall_success', [counter]), 'success');
            } else {
                ui.toast(t.get('xml_resetall_empty'), 'warning');
            }
        },
        xmlSave: function(event) {
            event.preventDefault();
            
            ui.showSpinner(document.querySelector('#dialog .dialog__window'), 'xml_save');
            xmlEditor.save({
               success: function() {
                   ui.toast(t.get('xml_save_success'), 'success');
                   ui.hideDialog();
               },
               error: function() {
                   ui.toast(t.get('xml_save_error'), 'error');
                   ui.hideSpinner('xml_save');
               },
               unchanged: function() {
                   ui.toast(t.get('xml_save_unchanged'), 'warning');
                   ui.hideDialog();
               }
            });
        }
    };
        
    return {
        template: require('text!./service/service.html'),
        styles: require('text!./service/service.css'),
        init: function() {
            elements = {
                upload: {
                    form: document.querySelector('#software_form'),
                    field: document.querySelector('#software_field'),
                    response: document.querySelector('#software_response'),
                    button: document.querySelector('#software_button')
                },
                xmlFiles: document.querySelectorAll('.js_xml_edit')
            };           
                
            elements.upload.form.addEventListener('submit', events.upload, true);
            elements.xmlFiles.forEach(function(xmlFile) {
               xmlFile.addEventListener('click', events.xmlEdit, true);
            });
        },
        dispose: function() {
            elements.upload.form.removeEventListener('submit', events.upload, true);
            elements.xmlFiles.forEach(function(xmlFile) {
                xmlFile.removeEventListener('click', events.xmlEdit, true);
            });
        }
    };
});