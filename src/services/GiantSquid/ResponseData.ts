export interface DappStakingCallResponse {
    data: {
        calls: DappStakingCallData[];
    };
}

export interface DappStakingCallData {
    callName: string;
    argsStr: string[];
    extrinsicHash: string;
    success: boolean;
    timestamp: string;
}
