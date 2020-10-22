const A = Array;



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
        this.cacheList = new A(128);

        // 缓存使用长度
        this.cacheIndex = 0;

        // 是否只读了\r
        this.half = false;
    }


    resume(buffer, start) {

        let cache = this.cacheList;
        let index = (this.half ? readLF : readCRLF)(buffer, start);

        if (index >= 0)
        {
            cache[this.cacheIndex] = buffer.utf8slice(start, index);
            cache = cache.slice(0, this.cacheIndex).join('');

            return this.done(cache, index + 2);
        }
        
        index = buffer.length;

        // 判断是否只读到\r
        if (this.half = buffer[index - 1] === 13)
        {
            index--;
        }
        
        cache[this.cacheIndex++] = buffer.utf8slice(start, index);
    }


    execute(buffer, start) {

        let index = readCRLF(buffer, start);

        if (index > 0)
        {
            return this.done(buffer.utf8slice(start, index), index + 2);
        }

        index = buffer.length;

        // 判断是否只读到\r
        if (this.half = buffer[index - 1] === 13)
        {
            index--;
        }

        this.cacheIndex = 1;
        this.cacheList[0] = buffer.utf8slice(start, index);
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
        this.readLength = -1;

        // 缓存长度
        this.lengthValue = '';

        // 缓存内容
        this.cacheList = new A(128);

        // 缓存内容长度
        this.cacheIndex = 0;
    }



    // 读取文本长度
    readLength(buffer, start, index, before) {

        let readLength = +(before + buffer.utf8slice(start, index));
        let cache;

        if (readLength > 0)
        {
            start = index + 2;
            index = start + readLength;
    
            // 内容及\r\n都读取到则直接返回
            if (buffer.length >= index + 2)
            {
                return [1, buffer.utf8slice(start, index), index + 2];
            }
    
            // 缓存已经取到的部分文本内容
            cache = this.cacheList[0] = buffer.utf8slice(start, index);
    
            // 记录缓存内容长度
            this.cacheIndex = 1;
    
            // 记录还需要处理的字节数
            this.readLength = readLength - cache.length;
        }
        else
        {
            return [1, readLength < 0 ? null : '', index + 2];
        }
    }


    resume(buffer, start) {

        let readLength = this.readLength;

        // 已经取得长度
        if (readLength >= 0)
        {
            let cache = this.cacheList;

            // 继续往下读
            if (readLength > 0)
            {
                // 继续往下读
                let index = start + readLength;

                // 内容及\r\n都读取到则直接返回
                if (buffer.length >= index + 2)
                {
                    // 拼接缓存
                    cache[this.cacheIndex++] = buffer.utf8slice(start, index);
                    cache = cache.slice(0, this.cacheIndex).join('');

                    return [1, cache, index + 2];
                }

                // 缓存已经取到的部分文本内容
                cache = cache[this.cacheIndex++] = buffer.utf8slice(start, index);

                // 记录还需要处理的字节数
                this.readLength = readLength - cache.length;
            }
            else // 内容已读完, 只需要处理\r\n了
            {
                let length = buffer.length;

                // 往下一直读到\n
                while (start < length)
                {
                    if (buffer[start++] === 10)
                    {
                        return [1, cache.slice(0, this.cacheIndex).join(''), start + 1];
                    }
                }
            }
        }
        else // 先获取长度
        {
            let index = readCR(buffer, start);
    
            if (index >= 0)
            {
                return this.readLength(buffer, start, index, this.lengthValue);
            }

            this.lengthValue += buffer.utf8slice(start);
        }
    }


    execute(buffer, start) {

        let index = readCR(buffer, start);

        if (index >= 0)
        {
            return this.readLength(buffer, start, index, '');
        }

        this.lengthValue = buffer.utf8slice(start);
        this.readLength = -1;
    }


}



class ArrayTask {


    constructor(tasks) {

        this.tasks = tasks;
        this.task = null;

        // 还需读取的数组长度
        this.readLength = -1;

        // 数组结果
        this.arrayList = null;

        // 缓存长度
        this.lengthValue = '';
    }



    // 读取文本长度
    readLength(buffer, start, index, before) {

        let readLength = +(before + buffer.utf8slice(start, index));

        if (readLength > 0)
        {
            start = index + 2;
            index = start + readLength;

            // 记录还需要读取的子项数
            this.readLength = readLength;
            this.arrayList = new A(readLength);

            return this.readArray(buffer, index + 2, this.arrayList, readLength);
        }

        return [1, readLength < 0 ? null : [], index + 2];
    }


    readArray(buffer, start, array, readLength) {

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
            }
            else if (task = tasks[buffer[start]]) // 否则根据第一个字符获取任务类型并执行
            {
                data = task.execute(buffer, start + 1);
            }
            else
            {
                this.__task = null;
                break;
            }

            // 获取到正确结果
            if (data)
            {
                // 记录新的位置s
                start = data[2];
                array[array.length - readLength] = data[1];

                if (!--readLength)
                {
                    return [1, array, start];
                }
            }
            else // 缓存任务等待处理
            {
                this.__task = task;
                break;
            }
        }
    }


    resume(buffer, start) {

        let readLength = this.readLength;

        // 已经取得长度
        if (readLength >= 0)
        {
            // 继续往下读
            if (readLength > 0)
            {
                return this.readArray(buffer, start, this.arrayList, readLength);
            }

            // 内容已读完, 只需要处理\r\n了
            let length = buffer.length;

            // 往下一直读到\n
            while (start < length)
            {
                if (buffer[start++] === 10)
                {
                    return [1, this.cacheList, start + 1];
                }
            }
        }
        else // 先获取长度
        {
            let index = readCR(buffer, start);
    
            if (index >= 0)
            {
                return this.readLength(buffer, start, index, this.lengthValue);
            }

            this.lengthValue += buffer.utf8slice(start);
        }
    }
    

    execute(buffer, start) {

        let index = readCR(buffer, start);

        if (index >= 0)
        {
            return this.readLength(buffer, start, index, '');
        }

        this.lengthValue = buffer.utf8slice(start);
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
            }
            else if (task = tasks[buffer[start]]) // 否则根据第一个字符获取任务类型并执行
            {
                data = task.execute(buffer, start + 1);
            }
            else
            {
                this.__task = null;
                break;
            }

            // 获取到正确结果
            if (data)
            {
                // 记录新的位置s
                start = data[2];

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


    ondata(value) {
    }


    clear() {

        this.__task = null;
    }


}
