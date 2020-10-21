// 直接绑定计算utf8字符串字节的原生方法
const utf8length = process.binding('buffer').byteLengthUtf8;
const net = require('net');
const { Query } = require('pg');


// 发送缓存
const cache = new Array(1024);



function initSocket() {

    let socket = this.__socket = new net.Socket();

    socket.on('connect', connect.bind(this));
    socket.on('data', receive.bind(this));
    socket.on('error', error.bind(this));
}


function connect() {

    let socket = this.__socket;
    let commands = this.__commands;

    this.__delay = 10;

    // 如果有未处理的指令则重新发送
    for (let i = buffer.index, l = buffer.last)

    console.log('Redis connected to ' + this.host + ':' + this.port);
}


function receive(data) {

    let buffer = this.__buffer;

    data = data.toString('utf8');

    if (buffer.last > 0)
    {

    }

}


// 重新连接socket
function error(err) {

    // 清空缓存
    let buffer = this.__buffer;

    buffer.index = 0;
    buffer.last = 0;

    console.error('fail to connect redis server');
    console.log(err);

    setTimeout(() => {

        let delay = this.__delay;

        if (delay < 10)
        {
            delay = 10;
        }
        else if (delay < 60000)
        {
            delay <<= 1;
        }

        this.__delay = delay;

        // 重新初始化socket
        initSocket.call(this);

    }, this.__delay || 10);
}




module.exports = class RedisClient {


    constructor(options) {

        let commands, buffer;
        
        this.host = options && options.host || '127.0.0.1';
        this.port = options && options.port || 6379;

        // 双向指令队列
        commands = this.__commands = new Array(102400);
        commands.first = commands.last = 0;

        // 初始化socket连接
        initSocket.call(this);

        // 响应缓冲
        buffer = this.__buffer = new ArrayBuffer(102400);
        buffer.index = buffer.last = 0;
    }


    /**
     * connect to redis server
     */
    connect() {

        return new Promise(resolve => {

            this.__socket.connect(this.port, this.host, () => {

                this.__delay = 10;
                resolve(this);
            });
        });
    }


    
    /**
     * execute redis command
     * @param {*} key 
     * @param {*} args 
     */
    command(key, ...args) {

        let fn = utf8length;
        let length = args.length;
        let command = cache;
        let index = 3;
        
        command[0] = '*' + (length + 1);
        command[1] = '$' + fn(key);
        command[2] = key;

        for (let i = 0; i < length; i++)
        {
            let value = args[i];

            // 注: 发送不了$-1\r\n格式的数据
            if (value == null)
            {
                throw 'value sent to redis can not be null!';
            }
            else
            {
                // 注: 发送命令不支持":"整数格式
                switch (typeof value)
                {
                    case 'boolean':
                        command[index++] = '$1';
                        command[index++] = value ? 1 : 0;
                        break;

                    case 'number':
                        value = '' + value; // 小数按字符串处理
                        command[index++] = '$' + fn(value);
                        command[index++] = value;
                        break;

                    case 'string':
                        command[index++] = '$' + (value ? fn(value) : 0);
                        command[index++] = value;
                        break;

                    default: // 序列化对象
                        value = JSON.stringify(value);
                        command[index++] = '$' + fn(value);
                        command[index++] = value;
                        break;
                }
            }
        }

        let promise = new Promise(() => {});

        command[index++] = '';
        command = command.slice(0, index).join('\r\n');
        
        this.__commands.push(promise, command);
        this.__socket.write(command, 'utf8');

        return promise;
    }


    /**
     * direct send redis format text
     * @param {*} text 
     */
    send(text) {

        let promise = new Promise(() => {});

        this.__commands.push(promise, text);
        this.__socket.write(text, 'utf8');

        return promise;
    }


}
