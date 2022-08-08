/**
 * Represents a single rgba color
 */
export class Color {

    public constructor(value: ColorLike) {
        this.set(value);
    }

    private value!: RgbaArray;

    /**
     * The red value
     */
    public get red() {
        return this.value[0];
    }
    public set red(value) {
        this.value[0] = snap(value);
    }

    /**
     * Set the red value
     */
    public setRed(value: number) {
        this.red = value;
        return this;
    }

    /**
     * The green value
     */
    public get green() {
        return this.value[1];
    }
    public set green(value) {
        this.value[1] = snap(value);
    }

    /**
     * The green value
     */
    public setGreen(value: number) {
        this.green = value;
        return this;
    }

    /**
     * The blue value
     */
    public get blue() {
        return this.value[2];
    }
    public set blue(value) {
        this.value[2] = snap(value);
    }

    /**
     * Set the alpha value
     */
    public setBlue(value: number) {
        this.blue = value;
        return this;
    }

    /**
     * Get the alpha value
     */
    public get alpha() {
        return this.value[3];
    }
    public set alpha(value) {
        this.value[3] = snap(value);
    }

    /**
     * Set the alpha value
     */
    public setAlpha(value: number) {
        this.alpha = value;
        return this;
    }

    /**
     * Set the value (from any format)
     */
    public set(value: ColorLike) {
        this.value = toRgbaArray(value);
    }

    /**
     * Merge the incoming color and this color together. Colors are added together, and are capped at the max value of 255 for each color
     */
    public merge(color: ColorLike) {
        const incoming = toRgbaArray(color);
        for (let i = 0; i < this.value.length; i++) {
            this.value[i] = snap(incoming[i] + this.value[i]);
        }
        return this;
    }

    /**
     * Get this color as an integer
     */
    public toInteger() {
        const hexData = this.value.map(x => x.toString(16));
        return parseInt(`0x${hexData.join('')}`, 16);
    }

    /**
     * Get this color as a hex string
     */
    public toHex() {
        return `#${this.value.map(x => x.toString(16))}`;
    }

    /**
     * Get this color as an array of rgba values
     */
    public toRgbaArray() {
        return [...this.value] as RgbaArray;
    }

    public clone() {
        return new Color(this);
    }
}

/**
 * Backfills any missing colors with black, and missing opacity with fully opaque, and snap to rgb value
 */
function sanitize(rgbaLike: number[]) {
    const result: RgbaArray = [0, 0, 0, 255];
    if (Array.isArray(rgbaLike)) {
        for (let i = 0; i < 4; i++) {
            const colorPart = rgbaLike[i];
            if (colorPart !== undefined && colorPart !== null && !isNaN(colorPart)) {
                result[i] = snap(colorPart);
            }
        }
        return result;
    }
}

function snap(value: number) {
    if (value < 0) {
        return 0;
    }
    if (value > 255) {
        return 255;
    }
    return value;
}

function isColor(value: any): value is Color {
    return value?.constructor?.name === 'Color';
}

/**
 * Take any color value and turn it into an rgba array
 */
function toRgbaArray(value: ColorLike) {
    let result: number[] | undefined;
    //An RGBA color array
    if (Array.isArray(value)) {
        result = value as any;

        //Color class
    } else if (isColor(value)) {
        result = value.toRgbaArray();

        // integer color
    } else if (typeof value === 'number') {
        let hex = value.toString(16);
        //javascript omits the leading character if it's a zero, so add that back
        if (hex.length % 2 === 1) {
            hex = '0' + hex;
        }
        //we have to treat integer values as rgba integers, so prepend '0' to max out the value.
        hex = hex.padStart(8, '0');
        result = extractHex(hex);

        //hex color
    } else if (value.startsWith('#')) {
        result = extractHex(value);

        //string version of hex literal
    } else if (value.startsWith('0x')) {
        result = extractHex(value);

        //rgb or rgba value
    } else if (value.startsWith('rgb')) {
        result = /\s*rgb(?:a?)\s*\(\s*(\d{1,3})\s*(?:,\s*(\d{1,3})\s*)?(?:,\s*(\d{1,3}))?(?:\s*,\s*(\d{1,3}))?\s*\)\s*/
            .exec(value)
            //remove the full match
            ?.slice(1)
            .map(x => parseInt(x));
    }

    if (result) {
        result = sanitize(result);
    }

    if (result?.length !== 4) {
        throw new Error(`Unsupported color format: '${value}'`);
    } else {
        return result as RgbaArray;
    }
}

/**
 * Given a string, extract hex letter pairs
 */
function extractHex(value: string) {
    const parts = /(\w\w)(\w\w)?(\w\w)?(\w\w)?/.exec(value);
    if (parts) {
        //remove the full match so we can keep just the gropus
        parts.shift();
        return parts.map(x => parseInt(x, 16));
    }
    return parts ?? undefined;
}

export type ColorLike = number | string | number[] | RgbaArray | Color;

export type ColorPart = 'red' | 'blue' | 'green' | 'alpha';

export type RgbaArray = [red: number, green: number, blue: number, alpha: number];
