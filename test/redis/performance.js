const RedisClient = require('../../lib').RedisClient;


(async function () {

    let client = new RedisClient(/*{ host: '127.0.0.1', port: 6379 }*/);
    
    await client.connect();


    async function test(index) {

        let value;

        value = await client.hgetall('test');

        // if (index < 0 || index % 100 === 0)
        // {
        //     console.log(value);
        // }
        
        value = await client.hset('test', 'a', '123\r\n456');
        value = await client.hget('test', 'a');

        value = await client.hset('test', 'b', '1234567891011');
        value = await client.hget('test', 'b');

        value = await client.hset('test', 'c', '123\r\n456');
        value = await client.hget('test', 'c');

        value = await client.hset('test', 'd', '1234567891011');
        value = await client.hget('test', 'd');

        value = await client.hset('test', 'e', '123\r\n456');
        value = await client.hget('test', 'e');

        value = await client.hmset('test', { f: 1, g: 2, h: '' });
        value = await client.hmget('test', 'f', 'g');

        value = await client.hgetall('test');
    }


    async function test2(index) {

        let value;

        value = client.hgetall('test');

        client.hset('test', 'a', '123\r\n456');
        client.hget('test', 'a');

        client.hset('test', 'b', '1234567891011');
        client.hget('test', 'b');

        client.hset('test', 'c', '123\r\n456');
        client.hget('test', 'c');

        client.hset('test', 'd', '1234567891011');
        client.hget('test', 'd');

        client.hset('test', 'e', '123\r\n456');
        client.hget('test', 'e');

        client.hmset('test', { f: 1, g: 2, h: '' });
        client.hmget('test', 'f', 'g');

        value = await client.hgetall('test');

        // if (index < 10 || index % 100 === 0)
        // {
        //     console.log(value);
        // }
    }



    let date = new Date();

    for (var i = 0; i < 1000; i++)
    {
        test2(i);
    }

    await test(i);

    console.log(new Date() - date);


})();