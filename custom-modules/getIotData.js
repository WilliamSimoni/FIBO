const fetch = require('node-fetch');
const moment = require('moment');
const btoa = require('btoa');

//
// errors class
//

const error = require('./errors');

//
// delay function
//

const { delay } = require('./delay');

const DELAY_CONST = 50;

//
//for encryption/decryption of data
//

const { Safe } = require('./safe');

//
//database
//

const { Database } = require('../database/db');
const database = new Database();

//
//get encryption keys from env file
//

const ENCRYPT_PASS = process.env.ENCRYPT_KEY;
const ENCRYPT_KEY_USERNAME = process.env.ENCRYPT_KEY_USERNAME;

//ONLY FOR DEVELOPMENT

let login_counter = 0;


class IoTData {

    constructor() {
        if (!IoTData.instance) {
            this.tokens = {};
            this.API_URL = 'https://api.zdm.zerynth.com/v1/tsmanager/workspace';
            this.safe = new Safe(ENCRYPT_PASS);
            this.safe_email = new Safe(ENCRYPT_KEY_USERNAME);
            IoTData.instance = this;
        }
        return IoTData.instance;
    }

    //true if project token is present and it is not expired, false otherwise
    isToken(projectName) {
        if (this.tokens[projectName]) {
            //console.logconsole.log(this.tokens[projectName].expires, moment.utc().unix())
            if (this.tokens[projectName].expires > moment.utc().unix()) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    //insert token in tokens structure and in FIBO db
    async updateToken(projectName, token, expires, workspaceuid) {
        //insert in tokens
        this.tokens[projectName] = {
            token: token,
            expires: expires,
            workspaceuid: workspaceuid,
            updating: false,
        }
        await database.updateProjectToken(projectName, token, expires);
    }

    //returns token and expirestime if projectName exists, empty array otherwis
    async getProject(projectName) {
        const response = await database.searchProject(projectName);
        return response;
    }

    //insert project into tokens
    setProject(projectName, token, expires, workspaceuid, updating) {
        //insert in tokens
        this.tokens[projectName] = {
            token: token,
            expires: expires,
            workspaceuid: workspaceuid,
            updating: updating
        }
    }


    /**
     * delete project from tokens
     * @param {string} projectname 
     */

    deleteProject(projectname) {
        if (this.tokens[projectname]) {
            delete this.tokens[projectname];
            return true;
        } else {
            return false;
        }
    }

    /**
     * function to request data to ZDM.
     * @param {string} projectName - project name from wich search credentials for get data
     * @param {string[]} tags - tags used in the zdm query
     * @param {string[]} fleets - fleets used in the zdm query
     * @param {number} start - timestamp indicating when to start receiving data
     * @param {number} end - timestamp indicating when to end receiving data
     * @param {number} retries - number of retries
     * @param {number} [delayExec=0] - delay expressed in millisecond before try to ask data to ZDM
     * @throws {Error} if retries is 0 or if parameters are not defined or if something went wrong. If retries is 0 then Error is TooMuchRetriesError instance. If parameters are not defined then error is ParametersError instance. If project does not exist than error is ProjectNotExistError instace.
     * @returns {Promise} 
     */

    async getData(projectName, tags, fleets, start, end, retries, delayExec) {

        //
        // checking parameters
        //

        if (
            typeof projectName !== 'string'
            || !Array.isArray(tags)
            || !Array.isArray(fleets)
            || typeof start !== 'number'
            || typeof end !== 'number'
            || typeof start !== 'number'
            || typeof retries !== 'number') {
            throw new error.ParametersError('parameters error');
        }

        //
        // checking retries count
        //

        //console.log(retries);
        if (retries === 0) {
            throw new error.TooMuchRetriesError('fail to fetch data from ZDM');
        }

        if (!delayExec) {
            delayExec = 0;
        } else {
            await delay(delayExec);
        }

        //obtain token
        if (!this.isToken(projectName)) {
            //console.log('token does not found');
            const project = await this.getProject(projectName);
            //project does not exist anymore
            if (!project[0]) {

                this.deleteProject(projectName);
                throw new error.ProjectNotExistError();

            } else {

                if (!this.tokens[projectName]) {
                    this.setProject(projectName, '', project[0].tokenexpires, project[0].workspaceuid, false)
                }

                const projectToken = this.tokens[projectName];

                while (projectToken.updating) {
                    await delay(50);
                }

                let token;
                if (Number(project[0].tokenexpires) < moment.utc().unix() && !projectToken.updating && projectToken.expires < moment.utc().unix()) {
                    try {
                        projectToken.updating = true;
                        console.log('login ZDM');

                        const cryptedCredentials = [this.safe_email.decryptAsync(project[0].zdmemail), this.safe.decryptAsync(project[0].zdmpassword)];
                        const credentials = await Promise.all(cryptedCredentials)
                            .then(response => {
                                return { email: response[0], pass: response[1] }
                            });

                        //
                        // DEVELOPMENT ONLY BLOCK
                        //

                        login_counter++;
                        if (login_counter > 1) {
                            throw new Error('too much login');
                        }

                        //
                        // DEVELOPMENT ONLY BLOCK
                        //

                        token = await getToken(credentials.email, credentials.pass);
                        await this.updateToken(projectName, token.data.token, token.data.expires, project[0].workspaceuid);

                    } finally {
                        projectToken.updating = false;
                    }
                } else {
                    if (!projectToken.updating && projectToken.token === '') {
                        try {
                            projectToken.updating = true;
                            token = await this.safe.decryptAsync(project[0].token);
                            this.setProject(projectName, token, project[0].tokenexpires, project[0].workspaceuid, false);
                        } finally {
                            projectToken.updating = false;
                        }
                    }
                }
            }
        }

        const result = await this.getDataExecuter(projectName,
            this.tokens[projectName].token,
            this.tokens[projectName].workspaceuid,
            tags, fleets, start, end, retries, delayExec);
        return result;

    }

    async getDataExecuter(projectName, token, workspaceuid, tags, fleets, start, end, retries, delay) {
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            redirect: 'follow'
        };

        //create tag query
        let queryTag = '';
        for (let tag of tags) {
            tag = tag.replace(/\s+/g, '%20');
            queryTag += `&tag=${tag}`
        }

        //create fleet query
        let queryFleet = '';
        for (let fleet of fleets) {
            fleet = fleet.replace(/\s+/g, '%20');
            queryFleet += `&fleet=${fleet}`
        }

        //startQuery
        let queryStart = '';
        if (start) {
            queryStart = `&start=${moment.unix(start).toISOString()}`
        }

        //endQuery
        let queryEnd = '';
        if (end) {
            queryEnd = `&end=${moment.unix(end).toISOString()}`
        }
        const query = `${this.API_URL}/${workspaceuid}?sort=-timestamp_device&size=-1${queryTag}${queryFleet}${queryStart}${queryEnd}`;

        let response;
        try {
            response = await fetch(query, options);
            let json;
            if (response.ok) {
                json = await response.json();
            } else {
                json = await response.text();

                //
                // check if is a fleet not found error, in that case it does not retry
                //

                if (/fleet not found/g.test(json)) {
                    throw new error.FleetNotExistError('a fleet in ' + fleets + 'does not exist');
                }

                throw new Error('server respond:\n' + json + '\nWith query: ' + query);
            }
            return json;
        } catch (err) {

            if (err instanceof error.FleetNotExistError) {
                throw err;
            }

            console.error(err.message);
            return this.getData(projectName, tags, fleets, start, end, retries - 1, delay + DELAY_CONST);
        }

    }
}

async function getToken(email, password) {


    var requestOptions = {
        method: 'GET',
        headers: {
            "Authorization": "Basic " + btoa(email + ":" + password)
        },
        redirect: 'follow'
    };

    const response = await fetch("https://backend.zerynth.com//v1/user", requestOptions)
    const json = await response.json();

    return json;
}

exports.IoTData = IoTData;