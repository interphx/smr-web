import { Vec2 } from './vec2';

export class Aabb {
    public left: number;
    public top: number;
    public size: Vec2;

    private constructor(left: number, top: number, width: number, height: number) {
        this.left = left;
        this.top = top;
        this.size = Vec2.fromCartesian(width, height);
    }

    get width() {
        return this.size.x;
    }

    get height() {
        return this.size.y;
    }

    set width(value: number) {
        this.size.x = value;
    }

    set height(value: number) {
        this.size.y = value;
    }

    get right() {
        return this.left + this.width;
    }

    get bottom() {
        return this.top + this.height;
    }

    get halfWidth() {
        return this.width / 2;
    }

    get halfHeight() {
        return this.height / 2;
    }

    public intersects(other: Aabb) {
        return Aabb.intersect(this, other);
    }

    public static intersect(a: Aabb, b: Aabb) {
        return (a.left <= b.right) &&
               (a.right >= b.left) &&
               (a.top <= b.bottom) &&
               (a.bottom >= b.top);
    }

    public static getOverlap(a: Aabb, b: Aabb, output: Vec2 = Vec2.zero()) {
        output.x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        output.y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

        return output;
    }

    public static fromSize(left: number, top: number, width: number, height: number) {
        return new Aabb(left, top, width, height);
    }

    public static fromCenteredSize(width: number, height: number) {
        return Aabb.fromSize(-width/2, -height/2, width, height);
    }
}