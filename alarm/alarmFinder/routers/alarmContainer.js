class AlarmContainer {

    constructor() {

        this.alarms = {};

    }

    addAlarms(projectName, alarm) {

        //check arguments

        if (typeof projectName !== 'string' || !Array.isArray(alarm))
            throw new Error('not valid arguments');

        let fleets = {};

        for (let el of alarm) {
            if (typeof el.fleet !== 'string' || typeof el.type !== 'string' || typeof el.tag !== 'string')
                throw new Error('not valid arguments');

            if (typeof el.value !== 'string' || typeof el.threshold !== 'number' || typeof el.active !== 'boolean')
                throw new Error('not valid arguments');

            if (!fleets[el.fleet]) {
                fleets[el.fleet] = [el];
            } else {
                fleets[el.fleet].push(el);
            }

        }

        this.alarms[projectName] = fleets;
    }

    addAlarm(projectName, alarm) {

        //check arguments

        if (typeof projectName !== 'string')
            throw new Error('not valid arguments');

        if (typeof alarm.fleet !== 'string' || typeof alarm.type !== 'string' || typeof alarm.tag !== 'string')
            throw new Error('not valid arguments');

        if (typeof alarm.value !== 'string' || typeof alarm.threshold !== 'number' || typeof alarm.active !== 'boolean')
            throw new Error('not valid arguments');

        if (!this.alarms[projectName]) {
            this.alarms[projectName] = {};
            this.alarms[projectName][alarm.fleet] = [alarm];
            return true;
        }

        if (!this.alarms[projectName][alarm.fleet]) {
            this.alarms[projectName][alarm.fleet] = [alarm];
            return true;
        }

        const findAlarm = this.alarms[projectName][alarm.fleet].find(el =>
            el.type === alarm.type &&
            el.tag === alarm.tag &&
            el.value === alarm.value
        );

        if (findAlarm) {
            return false;
        }

        this.alarms[projectName][alarm.fleet].push(alarm);

        return true;
    }

    deleteAlarms(projectName) {

        //check arguments

        if (typeof projectName !== 'string')
            throw new Error('not valid arguments');

        delete this.alarms[projectName];
    }

    changeAlarmThreshold(projectName, fleet, tag, value, type, threshold) {

        //check arguments

        if (typeof projectName !== 'string' || typeof fleet !== 'string' || typeof type !== 'string')
            throw new Error('not valid arguments');
        if (typeof tag !== 'string' || typeof value !== 'string' || typeof threshold !== 'number')
            throw new Error('not valid arguments');

        const projectAlarms = this.alarms[projectName];

        if (!projectAlarms) {
            throw new Error('project does not exist');
        }

        const fleetAlarms = projectAlarms[fleet];

        if (!fleetAlarms) {
            throw new Error('fleet does not exist');
        }

        const alarm = fleetAlarms.find(el => el.type === type && el.tag === tag && el.value === value);

        if (alarm)
            alarm.threshold = threshold;
        else
            throw new Error('alarm does not found');

    }

    changeAlarmStatus(projectName, fleet, tag, value, type, status) {

        //check arguments

        if (typeof projectName !== 'string' || typeof fleet !== 'string' || typeof type !== 'string')
            throw new Error('not valid arguments');
        if (typeof tag !== 'string' || typeof value !== 'string' || typeof status !== 'boolean')
            throw new Error('not valid arguments');

        const projectAlarms = this.alarms[projectName];

        if (!projectAlarms) {
            throw new Error('project does not exist');
        }

        const fleetAlarms = projectAlarms[fleet];

        if (!fleetAlarms) {
            throw new Error('fleet does not exist');
        }

        const alarm = fleetAlarms.find(el => el.fleet === fleet && el.type === type && el.tag === tag && el.value === value);
        if (alarm)
            alarm.active = status;
        else
            throw new Error('alarm does not found');
    }

    alarmsExist(projectName, fleet){
        if (!this.alarms[projectName]){
            return false;
        }

        if (this.alarms[projectName][fleet]){
            return true;
        } else {
            return false;
        }
    }

    getAlarms(projectName, fleet){
        const projectAlarms = this.alarms[projectName];

        if (!projectAlarms) {
            throw new Error('project does not exist');
        }

        const fleetAlarms = projectAlarms[fleet];

        if (!fleetAlarms) {
            throw new Error('fleet does not exist');
        }

        return fleetAlarms;
    }

    getProjects(){
        return Object.keys(this.alarms);
    }

    getFleets(projectName){
        if (!this.alarms[projectName]){
            return [];
        }

        return Object.keys(this.alarms[projectName]);
    }

    getSpecificAlarm(projectName, fleet, tag, value){
        const projectAlarms = this.alarms[projectName];

        if (!projectAlarms) {
            throw new Error('project does not exist');
        }

        const fleetAlarms = projectAlarms[fleet];

        if (!fleetAlarms) {
            throw new Error('fleet does not exist');
        }

        return fleetAlarms.filter(el => el.tag === tag && el.value === value && el.active === true);
    }

}

exports.AlarmContainer = AlarmContainer;

/*
const cs = new AlarmContainer();
cs.addAlarms('prova', [
    { fleet: '123', type: 'min', tag: 'kitchen', value: 'temp', threshold: 0, active: true },
    { fleet: '123', type: 'max', tag: 'kitchen', value: 'temp', threshold: 10, active: true },
    { fleet: '456', type: 'min', tag: 'kitchen', value: 'temp', threshold: 0, active: true },
    { fleet: '456', type: 'max', tag: 'kitchen', value: 'temp', threshold: 10, active: true }
]);
cs.addAlarms('prova2', [
]);

cs.addAlarm('prova2', { fleet: '456', type: 'max', tag: 'kitchen', value: 'temp', threshold: 10, active: true });
cs.addAlarm('prova2', { fleet: '466', type: 'max', tag: 'kitchen', value: 'temp', threshold: 10, active: true });
cs.addAlarm('prova2', { fleet: '466', type: 'min', tag: 'kitchen', value: 'temp', threshold: 0, active: true });

cs.changeAlarmStatus('prova', '123', 'kitchen', 'temp', 'min', false);

cs.changeAlarmThreshold('prova', '123', 'kitchen', 'temp', 'min', 2);

console.log(cs.alarms['prova']);*/