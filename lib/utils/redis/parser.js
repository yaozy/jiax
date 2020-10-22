/*
    * Redis通过检查服务器发回数据的第一个字节， 可以确定这个回复是什么类型：
    * 
    * 参考: http://doc.redisfans.com/topic/protocol.html
    *  
    * 状态回复(status reply)的第一个字节是 "+"
    * 错误回复(error reply)的第一个字节是 "-"
    * 整数回复(integer reply)的第一个字节是 ":"
    * 批量回复(bulk reply)的第一个字节是 "$"
    * 多条批量回复(multi bulk reply)的第一个字节是 "*"
*/


const A = Array;

const copyBuffer = process.binding('buffer').copy;



function combineBuffer(bufferArray) {

    let length = bufferArray.length;
    let size = 0;

    for (let i = length; i--;)
    {
        size += bufferArray[i].length;
    }

    let buffer = Buffer.allocUnsafe(size);
    let index = 0;

    for (let i = 0; i < length; i++)
    {
        copyBuffer(bufferArray[i], buffer, index);
        index += bufferArray[i].length;
    }

    return buffer;
}



// 读取到\r\n的位置(不包含\r\n的长度)
function readCRLF(buffer, start) {

    let length = buffer.length;

    while (start < length)
    {
        if (buffer[start] === 13 && buffer[start + 1] === 10)
        {
            return start;
        }

        start++;
    }

    return -1;
}


// 读取到\r的位置(不包含\r的长度)
function readCR(buffer, start) {

    let length = buffer.length;

    while (start < length)
    {
        if (buffer[start] === 13)
        {
            return start;
        }

        start++;
    }

    return -1;
}


// 读取到\n的位置(不包含\n的长度)
function readLF(buffer, start) {

    let length = buffer.length;

    while (start < length)
    {
        if (buffer[start] === 10)
        {
            return start;
        }

        start++;
    }

    return -1;
}




/**
 * 基础解析器
 */
class BaseTask {


    constructor() {

        // 缓存
        this.cacheBuffer = new A(1024);

        // 缓存使用长度
        this.cacheIndex = 0;

        // 是否只读了\r
        this.half = false;
    }


    resume(buffer, start) {

        let cache = this.cacheBuffer;
        let half = this.half;
        let index = (half ? readLF : readCRLF)(buffer, start);

        if (index >= 0)
        {
            cache[this.cacheIndex++] = buffer.slice(start, index);
            cache = combineBuffer(cache.slice(0, this.cacheIndex)).utf8Slice(0);

            return this.done(cache, half ? index + 1 : index + 2);
        }
        
        index = buffer.length;

        // 判断是否只读到\r
        if (this.half = buffer[index - 1] === 13)
        {
            index--;
        }
        
        cache[this.cacheIndex++] = buffer.slice(start, index);
    }


    execute(buffer, start) {

        let index = readCRLF(buffer, start);

        if (index > 0)
        {
            return this.done(buffer.utf8Slice(start, index), index + 2);
        }

        index = buffer.length;

        // 判断是否只读到\r
        if (this.half = buffer[index - 1] === 13)
        {
            index--;
        }

        this.cacheIndex = 1;
        this.cacheBuffer[0] = buffer.slice(start, index);
    }


    done(value, index) {

        return [1, value, index];
    }


}



/**
 * 错误解析器
 */
class ErrorTask extends BaseTask {


    done(value, index) {

        return [2, value, index];
    }


}



// 数字解析器
class NumberTask extends BaseTask {


    done(value, index) {

        return [1, +value, index];
    }


}



class StringTask {


    constructor() {

        // 需读取的字符串长度
        this.unread = -1;

        // 读取长度时是否只读了\r
        this.half = false;
        
        // 缓存长度
        this.lengthValue = '';

        // 缓存内容
        this.cacheBuffer = new A(128);

        // 缓存内容长度
        this.cacheIndex = 0;
    }



