define("sites/overview/joystick", [], function() {
    return function(container, stick, callbacks) {
        var active = false;
        var interval = 0;
        var currentCallback = null;
        
        var reference = {
            x: 0,
            y: -1
        }
        
        function execCallback(callback, repeat) {
            if (!!callback) {
                if (repeat) {
                    if (currentCallback !== callback) {
                        currentCallback = callback;
                        currentCallback();
                    }
                    if (!interval) {
                        interval = window.setInterval(function() {
                            if (active) {
                                currentCallback();
                            }
                        }, 800);
                    }
                } else {
                    if (!!interval) {
                        window.clearInterval(interval);
                        interval = 0;
                    }
                    if (currentCallback !== callback) {
                        currentCallback = callback;
                        currentCallback();
                    }
                }
            }
        }
        
        this.startListening = function() {
            container.onmousedown = function(event) {
                active = true;
                event.preventDefault();
            };

            container.onmousemove = function(event) {
                if (active) {
                    var pos = {
                        x: event.pageX - event.currentTarget.offsetLeft,
                        y: event.pageY - event.currentTarget.offsetTop
                    }
                    
                    var size = {
                        x: container.offsetWidth,
                        y: container.offsetHeight
                    }
                    
                    var center = {
                        x: size.x / 2,
                        y: size.y / 2
                    }
                    
                    var vector = {
                        x: pos.x - center.x,
                        y: pos.y - center.y
                    }
                                       
                    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

                    if (length > center.x - stick.offsetWidth / 2) {
                        vector.x *= ((center.x - stick.offsetWidth / 2) / length);
                        vector.y *= ((center.x - stick.offsetWidth / 2) / length);
                    }
                    
                    stick.style.left = vector.x + center.x + 'px';
                    stick.style.top = vector.y + center.y + 'px';
                    
                    if (length < size.x / 4) {
                        execCallback(callbacks.release, false);
                    } 
                    else {
                        var angle = Math.acos((vector.x * reference.x + vector.y * reference.y) / (length * 1))  * (180 / Math.PI);
                        // TOP
                        if (angle < 45) {
                            execCallback(callbacks.forward, true);
                        }
                        // BOTTOM
                        else if (angle > 135) {
                            execCallback(callbacks.backward, true);
                        }
                        // LEFT
                        else if (vector.x < 0) {
                            execCallback(callbacks.left, true);
                        } 
                        // RIGHT
                        else if (vector.x > 0) {
                            execCallback(callbacks.right, true);
                        }
                    }                   
                    event.preventDefault();
                }
            };
            
            container.onmouseup = function(event) {
                active = false;
                stick.removeAttribute("style");
                execCallback(callbacks.release, false);
                event.preventDefault();
            };
        };
        
        this.stopListening = function() {
            container.onmousedown = null;
            container.onmousemove = null;
            container.onmouseup = null;
            active = false;
            execCallback(callbacks.release);
        };
    };
});