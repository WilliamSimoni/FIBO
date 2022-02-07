const rules = require('../../calculator configuration/rules');

//
//Get data from ZDM
//

const { IoTData } = require('../../custom-modules/getIotData');

const iotData = new IoTData();

//
//For validating request
//

const { validationResult, body } = require('express-validator');
const { time, keyEnumeration, getEnumerationKey } = require('../../custom-modules/time');

//express
const express = require('express');
const router = express.Router();

//
// errors class
//

const error = require('../../custom-modules/errors');

//
//Thread Pool for aggregation
//

const { DynamicThreadPool } = require('poolifier');

const pool = new DynamicThreadPool(2, 10,
    __dirname + '/../CALCULATOR_modules/worker.js',
    {
        errorHandler: (e) => console.error(e)
    }
);

//
// Database InfluxDb
//

const { Database } = require('../../database/db');
const database = new Database();

//
//getting different database clients
//

const databaseClients = database.getAllTimeSeriesClients();

const clientCounters = { minute: 0, hour: 0, day: 0, year: 0 };

function addClientQueue(result, invalid, projectName, fleet, tag, value, aggrFun, granularityKey) {

    for (let payload of result) {
        database.queueData(projectName, granularityKey, 1, fleet, [tag], [value], payload.value, true, aggrFun, null, payload.time);
        clientCounters[granularityKey]++;
    }

    if (result.length > 0) {
        for (let payload of invalid) {
            database.queueData(projectName, granularityKey, 1, fleet, [tag], [value], null, false, aggrFun, null, payload.time);
        }
    }

}

function insertSubPeriod(subPeriods, start, end, couple, couples, mainPeriodStart) {

    const subPeriodItem = subPeriods[mainPeriodStart].find(el => el.start === start && el.end === end);

    if (subPeriodItem) {

        if (subPeriodItem.couples.some(el => el.tag === couple.tag && el.value === couple.value)) {
            const coupleIndex = couples.findIndex(el => el.tag === couple.tag && el.value === couple.value);
            subPeriodItem.couples.push(couple);
            subPeriodItem.coupleIndexes.push(coupleIndex);
        }

    } else {
        const coupleIndex = couples.findIndex(el => el.tag === couple.tag && el.value === couple.value);
        subPeriods[mainPeriodStart].push({ couples: [couple], start: start, end: end, coupleIndexes: [coupleIndex]});
    }

}

