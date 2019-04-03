import { EntityStorage } from 'core/entity-storage';
import { Character } from 'components/character';
import { Transform } from 'components/transform';
import { Despawnable } from 'components/despawnable';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Aabb } from 'types/aabb';
import { loadImage } from 'utils/ajax';
import { StaticSprite } from 'components/static-sprite';
import { range, randomPick } from 'utils/iterable';
import { Vec2 } from 'types/vec2';
import { Image } from 'types/image';
import { Collectible } from 'components/collectible';
import { FrameAnimation } from 'components/frame-animation';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { all } from 'core/aspect';
import { hasProperty } from 'utils/object';

const characterAspect = all(Transform, Character);
const despawnableAspect = all(Transform, Despawnable);

const SPAWN_DISTANCE = 1500;
const DESPAWN_DISTANCE = 500;
const BG_MOVEMENT_SPEED = 0.1;

const amplifierRotateFrames = FrameAnimation.generateSpritesheetFrames(
    Vec2.fromCartesian(44, 32),
    Vec2.fromCartesian(352, 32)
);
const amplifierColliderAabb = Aabb.fromCenteredSize(44, 32);
const amplifierSpriteAabb = Aabb.fromSize(0, 0, 44, 32);
const amplifierSpriteSize = Vec2.fromCartesian(44, 32);

const boxColliderAabb = Aabb.fromCenteredSize(56, 56);
const boxSpriteAabb = Aabb.fromSize(0, 0, 56, 56);
const boxSpriteSize = Vec2.fromCartesian(56, 56);

const platformColliderAabb = Aabb.fromCenteredSize(640, 8);
const platformSpriteAabb = Aabb.fromSize(0, 0, 32, 8);
const platformSpriteSize = Vec2.fromCartesian(640, 8);

const backgroundBuildingBodyVelocity = Vec2.fromCartesian(BG_MOVEMENT_SPEED, 0);

const gap = 600;
const boxHalf = 28;
const boxFull = 56;
const ampFull = 44;

class EntityPool {
    private entityIndices: {[key: string]: number} = Object.create(null);
    private entities: string[] = [];
    private firstUnusedIndex: number = 0;

    /*private checkInvariants() {
        for (let entity in this.entityIndices) {
            if (this.entities[this.entityIndices[entity]] !== entity) {
                throw new Error(`Entity cached index mismatch for ${entity} (cached ${this.entityIndices[entity]}, actual ${this.entities.indexOf(entity)})`);
            }
        }
        for (let entity of this.entities) {
            let count = 0;
            for (let other of this.entities) {
                if (other === entity) count += 1;
            }
            if (count !== 1) {
                throw new Error(`Invalid entity count: expected 1, got ${count}`);
            }
        }
        for (let entity of this.entities) {
            if (!this.has(entity)) throw new Error(`Entity is enlisted but not "had"`);
        }
    }*/

    private has(entity: string) {
        return hasProperty(this.entityIndices, entity);
    }

    private isUsed(entity: string) {
        return this.entityIndices[entity] < this.firstUnusedIndex;
    }

    private isFree(entity: string) {
        return this.entityIndices[entity] >= this.firstUnusedIndex;
    }

    private swap(indexA: number, indexB: number) {
        //this.checkInvariants();

        const a = this.entities[indexA];
        const b = this.entities[indexB];

        this.entities[indexA] = b;
        this.entities[indexB] = a;

        this.entityIndices[a] = indexB;
        this.entityIndices[b] = indexA;

        //this.checkInvariants();
    }

    private addNewUsed(entity: string) {
        //this.checkInvariants();

        this.entityIndices[entity] = this.entities.push(entity) - 1;
        this.swap(this.entities.length - 1, this.firstUnusedIndex);
        this.firstUnusedIndex += 1;

        if (!this.has(entity)) throw new Error(`Entity is added but not "had"`);

        //this.checkInvariants();
    }

    private makeUsed(entity: string) {
        //this.checkInvariants();

        if (!this.has(entity) || !this.isFree(entity)) throw new Error(`makeUsed invalid arg`);

        this.swap(this.entityIndices[entity], this.firstUnusedIndex);
        this.firstUnusedIndex += 1;

        //this.checkInvariants();
    }

