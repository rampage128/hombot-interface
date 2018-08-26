define("sites/maps/maprenderer", [], function() {
    var COLOR_BLOCK_HOME    = 'rgba(102, 0, 0, 0.5)';
    var COLOR_BLOCK_DEFAULT = 'rgba(102, 102, 102, 0.5)';
    
    var COLOR_CELL_FLOOR = 'rgba(168, 137, 87, 1)';
    var COLOR_CELL_WALL  = 'rgba(95, 95, 95, 1)';
    var COLOR_CELL_CARPET = 'rgba(255, 255, 255, 1)';
    var COLOR_CELL_SNEAK = 'rgba(190, 155, 98, 0.8)';
    var COLOR_CELL_SNEAK_WALL = 'rgba(190, 155, 98, 0.2)';
    var COLOR_CELL_SCREW = 'rgba(133, 108, 68, 0.8)';
    var COLOR_CELL_FIGHT = 'rgba(244, 67, 54, 0.8)';
    var COLOR_CELL_BUMP_ABYSS = 'rgba(118, 94, 107, 0.8)';
    var COLOR_CELL_ABYSS = 'rgba(0, 0, 223, 0.8)';
    var COLOR_CELL_BUMP = 'rgba(202, 0, 100, 0.8)';
    var COLOR_CELL_MOVE = 'rgba(225, 142, 14, 0.8)';

    var COLOR_PATH_HOMING = 'rgba(0, 255, 0, .5)';
    var COLOR_PATH_TRAPPED = 'rgba(255, 255, 0, .5)';
    var COLOR_PATH_TRAPPED_HOMING = 'rgba(255, 255, 0, .5)';
    var COLOR_PATH_CARPET = 'rgba(255, 0, 255, .5)';
    var COLOR_PATH_DEFAULT  = 'rgba(51, 51, 51, .3)';
    
    var COLOR_EVENT_START  = 'rgba(0, 255, 255, 1)';
    var COLOR_EVENT_BUMP  = 'rgba(255, 0, 0, 1)';
    var COLOR_EVENT_TRAP_START  = 'rgba(255, 255, 0, 1)';
    var COLOR_EVENT_TRAP_END  = 'rgba(255, 255, 127, 1)';
    var COLOR_EVENT_HOME  = 'rgba(0, 255, 0, 1)';

    var BLOCK_SIZE  = 1000;
    var CELL_SIZE   = 100;
    var ICON_SIZE   = 32;
    
    return function(mapData, logData) {
        var zoom = 1;
        var scale = { x: 1, y: 1 };
        var offset = { x: 0, y: 0 };
        var imageCache = {};

        function drawCellLayer(condition, pos, size, color, ctx) {
            if (condition) {
                ctx.fillStyle = color;
                ctx.fillRect(pos.x, pos.y, Math.round(size * scale.x), Math.round(size * scale.y));
            }
        }

        function drawCell(block, cell, ctx) {
            var finalCellSize = Math.ceil(CELL_SIZE * zoom);
            var pos = worldToView({ x: block.x + cell.x, y: block.y + cell.y });

            if (cell.floor !== 'INACCESSIBLE') {
                drawCellLayer(cell.floor === 'NORMAL', pos, finalCellSize, COLOR_CELL_FLOOR, ctx);
                drawCellLayer(cell.floor === 'CARPET', pos, finalCellSize, COLOR_CELL_CARPET, ctx);
                drawCellLayer(cell.floor === 'WALL', pos, finalCellSize, COLOR_CELL_WALL, ctx);
            }

            drawCellLayer(cell.sneaking && cell.floor !== 'WALL', pos, finalCellSize, COLOR_CELL_SNEAK, ctx);
            drawCellLayer(cell.sneaking && cell.floor === 'WALL', pos, finalCellSize, COLOR_CELL_SNEAK_WALL, ctx);
            drawCellLayer(cell.screwing, pos, finalCellSize, COLOR_CELL_SCREW, ctx);
            var isMoveObject = cell.sneaking && cell.screwing;
            if (cell.abyss && (cell.screwing || isMoveObject)) { // IS FIGHTING
                drawCellLayer(true, pos, finalCellSize, COLOR_CELL_FIGHT, ctx);
            } else if (cell.collision && cell.abyss) { // IS BUMPING
                drawCellLayer(true, pos, finalCellSize, COLOR_CELL_BUMP_ABYSS, ctx);
            } else {
                drawCellLayer(cell.abyss, pos, finalCellSize, COLOR_CELL_ABYSS, ctx);
                drawCellLayer(cell.collision, pos, finalCellSize, COLOR_CELL_BUMP, ctx);
            }
            drawCellLayer(isMoveObject, pos, finalCellSize, COLOR_CELL_MOVE, ctx);
        }

        function drawBlock(block, ctx, start) {       
            var finalBlockSize = Math.ceil(BLOCK_SIZE * zoom);
            var pos = worldToView(block);

            ctx.strokeStyle = COLOR_BLOCK_DEFAULT;
            if (start) {
                ctx.strokeStyle = COLOR_BLOCK_HOME;
            }
            
            ctx.strokeRect(pos.x, pos.y, Math.round(finalBlockSize * scale.x), Math.round(finalBlockSize * scale.y));
        }

        function drawIcon(name, coordinates, ctx) {
            var position = worldToView(coordinates);
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = "#333";
            
            if (!imageCache[name]) {
                var data = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
                    document.querySelector('#' + name).innerHTML +
                '</svg>';        
                var img = new Image();
                img.onload = function() {
                    imageCache[name] = img;
                    ctx.drawImage(img, position.x - ICON_SIZE / 2, position.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
                };
                img.src = 'data:image/svg+xml;base64,'+window.btoa(data);
            }
            else {
                ctx.drawImage(imageCache[name], position.x - ICON_SIZE / 2, position.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);            
            }
        }
        
        function drawRoute(path, ctx) {
            var p1 = { x: 0, y: 0 };
            
            ctx.lineWidth = "2";
            switch(path.state) {
                case 'HOMING':
                    ctx.strokeStyle = COLOR_PATH_HOMING;
                    break;
                case 'TRAPPED':
                    ctx.strokeStyle = COLOR_PATH_TRAPPED;
                    break;
                case 'TRAPPED_END':
                case 'TRAPPED_HOMING':
                    ctx.strokeStyle = COLOR_PATH_TRAPPED_HOMING;
                    break;
                case 'CARPET':
                    ctx.strokeStyle = COLOR_PATH_CARPET;
                    break;
                default:
                    ctx.strokeStyle = COLOR_PATH_DEFAULT;
            }
                        
            ctx.beginPath();
            for (var i = 0; i < path.waypoints.length; i++) {
                var waypoint = path.waypoints[i];
                var p2 = worldToView(waypoint);
                               
                if (i > 0) {
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
                
                p1 = p2;
            };
            ctx.stroke();        
        }

        function drawTriangle(coordinates, color, ctx) {
            var position = worldToView(coordinates);
            var POINTER = 5;
            ctx.save(); 
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = "#333";
            ctx.translate(position.x, position.y); 
            ctx.rotate(position.r);
            ctx.beginPath();
            ctx.moveTo(0, -POINTER);
            ctx.lineTo(POINTER * .9, POINTER);
            ctx.lineTo(-POINTER * .9, POINTER);
            ctx.lineTo(0, -POINTER);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
        }

        function drawEvent(event, ctx) {
            switch(event.state) {
                case 'START':
                    drawTriangle(event.position, COLOR_EVENT_START, ctx);
                    break;
                case 'TRAPPED_END':
                case 'END':
                    drawTriangle(event.position, COLOR_EVENT_HOME, ctx);
                    break;
                default:
                    switch(event.type) {
                        case 'Bumping':
                            drawTriangle(event.position, COLOR_EVENT_BUMP, ctx);
                            break;
                        case 'TrapStateStarts':
                            drawTriangle(event.position, COLOR_EVENT_TRAP_START, ctx);
                            break;
                        case 'TrapStateEnds':
                            drawTriangle(event.position, COLOR_EVENT_TRAP_END, ctx);
                            break;
                    }
            }            
        }
        
        function worldToView(positionable) {
            return {
                x: Math.round(positionable.x * zoom * scale.x + offset.x),
                y: Math.round(positionable.y * zoom * scale.y + offset.y),
                r: positionable.r ? positionable.r * Math.PI / 180 : 0
            };
        }

        this.getZoom = function() {
            return zoom;
        };

        this.render = function(canvas, userScale, userOffset) {
            canvas.width = canvas.parentNode.offsetWidth;
            canvas.height = Math.min(canvas.width, document.body.offsetHeight - 200);

            scale = userScale;
            var xFactor = canvas.width / mapData.size.width;
            var yFactor = canvas.height / mapData.size.height;
            zoom = Math.min(xFactor, yFactor);

            offset.x = -mapData.offsets.xMin * zoom * scale.x + ((canvas.width - mapData.size.width * zoom * scale.x) / 2) + userOffset.x * zoom * Math.abs(scale.x);
            offset.y = -mapData.offsets.yMin * zoom * scale.y + ((canvas.height - mapData.size.height * zoom * scale.y) / 2) + userOffset.y * zoom * Math.abs(scale.y);

            if (canvas.getContext){
                var ctx = canvas.getContext('2d');
                
                ctx.scale(1, 1);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                for (var i = 0; i < mapData.blocks.length; i++) {
                    var block = mapData.blocks[i];
                    for (var j = 0; j < block.cells.length; j++) {
                        var cell = block.cells[j];
                        drawCell(block, cell, ctx);
                    };
                    drawBlock(block, ctx, i === 0);
                };
                
                if (!!logData) {
                    for (var i = 0; i < logData.routes.length; i++) {
                        drawRoute(logData.routes[i], ctx);
                    };
                                       
                    for (var i = 0; i < logData.events.length; i++) {
                        drawEvent(logData.events[i], ctx);
                    };
                    
                    if (logData.events.length > 0 && logData.events[0].state === 'START') {
                        drawIcon('map_home', { x: 0, y: 0 }, ctx);
                    }
                }
            }
        };
    };
});
