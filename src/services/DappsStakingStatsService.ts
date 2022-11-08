import axios from 'axios';
import { injectable } from 'inversify';
import { NetworkType } from '../networks';

const API_URLS = {
    astar: 'http://localhost:3000',
    shiden: 'http://localhost:3000',
};

interface ContractStats {
    era: number;
    numberOfCalls: number;
    uniqueActiveUsers: number;
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
    getContractStatistics(network: NetworkType, contractAddress: string): Promise<ContractStats[]>;
    getUserEvents(network: NetworkType, userAddress: string): Promise<UserEvent[]>;
}

@injectable()
export class DappsStakingStatsService implements IDappsStakingStatsService {
    public async getContractStatistics(network: NetworkType, contractAddress: string): Promise<ContractStats[]> {
        if (!contractAddress || !this.isNetworkSupported(network)) {
            return [];
        }

        const result = await axios.post<ContractStatsResponse>('http://localhost:3000', {
            query: `query {
          callByEras(filter: {
            contractAddress: {
              equalTo: "${contractAddress}"
            }
          }) {
            nodes {
              era,
              numberOfCalls,
              uniqueActiveUsers,
            }
          }
        }`,
        });

        return result.data.data.callByEras.nodes;
    }

    public async getUserEvents(network: NetworkType, userAddress: string): Promise<UserEvent[]> {
        if (!userAddress || !this.isNetworkSupported(network)) {
            return [];
        }

        const result = await axios.post<UserEventsResponse>('http://localhost:3000', {
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
                  amount
                }
              }
            }`,
        });

        return result.data.data.userTransactions.nodes;
    }

    private isNetworkSupported(network: NetworkType): boolean {
        return network === 'astar' || network === 'shiden';
    }
}
