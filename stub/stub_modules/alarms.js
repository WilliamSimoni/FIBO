const fetch = require('node-fetch');

const API_URL = `${process.env.ALARM_FINDER_PROT}://${process.env.ALARM_FINDER_HOST}:${process.env.ALARM_FINDER_PORT}`;

async function addAlarm(projectName){
    const call_url = `${API_URL}/alarm/addproject`;

    const request = {
        projectName: projectName,
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
    };

    const response = await fetch(call_url, options);

    const json = await response.json();

    console.log(json);

    return json;
}

async function deleteAlarm(projectName){
    const call_url = `${API_URL}/alarm/deleteproject`;
    const request = {
        projectName: projectName,
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
    };

    const response = await fetch(call_url, options);

    const json = await response.json();

    return json;
}

exports.addAlarm = addAlarm;
exports.deleteAlarm = deleteAlarm;