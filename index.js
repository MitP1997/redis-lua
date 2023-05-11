"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const fs = require('fs');
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;

var lua = {
  script: fs.readFileSync('./requestCharge.lua', 'utf8'),
  sha: null
};

const host = process.env.ENDPOINT;
const port = parseInt(process.env.PORT || "6379");
const redisClient = redis.createClient({
    url: `redis://${host}:${port}`,
    scripts: {
        requestCharge: redis.defineScript({
          NUMBER_OF_KEYS: 1,
          SCRIPT: lua.script,
          transformArguments(key, arg) {
            return [key, arg.toString()];
          },
          transformReply(reply) {
              return reply;
          }
        })
    }
});

exports.chargeRequestRedis = async function (input) {
    await redisClient.connect();
    const charges = getCharges(input);
    var reply = await redisClient.requestCharge(KEY, charges);
    await redisClient.quit();
    var remainingBalance = reply[0];
    var isAuthorized = reply[1] ? true : false;
    return {
        remainingBalance,
        charges,
        isAuthorized
    };
};
exports.resetRedis = async function () {
    await redisClient.connect();
    const ret = new Promise((resolve, reject) => {
        redisClient.set(KEY, String(DEFAULT_BALANCE), (err, res) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(DEFAULT_BALANCE);
            }
        });
    });
    await redisClient.quit();
    return ret;
};
function getCharges(input) {
    return input["unit"];
}
