const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
   host: keys.redisHost,
   port: keys.redisPort,
   retry_strategy: (options) => {
        console.log("8922:redis options", options);
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
});

// If we ever have a client that's listening or publishing information on redis
// we have to make a duplicate connection because when a connection is turned
// into a connection that's going to listen or subscribe or publish information
// it cannot be used for other purposes
const subscriber = redisClient.duplicate();

redisClient.on('error', err => console.log('Redis: Something went wrong ' ,err));
redisClient.on('connect', () => console.log('Connected to Redis'));

function fib(index) {
   if ( index < 2) return 1;
   return fib(index - 1 ) + fib(index - 2);
}

subscriber.on('message', (channel, message) => {
   console.log(`sub channel ${channel}:${message}`);
   const answer = fib(parseInt(message));
   console.log("8922:answer",answer);
   redisClient.hset('values', message, answer);
});
subscriber.subscribe('insert');
