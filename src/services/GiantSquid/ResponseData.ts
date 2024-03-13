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
    extrinsic: {
        events: DappStakingEvent[];
    };
}

export interface DappStakingEvent {
    argsStr: string[];
    eventName: string;
    palletName: string;
    extrinsicHash: string;
    timestamp: string;
}
