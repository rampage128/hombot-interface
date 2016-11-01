define("mapviewer", ["sites/maps/mapreader", "sites/maps/logreader", "sites/maps/maprenderer"], function(MapReader, LogReader, MapRenderer) {
    
    var mapRenderer = null;
    var resizeTimer = null;
    
    function getFile(input) {
        if (!input.files) {
            throw('file api not supported!');
        }
        if (input.files.length === 0) {
            return null;
        }
        
        return input.files[0];
    }
    
    function render() {       
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
                    mapRenderer.render(document.querySelector('#map_canvas'));
                };
                logFileReader.readAsText(logFile);
            } else {
                var mapReader = new MapReader(mapFileContents);
                mapRenderer = new MapRenderer(mapReader.getMapData(), null);
                mapRenderer.render(document.querySelector('#map_canvas'));
            }
        };
        mapFileReader.readAsBinaryString(mapFile);
    }
    
    document.querySelector('#refresh').onclick = function() {
        render();
    };
    
    window.onresize = function() {
        if (!!resizeTimer) {
            window.clearTimeout(resizeTimer);
        }
        resizeTimer = window.setTimeout(function() {
            if (!!mapRenderer) {
                mapRenderer.render(document.querySelector('#map_canvas'));
            }
        }, 300);
    };
});