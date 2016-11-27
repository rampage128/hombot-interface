define("sites/service/xmleditor", ['loader'], function(loader) {
    return function(filePath) {
        var xml;
        var parameters = {};
        var fileName = filePath.split('/')
        fileName = fileName[fileName.length-1];

        function resetParameter(parameterName, callback) {
            var parameter = parameters[parameterName];
            if (parameter.value !== parameter.defaultValue) {
                parameter.value = parameter.defaultValue;
                callback(parameterName, parameter.value);
            }
        }

        this.load = function(callbacks) {
            loader.load({
                href: filePath,
                type: 'xml',
                success: function(response) {
                    xml = response;
                    loader.load({
                        href: 'xml/' + fileName + '.info',
                        type: 'xml',
                        success: function(response) {
                            var defaultValues = response.querySelectorAll('parameterTable parameter');
                            var parameterValues = xml.querySelectorAll('parameterTable parameter');
                            
                            defaultValues.forEach(function(defaultValue, index) {
                                parameters[defaultValue.getAttribute('name')] = {
                                    value: parameterValues[index].getAttribute('value'),
                                    defaultValue: defaultValue.getAttribute('value')
                                };
                            });
                                
                            callbacks.success(parameters);
                            callbacks.always();
                        },
                        error: function(code) {          
                            callbacks.error(code);
                            callbacks.always();
                        }
                    });
                },
                error: function(code) {        
                    callbacks.error(code);
                    callbacks.always();
                }
            });
        };
        
        this.save = function(callbacks) {
            var counter = 0;
            Object.keys(parameters).forEach(function(name) {
                var parameterElement = xml.querySelector('parameter[name="' + name + '"]');
                var originalValue = parameterElement.getAttribute('value');
                var value = parameters[name].value;
                if (originalValue !== value) {
                    parameterElement.setAttribute('value', value);
                    counter++;
                }
            });
            
            if (counter < 1) {
                callbacks.unchanged();
                return;
            }
            
            var blob = new Blob([(new XMLSerializer()).serializeToString(xml)], { type: "text/xml"});
            
            var formData = new FormData();	
            formData.append('myfile', blob, fileName);
            
            loader.load({
                href: '/upload.html',
                method: 'POST',
                data: formData,
                success: function(response) {
                    loader.load({
                        href: '/activate?' + fileName,
                        success: function(response) {
                            callbacks.success();
                        },
                        error: function(code) {
                            callbacks.error(code);
                        }
                    });
                },
                error: function(code) {
                    callbacks.error(code);
                }
            });
        };
        
        this.set = function(parameterName, value) {
            parameters[parameterName].value = value;
        };
        
        this.reset = function(parameterName, callback) {
            resetParameter(parameterName, callback);
        };
        
        this.resetAll = function(callback) {
            for (var name in parameters) {
                resetParameter(name, callback);   
            }
        };
    };
});
