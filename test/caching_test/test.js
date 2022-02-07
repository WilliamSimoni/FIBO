require('dotenv').config({ path: __dirname + '/./../../.env' });

const fetch = require('node-fetch');
const moment = require('moment');
const { delay } = require('../../custom-modules/delay');

const { timeConverter, rounder } = require('../../custom-modules/time');

const fs = require('fs');

const { InfluxDB } = require('./../../database/influxdb');

const database = new InfluxDB();

async function send(request, endpoint, token) {

    const api_url = `http://localhost:7777/${endpoint}`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
        body: JSON.stringify(request),
    };
    const response = await fetch(api_url, options);
    const json = await response.json();

    return json;
}

const request = {
    projectName: 'esempio',
    timeSeries: [[
        { tag: "bathroom", value: "temp" }
    ], [
        { tag: "safe", value: "temp" },
    ]
    ],
    fleet: 'flt-4urixvulkwxr',
    aggregationFunction: 'min',
    timeRange: { key: 'hour', number: 1 },
    unit: 's',
    granularity: { key: 'second', number: 30 },
    store: true
}


const loginRequest = {
    username: 'admin',
    password: 'admin',
    projectName: 'prova'
}

function generateRequest(couples, functions, periods, granularities) {

    const coupleIndex = Math.floor(Math.random() * couples.length);
    const functionIndex = Math.floor(Math.random() * functions.length);
    const periodIndex = Math.floor(Math.random() * periods.length);
    const granularityIndex = Math.floor(Math.random() * granularities.length);

    let granularity;

    //
    // check granularity < timeRange
    //

    if (timeConverter.convertSecond(periods[periodIndex].number, periods[periodIndex].key) <
        timeConverter.convertSecond(granularities[granularityIndex].number, granularities[granularityIndex].key)) {
        granularity = periods[periodIndex];
    } else {
        granularity = granularities[granularityIndex];
    }

    return {
        projectName: 'esempio',
        timeSeries: [[
            couples[coupleIndex]
        ]
        ],
        fleet: 'flt-4urixvulkwxr',
        aggregationFunction: functions[functionIndex],
        timeRange: periods[periodIndex],
        unit: 's',
        granularity: granularity,
        store: false
    }
}

const couples = [
    { tag: 'bathroom', value: 'temp' },
    { tag: 'kitchen', value: 'temp' },
    { tag: 'safe', value: 'temp' },
    { tag: 'safe', value: 'humidity' },
    { tag: 'safe', value: 'movements' },
    { tag: 'safe', value: 'moneyCounter' },
    { tag: 'kitchen', value: 'pression' },
    { tag: 'ground floor', value: 'temp' },
    { tag: 'ground floor', value: 'humidity' },
    { tag: 'ground floor', value: 'pression' },
    { tag: 'banditi house', value: 'humidity' },
    { tag: 'banditi house', value: 'movements' },
    { tag: 'banditi house', value: 'moneyCounter' },
    { tag: 'banditi house', value: 'temp' },
    { tag: 'kitchen', value: 'pression' },
    { tag: 'first floor', value: 'temp' },
    { tag: 'temperature', value: 'temp' },
];

const functions = [
    'mean', 'max', 'min', 'sum'
]

const periods = [
    { number: 5, key: 'minute' },
    { number: 1, key: 'hour' },
    { number: 1, key: 'day' },
    { number: 1, key: 'month' },
    { number: 10, key: 'minute' },
    { number: 2, key: 'hour' },
    { number: 2, key: 'day' },
    { number: 15, key: 'minute' },
    { number: 3, key: 'hour' },
    { number: 12, key: 'hour' },
    { number: 20, key: 'minute' },
    { number: 4, key: 'hour' },
]

const granularities = [
    { number: 5, key: 'minute' },
    { number: 1, key: 'hour' },
    { number: 1, key: 'day' },
    { number: 1, key: 'week' },
    { number: 10, key: 'minute' },
    { number: 2, key: 'hour' },
    { number: 2, key: 'day' },
    { number: 2, key: 'week' },
    { number: 15, key: 'minute' },
    { number: 3, key: 'hour' },
    { number: 3, key: 'day' },
    { number: 3, key: 'week' },
    { number: 20, key: 'minute' },
    { number: 4, key: 'hour' },
    { number: 4, key: 'day' },
    { number: 4, key: 'week' },
    { number: 15, key: 'second' },
    { number: 30, key: 'second' },
    { number: 90, key: 'second' },
    { number: 180, key: 'second' },
    { number: 320, key: 'second' },
]

async function makeRequest(request, token) {
    const start = Date.now();
    const data = await send(request, 'get', token);
    return { time: Date.now() - start, data };
}

async function makeRequestInSuccession(request, token, count, oneTimeRequests) {
    let sum = 0;

    for (let i = 0; i < count; i = i + oneTimeRequests) {

        let promises = [];

        for (let j = 0; j < oneTimeRequests; j++) {
            promises.push(makeRequest(request, token));
        }

        await Promise.all(promises).then(responses => {

            for (let res of responses) {
                sum += res.time;

                for (let el of res.data.result) {
                    if (el.timeSeries.length === 0) {
                        fs.appendFileSync('./anomalies.txt', `no data sent for request:\n${JSON.stringify(request, null, 2)}\n`);
                    }
                }
            }

        });
    }

    return sum / count;
}

