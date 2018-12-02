const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 5000;

// Postgres client setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on('connect', (client) => console.log('Connected to Postgres'));
pgClient.on('error', err => console.log('Lost PG Connection', err));
pgClient
    .query('CREATE TABLE IF NOT EXISTS values (NUMBER INT)')
    .catch( err => console.log(err));

// Redis Client Setup
const redis = require('redis');

console.log("8922:Connecting to redis");
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    password: keys.redisPassword,
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

const publisher = redisClient.duplicate();

redisClient.on('error', err => console.log('Something went wrong with Redis' , err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Express route handlers
app.get('/', (req, res) => {
    console.log("8922:/","/");
    //
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
   redisClient.hgetall('values', (err, values) => {
      res.send(values);
   });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;
    console.log("8922:index",req.body);
    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    console.log("8922:publishing..");
    publisher.publish('insert', index);
    console.log("8922:finish publishing.");
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    res.send({ working: true});
});


app.listen(port, err => { console.log(`Listening on port ${port}`)});