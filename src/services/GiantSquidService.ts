import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { decodeAddress } from '@polkadot/util-crypto';
import { PeriodType, ServiceBase } from './ServiceBase';

export interface IGiantSquidService {
  getUserCalls(network: NetworkType, address: string, period: PeriodType): Promise<any>;
}


// Handles calls to SubSquid giant squid indexer. 
@injectable()
export class GiantSquidService extends ServiceBase implements IGiantSquidService {
  public async getUserCalls(network: NetworkType, address: string, period: PeriodType): Promise<any> {
    Guard.ThrowIfUndefined('network', network);
    Guard.ThrowIfUndefined('address', address);

    const privateKey = `0x${Buffer.from(decodeAddress(address)).toString('hex')}`;
    const range = this.getDateRange(period);

    const query = `query MyQuery {
      calls(where: {
          palletName_eq: "DappsStaking",
          callerPublicKey_eq: "${privateKey}",
          timestamp_gte: "${range.start.toISOString()}",
          timestamp_lte: "${range.end.toISOString()}",
          callName_not_contains: "claim"
        }, orderBy: block_id_DESC) {
        callName
        palletName
        argsStr
        callerPublicKey
        extrinsicHash
        success
        timestamp
        id
      }
    }`;

    const result = await axios.post(this.getApiUrl(network), {
      operationName: 'MyQuery',
      query,
    });
    console.log(result.data.calls);
    
    return null;
  }

  private getApiUrl(network: NetworkType): string {
    return `https://squid.subsquid.io/gs-explorer-${network}/graphql`;
  }
}