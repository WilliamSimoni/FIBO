const Influx = require('influxdb-nodejs');



class InfluxDB {
    /**
     * create influxDB clients to comunicate with timeSerieDatabase
     */
    constructor() {
        if (!InfluxDB.instance) {
            this.protocol = process.env.INFLUXDBPROT;
            this.host = process.env.INFLUXDBHOST;
            this.port = process.env.INFLUXDBPORT;
            this.username = process.env.INFLUXDBUSER;
            this.password = process.env.INFLUXDBPASS;
            //creating database clients, one database for every retention policy
            console.log(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/twelveHours`);
            this.second = new Influx(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/twelveHours`);     //where store data in second
            this.minute = new Influx(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/twentyFourHours`);     //where store data in minute
            this.hour = new Influx(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/fiveWeek`);              //where store data in hour
            this.day = new Influx(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/fourYears`);              //where store data in day
            this.other = new Influx(`${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}/longPeriods`);         //where store data in longer period than day
            
            this.internalDatabases = {
                'twelveHours': this.second,
                'twentyFourHours': this.minute,
                'fiveWeek': this.hour,
                'fourYears': this.day,
                'longPeriods': this.other
            }

            InfluxDB.instance = this;
        }

        return InfluxDB.instance;
    }

    /**
     * Initialize Time Series Database
     */
    async createTimeSeriesDatabase() {
        try {
            const databases = await this.second.showDatabases();

            if (!databases) {
                return false;
            }

            if (!databases.includes('longPeriods')) {
                await this.other.createDatabase();
            }

            if (!databases.includes('fourYears')) {
                await this.day.createDatabase();
                await this.day.createRetentionPolicy('fourYears', '208w', 1, null, true);
            }

            if (!databases.includes('fiveWeek')) {
                await this.hour.createDatabase();
                await this.hour.createRetentionPolicy('fiveWeek', '5w', 1, null, true);
            }

            if (!databases.includes('twentyFourHours')) {
                await this.minute.createDatabase();
                await this.minute.createRetentionPolicy('twentyFiveHours', '25h', 1, null, true);
            }

            if (!databases.includes('twelveHours')) {
                await this.second.createDatabase();
                await this.second.createRetentionPolicy('twelveHours', '12h', 1, null, true);
                
            }

        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }

    /**
     * Delete all time series from databases which names are written in databases array.
     * @param {string[]} databases - list of database where you need to delete all time series
     */
    async deleteTimeSeriesDatabase(databases){    
        
        if (! Array.isArray(databases)){
            throw new Error('argument exception');
        }
        
        for (let database of databases){

            const client = this.internalDatabases[database];

            if (typeof client === 'undefined'){
                throw new Error('client does not exist');
            }

            //
            // delete all series using query DROP SERIES
            //

            await client.queryRaw(`DROP SERIES FROM particular,standard`);

        }

    }

    /**
     * return array with all db clients
     */

    getAllTimeSeriesClients(){
        return [this.second, this.minute, this.hour, this.day, this.other];
    }

    /**
     * return Time Series Database Client associated to key
     * @param {string} key 
     * @throws {Error} if key is not valid
     */

    GetTimeSeriesClient(key){
        let databaseClient;
        switch(key){
            case ('second'): databaseClient = this.second; break;
            case ('minute'): databaseClient = this.minute; break;
            case ('hour'): databaseClient = this.hour; break;
            case ('day'): databaseClient = this.day; break;
            case('week'): databaseClient = this.other; break;
            case('month'): databaseClient = this.other; break;
            case('year'): databaseClient = this.other; break;
        }

        if (!databaseClient){
            throw new Error('key not supported');
        }

        return databaseClient;
    }

    /**
     * insert data in the write queue for the database
     * @param {Object} databaseClient - databaseClient
     * @param {string} granularitykey - granularity key used to identify database client
     * @param {number} granularityNumber - granularity number
     * @param {string} projectName - projectName
     * @param {string} fleet - fleet which sent data 
     * @param {string[]} tag - tag associated to data
     * @param {string[]} value - value associated to data
     * @param {number} data - numeric value
     * @param {boolean} isValid - if true data is valid, else is not valid
     * @param {string} aggregationFunction - aggregation function applied
     * @param {number} time - timestamp in second  
     * @throws {Error} 
     */

    queueData(projectName, granularityKey, granularityNumber, fleet, tag, value, data, isValid, aggregationFunction, internalAggregationFunction, time){

        const databaseClient = this.GetTimeSeriesClient(granularityKey);

        if (granularityNumber === 1 && tag.length === 1 && value.length === 1){
            this.queueStandardData(databaseClient, projectName, granularityKey, fleet, tag[0], value[0], data, isValid, aggregationFunction, time);
        } else {

            let queryTag = '';
            for (let item of tag){
                queryTag += item;
            }

            let queryValue = '';
            for (let item of value){
                queryValue += item;
            }
            
            this.queueParticularData(databaseClient, projectName, granularityKey, granularityNumber, fleet, queryTag, queryValue, data, isValid, aggregationFunction, internalAggregationFunction, time);
        }

    }

    /**
     * insert standard data in the write queue for the database
     * @param {Object} databaseClient - databaseClient
     * @param {string} granularitykey - granularity key used to identify database client
     * @param {string} projectName - projectName
     * @param {string} fleet - fleet which sent data 
     * @param {string} tag - tag associated to data
     * @param {string} value - value associated to data
     * @param {number} data - numeric value
     * @param {boolean} isValid - if true data is valid, else is not valid
     * @param {string} aggregationFunction - aggregation function applied
     * @param {number} time - timestamp in second  
     * @throws {Error} 
     */

    queueStandardData(databaseClient, projectName, granularityKey, fleet, tag, value, data, isValid, aggregationFunction, time){

        databaseClient.write('standard')
            .tag({
                aggregationFunction: aggregationFunction,
                fleet: fleet,
                projectName: projectName,
                tag: tag,
                unit: value,
                granularity: granularityKey
            })
            .field({
                value: data,
                isValid: isValid
            })
            .time(time, 's')
            .queue();
    }

    queueParticularData(databaseClient, projectName, granularityKey, granularityNumber, fleet, tag, value, data, isValid, aggregationFunction, internalAggregationFunction, time){

        databaseClient.write('particular')
            .tag({
                aggregationFunction: aggregationFunction,
                internalAggregationFunction: internalAggregationFunction,
                fleet: fleet,
                projectName: projectName,
                tag: tag,
                unit: value,
                granularityKey: granularityKey,
                granularityNumber: granularityNumber
            })
            .field({
                value: data,
                isValid: isValid
            })
            .time(time, 's')
            .queue();
    }

    /**
     * write data stored in queues
     * @param {Object} [databaseClient]
     * @param {string} [granularityKey]
     */
    async writeData(databaseClient, granularityKey){

        if (!databaseClient && granularityKey){
            databaseClient = this.GetTimeSeriesClient(granularityKey);
        }

        if (!databaseClient){
            throw new Error('error in write data parameters');
        }

        await databaseClient.syncWrite().catch(err => console.error(err));
    }

    /**
     * 
     * @param {Object} databaseClient - databaseClient
     * @param {string} projectName - projectName
     * @param {string} fleet - fleet which sent data 
     * @param {string[]} tag - tag associated to data
     * @param {string[]} value - value associated to data
     * @param {string} aggregationFunction - aggregation function applied
     * @param {number} start - timestamp from which start in nanosecond
     * @param {number} end - timestamp from which end in nanosecond
     * @param {string} [internalAggregationFunction]
     */

    async queryData(projectName, fleet, tag, value, aggregationFunction, granularityKey, granularityNumber, start, end, internalAggregationFunction){

        const databaseClient = this.GetTimeSeriesClient(granularityKey);

        if (granularityNumber === 1 && tag.length === 1 && value.length === 1){
            return this.queryStandardData(databaseClient, projectName, fleet, tag[0], value[0], aggregationFunction, granularityKey, start, end);
        } else {

            let queryTag = '';
            for (let item of tag){
                queryTag += item;
            }

            let queryValue = '';
            for (let item of value){
                queryValue += item;
            }

            return this.queryParticularData(databaseClient, projectName, fleet, queryTag, queryValue, aggregationFunction, granularityKey, granularityNumber.toString(), start, end, internalAggregationFunction)
        }
    }

    /**
     * 
     * @param {Object} databaseClient - databaseClient
     * @param {string} projectName - projectName
     * @param {string} fleet - fleet which sent data 
     * @param {string} tag - tag associated to data
     * @param {string} value - value associated to data
     * @param {string} aggregationFunction - aggregation function applied
     * @param {number} start - timestamp from which start in nanosecond
     * @param {number} end - timestamp from which end in nanosecond
     */
    
    async queryStandardData(databaseClient, projectName, fleet, tag, value, aggregationFunction, granularityKey, start, end){
        let reader = databaseClient.query('request');
        //console.log('query standard '+ granularityKey);
        reader.set({ 'format': 'json', 'epoch': 's', order: 'desc'});

        reader.measurement = 'standard';

        reader.addField('value');
        reader.addField('isValid');
        
        //
        //time intervall
        //

        reader.where('time', start, '>=');
        reader.where('time', end, '<=');

        //
        //where condition
        //

        reader.where('projectName', projectName);
        reader.where('tag', tag);
        reader.where('unit', value);
        reader.where('fleet', fleet);
        reader.where('aggregationFunction', aggregationFunction);
        reader.where('granularity', granularityKey);

        //
        // make database query
        //

        const query = await reader.then();

        if (!query.standard){
            return [];
        }

        return query.standard;
    }

    /**
     * 
     * @param {Object} databaseClient - databaseClient
     * @param {string} projectName - projectName
     * @param {string} fleet - fleet which sent data 
     * @param {string} tag - tag associated to data
     * @param {string} value - value associated to data
     * @param {string} aggregationFunction - aggregation function applied
     * @param {number} start - timestamp from which start in nanosecond
     * @param {number} end - timestamp from which end in nanosecond
     * @param {string} internalAggregationFunction
     */

    async queryParticularData(databaseClient, projectName, fleet, tag, value, aggregationFunction, granularityKey, granularityNumber, start, end, internalAggregationFunction){
        //console.log('query particular ' + granularityKey);
        let reader = databaseClient.query('request');

        reader.set({ 'format': 'json', 'epoch': 's', order: 'desc'});

        reader.measurement = 'particular';

        reader.addField('value');
        reader.addField('isValid');
        
        //
        //time intervall
        //

        reader.where('time', start, '>=');
        reader.where('time', end, '<=');

        //
        //where condition
        //

        reader.where('internalAggregationFunction', internalAggregationFunction);
        reader.where('projectName', projectName);
        reader.where('tag', tag);
        reader.where('unit', value);
        reader.where('fleet', fleet);
        reader.where('aggregationFunction', aggregationFunction);
        reader.where('granularityKey', granularityKey);
        reader.where('granularityNumber', granularityNumber);

        //
        // make database query
        //

        const query = await reader.then();

        if (!query.particular){
            return [];
        }

        return query.particular;
    }
}

exports.InfluxDB = InfluxDB;
