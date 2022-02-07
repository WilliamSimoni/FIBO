const { sum, max, min, mean } = require('mathjs');

function mergeTwoInvalidTimeSeries(timeSeries1, timeSeries2){
    const result = [];
    const length1 = timeSeries1.length;
    const length2 = timeSeries2.length;

    //i for timeSeries1 and j for timeSeries2
    let i = 0, j = 0;

    while (i < length1 && j < length2) {
        //console.log(i, j, length1, length2);
        const time1 = timeSeries1[i].time;
        const time2 = timeSeries2[j].time;
        if (time1 !== time2) {
            const maxTime = max(time1, time2);
            if (maxTime === time1) {
                j++;
            } else {
                i++;
            }
        } else {
            result.push({ time: time1 });
            i++; j++;
        }
    }

    return result;
}

function mergeTwoTimeSeries(timeSeries1, timeSeries2, aggregationFunction) {
    const result = [];

    const length1 = timeSeries1.length;
    const length2 = timeSeries2.length;

    //i for timeSeries1 and j for timeSeries2
    let i = 0, j = 0;


    while (i < length1 && j < length2) {
        //console.log(i, j, length1, length2);
        const time1 = timeSeries1[i].time;
        const time2 = timeSeries2[j].time;
        if (time1 !== time2) {
            const maxtime = max(time1, time2);
            if (maxtime === time1) {
                result.push(timeSeries1[i]);
                i++;
            } else {
                result.push(timeSeries2[j]);
                j++;
            }
        } else {
            const aggregated = aggregationFunction(timeSeries1[i].value, timeSeries2[j].value);
            result.push({ time: time1, value: aggregated });
            i++; j++;
        }
    }

    if (i < length1) {
        for (let t = i; t < length1; t++) {
            result.push(timeSeries1[t]);
        }
    }

    if (j < length2) {
        for (let t = j; t < length2; t++) {
            result.push(timeSeries2[t]);
        }
    }

    return result;

}

function mergeTimeSeries(timeSeries, aggregationFunction) {

    let result = timeSeries[0];

    for (let i = 1; i < timeSeries.length; i++) {
        result = mergeTwoTimeSeries(result, timeSeries[i], aggregationFunction);
    }

    return result;
}

function mergeInvalidTimeSeries(timeSeries) {
    let result = timeSeries[0];

    for (let i = 1; i < timeSeries.length; i++) {
        result = mergeTwoInvalidTimeSeries(result, timeSeries[i]);
    }

    return result;
}


exports.mergeTimeSeries = mergeTimeSeries;
exports.mergeInvalidTimeSeries = mergeInvalidTimeSeries;
exports.mergeTwoTimeSeries = mergeTwoTimeSeries;
exports.mergeTwoInvalidTimeSeries = mergeTwoInvalidTimeSeries;