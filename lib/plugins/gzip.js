const zlib = require('zlib');


module.exports = function (options) {
    
    let minLength = options.minLength || 1024;

    function compress(context, body) {

        let encoding = context.request.headers['accept-encoding'];

        if (encoding)
        {
            if (encoding.indexOf('gzip') >= 0)
            {
                context.headers['Content-Encoding'] = 'gzip';
                context.body = zlib.gzipSync(body, options);
            }
            else if (encoding.indexOf('deflate') >= 0)
            {
                context.headers['Content-Encoding'] = 'deflate';
                context.body = zlib.deflateSync(body, options);
            }
        }
    }

    return async function (context, next) {

        let body;

        await next();

        if (!context.response.headersSent && (body = context.body))
        {
            // json
            if (typeof body !== 'string' && !(body instanceof Buffer))
            {
                context.body = body = JSON.stringify(body);
            }

            if (body.length > minLength)
            {
                compress(context, body);
            }
        }
    };

}
