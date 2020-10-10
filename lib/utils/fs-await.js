const fs = require('fs');
const names = 'access,appendFile,chmod,chown,close,copyFile,exists,fchmod,fchown,fdatasync,fstat,fsync,ftruncate,futimes,link,lstat,mkdir,mkdtemp,read,readFile,readdir,readlink,realpath,rename,rmdir,stat,truncate,unlink,utimes,write,writeFile'.split(',');


for (let i = 0, l = names.length; i < l; i++)
{
    compile_fn.call(fs, names[i]);
}


function compile_fn(name) {

    exports[name] = (...args) => {
        
        let fs = this;

        return new Promise((resolve, reject) => {
            
            fs[name](...args, (err, data) => {
                
                if (err)
                {
                    return reject(err);
                }

                resolve(data);
            });
        });
    };
};


//此方法不能在运行时动态调用,否则会出现过期警告
// function find_async() {
    
//     let keys = Object.getOwnPropertyNames(fs);
//     let list = [];

//     for (let i = 0, l = keys.length; i < l; i++)
//     {
//         let key = keys[i];
//         let fn = fs[key];

//         if (typeof fn === 'function' && !/Sync$/.test(fn.name))
//         {
//             let any = '' + fn;

//             any = any.substring(any.indexOf('(') + 1, any.indexOf(')'));
//             any = any.match(/[^\s,]+/g);

//             if (any && any.pop() === 'callback')
//             {
//                 list.push(key);
//             }
//         }
//     }
// };