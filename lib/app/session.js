// 本地session集合
const sessions = Object.create(null);

// uuid函数
const uuid = require('../utils/uuid');



// 超时时间(毫秒)
let timeout = 1200000;




exports.timeout = function (minutes) {

    if ((timeout = minutes | 0) <= 0)
    {
        timeout = 20;
    }

    timeout *= 60000;
}



exports.new = function (context, data) {

    let id = uuid();

    sessions[id] = {
        ver: 1,
        time: Date.now(),
        data: data || {}
    };

    // session id
    context.setCookie('JIAX_SESSION_ID', id, { httpOnly: true });

    return id;
}



/**
 * 查找指定context的session数据
 * @param {*} context 执行上下文
 */
exports.find = function (context) {

    let cookies = context.cookies;
    let id;

    if (id = cookies.JIAX_SESSION_ID)
    {
        let session = sessions[id];
        let now = Date.now();

        // 检测是否未登录或登录已超过
        if (!session || now - session.time > time)
        {
            return sessions[id] = null;
        }

        session.time = now;
        
        return context.session = session.data;
    }
}

