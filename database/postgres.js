
const { Pool } = require('pg');

const uuid = require('uuid');
const bcrypt = require('bcrypt');

const { Safe } = require('../custom-modules/safe');

const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);

//create encryption object for encrypt tokens
const ENCRYPT_PASS = process.env.ENCRYPT_KEY;
const ENCRYPT_KEY_USERNAME = process.env.ENCRYPT_KEY_USERNAME;

const safe = new Safe(ENCRYPT_PASS);
const safe_email = new Safe(ENCRYPT_KEY_USERNAME);

class PostgresDB {
    constructor() {
        if (!PostgresDB.instance) {

            const connectioString = `http://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
            console.log(connectioString);
            //Create Pool for connetion to Postgre
            this.pool = new Pool({
                connectionString: connectioString,
                ssl: false,
                idleTimeoutMillis: 3000,
                connectionTimeoutMillis: 10000
            });
            PostgresDB.instance = this;
        }

        return PostgresDB.instance;
    }

    //SEARCH METHODS
    //all SEARCH functions get parameters to query the database and then return an array of all the rows found

    //SEARCH USER
    async searchUser(username, projectName) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `
                SELECT users.id as userid, users.username, users.password, fleets.id as fleetid, fleets.zdmfleetid
                FROM users, access, fleets
                WHERE access.userid = users.id
                    AND	  users.username = $1
                    AND   users.projectname = $2
                    AND	  access.fleetid = fleets.id;`;
            const queryParams = [username, projectName];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    async searchUserById(id){
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `
                SELECT users.username, users.projectname
                FROM users
                WHERE users.id = $1;`;
            const queryParams = [id];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //SEARCH SUPERUSER
    async searchSuperUser(username) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `SELECT * FROM superusers WHERE username = $1`;
            const queryParams = [username];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //SEARCH SUPERUSER PROJECT
    async searchSuperuserProject(username) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `SELECT name,workspaceuid FROM project WHERE superuser=$1`;
            const queryParams = [username];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }
    
    //SEARCH PROJECT
    async searchProject(projectName) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `SELECT * FROM project WHERE name=$1`;
            const queryParams = [projectName];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //SEARCH TOKEN IN BLACKLIST
    async searchTokenInBlackList(token) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `SELECT id FROM tokensblacklist WHERE token = $1`;
            const queryParams = [token];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //SEARCH USER FLEETS
    async searchFleets(userid, projectName) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `
            SELECT id, zdmfleetid 
            FROM fleets, access 
            WHERE access.userid = $1 
                AND access.fleetid = fleets.id
                AND fleets.projectname = $2`;
            const queryParams = [userid, projectName];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //SEARCH ALARMS
    async searchAlarms(projectName) {
        const client = await this.pool.connect();
        let res;
        try {
            let queryText;
            let queryParams;
            if (projectName) {
                queryText = `
                SELECT tagsofvalue.tag as tag, tagsofvalue.value as value, alarms.threshold, alarms.type, fleets.zdmfleetid as fleet, alarms.active, fleets.projectname
                    FROM alarms, fleets, tagsofvalue
                    WHERE alarms.fleetid = fleets.id 
	                    AND fleets.projectname = $1
						AND tagsofvalue.id = alarms.tagofvalueid`;
                queryParams = [projectName];
            } else {
                queryText = `
                SELECT tagsofvalue.tag, tagsofvalue.value, alarms.threshold, alarms.type, fleets.zdmfleetid as fleet, alarms.active, fleets.projectname
                    FROM alarms, fleets, tagsofvalue
                    WHERE alarms.fleetid = fleets.id 
                        AND tagsofvalue.id = alarms.tagofvalueid`
                queryParams = [];
            }
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;

    }

    //UPDATE METHODS

    //UPDATE PROJECT TOKEN
    async updateProjectToken(projectName, token, expires) {
        const client = await this.pool.connect();
        let res;
        const cryptedToken = await safe.encryptAsync(token);
        try {
            const queryText = `
                UPDATE project SET token = $1, tokenexpires = $2
                    WHERE name=$3;
            `;
            const queryParams = [cryptedToken, expires, projectName];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res.rows;
    }

    //DELETE METHODS

    //DELETE PROJECT
    async deleteProject(projectName, username) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `DELETE FROM project WHERE name=$1 AND superuser=$2`;
            const queryParams = [projectName, username];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release();
        }

        return res;
    }

    //DELETE OLD TOKENS
    async deleteTokens(time) {
        const client = await this.pool.connect();
        try {
            const queryText = `
                DELETE FROM tokensblacklist 
                    WHERE expirationdate < $1`;
            const queryParams = [time];
            await client.query(queryText, queryParams);
        } finally {
            client.release();
        }
    }

    //INSERT METHODS

    //INSERT PROJECT
    async insertProject(projectName, token, tokenExpires, workspace, zdmemail, zdmpassword, superuser) {
        const client = await this.pool.connect();
        let res;
        try {
            projectName = projectName.replace(/\w+/g, (match) => match.toLowerCase());
            const cryptedToken = await safe.encryptAsync(token);
            const cryptedpsw = await safe.encryptAsync(zdmpassword);
            const cryptedemail = await safe_email.encryptAsync(zdmemail);
            const queryText = `INSERT INTO project (name, token, tokenexpires, workspaceuid, zdmemail, zdmpassword, superuser) VALUES($1,$2,$3,$4,$5,$6,$7)`;
            const queryParams = [projectName, cryptedToken, tokenExpires, workspace, cryptedemail, cryptedpsw, superuser];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }

        return res;
    }

    //INSERT FLEETS
    async insertFleet(fleetid, projectName) {
        const client = await this.pool.connect();
        let res;
        try {
            const id = uuid.v4();
            const queryText = `INSERT INTO fleets (id, zdmfleetid, projectname) VALUES($1,$2,$3)`;
            const queryParams = [id, fleetid, projectName];
            res = await client.query(queryText, queryParams);
            return id;
        } finally {
            client.release()
        }
    }

    //INSERT SUPERUSER
    async insertSuperUser(username, password) {
        const client = await this.pool.connect();
        let res;
        try {
            //verify username does not exist
            let res = await client.query(
                `SELECT * FROM superusers WHERE username = $1`,
                [username]
            );

            if (res.rows[0]) {
                return 'username already exixsts';
            }

            const psw = await bcrypt.hash(password, BCRYPT_SALT);

            const queryText = `INSERT INTO superusers (username, password) VALUES($1,$2)`;
            const queryParams = [username, psw];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }
        return res;
    }

    //INSERT USERS
    async insertUsers(users, projectName, roleId) {
        const client = await this.pool.connect();
        let res;
        try {
            const queryText = `INSERT INTO users VALUES($1,$2,$3,$4,$5)`;
            for (let user of users) {
                const id = uuid.v4();
                const psw = await bcrypt.hash(user.pass, BCRYPT_SALT);
                const queryParams = [id, user.name, psw, projectName, roleId[user.role]];
                res = await client.query(queryText, queryParams);
            }
        } finally {
            client.release()
        }
        return res;
    }

    //INSERT USER
    async  insertUser(username, password, projectName, fleets) {
        const client = await this.pool.connect();
        try {

            //verify username does not exist
            let res = await client.query(
                `SELECT username FROM users WHERE username = $1 AND projectname = $2`,
                [username, projectName]
            );

            if (res.rows[0]) {
                return 'username already exixsts';
            }

            const id = uuid.v4();
            const psw = await bcrypt.hash(password, BCRYPT_SALT);

            //insert user
            await client.query(
                `INSERT INTO users VALUES($1,$2,$3,$4)`,
                [id, username, psw, projectName]
            );

            //insert fleets
            let fleetQuery = '';
            for (let i = 0; i < fleets.length; i++) {
                if (i == 0)
                    fleetQuery += `('${fleets[i]}'`
                else
                    fleetQuery += `,'${fleets[i]}' `
            }
            fleetQuery += ')';

            const fleetsIds = await client.query(
                `SELECT id FROM fleets WHERE projectname = $1 AND zdmfleetid IN ${fleetQuery}`,
                [projectName]
            );

            for (let item of fleetsIds.rows) {
                await client.query(
                    'INSERT INTO access (userid,fleetid) VALUES($1,$2)',
                    [id, item.id]
                )
            }

            return id;
        } finally {
            client.release()
        }

    }

    //INSERT ALARMS
    async insertAlarms(threshold, type, dataid) {
        const client = await this.pool.connect();
        let res;
        try {
            const id = uuid.v4();
            const queryText = `INSERT INTO alarms (id, threshold, type, dataid) VALUES($1,$2,$3,$4)`;
            const queryParams = [id, threshold, type, dataid];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }
        return res;
    }

    //INSERT TOKEN IN BLACKLIST
    async insertTokenInBlackList(token, expirationdate) {
        const client = await this.pool.connect();
        let res;
        try {
            const id = uuid.v4();
            const queryText = `INSERT INTO tokensblacklist (id, token, expirationdate)
            VALUES($1,$2,$3);`;
            const queryParams = [id, token, expirationdate];
            res = await client.query(queryText, queryParams);
        } finally {
            client.release()
        }
        return res;
    }

    //CREATION PROJECT FUNCTIONS
    //the function exec a unic transaction 
    async createProject(superuser, projectName, workspace, zdmemail, zdmpassword, token, tokenExpires, users, fleets, enabledFleets, viewNames, tagOfValue, tagOfValuePerView, dataPerView, alarmPerView) {

        const client = await this.pool.connect();
        try {

            await client.query('BEGIN');

            //
            //Create project
            //  

            projectName = projectName.replace(/\w+/g, (match) => match.toLowerCase());

            const cryptedToken = await safe.encryptAsync(token);
            const cryptedpsw = await safe.encryptAsync(zdmpassword);
            const cryptedemail = await safe_email.encryptAsync(zdmemail);

            const queryProject = `INSERT INTO project (name, token, tokenexpires, workspaceuid, zdmemail, zdmpassword, superuser) VALUES($1,$2,$3,$4,$5,$6,$7)`;
            const ProjectParams = [projectName, cryptedToken, tokenExpires, workspace, cryptedemail, cryptedpsw, superuser];

            await client.query(queryProject, ProjectParams);

            let promises = [];

            //
            //create fleets
            //

            let fleetId = [];

            for (let fleet of fleets) {
                const id = uuid.v4();
                fleetId.push(id);
                const queryFleet = `INSERT INTO fleets (id, name, zdmfleetid, projectname) VALUES($1,$2,$3,$4)`;
                const FleetParams = [id, fleet.name, fleet.id, projectName];
                promises.push(client.query(queryFleet, FleetParams));
            }

            //
            //create views
            //

            let viewId = [];

            for (let view of viewNames) {
                const id = uuid.v4();
                viewId.push(id);
                const queryView = `INSERT INTO views (id, name, projectname) VALUES($1,$2,$3)`;
                const ViewParams = [id, view, projectName];
                promises.push(client.query(queryView, ViewParams));
            }

            //
            // create tagsOfValue
            //

            let tagOfValueId = [];

            for (let item of tagOfValue) {
                const id = uuid.v4();
                tagOfValueId.push(id);
                const queryTagOfValue = `INSERT INTO tagsofvalue (id, tag, value, projectname) VALUES($1,$2,$3,$4)`;
                const TagOfValueParams = [id, item.tag, item.value, projectName];
                promises.push(client.query(queryTagOfValue, TagOfValueParams));
            }

            //end first phase writing
            await Promise.all(promises);

            promises = [];

            //
            // create users
            //

            let usersID = [];

            let queryAccessList = [];
            let accessParamsList = [];

            for (let user of users) {

                const id = uuid.v4();
                usersID.push(id);
                const psw = await bcrypt.hash(user.pass, BCRYPT_SALT);
                const queryUser = `INSERT INTO users (id, username, password, projectname) VALUES($1,$2,$3,$4)`;
                const UserParams = [id, user.mail, psw, projectName];
                promises.push(client.query(queryUser, UserParams));

                //
                //create access
                //

                for (let fleetIndex of user.fleets) {
                    const queryAccess = `INSERT INTO access (userid, fleetid) VALUES($1,$2)`;
                    const accessParams = [id, fleetId[fleetIndex]];
                    queryAccessList.push(queryAccess);
                    accessParamsList.push(accessParams);
                }

            }

            //
            // create dataGroup, data and composed
            //

            let dataGroupId = [];

            let queryDataList = [];
            let queryComposedList = [];
            let queryRelativeList = [];
            let dataParamsList = [];
            let composedParamsList = [];
            let relativeParamsList = [];

            let dataId = [];

            for (let i = 0; i < dataPerView.length; i++) {

                for (let item of dataPerView[i]) {

                    //
                    // create datagroup
                    //

                    const dataGroupID = uuid.v4();
                    dataGroupId.push(dataGroupID);
                    const queryTagOfValue = `INSERT INTO datagroups (id, aggregationfunction, projectname) VALUES($1,$2,$3)`;
                    const TagOfValueParams = [dataGroupID, item.aggrFun, projectName];
                    promises.push(client.query(queryTagOfValue, TagOfValueParams));

                    //
                    // create relative query
                    //

                    const queryRelative = `INSERT INTO relative (datagroupid, viewid) VALUES($1,$2)`;
                    const relativeParams = [dataGroupID, viewId[i]];
                    queryRelativeList.push(queryRelative);
                    relativeParamsList.push(relativeParams);

                    //
                    // create data query
                    //

                    for (let data of item.tagvalue) {
                        const dataID = uuid.v4();
                        dataId.push(dataID);
                        const queryData = `INSERT INTO data (id, aggregationfunction, datagroupid) VALUES($1,$2,$3)`;
                        const dataParams = [dataID, data.aggregation, dataGroupID];
                        queryDataList.push(queryData);
                        dataParamsList.push(dataParams);

                        for (let tovIndex of data.tagOfValue) {

                            //
                            // create composed query
                            //

                            const queryComposed = `INSERT INTO composed (tagofvalueid, dataid) VALUES($1,$2)`;
                            const composedParams = [tagOfValueId[tovIndex], dataID];
                            queryComposedList.push(queryComposed);
                            composedParamsList.push(composedParams);
                        }

                    }
                }

                //
                // create alarms
                //

                const alarms = alarmPerView[i];

                for (let enabledFleet of enabledFleets[i]) {

                    //
                    // create alarms, one for each enabled fleet
                    //

                    for (let alarm of alarms) {
                        const alarmId = uuid.v4();
                        const queryAlarm = `INSERT INTO alarms (id, threshold, type, fleetid, tagofvalueid, active) VALUES($1,$2,$3,$4,$5,$6)`;
                        const alarmParams = [alarmId, alarm.threshold, alarm.type, fleetId[enabledFleet], tagOfValueId[alarm.tagvalueIndex], true];
                        promises.push(client.query(queryAlarm, alarmParams));
                    }
                }

                //
                // create enabled
                //

                for (let item of enabledFleets[i]) {
                    const queryEnabled = `INSERT INTO enabled (fleetid, viewid) VALUES($1,$2)`;
                    const enabledParams = [fleetId[item], viewId[i]];
                    promises.push(client.query(queryEnabled, enabledParams));
                }

                //
                // create associated
                //

                for (let item of tagOfValuePerView[i]) {
                    const queryAssociated = `INSERT INTO associated (tagofvalueid, viewid) VALUES($1,$2)`;
                    const associatedParams = [tagOfValueId[item], viewId[i]];
                    promises.push(client.query(queryAssociated, associatedParams));
                }

            }

            await Promise.all(promises);

            promises = [];

            //insert data

            for (let i = 0; i < dataParamsList.length; i++) {
                promises.push(client.query(queryDataList[i], dataParamsList[i]));
            }

            //insert access

            for (let i = 0; i < accessParamsList.length; i++) {
                promises.push(client.query(queryAccessList[i], accessParamsList[i]));
            }

            //insert relative

            for (let i = 0; i < relativeParamsList.length; i++) {
                promises.push(client.query(queryRelativeList[i], relativeParamsList[i]));
            }

            await Promise.all(promises);

            promises = [];

            // insert composed

            for (let i = 0; i < composedParamsList.length; i++) {
                promises.push(client.query(queryComposedList[i], composedParamsList[i]));
            }

            Promise.all(promises);

            await client.query('COMMIT')

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release()
        }
    }


}

exports.PostgresDB = PostgresDB;