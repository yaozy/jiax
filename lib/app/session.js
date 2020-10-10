// 本地session集合
const sessions = Object.create(null);

// uuid函数
const uuid = require('../utils/uuid');


// 超时时间(毫秒)
let timeout = 1200000;



// 初始化配置
exports.init = function (timeout) {

    timeout = (timeout | 0) * 60000 || timeout;
}



// 查找指定context的session数据
exports.find = function (context) {

    let cookies = context.cookies;
    let id = cookies.YAXISESSION;

    if (id)
    {
        let session = sessions[id];
        let time = Date.now();

        // 检测是否未登录或登录已超过
        if (!session || time - session.time > timeout)
        {
            return sessions[id] = null;
        }

        session.time = time;
        
        return context.session = session.data;
    }
}



// 创建新的session
exports.create = function (context, data) {
    
    let id = uuid();

    sessions[id] = {
        ver: 1,
        time: Date.now(),
        data: data || {}
    };

    // session id
    context.setCookie('YAXISESSION', id, { httpOnly: true });
}

