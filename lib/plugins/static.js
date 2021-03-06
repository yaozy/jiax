const fs = require('fs');
const path = require('path');


const mime = {
    htm: 'text/html',
    html: 'text/html',
    shtml: 'text/html',
    txt: 'text/plain',
    xml: 'text/xml',
    css: 'text/css',
    json: 'application/json',
    js: 'application/javascript',
    htc: 'text/x-component',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    woff: 'application/font-woff',
    eot: 'application/vnd.ms-fontobject',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    svgz: 'image/svg+xml',
    wbmp: 'image/vnd.wap.wbmp',
    webp: 'image/webp',
    ico: 'image/x-icon',
    jng: 'image/x-jng',
    bmp: 'image/x-ms-bmp',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    wmv: 'video/x-ms-wmv',
    avi: 'video/x-msvideo'
};


const caches = Object.create(null);



module.exports = function (base, cache) {
    
    base = path.join(process.cwd(), base, '/');

    return async (context, next) => {

        let url = context.request.url;
        let data;

        if (cache && (data = caches[url]))
        {
            if (data === 404)
            {
                context.send(404);
            }
            else
            {
                context.type = data.type;
                context.body = data.text;
            }
        }
        else
        {
            let file = context.paths.join('/');

            if (file && fs.existsSync(file = base + file))
            {
                caches[url] = data = {};

                context.type = data.type = mime[path.extname(file).substring(1)] || 'application/octet-stream';
                context.body = data.text = fs.readFileSync(file);
            }
            else
            {
                context.send(cache[url] = 404);
                return;
            }
        }

        await next();
    }

}
