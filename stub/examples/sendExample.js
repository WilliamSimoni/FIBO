const fetch = require('node-fetch');
const moment = require('moment');

function postBody(projectName, device, keyword, aggrFun, timePeriod, granularity, store) {
    const request = {
        projectName: projectName,
        device: device,
        keyword: keyword,
        aggregationFunction: aggrFun,
        timePeriod: timePeriod,
        granularity: granularity,
        store: store
    }
    return request;
}

async function send(request) {

    const api_url = `http://localhost:7777/login`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluQGVzZW1waW8uaXQiLCJwcm9qZWN0bmFtZSI6ImVzZW1waW8iLCJmbGVldHNaZG1JZHMiOlsiZmx0LTR1cml4dnVsa3d4ciIsImZsdC00dXJpeWpoc2hhcmsiXSwidXNlcmlkIjoiN2JhNzIxZjEtMTc1YS00MWQ2LTk0NWMtMDAxYWZmZmYxYTc3IiwiaWF0IjoxNTkxNzEwODM0LCJleHAiOjE1OTE3OTcyMzR9.aymkV2Xra4Wb-D1hFbEMU3Wg72arbbjqIdMke9m2bns'
        },
        body: JSON.stringify(request),
    };
    const response = await fetch(api_url, options);
    const json = await response.json();

    return json;
}


//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluQGVzZW1waW8uaXQiLCJwcm9qZWN0bmFtZSI6ImVzZW1waW8iLCJmbGVldHNaZG1JZHMiOlsiZmx0LTR1cml4dnVsa3d4ciIsImZsdC00dXJpeWpoc2hhcmsiXSwiZmxlZXRJZHMiOlsiNDZkYjc1YTMtNzkwNy00MzQxLWJhNWYtMTBkNjZlMWM3NWQwIiwiYjg3MGM1M2UtYzZlMC00ODhkLTkzYmItY2YzNDdkMzhkYzA0Il0sImlhdCI6MTU5MTQyODk1MiwiZXhwIjoxNTkxNTE1MzUyfQ.oSZx0QqXN7EvKkLGcDvIvGRorsPSar903iIS6hrfdy0
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicHJvamVjdG5hbWUiOiJwcm92YSIsImZsZWV0c1pkbUlkcyI6WyJmbHQtNHVyaXducnBsNHU2IiwiZmx0LTR1cml4dnVsa3d4ciIsImZsdC00dXJpeWpoc2hhcmsiXSwiZmxlZXRJZHMiOlsiOWZjNDI1ZjEtMTUxNC00OTFhLWI0YzQtMjdlOGI2YjBiODZiIiwiNTA3ZTM3MDktODliOS00ZjYyLTgwN2EtMDJiMzNmNzE1NDA4IiwiY2UzMTI5N2MtOGUwYS00ZGY3LTg0MzItYzBkN2ZlMGY4NGFkIl0sImlhdCI6MTU5MTQyOTg0MiwiZXhwIjoxNTkxNTE2MjQyfQ.nP1E3i-AdC3WZDDCh0gaFUVwo1-BUQRhFb28U7Dji8g
/*
start: moment.utc().subtract(2,'week').startOf('week').unix(),
    end: moment.utc().subtract(1,'week').startOf('week').unix(),
*/

const request = {
    projectName: 'esempio',
    timeSeries: [[
        { tag: "kitchen", value: "temp" },
        { tag: "kitchen", value: "humidity" },

    ]
    ],
    fleet: 'flt-4uriyjhshark',
    aggregationFunction: 'sum',
    aggrFunPerGroup: [ 'sum' ],
    timeRange: { key: 'day', number:  1 },
    unit: 's',
    granularity: { key: 'hour', number: 1 },
    store: true
}


const loginRequest = {
    username: 'admin@esempio.it',
    password: 'admin',
    projectName: 'esempio'
}


const start = Date.now();
send(loginRequest)
    .then((json) => {
        console.log(json); 
        if (json.result){
            for (let item of json.result){
                console.log(item.tags);
                console.log(item.values);
                console.log(item.timeSeries);
            }
        }
        console.log(Date.now() - start)
    })
    .catch(err => console.log(err));


async function tryFun(request) {
    while (true) {
        const start = Date.now();
        await send(loginRequest).then((json) => { console.log(json); console.log(Date.now() - start) }).catch(err => console.log(err));
    }
}