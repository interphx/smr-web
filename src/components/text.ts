export class Text {
    public text: string;
    public size: number;

    constructor(options: {
        text: string,
        size: number
    }) {
        this.text = options.text;
        this.size = options.size;
    }
}