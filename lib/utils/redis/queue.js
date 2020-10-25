
/**
 * 指令队列
 * @param {*} pipeline 
 */
module.exports = function (client, pipeline) {


    // 未发送的命令集合
    const unsendCommands = [];

    // 未发送的命令回调集合
    const unsendCallbacks = [];


    // 已发送的命令集合
    let sendedCommands = null;

    // 已发送的命令回调集合
    let sendedCallbacks = null;



    function init() {

        let socket;

        if (socket = client.socket)
        {
            if (sendedCommands)
            {
                socket.write(sendedCommands.join(''), 'utf8');
            }
            else
            {
                next(socket);
            }
        }
    }



    function push(text) {

        return new Promise((resolve, reject) => {

            let socket = client.socket;

            // 没有已发送且未返回的命令则直接发送
            if (socket && !sendedCommands)
            {
                // 记录已发送
                sendedCommands = [text];
                sendedCallbacks = [[resolve, reject]];

                socket.write(text, 'utf8');
            }
            else  // 添加进缓冲区
            {
                unsendCommands.push(text);
                unsendCallbacks.push([resolve, reject]);
            }
        });
    }


    function next(socket) {

        let commands = unsendCommands;

        if (commands.length > 0)
        {
            sendedCommands = commands.splice(0, pipeline);
            sendedCallbacks = unsendCallbacks.splice(0, pipeline);

            socket.write(sendedCommands.join(''), 'utf8');
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
        let socket;

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

            if (socket = client.socket)
            {
                next(socket);
            }
        }
    }



    return {
        init: init,
        push: push,
        done: done,
        fail: fail
    }


}

