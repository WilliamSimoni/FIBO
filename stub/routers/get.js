const calculator = require(`../stub_modules/calculator`);
const { Database } = require('../../database/db');
const calculatorRules = require('../../calculator configuration/rules');

const moment = require('moment');

//Obtaining instance database
const database = new Database();

//For handling time mutations
const { time, definePeriod } = require(`../../custom-modules/time`);

//For validating request
const { validationResult, body } = require('express-validator');

const express = require('express');
const router = express.Router();

// sorted array

const SortedArray = require("sorted-array");

// merge functions

const merge = require('../stub_modules/merge');

const memoize = require("memoizee");

function insertSubPeriod(subPeriods, start, end, index) {
    const subPeriodItem = subPeriods.find(el => el.start === start && el.end === end);

    if (subPeriodItem) {

        if (!subPeriodItem.timeSeries.includes(index)) {
            subPeriodItem.timeSeries.push(index);
        }

    } else {

        subPeriods.push({ timeSeries: [index], start: start, end: end })

    }

    return subPeriods;
}

function addClientQueue(result, invalid, projectName, fleet, tag, value, aggrFun, intAggrFun, granularityKey, granularityNumber) {

    counter = 0;

    for (let payload of result) {
        database.queueData(projectName, granularityKey, granularityNumber, fleet, tag, value, payload.value, true, aggrFun, intAggrFun, payload.time);
        counter++;
    }

    if (result.length > 0) {
        for (let payload of invalid) {
            database.queueData(projectName, granularityKey, granularityNumber, fleet, tag, value, null, false, aggrFun, intAggrFun, payload.time);
            counter++;
        }
    }

    return counter;

}

const getHandler = async function (body) {

    let project = body.projectName;
    let timeSeries = body.timeSeries;
    let fleet = body.fleet;
    let aggrFun = body.aggregationFunction;
    let granularity = body.granularity;
    let store = body.store;
    let aggrFunPerGroup = body.aggrFunPerGroup;
    let period = body.period;

    //is aggrFunPerGroup is not sent then the internal aggregation is set equal to external aggregation Function
    if (!aggrFunPerGroup) {
        aggrFunPerGroup = [];
        for (let item of timeSeries) {
            aggrFunPerGroup.push(aggrFun);
        }
    }
    //
    // query database and searching missing data
    //

    const subPeriods = [];

    const databaseData = [];

    const promises = [];

    let result = [];

    for (i = 0; i < timeSeries.length; i++) {

        const item = timeSeries[i];

        //
        // creating ordered array of tags and values for the query to database
        //

        const { tags, values } = ((couples) => {
            const tags = new SortedArray([]);
            const values = new SortedArray([]);

            for (let couple of couples) {

                if (tags.search(couple.tag) == -1) {
                    tags.insert(couple.tag);
                }
                if (values.search(couple.value) == -1) {
                    values.insert(couple.value);
                }
            }

            return { tags: tags.array, values: values.array };

        })(item);

        result.push({ tags, values, timeSeries: [] });

        databaseData.push([]);

        promises.push(database.queryData(project, fleet, tags, values, aggrFun, granularity.key, granularity.number, period.start * 1000000000, period.end * 1000000000, aggrFunPerGroup[i]));
    }

    await Promise.all(promises).then(value => {

        for (let i = 0; i < value.length; i++) {

            const query = value[i];

            //
            // if it finds something then result.length > 0
            //

            if (query.length === 0) {

                insertSubPeriod(subPeriods, period.start, period.end, i);

            } else {
                //
                // find empty periods
                //

                let moment = period.start;

                let p = query.length - 1;

                while (moment <= period.end) {

                    //
                    // nomore data but the period is not finisced yet
                    //

                    if (p === -1) {
                        insertSubPeriod(subPeriods, time.add(query[0].time, granularity.number, granularity.key), period.end, i);
                        break;
                    }

                    if (query[p].isValid) {
                        databaseData[i].unshift({ time: query[p].time, value: query[p].value });
                    }
                    //
                    // moment is before first data contained in database
                    //

                    if (moment < query[p].time) {
                        insertSubPeriod(subPeriods, moment, query[p].time - 1, i);
                        p--;
                        moment = (p >= 0) ? query[p].time : null;
                        continue;
                    }

                    p--;
                    moment = time.add(moment, granularity.number, granularity.key);
                }

            }
        }
    });

    //
    // put subperiod with same groups of data in the same subPeriodsOrganised
    //

    let subPeriodsOrganised = {};

    for (let period of subPeriods) {
        if (!subPeriodsOrganised[period.timeSeries.toString()])
            subPeriodsOrganised[period.timeSeries.toString()] = [];
        subPeriodsOrganised[period.timeSeries.toString()].push(period);
    }

    let counter = 0;

    //
    // requesting new data to calculator and storing them in time series database
    //

    const promises2 = [];

    for (let group in subPeriodsOrganised) {

        const subperiods = subPeriodsOrganised[group];

        let timeSeriesQuery = [];

        let aggrFunPerGroupQuery = [];

        for (let index of subperiods[0].timeSeries) {
            timeSeriesQuery.push(timeSeries[index]);
            aggrFunPerGroupQuery.push(aggrFunPerGroup[index]);
        }

        let periods = [];

        for (let subperiod of subperiods) {
            periods.push({ start: subperiod.start, end: subperiod.end });
        }

        const res = await calculator.aggrFun(aggrFun, project, timeSeriesQuery, fleet, aggrFunPerGroupQuery, periods, granularity, period.minRoundFactor);

        //
        //calculator error handling
        //

        if (res.status !== 200) {
            return { status: 421, errors: [res.error] };
        }

        //
        // merging with old data
        //

        for (let j = 0; j < subperiods[0].timeSeries.length; j++) {

            const item = res.result[j];

            for (let el of item) {

                const index = subperiods[0].timeSeries[j];

                result[index].timeSeries = [...result[index].timeSeries, ...el.result];

                // if timeseries is NOT standard
                if ((result[index].tags.length > 1 || result[index].values.length > 1 || granularity.number !== 1) && store === true) {
                    counter += addClientQueue(el.result, el.invalid, project, fleet, result[index].tags, result[index].values, aggrFun, aggrFunPerGroup[index], granularity.key, granularity.number);
                }
            }
        }

    }

    for (let i = 0; i < timeSeries.length; i++) {
        result[i].timeSeries = merge.mergeTwoTimeSeries(result[i].timeSeries, databaseData[i]);
    }

    //
    // calculating next Request time range
    //

    const nextRequestTime = time.add(period.end, granularity.number, granularity.key) - time.now();

    try {
        if (counter > 0) {
            database.writeData(null, granularity.key);
        }
    } catch (err) {
        console.error(err);
    }

    return { status: 200, granularity, start: moment.unix(period.start).toISOString(), end: moment.unix(period.end).toISOString(), nextRequestTime, result };

}

