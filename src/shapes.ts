/* eslint-disable */
import type { Canvas } from './Canvas';
import type { Color } from './Color';

export function wuLine(x0: number, y0: number, x1: number, y1: number, canvas: Canvas, color: Color) {
    drawLine(x0, y0, x1, y1);
    function plot(x: number, y: number, c: number) {
        //plot the pixel at (x, y) with brightness c (where 0 ≤ c ≤ 1)
        canvas.setPixel(color.clone().setAlpha(255 * c), x, y);
    }

    function drawLine(x0: number, y0: number, x1: number, y1: number) {
        const steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0);

        if (steep) {
            [x0, y0] = [y0, x0]; //swap(x0, y0);
            [x1, y1] = [y1, x1]; //swap(x1, y1);
        }
        if (x0 > x1) {
            [x0, x1] = [x1, x0]; //swap(x0, x1);
            [y0, y1] = [y1, y0]; //swap(y0, y1);
        }

        let dx = x1 - x0;
        let dy = y1 - y0;
        let gradient: any;

        if (dx === 0.0) {
            gradient = 1.0;
        } else {
            gradient = dy / dx;
        }

        // handle first endpoint
        let xend = round(x0);
        let yend = y0 + (gradient * (xend - x0));
        let xgap = rfpart(x0 + 0.5);
        let xpxl1 = xend; // this will be used in the main loop
        let ypxl1 = ipart(yend);
        if (steep) {
            plot(ypxl1, xpxl1, rfpart(yend) * xgap);
            plot(ypxl1 + 1, xpxl1, fpart(yend) * xgap);
        } else {
            plot(xpxl1, ypxl1, rfpart(yend) * xgap);
            plot(xpxl1, ypxl1 + 1, fpart(yend) * xgap);
        }
        let intery = yend + gradient; // first y-intersection for the main loop

        // handle second endpoint
        xend = round(x1);
        yend = y1 + (gradient * (xend - x1));
        xgap = fpart(x1 + 0.5);
        let xpxl2 = xend; //this will be used in the main loop
        let ypxl2 = ipart(yend);
        if (steep) {
            plot(ypxl2, xpxl2, rfpart(yend) * xgap);
            plot(ypxl2 + 1, xpxl2, fpart(yend) * xgap);
        } else {
            plot(xpxl2, ypxl2, rfpart(yend) * xgap);
            plot(xpxl2, ypxl2 + 1, fpart(yend) * xgap);
        }

        // main loop
        if (steep) {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                plot(ipart(intery), x, rfpart(intery));
                plot(ipart(intery) + 1, x, fpart(intery));
                intery += gradient;
            }
        } else {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                plot(x, ipart(intery), rfpart(intery));
                plot(x, ipart(intery) + 1, fpart(intery));
                intery += gradient;
            }
        }
    }
}

type pixel_opacity_array = number[];

interface WuCircleResult {
    arr: pixel_opacity_array;
    center_pix: number;
    width: number;
    height: number;
}

const high_opac = 255;

export function wuCircle(radius: number): WuCircleResult {
    const result: WuCircleResult = {} as any;
    result.width = (Math.ceil(radius) * 2) + 3;
    result.height = result.width;
    result.arr = new Array(result.width ** 2);
    result.center_pix = (Math.ceil(radius) + 1) * (result.width + 1);

    if (radius <= 0) {
        return result;
    }

    const fortyFiveDegrees = Math.round(radius / Math.sqrt(2));

    for (let x = 0; x <= fortyFiveDegrees; x++) {
        const yj = Math.sqrt((radius ** 2) - (x ** 2));
        const frc = fpart(yj);
        const yInteger = Math.floor(yj);
        plot_4_points(x, yInteger, 1 - frc, result);
        plot_4_points(x, yInteger + 1, frc, result);
    }

    for (let y = 0; y <= fortyFiveDegrees; y++) {
        const xj = Math.sqrt((radius ** 2) - (y ** 2));
        const frc = fpart(xj);
        const xInteger = Math.floor(xj);
        plot_4_points(xInteger, y, 1 - frc, result);
        plot_4_points(xInteger + 1, y, frc, result);
    }

    return result;
}

function plot_4_points(x: number, y: number, f: number, result: WuCircleResult, take_max = false) {
    function plot(x: number, y: number) {
        const yw = y * result.width;
        const idx = yw + x + result.center_pix;
        if (!take_max) {
            result.arr[idx] = opac
        } else {
            // don't overwrite a touched pixel with a less intense value
            result.arr[idx] = Math.max(result.arr[idx], opac);
        }
    }
    const opac = round(high_opac * f);  // the max opacity value
    if (opac === 0) {
        return;
    }
    plot(x, y);
    plot(x, -y);
    plot(-x, y);
    plot(-x, -y);
}


// integer part of x
function ipart(x: number) {
    return Math.floor(x);
}
function round(x: number) {
    return ipart(x + 0.5);
}
/**
 * fractional part of x
 */
function fpart(x: number) {
    return x - Math.floor(x);
}
/**
 * The whole number part of x (i.e. strip off the fraction value)
 */
function rfpart(x: number) {
    return 1 - fpart(x);
}
