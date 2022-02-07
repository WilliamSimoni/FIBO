const request = require('supertest')
const { app } = require('./testStubIndex')
const { sum, mean, min, max } = require('mathjs');

function postBody(projectName, device, keyword, aggrFun, timePeriod, granularity, store, start, end, unit) {
    const request = {
        projectName: projectName,
        device: device,
        keyword: keyword,
        aggregationFunction: aggrFun,
        timePeriod: timePeriod,
        start: start,
        end: end,
        unit: unit,
        granularity: granularity,
        store: store
    }
    return request;
}

describe('Right Post Body', () => {
    it('everything is sent in a normal format', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('data sent whit spaces and periods', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is second', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'second', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is min.ute', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'min.ute', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is hour', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'hour', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is week', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'week', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is month', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
    it('time period key is year', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'year', number: 1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
    });
})

describe('Wrong Post Body', () => {
    it('send nothing', async () => {
        const res = await request(app)
            .post('/get')
            .send(null);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send partial object without store flag', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
});

describe('Wrong Project Name', () => {
    it('send a number instead of a string as project name', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(12, ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send only white spaces and punctuation as project name', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('  ,,.?/', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
});

describe('Wrong device property', () => {
    it('send a string instead of an array as device', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', 'device 1', ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send array with not only strings', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2', 13], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})

describe('Wrong Keyword Property', () => {
    it('send a string instead of an array as keyword', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], 'temperature', { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send array with not only strings', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature', { keyword: 'pression' }], { name: 'sum.', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})


describe('Wrong aggregation function Property', () => {
    it('send non supported or wrong function name', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'somma', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send wrong code', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: -1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send more than one name as function name', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum max', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})

describe('send wrong time period', () => {
    it('send wrong time period key (mese)', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'mese', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send more than one key name', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month year', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send number < 0', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: -1 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})

describe('granularity number tests', () => {
    it('send granularity < 0', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, null, 123242, 132132, -1, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})

describe('granularity object tests', () => {
    it('send wrong granularity with number < 1', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: -1 }, { key: 'month', number: -1 }, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send wrong granularity with wrong key', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'wrong', number: 1 }, { key: 'month', number: -1 }, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('send wrong granularity with wrong key', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'second month', number: 1 }, { key: 'month', number: -1 }, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})

/*
describe('Right Post Body', () => {
    it('everything is sent in a normal format', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody('Pierucci', ['device1', 'device2'], ['temperature'], { name: 'sum', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
    it('data sent whit spaces and periods', async () => {
        const res = await request(app)
            .post('/get')
            .send(postBody(' Pierucci ', ['device 1', 'device 2'], ['temperature'], { name: 'sum.', code: 1 }, { key: 'month', number: 24 }, 10, false));
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
})
*/