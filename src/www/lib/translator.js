define('translator', ['module', 'loader'], function (module, loader) {
    var cache = {};
    var masterConfig = module.config ? module.config() : {};
    var locale = null;
    var language = null;
    var translations = {};   
    
    locale = masterConfig.locale;
    if (!locale) {
        locale = masterConfig.locale =
            typeof navigator === 'undefined' ? 'root' :
            ((navigator.languages && navigator.languages[0]) ||
             navigator.language ||
             navigator.userLanguage || 'root').toLowerCase();
    }
    if (!!locale && locale.indexOf('-')) {
        language = locale.split('-')[0];
    } else {
        language = locale;
    }
       
    function loadTranslation(path, callback) {
        try {
            loader.load({
                href: path, 
                type: 'json',
                async: false,
                success: function(contents) {
                    var newTranslations = contents['default'];
                    var hasLanguage = false;
                    var hasLocale   = false;
                    for (var key in newTranslations) {
                        translations[key] = newTranslations[key];
                    }
                    if (!!contents[language]) {
                        newTranslations = contents[language];
                        for (var key in newTranslations) {
                            translations[key] = newTranslations[key];
                        }
                        hasLanguage = true;
                    }
                    if (!!contents[locale]) {
                        newTranslations = contents[locale];
                        for (var key in newTranslations) {
                            translations[key] = newTranslations[key];
                        }
                        hasLocale = true;
                    }
                    if (!!callback) {
                        callback(hasLanguage, hasLocale);
                    }
                },
                error: function(code) {
                    console.log('Warning: cannot load translations ' + path + ': ' + code);
                    if (!!callback) {
                        callback(false, false);
                    }
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
    
    return {
        version: '0.1.0',
        load: function(path, callback) {
            if (!!cache[path]) {
                if (!!callback) {
                    callback();
                }
                return;
            }
            var parts = path.split('/');
            var basePath = null;
            var fileName = null;
            if (parts.length > 1) {
                basePath = 'sites/' + parts[0] + '/';
                fileName = parts[1] + '.json';
            } else {
                basePath = 'lang/';
                fileName = path + '.json';
            }

            loadTranslation(basePath + fileName, function(hasLanguage, hasLocale) {
                if (!!callback) {
                    callback();
                }
            });
            cache[path] = true;
        },
        get: function(key, params) {
            var string = translations[key];
            if (!!string && !!params) {
                for (var i = 0; i < params.length; i++) {
                    string = string.replace(new RegExp('\\{' + i + '\\}', 'g'), params[i]);
                }
            }
            return !!string ? string : key;
        },
        localize: function(input) {
            var placeholders = input.match(/{[a-zA-Z0-9,_-\s].*}/g);
            if (!!placeholders) {
                placeholders.forEach(function(placeholder, index) {
                    var pattern = new RegExp(placeholder);
                    var key = placeholder.replace(/[{}]/g, '');
                    input = input.replace(pattern, this.get(key));
                }.bind(this));
            }
            return input;
        }
    };
});
