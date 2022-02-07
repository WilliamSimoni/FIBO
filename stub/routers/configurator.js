const express = require('express');
const router = express.Router();

const { validationResult, body } = require('express-validator');

const { Database } = require('../../database/db');
const { legalFunctions } = require(`../../calculator configuration/rules`);

const alarm = require('../stub_modules/alarms');

const delay = require('../../custom-modules/delay')

//obtaining instance database
const database = new Database();

router.post('/createproject', [
    body('projectName')
        .isString().withMessage('Project Name is not valid').bail()
        .customSanitizer(projectName => projectName.replace(/\s+/g, ''))
        .isLength({ min: 1 }).withMessage('Project Name is not valid')
        .customSanitizer(projectName => projectName.replace(/\w+/g, (match) => match.toLowerCase())),
    body('workspaceuid')
        .isString().withMessage('workspaceuid not sent').bail()
        .isLength({ min: 1 }).withMessage('workspaceuid not valid'),
    body('username')
        .isString().withMessage('username is not valid').bail()
        .isLength({ min: 1 }).withMessage('username is not valid'),
    body('password')
        .isString().withMessage('username is not valid').bail()
        .isLength({ min: 1 }).withMessage('username is not valid'),
    body('viewNames')
        .isArray({ min: 1 }).withMessage('viewName is not valid').bail()
        .custom(viewName => {
            for (let view of viewName) {
                if (view.replace(/\s+/g, '').length === 0) {
                    throw new Error('view inside viewName is empty')
                }
            }
            return true;
        }),
    body('users')
        .isArray().withMessage('users is not an array').bail()
        .custom((users, { req }) => {
            const fleets = req.body.fleets;

            if (!Array.isArray(fleets)) {
                throw new Error('fleets property is not defined');
            }

            if (!Array.isArray(users)) {
                throw new Error('users property is not defined');
            }

            if (users.length === 0) {
                throw new Error('users property is empty');
            }

            let emails = [];

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                if (! typeof user.mail === 'string' || ! typeof user.pass === 'string' || ! typeof user.role === 'string') {
                    throw new Error(`user in users is not valid`)
                }

                if (user.mail.length === 0 || user.mail.length === 0 || user.length === 0) {
                    throw new Error(`user in users is not valid`)
                }

                if (emails.includes(user.mail)) {
                    throw new Error(`double user in users`)
                }

                if (!Array.isArray(user.fleets)) {
                    throw new Error('user in users is not valid');
                }

                if (Math.min(...user.fleets) < 0 || Math.max(...user.fleets) >= fleets.length) {
                    throw new Error('user.fleet in users is not valid, a fleet has index out of bound');
                }

                emails.push(user.mail);
            }

            return true;
        }),
    body('fleets')
        .isArray({ min: 1 }).withMessage('fleets is not valid').bail()
        .custom(fleets => {
            for (let i = 0; i < fleets.length; i++) {
                if (!fleets[i].name || !fleets[i].id) {
                    throw new Error('fleet inside fleets is not valid');
                }
                if (typeof fleets[i].name !== 'string' || typeof fleets[i].id !== 'string') {
                    throw new Error('fleet inside fleets is not valid');
                }
            }
            return fleets;
        }),
    body('enabledFleets')
        .isArray().withMessage('enabledFleet is not valid').bail()
        .if(body('viewName').isArray())
        .if(body('fleets').isArray())
        .custom((enabledFleet, { req }) => {
            const viewName = req.body.viewName;
            const fleets = req.body.fleets;

            if (viewName.length !== enabledFleet.length) {
                throw new Error('enabledFleet is not valid, enabledFleet length != viewName length');
            }

            for (let enFleet of enabledFleet) {
                if (Math.min(...enFleet) < 0 || Math.max(...enFleet) >= fleets.length) {
                    throw new Error('enabledFleet in enabledFleet is not valid, a fleet has index out of bound');
                }
            }

            return true;
        }),
    body('tagOfValue')
        .isArray({ min: 1 }).withMessage('tagOfValue is not valid')
        .custom(tagOfValue => {
            for (let item of tagOfValue) {
                if (typeof item.tag !== 'string' || typeof item.value !== 'string') {
                    throw new Error('tagOfValue item is not valid');
                }
                if (item.tag.replace(/\s+/g, '').length === 0 || item.value.replace(/\s+/g, '').length === 0) {
                    throw new Error('tagOfValue item is not valid');
                }
            }
            return true;
        }),
    body('tagOfValuePerView')
        .isArray({ min: 1 }),
    body('dataPerView')
        .isArray({ min: 1 })
        .custom(dataPerView => {
            for (let view of dataPerView) {
                if (!Array.isArray(view)) {
                    throw new Error('dataPerView is not valid');
                }
                for (let data of view) {
                    if (!legalFunctions.includes(data.aggrFun)) {
                        throw new Error('function ' + data.aggrFun + ' not supported yet');
                    }
                }
            }
            return true;
        }),
    body('alarmPerView')
        .isArray()
        .if(body('viewNames').isArray())
        .custom((alarmPerView, { req }) => {
            if (alarmPerView.length !== req.body.viewNames.length) {
                throw new Error('alarmPerView is not valid, alarmPerView length != viewName length');
            }
            return true;
        }),
    body('overwrite')
        .isBoolean().withMessage('overwrite sent is not a boolean').bail(),
    body('token')
        .isString().withMessage('token not sent').bail()
        .isLength({ min: 1 }).withMessage('token not valid')
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


    const {
        projectName,
        workspaceuid,
        username,
        password,
        token,
        tokenExpires,
        users,
        fleets,
        enabledFleets,
        viewNames,
        tagOfValue,
        tagOfValuePerView,
        dataPerView,
        alarmPerView,
        overwrite,
    } = request.body;

    const superuser = request.decoded.username;

    try {

        //search if a project with the same name already exists

        const preProject = await database.searchProject(projectName);

        if (preProject[0]) {
            //a project with the same name created by someone already exists
            if (preProject[0].superuser !== superuser) {
                return response.status(450).json({ status: 450, errors: [`Someone has already created a project called ${projectName}`] });
            } else {
                if (overwrite) {
                    await database.deleteProject(projectName, superuser);
                } else {
                    return response.status(451).json({ status: 451, errors: [`you have already created a project called ${projectName}`] });
                }
            }
        }


        await database.createProject(
            superuser,
            projectName,
            workspaceuid,
            username,
            password,
            token,
            tokenExpires,
            users,
            fleets,
            enabledFleets,
            viewNames,
            tagOfValue,
            tagOfValuePerView,
            dataPerView,
            alarmPerView
        );

        //add alarms 

        try {

            const res = await alarm.addAlarm(projectName);

            if (res.status === 400) {
                await database.deleteProject(projectName, superuser);
                return response.status(455).json({ status: 455, errors: ['impossibile create alarms'] });
            }

        } catch (err) {
            await database.deleteProject(projectName, superuser);
            return response.status(455).json({ status: 455, errors: ['impossibile create alarms'] });
        }

        response.status(200).json({ status: 200 });

    } catch (err) {
        console.error(err);
        response.status(400).json({ status: 400, errors: ['Something went wrong'] });
    }
});