router.post('/', [
    body('aggrFun')
        .isString().bail()
        .isLength({ min: 1 }).bail()
        .custom(name => {
            if (!rules.legalFunctions.includes(name)) {
                return false;
            } else {
                return true;
            }
        }),
    body('projectName')
        .isString().bail()
        .isLength({ min: 1 }),
    body('timeSeries')
        .exists().withMessage('timeSeries not defined').bail()
        .isArray({ min: 1 }).withMessage('timeSeries is not valid').bail()
        .custom(timeSeries => {
            for (let item of timeSeries) {
                if (!Array.isArray(item)) {
                    throw new Error('an item in timeSeries is not an array');
                }
                if (item.length === 0) {
                    throw new Error('an item in timeSeries is an empty array');
                }
                for (let couple of item) {
                    if (!couple.value || !couple.tag) {
                        throw new Error('an item in timeSeries contains invalid couple (tag,value)');
                    }
                    if (typeof couple.value !== 'string' || typeof couple.tag !== 'string') {
                        throw new Error('an item in timeSeries contains invalid couple (tag,value)');
                    }
                }
            }
            return true;
        }),
    body('aggrFunPerGroup')
        .exists().withMessage('aggrFunPerGroup not defined')
        .isArray({ min: 1 }).withMessage('aggrFunPerGroup is not an array')
        .custom((funGroups, { req }) => {
            for (let fun of funGroups) {
                if (!rules.legalFunctions.includes(fun))
                    throw new Error('function not yet supported');
            }
            if (Array.isArray(req.body.timeSeries)) {
                if (funGroups.length !== req.body.timeSeries.length) {
                    throw new Error('aggrFunPerGroup length is not the same as timeSeries');
                }
            }
            return true;
        }),
    body('roundFactor')
        .isString(),
    body('fleet')
        .isString(),
    body('periods')
        .isArray({ min: 1 }).bail()
        .custom(periods => {
            for (let period of periods) {
                if (!period.start || !period.end) {
                    return false;
                }
            }
            return true;
        }).withMessage('period not valid'),
    body('granularity')
        .custom(granularity => {
            if (!granularity.key || !granularity.number) {
                return false;
            }
            return true;
        }).withMessage('granularity is no valid')
], async (request, response) => {

    //handle validation error
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        const errArray = errors.array();
        let errResponse = [];
        for (err of errArray) {
            errResponse.push(err.msg);
        }
        return response.status(400).json({ status: 400, errors: errResponse });
    }

    try {

        let {
            aggrFun,
            projectName,
            timeSeries,
            aggrFunPerGroup,
            fleet,
            periods,
            granularity,
            roundFactor
        } = request.body;

        //
        // array of object {tag: value: }. It represent the set of couples (tag, value) which are contained in the Time Series Object sent by Client.
        //

        let couples = [];

        //
        // array of Object, i-th element has property aggrFun relative to i-th aggregation in aggrFunPerGrouo
        // and has property couple relative to i-th array in Time Series Object. Each element in couple is a numeric index.
        //

        let dataGroup = [];

        for (let i = 0; i < timeSeries.length; i++) {

            dataGroup[i] = { aggrFun: aggrFunPerGroup[i], couples: [] };

            for (let couple of timeSeries[i]) {

                if (!couples.some(el => el.tag === couple.tag && el.value === couple.value)) {
                    couples.push(couple);
                }

                dataGroup[i].couples.push(couples.findIndex(el => el.tag === couple.tag && el.value === couple.value));

            }
        }
        
        //
        // read from database
        //

        //keyEnumeration[data.granularity.key] === 0 if granularity.key = second
        if (roundFactor === 'second' && keyEnumeration[granularity.key] > 0) {
            roundFactor = 'minute';
        }

        let roundFactorEnumarationValue = keyEnumeration[roundFactor];

        let databaseDataCouple = {};

        let subPeriods = {};


        if (granularity.key !== 'second') {

            let promises = [];

            for (let period of periods) {

                databaseDataCouple[period.start] = [];

                subPeriods[period.start] = [];

                //
                // read existing data from database
                //

                for (let couple of couples) {
                    promises.push(database.queryStandardData(
                        databaseClients[(roundFactorEnumarationValue > 3) ? 4 : (roundFactorEnumarationValue)],
                        projectName, fleet, couple.tag, couple.value, aggrFun, roundFactor, period.start * 1000000000, period.end * 1000000000
                    ));

                    databaseDataCouple[period.start].push({ result: [], invalid: [] });
                }
            }

            await Promise.all(promises).then(value => {

                for (let i = 0; i < periods.length; i++) {

                    for (let j = 0; j < couples.length; j++) {

                        const query = value[j + i * couples.length];

                        const period = periods[i];

                        const couple = couples[j];

                        if (query.length === 0) {

                            insertSubPeriod(subPeriods, period.start, period.end, couple, couples, period.start);

                        } else {

                            let moment = period.start;

                            let p = query.length - 1;

                            while (moment <= period.end) {

                                //
                                // nomore data but the period is not finisced yet
                                //

                                if (p === -1) {
                                    insertSubPeriod(subPeriods, time.add(query[0].time, granularity.number, granularity.key), period.end, couple, couples, period.start);
                                    break;
                                }

                                if (query[p].isValid) {
                                    databaseDataCouple[period.start][j].result.unshift({ time: query[p].time, value: query[p].value });
                                } else {
                                    databaseDataCouple[period.start][j].invalid.unshift({ time: query[p].time, value: null });
                                }

                                //
                                // moment is before first data contained in database
                                //

                                if (moment < query[p].time) {
                                    insertSubPeriod(subPeriods, moment, query[p].time - 1, couple, couples, period.start);
                                    p--;
                                    moment = (p >= 0) ? query[p].time : null;
                                    continue;
                                }

                                p--;
                                moment = time.add(moment, 1, roundFactor);

                            }

                        }
                    }

                }

            });
        } else {
            for (let period of periods) {
                databaseDataCouple[period.start] = [];
                subPeriods[period.start] = [];
                for (let couple of couples) {
                    databaseDataCouple[period.start].push({ result: [], invalid: [] });
                    insertSubPeriod(subPeriods, period.start, period.end, couple, couples, period.start);
                }
            }
        }

        let data = {};

        //
        // empty array of promises
        //

        let promises = [];

        //
        // fetching data from ZDM
        //

        for (let period in subPeriods) {

            for (let subperiod of subPeriods[period]) {

                const queryTags = ((couples) => {
                    let result = [];
                    for (let couple of couples) {
                        if (!result.includes(couple.tag)) {
                            result.push(couple.tag);
                        }
                    }
                    return result;
                })(subperiod.couples);

                promises.push(iotData.getData(projectName, queryTags, [fleet], subperiod.start, subperiod.end, 2));

            }
        }



        //
        // waiting for ZDM response
        //

        await Promise.all(promises).then(value => {

            let p = 0;

            for (let period in subPeriods) {

                for (let subperiod of subPeriods[period]) {

                    const response = value[p].result;

                    p++;

                    try {
                        if (!response) {

                            throw new error.NothingFoundError('nothing found');

                        } else {

                            data[`${subperiod.start}${subperiod.end}`] = response;

                        }
                    } catch (err) {
                        if (!(err instanceof error.NothingFoundError)) {
                            throw err;
                        }
                        data[`${subperiod.start}${subperiod.end}`] = [];
                    }

                }

            }

        });


        //
        // aggregate data
        //

        const aggregatedData = await pool.execute({
            fname: aggrFun,
            dataGroup: dataGroup,
            couples: couples,
            data: data,
            periods: subPeriods,
            mainPeriods: periods,
            backupData: databaseDataCouple,
            granularity: granularity,
            roundFactor: roundFactor
        })

        //console.log(request.body);
        //console.log(aggregatedData.coupleAggregation);

        let result = [];

        for (let j = 0; j < dataGroup.length; j++) {

            result.push([]);

            //
            // selecting tags and value for the data group
            //

            let tags = [];
            let values = [];

            for (let couple of dataGroup[j].couples) {
                tags.push(couples[couple].tag);
                values.push(couples[couple].value);
            }

            //  
            // merging different periods in one time Series
            //

            for (let i = 0; i < periods.length; i++) {
                result[j].push({ tags, values, result: aggregatedData.dataGroupAggregation[i][j].result, invalid: aggregatedData.dataGroupAggregation[i][j].invalid });
            }
        }

        //console.log(request.body,result);

        response.status(200).json({ status: 200, result });

        //
        // writing standard results on db
        //

        if (roundFactor === 'second'){
            return;
        }

        try {
            const standardgranularity = Object.keys(keyEnumeration).filter(value => keyEnumeration[value] >= keyEnumeration[roundFactor] && keyEnumeration[value] <= keyEnumeration[granularity.key]);
            //console.log(standardgranularity);
            for (let period in subPeriods) {
                //console.log(couples, period);
                for (let i = 0; i < subPeriods[period].length; i++) {

                    for (let t = 0; t < couples.length; t++) {

                        const couple = couples[t];

                        const subperiod = subPeriods[period][i];

                        let p = 0;

                        for (let stdgran of standardgranularity) {

                            const filteredResult = aggregatedData.coupleAggregation[t][p][0].result.filter(el => {
                                return el.time <= subperiod.end && el.time >= subperiod.start
                            })

                            //console.log('result',aggregatedData.coupleAggregation[t][p].length);
                            const filteredInvalid = aggregatedData.coupleAggregation[t][p][0].invalid.filter(el => {
                                return el.time <= subperiod.end && el.time >= subperiod.start
                            })

                            //console.log('invalid', aggregatedData.coupleAggregation[t][p][0].invalid);
                            addClientQueue(filteredResult, filteredInvalid, projectName, fleet, couple.tag, couple.value, aggrFun, stdgran);

                            p++;
                        }

                    }
                }
            }

            for (let stdgran of standardgranularity) {
                if (clientCounters[stdgran] > 0) {
                    await database.writeData(null, stdgran);
                    clientCounters[stdgran] = 0;
                }
            }


        } catch (err) {
            console.error(err);
            console.error('err', request.body);
        }

    } catch (err) {
        if (!(err instanceof error.TooMuchRetriesError || err instanceof error.ProjectNotExistError || err instanceof error.FleetNotExistError)) {
            console.error(err);
        }

        if (err instanceof error.TooMuchRetriesError) {
            return response.status(401).json({ status: 401, error: err.message });
        }

        if (err instanceof error.FleetNotExistError) {
            return response.status(402).json({ status: 402, error: err.message });
        }

        return response.status(400).json({ status: 400, error: 'something went wrong' });
    }

});


exports.aggregator = router;