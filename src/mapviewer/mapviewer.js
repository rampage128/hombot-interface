define("mapviewer", ["sites/maps/mapreader", "sites/maps/logreader", "sites/maps/maprenderer"], function(MapReader, LogReader, MapRenderer) {
    
    var mapRenderer = null;
    var resizeTimer = null;
    
    var userZoom = 1;
    var flip = { x: 1, y: -1 };
    var userOffset = { x: 0, y: 0 };
    
    function getFile(input) {
        if (!input.files) {
            throw('file api not supported!');
        }
        if (input.files.length === 0) {
            return null;
        }
        
        return input.files[0];
    }
    
    function load() {
        var mapFile = getFile(document.querySelector('#mapfile'));
        var logFile = getFile(document.querySelector('#logfile'));
        
        var mapFileReader = new FileReader();
        mapFileReader.onload = function (e) {
            var mapFileContents = e.target.result;
            if (!!logFile) {
                var logFileReader = new FileReader();
                logFileReader.onload = function (e) {
                    var logFileContents = e.target.result;
                    var mapReader = new MapReader(mapFileContents);
                    var logReader = new LogReader(logFileContents);
                    mapRenderer = new MapRenderer(mapReader.getMapData(), logReader.getLogData());
                    render();
                };
                logFileReader.readAsText(logFile);
            } else {
                var mapReader = new MapReader(mapFileContents);
                mapRenderer = new MapRenderer(mapReader.getMapData(), null);
                render();
            }
        };
        mapFileReader.readAsBinaryString(mapFile);
    }
    
    function render() {       
        if (mapRenderer) {
            mapRenderer.render(canvas, { x: userZoom * flip.x, y: userZoom * flip.y }, userOffset);
        }
    }
    
    document.querySelector('#refresh').onclick = function() {
        load();
    };
    
    var canvas    = document.querySelector('#map_canvas');
    var toolFlipH = document.querySelector('#map_control_flip_horizontal');
    var toolFlipV = document.querySelector('#map_control_flip_vertical');
    
    toolFlipH.onclick = function(event) {
        flip.x *= -1;
        toolFlipH.classList.toggle('toolbar__item--active', flip.x < 0);
        render();
    };

    toolFlipV.onclick = function(event) {
        flip.y *= -1;
        toolFlipV.classList.toggle('toolbar__item--active', flip.y > 0);
        render();
    };
    
    canvas.onwheel = function(event) {
        userZoom -= event.deltaY * 0.005;
        userZoom = Math.min(20, Math.max(userZoom, 1));
        render();
        event.preventDefault();
    };
    
    var dragging = false;
    var dragPos = { x: 0, y: 0 };
    canvas.onmousedown = function(event) {
        dragPos.x = event.screenX;
        dragPos.y = event.screenY;
        dragging = true;
        event.preventDefault();
    };

    canvas.onmousemove = function(event) {
        if (dragging) {
            userOffset.x = userOffset.x + (event.screenX - dragPos.x) / (mapRenderer.getZoom() * userZoom);
            userOffset.y = userOffset.y + (event.screenY - dragPos.y) / (mapRenderer.getZoom() * userZoom);
            dragPos.x = event.screenX;
            dragPos.y = event.screenY;
            render();
            event.preventDefault();
        }
    };
    
    canvas.onmouseup = function(event) {
        dragging = false;
    };

    canvas.onmouseout = function(event) {
        dragging = false;
    };
    
    window.onresize = function() {
        if (!!resizeTimer) {
            window.clearTimeout(resizeTimer);
        }
        resizeTimer = window.setTimeout(function() {
            if (!!mapRenderer) {
                render();
            }
        }, 300);
    };
});