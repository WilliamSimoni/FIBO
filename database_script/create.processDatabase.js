const { Pool, Client } = require('pg');
require('dotenv').config({path:__dirname+'/./../.env'});

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: false
});

async function createDatabase(pool) {

    //Note: all the tables are put in public schema

    const client = await pool.connect();

    try {
        //list tables contained in database
        const dbTables = await client.query(
            ` 
            SELECT
                *
            FROM
                pg_catalog.pg_tables
            WHERE
                schemaname != 'pg_catalog'
            AND schemaname != 'information_schema';
            `
        );

        //extract name from result
        const dbTablesName = (() => {
            const result = [];
            for (let table of dbTables.rows) {
                result.push(table.tablename);
            }
            return result;
        })();

        console.log(dbTablesName);

        //CREATE SUPER USER
        if (dbTablesName.indexOf('superusers') === -1) {
            const res = await client.query(
                `CREATE TABLE superusers
                        (
                            username text NOT NULL,
                            password text NOT NULL,
                            PRIMARY KEY (username)
                        )
                        WITH (
                            OIDS = FALSE
                        );
                    `);
            console.log(res);
        }

        //CREATE PROJECT IF IT DOES NOT EXIST

        if (dbTablesName.indexOf('project') === -1) {
            const res = await client.query(
                `CREATE TABLE project
                (
                    name text NOT NULL,
                    token text NOT NULL,
                    tokenexpires bigint NOT NULL,
                    workspaceuid text NOT NULL,
                    zdmemail text NOT NULL,
                    zdmpassword text NOT NULL,
                    superuser text NOT NULL,
                    PRIMARY KEY (name),
                    FOREIGN KEY (superuser)
                        REFERENCES superusers (username) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE FLEETS
        
        if (dbTablesName.indexOf('fleets') === -1) {
            const res = await client.query(
                `CREATE TABLE fleets
                (
                    id uuid NOT NULL,
                    name text,
                    zdmfleetid text NOT NULL,
                    projectname text NOT NULL,
                    PRIMARY KEY (id),
                    UNIQUE (zdmfleetid, projectname),
                    FOREIGN KEY (projectname)
                        REFERENCES project (name) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE VIEWS
        if (dbTablesName.indexOf('views') === -1) {
            const res = await client.query(
                `CREATE TABLE views
                (
                    id uuid NOT NULL,
                    name text,
                    projectname text NOT NULL,
                    PRIMARY KEY (id),
                    UNIQUE (name, projectname),
                    FOREIGN KEY (projectname)
                        REFERENCES project (name) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE ENABLED
        if (dbTablesName.indexOf('enabled') === -1) {
            const res = await client.query(
                `CREATE TABLE enabled
                (
                    fleetid uuid NOT NULL,
                    viewid uuid NOT NULL,
                    PRIMARY KEY (fleetid, viewid),
                        FOREIGN KEY (viewid)
                            REFERENCES views (id) MATCH SIMPLE
                            ON UPDATE NO ACTION
                            ON DELETE CASCADE
                            NOT VALID,
                        FOREIGN KEY (fleetid)
                            REFERENCES fleets (id) MATCH SIMPLE
                            ON UPDATE NO ACTION
                            ON DELETE CASCADE
                            NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }


        //CREATE DATAGROUPS
        if (dbTablesName.indexOf('datagroups') === -1) {
            const res = await client.query(
                `CREATE TABLE datagroups
                (
                    id uuid NOT NULL,
                    aggregationfunction text NOT NULL,
                    projectname text NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (projectname)
                        REFERENCES project (name) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE DATA
        if (dbTablesName.indexOf('data') === -1) {
            const res = await client.query(
                `CREATE TABLE data
                (
                    id uuid NOT NULL,
                    aggregationfunction text NOT NULL,
                    datagroupid uuid NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (datagroupid)
                        REFERENCES datagroups (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE TAGSOFVALUE
        if (dbTablesName.indexOf('tagsofvalue') === -1) {
            const res = await client.query(
                `CREATE TABLE tagsofvalue
                (
                    id uuid NOT NULL,
                    tag text NOT NULL,
                    value text NOT NULL,
                    projectname text NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (projectname)
                        REFERENCES project (name) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
                
            `);
            console.log(res);
        }

        //CREATE COMPOSED
        if (dbTablesName.indexOf('composed') === -1) {
            const res = await client.query(
                `CREATE TABLE composed
            (
                tagofvalueid uuid NOT NULL,
                dataid uuid NOT NULL,
                PRIMARY KEY (tagofvalueid, dataid),
                FOREIGN KEY (tagofvalueid)
                    REFERENCES tagsofvalue (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE CASCADE
                    NOT VALID,
                FOREIGN KEY (dataid)
                    REFERENCES data (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE CASCADE
                    NOT VALID
            )
            WITH (
                OIDS = FALSE
            );
            `);
            console.log(res);
        }

        //CREATE ALARM
        if (dbTablesName.indexOf('alarms') === -1) {

            //CREATE TYPE ALARMTYPE
            const typeRes = await client.query(
                `
                CREATE TYPE alarmtype AS ENUM
                    ('min', 'max');
            `);

            console.log(typeRes);

            const res = await client.query(
                `CREATE TABLE alarms
                (
                    id uuid NOT NULL,
                    threshold integer NOT NULL,
                    type alarmtype NOT NULL,
                    fleetid uuid NOT NULL,
                    tagofvalueid uuid NOT NULL,
                    active boolean NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (fleetid)
                        REFERENCES fleets (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID,
                    FOREIGN KEY (tagofvalueid)
                        REFERENCES tagsofvalue  (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
            `);
            console.log(res);
        }

        //CREATE USERS
        if (dbTablesName.indexOf('users') === -1) {
            const res = await client.query(
                `CREATE TABLE users
            (
                id uuid NOT NULL,
                username text NOT NULL,
                password text NOT NULL,
                projectname text NOT NULL,
                PRIMARY KEY (id),
                UNIQUE (username, projectname),
                FOREIGN KEY (projectname)
                    REFERENCES project (name) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE CASCADE
                    NOT VALID
            )
            WITH (
                OIDS = FALSE
            );
            `);
            console.log(res);
        }

        //CREATE ACCESS

        if (dbTablesName.indexOf('access') === -1) {
            const res = await client.query(
                `CREATE TABLE access
            (
                userid uuid NOT NULL,
                fleetid uuid NOT NULL,
                PRIMARY KEY (userid, fleetid),
                FOREIGN KEY (userid)
                    REFERENCES users (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE CASCADE
                    NOT VALID,
                FOREIGN KEY (fleetid)
                    REFERENCES fleets (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE CASCADE
                    NOT VALID
            )
            WITH (
                OIDS = FALSE
            );
            `);
            console.log(res);
        }

        //CREATE RELATIVE
        if (dbTablesName.indexOf('relative') === -1) {
            const res = await client.query(
                `CREATE TABLE relative
                (
                    datagroupid uuid NOT NULL,
                    viewid uuid NOT NULL,
                    PRIMARY KEY (datagroupid, viewid),
                    FOREIGN KEY (datagroupid)
                        REFERENCES datagroups (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID,
                    FOREIGN KEY (viewid)
                        REFERENCES views (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
            `);
            console.log(res);
        }

        //CREATE BLACKLIST
        if (dbTablesName.indexOf('tokensblacklist') === -1) {
            const res = await client.query(
                `CREATE TABLE tokensblacklist
                (
                    id uuid NOT NULL,
                    token text NOT NULL,
                    expirationdate bigint NOT NULL,
                    PRIMARY KEY (id)
                )
                WITH (
                    OIDS = FALSE
                );
            `);
            console.log(res);
        }

        //CREATE ASSOCIATED
        if (dbTablesName.indexOf('associated') === -1) {
            const res = await client.query(
                `CREATE TABLE associated
                (
                    tagofvalueid uuid NOT NULL,
                    viewid uuid NOT NULL,
                    PRIMARY KEY (tagofvalueid, viewid),
                    FOREIGN KEY (tagofvalueid)
                        REFERENCES tagsofvalue (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID,
                    FOREIGN KEY (viewid)
                        REFERENCES views (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                        NOT VALID
                )
                WITH (
                    OIDS = FALSE
                );
            `);
            console.log(res);
        }


    } finally {
        client.release()
    }
}

//EXEC
exports.createDatabase = createDatabase;

//EXEC
createDatabase(pool)
    .catch(error => console.error(error));