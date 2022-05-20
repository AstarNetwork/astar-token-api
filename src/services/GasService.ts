/* eslint-disable  @typescript-eslint/no-explicit-any */

import { injectable, inject } from 'inversify';
import { ethers } from 'ethers';
import { IApiFactory } from '../client/ApiFactory';
import { networks, NetworkType } from '../networks';

import axios from 'axios';

export const calculatePriorityFeeToTip = (fee: string) => {
    //Rate: https://stakesg.slack.com/archives/C028YNW1PED/p1652343972144359?thread_ts=1652338487.358459&cid=C028YNW1PED
    const rate = 15;
    const eth = ethers.utils.formatUnits(fee, rate);
    const wei = ethers.utils.parseEther(eth).toString();
    return wei;
};

export type Gas = {
    slow: string;
    average: string;
    fast: string;
    timestamp: number;
    eip1559: {
        priorityFeePerGas: {
            slow: string;
            average: string;
            fast: string;
        };
        baseFeePerGas: string;
    };
    tip: {
        slow: string;
        average: string;
        fast: string;
    };
};

const blockInterval = 12000;
const historicalBlocks = 200;
const timestamp = Date.now();

export const estimate = {
    shibuya: {
        slow: '3535532476',
        average: '4504034937',
        fast: '58799450137',
        timestamp: timestamp,
        eip1559: {
            priorityFeePerGas: {
                slow: '2535532476',
                average: '3504034937',
                fast: '57799450137',
            },
            baseFeePerGas: '1000000000',
        },
        tip: {
            slow: calculatePriorityFeeToTip('2535532476'),
            average: calculatePriorityFeeToTip('3504034937'),
            fast: calculatePriorityFeeToTip('57799450137'),
        },
    },
    shiden: {
        slow: '3535532476',
        average: '4504034937',
        fast: '58799450137',
        timestamp: timestamp,
        eip1559: {
            priorityFeePerGas: {
                slow: '2535532476',
                average: '3504034937',
                fast: '57799450137',
            },
            baseFeePerGas: '1000000000',
        },
        tip: {
            slow: calculatePriorityFeeToTip('2535532476'),
            average: calculatePriorityFeeToTip('3504034937'),
            fast: calculatePriorityFeeToTip('57799450137'),
        },
    },
    astar: {
        slow: '3535532476',
        average: '4504034937',
        fast: '58799450137',
        timestamp: timestamp,
        eip1559: {
            priorityFeePerGas: {
                slow: '2535532476',
                average: '3504034937',
                fast: '57799450137',
            },
            baseFeePerGas: '1000000000',
        },
        tip: {
            slow: calculatePriorityFeeToTip('2535532476'),
            average: calculatePriorityFeeToTip('3504034937'),
            fast: calculatePriorityFeeToTip('57799450137'),
        },
    },
};

function avg(arr: number[]) {
    const sum = arr.reduce((a, v) => a + v);
    return Math.round(sum / arr.length);
}

function formatFeeHistory(result: any): any {
    try {
        let blockNum = Number(result.oldestBlock);
        let index = 0;
        const blocks = [];

        while (blockNum < Number(result.oldestBlock) + historicalBlocks && result.reward && result.reward[index]) {
            blocks.push({
                number: blockNum,
                baseFeePerGas: Number(result.baseFeePerGas[index]),
                gasUsedRatio: Number(result.gasUsedRatio[index]),
                priorityFeePerGas: result.reward[index].map((x: any) => Number(x)),
            });
            blockNum += 1;
            index += 1;
        }

        return blocks;
    } catch (error) {
        return [];
    }
}

export async function harvest(network: 'astar' | 'shiden' | 'shibuya') {
    try {
        const url = networks[network].evmRpc;

        let body: any = {
            jsonrpc: '2.0',
            method: 'eth_feeHistory',
            params: [historicalBlocks.toString(16), 'latest', [10, 70, 90]],
            id: 1,
        };

        const feeHistoryResult = await axios.post(url, body);
        const feeHistoryData = feeHistoryResult.data;

        if (!feeHistoryData || !feeHistoryData.result || feeHistoryData.error) {
            throw new Error(JSON.stringify(feeHistoryData));
        }

        const feeHistory = feeHistoryData.result;

        const blocks = formatFeeHistory(feeHistory);

        if (blocks.length === 0) {
            return;
        }

        const slow = avg(blocks.map((b: any) => b.priorityFeePerGas[0]));
        const average = avg(blocks.map((b: any) => b.priorityFeePerGas[1]));
        const fast = avg(blocks.map((b: any) => b.priorityFeePerGas[2]));

        body = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['latest', false],
            id: 2,
        };

        const blockResult = await axios.post(url, body);
        const blockData = blockResult.data;

        if (!blockData || !blockData.result || blockData.error) {
            throw new Error(JSON.stringify(blockData));
        }

        const block = blockData.result;

        const baseFeePerGas = Number(block.baseFeePerGas) || (blocks[0] && blocks[0].baseFeePerGas) || 1000000000;

        estimate[network] = {
            slow: String(slow + baseFeePerGas),
            average: String(average + baseFeePerGas),
            fast: String(fast + baseFeePerGas),
            timestamp: Date.now(),
            eip1559: {
                priorityFeePerGas: {
                    slow: String(slow),
                    average: String(average),
                    fast: String(fast),
                },
                baseFeePerGas: String(baseFeePerGas),
            },
            tip: {
                slow: calculatePriorityFeeToTip(String(slow)),
                average: calculatePriorityFeeToTip(String(average)),
                fast: calculatePriorityFeeToTip(String(fast)),
            },
        };
        // console.log('gas estimate:', network, estimate[network]);
    } catch (error) {
        console.error('Error harvesting gas data');
        console.error(error);
    }
}

export interface IGasService {
    gasNow(network?: NetworkType): Promise<Gas>;
}

@injectable()
/**
 * Gas price service.
 */
export class GasService implements IGasService {
    constructor(@inject('factory') private _apiFactory: IApiFactory) {}

    public async gasNow(network: 'astar' | 'shiden' | 'shibuya' = 'astar'): Promise<Gas> {
        return estimate[network];
    }
}

harvest('shibuya');
harvest('shiden');
harvest('astar');
setInterval(() => {
    harvest('shibuya');
    harvest('shiden');
    harvest('astar');
}, blockInterval);
