import { expect } from "chai";
import { Color, RgbaArray } from "./Color";

describe('Color', () => {
    function expectColor(input: string, expected: RgbaArray) {
        const color = new Color(input);
        expect(color.toRgbaArray()).to.eql(expected);
    }

    it('parses hex', () => {
        expectColor('#01020304', [1, 2, 3, 4]);
    });

    it('backfills missing hex values', () => {
        expectColor('#0102', [1, 2, 0, 255]);
    });
});