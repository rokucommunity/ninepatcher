import { expect } from 'chai';
import { Canvas } from './Canvas';
import { Color } from './Color';

describe('Canvas', () => {

    let canvas: Canvas;
    const black = new Color(0x000000FF);
    const white = new Color(0xFFFFFFFF);
    const red = new Color(0xFF000000);
    const blue = new Color(0x00FF00FF);
    const green = new Color(0x0000FFFF);

    beforeEach(() => {
        canvas = new Canvas(new Color(0x00000000));
    });

    it('supports simple pixels', () => {
        canvas.setPixel(black, 0, 0);
        expect(canvas.getPixel(0, 0)).to.equal(black);

        canvas.setPixel(white, 10, 10);
        expect(canvas.getPixel(10, 10)).to.equal(white);
    });

    it('supports negative pixels', () => {
        canvas.setPixel(red, -5, -10);
        expect(canvas.getPixel(-5, -10)).to.equal(red);

        canvas.setPixel(black, 0, 0);
        expect(canvas.getPixel(0, 0)).to.equal(black);

        canvas.setPixel(white, 10, 10);
        expect(canvas.getPixel(10, 10)).to.equal(white);
    });
});
