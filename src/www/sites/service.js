define(function(require) {
    var elements = null;
    
    var loader = require('loader');
    var ui = require('ui');
    var t = require('translator');
        
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
                }
            };           
                
            elements.upload.form.addEventListener('submit', events.upload, true);
        },
        dispose: function() {
            elements.upload.form.removeEventListener('submit', events.upload, true);
        }
    };
});