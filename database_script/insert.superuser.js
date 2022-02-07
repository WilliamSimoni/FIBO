require('dotenv').config({path:__dirname+'/./../.env'});
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const { Pool, Client } = require('pg');
const {Safe} = require('../custom-modules/safe');
const btoa = require('btoa');
const fetch = require('node-fetch');

//create encryption object for encrypt tokens
const ENCRYPT_PASS = process.env.ENCRYPT_KEY;
const ENCRYPT_KEY_USERNAME = process.env.ENCRYPT_KEY_USERNAME;

const safe = new Safe(ENCRYPT_PASS);
const safe_email = new Safe(ENCRYPT_KEY_USERNAME);

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: false
});

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

//INSERT PROJECT
async function insertProject(projectName, token, tokenExpires, workspace, zdmemail, zdmpassword, superuser) {
    const client = await pool.connect();
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

//INSERT SUPERUSER
async function insertSuperUser(username, password) {
    const client = await pool.connect();
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

        const psw = await bcrypt.hash(password, 5);

        const queryText = `INSERT INTO superusers (username, password) VALUES($1,$2)`;
        const queryParams = [username, psw];
        res = await client.query(queryText, queryParams);
    } finally {
        client.release()
    }
    return res;
}

async function insertUser(username, password, projectName, fleets) {
    const client = await pool.connect();
    try {
        projectName = projectName.replace(/\w+/g, (match) => match.toLowerCase());
        //verify username does not exist
        let res = await client.query(
            `SELECT username FROM users WHERE username = $1 AND projectname = $2`,
            [username, projectName]
        );

        if (res.rows[0]) {
            return 'username already exixsts';
        }

        const id = uuid.v4();
        const psw = await bcrypt.hash(password, 5);

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

async function insertFleet(fleetid, projectName) {
    const client = await pool.connect();
    let res;
    try {
        projectName = projectName.replace(/\w+/g, (match) => match.toLowerCase());
        const id = uuid.v4();
        const queryText = `INSERT INTO fleets (id, zdmfleetid, projectname) VALUES($1,$2,$3)`;
        const queryParams = [id, fleetid, projectName];
        res = await client.query(queryText, queryParams);
        return id;
    } finally {
        client.release()
    }
}

async function insert(){
    await insertSuperUser('William','12345678');
}

insert()
    .then(res => console.log('Superuser inserted'))
    .catch(err => console.error(err));