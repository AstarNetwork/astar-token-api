import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { decodeAddress } from '@polkadot/util-crypto';
import { PeriodType, ServiceBase } from './ServiceBase';
import { UserEvent } from '../models/DappStaking';
import { DappStakingCallData, DappStakingCallResponse } from './GiantSquid/ResponseData';
import container from '../container';
import { ICallParser } from './GiantSquid/CallParser';
import { CallNameMapping } from './GiantSquid/CallNameMapping';

export interface IGiantSquidService {
    getUserCalls(network: NetworkType, address: string, period: PeriodType): Promise<UserEvent[]>;
}

// Handles calls to SubSquid giant squid indexer.
@injectable()
export class GiantSquidService extends ServiceBase implements IGiantSquidService {
    public async getUserCalls(network: NetworkType, address: string, period: PeriodType): Promise<UserEvent[]> {
        Guard.ThrowIfUndefined('network', network);
        Guard.ThrowIfUndefined('address', address);

        if (network !== 'shiden' && network !== 'astar' && network !== 'shibuya') {
            return [];
        }

        const publicKey = `0x${Buffer.from(decodeAddress(address)).toString('hex')}`;
        const range = this.getDateRange(period);

        const query = `query MyQuery {
            calls(where: {
                callerPublicKey_eq: "${publicKey}",
                palletName_eq: "DappsStaking",
                timestamp_gte: "${range.start.toISOString()}",
                timestamp_lte: "${range.end.toISOString()}",
                OR: {
                    callerPublicKey_eq: "${publicKey}",
                    callName_contains: "batch",
                    palletName_eq: "Utility",
                    timestamp_gte: "${range.start.toISOString()}",
                    timestamp_lte: "${range.end.toISOString()}",
                },
                callName_not_contains: "claim"
                }, orderBy: block_timestamp_DESC) {
              callName
              argsStr
              palletName
              success
              timestamp
              extrinsicHash
              extrinsic {
                events {
                  argsStr
                  eventName
                  palletName
                  extrinsicHash
                  timestamp
                }
              }
            }
          }`;

        const result = await axios.post<DappStakingCallResponse>(this.getApiUrl(network), {
            operationName: 'MyQuery',
            query,
        });

        return this.parseUserCalls(result.data.data.calls);
    }

    private getApiUrl(network: NetworkType): string {
        return `https://squid.subsquid.io/gs-explorer-${network}/graphql`;
    }

    private parseUserCalls(calls: DappStakingCallData[]): UserEvent[] {
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
