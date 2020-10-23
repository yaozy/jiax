const http = require('http');

const jiax = require('../lib');


// 初始化默认session
// 自定义session只要实现create及get两个方法即可
const session = new jiax.Session(20);


const app = new jiax.App(session);



// 设置全局插件
app.use(jiax.plugins.gzip());

// 静态资源
app.route('/js', jiax.plugins.static('./test'));



// 测试接口
app.route('/test', async function (context, next) {

    switch (context.request.method) {
        case 'GET':
            context.body = 'test ...';
            await next();
            break;

        case 'POST':
            context.body = 'post to test ...';
            await next();
            break;
    }
});



// 创建http服务
http.createServer(app.dispatchHandler()).listen('8088');

console.log('http server listening at port', '8088');



// 测试redis
require('./redis');

