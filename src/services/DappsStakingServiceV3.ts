import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { PeriodType, ServiceBase } from './ServiceBase';
import { UserEvent } from '../models/DappStaking';
import { DappStakingCallData, DappStakingCallResponse } from './GiantSquid/ResponseData';
import container from '../container';
import { ICallParser } from './GiantSquid/CallParser';
import { CallNameMapping } from './GiantSquid/CallNameMapping';

export interface IDappsStakingServiceV3 {
    getStakingEvents(network: NetworkType, address: string, period: PeriodType): Promise<UserEvent[]>;
}

// Handles calls to SubSquid giant squid indexer.
@injectable()
export class DappsStakingServiceV3 extends ServiceBase implements IDappsStakingServiceV3 {
    public async getStakingEvents(network: NetworkType, address: string, period: PeriodType): Promise<UserEvent[]> {
        Guard.ThrowIfUndefined('network', network);
        Guard.ThrowIfUndefined('address', address);

        if (network !== 'astar') {
            return [];
        }

        const publicKey = u8aToHex(decodeAddress(address));
        const range = this.getDateRange(period);

        const query = `query MyQuery {
            stakingEvents(where: {
                userAddress_eq: "${publicKey}",
                timestamp_gte: "${range.start.toISOString()}", 
                timestamp_lte: "${range.end.toISOString()}"
            }, orderBy: blockNumber_DESC) {
              amount
              blockNumber
              contractAddress
              id
              timestamp
              transaction
              userAddress
            }
          }`;

        const result = await axios.post<DappStakingCallResponse>(this.getApiUrl(network), {
            operationName: 'MyQuery',
            query,
        });

        return this.parseStakingEvents(result.data.data.stakingEvents);
    }

    private getApiUrl(network: NetworkType): string {
        return `http://localhost:4350/graphql`;
    }

    private parseStakingEvents(calls: DappStakingCallData[]): UserEvent[] {
        const result: UserEvent[] = [];

        for (const call of calls) {
            if (CallNameMapping[call.callName]) {
                const parser = container.get<ICallParser>(CallNameMapping[call.callName]);
                try {
                    result.push(parser.parse(call));
                } catch (e) {
                    console.log(e);
                    // Nothing special to do here. Batch call parser raised an error because batch the call doesn't contain claim calls.
                }
            } else {
                // Call is not supported. Do nothing. Currently only calls defined in CallNameMapping are supported.
            }
        }

        return result;
    }
}
