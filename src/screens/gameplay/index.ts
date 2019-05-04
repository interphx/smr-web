import { GameScreen } from 'screens/game-screen';
import { EntityStorage } from 'core/entity-storage';
import { AssetLoader } from 'core/asset-loader';
import { Character } from 'components/character';
import { Body } from 'components/body';
import { Vec2 } from 'types/vec2';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Aabb } from 'types/aabb';
import { Image } from 'types/image';
import { Jump } from 'components/jump';
import { Milliseconds } from 'types/milliseconds';
import { FrameAnimation } from 'components/frame-animation';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Transform } from 'components/transform';
import { Renderer } from 'core/renderer';
import { KeyboardInput } from 'input/keyboard';
import { PointerInput } from 'input/pointer';
import { Despawnable } from 'components/despawnable';
import { Collectible } from 'components/collectible';
import { FloatingText } from 'components/floating-text';
import { setup } from 'setup';
import { RenderingSystem } from 'systems/rendering';
import { CameraSystem } from 'systems/camera';
import { PhysicsSystem } from 'systems/physics';
import { AnimationSystem } from 'systems/animation';
import { CollisionSystem } from 'systems/collision';
import { JumpingSystem } from 'systems/jumping';
import { WorldGenerationSystem } from 'systems/world-generation';
import { ScoringSystem } from 'systems/scoring';
import { DamageSystem } from 'systems/damage';
import { SpeedSystem } from 'systems/speed';
import { GameLoop } from 'core/game-loop';
import { Text } from 'components/text';

type ScreenSetter = (screenName: 'menu') => void;

const TARGET_SIZE = Vec2.fromCartesian(640, 480);

async function createCharacter(storage: EntityStorage, imageLoader: AssetLoader<Image>) {
    const character = storage.createEntity();
    storage.setComponents(character, [
        new Character(3),
        new Transform({ x: 0, y: -128 }),
        new Body({ velocity: Vec2.fromCartesian(0.25, 0), isAffectedByGravity: true }),
        new Collider(
            Aabb.fromSize(-34, -62, 68, 124),
            ColliderType.Kinematic,
            CollisionLayer.Character,
            CollisionLayer.World | CollisionLayer.Obstacle | CollisionLayer.Collectible
        ),
        new Jump({
            speed: 0.6,
            maxTime: Milliseconds.from(400)
        })
    ]);

    const texture = await imageLoader.get('assets/images/character.png');

    const frameSize = Vec2.fromCartesian(128, 128);
    const textureSize = Vec2.fromCartesian(texture.width, texture.height);
    const frames = FrameAnimation.generateSpritesheetFrames(frameSize, textureSize);

    const runFrames = frames.slice(1, 7);

    const jumpAscendingFrames = frames.slice(7, 8);
    const jumpApexFrames = frames.slice(8, 9);
    const jumpDescendingFrames = frames.slice(9, 10);

    storage.setComponents(character, [
        new StaticSprite({
            texture,
            zIndex: 1,
            rect: Aabb.fromSize(0, 0, 128, 128)
        }),
        new FrameAnimation({
            animations: {
                'run': {
                    duration: Milliseconds.from(900),
                    frames: runFrames,
                    mode: 'repeat'
                },
                'jump-ascending': {
                    duration: Milliseconds.from(600),
                    frames: jumpAscendingFrames,
                    mode: 'repeat'
                },
                'jump-apex': {
                    duration: Milliseconds.from(600),
                    frames: jumpApexFrames,
                    mode: 'repeat'
                },
                'jump-descending': {
                    duration: Milliseconds.from(600),
                    frames: jumpDescendingFrames,
                    mode: 'repeat'
                }
            },
            currentAnimation: 'run'
        })
    ]);

    return Promise.resolve(character);
}

function createCamera(storage: EntityStorage, characterId: string, size: Vec2) {
    const camera = storage.createEntity();
    storage.setComponents(camera, [
        new Camera(characterId, Vec2.clone(size)),
        new Transform({ x: 0, y: 0 })
    ]);
}


async function createGameLoop(
    imageLoader: AssetLoader<Image>,
    renderer: Renderer,
    keyboardInput: KeyboardInput,
    pointerInput: PointerInput,
    targetSize: Vec2
) {
    const storage = new EntityStorage();
    storage.registerComponentType(Transform);
    storage.registerComponentType(StaticSprite);
    storage.registerComponentType(Character);
    storage.registerComponentType(Camera);
    storage.registerComponentType(FrameAnimation);
    storage.registerComponentType(Body);
    storage.registerComponentType(Collider);
    storage.registerComponentType(Jump);
    storage.registerComponentType(Despawnable);
    storage.registerComponentType(Collectible);
    storage.registerComponentType(Text);
    storage.registerComponentType(FloatingText);
    setup(storage);

    const renderingSystem = new RenderingSystem(storage, renderer, imageLoader);
    const cameraSystem = new CameraSystem(storage);
    const physicsSystem = new PhysicsSystem(storage);
    const animationSystem = new AnimationSystem(storage);
    const collisionSystem = new CollisionSystem(storage);
    const jumpingSystem = new JumpingSystem(storage, keyboardInput, pointerInput);
    const worldGenerationSystem = new WorldGenerationSystem(storage, imageLoader);
    const scoringSystem = new ScoringSystem(storage, entity => {
        storage.removeEntity(entity);
    });
    const damageSystem = new DamageSystem(storage);
    // const debugRenderingSystem = new DebugRenderingSystem(storage, renderer);
    const speedSystem = new SpeedSystem(storage, -60);

    await worldGenerationSystem.initialize();
    await renderingSystem.initialize();

    let frameCount = 0;

    const loop = new GameLoop({
        timestep: Milliseconds.from(1000 / 30),
        onFixedUpdate: dt => {
            jumpingSystem.run(dt);
            physicsSystem.run(dt);
            collisionSystem.run(dt);
            cameraSystem.run(dt);
            scoringSystem.run(dt);
        },
        onVariableUpdate: (dt, alpha) => {
            animationSystem.run(dt);
            renderingSystem.run(dt, alpha);
            // debugRenderingSystem.run(dt, alpha);
            
            damageSystem.run(dt);
            speedSystem.run(dt);

            frameCount += 1;
            if ((frameCount < 5) || (frameCount % 15 === 0)) {
                worldGenerationSystem.run(dt);
            }

            storage.handleRemovals();
        }
    });

    const character = await createCharacter(storage, imageLoader);
    const camera = createCamera(storage, character, targetSize);

    return loop;
}

export class GameplayGameScreen implements GameScreen {
    private loop: GameLoop | null = null;

    constructor(
        private setScreen: ScreenSetter,
        private renderer: Renderer,
        private keyboard: KeyboardInput,
        private pointer: PointerInput,
        private imageLoader: AssetLoader<Image>,
        private container: Node
    ) {

    }

    async start(): Promise<void> {
        this.container.appendChild(this.renderer.getCanvas());
        this.loop = await createGameLoop(
            this.imageLoader,
            this.renderer,
            this.keyboard,
            this.pointer,
            TARGET_SIZE
        );
        this.loop.start();
    }
    
    async stop(): Promise<void> {
        if (this.loop) {
            this.loop.stop();
            this.loop = null;
        }
        this.renderer.clear();
        if (this.renderer.getCanvas().parentNode === this.container) {
            this.container.removeChild(this.renderer.getCanvas());
        }
    }
}