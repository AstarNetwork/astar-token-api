export interface UserEvent {
    timestamp: number;
    contractAddress?: string;
    transaction: string;
    amount?: string;
    transactionHash: string;
    transactionSuccess: boolean;
}