const memoizedGetHandler = memoize(getHandler, {
    promise: true,
    max: 1000,
    maxAge: 15000,
    normalizer: function (args) {
        // args is arguments object as accessible in memoized function
        return JSON.stringify(args[0]);
    },
    primitive: true
});

router.post('/', [
    body('projectName')
        .exists().withMessage('Project Name not defined').bail()
        .isString().withMessage('Project Name must be a string').bail()
        .customSanitizer(projectName => projectName.replace(/\s+/g, ''))
        .isLength({ min: 1 }).withMessage('Project Name is not valid').bail()
        .customSanitizer(projectName => projectName.replace(/\w+/g, (match) => match.toLowerCase()))
        .custom((projectName, { req }) => {
            if (projectName !== req.decoded.projectname) {
                throw new Error('projectName is not valid');
            }
            return true;
        }),
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
        .optional()
        .isArray({ min: 1 }).withMessage('aggrFunPerGroup is not an array')
        .custom((funGroups, { req }) => {
            for (let fun of funGroups) {
                if (!calculatorRules.legalFunctions.includes(fun))
                    throw new Error('function not yet supported');
            }
            if (Array.isArray(req.body.timeSeries)) {
                if (funGroups.length !== req.body.timeSeries.length) {
                    throw new Error('aggrFunPerGroup length is not the same as timeSeries');
                }
            }
            return true;
        }),
    body('fleet')
        .exists().withMessage('fleet not defined').bail()
        .isString().withMessage('fleet must be a string').bail()
        .customSanitizer(fleet => fleet.replace(/\s+/g, ''))
        .isLength({ min: 1 }).withMessage('fleet is not valid'),
    body('aggregationFunction')
        .exists().withMessage('Aggregation Function name not defined').bail()
        .isString().withMessage('Aggregation Function name is not valid').bail()
        .customSanitizer(aggrFunName => aggrFunName.replace(/\W+/g, ''))
        .custom(aggrFunName => {
            if (!calculatorRules.legalFunctions.includes(aggrFunName)) {
                throw new Error('Aggregation Function is not supported yet');
            }
            return true;
        }),
    body('timeRange')
        .optional()
        .custom(timeRange => {
            if (typeof timeRange.key !== 'string' && typeof timeRange.number !== 'number') {
                throw new Error('Aggregation Function code is not valid');
            }
            if (timeRange.number <= 0) {
                throw new Error('timeRange number must be > 0');
            }
            return true;
        }).bail()
        .customSanitizer(timeRange => {
            timeRange.key = timeRange.key.replace(/\W+/g, '');
            return timeRange;
        })
        .custom((timeRange) => {
            if (!(/\b(second|minute|hour|day|week|month|year)\b/g.test(timeRange.key))) {
                throw new Error('timeRange key is not valid');
            }
            return true;
        }),
    body('start')
        .if(body('timeRange').exists())
        .optional()
        .isInt({ min: 0 }).withMessage('start must be a integer number which represent timestamp')
        .if(body('unit').exists())
        .customSanitizer((start, { req }) => {
            switch (req.body.unit) {
                case 'n': return Math.floor(start / 1000000000);
                case 'm': return Math.floor(start / 1000000);
                case 'M': return Math.floor(start / 1000);
                case 's': return start;
                default: return start;
            }
        }),
    body('start')
        .if(body('timeRange').not().exists())
        .exists().withMessage('if you do not send timeRange you must send start').bail()
        .isInt({ min: 0 }).withMessage('start must be a integer number')
        .customSanitizer((start, { req }) => {
            switch (req.body.unit) {
                case 'n': return Math.floor(start / 1000000000);
                case 'm': return Math.floor(start / 1000000);
                case 'M': return Math.floor(start / 1000);
                case 's': return start;
                default: return start;
            }
        }),
    body('end')
        .optional()
        .exists(body('start')).withMessage('end can be sent only with start defined').bail()
        .custom((end, { req }) => {
            if (typeof end === 'number') {
                if (end <= req.body.start) {
                    throw new Error('end must be a number > start');
                }
            } else {
                throw new Error('end must be a number > start');
            }
            return true;
        })
        .customSanitizer((end, { req }) => {
            switch (req.body.unit) {
                case 'n': return Math.floor(end / 1000000000);
                case 'm': return Math.floor(end / 1000000);
                case 'M': return Math.floor(end / 1000);
                case 's': return end;
                default: return end;
            }
        }),
    body('unit')
        .if(body('start').exists())
        .isString().withMessage('unit must be a string').bail()
        .matches(/(n|m|M|s)/).withMessage('unit sent is not valid'),
    body('granularity')
        .exists().withMessage('granularity not defined').bail()
        .custom(granularity => {
            if (typeof granularity.key !== 'string' && typeof granularity.number !== 'number') {
                throw new Error('granularity is not valid');
            }
            if (granularity.number <= 0) {
                throw new Error('granularity number must be > 0');
            }
            return true;
        }).bail()
        .customSanitizer(granularity => {
            granularity.key = granularity.key.replace(/\W+/g, '');
            return granularity;
        })
        .custom((granularity) => {
            if (!(/\b(second|minute|hour|day|week|month|year)\b/g.test(granularity.key))) {
                throw new Error('granularity key is not valid');
            }
            return true;
        }),
    body('store')
        .exists().withMessage('store is not defined').bail()
        .custom((store) => {
            if (typeof store !== 'boolean') {
                throw new Error('store must be boolean true or false');
            }
            return true;
        })
], async (request, response) => {
    try {
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
        console.log(request.body);
        let body = request.body;
        const fleet = body.fleet;
        const granularity = body.granularity;
        const timeRange = body.timeRange;
        const start = body.start;
        const end = body.end;

        //
        // check if the user can access the indicated fleet
        //

        if (!request.decoded.fleetsZdmIds.includes(fleet)) {
            return response.status(419).json({
                status: 419,
                errors: ['you cannot access to this fleet']
            });
        }

        //
        // defining period e min granularity
        //
        try {
            period = definePeriod(granularity, timeRange, start, end);
        } catch (err) {
            return response.status(400).json({ status: 400, errors: [err.message] });
        }

        body.granularity = period.granularity;

        body.period = period;

        //
        // deleting time parameters from body
        //
        delete body.timeRange;
        delete body.start;
        delete body.end;

        const res = await memoizedGetHandler(body);

        return response.status(res.status).json(res);

    } catch (err) {
        console.error(err);
        response.status(400).json({ status: 400, errors: ['Something went wrong'] });
    }
}
);

exports.get = router;