async function sameRequestTest(request, count, delayTimes, token, oneTimeRequests) {

    //
    // deleting element from database
    //

    await database.deleteTimeSeriesDatabase(['twelveHours', 'twentyFourHours', 'fiveWeek', 'fourYears', 'longPeriods']);
    await delay(10000);
    let mean = 0;

    fs.appendFileSync('./sameRequestTest.txt', `/////////////////////////////////////////////////////////\n`);

    for (let delayTime of delayTimes) {
        mean = await makeRequestInSuccession(request, token, count, oneTimeRequests);
        fs.appendFileSync('./sameRequestTest.txt', `tempo medio per ${count} richieste inviate a blocchi di ${oneTimeRequests} : ${mean}\n`);
        await delay(delayTime);
        fs.appendFileSync('./sameRequestTest.txt', `Dopo ${delayTime / 1000} secondi\n`);
    }

    mean = await makeRequestInSuccession(request, token, count, oneTimeRequests);

    fs.appendFileSync('./sameRequestTest.txt', `tempo medio per ${count} richieste inviate a blocchi di ${oneTimeRequests} : ${mean}\n`);
}

async function randomRequestTest(count, delayTimes, token, oneTimeRequests) {

    let anomaliesCount = 0;

    //
    // deleting element from database
    //

    await database.deleteTimeSeriesDatabase(['twelveHours', 'twentyFourHours', 'fiveWeek', 'fourYears', 'longPeriods']);

    let mean = 0;

    fs.appendFileSync('./randomRequestTest.txt', `/////////////////////////////////////////////////////////\n`);

    for (let delayTime of delayTimes) {

        let sum = 0;

        for (let i = 0; i < count; i = i + oneTimeRequests) {

            let promises = [];

            for (let j = 0; j < oneTimeRequests; j++) {

                const request = generateRequest(couples, functions, periods, granularities);

                promises.push(makeRequest(request, token).then(res => { return { time: res.time, data: res.data, request: request } }));

            }

            await Promise.all(promises).then(responses => {
                for (let res of responses) {
                    sum += res.time;
                    if (res.data.result)
                        for (let el of res.data.result) {
                            if (el.timeSeries.length === 0) {
                                fs.appendFileSync('./anomalies.txt', `nresponse:\n${JSON.stringify(res.data, null, 2)}\n for request:\n${JSON.stringify(res.request, null, 2)}\n`);
                                anomaliesCount++;
                            }
                        }
                }

            });
        }

        mean = sum / count;

        fs.appendFileSync('./randomRequestTest.txt', `tempo medio per ${count} richieste inviate a blocchi di ${oneTimeRequests} : ${mean}\n`);

        await delay(delayTime);

        fs.appendFileSync('./randomRequestTest.txt', `Dopo ${delayTime / 1000} secondi\n`);

    }

    let sum = 0;

    for (let i = 0; i < count; i = i + oneTimeRequests) {

        let promises = [];

        for (let j = 0; j < oneTimeRequests; j++) {

            const randomRequest = generateRequest(couples, functions, periods, granularities);

            promises.push(makeRequest(randomRequest, token));

        }

        await Promise.all(promises).then(responses => {
            for (let res of responses) {
                sum += res.time;
                if (res.data.result)
                    for (let el of res.data.result) {
                        if (el.timeSeries.length === 0) {
                            fs.appendFileSync('./anomalies.txt', `nresponse:\n${JSON.stringify(res.data, null, 2)}\n for request:\n${JSON.stringify(res.request, null, 2)}\n`);
                            anomaliesCount++;
                        }
                    }
            }

        });
    }

    mean = sum / count;

    fs.appendFileSync('./randomRequestTest.txt', `tempo medio per ${count} richieste inviate a blocchi di ${oneTimeRequests} : ${mean}\n`);

    console.log('anomaliesCount', anomaliesCount);

}

async function main() {
    const login = await send(loginRequest, 'login', '');
    const token = login.token;
    console.log('sameRequestTest iniziato');
    await sameRequestTest(request, 5, [1000, 15000, 30000], token, 1);
    await sameRequestTest(request, 250, [1000, 15000, 30000], token, 25);
    await sameRequestTest(request, 1000, [1000, 15000, 30000], token, 25);
    console.log('sameRequestTest terminato');
    console.log('randomRequestTest iniziato');
    await randomRequestTest(5, [1000, 15000, 30000], token, 1);
    await randomRequestTest(250, [1000, 15000, 30000], token, 25);
    console.log('randomRequestTest terminato');
}

main();
/*
async function try1(){
    const login = await send(loginRequest, 'login', '');
    const token = login.token;
    for (let i = 1; i < 21; i++) {
        const data = fs.readFileSync('.././load_test/post_body/' + i + '.txt');
        const request = JSON.parse(data);
        fs.appendFileSync('./try1.txt',JSON.stringify(request,null,2)+'\n');
        const json = await send(request, 'get', token);
        fs.appendFileSync('./try1.txt',JSON.stringify(json, null, 2)+ '\n'); 
        fs.appendFileSync('./try1.txt','//////////////////////\n');
    }
}*/