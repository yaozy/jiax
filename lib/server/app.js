const bunyan = require('bunyan');

const session = require('./session');

const Context = require('./context');



// 分发http请求
async function dispatch(request, response) {

    try
    {
        let context = new Context(this, request, response);
        let routes = this.routes;
        let paths = context.paths;
        let index = 0;
        let plugins;
        let item;

        while (item = paths[index++])
        {
            if (item = routes[item])
            {
                routes = item;
            }
            else
            {
                break;
            }
        }

        if (plugins = routes[''])
        {
            if (index > 1)
            {
                paths.splice(0, index - 1);
            }

            if (plugins.session)
            {
                if (await session.find(context))
                {
                    await handle(this, context, plugins);
                }
                else // 无session
                {
                    response.statusCode = 299;
                    response.statusMessage = 'session lost!';
                    response.end();
                }
            }
            else
            {
                await handle(this, context, plugins);
            }
        }
        else
        {
            // 404
            response.statusCode = 404;
            response.end();
        }
    }
    catch (e)
    {
        try
        {
            response.statusCode = 500;
            response.statusMessage = e.message || e;
            response.end();

            this.logger.error(e);
        }
        catch (e)
        {
        }
    }
}



// 请求处理
async function handle(app, context, plugins) {

    let fn = end;

    for (let i = plugins.length; i--;)
    {
        fn = plugins[i].bind(app, context, fn);
    }

    await fn();

    if (!context.response.headersSent)
    {
        context.done();
    }
}

    
// 最后处理插件
function end() {
}



module.exports = class App {


    constructor(settings) {

        let any;

        this.settings = settings || (settings = {});

        this.http = settings.http || { port: 8085 };

        // 注册的全局插件
        this.globalPlugins = [];

        // 路由集合
        this.routes = Object.create(null);

        // 日志
        if (any = settings.log)
        {
            this.logger = bunyan.createLogger(any);
        }

        if (any = settings.session)
        {
            session.init(any);
        }

        if (settings = settings.database)
        {
            if (any = settings.type)
            {
                if (settings = settings[any])
                {
                    switch (any)
                    {
                        case 'mysql':
                            this.sqlclient = new (require('../sqlclient/mysql'))(settings);
                            break;

                        case 'postgresql':
                            this.sqlclient = new (require('../sqlclient/postgresql'))(settings);
                            break;

                        default:
                            throw '不支持的数据库类型"' + any + '"!';
                    }
                }
                else
                {
                    throw 'database缺少"' + any + '"数据库配置!';
                }
            }
            else
            {
                throw 'database缺少type参数!';
            }
        }
    }



    // 注册全局插件
    use(...plugins) {

        for (let name in plugins)
        {
            let fn = plugins[name];

            if (typeof fn === 'function')
            {
                fn.async = fn[Symbol.toStringTag] !== 'AsyncFunction';
                this.globalPlugins.push(fn);
            }
            else
            {
                throw '注册的全局插件不是一个函数!';
            }
        }
    }



    /**
     * 注册路由规则
     * @param path  path
     * @param session 是否需要session 可省略,默认值true
     * @param plugins 自定义插件集合
     */
    route(path, session, ...plugins) {

        let routes = this.routes;
        let list = path.split('/');
        let item;

        for (let i = 1, l = list.length; i < l; i++)
        {
            if (item = list[i])
            {
                routes = routes[item] || (routes[item] = Object.create(null));
            }
        }
    
        routes[''] = list = this.globalPlugins.slice(0);

        if (typeof session === 'function')
        {
            session.async = session[Symbol.toStringTag] !== 'AsyncFunction';

            list.push(session);
            list.session = true;   
        }
        else
        {
            list.session = session;
        }

        for (let i = 0, l = plugins.length; i < l; i++)
        {
            item = plugins[i];

            if (typeof item === 'function')
            {
                item.async = item[Symbol.toStringTag] !== 'AsyncFunction';
                list.push(item);
            }
            else
            {
                throw '"' + path + '"路由注册的插件不是一个函数!';
            }
        }
    }


    // 获取app分发处理器
    dispatchHandler() {

        return dispatch.bind(this);
    }
 

}
