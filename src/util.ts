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
    drawCircumference(canvas, {
        radius: options.radius,
        color: options.borderColor,
        strokeWidth: options.borderWidth,
        antiAlias: false
    });

    // //fill the circle
    // for (let radius = options.radius; radius >= 0; radius--) {
    //     drawCircumference(canvas, {
    //         radius: radius,
    //         color: options.fillColor,
    //         antiAlias: false
    //     });
    // }
}

export function drawCircumference(canvas: Canvas, options: { radius: number; color: Color; antiAlias: boolean; strokeWidth: number }) {
    const strokeWidth = options.strokeWidth ?? 1;
    //the actual radius should represent the center of the line
    const radius = options.radius - (strokeWidth / 2);
    const thetaScale = 0.001; //Set lower to add more points
    const sizeValue = (2.0 * Math.PI) / thetaScale;
    let stepCount = Math.floor(sizeValue) + 1;
    let theta = 0;
    for (let i = 0; i < stepCount; i++) {
        theta += (2.0 * Math.PI * thetaScale);
        let x = radius * Math.cos(theta);
        let y = radius * Math.sin(theta);
        //draw where 0,0 is the leftmost and topmost coordinate
        x += radius;
        y += radius;

        if (options.antiAlias) {
            canvas.setAntiAliased(options.color, x, y);
        } else {
            canvas.setIfMissing(options.color, x, y);
        }
    }
}
