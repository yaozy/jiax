const sqlite3 = require('sqlite3');



function fail(err) {

    if (err)
    {
        console.error(err);
    }
}



module.exports = class Sqlite {



    constructor(filename, callbackFn) {

        this.sqlite = new sqlite3.Database(filename, callbackFn || fail);
    }



    // 数据库名称
    get name() {
        
        return 'sqlite';
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


    run(sql, params) {

        return new Promise((resolve, reject) => {

            this.sqlite.run(sql, params, function () {


            });
        });
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


    async close(callbackFn) {

        this.sqlite.close(callbackFn || fail);
    }


}

