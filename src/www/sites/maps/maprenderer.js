define("sites/maps/maprenderer", [], function() {
    var COLOR_FLOOR = '#a88957';
    var COLOR_WALL  = '#5f5f5f';
    var COLOR_CARPET = '#ffffff';

    var COLOR_SNEAK = 'rgba(190, 155, 98, 0.75)';
    var COLOR_SCREW = 'rgba(133, 108, 68, 0.8)';
    var COLOR_FIGHT = 'rgba(244, 67, 54, 0.8)';
    var COLOR_BUMP_ABYSS = 'rgba(118, 94, 107, 0.8)';
    var COLOR_ABYSS = 'rgba(0, 0, 223, 0.8)';
    var COLOR_BUMP = 'rgba(202, 0, 100, 0.8)';
    var COLOR_MOVE = 'rgba(225, 142, 14, 0.8)';

    var BLOCK_SIZE  = 100;
    var CELL_SIZE   = 10;
    var ICON_SIZE   = 32;    
    
    return function(mapData, logData) {
        var mapZoom = 1;
        var logZoom = 1;

        var imageCache = {};

        var renderOffset = {
            x: 0,
            y: 0
        };

        var renderOffset2 = {
            x: 0,
            y: 0
        };

        function drawCellLayer(condition, x, y, size, color, ctx) {
            if (condition) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, Math.ceil(size), Math.ceil(size));
            }
        }

        function drawCell(block, cell, ctx) {
            //var finalBlockSize = BLOCK_SIZE * zoom;
            var finalCellSize = CELL_SIZE * mapZoom;
            var x = Math.floor((block.x - mapData.offsets.xMin + cell.x) * mapZoom + renderOffset.x);
            var y = Math.floor(((mapData.offsets.yMax - block.y) + (100 - cell.y)) * mapZoom + renderOffset.y);

            if (cell.floor !== 'INACCESSIBLE') {
                drawCellLayer(cell.floor === 'NORMAL', x, y, finalCellSize, COLOR_FLOOR, ctx);
                drawCellLayer(cell.floor === 'WALL', x, y, finalCellSize, COLOR_WALL, ctx);
                drawCellLayer(cell.floor === 'CARPET', x, y, finalCellSize, COLOR_CARPET, ctx);
            }        

            drawCellLayer(cell.sneaking, x, y, finalCellSize, COLOR_SNEAK, ctx);
            drawCellLayer(cell.screwing, x, y, finalCellSize, COLOR_SCREW, ctx);
            var isMoveObject = cell.sneaking && cell.screwing;
            if (cell.abyss && (cell.screwing || isMoveObject)) { // IS FIGHTING
                drawCellLayer(true, x, y, finalCellSize, COLOR_FIGHT, ctx);
            } else if (cell.collision && cell.abyss) { // IS BUMPING
                drawCellLayer(true, x, y, finalCellSize, COLOR_BUMP_ABYSS, ctx);
            } else {
                drawCellLayer(cell.abyss, x, y, finalCellSize, COLOR_ABYSS, ctx);
                drawCellLayer(cell.collision, x, y, finalCellSize, COLOR_BUMP, ctx);
            }
            drawCellLayer(isMoveObject, x, y, finalCellSize, COLOR_MOVE, ctx);
        }

        function drawBlock(block, ctx, start) {       
            var finalBlockSize = BLOCK_SIZE * mapZoom;
            var x = Math.floor((block.x - mapData.offsets.xMin) * mapZoom + renderOffset.x);
            var y = Math.floor((mapData.offsets.yMax - block.y) * mapZoom + renderOffset.y);

            ctx.strokeStyle = 'rgba(102, 102, 102, 1)';
            if (start) {
                ctx.strokeStyle = 'rgba(102, 0, 0, 1)';
            }
            //ctx.setLineDash([CELL_SIZE / 2 * zoom, CELL_SIZE / 2 * zoom]);
            ctx.strokeRect(x, y, Math.ceil(finalBlockSize), Math.ceil(finalBlockSize));
        }

        function drawSVGIcon(name, position, color, ctx) {
            if (!imageCache[name]) {
                var data = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
                    document.querySelector('#' + name).innerHTML +
                '</svg>';        
                var img = new Image();
                img.src = 'data:image/svg+xml;base64,'+window.btoa(data);
                imageCache[name] = img;
            }
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = "#333";
            ctx.drawImage(imageCache[name], position.x - ICON_SIZE / 2, position.y - ICON_SIZE, ICON_SIZE, ICON_SIZE);
            
            var POINTER = 5 * mapZoom;
            ctx.save(); 
            ctx.translate(position.x, position.y); 
            ctx.rotate(position.r);
            ctx.beginPath();
            ctx.moveTo(0, -POINTER);
            ctx.lineTo(POINTER,  POINTER);
            ctx.lineTo(-POINTER, POINTER);
            ctx.lineTo(0, -POINTER);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore(); 
        }

        function drawRoute(path, ctx) {
            var p1 = null;
            
            ctx.lineWidth = "2";
            ctx.setLineDash([2, 4]);
            switch(path.state) {
                case 'HOMING':
                    ctx.strokeStyle = '#00FF00';
                    break;
                case 'TRAPPED':
                    ctx.strokeStyle = '#FF00FF';
                    break;
                case 'TRAPPED_END':
                case 'TRAPPED_HOMING':
                    ctx.strokeStyle = '#00FFFF';
                    break;
                case 'CARPET':
                    ctx.strokeStyle = '#FFFF00';
                    break;
                default:
                    ctx.strokeStyle = '#333333';
                    ctx.lineWidth = "1";
                    ctx.setLineDash([1, 4]);
            }
                        
            ctx.beginPath();
            path.waypoints.forEach(function(waypoint, index) {
                var p2 = waypoint;
                               
                if (index > 0) {
                    var line = {
                        x1: p1.x * logZoom + renderOffset2.x,
                        y1: (logData.offsets.yMax - p1.y) * logZoom + renderOffset2.y,
                        x2: p2.x * logZoom + renderOffset2.x,
                        y2: (logData.offsets.yMax - p2.y) * logZoom + renderOffset2.y
                    };
                    ctx.moveTo(line.x1, line.y1);
                    ctx.lineTo(line.x2, line.y2);
                }
                
                p1 = waypoint;
            });
            ctx.stroke();        
        }

        function drawLogEntry(entry, ctx) {
            var position = {
                x: entry.position.x * logZoom + renderOffset2.x,
                y: (logData.offsets.yMax - entry.position.y) * logZoom + renderOffset2.y,
                r: entry.position.r * Math.PI / 180
            };

            switch(entry.state) {
                case 'START':
                    drawSVGIcon('map_start', position, '#00ffff', ctx);
                    break;
                case 'TRAPPED_END':
                case 'END':
                    drawSVGIcon('map_finish', position, '#00ff00', ctx);
                    break;
                default:
                    switch(entry.type) {
                        case 'Bumping':
                            drawSVGIcon('map_bump', position, '#ff0000', ctx);
                            break;
                        case 'TrapStateStarts':
                            drawSVGIcon('map_trapstart', position, '#ff00ff', ctx);
                            break;
                        case 'TrapStateEnds':
                            drawSVGIcon('map_trapend', position, '#ffff00', ctx);
                            break;
                    }
            }
        }

        this.render = function(canvas) {
            canvas.width = canvas.parentNode.offsetWidth;
            canvas.height = Math.min(canvas.width, document.body.offsetHeight - 200);

            var mapSize = {
                width: (mapData.offsets.xMax - mapData.offsets.xMin) + BLOCK_SIZE,
                height: (mapData.offsets.yMax - mapData.offsets.yMin) + BLOCK_SIZE
            };
            var xFactor = canvas.width / mapSize.width;
            var yFactor = canvas.height / mapSize.height;
            mapZoom = Math.min(xFactor, yFactor);

            renderOffset.x = (canvas.width - mapSize.width * mapZoom) / 2;
            renderOffset.y = (canvas.height - mapSize.height * mapZoom) / 2;

            if (canvas.getContext){
                var ctx = canvas.getContext('2d');
                ctx.scale(1, 1);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                mapData.blocks.forEach(function(block, blockIndex) {
                    block.cells.forEach(function(cell) {
                        drawCell(block, cell, ctx);
                    });
                    drawBlock(block, ctx, blockIndex === 0);
                });

                if (!!logData) {
                    var logPadding = {
                        x: (logData.offsets.xMax - logData.offsets.xMin) * (BLOCK_SIZE / mapSize.width),  
                        y: (logData.offsets.yMax - logData.offsets.yMin) * (BLOCK_SIZE / mapSize.height)   
                    };

                    logZoom = mapZoom * 0.1;

                    renderOffset2.x = Math.abs(logData.offsets.xMin) * logZoom + (mapData.offsets.floorXMin - mapData.offsets.xMin + 20) * mapZoom + renderOffset.x;
                    renderOffset2.y = (mapData.offsets.yMax + 100 - mapData.offsets.floorYMax + 20) * mapZoom + renderOffset.y;
                    var specialState = null;
                    
                    logData.routes.forEach(function(route) {
                        drawRoute(route, ctx);
                    });
                    
                    
                    logData.events.forEach(function(event) {
                        if (event.type === 'TrapStateStarts') {
                            specialState = 'TRAPPED';
                            if (event.info === 'Homing') {
                                specialState = 'TRAPPED_HOMING';
                            }
                        }
                        if (event.type === 'TrapStateEnds') {
                            specialState = null;
                        }
                        drawLogEntry(event, ctx, specialState);
                    });
                }
            }
        };
    };
});
