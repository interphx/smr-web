import { Aabb } from 'types/aabb';

export const enum ColliderType {
    Kinematic = 2,
    Trigger = 3
}

export const enum CollisionLayer {
    None = 0,
    World = 2,
    Obstacle = 4,
    Collectible = 8,
    Character = 16
}

export class Collider {
    public static componentName = 'Collider';

    public aabb: Aabb;
    public type: ColliderType;
    public collidingEntities: string[];
    public collisionLayers: number;
    public collidesWith: number;

    constructor(
        aabb: Aabb,
        type: ColliderType = ColliderType.Kinematic,
        collisionLayers: number = CollisionLayer.World,
        collidesWith: number = CollisionLayer.World
    ) {
        this.aabb = aabb;
        this.type = type;
        this.collidingEntities = [];
        this.collisionLayers = collisionLayers;
        this.collidesWith = collidesWith;
    }
}