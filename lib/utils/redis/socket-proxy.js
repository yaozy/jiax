const net = require('net');



module.exports = class SocketProxy {


    
    constructor(client) {

        let parser = client.parser;

        this.client = client;
        this.options = client.options;
        this.timeout = this.options.timeout;
        this.delay = 10;

        this.ondata = parser.execute.bind(parser);

        // 解析出错
        parser.onerror = err => {

            // 清除socket
            client.socket = null;

            // 触发客户端解析错误事件
            client.onparseerror(err);

            // 重新初始化连接
            this.connect();
        }
    }


    connect(resolve, reject) {
 
        let options = this.options;
        let socket = new net.Socket();

        this.reject = reject;

        socket.on('connect', this.onconnected.bind(this));
        socket.on('data', this.ondata);
        socket.on('error', this.onerror.bind(this));

        socket.connect(options.port, options.host, resolve);

        return resolve ? this.socket = socket : socket;
    }


    onconnected() {

        let client = this.client;

        this.delay = 10;
        this.reject = null;

        // 初始化socket
        client.socket = this.socket;

        // 初始化命令队列
        client.queue.init();

        // 触发客户端连接事件
        client.onconnected();
    }


    // 重新连接socket
    onerror(err) {

        let client = this.client;

        // 失败回调
        if (this.reject)
        {
            this.reject(err);
            this.reject = null;
        }

        // 清空缓存
        client.parser.clear();

        // 清除socket
        client.socket = null;

        // 如果超过了等待时间则报错
        if (delay >= this.timeout)
        {
            client.queue.fail(err);
        }

        // 触发客户端错误事件
        client.onerror(err);

        // 重试
        this.retry();
    }


    retry() {

        // 最多10秒重试一次
        setTimeout(() => {

            // 等待时间逐渐加倍
            this.delay <<= 1;

            // 重新初始化socket
            this.socket = this.connect();

        }, this.delay > 10000 ? 10000 : this.delay);
    }

}
