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

interface opacity_bitmap {
    arr: pixel_opacity_array;
    width: number;
    height: number;
}

interface plot4_params_type {
    arr: pixel_opacity_array;
    center_pix: number;
    width: number;
}

const high_opac = 255;


export function wuCircle(r: number): opacity_bitmap {
    const result: opacity_bitmap = {} as any;
    result.width = (Math.ceil(r) * 2) + 3;
    result.height = result.width;
    result.arr = new Array(result.width ** 2);

    if (r <= 0) {
        return result;
    }

    const p4_params: plot4_params_type = {} as any;
    p4_params.arr = result.arr;
    p4_params.width = result.width;
    p4_params.center_pix = (Math.ceil(r) + 1) * (p4_params.width + 1);

    // assuming momentarily that r is an integer, let's find center_pix (r,r)
    // first get the row: it is at r*width. Then to get the column, add r.
    // Thus (r,r) is at r*width+r = r*(width+1) -- this holds true for any r
    // r is real, so take ceil(r); also add some wiggle room, so add 1: ceil(r)+1
    // Thus: (ceil(r)+1) * (width+1)

    // Now here's the stuff you've been looking for:

    const rsq = r ** 2;
    const ffd = Math.round(r / Math.sqrt(2)); // forty-five-degree coord

    for (let xi = 0; xi <= ffd; xi++) {
        const yj = Math.sqrt(rsq - (xi ** 2)); // the "step 2" formula noted above
        const frc = fpart(yj);
        const flr = Math.floor(yj);
        plot_4_points(xi, flr, 1 - frc, p4_params);
        plot_4_points(xi, flr + 1, frc, p4_params);
    }

    for (let yi = 0; yi <= ffd; yi++) {
        const xj = Math.sqrt(rsq - (yi ** 2));
        const frc = fpart(xj);
        const flr = Math.floor(xj);
        plot_4_points(flr, yi, 1 - frc, p4_params);
        plot_4_points(flr + 1, yi, frc, p4_params);
    }

    //add the exact points for 0, 90, 180, 270 degrees (they're missing for some reason)
    for (let angle = 0; angle <= 360; angle += 90) {
        const x = Math.round(r * Math.sin(Math.PI * 2 * angle / 360));
        const y = Math.round(r * Math.cos(Math.PI * 2 * angle / 360));
        const pt = (y * result.width) + x + p4_params.center_pix;
        result.arr[pt] = high_opac;
    }
    return result;
}

function plot_4_points(x: number, y: number, f: number, p4_params: plot4_params_type, take_max = false) {
    function plot(pt: number) {
        pt += p4_params.center_pix;
        if (!take_max) {
            p4_params.arr[pt] = opac
        } else {
            // don't overwrite a touched pixel with a less intense value
            p4_params.arr[pt] = Math.max(p4_params.arr[pt], opac);
        }
    }
    const opac = round(high_opac * f);  // the max opacity value
    if (opac === 0) {
        return;
    }
    let yw = y * p4_params.width;  // I could call plot (x,y) but then I'd be calculating y*width over and over
    if (x > 0 && y > 0) {
        plot(x + yw);
        plot(x - yw);
        plot(-x + yw);
        plot(-x - yw);
    } else if (x = 0) {
        plot(x + yw);
        plot(x - yw);
    } else if (y = 0) {
        plot(x + yw);
        plot(-x + yw);
    }
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
