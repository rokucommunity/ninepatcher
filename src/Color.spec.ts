import { expect } from 'chai';
import type { ColorLike } from './Color';
import { Color } from './Color';

describe('Color', () => {
    it('parses hex', () => {
        expectColor('#01020304', [1, 2, 3, 4]);
    });

    it('snaps to upper and lower bounds', () => {
        expectColor(
            new Color([500, 500, 500, 500]),
            [255, 255, 255, 255]
        );
        expectColor(
            new Color([-500, -500, -500, -500]),
            [0, 0, 0, 0]
        );
    });

    it('backfills missing hex values', () => {
        expectColor('#01', [1, 0, 0, 255]);
        expectColor('#0102', [1, 2, 0, 255]);
        expectColor('#010203', [1, 2, 3, 255]);
    });

    it('parses rgb values', () => {
        expectColor('rgb(1,2,3)', [1, 2, 3, 255]);
        expectColor('rgb ( 1 , 2 , 3 ) ', [1, 2, 3, 255]);
        expectColor('rgba(1,2,3,4)', [1, 2, 3, 4]);
        expectColor('rgba ( 1 , 2 , 3 , 4 ) ', [1, 2, 3, 4]);
    });

    it('backfills missing rgb(a) values', () => {
        expectColor('rgb(1)', [1, 0, 0, 255]);
        expectColor('rgb(1,2)', [1, 2, 0, 255]);
        expectColor('rgb(1,2,3)', [1, 2, 3, 255]);
        expectColor('rgba(1)', [1, 0, 0, 255]);
        expectColor('rgba(1,2)', [1, 2, 0, 255]);
        expectColor('rgba(1,2,3)', [1, 2, 3, 255]);
    });

    it('parses hex literals', () => {
        expectColor(0xFF020304, [255, 2, 3, 4]);
    });

    it('backfills missing hex literal values', () => {
        expectColor(0x01020304, [1, 2, 3, 4]);
        expectColor(0x00010203, [0, 1, 2, 3]);
        expectColor(0x00000102, [0, 0, 1, 2]);
        expectColor(0x01020300, [1, 2, 3, 0]);
    });

    it('rounds color values to nearest integer', () => {
        expect(new Color([1.2, 2.3, 3.5, 4.9])['value']).to.eql([1, 2, 4, 5]);
    });

    it('rounds incoming values to nearest integer', () => {
        const color = new Color(0);
        color.red = 1.2;
        color.green = 2.3;
        color.blue = 3.5;
        color.alpha = 5;
        expect(color.toRgbaArray()).to.eql([1, 2, 4, 5]);
    });

    it('rounds incoming `set` values to nearest integer', () => {
        const color = new Color(0);
        color.setRed(1.2);
        color.setGreen(2.3);
        color.setBlue(3.5);
        color.setAlpha(5);
        expect(color.toRgbaArray()).to.eql([1, 2, 4, 5]);
    });

    describe('toInteger', () => {
        it('converts rgba to proper hex integer', () => {
            expect(new Color([1, 2, 3, 4]).toInteger()).to.eql(0x01020304);
        });
    });

    describe('toHex', () => {
        it('converts rgba to proper hex string', () => {
            expect(new Color([1, 2, 3, 4]).toHex()).to.eql('#01020304');
        });
    });

    describe('merge', () => {
        it('merges all colors', () => {
            expectColor(
                new Color([1, 2, 3, 4]).merge([10, 20, 30, 40]),
                [11, 22, 33, 44]
            );
        });
        it('ignores zeros from incoming color', () => {
            expectColor(
                new Color([1, 2, 3, 4]).merge([0, 20, 30, 40]),
                [1, 22, 33, 44]
            );
            expectColor(
                new Color([1, 2, 3, 4]).merge([10, 0, 30, 40]),
                [11, 2, 33, 44]
            );
            expectColor(
                new Color([1, 2, 3, 4]).merge([10, 20, 0, 40]),
                [11, 22, 3, 44]
            );
            expectColor(
                new Color([1, 2, 3, 4]).merge([10, 20, 30, 0]),
                [11, 22, 33, 4]
            );
        });

        it('snaps to upper and lower bounds', () => {
            expectColor(
                new Color([500, 500, 500, 500]).merge([500, 500, 500, 500]),
                [255, 255, 255, 255]
            );
        });
    });
});

export function expectColor(input: ColorLike | undefined, expected: ColorLike) {
    const color = new Color(input as any);
    expect(color.toRgbaArray()).to.eql(new Color(expected).toRgbaArray());
}
