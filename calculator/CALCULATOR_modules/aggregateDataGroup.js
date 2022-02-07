
const { sum, max, min, mean } = require('mathjs');

const { mergeTimeSeries, mergeInvalidTimeSeries } = require('./internalAggregation');

//
// sum
//


function sumFun(dataGroups, data, periods) {
    
    let aggregation = [];

    for (let i = 0; i < data.length; i++) {

        const item = data[i];

        let sum = null;

        let p = 0;

        aggregation.push({ result: [], invalid: [] });

        //
        // iterate all periods for every couple
        //

        for (let j = periods.length - 1; j >= 0; j--) {

            //
            //aggregate all data of one period
            //

            let found = false;
            let counter = 0;

            //console.log('ciak si gira');
            while (p < item.length && !found) {
                //console.log(item[p].time, periods[j],item[p].time >= periods[j] );
                if (item[p].time >= periods[j]) {
                    counter++;
                    if (!sum) {
                        sum = 0;
                    }
                    sum += item[p].value;

                    p++;
                } else {
                    found = true;
                }
            }

            //console.log('counter:',counter);
            //console.log('somma:',sum)

            //
            // if at least one element is in the j-th period then ElCounter != null
            //

            if (sum) {
                aggregation[i].result.push({ time: periods[j], value: sum });
                sum = null;
            } else {
                aggregation[i].invalid.push({ time: periods[j] });
            }
        }

    }

    //
    // aggregate for data group
    //

    return internalAggregation(aggregation, dataGroups);

}

//
// mean
//

function meanFun(dataGroups, data, periods) {

    let aggregation = [];

    for (let i = 0; i < data.length; i++) {

        const item = data[i];

        let sum = 0;
        let elCounter = null;

        let p = 0;

        aggregation.push({ result: [], invalid: [] });

        //
        // iterate all periods for every couple
        //

        for (let j = periods.length - 1; j >= 0; j--) {

            //
            //aggregate all data of one period
            //

            let found = false;
            while (p < item.length && !found) {

                if (item[p].time >= periods[j]) {

                    sum += item[p].value;
                    if (!elCounter) {
                        elCounter = 0;
                    }
                    elCounter++;

                    p++;
                } else {
                    found = true;
                }
            }

            //
            // if at least one element is in the j-th period then ElCounter != null
            //

            if (elCounter) {
                const mean = sum / elCounter;
                aggregation[i].result.push({ time: periods[j], value: mean });
                sum = 0;
                elCounter = null;
            } else {
                aggregation[i].invalid.push({ time: periods[j] });
            }
        }

    }

    //
    // aggregate for data group
    //

    return internalAggregation(aggregation, dataGroups);

}


//
// min
//

function minFun(dataGroups, data, periods) {

    let aggregation = [];

    for (let i = 0; i < data.length; i++) {

        const item = data[i];

        let min = null;

        let p = 0;

        aggregation.push({ result: [], invalid: [] });

        //
        // iterate all periods for every couple
        //

        for (let j = periods.length - 1; j >= 0; j--) {

            //
            //aggregate all data of one period
            //

            let found = false;

            while (p < item.length && !found) {

                if (item[p].time >= periods[j]) {
                    if (!min) {
                        min = item[p].value;
                    } else {
                        min = (item[p].value < min) ? item[p].value : min; 
                    }

                    p++;
                } else {
                    found = true;
                }
            }

            //
            // if at least one element is in the j-th period then ElCounter != null
            //

            if (min) {
                aggregation[i].result.push({ time: periods[j], value: min });
                min = null;
            } else {
                aggregation[i].invalid.push({ time: periods[j] });
            }
        }

    }

    //
    // aggregate for data group
    //

    return internalAggregation(aggregation, dataGroups);

}

function maxFun(dataGroups, data, periods) {

    let aggregation = [];

    for (let i = 0; i < data.length; i++) {

        const item = data[i];

        let max = null;

        let p = 0;

        aggregation.push({ result: [], invalid: [] });

        //
        // iterate all periods for every couple
        //

        for (let j = periods.length - 1; j >= 0; j--) {

            //
            //aggregate all data of one period
            //

            let found = false;

            while (p < item.length && !found) {

                if (item[p].time >= periods[j]) {
                    if (!max) {
                        max = item[p].value;
                    } else {
                        max = (item[p].value > max) ? item[p].value : max; 
                    }

                    p++;
                } else {
                    found = true;
                }
            }

            //
            // if at least one element is in the j-th period then ElCounter != null
            //

            if (max) {
                aggregation[i].result.push({ time: periods[j], value: max });
                max = null;
            } else {
                aggregation[i].invalid.push({ time: periods[j] });
            }
        }

    }

    //
    // aggregate for data group
    //

    return internalAggregation(aggregation, dataGroups);

}

function internalAggregation(tmp, dataGroups) {
    let dataGroupAggregationResult = [];

    for (let i = 0; i < dataGroups.length; i++) {

        dataGroupAggregationResult.push({ result: [], invalid: [] });

        let aggrFunCallBack = sum;

        switch (dataGroups[i].aggrFun) {
            case 'sum': aggrFunCallBack = sum; break;
            case 'min': aggrFunCallBack = min; break;
            case 'max': aggrFunCallBack = max; break;
            case 'mean': aggrFunCallBack = mean; break;
        }

        let dataGroupSeriesResult = [];
        let dataGroupSeriesInvalid = [];

        for (let couple of dataGroups[i].couples) {
            dataGroupSeriesResult.push(tmp[couple].result);
            dataGroupSeriesInvalid.push(tmp[couple].invalid);
        }

        dataGroupAggregationResult[i].result = mergeTimeSeries(dataGroupSeriesResult, aggrFunCallBack);
        dataGroupAggregationResult[i].invalid = mergeInvalidTimeSeries(dataGroupSeriesInvalid);

    }

    return dataGroupAggregationResult;
}

exports.mean = meanFun;
exports.sum = sumFun;
exports.min = minFun;
exports.max = maxFun;