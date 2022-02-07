const moment = require('moment');

const { divide } = require('mathjs');

class TimeError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

const timeConverter = {
    /**
 * Convert in second
 * @param {number} total - timestamp to be changed
 * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
 */

    convertSecond(total, key) {
        switch (key) {
            case ('second'): return total;
            case ('minute'): return total * 60;
            case ('hour'): return total * 3600;
            case ('day'): return total * 86400;
            case ('week'): return total * 604800;
            case ('month'): return total * 2629743;     //30.44 days
            case ('year'): return total * 31556926;     // 365 days
            default: return -1;
        }
    },

    /**
 * Convert in minute
 * @param {number} total - timestamp to be changed
 * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
 */

    convertMinute(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return total;
            case ('h'): return total * 60;
            case ('d'): return total * 1440;
            case ('w'): return total * 10080;
            case ('M'): return total * 43200;
            case ('y'): return total * 518400;
            default: return -1;
        }
    },

    /**
* Convert in hour
* @param {number} total - timestamp to be changed
* @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
*/

    convertHour(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return -1;
            case ('h'): return total;
            case ('d'): return total * 24;
            case ('w'): return total * 168;
            case ('M'): return total * 720;
            case ('y'): return total * 8640;
            default: return -1;
        }
    },

    /**
* Convert in minute
* @param {number} total - timestamp to be changed
* @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
*/

    convertDay(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return -1;
            case ('h'): return -1;
            case ('d'): return total;
            case ('w'): return total * 7;
            case ('M'): return total * 30;
            case ('y'): return total * 365;
            default: return -1;
        }
    },

    /**
* Convert in week
* @param {number} total - timestamp to be changed
* @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
*/

    convertWeek(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return -1;
            case ('h'): return -1;
            case ('d'): return -1;
            case ('w'): return total;
            case ('M'): return total * 4;
            case ('y'): return total * 52;
            default: return -1;
        }
    },

    /**
* Convert in month
* @param {number} total - timestamp to be changed
* @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
*/

    convertMonth(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return -1;
            case ('h'): return -1;
            case ('d'): return -1;
            case ('w'): return -1;
            case ('M'): return total;
            case ('y'): return total * 12;
            default: return -1;
        }
    },

    /**
* Convert in year
* @param {number} total - timestamp to be changed
* @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
*/

    convertYear(total, key) {
        switch (key) {
            case ('s'): return -1;
            case ('m'): return -1;
            case ('h'): return -1;
            case ('d'): return -1;
            case ('w'): return -1;
            case ('M'): return -1;
            case ('y'): return total;
            default: return -1;
        }
    }
}

const keyEnumeration = {
    'second': 0,
    'minute': 1,
    'hour': 2,
    'day': 3,
    'week': 4,
    'month': 5,
    'year': 6
}

/**
 * return key associated to number in keyEnumeration
 * @param {number} number 
 * @returns string associated to number in keyEnumeration or undefined if number is not valid
 */

function getEnumerationKey(number) {
    switch (number) {
        case 0: return 'second';
        case 1: return 'minute';
        case 2: return 'hour';
        case 3: return 'day';
        case 4: return 'week';
        case 5: return 'month';
        case 6: return 'year';
    }
    return;
}

const time = {

    /**
     * Return Current Date and Time in timestamp in UTC timezone
     */
    now() {
        return moment.utc().unix();
    },

    /**
     * Mutates the timestamp by subtracting time.
     * @param {number} timestamp - moment from which to subtract
     * @param {number} number
     * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
     */

    subtract(timestamp, number, key) {
        return moment.unix(timestamp).utc().subtract(number, key).unix();
    },

    /**
     * Mutates the timestamp by adding time.
     * @param {number} timestamp - moment from which to subtract
     * @param {number} number
     * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
     */

    add(timestamp, number, key) {
        return moment.unix(timestamp).utc().add(number, key).unix();
    },

    /**
     * Mutates the timestamp by setting it to the start of a unit of time.
     * @param {number} timestamp - timestamp to be changed
     * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
     */

    round(timestamp, key) {
        return moment.unix(timestamp).utc().startOf(key).unix();
    },

    /**
     * Mutates the timestamp by adding time and rounding to the nearest moment to end
     * @param {number} start - moment from which start
     * @param {number} number
     * @param {string} key - unit of time ('second', 'minute', 'hour', 'day, 'month', 'year')
     * @param {number} start - moment from which end
     */

    nearestMoment(start, number, key, end) {
        let startMoment = start;
        while (startMoment <= end) {
            startMoment = this.add(startMoment, number, key);
        }
        return time.subtract(startMoment, number, key);
    },

    nearestMomentFromEnd(end, number, key, start) {
        let endMoment = end;
        while (endMoment >= start) {
            endMoment = this.subtract(endMoment, number, key);
        }
        return endMoment;
    },

    createPeriods(start, number, key, end) {
        let moment = start;
        let timestamps = [];
        while (moment < end) {
            timestamps.push(moment);
            moment = this.add(moment, number, key);
        }
        return timestamps;
    }
}

