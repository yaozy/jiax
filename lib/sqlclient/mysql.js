async function getConnection(pool) {

    return new Promise((resolve, reject) => {

        pool.getConnection((err, client) => {

            if (err)
            {
                client && client.release();
                return reject(err);
            }

            resolve(client);
        });
    });
}


async function query(client, text, args) {

    return new Promise((resolve, reject) => {

        client.query(text, args, function (err, results, fields) {

            if (err)
            {
                return reject(err);
            }

            resolve(results);
        });
    });
}



function beginTransaction(client) {

    return new Promise((resolve, reject) => {

        client.beginTransaction(function (err) {

            if (err)
            {
                return reject(err);
            }

            resolve();
        });
    });
}


function commit(client) {

    return new Promise((resolve, reject) => {

        client.commit(function (err) {

            if (err)
            {
                return reject(err);
            }

            resolve();
        });
    });
}


function rollback(client) {

    return new Promise((resolve, reject) => {

        client.rollback(function (err) {

            if (err)
            {
                return reject(err);
            }

            resolve();
        });
    });
}




class Connection {


    constructor(client) {

        this.client = client;
    }


    async beginTransaction() {

        return await beginTransaction(this.client);
    }


    async commit() {

        return await commit(this.client);
    }


    async rollback() {

        return await rollback(this.client);
    }


    async query(text, args) {

        return await query(this.client, text, args);
    }


    release() {

        return this.client.release();
    }
    
}



module.exports = class {



    constructor(settings) {

        this.pool = require('mysql').createPool(settings);
    }



    // 数据库名称
    get name() {
        
        return 'mysql';
    }


    // 参数化查询类型
    // 1 匿名参数
    // 2 顺序参数
    // 3 具名参数
    get queryType() {
        
        return 1;
    }


    // 参数化查询前缀
    get queryPrefix() {
        
        return '?';
    }



    async createConnection() {

        let client = await getConnection(this.pool);
        return new Connection(client);
    }
    

    async query(text, args) {

        let client = await getConnection(this.pool);

        try
        {
            return await query(client, text, args);
        }
        finally
        {
            client.release();
        }
    }


    async queryAll(list) {
        
        let client = await getConnection(this.pool);

        try
        {
            let results = [];
            let index = 0;
            let any;

            await beginTransaction(client);

            while (any = list[index++])
            {
                any = await query(client, any, list[index++]);
                results.push(any);
            }

            await commit(client);

            return results;
        }
        catch (e)
        {
            await rollback(client);
            throw e;
        }
        finally
        {
            client.release();
        }
    }


}

