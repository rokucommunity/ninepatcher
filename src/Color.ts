/**
 * Represents a single color value, containing r,g,b,a.
 */
export class Color {

    public constructor(value: number | string | number[]) {
        this.set(value);
    }

    private value: RgbaArray;

    /**
     * Set the value (from any format)
     */
    public set(value: number | string | number[]) {
        this.value = toRgbaArray(value);
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
}

/**
 * Backfills any missing colors with black, and missing opacity with fully opaque
 */
function backfill(value: number[]) {
    if (Array.isArray(value)) {
        while (value.length < 4) {
            //pad with black
            if (value.length < 3) {
                value.push(0);
            }
            //default to fully opaque
            if (value.length === 3) {
                value.push(255);
            }
        }
        return value as RgbaArray;
    }
}

type RgbaArray = [number, number, number, number];

/**
 * Take any color value and turn it into an rgba array
 */
function toRgbaArray(value: string | number | number[]) {
    let result: number[] | undefined;
    //An RGBA color array
    if (Array.isArray(value)) {
        result = value as any;

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
    const parts = /(\w\w)+/.exec(value);
    if (parts) {
        //remove the full match so we can keep just the gropus
        parts.shift();
        return parts.map(x => parseInt(x, 16))
    }
    return parts ?? undefined;
}