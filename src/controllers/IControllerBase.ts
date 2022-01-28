import express from 'express';

export interface IControllerBase {
    register(app: express.Application): void;
}
