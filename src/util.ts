import { Canvas } from "./Canvas";
import { Color } from "./Color";

export function drawCircle(canvas: Canvas, options: { radius: number; borderColor: Color; borderWidth: number; fillColor: Color }) {
    drawCircumference(canvas, {
        radius: options.radius,
        color: options.borderColor,
        strokeWidth: options.borderWidth,
        antiAlias: false
    });

    // //fill the circle
    // for (let radius = options.radius; radius >= 0; radius--) {
    //     drawCircumference(canvas, {
    //         radius: radius,
    //         color: options.fillColor,
    //         antiAlias: false
    //     });
    // }
}

export function drawCircumference(canvas: Canvas, options: { radius: number, color: Color, antiAlias: boolean, strokeWidth: number }) {
    const strokeWidth = options.strokeWidth ?? 1;
    //the actual radius should represent the center of the line
    const radius = options.radius - (strokeWidth / 2);
    const theta_scale = 0.001;        //Set lower to add more points
    const sizeValue = (2.0 * Math.PI) / theta_scale;
    let stepCount = Math.floor(sizeValue) + 1;
    let theta = 0;
    for (let i = 0; i < stepCount; i++) {
        theta += (2.0 * Math.PI * theta_scale);
        let x = radius * Math.cos(theta);
        let y = radius * Math.sin(theta);
        //draw where 0,0 is the leftmost and topmost coordinate
        x += radius;
        y += radius;

        if (options.antiAlias) {
            canvas.setAntiAliased(options.color, x, y);
        } else {
            canvas.setIfMissing(options.color, x, y);
        }
    }
}
