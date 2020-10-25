const Redis = require('./client');

const SocketProxy = require('./socket-proxy');




function initCluster(options) {

    let cluster;

    if ((cluster = options.cluster) && cluster.sort)
    {
        cluster.sort(() => Math.random() > .5 ? 1 : -1);
    }
    else
    {
        cluster = [{ host: '127.0.0.1', port: 6379 }];
    }

    return cluster;
}




class SocketClusterProxy extends SocketProxy {


    connect(resolve, reject) {
 
        let options = this.options;
        let cluster = this.cluster;

        if (!cluster || cluster.length <= 0)
        {
            cluster = this.cluster = initCluster(options);
        }

        cluster = cluster.pop();
        options.host = cluster.host || '127.0.0.1';
        options.port = cluster.port > 0 ? cluster.port | 0 : 6379;

        super.connect(resolve, reject);
    }


}




module.exports = class RedisCluster extends Redis {


    constructor(options) {

        super(options, SocketClusterProxy);
    }
    

}
