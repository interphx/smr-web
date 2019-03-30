import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Renderer } from 'core/renderer';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Vec2 } from 'types/vec2';
import { lerp } from 'utils/math';
import { Character } from 'components/character';
import { Collider } from 'components/collider';
import { all } from 'core/aspect';

const colliderAspect = all(Transform, Collider);
const cameraAspect = all(Transform, Camera);

export class DebugRenderingSystem {
    private tmpPosition: Vec2 = { x: 0, y: 0 };

    constructor(
        private storage: EntityStorage,
        private renderer: Renderer
    ) {

    }

    run(dt: Milliseconds, alpha: number) {
        const { storage, renderer } = this;

        const cameras = storage.getByAspect(cameraAspect);
        const colliders = storage.getByAspect(colliderAspect);

        for (let { components: [cameraTransform, cameraData] } of cameras) {
            
            const cameraPosX = cameraTransform.getInterpolatedX(alpha);
            const cameraPosY = cameraTransform.getInterpolatedY(alpha);

            for (let { components: [transform, collider] } of colliders) {
                const pos = this.tmpPosition;
                pos.x = transform.getInterpolatedX(alpha) - collider.aabb.halfWidth - cameraPosX;
                pos.y = transform.getInterpolatedY(alpha) - collider.aabb.halfHeight - cameraPosY;

                renderer.drawRect(pos, Vec2.fromCartesian(collider.aabb.width, collider.aabb.height), 'transparent', 'red');
            }
        }
    }
}