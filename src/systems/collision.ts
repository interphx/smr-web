import { EntityStorage } from 'core/entity-storage';
import { Body } from 'components/body';
import { Transform } from 'components/transform';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Vec2 } from 'types/vec2';
import { Aabb } from 'types/aabb';
import { Character } from 'components/character';

const collidableBodyComponents: [typeof Transform, typeof Collider, typeof Body] = [Transform, Collider, Body];
const collidableComponents: [typeof Transform, typeof Collider] = [Transform, Collider];

const iterations = 1;
const tolerance  = 0.0001;

const overlap = Vec2.zero();
const bodyAabb = Aabb.fromSize(0, 0, 0, 0);
const obstacleAabb = Aabb.fromSize(0, 0, 0, 0);

export class CollisionSystem {
    constructor(
        private storage: EntityStorage
    ) {
        // this.sortByDistance = this.sortByDistance.bind(this);
    }

    sortByDistance(origin: Vec2, entities: string[]) {
        entities.sort((a, b) => {
            const transformA = this.storage.getComponent(a, Transform);
            const transformB = this.storage.getComponent(b, Transform);

            const distanceA = Math.abs(transformA.position.x - origin.x) +
                              Math.abs(transformA.position.y - origin.y);
            const distanceB = Math.abs(transformB.position.x - origin.x) +
                              Math.abs(transformB.position.y - origin.y);

            return distanceA - distanceB;
        });
    }

    public run(dt: number) {
        for (let i = 0; i < iterations; ++i) {
            const collidableBodies = this.storage.getEntitiesWith(collidableBodyComponents);
            const collidables = this.storage.getEntitiesWith(collidableComponents);

            for (let body of collidableBodies) {
                const [bodyTransform, bodyCollider, bodyData] = this.storage.getComponents(body, collidableBodyComponents);
                if (i === 0) {
                    bodyData.isLanded = false;
                    bodyCollider.collidingEntities.length = 0;
                }

                this.sortByDistance(bodyTransform.position, collidables);
                /*collidables.sort((a, b) => {
                    const transformA = this.storage.getComponent(a, Transform);
                    const transformB = this.storage.getComponent(b, Transform);

                    const distanceA = Math.abs(transformA.position.x - bodyTransform.position.x) +
                                      Math.abs(transformA.position.y - bodyTransform.position.y);
                    const distanceB = Math.abs(transformB.position.x - bodyTransform.position.x) +
                                      Math.abs(transformB.position.y - bodyTransform.position.y);

                    return distanceA - distanceB;
                });*/

                for (let obstacle of collidables) {
                    if (body === obstacle) continue;

                    const [obstacleTransform, obstacleCollider] = this.storage.getComponents(obstacle, collidableComponents);

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

                    if (overlap.y <= overlap.x) {
                        // const oldY = bodyTransform.position.y;
                        const moveToBottom = bodyTransform.position.y - obstacleTransform.position.y > 0;
                        if (!moveToBottom) {
                            bodyTransform.position.y = obstacleTransform.position.y - obstacleCollider.aabb.halfHeight - bodyCollider.aabb.halfHeight;
                            bodyData.isLanded = true;
                            // if (Math.abs(oldY - bodyTransform.position.y) > 33) debugger;
                            if (bodyData.velocity.y > 0) bodyData.velocity.y = 0;
                        } else {
                            bodyTransform.position.y = obstacleTransform.position.y + obstacleCollider.aabb.halfHeight + bodyCollider.aabb.halfHeight;
                            // if (Math.abs(oldY - bodyTransform.position.y) > 33) debugger;
                            if (bodyData.velocity.y < 0) bodyData.velocity.y = 0;
                        }
                        
                        bodyData.velocity.y = 0;
                    } else {
                        //const characterData = this.storage.getComponent(body, Character);
                        //if (characterData && characterData.isGhost()) continue;
                        // const oldX = bodyTransform.position.x;
                        const moveToRight = bodyTransform.position.x - obstacleTransform.position.x > 0;
                        if (!moveToRight) {
                            bodyTransform.position.x = obstacleTransform.position.x - obstacleCollider.aabb.halfWidth - bodyCollider.aabb.halfWidth;
                            // if (Math.abs(oldX - bodyTransform.position.x) > 33) debugger;
                            if (bodyData.velocity.x > 0) bodyData.velocity.x = 0;
                        } else {
                            bodyTransform.position.x = obstacleTransform.position.x + obstacleCollider.aabb.halfWidth + bodyCollider.aabb.halfWidth;
                            // if (Math.abs(oldX - bodyTransform.position.x) > 33) debugger;
                            if (bodyData.velocity.x < 0) bodyData.velocity.x = 0;
                        }
                    }
                }
            }
        }
    }
}