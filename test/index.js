const http = require('http');

const jiax = require('../lib');


const app = new jiax.App();


// 设置全局插件
app.use(jiax.plugins.gzip());

// 静态资源
app.route('/static', false, jiax.plugins.static('./'));


// 测试接口
app.route('/test', false, async function (context, next) {

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
})



// 创建http服务
http.createServer(app.dispatchHandler()).listen('8088');

console.log('http server listening at port', '8088');