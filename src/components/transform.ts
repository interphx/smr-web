import { Vec2 } from 'types/vec2';
import { lerp } from 'utils/math';

export class Transform {
    public static componentName = 'Transform';

    public lastPosition: Vec2;

    constructor(public position: Vec2) {
        this.lastPosition = {
            x: position.x,
            y: position.y
        };
    }

    public moveTo(x: number, y: number) {
        this.lastPosition.x = this.position.x;
        this.lastPosition.y = this.position.y;

        this.position.x = x;
        this.position.y = y;
    }

    public moveBy(dx: number, dy: number) {
        this.moveTo(this.position.x + dx, this.position.y + dy);
    }

    public teleportTo(x: number, y: number) {
        this.lastPosition.x = this.position.x = x;
        this.lastPosition.y = this.position.y = y;
    }

    public teleportBy(dx: number, dy: number) {
        this.teleportTo(this.position.x + dx, this.position.y + dy);
    }

    public getInterpolatedX(alpha: number) {
        return lerp(this.lastPosition.x, this.position.x, alpha);
    }

    public getInterpolatedY(alpha: number) {
        return lerp(this.lastPosition.y, this.position.y, alpha);
    }
}