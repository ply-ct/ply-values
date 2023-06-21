export interface Request {
    name: string;
    url: string;
    method: string;
    headers: {
        [key: string]: string;
    };
    body?: string;
    source: string;
}

export interface RequestSuite {
    name: string;
    path: string;
    requests: Request[];
}

export interface Flow {
    name: string;
    attributes?: { [key: string]: string };
    steps: Step[];
    subflows?: Subflow[];
}

export interface Step {
    id: string;
    name: string;
    /**
     * Logical path for descriptor, or for custom steps
     * this is the module path to ts file.
     */
    path: string;
    attributes?: { [key: string]: string };
    type: 'step';
    links?: Link[];
}

export interface Link {
    id: string;
    to: string;
    attributes?: { [key: string]: string };
    type: 'link';
    event?: 'Finish' | 'Error' | 'Cancel' | 'Delay' | 'Resume';
    result?: string;
}

export interface Subflow {
    id: string;
    name: string;
    steps?: Step[];
    attributes?: { [key: string]: string };
    type: 'subflow';
}
