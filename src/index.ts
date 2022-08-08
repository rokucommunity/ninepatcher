import * as Jimp from 'jimp';
import * as path from 'path';
import type { ColorLike } from './Color';
import { Color } from './Color';
import * as util from './util';

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
    const borderRadius = config.borderRadius ?? 5;
    const width = borderRadius * 2;
    const height = borderRadius * 2;

    let image = new Jimp(width + 2, height + 2, backgroundColor.toInteger(), (err, image) => {
        if (err) throw err
    })

    drawCircle(image, {
        radius: borderRadius,
        borderColor,
        translationX: borderRadius + 1,
        translationY: borderRadius + 1
    });

    let outFilePath = path.resolve(config.rootDir ?? process.cwd(), config.outFile);
    return image.write(outFilePath);
}

function drawCircle(image: Jimp, options: { radius: number, borderColor: Color, translationX: number, translationY: number }) {
    const theta_scale = 0.001;        //Set lower to add more points
    const sizeValue = (2.0 * Math.PI) / theta_scale;
    let size = Math.floor(sizeValue) + 1;
    let theta = 0;
    for (let i = 0; i < size; i++) {
        theta += (2.0 * Math.PI * theta_scale);
        let x = options.radius * Math.cos(theta);
        let y = options.radius * Math.sin(theta);
        x += options.translationX;
        y += options.translationY;
        // image.setPixelColor(options.borderColor, x, y);
        util.plotAntiAliasedPoint(image, options.borderColor, x, y);
    }
}

const scalars = {
    "fhd": 1,
    "hd": .666
};


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
    borderColor: "#000000",
    fillColor: '#00FF00',
    borderRadius: 36,
    stretchWidth: 1,
    outFile: `${__dirname}/../.tmp/output.png`
});

