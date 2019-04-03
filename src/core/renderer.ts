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
        backgroundColor: string,
        enableSmoothing: boolean
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
        this.context.scale(scale.x * pixelRatio, scale.y * pixelRatio);
        this.context.textAlign = 'center';

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

    public drawImageRectWithOpacity(
        topLeft: Vec2,
        sourceRect: Aabb,
        targetSize: Vec2,
        image: HTMLImageElement | HTMLCanvasElement,
        opacity: number
    ) {
        //const oldAlpha = this.context.globalAlpha;
        this.context.globalAlpha = opacity;
        this.context.drawImage(
            image,
            sourceRect.left, sourceRect.top,
            sourceRect.width, sourceRect.height,
            topLeft.x, topLeft.y,
            targetSize.x, targetSize.y
        );
        //this.context.globalAlpha = oldAlpha;
    }

    public drawText(x: number, y: number, text: string) {
        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'black';
        this.context.font = '24px Tahoma';
        this.context.strokeText(text, x, y);
        this.context.fillText(text, x, y);
    }

    public drawTextWithOpacity(x: number, y: number, text: string, opacity: number) {
        this.context.fillStyle = '#f5f59c';
        this.context.strokeStyle = 'black';
        this.context.font = '24px Tahoma';
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