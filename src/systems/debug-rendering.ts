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

const colliderComponents: [typeof Transform, typeof Collider] = [Transform, Collider];

const cameraComponents: [typeof Transform, typeof Camera] = [Transform, Camera];

export class DebugRenderingSystem {
    private tmpPosition: Vec2 = { x: 0, y: 0 };

    constructor(
        private storage: EntityStorage,
        private renderer: Renderer
    ) {

    }

    run(dt: Milliseconds, alpha: number) {
        const { storage, renderer } = this;

        const cameras = storage.getEntitiesWith(cameraComponents);
        const colliders = storage.getEntitiesWith(colliderComponents);

        for (let camera of cameras) {
            const [cameraTransform] = storage.getComponents(camera, cameraComponents);
            
            const cameraPosX = cameraTransform.getInterpolatedX(alpha);
            const cameraPosY = cameraTransform.getInterpolatedY(alpha);

            for (let entity of colliders) {
                const [transform, collider] = storage.getComponents(entity, colliderComponents);

                const pos = this.tmpPosition;
                pos.x = transform.getInterpolatedX(alpha) - collider.aabb.halfWidth - cameraPosX;
                pos.y = transform.getInterpolatedY(alpha) - collider.aabb.halfHeight - cameraPosY;

                renderer.drawRect(pos, Vec2.fromCartesian(collider.aabb.width, collider.aabb.height), 'transparent', 'red');
            }
        }
    }
}