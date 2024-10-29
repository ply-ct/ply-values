import { expect } from 'chai';
import { isValidPropName, resolve, tokenize } from '../src/resolve';

describe('resolve', () => {
    it('tokenizes complex expressions', () => {
        let tokens = tokenize("greeting.response.body['friendly.greetings'][0].salutation", {});
        expect(tokens[0]).to.be.equal('greeting');
        expect(tokens[1]).to.be.equal('response');
        expect(tokens[2]).to.be.equal('body');
        expect(tokens[3]).to.be.equal('friendly.greetings');
        expect(tokens[4]).to.be.equal(0);
        expect(tokens[5]).to.be.equal('salutation');

        tokens = tokenize('multidim[0][3][1001]', {});
        expect(tokens[0]).to.be.equal('multidim');
        expect(tokens[1]).to.be.equal(0);
        expect(tokens[2]).to.be.equal(3);
        expect(tokens[3]).to.be.equal(1001);

        tokens = tokenize('foos[12].bar.baz[3]', {});
        expect(tokens[0]).to.be.equal('foos');
        expect(tokens[1]).to.be.equal(12);
        expect(tokens[2]).to.be.equal('bar');
        expect(tokens[3]).to.be.equal('baz');
        expect(tokens[4]).to.be.equal(3);
    });

    it('evaluates untrusted array index', () => {
        const input = '${titles[loopCount]}';
        const values = {
            loopCount: 0,
            titles: ['Frankenstein', 'Island of Lost Souls', 'The Invisible Man']
        };
        const output = resolve(input, values);
        expect(output).to.be.equal('Frankenstein');
    });

    it('evaluates untrusted object index', () => {
        const input = '${titles[item]}';
        const values = {
            item: 'two',
            titles: {
                one: 'Frankenstein',
                two: 'Island of Lost Souls',
                three: 'The Invisible Man'
            }
        };
        const output = resolve(input, values);
        expect(output).to.be.equal('Island of Lost Souls');
    });

    it('handles expression context keys', () => {
        const context = {
            foo: 'bar',
            '${something}': 'else',
            '${now.is.the.time}': '12:00 sharp',
            '${is.a.number}': 12345
        };

        expect(resolve('${foo}', context)).to.be.equal('bar');
        expect(resolve('${something}', context)).to.be.equal('else');
        expect(resolve('${now.is.the.time}', context)).to.be.equal('12:00 sharp');
        expect(resolve('${is.a.number}', context)).to.be.equal(12345);
        expect(resolve('${not.there}', context)).to.be.equal('${not.there}');
    });

    it('recognizes invalid property names', () => {
        expect(isValidPropName('for')).to.be.false;
        expect(isValidPropName('good')).to.be.true;
        expect(isValidPropName('not.good')).to.be.false;
        expect(isValidPropName('%worse')).to.be.false;
    });

    it('handles invalid context key', () => {
        const nestedBad = {
            foo: 'bar',
            x: 3,
            goodKey: 'always',
            titles: {
                'new.one': 'Frankenstein',
                two: 'Island of Lost Souls'
            }
        };

        const x = resolve('${x}', nestedBad, true, console);
        expect(x).to.equal('3');
        const newOne = resolve("${titles['new.one']}", nestedBad, true, console);
        expect(newOne).to.equal('Frankenstein');

        const topBad = {
            'bad.key': 'never',
            new: 'also bad',
            goodKey: 'always',
            titles: {
                'not.new': 'Island of Lost Souls',
                two: 'The Invisible Man'
            }
        };

        let good = resolve('${goodKey}', topBad, false, console);
        expect(good).to.be.equal('always');

        good = resolve('${goodKey}', topBad, true, console);
        expect(good).to.be.equal('always');
    });

    it('handles missing context key', () => {
        const context = {
            foo: 'bar'
        };

        let missed = resolve('${missing.noway}', context, true);
        expect(missed).to.be.equal('${missing.noway}');
        missed = resolve('${missing.noway}', context, false);
        expect(missed).to.be.equal('${missing.noway}');

        missed = resolve("${missing['noway']}", context, true);
        expect(missed).to.be.equal("${missing['noway']}");
        missed = resolve("${missing['noway']}", context, false);
        expect(missed).to.be.equal("${missing['noway']}");

        missed = resolve('${foo.nope}', context, true);
        expect(missed).to.be.equal('${foo.nope}');
        missed = resolve('${foo.nope}', context, false);
        expect(missed).to.be.equal('${foo.nope}');
    });

    it('handles bad expression', () => {
        const context = {
            foo: 'bar',
            baz: { bump: 'log' }
        };

        const expr = "${baz['bump]}";
        let res = resolve(expr, context, true, console);
        expect(res).to.be.equal(expr);
        res = resolve("${baz['bump]}", context, false, console);
        expect(res).to.be.equal(expr);
    });

    it('resolves display expression', () => {
        const context = {
            display: {
                xs: [280, 351, 351, 466],
                ys: [90, 90, 272, 272],
                type: 'ElbowH',
                x: null,
                y: null
            }
        };

        const expr = '${display.type}';

        const res = resolve(expr, context, false, console);
        expect(res).to.be.equal('ElbowH');
    });
});
