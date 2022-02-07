const { AlarmContainer } = require('./alarmContainer');

const { DelayCoordinator } = require('./delayCoordinator');

const moment = require('moment');

//
// to delay execution
//

const { delay } = require('../../../custom-modules/delay');

//
//Get data from ZDM
//

const { IoTData } = require('../../../custom-modules/getIotData');

const iotData = new IoTData();

//
// for time mutations
//

const { time } = require('../../../custom-modules/time');


class AlarmHandler {

    constructor(pubsubClient) {
        this.alarmContainer = new AlarmContainer();
        this.delayCoordinator = new DelayCoordinator();
        this.active = false;
        this.pubsubClient = pubsubClient;
    }

    addAlarm(projectName, alarm) {

        const res = this.alarmContainer.addAlarm(projectName, alarm);

        if (res === true && this.active === true) {
            const initialDelay = this.delayCoordinator.getDelay(projectName, alarm.fleet);
            this.getDataCallback(initialDelay, projectName, alarm.fleet);
        }

    }

    addAlarms(projectName, alarm) {
        console.log('adding alarm');
        //
        // obtain old fleets if they exists
        //

        let fleets = this.alarmContainer.getFleets(projectName);

        this.alarmContainer.addAlarms(projectName, alarm);

        if (this.active == true) {
            const newFleets = this.alarmContainer.getFleets(projectName);

            for (let fleet of newFleets) {
                const indexEl = fleets.indexOf(fleet);
                if (indexEl !== -1) {
                    fleets.splice(indexEl, 1);
                } else {
                    const initialDelay = this.delayCoordinator.getDelay(projectName, fleet);
                    this.getDataCallback(initialDelay, projectName, fleet);
                }
            }

            for (let fleet of fleets) {
                this.delayCoordinator.deleteDelay();
            }

        }

        return;
    }

    deleteAlarms(projectName) {
        console.log('deleteAlarms')

        const fleets = this.alarmContainer.getFleets(projectName);
        for (let el of fleets) {
            this.delayCoordinator.deleteDelay();
        }

        this.alarmContainer.deleteAlarms(projectName);
    }

    //
    // activate all functions which fecth data from ZDM and publish alarms
    //

    start() {

        if (this.active === true) {
            return;
        }

        this.active = true;

        for (let project of this.alarmContainer.getProjects()) {
            for (let fleet of this.alarmContainer.getFleets(project)) {
                const initialDelay = this.delayCoordinator.getDelay(project, fleet);
                this.getDataCallback(initialDelay, project, fleet);
            }
        }
    }

    stop() {

        this.active = false;

    }

    async getDataCallback(initialDelay, project, fleet) {
        console.log(project, initialDelay, fleet);
        let delayTime = (this.delayCoordinator.currentTimeRange()) - Math.floor(((Date.now()) % this.delayCoordinator.currentTimeRange())) + initialDelay;

        console.log(delayTime);

        let start = time.subtract(time.now(), (this.delayCoordinator.currentTimeRange() / 1000), 'second');

        let end;

        while (this.alarmContainer.alarmsExist(project, fleet) && this.active === true) {
            await delay(delayTime);

            end = time.now();

            try {

                let alarms;

                try {
                    alarms = this.alarmContainer.getAlarms(project, fleet);
                } catch (err) {
                    console.log('Questo allarme è stato eliminato, Devo morire :<');
                    return;
                }

                let tags = [];

                for (let alarm of alarms) {
                    if (alarm.active) {
                        if (!tags.includes(alarm.tag)) {
                            tags.push(alarm.tag);
                        }
                    }
                }

                const data = await iotData.getData(project, tags, [fleet], start, end, 2);
                console.log(end-start);

                start = end;

                if (data.result) {

                    for (let item of data.result) {

                        for (let value in item.payload) {

                            const alm = this.alarmContainer.getSpecificAlarm(project, fleet, item.tag, value);

                            if (alm.length > 0) {

                                this.handleAlarm(alm, item.payload[value], project, fleet, item.device_id, item.timestamp_device);

                            }

                        }

                    }

                }
                
                delayTime = ( this.delayCoordinator.currentTimeRange()) - Math.floor(((Date.now()) % this.delayCoordinator.currentTimeRange())) + initialDelay;
                console.log(fleet, delayTime);
                console.log(Date.now() + delayTime);

            } catch (err) {
                console.error(err);
                return;
            }

        }
    }

    handleAlarm(alm, value, projectName, fleet, device_id, timestamp) {
        let alarms = [];
        for (let item of alm) {
            switch (item.type) {
                case 'max': {
                    if (item.threshold < value) {
                        this.pubsubClient.publish(projectName + '-' + fleet, JSON.stringify({ tag: item.tag, value: item.value, device: device_id, fleet: fleet, timestamp:  moment.utc(timestamp).unix(), threshold: item.threshold, faultValue: value, type: 'max' }));
                        console.log('error max')
                    }
                    break;
                }
                case 'min': {
                    if (item.threshold > value) {
                        this.pubsubClient.publish(projectName + '-' + fleet, JSON.stringify({ tag: item.tag, value: item.value, device: device_id, fleet: fleet, timestamp: moment.utc(timestamp).unix(), threshold: item.threshold, faultValue: value, type: 'min' }));
                        console.log('error min');
                    }
                    break;
                }
            }
        }
    }

}

exports.AlarmHandler = AlarmHandler;
