// 直接绑定计算utf8字符串字节的原生方法
const utf8length = process.binding('buffer').byteLengthUtf8;

const { EventEmitter } = require('events');


const socket = require('./socket');



/**
 * 对象转数组
 * @param {*} values 
 */
function toArray(values) {

    let list = [];

    if (values)
    {
        for (let name in values)
        {
            list.push(name, values[name]);
        }
    }

    return list;
}



module.exports = class RedisClient extends EventEmitter {


    constructor(options) {

        // 初始化socket连接
        this.__socket = socket(this.options = options || {}); 

        // 指令处理缓存
        this.__cache = new Array(1024);
    }


    /**
     * connect to redis server
     */
    connect() {

        return this.__socket.connect();
    }

    
    /**
     * execute redis command
     * @param {*} key 
     * @param {*} args 
     */
    command(key, ...args) {

        let fn = utf8length;
        let length = args.length;
        let command = this.__cache;
        let index = 3;
        
        command[0] = '*' + (length + 1);
        command[1] = '$' + fn(key);
        command[2] = key;

        for (let i = 0; i < length; i++)
        {
            let value = args[i];

            // 注: 发送不了$-1\r\n格式的数据
            if (value == null)
            {
                throw 'value sent to redis can not be null!';
            }
            else
            {
                // 注: 发送命令不支持":"整数格式
                switch (typeof value)
                {
                    case 'boolean':
                        command[index++] = '$1';
                        command[index++] = value ? 1 : 0;
                        break;

                    case 'number':
                        value = '' + value; // 小数按字符串处理
                        command[index++] = '$' + fn(value);
                        command[index++] = value;
                        break;

                    case 'string':
                        command[index++] = '$' + (value ? fn(value) : 0);
                        command[index++] = value;
                        break;

                    default: // 序列化对象
                        value = JSON.stringify(value);
                        command[index++] = '$' + fn(value);
                        command[index++] = value;
                        break;
                }
            }
        }

        command[index++] = '';
        command = command.slice(0, index).join('\r\n');

        let result = this.__socket.send(text);

        if (result === false)
        {
            this.emit('busy');
        }
        else
        {
            return result;
        }
    }


    /**
     * direct send redis format text
     * @param {*} text 
     */
    send(text) {

        let result = this.__socket.send(text);

        if (result === false)
        {
            this.emit('busy');
        }
        else
        {
            return result;
        }
    }




    //Key（键）


    del(...keys) {

        return this.command('DEL', ...arguments);
    }


    dump(key) {

        return this.command('DUMP', ...arguments);
    }


    exists(key) {

        return this.command('EXISTS', ...arguments);
    }


    expire(key, seconds) {

        return this.command('EXPIRE', ...arguments);
    }


    expireat(key, timestamp) {

        return this.command('EXPIREAT', ...arguments);
    }


    keys(pattern) {

        return this.command('KEYS', ...arguments);
    }


    migrate(host, port, key, destination_db, timeout, copy, replace) {

        return this.command('MIGRATE', ...arguments);
    }


    move(key, db) {

        return this.command('MOVE', ...arguments);
    }


    object(subcommand, ...args) {

        return this.command('OBJECT', ...arguments);
    }


    persist(key) {

        return this.command('PERSIST', ...arguments);
    }


    pexpire(key, milliseconds) {

        return this.command('PEXPIRE', ...arguments);
    }


    pexpireat(key, milliseconds_timestamp) {

        return this.command('PEXPIREAT', ...arguments);
    }


    pttl(key) {

        return this.command('PTTL', ...arguments);
    }


    randomkey() {

        return this.send('*1\r\n$9\r\nRANDOMKEY\r\n');
    }


    rename(key, newkey) {

        return this.command('RENAME', ...arguments);
    }


    renamenx(key, newkey) {

        return this.command('RENAMENX', ...arguments);
    }


    restore(key, ttl, serialized_value) {

        return this.command('RESTORE', ...arguments);
    }


    sort(key, BY, pattern, LIMIT, offset, count, GET, pattern/*, [GET, pattern]* */, ASC_OR_DESC, ALPHA, STORE, destination) {

        return this.command('SORT', ...arguments);
    }


    ttl(key) {

        return this.command('TTL', ...arguments);
    }


    type(key) {

        return this.command('TYPE', ...arguments);
    }


    scan(cursor, MATCH, pattern, COUNT, count) {

        return this.command('SCAN', ...arguments);
    }



    //String（字符串）
    append(key, value) {

        return this.command('APPEND', ...arguments);
    }


    bitcount(key, start, end) {

        return this.command('BITCOUNT', ...arguments);
    }


    bitop(operation, destkey, ...keys) {

        return this.command('BITOP', ...arguments);
    }


    decr(key) {

        return this.command('DECR', ...arguments);
    }


    decrby(key, decrement) {

        return this.command('DECRBY', ...arguments);
    }


    get(key) {

        return this.command('GET', ...arguments);
    }


    getbit(key, offset) {

        return this.command('GETBIT', ...arguments);
    }


    getrange(key, start, end) {

        return this.command('GETRANGE', ...arguments);
    }


    getset(key, value) {

        return this.command('GETSET', ...arguments);
    }


    incr(key) {

        return this.command('INCR', ...arguments);
    }


    incrby(key, increment) {

        return this.command('INCRBY', ...arguments);
    }


    incrbyfloat(key, increment) {

        return this.command('INCRBYFLOAT', ...arguments);
    }


    mget(...keys) {

        return this.command('MGET', ...arguments);
    }


    mset(values) {

        return this.command('MSET', ...toArray(values));
    }


    msetnx(values) {

        return this.command('MSETNX', ...toArray(values));
    }


    psetex(key, milliseconds, value) {

        return this.command('PSETEX', ...arguments);
    }


    set(key, value, EX, seconds, PX, milliseconds, NX_OR_XX) {

        return this.command('SET', ...arguments);
    }


    setbit(key, offset, value) {

        return this.command('SETBIT', ...arguments);
    }


    setex(key, seconds, value) {

        return this.command('SETEX', ...arguments);
    }


    setnx(key, value) {

        return this.command('SETNX', ...arguments);
    }


    setrange(key, offset, value) {

        return this.command('SETRANGE', ...arguments);
    }


    strlen(key) {

        return this.command('STRLEN', ...arguments);
    }



    //Hash（哈希表）


    hdel(key, ...fields) {

        return this.command('HDEL', ...arguments);
    }


    hexists(key, field) {

        return this.command('HEXISTS', ...arguments);
    }


    hget(key, field) {

        return this.command('HGET', ...arguments);
    }


    hgetall(key) {

        return this.command('HGETALL', ...arguments);
    }


    hincrby(key, field, increment) {

        return this.command('HINCRBY', ...arguments);
    }


    hincrbyfloat(key, field, increment) {

        return this.command('HINCRBYFLOAT', ...arguments);
    }


    hkeys(key) {

        return this.command('HKEYS', ...arguments);
    }


    hlen(key) {

        return this.command('HLEN', ...arguments);
    }


    hmget(key, ...fields) {

        return this.command('HMGET', ...arguments);
    }


    hmset(key, values) {

        return this.command('HMSET', key, ...toArray(values));
    }


    hset(key, field, value) {

        return this.command('HSET', ...arguments);
    }


    hsetnx(key, field, value) {

        return this.command('HSETNX', ...arguments);
    }


    hvals(key) {

        return this.command('HVALS', ...arguments);
    }


    hscan(key, cursor, MATCH, pattern, COUNT, count) {

        return this.command('HSCAN', ...arguments);
    }



    //List（列表）


    blpop(...keys/*, timeout*/) {

        return this.command('BLPOP', ...arguments);
    }


    brpop(...keys/*, timeout*/) {

        return this.command('BRPOP', ...arguments);
    }


    brpoplpush(source, destination, timeout) {

        return this.command('BRPOPLPUSH', ...arguments);
    }


    lindex(key, index) {

        return this.command('LINDEX', ...arguments);
    }


    linsert(key, BEFORE_OR_AFTER, pivot, value) {

        return this.command('LINSERT', ...arguments);
    }


    llen(key) {

        return this.command('LLEN', ...arguments);
    }


    lpop(key) {

        return this.command('LPOP', ...arguments);
    }


    lpush(key, ...values) {

        return this.command('LPUSH', ...arguments);
    }


    lpushx(key, value) {

        return this.command('LPUSHX', ...arguments);
    }


    lrange(key, start, stop) {

        return this.command('LRANGE', ...arguments);
    }


    lrem(key, count, value) {

        return this.command('LREM', ...arguments);
    }


    lset(key, index, value) {

        return this.command('LSET', ...arguments);
    }


    ltrim(key, start, stop) {

        return this.command('LTRIM', ...arguments);
    }


    rpop(key) {

        return this.command('RPOP', ...arguments);
    }


    rpoplpush(source, destination) {

        return this.command('RPOPLPUSH', ...arguments);
    }


    rpush(key, ...values) {

        return this.command('RPUSH', ...arguments);
    }


    rpushx(key, value) {

        return this.command('RPUSHX', ...arguments);
    }



    //Set（集合）


    sadd(key, ...members) {

        return this.command('SADD', ...arguments);
    }


    scard(key) {

        return this.command('SCARD', ...arguments);
    }


    sdiff(...keys) {

        return this.command('SDIFF', ...arguments);
    }


    sdiffstore(destination, ...keys) {

        return this.command('SDIFFSTORE', ...arguments);
    }


    sinter(...keys) {

        return this.command('SINTER', ...arguments);
    }


    sinterstore(destination, ...keys) {

        return this.command('SINTERSTORE', ...arguments);
    }


    sismember(key, member) {

        return this.command('SISMEMBER', ...arguments);
    }


    smembers(key) {

        return this.command('SMEMBERS', ...arguments);
    }


    smove(source, destination, member) {

        return this.command('SMOVE', ...arguments);
    }


    spop(key) {

        return this.command('SPOP', ...arguments);
    }


    srandmember(key, count) {

        return this.command('SRANDMEMBER', ...arguments);
    }


    srem(key, ...members) {

        return this.command('SREM', ...arguments);
    }


    sunion(...keys) {

        return this.command('SUNION', ...arguments);
    }


    sunionstore(destination, ...keys) {

        return this.command('SUNIONSTORE', ...arguments);
    }


    sscan(key, cursor, MATCH, pattern, COUNT, count) {

        return this.command('SSCAN', ...arguments);
    }



    //SortedSet（有序集合）


    zadd(key, values) {

        return this.command('ZADD', key, ...toArray(values));
    }


    zcard(key) {

        return this.command('ZCARD', ...arguments);
    }


    zcount(key, min, max) {

        return this.command('ZCOUNT', ...arguments);
    }


    zincrby(key, increment, member) {

        return this.command('ZINCRBY', ...arguments);
    }


    zrange(key, start, stop, WITHSCORES) {

        return this.command('ZRANGE', ...arguments);
    }


    zrangebyscore(key, min, max, WITHSCORES, LIMIT, offset, count) {

        return this.command('ZRANGEBYSCORE', ...arguments);
    }


    zrank(key, member) {

        return this.command('ZRANK', ...arguments);
    }


    zrem(key, ...members) {

        return this.command('ZREM', ...arguments);
    }


    zremrangebyrank(key, start, stop) {

        return this.command('ZREMRANGEBYRANK', ...arguments);
    }


    zremrangebyscore(key, max, min, WITHSCORES, LIMIT, offset, count) {

        return this.command('ZREMRANGEBYSCORE', ...arguments);
    }


    zrevrange(key, start, stop, WITHSCORES) {

        return this.command('ZREVRANGE', ...arguments);
    }


    zrevrangebyscore(key, max, min, WITHSCORES, LIMIT, offset, count) {

        return this.command('ZREVRANGEBYSCORE', ...arguments);
    }


    zrevrank(key, member) {

        return this.command('ZREVRANK', ...arguments);
    }


    zscore(key, member) {

        return this.command('ZSCORE', ...arguments);
    }


    zunionstore(destination, numkeys, ...keys/*, WEIGHTS, ...weights, AGGREGATE, SUM_OR_MIN_OR_MAX*/) {

        return this.command('ZUNIONSTORE', ...arguments);
    }


    zinterstore(destination, numkeys, ...keys/*, WEIGHTS, ...weights, AGGREGATE, SUM_OR_MIN_OR_MAX*/) {

        return this.command('ZINTERSTORE', ...arguments);
    }


    zscan(key, cursor, MATCH, pattern, COUNT, count) {

        return this.command('ZSCAN', ...arguments);
    }



    //Pub/Sub（发布/订阅）


    psubscribe(...patterns) {

        return this.command('PSUBSCRIBE', ...arguments);
    }


    publish(channel, message) {

        return this.command('PUBLISH', ...arguments);
    }


    pubsub(subcommand, ...args) {

        return this.command('PUBSUB', ...arguments);
    }


    punsubscribe(...patterns) {

        return this.command('PUNSUBSCRIBE', ...arguments);
    }


    subscribe(...channels) {

        return this.command('SUBSCRIBE', ...arguments);
    }


    unsubscribe(...channels) {

        return this.command('UNSUBSCRIBE', ...arguments);
    }




    //Transaction（事务）


    discard() {

        return this.send('*1\r\n$7\r\nDISCARD\r\n');
    }


    exec() {

        return this.send('*1\r\n$4\r\nEXEC\r\n');
    }


    multi() {

        return this.command('*1\r\n$5\r\nMULTI\r\n');
    }


    unwatch() {

        return this.command('*1\r\n$7\r\nUNWATCH\r\n');
    }


    watch(...keys) {

        return this.command('WATCH', ...arguments);
    }



    //Script（脚本）


    eval(script, numkeys, ...keys/*, ...args*/) {

        return this.command('EVAL', ...arguments);
    }


    evalsha(sha1, numkeys, ...keys/*, ...args*/) {

        return this.command('EVALSHA', ...arguments);
    }


    script_exists(...scripts) {

        return this.command('SCRIPT EXISTS', ...arguments);
    }


    script_flush() {

        return this.send('*1\r\n\$12\r\nSCRIPT FLUSH\r\n');
    }


    script_kill() {

        return this.send('*1\r\n\$11\r\nSCRIPT KILL\r\n');
    }


    script_load(script) {

        return this.command('SCRIPT LOAD', ...arguments);
    }



    //Connection（连接）


    auth(password) {

        return this.command('AUTH', ...arguments);
    }


    echo(message) {

        return this.command('ECHO', ...arguments);
    }


    ping() {

        return this.send('*1\r\n$4\r\nPING\r\n');
    }


    quit() {

        return this.send('*1\r\n$4\r\nQUIT\r\n');
    }


    select(index) {

        return this.command('SELECT', ...arguments);
    }



    //Server（服务器）
    bgrewriteaof() {

        return this.send('*1\r\n$12\r\nBGREWRITEAOF\r\n');
    }


    bgsave() {

        return this.send('*1\r\n$6\r\nBGSAVE\r\n');
    }


    client_getname() {

        return this.send('*1\r\n$14\r\nCLIENT GETNAME\r\n');
    }


    client_kill(ip_and_port) {

        return this.command('CLIENT KILL', ...arguments);
    }


    client_list() {

        return this.commsendand('*1\r\n$11\r\nCLIENT LIST\r\n');
    }


    client_setname(connection_name) {

        return this.command('CLIENT SETNAME', ...arguments);
    }


    config_get(parameter) {

        return this.command('CONFIG GET', ...arguments);
    }


    config_resetstat() {

        return this.send('*1\r\n$16\r\nCONFIG RESETSTAT\r\n');
    }


    config_rewrite() {

        return this.send('*1\r\n$14\r\nCONFIG REWRITE\r\n');
    }


    config_set(parameter, value) {

        return this.command('CONFIG SET', ...arguments);
    }


    dbsize() {

        return this.send('*1\r\n$6\r\nDBSIZE\r\n');
    }


    debug_object(key) {

        return this.command('DEBUG OBJECT', ...arguments);
    }


    //执行一个不合法的内存访问从而让 Redis 崩溃，仅在开发时用于 BUG 模拟。
    debug_segfault() {

        return this.send('*1\r\n$14\r\nDEBUG SEGFAULT\r\n');
    }


    flushall() {

        return this.send('*1\r\n$8\r\nFLUSHALL\r\n');
    }


    flushdb() {

        return this.send('*1\r\n$7\r\nFLUSHDB\r\n');
    }


    info(section) {

        return this.command('INFO', ...arguments);
    }


    lastsave() {

        return this.send('*1\r\n$8\r\nLASTSAVE\r\n');
    }


    monitor() {

        return this.send('*1\r\n$7\r\nMONITOR\r\n');
    }


    psync(master_run_id, offset) {

        return this.command('PSYNC', ...arguments);
    }


    save() {

        return this.send('*1\r\n$4\r\nSAVE\r\n');
    }


    shutdown(SAVE_OR_NOSAVE) {

        return this.command('SHUTDOWN', ...arguments);
    }


    slaveof(host, port) {

        return this.command('SLAVEOF', ...arguments);
    }


    slowlog(subcommand, argument) {

        return this.command('SLOWLOG', ...arguments);
    }


    sync() {

        return this.send('*1\r\n$4\r\nSYNC\r\n');
    }


    time(...keys) {

        return this.send('*1\r\n$4\r\nTIME\r\n');
    }

}
