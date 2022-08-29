import 'reflect-metadata';
import { ApiFactory, IApiFactory } from '../../src/client/ApiFactory';
import { StatsIndexerService } from '../../src/services/StatsIndexerService';
import { AstarApiMock } from './AstarApiMock';

const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

let apiFactory: IApiFactory;

beforeEach(() => {
    // mock system date/time (new Date())
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(1647734400000)); //2022-03-20

    apiFactory = new ApiFactory();
    apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());
});

afterAll(() => {
    jest.useRealTimers();
});

describe('getDateRange', () => {
    it('calculate proper day range for 90 days period', () => {
        const service = new StatsIndexerService(apiFactory);

        const range = service.getDateRange('90 days');

        expect(getDateString(range.start)).toBe('2021-12-20');
        expect(getDateString(range.end)).toBe('2022-03-20');
    });

    it('calculate proper day range for 30 days period', () => {
        const service = new StatsIndexerService(apiFactory);

        const range = service.getDateRange('30 days');

        expect(getDateString(range.start)).toBe('2022-02-18');
        expect(getDateString(range.end)).toBe('2022-03-20');
    });

    it('calculate proper day range for 7 days period', () => {
        const service = new StatsIndexerService(apiFactory);

        const range = service.getDateRange('7 days');

        expect(getDateString(range.start)).toBe('2022-03-13');
        expect(getDateString(range.end)).toBe('2022-03-20');
    });

    it('calculate proper day range for 1 year period', () => {
        const service = new StatsIndexerService(apiFactory);

        const range = service.getDateRange('1 year');

        expect(getDateString(range.start)).toBe('2021-03-20');
        expect(getDateString(range.end)).toBe('2022-03-20');
    });
});
