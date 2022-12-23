import { injectable } from 'inversify';
import { Response } from 'express';

@injectable()
export class ControllerBase {
    protected handleError(res: Response, err: Error) {
        const ERROR_STATUS = 500;
        res.status(ERROR_STATUS).send(err.message);
    }

    protected handleNotFound(res: Response) {
        const NOT_FOUND_STATUS = 404;
        res.status(NOT_FOUND_STATUS).send('Dapp not found');
    }
}
