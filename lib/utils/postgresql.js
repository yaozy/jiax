class Connection {


    constructor(client) {

        this.client = client;
    }


    beginTransaction() {

        return this.client.query('BEGIN');
    }


    commit() {

        return this.client.query('COMMIT');
    }


    rollback() {

        return this.client.query('ROLLBACK');
    }


    query(text, args) {

        return this.client.query(text, args).then(result => result.rows);
    }


    release() {

        return this.client.release();
    }
    
}



module.exports = class PostgreSQL {


    constructor(settings) {

        this.pool = new (require('pg').Pool)(settings);
    }


    // 数据库名称
    get name() {
        
        return 'postgresql';
    }


    // 参数化查询类型
    // 1 匿名参数
    // 2 顺序参数
    // 3 具名参数
    get queryType() {
        
        return 2;
    }


    // 参数化查询前缀
    get queryPrefix() {
        
        return '$';
    }



    async createConnection() {

        let client = await this.pool.connect();
        return new Connection(client);
    }
    

    async query(text, args) {

        let client = await this.pool.connect();

        try
        {
            let result = await client.query(text, args);
            return result.rows;
        }
        finally
        {
            client.release();
        }
    }


    async queryAll(list) {
        
        let client = await this.pool.connect();

        try
        {
            let results = [];
            let index = 0;
            let any;

            await client.query('BEGIN');

            while (any = list[index++])
            {
                any = await client.query(any, list[index++]);
                results.push(any.rows);
            }

            await client.query('COMMIT');

            return results;
        }
        catch (e)
        {
            await client.query('ROLLBACK');
            throw e;
        }
        finally
        {
            client.release();
        }
    }


}
