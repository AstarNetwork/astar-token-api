import { injectable } from 'inversify';
import { UserEvent } from '../../models/DappStaking';
import { DappStakingCallData } from './ResponseData';
import { CallNameMapping } from './CallNameMapping';

export interface ICallParser {
    parse(call: DappStakingCallData): UserEvent;
}

@injectable()
export class CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        return {
            timestamp: new Date(call.timestamp).getTime(),
            transaction: CallNameMapping[call.callName],
            transactionHash: call.extrinsicHash,
            transactionSuccess: call.success,
        };
    }
}

@injectable()
export class BondAndStakeParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[1];
        result.amount = call.argsStr[2];

        return result;
    }
}

@injectable()
export class UnbondAndUnstakeParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[1];
        result.amount = call.argsStr[2];

        return result;
    }
}

@injectable()
export class NominationTransferParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[3];
        result.amount = call.argsStr[4];

        return result;
    }
}

@injectable()
export class WithdrawParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);

        return result;
    }
}

@injectable()
export class WithdrawFromUnbondedParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);

        return result;
    }
}
