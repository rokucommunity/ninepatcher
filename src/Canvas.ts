import { Color } from "./Color";
import * as Jimp from 'jimp';

export class Canvas {
    constructor(
        /**
         * The color of all background pixels
         */
        private backgroundColor: Color
    ) { }

    private grid: Array<Array<Color | undefined>> = [];

    private ensurePosition(x: number, y: number) {
        for (let i = this.grid.length; i <= y; i++) {
            this.grid.push([]);
        }
        const row = this.grid[y];
        for (let i = row.length; i <= x; i++) {
            row.push(undefined);
        }
        return
    }

    /**
     * Does the grid currently have a value at the given coordinates
     */
    public isSet(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        return !!this.get(x, y);
    }

    /**
     * Get the value at the specified coordinates. Returns `undefined` if the value was not set
     */
    public get(x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        return this.grid[y]?.[x];
    }

    /**
     * Set the value at the given coordinates
     */
    public set(color: Color | undefined, x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        this.ensurePosition(x, y);
        this.grid[y][x] = color;
        return color;
    }

    /**
     * Set the value at the given coordinates only if no image data is there yet.
     */
    public setIfMissing(color: Color | undefined, x: number, y: number) {
        x = Math.round(x);
        y = Math.round(y);
        if (!this.isSet(x, y)) {
            this.ensurePosition(x, y);

            this.grid[y][x] = color;
            return color;
        }
    }


    /**
     * Merge the incoming color with the color at the current coordinates.
     */
    public merge(color: Color, x: number, y: number) {
        const current = this.get(x, y) ?? this.backgroundColor.clone();
        const merged = current.merge(color);
        this.set(merged, x, y);
        return merged;
    }

    /**
     * Set a pixel color, and anti-alias the pixels around it
     */
    public setAntiAliased(color: Color, x: number, y: number) {
        //get a new color with the alpha value totally blanked out
        color = color.clone().setAlpha(0);

        for (let roundedX = Math.floor(x); roundedX < Math.ceil(x); roundedX++) {
            for (let roundedY = Math.floor(y); roundedY < Math.ceil(y); roundedY++) {
                let percentX = 1 - Math.abs(x - roundedX)
                let percentY = 1 - Math.abs(y - roundedY)
                let percent = percentX * percentY

                const currentAlpha = (this.get(x, y) ?? color.clone()).alpha
                const additionalAlpha = 255 * percent;
                //make the pixel more solid by this percentage
                const antiAliasedColor = color.clone().setAlpha(
                    currentAlpha + additionalAlpha
                );

                this.set(
                    antiAliasedColor,
                    roundedX,
                    roundedY
                );
            }
        }
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
        let image = new Jimp(width + 2, height + 2, this.backgroundColor.toInteger(), (err, image) => {
            if (err) throw err
        })
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


}
