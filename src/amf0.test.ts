import 'reflect-metadata';
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BooleanValue, EcmaArrayValue, ReferenceValue, StrictArrayValue, Value } from "./amf0";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AMF3 from './amf3';

let zeroPad = (a : string, length = 2) => {
    while (a.length < length)
        a = '0' + a;
    return a;
}

let hex = (b : Uint8Array) => Array.from(b).map(b => zeroPad(b.toString(16))).join(' ');


describe("amf0", () => {
    async function sample(name : string) {
        return await fs.readFile(path.join(__dirname, '..', 'test', 'amf0', `${name}.bin`));
    }

    async function parsedSample(name : string) {
        return Value.deserialize(await sample(name));
    }

    let longText = fs.readFile(path.join(__dirname, '..', 'test', 'long-string.txt'));

    let samples = {
        'undefined':                    Value.undefined,
        'null':                         Value.null,
        'boolean-false':                Value.boolean(false),
        'boolean-true':                 Value.boolean(true),
        'number':                       Value.number(8745291.56),
        'string.hello':                 Value.string('hello'),
        'date':                         Value.date(new Date(8745291)),
        'strict-array-of-3-nulls':      Value.array([ null, null, null ]),
        'strict-array-of-3-booleans':   Value.array([ false, true, false ]),
        'strict-array-of-3-numbers':    Value.array([ 155.4, -62.3, 95324 ]),
        'object':                       Value.object({ a: true, b: false }),
        'typed-object':                 Value.object({ a: true, b: false }, 'foo'),
        'ecma-array':                   Value.associativeArray({ a: true, b: false, c: true }),
        'long-string':                  longText.then(buf => Value.string(buf.toString())),
        'xml-document':                 longText.then(buf => Value.xmlDocument(buf.toString())),
        'avmplus':                      Value.amf3(AMF3.Value.int(18))
    };

    let files = Object.keys(samples);
    
    //globalThis.BITSTREAM_TRACE = true;

    for (let fileName of files) {
        let valueOrPromise : Value | Promise<Value> = samples[fileName];
        
        it(`reads sample '${fileName}' correctly`, async () => {
            let value : Value;
            if (valueOrPromise instanceof Promise)
                value = await valueOrPromise;
            else
                value = valueOrPromise;

            let buf = await sample(fileName);
            let parsedValue = Value.deserialize(buf);
            let isLargeValue = typeof parsedValue.value === 'string' && parsedValue.value.length > 50000;

            if (isLargeValue) {
                // long-string failures are just a flood
                let parsedStr = `${parsedValue.constructor.name}#${JSON.stringify(parsedValue).replace(`${parsedValue.value}`, `...`)}`;
                let expectedStr = `${value.constructor.name}#${JSON.stringify(value).replace(`${value.value}`, `...`)}`;

                assert.strictEqual(parsedStr, expectedStr);
            } else {
                assert.deepStrictEqual(`${parsedValue.constructor.name}#${JSON.stringify(parsedValue)}`, `${value.constructor.name}#${JSON.stringify(value)}`);
            }
            
            try {
                assert.deepStrictEqual(parsedValue.value, value.value);
            } catch (e) {
                if (isLargeValue) {
                    assert.fail("JS representation should match");
                }
                throw e;
            }
        });

        it(`writes sample '${fileName}' correctly`, async () => {
            let value : Value;
            if (valueOrPromise instanceof Promise)
                value = await valueOrPromise;
            else
                value = valueOrPromise;

            let expected = await sample(fileName);

            assert.deepStrictEqual(hex(value.serialize()), hex(expected));
        });

        it(`roundtrips '${fileName}' correctly after reading`, async () => {
            let value : Value;
            if (valueOrPromise instanceof Promise)
                value = await valueOrPromise;
            else
                value = valueOrPromise;

            let expected = await sample(fileName);
            let result = Value.deserialize(expected).serialize();

            assert.deepStrictEqual(hex(result), hex(expected));
        });

        it(`roundtrips '${fileName}' correctly after writing`, async () => {

            let value : Value;
            if (valueOrPromise instanceof Promise)
                value = await valueOrPromise;
            else
                value = valueOrPromise;
            
            let result = Value.deserialize(value.serialize())
            assert.deepStrictEqual(`${result.constructor.name}#${JSON.stringify(result)}`, `${value.constructor.name}#${JSON.stringify(value)}`);
            assert.deepStrictEqual(result.value, value.value);
        });
    }

    it('should unroll references correctly', async () => {
        // Value.array([ [true, false], new ReferenceValue().with({ index: 0 }) ])
        let ref = <StrictArrayValue> await parsedSample('reference');

        assert.strictEqual(ref.value.length, 2);
        assert.deepStrictEqual(ref.value, [ [true, false], [true, false] ]);
        assert.strictEqual('values' in ref, true, "StrictArrayValue#values refactored?");

        let values : Value[] = (ref as any).values;
        let arrayValue = values[0].as(StrictArrayValue);
        let refValue = values[1].as(ReferenceValue);

        assert.strictEqual(refValue.index, 0);
        assert.strictEqual(refValue.reference, arrayValue);
    });
    it('should roll references correctly', async () => {
        let value = Value.array([ [true, false], [true, false]])
        let buf = value.serialize();
        assert.strictEqual(hex(buf), hex(await sample('reference')));
    });

    describe('Value', () => {
        it('unrolls JS values into appropriate AMF0 values', () => {
            let array = Value.array([ [true, false], [true, false]]);
            let values = StrictArrayValue.elementValues(array);

            assert.strictEqual(values.length, 2);

            let sub1 = values[0].as<StrictArrayValue>(StrictArrayValue);
            let sub2 = values[1].as<StrictArrayValue>(StrictArrayValue);

            let bool1 = StrictArrayValue.elementValues(sub1)[0];
            let bool2 = StrictArrayValue.elementValues(sub1)[1];
            let bool3 = StrictArrayValue.elementValues(sub2)[0];
            let bool4 = StrictArrayValue.elementValues(sub2)[1];

            assert.ok(bool1 instanceof BooleanValue);
            assert.ok(bool2 instanceof BooleanValue);
            assert.ok(bool3 instanceof BooleanValue);
            assert.ok(bool4 instanceof BooleanValue);
            
        });
        it('accepts an object with an array and creates correct AMF objects', () => {
            let amf = Value.any({ foo: [ 'bar', 'baz' ]});
        })
    });
});