import { expect } from 'chai';
import { Values } from '../src/values';
import { ValuesHolder } from '../src/model/value';

describe('values', () => {
    const vals1: ValuesHolder = {
        values: {
            baz: 'bang',
            greeting: {
                salutation: 'Hey There',
                user: {
                    name: 'Stranger',
                    email: 'stranger@compuserve.com',
                    contacts: ['anyone@example.com', 'otherguy@example.com']
                }
            }
        },
        location: {
            path: 'vals1'
        }
    };

    const vals2: ValuesHolder = {
        values: {
            foo: 'bar',
            greeting: {
                salutation: 'Hello',
                user: {
                    name: 'Stranger',
                    email: 'stranger@example.com',
                    contacts: ['someone@example.com', 'otherguy@example.com']
                }
            }
        },
        location: {
            path: 'vals2'
        }
    };

    const checkMergedValues = (values: any) => {
        expect(values.foo).to.be.equal('bar');
        expect(values.baz).to.be.equal('bang');
        expect(values.greeting.salutation).to.be.equal('Hello');
        expect(values.greeting.user.name).to.be.equal('Stranger');
        expect(values.greeting.user.email).to.be.equal('stranger@example.com');
        expect(values.greeting.user.contacts.length).to.be.equal(2); // array overwrite
        expect(values.greeting.user.contacts[0]).to.be.equal('someone@example.com');
        expect(values.greeting.user.contacts[1]).to.be.equal('otherguy@example.com');
    };

    it('should merge value objects', async () => {
        const valuesAccess = new Values([vals1, vals2]);
        checkMergedValues(valuesAccess.getValues());
    });

    it('should locate values', async () => {
        const values = new Values([vals1, vals2]);
        expect(values.getValue('${foo}')?.location?.path).to.be.equal('vals2');
        expect(values.getValue('${baz}')?.location?.path).to.be.equal('vals1');
        expect(values.getValue('${greeting.salutation}')?.location?.path).to.be.equal('vals2');
        expect(values.getValue('${greeting.user.name}')?.location?.path).to.be.equal('vals2');
    });

    it('resolves ref expression', () => {
        const refVals: ValuesHolder = {
            values: {
                __ply_results: {
                    s7: {
                        response: {
                            status: {
                                code: 201,
                                message: 'Created'
                            },
                            body: {
                                id: '435b30ad',
                                title: 'The Case of the Howling Dog',
                                year: 1934
                            }
                        }
                    }
                }
            }
        };

        const access = new Values([refVals], { refHolder: '__ply_results' });
        const result = access.getValue('${@s7.response.body.id}');
        expect(result?.value).to.be.equal('435b30ad');
    });
});
