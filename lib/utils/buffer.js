
// 直接调用原生的buffer copy方法以提升性能
const copyBuffer = process.binding('buffer').copy;


/**
 * 合并buffer数组并转成utf8字符串
 * @param {*} bufferArray 
 * @param {*} length 
 */
exports.utf8 = function (bufferArray, length) {

    if (length === void 0)
    {
        length = bufferArray.length;
    } 

    switch (length)
    {
        case 0:
            return '';

        case 1:
            return bufferArray[0].utf8Slice(0);
    }

    let size = 0;

    for (let i = length; i--;)
    {
        size += bufferArray[i].length;
    }

    // 直接调用底层方法创建buffer
    let buffer = Buffer.allocUnsafe(size);
    let index = 0;

    for (let i = 0; i < length; i++)
    {
        copyBuffer(bufferArray[i], buffer, index);
        index += bufferArray[i].length;
    }

    return buffer.utf8Slice(0);
}
