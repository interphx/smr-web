import { Vec2 } from 'types/vec2';

export class Camera {
    public static componentName = 'Camera';

    constructor (
        public targetEntityId: string,
        public size: Vec2
    ) {

    }
}