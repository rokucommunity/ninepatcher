import { Color } from './Color';
import * as Jimp from 'jimp';
import { colorAverage } from './util';

export class Canvas {
    constructor(
        /**
         * The color of all background pixels
         */
        public backgroundColor: Color
    ) { }

    private grid: Array<Array<Color | undefined>> = [];

    public get width() {
        return Math.max(...this.grid.map(x => x.length));
    }

    public get height() {
        return this.grid.length;
    }

    private ensurePosition(x: number, y: number) {
        while (this.grid.length <= y) {
            this.grid.push([]);
        }
        const row = this.grid[y];
        for (let i = row.length; i <= x; i++) {
            row.push(undefined);
        }
    }

    /**
     * Does the grid currently have a value at the given coordinates
     */
    public isPixelSet(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        return !!this.getPixel(x, y);
    }

    /**
     * Get the value at the specified coordinates. Returns `undefined` if the value was not set
     */
    public getPixel(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        return this.grid[y]?.[x];
    }

    /**
     * Set the color for the given coordinate
     */
    public setPixel(color: Color, x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        this.ensurePosition(x, y);
        this.grid[y][x] = color;
    }

    /**
     * Set the color for each of the given coordinates
     */
    public setPixels(color: Color, ...points: Array<[x: number, y: number]>) {
        for (let [x, y] of points) {
            x = Math.round(x);
            y = Math.round(y);
            this.ensurePosition(x, y);
            this.grid[y][x] = color;
        }
    }

    /**
     * Set the color for each of the given coordinates
     */
    public setIfMissingMany(color: Color, points: Array<[x: number, y: number]>) {
        for (let point of points) {
            this.setIfMissing(color, ...point);
        }
    }


    /**
     * Set the value at the given coordinates only if no image data is there yet.
     */
    public setIfMissing(color: Color | undefined, x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        if (!this.isPixelSet(x, y)) {
            this.ensurePosition(x, y);

            this.grid[y][x] = color;
            return color;
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
        const { width, height } = this;
        for (let y = 0; y < this.grid.length; y++) {
            const row = this.grid[y];
            for (let x = 0; x < row.length; x++) {
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

    public translate(x: number, y: number) {
        //add more rows above y
        for (let yCount = 0; yCount < Math.abs(y); yCount++) {
            if (y > 0) {
                //add new row to top
                this.grid.unshift([]);
            } else {
                //remove top row
                this.grid.shift();
            }
        }

        for (let xCount = 0; xCount < Math.abs(x); xCount++) {
            for (let row of this.grid) {
                if (x > 0) {
                    //add new item to left
                    row.unshift(undefined);
                } else {
                    //remove leftmost cell
                    row.shift();
                }
            }
        }
    }

    public write(outPath: string, width: number, height: number) {
        let image = new Jimp(width, height, this.backgroundColor.toInteger(), (err) => {
            if (err) {
                throw err;
            }
        });
        for (let y = 0; y < this.grid.length; y++) {
            const row = this.grid[y];
            for (let x = 0; x < row.length; x++) {
                const pixel = row[x];
                if (pixel) {
                    image.setPixelColor(pixel?.toInteger(), x, y);
                }
            }
        }
        return image.write(outPath);
    }

    public clone() {
        const clone = new Canvas(this.backgroundColor);
        const grid: typeof this.grid = new Array(this.height);
        for (let row of this.grid) {
            grid.push(
                row.map(x => x?.clone())
            );
        }
        return clone;
    }
}
