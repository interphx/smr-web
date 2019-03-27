export class PointerInput {
    private pointerDown: boolean = false;

    constructor() {
        const press = () => this.pointerDown = true;
        const unpress = () => this.pointerDown = false;

        window.addEventListener('contextmenu', event => {
            event.preventDefault();
        });

        window.addEventListener('mousedown', press);
        window.addEventListener('touchstart', press);
        window.addEventListener('pointerdown', press);

        window.addEventListener('mouseup', unpress);
        window.addEventListener('touchend', unpress);
        window.addEventListener('pointerup', unpress);

        window.addEventListener('blur', unpress);
    }

    public isPointerDown() {
        return this.pointerDown;
    }
}