import * as path from 'path';
import { Canvas } from './Canvas';
import type { ColorLike } from './Color';
import { Color } from './Color';
import { drawCircle, readJsoncSync } from './util';
import * as fsExtra from 'fs-extra';

export class NinePatcher {
    private get cwd() {
        return this.config?.cwd ?? process.cwd();
    }

    private get outDir() {
        if (this.config.outDir) {
            return this.config.outDir;
        } else {
            return path.resolve(this.cwd, 'out');
        }
    }

    /**
     * Generate one or more 9patch images
     */
    public run(config: NinePatcherConfig) {
        this.setConfig(config);
        for (let image of this.config.images) {
            this.generateSingle(image);
        }
    }

    private generateSingle(config: ImageConfig) {
        const backgroundColor = new Color(config.backgroundColor ?? '#00000000');
        const fillColor = new Color(config.fillColor ?? backgroundColor);
        const borderColor = new Color(config.borderColor ?? fillColor);
        const borderWidth = config.borderWidth ?? 1;
        const borderRadius = config.borderRadius ?? 5;
        //plus 2 to account for the repeater bar on top and left, and transparent bar on right and bottom
        const width = (borderRadius * 2) + 2;
        const height = (borderRadius * 2) + 2;

        const canvas = new Canvas(backgroundColor);

        drawCircle(canvas, {
            radius: borderRadius,
            borderColor: borderColor,
            borderWidth: borderWidth,
            fillColor: fillColor
        });
        canvas.translate(1, 1);
        const black = new Color([0, 0, 0, 255]);

        let centerPoint = (
            //halfway through the circle
            borderRadius +
            //offset by 1 for the repeater bar
            1
        );
        centerPoint = Math.floor(centerPoint);

        //draw the black stretch pixels
        canvas.setPixel(black, 0, centerPoint);
        canvas.setPixel(black, centerPoint, 0);

        //write a transparent pixel in the last spot to ensure our output file is the correct dimensions
        canvas.setPixel(new Color(0x00000000), width + 1, height + 1);

        const outPath = path.resolve(this.outDir, config.outFile);
        // console.log(canvas.toString());
        canvas.write(outPath);
    }

    private config!: NinePatcherConfig;

    private setConfig(config: NinePatcherConfig) {
        this.config = config;
        const defaultConfigPath = path.resolve(this.cwd, 'ninepatcher.json');
        //if config path was provided, load it
        if (this.config.config) {
            this.config = {
                ...readJsoncSync(path.resolve(this.cwd, this.config.config)),
                ...this.config
            };
        } else if (fsExtra.pathExistsSync(defaultConfigPath)) {
            this.config = {
                ...readJsoncSync(path.resolve(this.cwd, defaultConfigPath)),
                ...this.config
            };
        }
        if ((this.config.images?.length ?? 0) < 1) {
            throw new Error('Found no images to generate');
        }
    }
}

interface NinePatcherConfig {
    /**
     * Path to the current working directory that should be used instead of `process.cwd`.
     * @default `process.cwd()`
     */
    cwd?: string;

    /**
     * Path to a config file that should be loaded. This is loaded relative to the `cwd` option if provided
     */
    config?: string;

    /**
     * The base directory where the generated images should be written. This will be resolved relative to the `cwd` option if provided
     */
    outDir?: string;

    /**
     * An array of images that should be generated
     */
    images: Array<ImageConfig>;
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
