/**
 * 根据物理网卡地址及时间生成唯一标识
 */


 // 随机函数
 const random = Math.random;


 const crypto = require('crypto');


 const padding = random().toString(36).substring(2);



 // 机器码
 const machine = (() => {

    // 取最大的mac地址
    let keys = require('os').networkInterfaces();
    let value = '';

    for (let key in keys)
    {
        let item = keys[key][0];
        
        if ((key = item.mac) > value)
        {
            value = key;
        }
    }

    if (value && (value = +('0x' + value.split(':').join(''))))
    {
        value = value.toString('36');
    }
    else // 取不到则生成随机码
    {
        value = random().toString(36).substring(2);
    }

    return value + random() + random();

})();



module.exports = () => {

    let uuid = crypto.createHash('sha256').update(

        machine +   // 机器码
        random() +  // 随机码
        Date.now()  // 时间戳

    ).digest('base64').replace(/[/=+]/g, '').substring(0, 36);

    if (uuid.length < 36)
    {
        uuid = (uuid + padding).substring(0, 36);
    }

    return uuid;
}