    private makeUnused(entity: string) {
        //this.checkInvariants();

        if (!this.has(entity) || !this.isUsed(entity)) throw new Error(`makeUnused invalid arg`);

        this.swap(this.entityIndices[entity], this.firstUnusedIndex - 1);
        this.firstUnusedIndex -= 1;

        //this.checkInvariants();
    }

    addUsedEntity(entity: string) {
        //this.checkInvariants();

        this.addNewUsed(entity);

        //this.checkInvariants();
    }

    getEntity() {
        //this.checkInvariants();

        if (this.firstUnusedIndex < this.entities.length) {
            const result = this.entities[this.firstUnusedIndex];
            this.makeUsed(result);
            return result;
        }
        return null;
    }

    freeEntity(entity: string) {
       // this.checkInvariants();

        this.makeUnused(entity);

        //this.checkInvariants();
    }

    tryFreeEntity(entity: string) {
        //this.checkInvariants();

        if (this.isUsed(entity)) {
            this.freeEntity(entity);
        }

        //this.checkInvariants();
    }

    hasEntity(entity: string) {
        return this.has(entity);
    }
}

export class WorldGenerationSystem {
    // Rightmost edges
    private farthestPlatformX: number = -400;
    private farthestForegroundX: number = -400;
    private farthestBackgroundX: number = -400;
    private farthestChallengeX: number = 0;

    private textures: {
        platform: Image,
        amplifier: Image,
        box: Image,
        backgroundBuildings: ReadonlyArray<Image>,
        foregroundBuildings: ReadonlyArray<Image>
    } | null = null;

    constructor(private storage: EntityStorage) {
        this.removeEntity = this.removeEntity.bind(this);
        this.initialize();
    }

