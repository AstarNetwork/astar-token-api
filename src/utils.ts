// Methos copied from astar-apps plasmUtil
// TODO move to common library

import BN from 'bn.js';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { isString } from '@polkadot/util';

/**
 * A helper function to convert the given node balance value into the given chain token decimal point as a string.
 * EX: `femto` -> `PLM`
 * @param bal the account balance in the minimum denominator
 * @param decimal the decimal point it should convert to
 * @returns the reduced value in string number
 */
export const reduceBalanceToDenom = (bal: BN, decimal: number): string => {
    const decPoint = new BN(10).pow(new BN(decimal));
    const formatted = bal.div(decPoint);
    return formatted.toString();
};

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
