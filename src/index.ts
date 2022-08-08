import * as path from 'path';
import { Canvas } from './Canvas';
import type { ColorLike } from './Color';
import { Color } from './Color';
import { drawCircle } from './util';

/**
 * Generate one or more 9patch images
 */
export function generate(configs: ImageConfig | ImageConfig[]) {
    const configArray = Array.isArray(configs) ? configs : [configs];
    for (let config of configArray) {
        generateSingle(config);
    }
}

function generateSingle(config: ImageConfig) {
    const backgroundColor = new Color(config.backgroundColor ?? '#00000000');
    const fillColor = new Color(config.fillColor ?? backgroundColor);
    const borderColor = new Color(config.borderColor ?? fillColor);
    const borderWidth = config.borderWidth ?? 1;
    const borderRadius = config.borderRadius ?? 5;
    const width = borderRadius * 2;
    const height = borderRadius * 2;

    const canvas = new Canvas(backgroundColor);
    drawCircle(canvas, {
        radius: borderRadius,
        borderColor,
        borderWidth,
        fillColor,
    });
    canvas.translate(1, 1);
    const black = new Color([0, 0, 0, 255]);

    //draw the black stretch pixels
    canvas.set(black, 0, borderRadius + 1);
    canvas.set(black, borderRadius + 1, 0);

    const outPath = path.resolve(config.rootDir ?? process.cwd(), config.outFile)
    canvas.write(outPath, width, height);
}

// const scalars = {
//     "fhd": 1,
//     "hd": .666
// };


interface ImageConfig {
    /**
     * The color of the background
     */
    backgroundColor?: ColorLike;
    /**
     * The color of the border.
     */
    borderColor?: ColorLike;
    /**
     * The curve of the border. 0 means square
     */
    borderRadius?: number;
    /**
     * The width (in pixels) of the border. 0 means there is no border
     */
    borderWidth?: number;
    /**
     * The color INSIDE the radius
     */
    fillColor?: ColorLike;
    /**
     * The root dir where this image should be written
     */
    rootDir?: string;
    /**
     * The number of pixels wide the stretch pixel should be.
     * @default 1
     */
    stretchWidth?: number;
    /**
     * The path to where the image should be written.
     * This supports placeholder text like {scalar}
     */
    outFile: string;
}

generate({
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderColor: "#FF0000",
    fillColor: '#00FF00',
    borderRadius: 19,
    stretchWidth: 1,
    outFile: `${__dirname}/../.tmp/output.png`
});