    public async waitForInitialization() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (this.textures) {
                    clearInterval(interval);
                    resolve();
                }
            }, 400);
        });
    }

    async initialize() {
        const platform = await loadImage('assets/images/platform.png');
        const amplifier = await loadImage('assets/images/amplifier.png');
        const box = await loadImage('assets/images/box.png');
        const backgroundBuildings = await Promise.all(range(0, 7).map(n => loadImage(`assets/images/background_building_${n}.png`)));
        const foregroundBuildings = await Promise.all(range(0, 7).map(n => loadImage(`assets/images/foreground_building_${n}.png`)));
        this.textures = {
            platform,
            amplifier,
            box,
            backgroundBuildings,
            foregroundBuildings
        };
    }

    removeEntity(entity: string) {
        this.storage.removeEntity(entity);
    }

    private foregroundBuildingPool = new EntityPool();
    spawnForegroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.foregroundBuildings);

        const existingBuilding = this.foregroundBuildingPool.getEntity();

        if (existingBuilding) {
            const transform = storage.getComponent(existingBuilding, Transform);
            const sprite = storage.getComponent(existingBuilding, StaticSprite);

            transform.teleportTo(this.farthestForegroundX + texture.width / 2, -(texture.height) / 2);
            sprite.texture = texture;
            sprite.sourceRect.width = texture.width;
            sprite.sourceRect.height = texture.height;
            sprite.targetSize.x = texture.width;
            sprite.targetSize.y = texture.height;
        } else {

            const buildingSize = Vec2.fromCartesian(
                texture.width,
                texture.height
            );

            const building = storage.createEntity();
            this.foregroundBuildingPool.addUsedEntity(building);

            storage.setComponents(building, [
                new Transform({
                    x: this.farthestForegroundX + buildingSize.x / 2,
                    y: -(buildingSize.y / 2)
                }),
                new Despawnable(),
                new StaticSprite({
                    texture,
                    zIndex: -1,
                    targetSize: buildingSize
                })
            ]);
        }
        this.farthestForegroundX += texture.width;
    }

    spawnBackgroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.backgroundBuildings);

        const buildingSize = Vec2.fromCartesian(
            texture.width,
            texture.height
        );

        const building = storage.createEntity();
        storage.setComponents(building, [
            new Transform({
                x: this.farthestBackgroundX + buildingSize.x / 2,
                y: -180 - (buildingSize.y / 2)
            }),
            new Despawnable(),
            new StaticSprite({
                texture,
                zIndex: -2,
                targetSize: buildingSize
            }),
            new Body({
                velocity: backgroundBuildingBodyVelocity,
                isAffectedByGravity: false
            })
        ]);
        this.farthestBackgroundX += buildingSize.x;
    }

    private platformPool = new EntityPool();
    spawnPlatform() {
        if (!this.textures) return;

        const { storage } = this;

        const width = platformColliderAabb.width;
        const halfWidth = width / 2;

        const existingPlatform = this.platformPool.getEntity();

        if (existingPlatform) {
            const transform = storage.getComponent(existingPlatform, Transform);
            transform.teleportTo(this.farthestPlatformX + halfWidth, 0);
        } else {
            const platform = storage.createEntity();
            this.platformPool.addUsedEntity(platform);

            storage.setComponents(platform, [
                new Transform({ x: this.farthestPlatformX + halfWidth, y: 0 }),
                new Collider(platformColliderAabb),
                new Despawnable(),
                new StaticSprite({
                    texture: this.textures.platform,
                    zIndex: 0,
                    rect: platformSpriteAabb,
                    targetSize: platformSpriteSize
                })
            ]);
        }
        this.farthestPlatformX += width;
    }

    private amplifierPool = new EntityPool();
    spawnAmplifier(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        const existingAmplifier = this.amplifierPool.getEntity();

        if (existingAmplifier) {
            const transform = storage.getComponent(existingAmplifier, Transform);
            transform.teleportTo(x, y);
        } else {
            const amplifier = storage.createEntity();
            this.amplifierPool.addUsedEntity(amplifier);

            storage.setComponents(amplifier, [
                new Transform({ x, y }),
                new Collider(
                    amplifierColliderAabb,
                    ColliderType.Trigger,
                    CollisionLayer.Collectible
                ),
                new Collectible(10),
                new StaticSprite({
                    texture: this.textures.amplifier,
                    zIndex: 1,
                    rect: amplifierSpriteAabb,
                    targetSize: amplifierSpriteSize
                }),
                new FrameAnimation({
                    animations: {
                        'rotate': {
                            duration: Milliseconds.from(1000),
                            frames: amplifierRotateFrames,
                            mode: 'repeat'
                        }
                    },
                    currentAnimation: 'rotate'
                })
            ]);
        }
    }

    private boxPool = new EntityPool();
    spawnBox(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        const existingBox = this.boxPool.getEntity();

        if (existingBox) {
            const transform = storage.getComponent(existingBox, Transform);
            transform.teleportTo(x, y);
        } else {
            const box = storage.createEntity();
            this.boxPool.addUsedEntity(box);

            storage.setComponents(box, [
                new Transform({ x, y }),
                new Collider(
                    boxColliderAabb,
                    ColliderType.Kinematic,
                    CollisionLayer.Obstacle,
                    CollisionLayer.Character
                ),
                new StaticSprite({
                    texture: this.textures.box,
                    zIndex: 1,
                    rect: boxSpriteAabb,
                    targetSize: boxSpriteSize
                })
            ]);
        }
    }

    patterns = [
        this.patternA.bind(this),
        this.patternB.bind(this),
        this.patternC.bind(this),
        this.patternD.bind(this),
        this.patternE.bind(this),
        this.patternF.bind(this),
        this.patternG.bind(this),
        this.patternH.bind(this)
    ];

    spawnChallenge() {
        if (!this.textures) return;
        
        var patterns = this.patterns;
        patterns[Math.floor(Math.random()*patterns.length)]();
                
        this.farthestChallengeX += 44 + gap;
    }

    patternA(){
        this.spawnAmplifier(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap + 100, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + 100, -56 - 32);
        this.spawnAmplifier(this.farthestChallengeX + gap + 200, -30);
    }

    patternB(){
        this.spawnAmplifier(this.farthestChallengeX + gap + 12, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull + boxHalf, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull + boxHalf, -30 - boxFull)
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf ) * 2 + boxHalf, -30);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf ) * 2 + boxHalf, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf )* 2 + boxHalf, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf )* 3 + boxHalf, -30);
    }

    patternC(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 4, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 4, -30 - boxFull * 2);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 4 + boxFull, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 4 + boxFull, -30 - boxFull * 2);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 8, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 8, -30 - boxFull * 3);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 8 + boxFull, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 8 + boxFull, -30 - boxFull * 3);
        this.farthestChallengeX += 200;
    }

    patternD(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull + boxHalf, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 2, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 3, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 4, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf) * 4, -30);
    }

    patternE(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxHalf + 12, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10 + 200, -30 - boxFull*5);
    }

    patternF(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull*2);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*2);
        this.farthestChallengeX += 200;
    }

    patternG(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*3);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*4);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*5);
        this.farthestChallengeX += 100;
    }
    
    patternH(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*2 - 20);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*4, -30 - boxFull*2 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*3 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*4, -30 - boxFull*3 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3 + ampFull/2 + 5, -30 - boxFull*4 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*2, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*4, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*5, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*7, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*7, -30 - boxFull);
    }

    freeOrRemove(entity: string) {
        if (this.platformPool.hasEntity(entity)) {
            this.platformPool.tryFreeEntity(entity);
        } else if (this.amplifierPool.hasEntity(entity)) {
            this.amplifierPool.tryFreeEntity(entity);
        } else if (this.boxPool.hasEntity(entity)) {
            this.boxPool.tryFreeEntity(entity);
        } else if (this.foregroundBuildingPool.hasEntity(entity)) {
            this.foregroundBuildingPool.tryFreeEntity(entity);
        } else {
            this.storage.removeEntity(entity);
        }
    }

    run(dt: number) {
        if (!this.textures) return;

        const { storage } = this;

        const characters = storage.getByAspect(characterAspect);
        const despawnables = storage.getByAspect(despawnableAspect);

        for (let { components: [characterTransform, ] } of characters) {
            // Despawning
            for (let { entity: despawnable, components: [despawnableTransform, ] } of despawnables) {
                if (despawnableTransform.position.x <= characterTransform.position.x - DESPAWN_DISTANCE) {
                    this.freeOrRemove(despawnable);
                }
            }

            // Syncing with physics updates
            this.farthestBackgroundX += BG_MOVEMENT_SPEED * dt;

            // Spawning

            const spawnFrontier = characterTransform.position.x + SPAWN_DISTANCE;
            const spawnFrontierExtended = spawnFrontier + SPAWN_DISTANCE;

            if (
                this.farthestPlatformX < spawnFrontier &&
                this.farthestForegroundX < spawnFrontier &&
                this.farthestBackgroundX < spawnFrontier &&
                this.farthestChallengeX < spawnFrontier
            ) {
                while (this.farthestPlatformX < spawnFrontierExtended) {
                    this.spawnPlatform();
                }

                while (this.farthestForegroundX < spawnFrontierExtended) {
                    this.spawnForegroundBuilding();
                }
                this.spawnForegroundBuilding();

                while (this.farthestBackgroundX < spawnFrontierExtended) {
                    this.spawnBackgroundBuilding();
                }

                while (this.farthestChallengeX < spawnFrontierExtended) {
                    this.spawnChallenge();
                }

                /*for (let i = 0; i < 4; ++i) {
                    this.spawnPlatform();
                }
                for (let i = 0; i < 9; ++i) {
                    this.spawnForegroundBuilding();
                }
                for (let i = 0; i < 7; ++i) {
                    this.spawnBackgroundBuilding();
                }
                for (let i = 0; i < 4; ++i) {
                    this.spawnChallenge();
                }*/
            }
            /*
            if (this.farthestPlatformX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 3; ++i) {
                    this.spawnPlatform();
                }
            }

            if (this.farthestForegroundX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 6; ++i) {
                    this.spawnForegroundBuilding();
                }
            }

            if (this.farthestBackgroundX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 6; ++i) {
                    this.spawnBackgroundBuilding();
                }
            }

            if (this.farthestChallengeX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 4; ++i) {
                    this.spawnChallenge();
                }
            }*/
        }
    }
}