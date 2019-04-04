import { Aabb } from 'types/aabb';
import { Vec2 } from 'types/vec2';
import { Image } from 'types/image';

export class StaticSprite {
    public static componentName = 'StaticSprite';

    public texture: Image;
    public zIndex: number;
    public parallaxDepth: number;
    public sourceRect: Aabb;
    public targetSize: Vec2;
    public isGhost: boolean;
    // public opacity: number;

    constructor(
        options: {
            texture: Image,
            zIndex?: number,
            rect?: Aabb,
            targetSize?: Vec2,
            parallaxDepth?: number
        }
    ) {
        this.texture = options.texture;
        this.zIndex = options.zIndex || 0;
        this.sourceRect = options.rect || Aabb.fromSize(0, 0, this.texture.width, this.texture.height);
        this.targetSize = options.targetSize || Vec2.fromCartesian(this.sourceRect.width, this.sourceRect.height);
        this.isGhost = false;
        this.parallaxDepth = options.parallaxDepth || 1;
        // this.opacity = (options.opacity === undefined) ? 1 : options.opacity;
    }
}