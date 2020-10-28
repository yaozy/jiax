const http = require('http');
const urlparse = require('url').parse;

const Stream = require('./stream');



// 全局请求拦截
const beforeHandlers = [];

// 全局响应拦截
const afterHandlers = [];



// 默认超时时间
exports.timeout = 10000;


// 注册或注销全局请求拦截
exports.before = function (handler, remove) {

    if (typeof handler !== 'function')
    {
        throw 'http request must be a function!';
    }

    if (remove)
    {
        for (let i = beforeHandlers.length; i--;)
        {
            if (beforeHandlers[i] === handler)
            {
                beforeHandlers.splice(i, 1);
            }
        }
    }
    else
    {
        beforeHandlers.push(handler);
    }
}


// 注册或注销全局响应拦截
exports.after = function (handler, remove) {

    if (typeof handler !== 'function')
    {
        throw 'http response must be a function!';
    }

    if (remove)
    {
        for (let i = afterHandlers.length; i--;)
        {
            if (afterHandlers[i] === handler)
            {
                afterHandlers.splice(i, 1);
            }
        }
    }
    else
    {
        afterHandlers.push(handler);
    }
}



function parseAfterHandlers(value) {

    let list = afterHandlers;

    for (let i = 0, l = list.length; i < l; i++)
    {
        value = list[i](value);
    }

    return value;
}



function ajax_mock(stream, options) {

    setTimeout(function () {

        try
        {
            let response = require('../../mock/' + options.url);

            if (typeof response === 'function')
            {
                stream.resolve(response(options.data, options));
            }
            else
            {
                stream.resolve(response);
            }
        }
        catch (err)
        {
            console.error(err);
            stream.reject(options.url + '\n' + err);
        }

    }, 500);
}


function encodeData(data) {

    if (data)
    {
        let list = [];
        let encode = encodeURIComponent;
        let value, any;
    
        for (let name in data)
        {
            value = data[name];
            name = encode(name);
    
            if (value === null)
            {
                list.push(name, '=null', '&');
                continue;
            }
    
            switch (typeof value)
            {
                case 'undefined':
                    list.push(name, '=&');
                    break;
    
                case 'boolean':
                case 'number':
                    list.push(name, '=', value, '&');
                    break;
    
                case 'string':
                case 'function':
                    list.push(name, '=', encode(value), '&');
                    break;
    
                default:
                    if (value instanceof Array)
                    {
                        for (var i = 0, l = value.length; i < l; i++)
                        {
                            if ((any = value[i]) === void 0)
                            {
                                list.push(name, '=&');
                            }
                            else
                            {
                                list.push(name, '=', encode(any), '&'); //数组不支持嵌套
                            }
                        }
                    }
                    else
                    {
                        list.push(name, '=', encodeData(value), '&');
                    }
                    break;
            }
        }
    
        list.pop();
    
        return list.join('');
    }

    return '';
}


function send(method, url, data, options, flag) {

    let stream, list;

    if (data)
    {
        if (flag || /GET|HEAD|OPTIONS/i.test(method))
        {
            url = url + (url.indexOf('?') >= 0 ? '&' : '?') + encodeData(data);
            data = null;
        }
        else if (options.contentType === 'application/x-www-form-urlencoded')
        {
            data = encodeData(data);
        }
        else if (typeof data !== 'string')
        {
            if (!options.contentType)
            {
                options.contentType = 'application/json';
            }
            
            data = JSON.stringify(data);
        }
    }

    options.method = method;
    options.url = url;
    options.data = data;
    options.timeout = options.timeout || exports.timeout;

    if ((list = beforeHandlers).length > 0)
    {
        for (var i = 0, l = list.length; i < l; i++)
        {
            list[i](options);
        }
    }

    stream = new Stream();

    if (afterHandlers.length > 0)
    {
        stream.map(parseAfterHandlers);
    }

    if (exports.mock)
    {
        ajax_mock(stream, options);
    }
    else
    {
        let uri = urlparse(options.url, true);

        options.host = uri.hostname,
        options.port = uri.port || (uri.protocol === 'http:' ? 80 : 443);
        options.path = uri.path;

        let request = http.request(options, response => {

            if (response.statusCode < 300)
            {
                let data = [];
                let type = response.headers['content-type'];
    
                if (type && type.indexOf('UTF-8') >= 0)
                {
                    response.setEncoding('utf8');
                }
    
                response.on('data', chunk => {
                    
                    data.push(chunk);    
                });
    
                response.on('end', () => {
    
                    stream.resolve(data.join(''));
                });
            }
            else
            {
                stream.reject({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    options: options
                });
            }
        });

        request.on('error', err => {

            stream.reject(err);
        });

        if (data = options.data)
        {
            if (typeof data !== 'string')
            {
                data = JSON.stringify(data);
            }

            request.write(data);
        }

        request.end();
    }

    return stream;
}



exports.send = function (method, url, data, options) {

    return send(method ? method.toUpperCase() : 'GET', url, data, options || {}); 
}



exports.options = function (url, data, options) {

    return send('OPTIONS', url, data, options || {}, true);
}


exports.head = function (url, data, options) {

    return send('HEAD', url, data, options || {}, true);
}


exports.get = function (url, data, options) {

    return send('GET', url, data, options || {}, true);
}


exports.post = function (url, data, options) {

    return send('POST', url, data, options || {});
}


exports.put = function (url, data, options) {

    return send('PUT', url, data, options || {});
}


exports.delete = function (url, data, options) {

    return send('DELETE', url, data, options || {});
}


exports.trace = function (url, data, options) {

    return send('TRACE', url, data, options || {});
}


exports.connect = function (url, data, options) {

    return send('CONNECT', url, data, options || {});
}


