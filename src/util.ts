import { Canvas } from "./Canvas";
import { Color } from "./Color";

export function drawCircle(canvas: Canvas, options: { radius: number; borderColor: Color; borderWidth: number; fillColor: Color }) {
    drawCircumference(canvas, {
        radius: options.radius,
        color: options.borderColor,
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

export function drawCircumference(canvas: Canvas, options: { radius: number, color: Color, antiAlias: boolean }) {
    const radius = options.radius;
    const theta_scale = 0.0001;        //Set lower to add more points
    const sizeValue = (2.0 * Math.PI) / theta_scale;
    let size = Math.floor(sizeValue) + 1;
    let theta = 0;
    for (let i = 0; i < size; i++) {
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
