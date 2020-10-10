// 本地session集合
const sessions = Object.create(null);

// uuid函数
const uuid = require('../utils/uuid');



// 超时时间(毫秒)
let time = 1200000;




module.exports = class Session {


    
    constructor(timeout) {

        time = (timeout | 0) * 60000 || time;
    }



    // 创建新的session
    create(context, data) {
        
        let id = uuid();

        sessions[id] = {
            ver: 1,
            time: Date.now(),
            data: data || {}
        };

        // session id
        context.setCookie('YAXISESSION', id, { httpOnly: true });
    }


    // 查找指定context的session数据
    find(context) {

        let cookies = context.cookies;
        let id = cookies.YAXISESSION;

        if (id)
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
}

