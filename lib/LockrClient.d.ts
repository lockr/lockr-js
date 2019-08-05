import { GraphQLQuery, Settings } from './types';
export default class LockrClient {
    private settings;
    private _session?;
    constructor(settings: Settings);
    close(): void;
    query(data: GraphQLQuery): Promise<any>;
    private readonly session;
}
