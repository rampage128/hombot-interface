define("sites/maps/logreader", [], function() {
    var MAX_INT = Math.pow(2, 31) - 1;
    
    return function(log) {     
        var logdata = {};

        function checkEventState(events, types) {
            if (!events || events.length === 0) {
                return false;
            }
            
            if (!Array.isArray(types)) {
                types = [types];
            }
            
            return events.some(function(event) {
               return types.some(function(type) {
                   return event.state === type;
               });
            });
        }
        
        function checkEventInfo(events, types) {
            if (!events || events.length === 0) {
                return false;
            }
            
            if (!Array.isArray(types)) {
                types = [types];
            }
            
            return events.some(function(event) {
                return types.some(function(type) {
                    return event.info.indexOf(type) > -1;
                });
            });
        }

        function readEvent(line, previousEvents) {
            var values = line.split(",");

            if (values.length < 2) {
                return null;
            }
             
            var rawTime = values[0];
            var timeString =    rawTime.substring(0, 4) + '/' +
                                rawTime.substring(4, 6) + '/' +
                                rawTime.substring(6, 8) + ' ' +
                                rawTime.substring(08, 10) + ':' +
                                rawTime.substring(10, 12) + ':' +
                                rawTime.substring(12, 14);
            var entryType = values[1];
            var eventType = values[2];
            var info = values[3].trim();

            if (!!previousEvents && previousEvents.length > 0) {
                var previousEvent = previousEvents[0];
                var slice = 1;
                if (previousEvent.entry === 'STRN') {
                    slice = 0;
                    previousEvent = null;
                }
                if (previousEvents.length > slice) {
                    var pathEvents = previousEvents.slice(slice);
                }
            }

            if (entryType.indexOf('POS') === 0) {            
                var position = {
                    x: values[3].trim(),
                    y: values[4].trim(),
                    r: parseInt(values[5].trim() / 100) + 90
                };
                info = values[6].trim();

                var state = 'CLEAN';
                if (eventType === 'EventPose' && info.indexOf('Floor')) {
                    state = 'FLOOR_CARPET';
                }
                if (eventType === 'EventPose' && info.indexOf('Carpet')) {
                    state = 'FLOOR_HARD';
                }
                if (eventType === 'TrapStateStarts') {
                    state = 'TRAPPED';
                    if (info === 'Homing' && !checkEventState(previousEvents, 'HOMING')) {
                        state = 'TRAPPED_END';
                    }
                }
                if (checkEventState(previousEvents, 'TRAPPED')) {
                    state = 'TRAPPED';
                }
                if (checkEventState(previousEvents, ['TRAPPED_HOMING', 'TRAPPED_END'])) {
                    state = 'TRAPPED_HOMING';
                }
                if (eventType === 'TrapStateEnds') {
                    state = 'CLEAN';
                    if (info === 'Homing') {
                        state = 'HOMING';
                    }
                }
                if (previousEvents.length === 0) {
                    state = 'START';
                }

                if (state !== 'TRAPPED_END' && state !== 'TRAPPED_HOMING') {
                    if (checkEventInfo(pathEvents, 'End Cleaning')) {
                        state = 'END';
                    }
                    if (checkEventState(previousEvents, ['END', 'HOMING'])) {
                        state = 'HOMING';
                    }
                }
            }

            return {
                entry: entryType,
                type: eventType,
                time: Math.round(new Date(timeString).getTime()/1000),
                previousEvent: previousEvent,
                pathEvents: pathEvents,
                position: position,
                info: info,
                state: state
            };
        }

        function getRouteState(eventState) {
            switch(eventState) {
                case 'TRAPPED_END':
                case 'TRAPPED_HOMING':
                    return 'TRAPPED_HOMING';
                case 'END':
                    return 'HOMING';
                case 'FLOOR_CARPET':
                    return 'CARPET';
                case 'FLOOR_HARD':
                    return 'CLEAN';
                default:
                    return eventState;
            }
        }

        function readLog(log) {
            var logLines = log.split('\n');

            logdata.events = [];
            logdata.offsets = {
              xMin: MAX_INT,
              yMin: MAX_INT,
              xMax: -MAX_INT,
              yMax: -MAX_INT
            };

            logdata.routes = [];

            var previousEvents = [];
            var currentRoute = null;
            var numBumps = 0;
            var distance = 0;
            for (var i = 1; i < logLines.length; i++) {
                var line = logLines[i];
                var event = readEvent(line, previousEvents);
                if (event !== null) {
                    if (!!event.entry && event.entry.indexOf('POS') === 0) {
                        previousEvents = [];
                        logdata.events.push(event);
                        logdata.offsets.xMin = Math.min(logdata.offsets.xMin, event.position.x);
                        logdata.offsets.xMax = Math.max(logdata.offsets.xMax, event.position.x);
                        logdata.offsets.yMin = Math.min(logdata.offsets.yMin, event.position.y);
                        logdata.offsets.yMax = Math.max(logdata.offsets.yMax, event.position.y);

                        var p1 = { x: 0, y: 0 };
                        if (event.previousEvent !== null && event.previousEvent.entry.indexOf('POS') === 0) {
                            p1 = event.previousEvent.position;
                        }
                        var p2 = event.position;
                        distance += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

                        if (!!currentRoute) {
                            currentRoute.waypoints.push(event.position);
                        }
                        if (!currentRoute || currentRoute.waypoints.length === 0 || event.state !== currentRoute.state) {
                            currentRoute = {
                                state: getRouteState(event.state),
                                waypoints: [
                                    event.position
                                ]
                            };
                            logdata.routes.push(currentRoute);
                        }
                        if (event.type === 'Bumping') {
                            numBumps++;
                        }
                    }
                    previousEvents.push(event);
                }
            }

            var startTime = logdata.events.length > 0 ? logdata.events[0].time : null;
            var endTime = logdata.events.length > 0 ? logdata.events[logdata.events.length-1].time : null;

            logdata.header = {
                numEvents: logLines.length,
                startTime: startTime,
                endTime: endTime,
                numBumps: numBumps,
                status: 'UNKNOWN',
                duration: endTime - startTime,
                travelDistance: distance / 1000
            };
        }

        this.getLogData = function() {
            return logdata;
        };

        readLog(log);
    };
});