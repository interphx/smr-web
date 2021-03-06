import { EntityStorage } from 'core/entity-storage';
import { Body } from 'components/body';
import { Transform } from 'components/transform';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Vec2 } from 'types/vec2';
import { Aabb } from 'types/aabb';
import { Character } from 'components/character';
import { all } from 'core/aspect';
import { TrackedEntity } from 'core/tracking-table';
import { copyArray } from 'utils/iterable';

const collidableBodyAspect = all(Transform, Collider, Body);
const collidableAspect = all(Transform, Collider);

const iterations = 1;
const tolerance  = 0.0001;

const overlap = Vec2.zero();
const bodyAabb = Aabb.fromSize(0, 0, 0, 0);
const obstacleAabb = Aabb.fromSize(0, 0, 0, 0);

const tmpCollidablesArray: TrackedEntity<[Transform, Collider]>[] = [];

export class CollisionSystem {
    constructor(
        private storage: EntityStorage
    ) {
        this.compare = this.compare.bind(this);
    }

    private tmpOrigin: Vec2 = Vec2.fromCartesian(0, 0);
    private compare(a: {entity: string, components: [Transform, Collider]}, b: {entity: string, components: [Transform, Collider]}) {
        const origin = this.tmpOrigin;
        const transformA = a.components[0];
        const transformB = b.components[0];

        const abs = Math.abs;
        const posA = transformA.position;
        const posB = transformB.position;
        const ox = origin.x;
        const oy = origin.y;

        const distanceA = abs(posA.x - ox) +
                          abs(posA.y - oy);
        const distanceB = abs(posB.x - ox) +
                          abs(posB.y - oy);

        return distanceA - distanceB;
    }

    sortByDistance(origin: Vec2, entities: { entity: string, components: [Transform, Collider] }[]) {
        this.tmpOrigin = origin;
        entities.sort(this.compare);
    }
    
    public run(dt: number) {
        for (let i = 0; i < iterations; ++i) {
            const collidableBodies = this.storage.getByAspect(collidableBodyAspect);
            const collidables = copyArray(this.storage.getByAspect(collidableAspect), tmpCollidablesArray);

            for (let { entity: body, components: [bodyTransform, bodyCollider, bodyData] } of collidableBodies) {
                if (i === 0) {
                    bodyData.isLanded = false;
                    bodyCollider.collidingEntities.length = 0;
                }

                this.sortByDistance(bodyTransform.position, collidables);

                for (let { entity: obstacle, components: [obstacleTransform, obstacleCollider] } of collidables) {
                    if (body === obstacle) continue;

                    if ((bodyCollider.collidesWith & obstacleCollider.collisionLayers) === CollisionLayer.None) continue;

                    bodyAabb.left = bodyCollider.aabb.left + bodyTransform.position.x;
                    bodyAabb.top = bodyCollider.aabb.top + bodyTransform.position.y;
                    bodyAabb.width = bodyCollider.aabb.width;
                    bodyAabb.height = bodyCollider.aabb.height;

                    obstacleAabb.left = obstacleCollider.aabb.left + obstacleTransform.position.x;
                    obstacleAabb.top = obstacleCollider.aabb.top + obstacleTransform.position.y;
                    obstacleAabb.width = obstacleCollider.aabb.width;
                    obstacleAabb.height = obstacleCollider.aabb.height;

                    if (!Aabb.intersect(bodyAabb, obstacleAabb)) continue;

                    Aabb.getOverlap(bodyAabb, obstacleAabb, overlap);

                    if (overlap.y <= tolerance || overlap.x <= tolerance) continue;

                    if (i === 0) {
                        bodyCollider.collidingEntities.push(obstacle);
                    }

                    if (obstacleCollider.type === ColliderType.Trigger) continue;

                    if (overlap.y <= overlap.x * 1.9) {
                        const moveToBottom = bodyTransform.position.y - obstacleTransform.position.y > 0;
                        if (!moveToBottom) {
                            bodyTransform.position.y = obstacleTransform.position.y - obstacleCollider.aabb.halfHeight - bodyCollider.aabb.halfHeight;
                            bodyData.isLanded = true;
                            if (bodyData.velocity.y > 0) bodyData.velocity.y = 0;
                        } else {
                            bodyTransform.position.y = obstacleTransform.position.y + obstacleCollider.aabb.halfHeight + bodyCollider.aabb.halfHeight;
                            if (bodyData.velocity.y < 0) bodyData.velocity.y = 0;
                        }
                        
                        bodyData.velocity.y = 0;
                    } else {
                        const moveToRight = bodyTransform.position.x - obstacleTransform.position.x > 0;
                        if (!moveToRight) {
                            bodyTransform.position.x = obstacleTransform.position.x - obstacleCollider.aabb.halfWidth - bodyCollider.aabb.halfWidth;
                            if (bodyData.velocity.x > 0) bodyData.velocity.x = 0;
                        } else {
                            bodyTransform.position.x = obstacleTransform.position.x + obstacleCollider.aabb.halfWidth + bodyCollider.aabb.halfWidth;
                            if (bodyData.velocity.x < 0) bodyData.velocity.x = 0;
                        }
                    }
                }
            }
        }
    }
}