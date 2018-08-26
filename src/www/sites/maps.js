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
    var userZoom = 1;
    var flip = { x: 1, y: -1 };
    var userOffset = { x: 0, y: 0 };
    
    var subviews = { 
        fact: require('text!./maps/fact.html')
    };
    
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
        
        var isGlobalMap = mapFile === mapInfo.global_map;
        
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
                                updateMap(mapReader.getMapData(), logReader.getLogData());
                                renderFacts(mapReader.getMapData(), logReader.getLogData(), isGlobalMap);
                            },
                            error: function(code) {
                                ui.toast(t.get('maplog_load_error', [logFile, code]), 'error');
                            }
                        });
                    } else {
                        updateMap(mapReader.getMapData(), null);
                        renderFacts(mapReader.getMapData(), null, isGlobalMap);
                    }
                });
            },
            error: function(code) {
                ui.toast(t.get('map_load_error', [mapFile, code]), 'error');
                ui.hideSpinner('map_load');
            }
        });
    }
    
    function updateMap(mapData, logData) {
        userZoom = 1;
        userOffset = { x: 0, y: 0 };
        mapRenderer = new MapRenderer(mapData, logData);
        renderMap();
        ui.hideSpinner('map_load');
    }
    
    function renderMap() {
        mapRenderer.render(elements.canvas, { x: userZoom * flip.x, y: userZoom * flip.y }, userOffset);
    }
    
    function renderFacts(mapData, logData, isGlobalMap) {       
        elements.facts.innerHTML = '';
              
        var decimalOptions = {minimumFractionDigits: 0, maximumFractionDigits: 2};       
        
        var surface = (mapData.stats.floorSurface / 100).toLocaleString(undefined, decimalOptions);
        renderFact('surface', isGlobalMap ? 'fact_surface_global' : 'fact_surface', t.get('fact_surface_value', [surface]));
        
        if (logData !== null) {
            var distance = logData.header.travelDistance.toLocaleString(undefined, decimalOptions);
            
            renderFact('duration', 'fact_duration', formatDuration(logData.header.duration));
            renderFact('distance', 'fact_distance', t.get('fact_distance_value', [distance]));
            renderFact('bump', 'fact_bump', logData.header.numBumps);
        }
    }
    
    function formatDuration(duration) {
        duration = Math.max(duration, 1);
        
        var hours = Math.floor(duration / 60 / 60);
        var minutes = Math.floor(duration / 60 - hours * 60);
        var seconds = Math.floor(duration - minutes * 60 - hours * 60 * 60);
        var result = '';
        
        result = appendDurationPart(hours, 'hours', result);
        result = appendDurationPart(minutes, 'minutes', result);
        result = appendDurationPart(seconds, 'seconds', result);

        return result;
    }   
    
    function appendDurationPart(value, type, message) {
        if (value > 0) {
            return message + (message !== '' ? ' ' : '') + t.get('fact_duration_' + type, [value]);
        }
        return message;
    }
    
    function renderFact(icon, name, value) {
        var fact = subviews.fact
        .replace(/{icon}/g, icon)
        .replace(/{name}/g, t.get(name))
        .replace(/{value}/g, value);

        elements.facts.innerHTML += fact;
    }
    
    return {
        template: require('text!./maps/maps.html'),
        styles: require('text!./maps/maps.css'),
        init: function() {
            elements = {
                select: document.querySelector('#map_select'),
                canvas: document.querySelector('#map_canvas'),
                facts : document.querySelector('#fact_list'),
                toolFlipH: document.querySelector('#map_control_flip_horizontal'),
                toolFlipV: document.querySelector('#map_control_flip_vertical')
            };           
            
            loadMapList();
            
            elements.select.onchange = function() {
                loadMap(this.selectedIndex);
            };
            
            elements.canvas.onwheel = function(event) {
                userZoom -= event.deltaY * 0.005;
                userZoom = Math.min(20, Math.max(userZoom, 1));
                renderMap();
                event.preventDefault();
            };
            
            var dragging = false;
            var dragPos = { x: 0, y: 0 };
            elements.canvas.onmousedown = function(event) {
                dragPos.x = event.screenX;
                dragPos.y = event.screenY;
                dragging = true;
                event.preventDefault();
            };
            
            elements.canvas.onmousemove = function(event) {
                if (dragging) {
                    userOffset.x = userOffset.x + (event.screenX - dragPos.x) / (mapRenderer.getZoom() * userZoom);
                    userOffset.y = userOffset.y + (event.screenY - dragPos.y) / (mapRenderer.getZoom() * userZoom);
                    dragPos.x = event.screenX;
                    dragPos.y = event.screenY;
                    renderMap();
                    event.preventDefault();
                }
            };
            
            elements.canvas.onmouseup = function(event) {
                dragging = false;
            };
            
            elements.canvas.onmouseout = function(event) {
                dragging = false;
            };
            
            elements.toolFlipH.onclick = function(event) {
                flip.x *= -1;
                elements.toolFlipH.classList.toggle('toolbar__item--active', flip.x < 0);
                renderMap();
            };
            
            elements.toolFlipV.onclick = function(event) {
                flip.y *= -1;
                elements.toolFlipV.classList.toggle('toolbar__item--active', flip.y > 0);
                renderMap();
            }
            
            var resizeTimer = 0;
            window.onresize = function() {
                if (!!resizeTimer) {
                    window.clearTimeout(resizeTimer);
                }
                resizeTimer = window.setTimeout(function() {
                    if (!!mapRenderer) {
                        renderMap();
                    }
                }, 300);
            };
        },
        dispose: function() {
            
        }
    };
});
