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

async function dropDatabase(pool) {
    const client = await pool.connect();

    try {

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

        const dbTablesName = (() => {
            const result = [];
            for (let table of dbTables.rows) {
                result.push(table.tablename);
            }
            return result;
        })();

        let query = 'DROP TABLE IF EXISTS ';

        for (let i = 0; i < dbTablesName.length; i++){
            if (i < dbTablesName.length - 1)
                query += dbTablesName[i] + ', '
            else
                query += dbTablesName[i] + ' '
        }

        query += 'CASCADE;'

        console.log(query);

        let res = await client.query(query);
        res = await client.query(
            'DROP TYPE IF EXISTS alarmtype'
        );
        //console.log(res);
    } finally {
        client.release()
    }
}

//EXEC
dropDatabase(pool)
    .catch(error => console.error(error));