    // 读取文本长度
    readLen(buffer, start, index, cache) {

        let unread = +(cache + buffer.utf8Slice(start, index));

        // 检测是否读到\n
        if (this.half = buffer[++index] !== 10)
        {
            // 置空缓存
            this.cacheIndex = 0;

            // 标记未读数量
            this.unread = unread;
            
            return;
        }

        index++;

        if (unread > 0)
        {
            start = index;
            index = start + unread;
    
            // 内容及\r\n都读取到则直接返回
            if (buffer.length >= index + 2)
            {
                return [1, buffer.utf8Slice(start, index), index + 2];
            }
    
            // 缓存已经取到的部分文本内容
            cache = this.cacheBuffer[0] = buffer.slice(start, index);
    
            // 记录缓存内容长度
            this.cacheIndex = 1;
    
            // 记录还需要处理的字节数
            this.unread = unread - cache.length;
        }
        else
        {
            return [1, unread < 0 ? null : '', index];
        }
    }


    resume(buffer, start) {

        let unread = this.unread;

        // 已经取得长度
        if (unread >= 0)
        {
            let cache = this.cacheBuffer;

            // 补上未读的\n
            if (this.half)
            {
                start++;
                this.half = false;
            }

            // 继续往下读
            if (unread > 0)
            {
                // 继续往下读
                let index = start + unread;

                // 内容及\r\n都读取到则直接返回
                if (buffer.length >= index + 2)
                {
                    // 拼接缓存
                    cache[this.cacheIndex++] = buffer.slice(start, index);
                    cache = combineBuffer(cache.slice(0, this.cacheIndex)).utf8Slice(0);

                    return [1, cache, index + 2];
                }

                // 缓存已经取到的部分文本内容
                cache = cache[this.cacheIndex++] = buffer.slice(start, index);

                // 记录还需要处理的字节数
                this.unread = unread - cache.length;
            }
            else // 内容已读完, 只需要处理\r\n了
            {
                let length = buffer.length;

                // 往下一直读到\n
                while (start < length)
                {
                    if (buffer[start++] === 10)
                    {
                        cache = combineBuffer(cache.slice(0, this.cacheIndex)).utf8Slice(0);
                        return [1, cache, start];
                    }
                }
            }
        }
        else // 先获取长度
        {
            let index = readCR(buffer, start);
    
            if (index >= 0)
            {
                return this.readLen(buffer, start, index, this.lengthValue);
            }

            this.lengthValue += buffer.utf8Slice(start);
        }
    }


    execute(buffer, start) {

        let index = readCR(buffer, start);

        if (index >= 0)
        {
            return this.readLen(buffer, start, index, '');
        }

        this.lengthValue = buffer.utf8Slice(start);
        this.unread = -1;
    }


}



class ArrayTask {


    constructor(tasks) {

        this.tasks = tasks;
        this.task = null;

        // 还需读取的数组长度
        this.unread = -1;

        // 读取长度时是否只读了\r
        this.half = false;

        // 数组结果
        this.arrayList = null;

        // 缓存长度
        this.lengthValue = '';
    }



    // 读取文本长度
    readLen(buffer, start, index, cache) {

        let unread = +(cache + buffer.utf8Slice(start, index));

        // 检测是否读到\n
        if (this.half = buffer[++index] !== 10)
        {
            // 置空缓存
            this.cacheIndex = 0;

            // 标记未读数量
            this.unread = unread;
            
            return;
        }

        index++;

        if (unread > 0)
        {
            // 记录还需要读取的子项数
            this.unread = unread;
            this.arrayList = cache = new A(unread);

            return this.readArray(buffer, index, cache, unread);
        }

        return [1, unread < 0 ? null : [], index];
    }


