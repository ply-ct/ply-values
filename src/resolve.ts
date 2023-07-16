import { isRegex } from './expression';
import { Logger } from './model/log';

export const resolve = (
    expression: string,
    context: any,
    trusted = false,
    logger?: Logger
): string => {
    if (trusted) return resolveTrusted(expression, context, logger);
    if (isRegex(expression)) return expression;

    return '' + safeEval(expression, context, logger);
};

/**
 * Same as resolve(), but returns undefined if unresolved
 */
export const resolveIf = (
    expression: string,
    context: any,
    trusted = false,
    logger?: Logger
): string | undefined => {
    const res = resolve(expression, context, trusted, logger);
    return res.startsWith('${') ? undefined : res;
};

export const safeEval = (expression: string, context: any, _logger?: Logger): any => {
    // escape all \
    let path = expression.replace(/\\/g, '\\\\');
    // trim ${ and }
    path = path.substring(2, path.length - 1);

    // directly contains expression (flat obj or user-entered values in vscode)
    const type = typeof context[path];
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return context[path];
    }

    let res: any = context;
    for (const seg of tokenize(path, context)) {
        if (!res[seg]) return expression;
        res = res[seg];
    }

    return res;
};

export const resolveTrusted = (expression: string, context: any, logger?: Logger): string => {
    if (expression.startsWith('${~')) return expression; // ignore regex

    let expr = expression;
    if (!(expr.startsWith('${') && expr.endsWith('}'))) {
        expr = '${' + expr + '}';
    }

    let keys = Object.keys(context);

    // weed out invalid prop names (only top-level)
    const evalContext = context ? { ...context } : {};
    keys = keys.filter((key) => {
        const ok = isValidPropName(key);
        if (!ok) {
            delete evalContext[key];
            logger?.error(`Bad property name: ${key}`);
        }
        return ok;
    });

    try {
        const fun = new Function(...keys, 'return `' + expr + '`');
        const res = fun(...Object.values(evalContext));
        return res === 'undefined' ? expression : res;
    } catch (err: unknown) {
        if (`${err}`.startsWith('ReferenceError: ')) {
            logger?.error(`${err}`); // expression key not found
        } else {
            logger?.error(`${err}: ${expression}`, err);
        }
        return expression;
    }
};

export const isValidPropName = (prop: string): boolean => {
    if (jsReservedWords.includes(prop)) return false;
    return !!prop.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/);
};

export const tokenize = (path: string, context: any): (string | number)[] => {
    return path.split(/\.(?![^[]*])/).reduce((segs: (string | number)[], seg) => {
        if (seg.search(/\[.+?]$/) > 0) {
            // indexer(s)
            const start = seg.indexOf('[');
            segs.push(seg.substring(0, start));
            let remains = seg.substring(start);
            while (remains.length > 0) {
                const indexer = remains.substring(1, remains.indexOf(']'));
                if (
                    (indexer.startsWith("'") && indexer.startsWith("'")) ||
                    (indexer.endsWith('"') && indexer.endsWith('"'))
                ) {
                    segs.push(indexer.substring(1, indexer.length - 1)); // object property
                } else {
                    let idx = parseInt(indexer);
                    if (isNaN(idx)) {
                        // indexer is expression
                        const val = resolve('${' + indexer + '}', context);
                        idx = parseInt(val);
                        if (isNaN(idx)) {
                            segs.push(val);
                        } else {
                            segs.push(idx); // array index
                        }
                    } else {
                        segs.push(idx); // array index
                    }
                }
                remains = remains.substring(indexer.length + 2);
            }
        } else {
            segs.push(seg);
        }
        return segs;
    }, []);
};

const jsReservedWords = [
    // https://mathiasbynens.be/notes/reserved-keywords#ecmascript-6
    'do',
    'if',
    'in',
    'for',
    'let',
    'new',
    'try',
    'var',
    'case',
    'else',
    'enum',
    'eval',
    'null',
    'this',
    'true',
    'void',
    'with',
    'await',
    'break',
    'catch',
    'class',
    'const',
    'false',
    'super',
    'throw',
    'while',
    'yield',
    'delete',
    'export',
    'import',
    'public',
    'return',
    'static',
    'switch',
    'typeof',
    'default',
    'extends',
    'finally',
    'package',
    'private',
    'continue',
    'debugger',
    'function',
    'arguments',
    'interface',
    'protected',
    'implements',
    'instanceof',
    // These aren’t strictly reserved words, but they kind of behave as if they were.
    'NaN',
    'Infinity',
    'undefined'
];
