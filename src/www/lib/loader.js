define('loader', function () {

    function parseXml(source) {
        if (typeof window.DOMParser !== 'undefined') {
            return ( new window.DOMParser() ).parseFromString(source, 'text/xml');
        } else if (typeof window.ActiveXObject !== 'undefined' &&
               new window.ActiveXObject('Microsoft.XMLDOM')) {
            var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = 'false';
            xmlDoc.loadXML(source);
            return xmlDoc;
        }
        
        throw new Error('No XML parser found');
    }
    
    return {
        load: function(props) {
            var xhr;
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
            
            xhr.onreadystatechange = function(){
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (!!props.success) {
                            if (!props.type || props.type === 'plain') {
                                props.success(xhr.responseText);
                            } else if (props.type === 'binary' || props.type === 'arraybuffer') {
                                props.success(xhr.response);
                            } else if (props.type === 'json') {
                                try {
                                    var json = JSON.parse(xhr.responseText.replace(/(?:\r\n|\r|\n)/g, ''));
                                    props.success(json);
                                } catch(e) {
                                    if (!!props.error) {
                                        props.error(e);
                                    }
                                }
                            } else if (props.type === 'xml') {
                                try {
                                    var xml = parseXml(xhr.responseText);
                                    props.success(xml);
                                } catch(e) {
                                    if (!!props.error) {
                                        props.error(e);
                                    }
                                }
                            }
                        }
                    } else {
                        if (!!props.error) {
                            props.error(xhr.status);
                        }
                    }
                    if (!!props.always) {
                        props.always(xhr.status);
                    }
                }
            };
            xhr.open(!props.method ? 'GET' : props.method, props.href, true);
            xhr.timeout = 8000;

            if (props.type === 'binary') {
                // open as blob!
                xhr.responseType = 'blob';
                // hack to pass bytes through unprocessed.
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
            } else if (props.type === 'arraybuffer') {
                xhr.responseType = 'arraybuffer';
            }

            xhr.send(props.method === 'POST' ? props.data : null);
        }
    };
});
        
        