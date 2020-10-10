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
                if (await this.session.find(context))
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


    constructor(session) {

        // 注册的全局插件
        this.globalPlugins = [];

        // 路由集合
        this.routes = Object.create(null);

        // 初始化session
        this.session = session || new (require('./session'))();
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
                throw new Error('plugin must be a function!');
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
                throw new Error('"' + path + '" route plugin must be a function!');
            }
        }
    }


    // 获取app分发处理器
    dispatchHandler() {

        return dispatch.bind(this);
    }
 

}