const rounder = {

    /**
     * Return following rules written in FIBO doc
     * @param {number} number - number in second
     */
    roundPerGranularity(number) {
        if (number < 60) return 'minute';
        if (number < 3600) return 'hour';
        if (number < 604800) return 'day';
        if (number < 2419200) return 'month';
        return 'year';
    },

    /**
     * Depending on how far is moment from now, returns a keyword which indicates how to round timeSeriesStart
     * @param {number} number - moment 
     * @param {number} moment - now
     */
    roundPerTimeRange(now, moment) {
        const length = now - moment;
        if (length <= 7200) return 'second';     //2 hour
        if (length < 90000) return 'minute';    //25 hour
        if (length < 3024000) return 'hour';    //35 days
        return 'day';
    },

    /**
     * rounds time identified by <number,key> by rounding factor
     * @param {number} number - moment 
     * @param {string} key- key
     * @param {string} factor - rounding factor, values admitted:('second', 'minute', 'hour', 'day, 'month', 'year')
     */
    roundGranularity(number, key, factor) {
        let roundedNumber;
        const inSecond = timeConverter.convertSecond(number, key);
        switch (factor) {
            case 'second': roundedNumber = number; break;
            case 'minute': roundedNumber = inSecond / 60; break;
            case 'hour': roundedNumber = inSecond / 3600; break;
            case 'day': roundedNumber = inSecond / 86400; break;
            case 'week': roundedNumber = inSecond / 604800; break;
            case 'month': roundedNumber = inSecond / 2629743; break;
            case 'year': roundedNumber = inSecond / 31556926; break;
        }

        if (roundedNumber < 1) {
            roundedNumber = 1;
        } else {
            roundedNumber = Math.round(roundedNumber);
        }

        return { number: roundedNumber, key: factor }
    }
}

/**
 * 
 * @param {Object} granularity
 * @param {string} granularity.key  
 * @param {number} granularity.number  
 * @param {Object} timeRange
 * @param {string} timeRange.key  
 * @param {number} timeRange.number  
 * @param {number} [start] - timestamp in second
 * @param {number} [end] - timestamp in second
 */
function definePeriod(granularity, timeRange, start, end) {

    const now = time.now();

    let timeSeriesStart;

    let past;

    if (typeof start !== 'undefined') {
        past = start;
    } else {
        past = time.subtract(now, timeRange.number, timeRange.key);
    }

    //
    //rounding timeSeriesStart at the beginning of the minute, hour, ... according to the value returned by rounder.roundPerTimeRange
    //

    let minGranularity = rounder.roundPerTimeRange(now, past);

    let granularityRoundFactor;
    if (keyEnumeration[minGranularity] < keyEnumeration[granularity.key]) {
        granularityRoundFactor = granularity.key;
    } else {
        granularityRoundFactor = minGranularity;
    }

    //
    //rounding granularity by roundFactor
    //

    granularity = rounder.roundGranularity(granularity.number, granularity.key, granularityRoundFactor);

    const granularityInSecond = timeConverter.convertSecond(granularity.number, granularity.key);

    if (typeof timeRange !== 'undefined') {
        const timeRangeInSecond = timeConverter.convertSecond(timeRange.number, timeRange.key);
        if (timeRangeInSecond < granularityInSecond) {
            throw new TimeError('granularity is bigger than time range');
        }
    }

    //
    // calculate start
    //

    const rawMomentStart = (Math.floor(divide(past, granularityInSecond)) * granularityInSecond);
    timeSeriesStart = time.round(rawMomentStart, granularity.key);
    let tmpStart = time.add(timeSeriesStart, granularity.number, granularity.key);
    if (tmpStart <= past) {
        timeSeriesStart = tmpStart;
    }

    //
    // calculate end
    //

    if (!end) {
        end = now;
    } else {
        end = end + 1;
    }

    const rawMomentEnd = (Math.floor(divide(end, granularityInSecond)) * granularityInSecond);
    let roundMomentEnd = time.round(rawMomentEnd, granularity.key);
    let tmpEnd = time.add(roundMomentEnd, granularity.number, granularity.key)
    if (tmpEnd <= now) {
        roundMomentEnd = tmpEnd;
    }

    const minGranularity2 = rounder.roundPerTimeRange(now, timeSeriesStart);

    if (keyEnumeration[minGranularity2] > keyEnumeration[granularity.key]) {
        return definePeriod(rounder.roundGranularity(granularity.number, granularity.key, minGranularity2), timeRange, start, end);
    }

    return { start: timeSeriesStart, end: roundMomentEnd - 1, granularity, minRoundFactor: minGranularity2 };
}

exports.time = time;
exports.rounder = rounder;
exports.timeConverter = timeConverter;
exports.keyEnumeration = keyEnumeration;
exports.getEnumerationKey = getEnumerationKey;
exports.definePeriod = definePeriod;