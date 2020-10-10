module.exports = function (seconds) {
    
    seconds = seconds >= 0 ? seconds : 43200;

    return async function (context, next) {

        await next();

        if (!context.response.headersSent)
        {
            let headers = context.headers;
            let date = new Date();

            date.setSeconds(date.getSeconds() + seconds);

            headers['Cache-Control'] = 'max-age=' + seconds;
            headers.Expires = date.toGMTString();
        }
    };

}
