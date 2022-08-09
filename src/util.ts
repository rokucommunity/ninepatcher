import type { Canvas } from './Canvas';
import type { Color } from './Color';
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
    const borderPoints = getCircumference({
        radius: options.radius,
        strokeWidth: options.borderWidth,
        xOffset: options.radius,
        yOffset: options.radius
    });
    canvas.setMany(options.borderColor, borderPoints);

    //fill the circle
    for (let radius = options.radius; radius >= 0; radius--) {
        const points = getCircumference({
            strokeWidth: 1,
            radius: radius,
            //draw these relative to the center of the outer circle
            xOffset: options.radius,
            //draw these relative to the center of the outer circle
            yOffset: options.radius
        });
        canvas.setIfMissingMany(options.fillColor, points);
    }
}

export function getCircumference(options: { radius: number; strokeWidth: number; xOffset: number; yOffset: number }) {
    const result: Array<[number, number]> = [];
    const strokeWidth = options.strokeWidth ?? 1;
    const xOffset = options.xOffset ?? options.radius;
    const yOffset = options.yOffset ?? options.radius;
    //the actual radius should represent the center of the line
    const radius = Math.abs(options.radius - (strokeWidth / 2));
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
