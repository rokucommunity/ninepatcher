import { expect } from "chai";
import { Color, ColorLike, RgbaArray } from "./Color";

describe('Color', () => {
    function expectColor(input: ColorLike, expected: RgbaArray) {
        const color = new Color(input);
        expect(color.toRgbaArray()).to.eql(expected);
    }

    it('parses hex', () => {
        expectColor('#01020304', [1, 2, 3, 4]);
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
});