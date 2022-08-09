import type { Color } from './Color';
import * as Jimp from 'jimp';
import { colorAverage } from './util';

export class Canvas {
    constructor(
        /**
         * The color of all background pixels
         */
        public backgroundColor: Color
    ) { }

    /**
     * A map of rows, containing columns, all indexed by their x or y coordinate.
     * Index by Y first, then X
     */
    private grid = new Map<number, Map<number, Color>>();

    /**
     * Get the lowest-defined x value
     */
    private get minX() {
        const xValues: number[] = [];
        for (const [, row] of this.grid) {
            for (const [x] of row) {
                xValues.push(x);
            }
        }
        return Math.min(...xValues);
    }

    /**
     * Get the highest-defined x value
     */
    private get maxX() {
        const xValues: number[] = [];
        for (const [, row] of this.grid) {
            for (const [x] of row) {
                xValues.push(x);
            }
        }
        return Math.max(...xValues);
    }

    /**
     * Get the lowest-defined y value
     */
    private get minY() {
        return Math.max(...this.grid.keys());
    }

    /**
     * Get the highest-defined y value
     */
    public get maxY() {
        return Math.max(...this.grid.keys());
    }

    public get width() {
        return this.maxX - this.minX;
    }

    public get height() {
        return this.maxY - this.minY;
    }

    /**
     * Does the grid currently have a value at the given coordinates
     */
    public isPixelSet(x: number, y: number) {
        return !!this.getPixel(x, y);
    }

    /**
     * Get the value at the specified coordinates. Returns `undefined` if the value was not set
     */
    public getPixel(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        return this.grid.get(y)?.get(x);
    }

    /**
     * Get the row at the specified y coordinate. If it doesn't exist, create it
     */
    private getRow(y: number) {
        y = Math.round(y);
        let result = this.grid.get(y);
        if (!result) {
            result = new Map();
            this.grid.set(y, result);
        }
        return result;
    }

    /**
     * Set the color for the given coordinate
     */
    public setPixel(color: Color, x: number, y: number) {
        x = Math.round(x);
        this.getRow(y).set(x, color);
    }

    /**
     * Delete a pixel at the specified location
     */
    public deletePixel(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        const row = this.getRow(y);
        row.delete(x);
        if (row.size === 0) {
            this.grid.delete(y);
        }
    }

    /**
     * Set the color for each of the given coordinates
     */
    public setPixels(color: Color, ...points: Array<[x: number, y: number]>) {
        for (let [x, y] of points) {
            this.setPixel(color, x, y);
        }
    }

    /**
     * Set the color for each of the given coordinates
     */
    public setIfMissingMany(color: Color, points: Array<[x: number, y: number]>) {
        for (let point of points) {
            this.setPixelIfMissing(color, ...point);
        }
    }

    /**
     * Set the value at the given coordinates only if no image data is there yet.
     */
    public setPixelIfMissing(color: Color, x: number, y: number) {
        if (!this.isPixelSet(x, y)) {
            this.setPixel(color, x, y);
        }
    }

    /**
     * Merge the incoming color with the color at the current coordinates.
     */
    public mergePixels(color: Color, ...pixels: Array<[x: number, y: number]>) {
        for (const [x, y] of pixels) {
            const current = this.getPixel(x, y) ?? this.backgroundColor.clone();
            const merged = current.merge(color);
            this.setPixels(merged, [x, y]);
        }
    }

    /**
     * Set a pixel color, and anti-alias the pixels around it
     */
    public setAntiAliased(color: Color, x: number, y: number) {
        //get a new color with the alpha value totally blanked out
        color = color.clone().setAlpha(0);

        for (let roundedX = Math.floor(x); roundedX < Math.ceil(x); roundedX++) {
            for (let roundedY = Math.floor(y); roundedY < Math.ceil(y); roundedY++) {
                let percentX = 1 - Math.abs(x - roundedX);
                let percentY = 1 - Math.abs(y - roundedY);
                let percent = percentX * percentY;

                const currentAlpha = (this.getPixel(x, y) ?? color.clone()).alpha;
                const additionalAlpha = 255 * percent;
                //make the pixel more solid by this percentage
                const antiAliasedColor = color.clone().setAlpha(
                    currentAlpha + additionalAlpha
                );

                this.setPixels(
                    antiAliasedColor,
                    [roundedX, roundedY]
                );
            }
        }
    }

    public boxBlur(defaultColor: Color, opacityPercent: number) {
        const result = new Canvas(this.backgroundColor);
        const { minX, minY, maxX, maxY, width, height } = this;
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                //skip these out of bounds pixels
                if (x < 1 || y < 1 || x + 1 === width || y + 1 === height) {
                    continue;
                }
                // Set P to the average of 9 pixels:
                const color = colorAverage(
                    defaultColor,
                    [
                        this.getPixel(x - 1, y + 1), // Top left
                        this.getPixel(x + 0, y + 1), // Top center
                        this.getPixel(x + 1, y + 1), // Top right
                        this.getPixel(x - 1, y + 0), // Mid left
                        this.getPixel(x + 0, y + 0), // Current pixel
                        this.getPixel(x + 1, y + 0), // Mid right
                        this.getPixel(x - 1, y - 1), // Low left
                        this.getPixel(x + 0, y - 1), // Low center
                        this.getPixel(x + 1, y - 1) // Low right
                    ]
                );
                result.setPixels(color.setAlpha(color.alpha * opacityPercent), [x, y]);
            }
        }
        this.grid = result.grid;
    }

    /**
     * Translate all the pixels by this amount
     */
    public translate(xOffset: number, yOffset: number) {
        const canvas = new Canvas(this.backgroundColor);

        for (const [y, row] of this.grid) {
            for (const [x, color] of row) {
                canvas.setPixel(color, x + xOffset, y + yOffset);
            }
        }
        this.grid = canvas.grid;
    }

    public write(outPath: string) {
        let image = new Jimp(this.maxX, this.maxY, this.backgroundColor.toInteger(), (err) => {
            if (err) {
                throw err;
            }
        });
        for (const [y, row] of this.grid) {
            for (const [x, color] of row) {
                image.setPixelColor(color?.toInteger(), x, y);
            }
        }
        return image.write(outPath);
    }

    public clone() {
        const clone = new Canvas(this.backgroundColor);
        for (const [y, row] of this.grid) {
            for (const [x, color] of row) {
                clone.setPixel(color, x, y);
            }
        }
        return clone;
    }
}
