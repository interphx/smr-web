export class Text {
    public static componentName = 'Text';

    public text: string;
    public size: number;
    public opacity: number;

    constructor(options: {
        text: string,
        size: number,
        opacity?: number
    }) {
        this.text = options.text;
        this.size = options.size;
        this.opacity = (options.opacity === undefined) ? 1 : options.opacity;
    }
}