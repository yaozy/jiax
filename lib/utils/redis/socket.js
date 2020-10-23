const net = require('net');

const Parser = require('./parser');




// 指令队列
function initCommandQueue(pipeline) {


    // 未发送的命令集合
    const unsendCommands = [];

    // 未发送的命令回调集合
    const unsendCallbacks = [];


    // 已发送的命令集合
    let sendedCommands = null;

    // 已发送的命令回调集合
    let sendedCallbacks = null;


    // 发送网络
    let client;



    function init(socket) {

        client = socket;

        if (sendedCommands)
        {
            client.write(sendedCommands.join(''), 'utf8');
        }
        else
        {
            next();
        }
    }



    function send(text) {

        return new Promise((resolve, reject) => {

            // 直接发送
            if (client && !sendedCommands)
            {
                // 记录已发送
                sendedCommands = [text];
                sendedCallbacks = [[resolve, reject]];

                client.write(text, 'utf8');
            }
            else  // 添加进缓冲区
            {
                unsendCommands.push(text);
                unsendCallbacks.push([resolve, reject]);
            }
        });
    }


    function next() {

        let commands = unsendCommands;

        if (commands.length > 0)
        {
            sendedCommands = commands.splice(0, pipeline);
            sendedCallbacks = unsendCallbacks.splice(0, pipeline);

            client.write(sendedCommands.join(''), 'utf8');
        }
    }


    function fail(err) {

        let callbacks;

        if (callbacks = sendedCallbacks)
        {
            for (let i = 0, l = callbacks.length; i < l; i++)
            {
                callbacks[i][1](err);
            }

            sendedCommands = sendedCallbacks = null;
        }

        if ((callbacks = unsendCallbacks).length > 0)
        {
            for (let i = 0, l = callbacks.length; i < l; i++)
            {
                callbacks[i][1](err);
            }

            callbacks.length = unsendCommands.length = 0;
        }
    }

    
    function done(err, value) {

        let promise = sendedCallbacks.shift();

        sendedCommands.shift();
    
        if (err)
        {
            promise[1](err);
        }
        else
        {
            promise[0](value);
        }
    
        // 已处理完毕则继续处理后面的指令
        if (sendedCommands.length <= 0)
        {
            sendedCommands = sendedCallbacks = null;
            next();
        }
    }



    return {
        init: init,
        send: send,
        done: done,
        fail: fail
    }


}




module.exports = function (options) {



    const host = options.host || '127.0.0.1';

    const port = options.port || 6379;


    // 初始化指令队列(一次性发送至服务的指令数量默认为8)
    const commandQueue = initCommandQueue(options.pipeline > 0 ? options.pipeline | 0 : 8);


    // 连接失败最大重试时间(默认为10秒)
    const retryTime = options.retryTime || 10000;


    // 指令解析器
    const parser = new Parser();

    

    // socket
    let socket;

    // 当前重试延时时间
    let delay = 10;




    function initSocket() {
 
        socket = new net.Socket();
        socket.on('connect', onconnected);
        socket.on('data', parser.parse.bind(parser));
        socket.on('error', onerror);
    }


    function onconnected() {

        delay = 10;
        console.log('Redis connected to ' + host + ':' + port);

        // 初始化命令队列
        commandQueue.init(socket);
    }


    // 重新连接socket
    function onerror(err) {

        // 清空缓存
        parser.clear();

        console.error('fail to connect redis server');
        console.log(err);

        // 如果超过了等待时间则报错
        if (delay >= retryTime)
        {
            commandQueue.fail(err);
        }

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
            initSocket();

        }, delay);
    }



    function connect() {

        return new Promise(resolve => {

            socket.connect(port, host, resolve);
        });
    }



    // 解析器成功解析到数据
    parser.ondata = commandQueue.done;


    // 出错关闭连接后重试
    parser.onerror = function (err) {

        parser.clear();
        console.error(err);

        socket.destroy();
        initSocket();
    }


    // 初始化socket
    initSocket();



    // 输出接口给RedisClient调用
    return {
        connect: connect,
        send: commandQueue.send
    }


}
