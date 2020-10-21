
/**
 * @class
 * 先进先出双向队列
 */
module.exports = class Queue {


    constructor(opacity) {

        let data = this.__data = [
            new Array(opacity),
            new Array(opacity)
        ];

        // 单个单元的长度
        data.size = opacity = opacity = opacity > 0 ? opacity : 1024;

        // 起始位置
        data.head = 0;

        // 结束位置
        data.tail = [0, 0, opacity];
    }


    push() {

        let length = arguments.length;

        if (length > 0)
        {
            let data = this.__data;
            let tail = data.tail;

            for (let i = 0; i < length; i++)
            {
                if (tail[2] > 0)
                {
                    data[tail[0]][tail[1]++] = arguments[i];
                    tail[2]--;
                }
                else // 已经存完则扩容
                {
                    data.push(new Array(data.size));
                    data[++tail[0]][0] = arguments[i];

                    tail[1] = 1;
                    tail[2] = data.size - 1;
                }
            }
        }
    }


    pop() {

        let data = this.__data;
        let tail = data.tail;

        switch (tail[0][1] - data.head)
        {
            case 0: // 没有值了
                return;

            case 1: // 最后一个
                let last = data.length - 1;
                let first = data[0];

                // 把第一页移到最后
                for (let i = 0; i < last; i++)
                {
                    data[i] = data[i + 1];
                }

                data[last] = first;

                // 重置起始位置
                data.head = 0;

                return first[data.size - 1];

            default: // 还有很多值
                return data[0][data.head++];
        }
    }


}
