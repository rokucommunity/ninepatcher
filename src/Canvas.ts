import { Color } from './Color';
import * as Jimp from 'jimp';

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
    private grid = new Map<number, Map<number, Color[]>>();

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
        const colorStack = this.grid.get(y)?.get(x);
        if (colorStack) {
            return Color.blend(this.backgroundColor, ...colorStack);
        }
    }

    /**
     * Get the row at the specified y coordinate. If it doesn't exist, create it
     */
    private getCell(x: number, y: number) {
        y = Math.round(y);
        let row = this.grid.get(y);
        if (!row) {
            row = new Map();
            this.grid.set(y, row);
        }
        let cell = row.get(x);
        if (!cell) {
            cell = [];
            row.set(x, cell);
        }

        return cell;
    }

    /**
     * Set the color (or color stack) for the given coordinate.
     */
    public setPixel(color: Color | Color[], x: number, y: number) {
        const colorStack = Array.isArray(color) ? color : [color];
        x = Math.round(x);
        this.getCell(x, y).push(...colorStack);
    }

    /**
     * Delete a pixel at the specified location. This deletes the whole stack of pixels at that position.
     */
    public deletePixel(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        const row = this.grid.get(y);
        if (row) {
            row.delete(x);
            if (row.size === 0) {
                this.grid.delete(y);
            }
        }
    }

    /**
     * Set the color for each of the given coordinates
     */
    public setPixels(color: Color | Color[], ...points: Array<[x: number, y: number]>) {
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
            for (const [x, colorStack] of row) {
                const finalColor = Color.blend(this.backgroundColor, ...colorStack);
                image.setPixelColor(finalColor?.toInteger(), x, y);
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
