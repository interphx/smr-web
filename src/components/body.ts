import { Vec2 } from 'types/vec2';

export class Body {
    public static componentName = 'Body';

    public velocity: Vec2;
    public isLanded: boolean;
    public isAffectedByGravity: boolean;

    constructor(options: {
        velocity?: Vec2,
        isAffectedByGravity?: boolean
    } = {}) {
        this.velocity = options.velocity || Vec2.fromCartesian(0, 0);
        this.isLanded = false;
        this.isAffectedByGravity = (options.isAffectedByGravity === undefined) ? true : options.isAffectedByGravity;
    }
}