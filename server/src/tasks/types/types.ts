export interface GraphileHelpers {
    logger: {
        info: GraphileLogger;
        warn: GraphileLogger;
    }
}

export type GraphileLogger = (arg0: string) => void;
