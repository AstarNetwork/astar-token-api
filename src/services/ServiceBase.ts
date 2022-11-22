import { injectable } from 'inversify';

export type PeriodType = '7 days' | '30 days' | '90 days' | '1 year';
export type PeriodTypeEra = '7 eras' | '30 eras' | '90 eras' | 'all';
export type Pair = { date: number; value: number };
export type DateRange = { start: Date; end: Date };

const DEFAULT_RANGE_LENGTH_DAYS = 7;

@injectable()
export abstract class ServiceBase {
    protected getDateRange(period: PeriodType): DateRange {
        const end = new Date();
        const numberOfDays = this.getPeriodDurationInDays(period);

        const start = new Date();
        start.setDate(start.getDate() - numberOfDays);

        return {
            start,
            end,
        };
    }

    protected getPeriodDurationInDays(period: PeriodType): number {
        const parts = period.toString().split(' ');
        let numberOfDays: number;

        try {
            numberOfDays = Number(parts[0]) * (parts[1].startsWith('year') ? 365 : 1);
        } catch {
            numberOfDays = DEFAULT_RANGE_LENGTH_DAYS;
        }

        return numberOfDays;
    }
}
