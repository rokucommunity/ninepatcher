import * as Jimp from 'jimp';

export function normalizeColor(color: number | string | number[]) {

}

export function plotAntiAliasedPoint(image: Jimp, color: number, x: number, y: number) {
    const baselineColor = colorToRgbaArray(color) ?? [0, 0, 0, 255];
    //mark alpha as fully transparent (we will darken it in this algorithm)
    baselineColor[3] = 0;
    const vertexColors = {} as Record<string, number[]>;
    for (let rounded_x = Math.floor(x); rounded_x < Math.ceil(x); rounded_x++) {
        for (let rounded_y = Math.floor(y); rounded_y < Math.ceil(y); rounded_y++) {
            let percent_x = 1 - Math.abs(x - rounded_x)
            let percent_y = 1 - Math.abs(y - rounded_y)
            let percent = percent_x * percent_y
            const key = `${rounded_x},${rounded_y}`;
            if (!vertexColors[key]) {
                vertexColors[key] = [...baselineColor];
            }
            const rgbaArray = vertexColors[key];
            //darken the pixel by this percentage
            rgbaArray[3] += (255 * percent);
        }
    }
    //write the unique colors to the image
    for (const key in vertexColors) {
        const rgba = vertexColors[key];
        const [x, y] = key.split(',').map(x => parseInt(x));
        const color = normalizeColor(rgba);
        image.setPixelColor(color, x, y);
    }
}

export function degreeToRadian(degree: number) {
    return degree * .0174533;
}
