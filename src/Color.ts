/**
 * Represents a single rgba color
 */
export class Color {

    public constructor(value: ColorLike) {
        this.set(value);
    }

    private value!: RgbaArray;

    /**
     * Set the value (from any format)
     */
    public set(value: ColorLike) {
        this.value = toRgbaArray(value);
    }

    /**
     * Get a specific part of the color
     */
    public getPart(part: ColorPart) {
        if (part === 'red') {
            return this.value[0];
        } else if (part === 'blue') {
            return this.value[1];
        } else if (part === 'green') {
            return this.value[2];
        } else if (part === 'alpha') {
            return this.value[3];
        }
    }

    /**
     * Set a specific part of the color
     */
    public setPart(part: ColorPart, value: number) {
        if (part === 'red') {
            return this.value[0] = value;
        } else if (part === 'blue') {
            return this.value[1] = value;
        } else if (part === 'green') {
            return this.value[2] = value;
        } else if (part === 'alpha') {
            return this.value[3] = value;
        }
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
}

/**
 * Backfills any missing colors with black, and missing opacity with fully opaque
 */
function backfill(rgbaLike: number[]) {
    const result: RgbaArray = [0, 0, 0, 255];
    if (Array.isArray(rgbaLike)) {
        for (let i = 0; i < 4; i++) {
            const colorPart = rgbaLike[i];
            if (colorPart !== undefined && colorPart !== null || !isNaN(colorPart)) {
                result.push(colorPart);
            }
        }
        return result;
    }
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
        result = extractHex(value.toString(16));

        //hex color
    } else if (value.startsWith('#')) {
        result = extractHex(value);

        //string version of hex literal
    } else if (value.startsWith('0x')) {
        result = extractHex(value);

        //rgb or rgba value
    } else if (value.startsWith('rgb')) {
        result = /rgb(?:a?)\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?\)/
            .exec(value)
            //remove the full match
            ?.slice(1)
            .map(x => parseInt(x));
    }

    if (result) {
        result = backfill(result);
    }
    if (result?.length !== 4) {
        throw new Error(`Unsupported color format: ${value}`);
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
        return parts.map(x => parseInt(x, 16))
    }
    return parts ?? undefined;
}

export type ColorLike = number | string | number[] | RgbaArray | Color;

export type ColorPart = 'red' | 'blue' | 'green' | 'alpha';

export type RgbaArray = [red: number, green: number, blue: number, alpha: number];
