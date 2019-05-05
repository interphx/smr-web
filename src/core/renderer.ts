import { Vec2 } from 'types/vec2';
import { Aabb } from 'types/aabb';

export class Renderer {
    private resolution: Vec2;
    private size: Vec2;
    private backgroundColor: string;

    private roundCoordinate: (value: number) => number;
    private font: string;
    private scale: Vec2;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(options: {
        resolution: Vec2,
        size: Vec2,
        backgroundColor: string,
        enableSmoothing: boolean
    }) {
        this.resolution = options.resolution;
        this.size = options.size;
        this.backgroundColor = options.backgroundColor;

        const scale = Vec2.div(this.size, this.resolution);
        this.scale = scale;
        const pixelRatio = window.devicePixelRatio || 1;

        this.font = `${16 * Math.min(this.scale.x, this.scale.y)}px Main`;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.resolution.x * scale.x * pixelRatio;
        this.canvas.height = this.resolution.y * scale.y * pixelRatio;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.width = `${this.size.x}px`;
        this.canvas.style.height = `${this.size.y}px`;
        this.canvas.style.transform = `translateZ(0)`;
        (this.canvas.style as any).webkitTransform = `translateZ(0)`;

        window.document.body.style.backgroundColor = this.backgroundColor;

        const context = this.canvas.getContext('2d'); 

        if (!context) {
            throw new Error(`Unable to retrieve 2d rendering ontext for canvas`);
        }

        this.context = context;
        (this.context as any).mozImageSmoothingEnabled = options.enableSmoothing;
        (this.context as any).webkitImageSmoothingEnabled = options.enableSmoothing;
        (this.context as any).msImageSmoothingEnabled = options.enableSmoothing;
        this.context.imageSmoothingEnabled = options.enableSmoothing;
        this.context.scale(pixelRatio, pixelRatio);
        this.context.textAlign = 'center';
        
        this.roundCoordinate = (options.enableSmoothing)
            ? value => Math.round(value)
            : value => value;

        this.context.fillStyle = this.backgroundColor;
        this.context.translate(this.resolution.x / 2 * scale.x, this.resolution.y / 2 * scale.y);
        this.clear();
    }

    public getCanvas() {
        return this.canvas;
    }

    public getSize() {
        return this.resolution;
    }

    public drawRect(topLeft: Vec2, size: Vec2, backgroundColor: string, strokeColor: string) {
        const scale = this.scale;
        const scaleX = scale.x;
        const scaleY = scale.y;

        this.context.fillStyle = backgroundColor;
        this.context.strokeStyle = strokeColor;
        this.context.fillRect(topLeft.x, topLeft.y, size.x * scaleX, size.y * scaleY);
        this.context.strokeRect(topLeft.x, topLeft.y, size.x * scaleX, size.y * scaleY);
    }

    public drawImage(topLeft: Vec2, image: HTMLImageElement | HTMLCanvasElement) {
        this.context.drawImage(image, topLeft.x, topLeft.y);
    }

    public drawImageRect(
        x: number, y: number,
        sourceRect: Aabb,
        targetSize: Vec2,
        image: HTMLImageElement | HTMLCanvasElement
    ) {
        const scale = this.scale;
        const scaleX = scale.x;
        const scaleY = scale.y;
        const roundCoordinate = this.roundCoordinate;

        this.context.drawImage(
            image,
            sourceRect.left, sourceRect.top,
            sourceRect.width, sourceRect.height,
            roundCoordinate(x * scaleX), roundCoordinate(y * scaleY),
            targetSize.x * scaleX, targetSize.y * scaleY
        );
    }

    public drawImageRectWithOpacity(
        x: number, y: number,
        sourceRect: Aabb,
        targetSize: Vec2,
        image: HTMLImageElement | HTMLCanvasElement,
        opacity: number
    ) {
        const scale = this.scale;
        const scaleX = scale.x;
        const scaleY = scale.y;
        const roundCoordinate = this.roundCoordinate;

        this.context.globalAlpha = opacity;
        this.context.drawImage(
            image,
            sourceRect.left, sourceRect.top,
            sourceRect.width, sourceRect.height,
            roundCoordinate(x * scaleX), roundCoordinate(y * scaleY),
            targetSize.x * scaleX, targetSize.y * scaleY
        );
        this.context.globalAlpha = 1;
    }

    public drawText(x: number, y: number, text: string) {
        x = x * this.scale.x;
        y = y * this.scale.y;

        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 2;
        this.context.font = this.font;
        this.context.strokeText(text, x , y);
        this.context.fillText(text, x, y);
    }

    public drawTextRightAligned(x: number, y: number, text: string) {
        this.context.textAlign = 'right';
        this.drawText(x, y, text);
        this.context.textAlign = 'center';
    }

    public drawTextLeftAligned(x: number, y: number, text: string) {
        this.context.textAlign = 'left';
        this.drawText(x, y, text);
        this.context.textAlign = 'center';
    }

    public drawTextWithOpacity(x: number, y: number, text: string, opacity: number) {
        x = x * this.scale.x;
        y = y * this.scale.y;

        this.context.fillStyle = 'white'; //'#f5f59c';
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 2;
        this.context.font = this.font;
        this.context.globalAlpha = opacity;
        this.context.strokeText(text, x, y);
        this.context.fillText(text, x, y);
        this.context.globalAlpha = 1;
    }

    public clear(color: string = this.backgroundColor) {
        this.context.fillStyle = color;
        this.context.fillRect(-this.resolution.x, -this.resolution.y, this.resolution.x * 2, this.resolution.y * 2);
    }
}