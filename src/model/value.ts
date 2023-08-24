import { Logger } from './log';

export type Values = { [key: string]: any };
export type Context = { [key: string]: any };
export type ValueType = string | number | boolean | Date | null;

export interface EvalOptions {
    trusted?: boolean;
    refHolder?: string;
    env?: EnvironmentVariables;
    logger?: Logger;
}

export type EnvironmentVariables = { [key: string]: string | undefined };

export interface ValuesLocation {
    /**
     * File or URL
     */
    path: string;
    /**
     * someday maybe
     */
    line?: number;
}

export interface LocatedValue {
    value: string;
    location?: ValuesLocation;
}

export interface ValuesHolder {
    /**
     * Values object
     */
    values: object;
    location?: ValuesLocation;
    /**
     * Required value names
     */
    required?: string[];
}
