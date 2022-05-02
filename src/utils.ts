// Methos copied from astar-apps plasmUtil
// TODO move to common library

import BN from 'bn.js';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { isString } from '@polkadot/util';
import { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';

/**
 * Convert the given value into the given token decimal point WITHOUT losing decimals.
 * @param value eg: value.toString() -> '12999999999999000000'
 * @param decimal eg: 18
 * @returns '12.999999999999'
 */
export const defaultAmountWithDecimals = (value: BN | BigNumber | string, decimal: number): string => {
    const strToBig = (str: string) => BigNumber.from(str.toString());

    if (isString(value)) {
        const hexValue = strToBig(value);
        return formatFixed(hexValue, decimal);
    }

    try {
        const hexValue = value.toJSON();
        return formatFixed(hexValue, decimal);
    } catch (error) {
        const bigValue = strToBig(value.toString());
        const hexValue = bigValue.toJSON();
        return formatFixed(hexValue, decimal);
    }
};

export const getDateUTC = (date: Date) => {
    const utcDate = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    );

    return new Date(utcDate);
};

export const getDateYyyyMmDd = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const getSubscanUrl = (network: string): string => {
    switch (network) {
        case 'astar':
            return 'https://astar.api.subscan.io';
        case 'shiden':
            return 'https://shiden.api.subscan.io';
        case 'shibuya':
            return 'https://shibuya.api.subscan.io';
        default:
            return 'https://astar.api.subscan.io';
    }
};

export const getSubscanOption = () => {
    const apiKey = String(process.env.SUBSCAN_API_KEY);
    const options: AxiosRequestConfig = {};
    if (apiKey) {
        options.headers = { 'X-API-Key': apiKey };
    }
    
    return options;
}
