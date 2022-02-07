const fetch = require('node-fetch');

const API_URL = `${process.env.CALCULATOR_PROT}://${process.env.CALCULATOR_HOST}:${process.env.CALCULATOR_PORT}/aggregate`;

const legalFunctions = [
    'sum',
    'mean',
    'max',
    'min'
]

async function aggrFun(aggrName, projectName, timeSeries, fleet, aggrFunPerGroup, periods, granularity, roundFactor){
    const request = {
        aggrFun: aggrName,
        projectName: projectName,
        timeSeries: timeSeries,
        fleet: fleet,
        aggrFunPerGroup: aggrFunPerGroup,
        periods: periods,
        granularity: granularity,
        roundFactor: roundFactor,
    };


    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
    };
    const response = await fetch(API_URL, options);
    const json = await response.json();

    return json;
}


exports.legalFunctions = legalFunctions;
exports.aggrFun = aggrFun;