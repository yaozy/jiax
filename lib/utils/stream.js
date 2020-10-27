
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


    static resolve(value) {

        let stream = new Stream();

        setTimeout(function () {

            stream.resolve(value);

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
                if (fn = this.__done)
                {
                    fn.call(this, value, next);
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
        else
        {
            this.__value = [value];
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
                if (fn = this.__fail)
                {
                    fn.call(this, err, next);
                }
                else
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
            console.error(err);
        }
    }


    /**
     * 添加处理
     * @param {Function} done 成功处理 
     * @param {Function} fail 失败处理
     */
    push(done, fail) {

        if (typeof done === 'function')
        {
            this.__done = done;

            if (done = this.__value)
            {
                this.__value = void 0;
                setTimeout(() => this.resolve(done[0]));
            }
        }
        
        if (typeof fail === 'function')
        {
            this.__fail = fail;
        }

        return this.__next = new this.constructor();
    }


    /**
     * 注册继续任务处理方法
     * 
     * @param {Function} fn 任务处理函数
     * @return {Stream} 当前实例
     */
    then(fn) {

        return this.push((value, next) => {
            
            let result;

            // promise
            if (result = fn(value))
            {
                result.then(() => next.resolve(value));
                result.catch(err => next.reject(err));
            }
            else if (result !== false)
            {
                next.resolve(value);
            }
        });
    }


    /**
     * 注册失败处理方法
     * 
     * @param {Function} fn 失败处理函数
     * @return {Stream} 当前实例
     */
    catch(fn) {

        return this.push(null, (err, next) => {
            
            let result;

            // promise
            if (result = fn(err))
            {
                result.finally(() => next.reject(err));
            }
            else if (result !== false)
            {
                next.reject(err);
            }
        });
    }


    /**
     * 任务值转换
     * 注: 执行结果作为后续任务流输入值直到被其它值覆盖
     * 
     * @param {Function} fn 转换函数
     * @return {Stream} 当前实例
     */
    map(fn) {

        return this.push((value, next) => {
            
            value = fn(value);

            // promise
            if (value && typeof value.catch === 'function')
            {
                value.then(value => next.resolve(value));
                value.catch(err => next.reject(err));
            }
            else
            {
                next.resolve(value);
            }
        });
    }


    /**
     * 注册任务值json处理
     * 注: 执行结果作为后续任务流输入值直到被其它值覆盖
     * 
     * @return {Stream} 当前实例
     */
    json() {

        return this.push((value, next) => {
            
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

        return this.push((value, next) => {
            
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

            this.push(value => resolve(value), err => reject(err));
        });
    }


}
