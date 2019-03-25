export interface Vec2 {
    x: number;
    y: number;
}

export interface ReadonlyVec2 {
    readonly x: number;
    readonly y: number;
}

export const Vec2 = {
    fromCartesian(x: number, y: number) {
        return { x, y };
    },

    zero() {
        return { x: 0, y: 0 };
    },

    clone(vec2: Vec2) {
        return { ...vec2 };
    },

    add(a: Vec2, b: Vec2) {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    },

    div(a: Vec2, b: Vec2) {
        return {
            x: a.x / b.x,
            y: a.y / b.y
        };
    }
}