import { injectable } from 'inversify';
import { Response } from 'express';

@injectable()
export class ControllerBase {
    protected handleError(res: Response, err: Error) {
        const ERROR_STATUS = 500;
        res.status(ERROR_STATUS).json({
            message: err.message,
        });
    }

    protected handleNotFound(res: Response) {
        const NOT_FOUND_STATUS = 404;
        res.status(NOT_FOUND_STATUS).send('Dapp not found');
    }

    /**
     * Responds to routes backed by the retired dApp staking indexer.
     */
    protected handleRetired(res: Response) {
        const GONE_STATUS = 410;
        res.status(GONE_STATUS).json({
            message: 'This endpoint has been retired. Query the chain directly for current dApp staking state.',
        });
    }
}
