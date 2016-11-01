define(function(require) {
    var elements = null;
    var mapInfo = null;   
    var loader = require('loader');
    var ui = require('ui');
    var t = require('translator');
    var MapRenderer = require('sites/maps/maprenderer');
    var MapReader = require('sites/maps/mapreader');
    var LogReader = require('sites/maps/logreader');
    var mapRenderer;
    
    function createOption(value, title) {
        var option = document.createElement('option');
        option.innerHTML = title;
        option.value = value;
        elements.select.appendChild(option);
    }
    
    function loadMapList() {
        ui.showSpinner(elements.select.parentNode, 'maplist_spinner');
        loader.load({
            href: 'sites/maps/status.html',
            type: 'json',
            success: function(response) {            
                mapInfo = response;
                createOption(mapInfo.global_map, t.get('Learned map'));
                for (var i = 0; i < mapInfo.maps.length; i++) {
                    var value = mapInfo.maps[i];
                    var title = value.substring(13, 15) + '.' +
                                value.substring(11, 13) + '.' +
                                value.substring(7, 11) + ' - ' +
                                value.substring(15, 17) + ':' +
                                value.substring(17, 19);
                    createOption(value, title);
                }
                loadMap(0);
            },
            error: function(code) {
                ui.toast(t.get('maplist_load_error', [code]), 'error');
            },
            always: function() {
                ui.hideSpinner('maplist_spinner');
            }
        });
    }
    
    function loadMap(index) {
        ui.showSpinner(elements.canvas.parentNode, 'map_load');
        
        var mapFile = mapInfo.global_map;
        var logFile = null;
        if (index > 0) {
            var map = mapInfo.maps[index-1];
            //var log = mapData.logs[index-1];
            var runId = map.replace(/^MAPDATA[0-9]{14}_[0-9]{6}_([^_]*).blk$/, '$1');
            var re = new RegExp("U_" + runId, "g");
            mapInfo.logs.forEach(function(log) {
                if (re.test(log)) {
                    logFile = mapInfo.blackbox + log;
                }
            });
            mapFile = mapInfo.blackbox + map;
            //logFile = mapData.blackbox + log;
        }
        
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            ui.toast(t.get('error_fileapi_support'), 'error');
            return;
        }

        loader.load({
            href: mapFile,
            type: 'binary',
            success: function(blob) {
                var reader = new FileReader();	 
                reader.readAsBinaryString(blob);
                reader.onloadend = (function(file) {
                    var mapReader = new MapReader(reader.result);
                    if (!!logFile) {
                        loader.load({
                            href: logFile,
                            type: 'plain',
                            success: function(content) {
                                var logReader = new LogReader(content);
                                renderMap(mapReader.getMapData(), logReader.getLogData());
                            },
                            error: function(code) {
                                ui.toast(t.get('maplog_load_error', [logFile, code]), 'error');
                            }
                        });
                    } else {
                        renderMap(mapReader.getMapData(), null);
                    }
                });
            },
            error: function(code) {
                ui.toast(t.get('map_load_error', [mapFile, code]), 'error');
                ui.hideSpinner('map_load');
            }
        });
    }
    
    function renderMap(mapData, logData) {
        mapRenderer = new MapRenderer(mapData, logData);
        mapRenderer.render(elements.canvas);
        ui.hideSpinner('map_load');
    }
    
    return {
        template: require('text!./maps/maps.html'),
        styles: require('text!./maps/maps.css'),
        init: function() {
            elements = {
                select: document.querySelector('#map_select'),
                canvas: document.querySelector('#map_canvas')
            };           
            
            loadMapList();
            
            elements.select.onchange = function() {
                loadMap(this.selectedIndex);
            };
            
            var resizeTimer = 0;
            window.onresize = function() {
                if (!!resizeTimer) {
                    window.clearTimeout(resizeTimer);
                }
                resizeTimer = window.setTimeout(function() {
                    if (!!mapRenderer) {
                        mapRenderer.render(elements.canvas);
                    }
                }, 300);
            };
        },
        dispose: function() {
            
        }
    };
});
