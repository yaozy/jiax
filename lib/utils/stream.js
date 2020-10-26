
/**
 * Stream流类
 */
module.exports = class Stream {



    // 从promise对象转成stream流
    static fromPromise(promise) {

        let stream = new Stream();

        setTimeout(function () {

            promise.then(value => {

                stream.resolve(value);
            });
    
            promise.catch(err => {
    
                stream.reject(err);
            });

        }, 0);

        return stream;
    }



    /**
     * 成功执行, 继续下一任务流
     * 
     * @param {any} value 往后传递的值
     * @return {Stream} 当前实例
     */
    resolve(value) {

        let next, fn;

        if (next = this.__next)
        {
            try
            {
                if (fn = this.__fn)
                {
                    if (fn = fn.call(this, value, next))
                    {
                        fn.then(value => {

                            next.resolve(value);
                        });

                        fn.catch(err => {

                            next.reject(err);
                        });
                    }
                }
                else
                {
                    next.resolve(value);
                }
            }
            catch (err)
            {
                next.reject(err);
            }
        }
    }


    /**
     * 执行失败, 往后传递错误
     * 
     * @param {any} err 当前任务实例
     * @return {Stream} 当前实例
     */
    reject(err) {

        let next, fn;

        if (next = this.__next)
        {
            try
            {
                if ((fn = this.__fail) && (fn = fn.call(this, err, next)))
                {
                    fn.catch(err => {

                        next.reject(err);
                    });
                }
                else if (fn !== false)
                {
                    next.reject(err);
                }
            }
            catch (err)
            {
                next.reject(err);
            }
        }
        else
        {
            throw err;
        }
    }


    /**
     * 注册继续任务处理方法
     * 
     * @param {Function} fn 任务处理函数
     * @return {Stream} 当前实例
     */
    then(fn) {

        if (typeof fn === 'function')
        {
            this.__fn = fn;
            return this.__next = new this.constructor();
        }
        
        throw 'method then must be a function!';
    }


    /**
     * 注册失败处理方法
     * 
     * @param {Function} fn 失败处理函数
     * @return {Stream} 当前实例
     */
    catch(fn) {

        if (typeof fn === 'function')
        {
            this.__fail = fn;
            return this.__next = new this.constructor();
        }
        
        throw 'method catch must be a function!';
    }


    /**
     * 任务值转换
     * 注: 执行结果作为后续任务流输入值直到被其它值覆盖
     * 
     * @param {Function} fn 转换函数
     * @return {Stream} 当前实例
     */
    map(fn) {

        return this.then((value, next) => {
            
            next.resolve(fn(value));
        });
    }


    /**
     * 注册任务值json处理
     * 注: 执行结果作为后续任务流输入值直到被其它值覆盖
     * 
     * @return {Stream} 当前实例
     */
    json() {

        return this.then((value, next) => {
            
            if (typeof value === 'string')
            {
                value = JSON.parse(value);
            }

            next.resolve(value);
        });
    }


    /**
     * 注册延时处理
     * 
     * @param {int|undefined} time 延时时间, 默认为0
     * @return {Stream} 当前实例
     */
    delay(time) {

        return this.then((value, next) => {
            
            setTimeout(() => {

                next.resolve(value);

            }, time | 0);
        });
    }



    /**
     * 转换成Promise对象
     * @return {Promise} promise对象
     */
    toPromise() {

        return new Promise((resolve, reject) => {

            this.then(value => {

                resolve(value);
            });

            this.catch(err => {

                reject(err);
            });
        });
    }


}
