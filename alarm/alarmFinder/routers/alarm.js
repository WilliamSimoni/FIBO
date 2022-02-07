//setting environment variables with dotenv
require('dotenv').config({ path: __dirname + './../../../.env' });

const { Database } = require('../../../database/db');

const database = new Database();

const { AlarmHandler } = require('./alarmHandler');

//
// redis pubsub
//

const pubsub = require('../../pubsub/pubsub');

const REDISHOST = process.env.REDISHOST || 'localhost';
const REDISPORT = process.env.REDISPORT || 6379;
const REDISPASS = process.env.REDISPASS || ''

//
//For validating request
//

const { validationResult, body } = require('express-validator');

//express
const express = require('express');
const router = express.Router();

pubsub.client(REDISHOST, REDISPORT, REDISPASS)
    .then(async pubsubClient => {

        const alarmHandler = new AlarmHandler(pubsubClient);

        //
        // insert ALL alarms stored in database in alarmContainer structure
        //

        async function initAlarm() {

            const result = await database.searchAlarms();

            for (let el of result) {
                const alarm = {
                    tag: el.tag,
                    value: el.value,
                    threshold: Number(el.threshold),
                    type: el.type,
                    fleet: el.fleet,
                    active: el.active
                }

                alarmHandler.addAlarm(el.projectname, alarm);
            }
        }

        await initAlarm();

        //
        // activate all functions which fecth data from ZDM and publish alarms
        //

        alarmHandler.start();

        router.post('/addProject', [
            body('projectName').exists().withMessage('Project Name not defined').bail()
                .isString().withMessage('Project Name must be a string').bail()
                .customSanitizer(projectName => projectName.replace(/\s+/g, ''))
                .isLength({ min: 1 }).withMessage('Project Name is not valid').bail()
                .customSanitizer(projectName => projectName.replace(/\w+/g, (match) => match.toLowerCase())),
        ], async (request, response) => {

            //
            //handle validation error
            //

            const errors = validationResult(request);

            if (!errors.isEmpty()) {
                const errArray = errors.array();
                let errResponse = [];
                for (err of errArray) {
                    errResponse.push(err.msg);
                }
                return response.status(400).json({ status: 400, errors: errResponse });
            }

            const projectName = request.body.projectName;

            try {
                const alarms = await database.searchAlarms(projectName);
                console.log(alarms);
                alarmHandler.addAlarms(projectName, alarms);

                return response.status(200).json({ status: 200 });
            } catch (err) {
                console.error(err);
                return response.status(400).json({ status: 400 });
            }

        });


        router.post('/deleteProject', [
            body('projectName').exists().withMessage('Project Name not defined').bail()
                .isString().withMessage('Project Name must be a string').bail()
                .customSanitizer(projectName => projectName.replace(/\s+/g, ''))
                .isLength({ min: 1 }).withMessage('Project Name is not valid').bail()
                .customSanitizer(projectName => projectName.replace(/\w+/g, (match) => match.toLowerCase())),
        ], async (request, response) => {
            //
            //handle validation error
            //

            const errors = validationResult(request);

            if (!errors.isEmpty()) {
                const errArray = errors.array();
                let errResponse = [];
                for (err of errArray) {
                    errResponse.push(err.msg);
                }
                return response.status(400).json({ status: 400, errors: errResponse });
            }

            const projectName = request.body.projectName;
            try {

                alarmHandler.deleteAlarms(projectName);

                return response.status(200).json({ status: 200 });

            } catch (err) {
                console.error(err);
                return response.status(400).json({ status: 400 });
            }
        });
    })
    .catch(err => {
        console.log('erroraccio ' + REDISPASS);
    });

exports.alarm = router;