router.post('/deleteproject', [
    body('projectName')
        .isString().withMessage('Project Name is not valid').bail()
        .customSanitizer(projectName => projectName.replace(/\s+/g, ''))
        .isLength({ min: 1 }).withMessage('Project Name is not valid')
        .customSanitizer(projectName => projectName.replace(/\w+/g, (match) => match.toLowerCase()))
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

        const superuser = request.decoded.username;

        console.log(superuser);

        const project = await database.searchProject(request.body.projectName);

        if (!project[0]) {
            return response.status(452).json({ status: 452, errors: ['project does not exist'] });
        }

        if (project[0].superuser !== superuser) {
            return response.status(453).json({ status: 452, errors: ['user does not own the project'] })
        }

        const res = await alarm.deleteAlarm(request.body.projectName);

        if (res.status === 400) {
            return response.status(456).json({ status: 456, errors: ['impossibile delete alarms'] });
        }

        await database.deleteProject(request.body.projectName, superuser);

        return response.status(200).json({ status: 200 });

    } catch (err) {
        console.error(err);
        response.status(400).json({ status: 400, errors: ['Something went wrong'] });
    }

});


router.post('/ls', async (request, response) => {
    try {
        const username = request.decoded.username;
        const projects = await database.searchSuperuserProject(username);
        response.status(200).json({ status: 200, projects });
    } catch (err) {
        console.error(err);
        response.status(400).json({ status: 400, errors: ['Something went wrong'] });
    }
})

exports.configurator = router;