import axios from 'axios';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { NetworkType } from '../networks';
import { PeriodTypeEra } from './StatsIndexerService';

const API_URLS = {
    astar: 'https://api.subquery.network/sq/bobo-k2/astar-dapp-staking-v2',
    shiden: 'https://api.subquery.network/sq/bobo-k2/shiden-dapp-staking',
};

interface ContractStats {
    era: string;
    numberOfCalls: string;
    uniqueActiveUsers: string;
}

interface ContractStatsResponse {
    data: {
        callByEras: {
            nodes: ContractStats[];
        };
    };
}

interface UserEvent {
    timestamp: number;
    contractAddress: number;
    transaction: string;
    amount: string;
}

interface UserEventsResponse {
    data: {
        userTransactions: {
            nodes: UserEvent[];
        };
    };
}

export interface IDappsStakingStatsService {
    getContractStatistics(network: NetworkType, contractAddress: string, period: PeriodTypeEra): Promise<ContractStats[]>;
    getUserEvents(network: NetworkType, userAddress: string): Promise<UserEvent[]>;
}

@injectable()
export class DappsStakingStatsService implements IDappsStakingStatsService {
    constructor(@inject(ContainerTypes.ApiFactory) private apiFactory: IApiFactory) {}
    public async getContractStatistics(network: NetworkType, contractAddress: string, period: PeriodTypeEra = '7 eras'): Promise<ContractStats[]> {
        if (!contractAddress || network !== 'astar') {
            return [];
        }

        const api = this.apiFactory.getApiInstance(network);
        const currentEra = await api.getCurrentEra();
        const erasToFetch = this.getEraFromPeriod(period);

        const apiResult = await axios.post<ContractStatsResponse>(API_URLS[network], {
            query: `query {
          callByEras(last: ${erasToFetch}, filter: {
            contractAddress: {
              equalTo: "${contractAddress}"
            }
          }, orderBy: ERA_ASC) {
            nodes {
              era,
              timestamp,
              numberOfCalls,
              uniqueActiveUsers,
            }
          }
        }`,
        });

        const calls = apiResult.data.data.callByEras.nodes;

        // TODO check if this logic for filling in gaps in data is required.
        // const result: ContractStats[] = [];
        // let expectedEra = this.getFirstEraFromPeriod(period, currentEra);

        // if (calls.length > 0) {
        //     // Handle missing contract statistics from era 1 to first contact call era
        //     for (let era = expectedEra; era < parseInt(calls[0].era); era++) {
        //         result.push(this.getEmptyContractStats(era));
        //         expectedEra++;
        //     }

        //     // Add era statistics from API and handle missing eras inside API data
        //     for (let i = 0; i < calls.length; i++) {
        //         const call = calls[i];
        //         if (expectedEra === parseInt(call.era)) {
        //             result.push(call);
        //         } else {
        //             result.push(this.getEmptyContractStats(expectedEra));
        //             i--; // wait with processing of the next call until enough empty stats are inserted.
        //         }

        //         expectedEra++;
        //     }
        // }

        // // Add eras until current era
        // for (let era = expectedEra; era < currentEra; era++) {
        //     result.push(this.getEmptyContractStats(era));
        // }

        // return result;

        return calls;
    }

    public async getUserEvents(network: NetworkType, userAddress: string): Promise<UserEvent[]> {
        if (!userAddress || network !== 'astar') {
            return [];
        }

        const result = await axios.post<UserEventsResponse>(API_URLS[network], {
            query: `query {
              userTransactions(filter: {
                userAddress: {
                  equalTo: "${userAddress}"
                }
              }) {
                nodes {
                  timestamp,
                  contractAddress,
                  transaction,
                  transactionHash,
                  transactionSuccess,
                  amount
                }
              }
            }`,
        });

        return result.data.data.userTransactions.nodes;
    }

    private getEmptyContractStats(era: number): ContractStats {
        return {
            era: era.toString(),
            numberOfCalls: '0',
            uniqueActiveUsers: '0',
        };
    }

    private getEraFromPeriod(period: PeriodTypeEra): number {
        switch(period) {
            case '7 eras':
                return 7;
            case '30 eras':
                return 30;
            case '90 eras':
                return 90
            default:
                return 1000000000;
        }
    }

    private getFirstEraFromPeriod(period: PeriodTypeEra, currentEra: number): number {
        let result = currentEra - this.getEraFromPeriod(period);

        if (result < 1) {
            result = 1;
        }

        return result;
    }
}
