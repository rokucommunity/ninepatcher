import type { Canvas } from './Canvas';
import { Color } from './Color';
import type { ParseError } from 'jsonc-parser';
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';
import * as fsExtra from 'fs-extra';
import { wuCircle } from './shapes';

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
    const radius = options.radius;
    // const borderRadius = Math.abs(options.radius - (options.borderWidth / 2));
    // const borderPoints = getCircumference({
    //     radius: borderRadius,
    //     strokeWidth: options.borderWidth,
    //     xOffset: borderRadius,
    //     yOffset: borderRadius
    // });
    // canvas.setPixels(options.borderColor, ...borderPoints);
    // canvas.boxBlur(
    //     options.borderColor.clone().setAlpha(0),
    //     0.7
    // );
    // canvas.setPixels(options.borderColor.setAlpha(230), ...borderPoints);
    const result = wuCircle(radius);
    for (let y = 0; y < result.height; y++) {
        for (let x = 0; x < result.width; x++) {
            const opacity = result.arr[(y * result.width) + x];
            if (opacity) {
                canvas.setPixel(options.borderColor.clone().setAlpha(opacity), x - 1, y - 1);
            }
        }
    }

    //fill the circle
    for (let fillRadius = radius - 1; fillRadius >= 0; fillRadius--) {
        const points = getCircumference({
            strokeWidth: 1,
            radius: fillRadius,
            //draw these relative to the center of the outer circle
            xOffset: radius,
            //draw these relative to the center of the outer circle
            yOffset: radius
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
