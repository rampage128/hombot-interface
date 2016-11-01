define("sites/maps/mapreader", [], function() {
    var MAX_INT = Math.pow(2, 31) - 1;
    var MIN_INT = Math.pow(-2, 31);
    
    var BYTE_LENGTH_HEADER = 44;
    var BYTE_LENGTH_BLOCK  = 16;
    var BLOCK_CELL_COUNT  = 100;
    
    var FLOOR_TYPES = [
        'INACCESSIBLE',
        'WALL',
        'CARPET',
        'NORMAL'
    ];

    return function(blob) {
        var pointer = 0;
        var mapdata = {};

        function readByte() {
            var byte = blob.charCodeAt(pointer);
            pointer++;
            return byte;
        }

        function readInt() {
            var int = ( 
                blob.charCodeAt(pointer + 3) << 24 | 
                blob.charCodeAt(pointer + 2) << 16 | 
                blob.charCodeAt(pointer + 1) << 8 | 
                blob.charCodeAt(pointer)
            );
            pointer += 4;
            return int;
        }

        function readMap(blob) {
            mapdata.header = {
                mapCount: readInt(),
                ceilMin: readInt(),
                ceilMax: readInt(),
                climbMax: readInt(),
                unknown: readInt(),
                cellBytes: readInt(),
                blockMax: readInt(),
                flagMax: readInt(),
                usedBlocks: readInt(),
                cellDim: readInt(),
                cellCount: readInt()
            };
            mapdata.blocks = [];
            mapdata.offsets = {
                xMin: MAX_INT,
                yMin: MAX_INT,
                xMax: MIN_INT,
                yMax: MIN_INT,
                floorXMin: MAX_INT,
                floorYMin: MAX_INT,
                floorXMax: MIN_INT,
                floorYMax: MIN_INT
            };

            for (var i = 0; i < mapdata.header.usedBlocks; i++) {
                var turn = readInt();
                var move = readInt();
                var x = readInt();
                var y = x;
                if (x !== -1) {
                    x = Math.floor(x % 100);
                    y = Math.floor(y / 100);
                }
                var distance = readInt();

                mapdata.blocks.push({
                    turn: turn,
                    move: move,
                    x: x * 100,
                    y: y * 100,
                    distance: distance,
                    cells: []
                });
            }

            pointer = BYTE_LENGTH_HEADER + mapdata.header.blockMax * BYTE_LENGTH_BLOCK;

            for (var i = 0; i < mapdata.blocks.length; i++) {
                var block = mapdata.blocks[i];

                mapdata.offsets.xMin = Math.min(mapdata.offsets.xMin, block.x);
                mapdata.offsets.xMax = Math.max(mapdata.offsets.xMax, block.x);
                mapdata.offsets.yMin = Math.min(mapdata.offsets.yMin, block.y);
                mapdata.offsets.yMax = Math.max(mapdata.offsets.yMax, block.y);

                for (var j = 0; j < BLOCK_CELL_COUNT; j++) {
                    var cellFlags = readByte();

                    var y = Math.floor(j / 10);
                    var x = Math.floor(j - (y * 10));

                    var cell = {
                        x: x * 10,
                        y: y * 10,
                        collision: (cellFlags & (1 << 7)) !== 0,
                        infrared: (cellFlags & (1 << 6)) !== 0,
                        abyss: (cellFlags & (1 << 5)) !== 0,
                        ultrasonic: (cellFlags & (1 << 4)) !== 0,
                        sneaking: (cellFlags & (1 << 3)) !== 0,
                        screwing: (cellFlags & (1 << 2)) !== 0,
                        floor: FLOOR_TYPES[((cellFlags & (1 << 1)) !== 0 ? 2 : 0) + ((cellFlags & (1 >> 0)) !== 0 ? 1 : 0)]
                    };
                    block.cells.push(cell);

                    if (cell.floor === 'NORMAL') {
                        mapdata.offsets.floorXMin = Math.min(mapdata.offsets.floorXMin, block.x + cell.x);
                        mapdata.offsets.floorYMin = Math.min(mapdata.offsets.floorYMin, block.y + cell.y);
                        mapdata.offsets.floorXMax = Math.max(mapdata.offsets.floorXMax, block.x + cell.x);
                        mapdata.offsets.floorYMax = Math.max(mapdata.offsets.floorYMax, block.y + cell.y);
                    }
                }
            }
        }

        this.getMapData = function() {
            return mapdata;
        };

        readMap(blob);
    };
});
