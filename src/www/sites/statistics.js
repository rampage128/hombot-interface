define(function(require) {
    var elements = null;
    var t = require('translator');

    var subviews = {
        row: require('text!./statistics/row.html'),
        category: require('text!./statistics/category.html')
    };
    var updateTimer = null;
    var loader = require('loader');
    var ui = require('ui');
       
    function update() {
        getStatus(function() {
            updateTimer = window.setTimeout(
                function() { 
                    update(); 
                },
                10000
            );
        });
    }
        
    function findRow(key) {
        var row = document.querySelector('[data-row="' + key + '"]');
        if (!!row) {
            
        }
    }
        
    function readValue(data) {
        if (data.type === 'datetime') {
            return  data.value.substring(8, 10) + "." +
                    data.value.substring(5, 7) + "." +
                    data.value.substring(0, 4) + " - " +
                    data.value.substring(11, 13) + ":" +
                    data.value.substring(14, 16) + ":" +
                    data.value.substring(17, 19);
        } else if (data.type === 'duration') {
            return data.value;
        }
        return data.value;
    }
        
    function getStatus(callback) {
        loader.load({
            href: 'sites/statistics/status.html',
            type: 'json',
            success: function(stats) {
                var categoryItems = '';
                var mainContainer = document.querySelector('#statistics');
                
                for (var category in stats) {
                    var values = stats[category];

                    var rowItems = '';

                    for (var key in values) {
                        var value = values[key];
                        
                        var keyItem = mainContainer.querySelector('[data-row-key="' + key + '"]');
                        if (!!keyItem) {
                            keyItem.innerHTML = t.get(key);
                        }
                        var valueItem = mainContainer.querySelector('[data-row-value="' + key + '"]');
                        if (!!valueItem) {
                            valueItem.innerHTML = readValue(value);
                        }
                        if (!keyItem && !valueItem) {
                            rowItems += subviews.row
                                .replace(/{key}/g, key)
                                .replace(/{title}/g, t.get(key))
                                .replace(/{type}/g, value.type)
                                .replace(/{value}/g, readValue(value));
                        }
                    }
                    
                    var categoryItem = mainContainer.querySelector('[data-category="' + category + '"]');
                    if (!!categoryItem) {
                        var titleItem = categoryItem.querySelector('.js_title');
                        if (!!titleItem) {
                            titleItem.innerHTML = t.get(category);
                        }
                        var contentItem = categoryItem.querySelector('.js_content');
                        if (!!contentItem) {
                            contentItem.innerHTML += rowItems;
                        }
                    } else {
                        categoryItems += subviews.category
                            .replace(/{category}/g, category)
                            .replace(/{title}/g, t.get(category))
                            .replace(/{content}/g, rowItems);
                    }
                }
                
                if (!!mainContainer) {
                    mainContainer.innerHTML += categoryItems;
                }
            },
            error: function(code) {
                ui.toast(t.get('statistic_error', [code.message]), 'error');
            },
            always: callback
        });
    };
    
    return {
        template: require('text!./statistics/statistics.html'),
        styles: require('text!./statistics/statistics.css'),
        init: function() {
            elements = [];
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