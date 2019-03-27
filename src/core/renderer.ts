import { Vec2 } from 'types/vec2';
import { Aabb } from 'types/aabb';

export class Renderer {
    private resolution: Vec2;
    private size: Vec2;
    private backgroundColor: string;

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(options: {
        resolution: Vec2,
        size: Vec2,
        backgroundColor: string
    }) {
        this.resolution = options.resolution;
        this.size = options.size;
        this.backgroundColor = options.backgroundColor;

        const scale = Vec2.div(this.size, this.resolution);
        const pixelRatio = window.devicePixelRatio || 1;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.resolution.x * scale.x * pixelRatio;
        this.canvas.height = this.resolution.y * scale.y * pixelRatio;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.width = `${this.resolution.x * scale.x}`;
        this.canvas.style.height = `${this.resolution.y * scale.y}`;
        this.canvas.style.maxWidth = `100vw`;
        this.canvas.style.maxHeight = `100vh`;

        window.document.body.style.backgroundColor = this.backgroundColor;

        const context = this.canvas.getContext('2d'); 

        if (!context) {
            throw new Error(`Unable to retrieve 2d rendering ontext for canvas`);
        }

        this.context = context;
        (this.context as any).mozImageSmoothingEnabled = true;
        this.context.imageSmoothingEnabled = true;
        this.context.scale(scale.x * pixelRatio, scale.y * pixelRatio);

        this.context.fillStyle = this.backgroundColor;
        this.context.translate(this.resolution.x / 2, this.resolution.y / 2);
        this.clear();
    }

    public getCanvas() {
        return this.canvas;
    }

    public getSize() {
        return this.resolution;
    }

    public drawRect(topLeft: Vec2, size: Vec2, backgroundColor: string, strokeColor: string) {
        this.context.fillStyle = backgroundColor;
        this.context.strokeStyle = strokeColor;
        this.context.fillRect(topLeft.x, topLeft.y, size.x, size.y);
        this.context.strokeRect(topLeft.x, topLeft.y, size.x, size.y);
    }

    public drawImage(topLeft: Vec2, image: HTMLImageElement | HTMLCanvasElement) {
        this.context.drawImage(image, topLeft.x, topLeft.y);
    }

    public drawImageRect(
        topLeft: Vec2,
        sourceRect: Aabb,
        targetSize: Vec2,
        image: HTMLImageElement | HTMLCanvasElement
    ) {
        this.context.drawImage(
            image,
            sourceRect.left, sourceRect.top,
            sourceRect.width, sourceRect.height,
            topLeft.x, topLeft.y,
            targetSize.x, targetSize.y
        );
    }

    public drawText(x: number, y: number, text: string) {
        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'black';
        this.context.font = '24px Tahoma';
        this.context.fillText(text, x, y);
        this.context.strokeText(text, x, y);
    }

    public clear(color: string = this.backgroundColor) {
        this.context.fillStyle = color;
        this.context.fillRect(-this.resolution.x, -this.resolution.y, this.resolution.x * 2, this.resolution.y * 2);
    }
}