    readArray(buffer, start, array, unread) {

        let length = buffer.length;
        let tasks = this.tasks;
        let task = this.task;
        let data;

        // 循环处理
        while (start < length)
        {
            // 有未完成的任务则继续处理
            if (task)
            {
                data = task.resume(buffer, start);
                this.task = null;
            }
            else if (task = tasks[buffer[start]]) // 否则根据第一个字符获取任务类型并执行
            {
                data = task.execute(buffer, start + 1);
            }
            else
            {
                throw 'not support type ' + String.fromCharCode(buffer[start]);
            }

            // 获取到正确结果
            if (data)
            {
                // 记录新的位置s
                start = data[2];

                task = null;

                array[array.length - unread] = data[1];

                // 减去未读
                this.unread = --unread;

                if (unread <= 0)
                {
                    return [1, array, start];
                }
            }
            else // 缓存任务等待处理
            {
                this.task = task;
                break;
            }
        }
    }


    resume(buffer, start) {

        let unread = this.unread;

        // 已经取得长度
        if (unread >= 0)
        {
            // 补上未读的\n
            if (this.half)
            {
                start++;
                this.half = false;
            }

            // 继续往下读
            if (unread > 0)
            {
                return this.readArray(buffer, start, this.arrayList, unread);
            }

            // 内容已读完, 只需要处理\r\n了
            let length = buffer.length;

            // 往下一直读到\n
            while (start < length)
            {
                if (buffer[start++] === 10)
                {
                    return [1, this.cacheBuffer, start + 1];
                }
            }
        }
        else // 先获取长度
        {
            let index = readCR(buffer, start);
    
            if (index >= 0)
            {
                return this.readLen(buffer, start, index, this.lengthValue);
            }

            this.lengthValue += buffer.utf8Slice(start);
        }
    }
    

    execute(buffer, start) {

        let index = readCR(buffer, start);

        if (index >= 0)
        {
            return this.readLen(buffer, start, index, '');
        }

        this.lengthValue = buffer.utf8Slice(start);
        this.arrayIndex = -1;
    }


}





module.exports = class Parser {



    constructor() {

        let tasks = this.__tasks = new A(58);

        // 挂起的任务
        this.__task = null;

        // + 单行消息
        tasks[43] = new BaseTask();

        // - 单行错误
        tasks[45] = new ErrorTask();

        // : 单行数字
        tasks[58] = new NumberTask();

        // $ 指定长度的字符串
        tasks[36] = new StringTask();

        // * 数组
        tasks[42] = new ArrayTask(tasks);
    }



    onreceive(socket) {

        let buffer;

        // 一次最多读100K的数据
        while (buffer = socket.read(102400))
        {
            this.parse(buffer, 0);
        }
    }


    parse(buffer, start) {

        try
        {
            let length = buffer.length;

            let tasks = this.__tasks;
            let task = this.__task;
            let data;

            // 循环处理
            while (start < length)
            {
                // 有未完成的任务则继续处理
                if (task)
                {
                    data = task.resume(buffer, start);
                    this.__task = null;
                }
                else if (task = tasks[buffer[start]]) // 否则根据第一个字符获取任务类型并执行
                {
                    data = task.execute(buffer, start + 1);
                }
                else
                {
                    throw 'not support type ' + String.fromCharCode(buffer[start]);
                }

                // 获取到正确结果
                if (data)
                {
                    // 记录新的位置s
                    start = data[2];

                    task = null;
                    
                    // 成功消息
                    if (data[0] === 1)
                    {
                        this.ondata(null, data[1]);
                    }
                    else // 错误消息
                    {
                        this.ondata(data[1]);
                    }
                }
                else // 缓存任务等待处理
                {
                    this.__task = task;
                    break;
                }
            }
        }
        catch (err)
        {
            this.__task = null;
            this.onerror(err);
        }
    }


    ondata(err, value) {

        if (err)
        {
            console.error(err);
        }
        else
        {
            console.log(value);
        }
    }


    onerror(err) {

        console.error(err);
    }


    clear() {

        this.__task = null;
    }


}
