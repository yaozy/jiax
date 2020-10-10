const querystring = require('querystring');

const byteLengthUtf8 = process.binding('buffer').byteLengthUtf8;

const session = require('./session');




module.exports = class {



    constructor(app, request, response) {

        let url = request.url;
        let any = url.indexOf('?');

        this.app = app;
        this.request = request;
        this.response = response;

        this.headers = {
            'Content-Type': 'application/json charset=utf-8',
            'Cache-Control': 'no-cache' 
        };

        this.body = null;

        if (any > 0)
        {
            this.search = url.substring(any + 1);
            url = url.substring(0, any);
        }

        // 路由路径参数
        this.paths = any = url.split('/');
    
        if (!any[0])
        {
            any.shift();
        }
    }



    // 获取自定义Content-Type类型
    get type() {

        return this.headers['Content-Type'];
    }


    // 设置自定义Content-Type类型
    set type(value) {

        switch (value)
        {
            case 'text':
                value = 'text/plain charset=utf-8';
                break;

            case 'html':
                value = 'text/html charset=utf-8';
                break;

            case 'json':
                value = 'application/json charset=utf-8';
                break;

            case 'xml':
                value = 'text/xml charset=utf-8';
                break;

            case 'bin':
                value = 'application/octet-stream';
                break;
        }

        this.headers['Content-Type'] = value;
    }



    // 获取请求最后修改时间
    get lastModified() {

        return this.request.headers['if-modified-since'];
    }


    // 设置响应最后修改时间
    set lastModified(value) {

        if (typeof value !== 'string')
        {
            value = value.toGMTString();
        }

        this.headers['Last-Modified'] = value;
    }


    // 获取请求实体标记
    get ETag() {

        return this.request.headers['if-none-match'];
    }


    // 设置响应实体标记
    set ETag(value) {

        this.headers.ETag = value;
    }



    // url查询参数
    get query() {

        let value = this.__query;

        if (!value)
        {
            value = this.search;
            value = this.__query = value ? querystring.parse(value) : {};
        }

        return value;
    }

    
    // 获取客户端请求的cookies集合
    get cookies() {

        let cookies = this.__cookies;
        
        if (cookies)
        {
            return cookies;
        }

        let text = this.request.headers.cookie;

        cookies = {};

        if (text)
        {
            let list = text.match(/\=|[^=;\s]+/g);
            let decode = text.indexOf('%') >= 0 && decodeURIComponent;

            for (let i = list.length - 1; i >= 0; i--)
            {
                let value = list[i--];

                if (list[i--] !== '=')
                {
                    continue;
                }
                
                // 第一个值为"时去除引号
                if (value[0] === '"')
                {
                    value = value.slice(1, -1);
                }
            
                // 注:有同名时第一个值生效
                cookies[list[i]] = decode && value.indexOf('%') >= 0 ? decode(value) : value;
            }
        }

        return this.__cookies = cookies;
    }


    // 设置向客户端发送的cookie
    setCookie(name, value, { path, domain, expires, secure, httpOnly } = {}) {

        if (name)
        {
            let cookies = this.__set_cookes || (this.__set_cookes = []);
            let encode = encodeURIComponent;

            value = [name, '=', value ? encode(value) : value];

            if (path)
            {
                value.push('; Path=', encode(path));
            }

            if (domain)
            {
                value.push('; Domain=', encode(domain));
            }

            if (expires)
            {
                value.push('; Expires=', expires.toGMTString());
            }

            if (secure)
            {
                value.push('; Secure');
            }

            if (httpOnly)
            {
                value.push('; HttpOnly');
            }

            cookies.push(value.join(''));

            this.response.setHeader('Set-Cookie', cookies);
        }
    }

    
    // 创建session
    async createSession(data) {

        return await session.create(this, data);
    }



    /**
     * 直接发送状态码
     * 204 无内容
     * 304 无变化
     * 404 找不到对应资源
     * 405 不支持的method
     * 500 服务程序错误
     */
    send(statusCode, message) {

        let response = this.response;

        response.statusCode = statusCode;

        if (message)
        {
            response.statusMessage = message;
        }

        response.end();
    }



    // 处理完毕
    done() {

        let response = this.response;
        let headers = this.headers;
        let body = this.body;

        if (!(body instanceof Buffer) && typeof body !== 'string')
        {
            body = JSON.stringify(body);
        }

        response.setHeader('Content-Length', body instanceof Buffer ? body.length : (body ? byteLengthUtf8(body) : 0));

        for (let name in headers)
        {
            response.setHeader(name, headers[name]);
        }

        response.end(body);
    }



    // 异步接收浏览器提交的数据
    async acceptData() {

        return new Promise((resolve, reject) => {

            let request = this.request;
            let data = [];

            request.on('data', chunk => {

                data.push(chunk);
            });
 
            request.on('end', () => {

                resolve(Buffer.concat(data).toString('utf8'));
            });

            request.on('error', e => {

                reject(e);
            });

        });
    }



}
