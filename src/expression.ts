import { Flow, Request, RequestSuite } from './model/ply';

export interface Expression {
    text: string;
    start: number;
    end: number;
}

export const findExpressions = (line: string): Expression[] => {
    const expressions: Expression[] = [];
    const regex = /\$\{.+?\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
        const text = match[0];
        expressions.push({ text, start: match.index, end: match.index + text.length - 1 });
    }
    return expressions;
};

export const isExpression = (input: string): boolean => {
    return input.startsWith('${') && input.endsWith('}');
};

export const toExpression = (input: string): string => {
    return '${' + input + '}';
};

export const isRegex = (expression: string): boolean => {
    return expression.startsWith('${~');
};

export const isRef = (expression: string): boolean => {
    return expression.startsWith('${@');
};

export const replaceRefs = (expression: string, holder: string): string => {
    return expression.replace(/\${@\[/g, '${' + holder + '[').replace(/\${@/g, '${' + holder + '.');
};

export type ExpressionHolder = Request | RequestSuite | Flow;
export const isRequest = (holder: ExpressionHolder): holder is Request => {
    return !!(holder as Request).method && !!(holder as Request).url;
};
export const isRequestSuite = (holder: ExpressionHolder): holder is RequestSuite => {
    return !!(holder as RequestSuite).name && Array.isArray((holder as RequestSuite).requests);
};
export const isFlow = (holder: ExpressionHolder): holder is Flow => {
    return !!(holder as Flow).name && Array.isArray((holder as Flow).steps);
};

/**
 * returns an array sorted by expression text
 */
export const expressions = (holder: ExpressionHolder, refs = false): string[] => {
    if (isRequest(holder)) {
        return requestExpressions(holder, refs).sort();
    } else if (isRequestSuite(holder)) {
        return holder.requests
            .reduce((exprs, req) => {
                exprs.push(...requestExpressions(req, refs).filter((e) => !exprs.includes(e)));
                return exprs;
            }, [] as string[])
            .sort();
    } else if (isFlow(holder)) {
        return flowExpressions(holder, refs).sort();
    } else {
        return [];
    }
};

export const requestExpressions = (request: Request, refs: boolean): string[] => {
    let expressions = [
        ...getExpressions(request.method),
        ...getExpressions(request.url),
        ...Object.keys(request.headers).reduce((exprs, key) => {
            exprs = [...exprs, ...getExpressions(request.headers[key])];
            return exprs;
        }, [] as string[])
    ];
    if (request.body) {
        expressions = [...expressions, ...getExpressions(request.body)];
    }

    return expressions.filter((expr, i) => {
        if (expr.startsWith('${@') && !refs) return false;
        return !expressions.slice(0, i).includes(expr); // no dups
    });
};

export const flowExpressions = (flow: Flow, refs: boolean): string[] => {
    let expressions: string[] = [];
    if (flow.attributes?.values) {
        const rows: string[][] = JSON.parse(flow.attributes.values);
        expressions = rows.reduce((exprs, row) => {
            exprs.push(`\${${row[0]}}`);
            return exprs;
        }, []);
    }

    const attributeExpressions = (attributes?: { [key: string]: string }): string[] => {
        if (attributes) {
            return Object.keys(attributes).reduce((exprs, attrKey) => {
                exprs.push(...getExpressions(attributes[attrKey]));
                return exprs;
            }, [] as string[]);
        }
        return [];
    };

    if (flow.steps) {
        flow.steps.forEach(
            (step) => (expressions = [...expressions, ...attributeExpressions(step.attributes)])
        );
    }
    if (flow.subflows) {
        flow.subflows.forEach((subflow) => {
            expressions = [...expressions, ...attributeExpressions(subflow.attributes)];
            if (subflow.steps) {
                subflow.steps.forEach(
                    (step) =>
                        (expressions = [...expressions, ...attributeExpressions(step.attributes)])
                );
            }
        });
    }

    return expressions.filter((expr, i) => {
        if (expr.startsWith('${@') && !refs) return false;
        return !expressions.slice(0, i).includes(expr); // no dups
    });
};

export const getExpressions = (content?: string): string[] => {
    return content?.match(/\$\{.+?}/g) || [];
};
