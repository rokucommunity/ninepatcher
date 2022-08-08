import * as Jimp from 'jimp';
import { Color } from './Color';

export function plotAntiAliasedPoint(image: Jimp, color: Color, x: number, y: number) {
    const baselineColor = new Color(color ?? [0, 0, 0, 255]);
    //mark alpha as fully transparent (we will darken it in this algorithm)
    baselineColor.setPart('alpha', 0);
    const vertexColors = {} as Record<string, Color>;
    for (let rounded_x = Math.floor(x); rounded_x <= Math.ceil(x); rounded_x++) {
        for (let rounded_y = Math.floor(y); rounded_y <= Math.ceil(y); rounded_y++) {
            let percent_x = 1 - Math.abs(x - rounded_x)
            let percent_y = 1 - Math.abs(y - rounded_y)
            let percent = percent_x * percent_y
            const key = `${rounded_x},${rounded_y}`;
            if (!vertexColors[key]) {
                vertexColors[key] = baselineColor.clone();
            }
            const vertexColor = vertexColors[key];
            //make the pixel more solid by this percentage
            vertexColor.merge(new Color([0, 0, 0, 255 * percent]));
        }
    }
    //write the unique colors to the image
    for (const key in vertexColors) {
        const [x, y] = key.split(',').map(x => parseInt(x));
        const vertexColor = vertexColors[key];
        image.setPixelColor(vertexColor.toInteger(), x, y);
    }
}

export function degreeToRadian(degree: number) {
    return degree * .0174533;
}
