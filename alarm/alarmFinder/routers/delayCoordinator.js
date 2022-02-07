

class DelayCoordinator {

    constructor() {
        this.timeRange = 60000;
        this.timeIntervals = 15000;
        this.currentDelay = 0;
        this.clientCounter = 0;
    }

    increaseDelay(){
        this.currentDelay = (this.currentDelay + this.timeIntervals) % this.timeRange;
    }

    getDelay(projectName, fleet){
        const tmp = this.currentDelay;
        this.increaseDelay();
        this.clientCounter++;
        return tmp;
    }

    deleteDelay(){
        this.clientCounter--;
        console.log(this.clientCounter);
    }

    currentTimeRange(){
        return this.timeRange;
    }

}

exports.DelayCoordinator = DelayCoordinator;