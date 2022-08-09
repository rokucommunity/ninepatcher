import type { Canvas } from './Canvas';
import { Color } from './Color';
import type { ParseError } from 'jsonc-parser';
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';
import * as fsExtra from 'fs-extra';

export function readJsoncSync<T>(path: string) {
    const contents = fsExtra.readFileSync(path).toString();
    let parseErrors = [] as ParseError[];
    let projectConfig = parseJsonc(contents, parseErrors, {
        allowEmptyContent: true,
        allowTrailingComma: true,
        disallowComments: false
    }) as T ?? {};

    if (parseErrors.length > 0) {
        for (const error of parseErrors) {
            console.error(`${printParseErrorCode(error.error)} at offset ${error.offset}`);
        }
        throw new Error(`Config file contains syntax errors: ${path}`);
    }

    return projectConfig;
}

export function drawCircle(canvas: Canvas, options: { radius: number; borderColor: Color; borderWidth: number; fillColor: Color }) {
    const borderRadius = Math.abs(options.radius - (options.borderWidth / 2));
    const borderPoints = getCircumference({
        radius: borderRadius,
        strokeWidth: options.borderWidth,
        xOffset: borderRadius,
        yOffset: borderRadius
    });
    canvas.setPixels(options.borderColor, ...borderPoints);
    canvas.boxBlur(
        options.borderColor.clone().setAlpha(0),
        0.7
    );
    canvas.setPixels(options.borderColor.setAlpha(230), ...borderPoints);

    //fill the circle
    for (let fillRadius = borderRadius - 1; fillRadius >= 0; fillRadius--) {
        const points = getCircumference({
            strokeWidth: 1,
            radius: fillRadius,
            //draw these relative to the center of the outer circle
            xOffset: borderRadius,
            //draw these relative to the center of the outer circle
            yOffset: borderRadius
        });
        canvas.setPixels(options.fillColor, ...points);
    }
}

export function getCircumference(options: { radius: number; strokeWidth: number; xOffset: number; yOffset: number }) {
    const result: Array<[number, number]> = [];
    // const strokeWidth = options.strokeWidth ?? 1;
    const xOffset = options.xOffset ?? options.radius;
    const yOffset = options.yOffset ?? options.radius;
    //the actual radius should represent the center of the line
    const { radius } = options;
    const thetaScale = 0.001; //Set lower to add more points
    const sizeValue = (2.0 * Math.PI) / thetaScale;

    let stepCount = Math.floor(sizeValue) + 1;
    let theta = 0;
    for (let i = 0; i < stepCount; i++) {
        theta += (2.0 * Math.PI * thetaScale);
        let x = radius * Math.cos(theta);
        let y = radius * Math.sin(theta);
        x += xOffset;
        y += yOffset;
        result.push([x, y]);
    }
    return result;
}

/**
 * Build a new color based on the average of all colors provided
 */
export function colorAverage(defaultColor: Color, colors: Array<Color | undefined>) {
    const sums = [0, 0, 0, 0];
    for (const color of colors) {
        const rgba = (color ?? defaultColor).toRgbaArray();
        for (let i = 0; i < rgba.length; i++) {
            sums[i] += rgba[i];
        }
    }
    return new Color(sums.map(x => x / colors.length));
}

export function wuLine(x0: number, y0: number, x1: number, y1: number, canvas: Canvas, color: Color) {
    drawLine(x0, y0, x1, y1);
    function plot(x: number, y: number, c: number) {
        //plot the pixel at (x, y) with brightness c (where 0 ≤ c ≤ 1)
        canvas.setPixel(color.clone().setAlpha(255 * c), x, y);
    }

    // integer part of x
    function ipart(x: number) {
        return Math.floor(x);
    }
    function round(x: number) {
        return ipart(x + 0.5);
    }
    // fractional part of x
    function fpart(x: number) {
        return x - Math.floor(x);
    }
    function rfpart(x: number) {
        return 1 - fpart(x);
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
