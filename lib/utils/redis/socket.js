const net = require('net');

const Parser = require('./parser');




module.exports = function (options) {



    // socket
    let socket;

    // 当前重试延时时间
    let delay = 10;


    // 指令解析器
    let parser = new Parser();


    // 一次性发送至服务的指令数量(默认为8)
    let pipeline = options.pipeline || 8;

    // 连接失败最大重试时间(默认为10秒)
    let retryTime = options.retryTime || 10000;


    // 未发送指令
    let commands1 = [
        0,                          // 未发送指令数量
        new Array(pipeline),        // 未发送指令文本
        new Array(pipeline),        // 未发送回调
    ]


    // 已发送指令
    let commands2 = [
        0,                          // 已发送指令数量
        new Array(pipeline),        // 已发送指令文本
        new Array(pipeline),        // 已发送回调
        0                           // 已经返回的指令数量
    ];
    


    // 初始化参数
    options.host || (options.host = '127.0.0.1');
    options.port || (options.port = 6379);



    // 解析器成功解析到数据
    parser.ondata = function (err, value) {

        let commands = commands2;
        let promise = commands[2][commands[3]++];

        if (err)
        {
            promise.reject(err);
        }
        else
        {
            promise.resolve(value);
        }

        // 如果已发送的指令都已返回
        if (commands[3] >= commands[0])
        {
            let unsends = commands1;

            // 重置已返回数量
            commands[3] = 0;

            // 如果有未发送的指令则交换未发送和已发送
            if (unsends[0].length > 0)
            {
                let a1 = commands[1];
                let a2 = commands[2];

                commands[0] = unsends[0];
                commands[1] = unsends[1];
                commands[2] = unsends[2];

                unsends[0] = 0;
                unsends[1] = a1;
                unsends[2] = a2;

                // 发送指令
                socket.write(commands.slice(0, length).join(''), 'utf8');
            }
            else // 没有未发送的指令了
            {
                // 重置已发送数量
                commands[0] = 0;
            }
        }
    }



    function initSocket() {
 
        this.host = options && options.host || '127.0.0.1';
        this.port = options && options.port || 6379;

        socket = new net.Socket();
        socket.on('connect', onconnected);
        socket.on('readable', parser.onreceive.bind(parse, socket));
        socket.on('error', onerror);
    }


    function onconnected() {

        let commands = commands1;
        let length = commands[1];

        delay = 10;
        console.log('Redis connected to ' + this.host + ':' + this.port);

        // 如果有未处理的指令则重新发送
        if (length > 0)
        {
            socket.write(commands.slice(0, length).join(''), 'utf8');
        }
    }



    // 重新连接socket
    function onerror(err) {

        // 清空缓存
        parser.clear();

        console.error('fail to connect redis server');
        console.log(err);

        setTimeout(() => {

            // 小于最大重试时间则加倍
            if (delay < retryTime)
            {
                delay <<= 1;

                if (delay > retryTime)
                {
                    delay = retryTime;
                }
            }

            // 重新初始化socket
            initSocket.call(this);

        }, delay);
    }



    function send(text) {

        let commands = commands1;
        let index = commands[0];

        // 如果已经超出缓冲区则直接返回false
        if (index >= pipeline)
        {
            return false;
        }

        let promise = new Promise(() => {});

        // 还有未处理完成的指令则添加进缓冲区
        if (index > 0 || commands2[0] > 0)
        {
            commands[0]++;
            commands[1][index] = text;
            commands[2][index] = promise;
        }
        else // 否则直接发送
        {
            commands = commands2;
            commands[0] = 1;
            commands[1] = text;
            commands[2] = promise;

            socket.write(text, 'utf8');
        }

        return promise;
    }


    function connect() {

        return new Promise(resolve => {

            socket.connect(options.port, options.host, () => {

                resolve(this);
            });
        });
    }



    return {
        connect: connect,
        send: send
    }


}
