//
//aggregation functions
//

const coupleAggregationFun = require('./aggregateCouple');

const dataGroupAggregationFun = require('./aggregateDataGroup');

const { mean } = require('mathjs');

const { mergeTwoTimeSeries } = require('./internalAggregation');

//
// For create task
//

const { ThreadWorker } = require('poolifier')

//
// time manipulation
//

const { time, keyEnumeration} = require('../../custom-modules/time');

/**
 * @typedef DataGroup
 * @type {Object[]}
 * @property {string} aggrFun - internal aggregation function to apply to data.
 * @property {string[]} couples - list of index. index i is refered to i-th couple in structure couples
 */

/**
* @typedef Couple
* @type {Object[]}
* @property {string} tag - couple tag.
* @property {string} value - couple value.
*/


/**
 * aggregate data
 * @param {Object} data - data used by the worker to choose aggregation function and which contain data and periods.
 * @param {string} data.fname - aggregation function name
 * @param {DataGroup} data.dataGroup - array where every item contains internal aggregation function and couple indexes.
 * @param {Couple} data.couples - array of couple tag-value. 
 * @param {Object[]} data.data - data sent by ZDM for different periods. i-th element is about i-th period in data.period.
 * @param {Object[]}  data.periods - different periods of the main period.
 * @param {Object[]} mainPeriods
 * @param {Object[]}  data.backupData
 * @param {Object} granularity
 */

function aggregate(data) {
    let coupleAggregationCallback;
    let dataGroupAggregationCallback;


    switch (data.fname) {
        case 'sum': {
            coupleAggregationCallback = coupleAggregationFun.sum;
            dataGroupAggregationCallback = dataGroupAggregationFun.sum;
            break;
        }
        case 'mean': {
            coupleAggregationCallback = coupleAggregationFun.mean;
            dataGroupAggregationCallback = dataGroupAggregationFun.mean;
            break;
        }
        case 'max': {
            coupleAggregationCallback = coupleAggregationFun.max;
            dataGroupAggregationCallback = dataGroupAggregationFun.max;
            break
        }
        case 'min': {
            coupleAggregationCallback = coupleAggregationFun.min;
            dataGroupAggregationCallback = dataGroupAggregationFun.min;
            break;
        }
    }

    let aggregatedData = [];

    let dataGroupAggregation = [];

    let dividedMainPeriods = [];

    let p = 0;

    for (let period in data.periods) {

        dividedMainPeriods.push(time.createPeriods(data.mainPeriods[p].start, data.granularity.number, data.granularity.key, data.mainPeriods[p].end));

        let aggregationResult = [];

        let minNumber = 1;

        for (let couple of data.couples) {
            aggregationResult.push([]);
        }

        //keyEnumeration[data.granularity.key] === 0 if granularity.key = second
        if (data.roundFactor === 'second' && keyEnumeration[data.granularity.key] > 0) {
            data.roundFactor = 'minute';
        }

        if (data.granularity.key === 'second'){
            minNumber = data.granularity.number;
        }   

        for (let subperiod of data.periods[period]) {

            //
            // calculating min granularity aggregation for empty periods
            //

            const dividedPeriodMin = time.createPeriods(subperiod.start, minNumber, data.roundFactor, subperiod.end);
            const tmp = coupleAggregationCallback(data.dataGroup, subperiod.couples, data.data[`${subperiod.start}${subperiod.end}`], [dividedPeriodMin]);

            //
            // merge with previous results
            //

            let i = 0;
            for (let coupleIndex of subperiod.coupleIndexes) {
                aggregationResult[coupleIndex] = aggregationResult[coupleIndex].concat(tmp.couple[i][0].result);
                i++;
            }
        }

        //
        // merge new data with old data
        //

        for (let i = 0; i < data.couples.length; i++) {

            aggregationResult[i] = mergeTwoTimeSeries(aggregationResult[i], data.backupData[period][i].result, mean);
            
            const standardgranularity = Object.keys(keyEnumeration).filter(value => keyEnumeration[value] >= keyEnumeration[data.roundFactor] && keyEnumeration[value] <= keyEnumeration[data.granularity.key]);
            
            aggregatedData.push([]);

            for (let stdgran of standardgranularity) {

                const dividedPeriod = time.createPeriods(time.round(data.mainPeriods[p].start, stdgran), 1, stdgran, data.mainPeriods[p].end);

                aggregatedData[i].push(dataGroupAggregationCallback([{ aggrFun: data.aggrFun, couples: [ i ] }], aggregationResult, dividedPeriod));

            }
            
        }

        //
        // aggregate requested time series
        //

        dataGroupAggregation.push(dataGroupAggregationCallback(data.dataGroup, aggregationResult, dividedMainPeriods[p]));

        p++;
    }



    return { coupleAggregation: aggregatedData, dataGroupAggregation };
}

//
//export new thredWorker. ThreadWorker will be deleted after maxInactiveTime of inacrtivity.
//

module.exports = new ThreadWorker(aggregate, { maxInactiveTime: 60000 });