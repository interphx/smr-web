import { EntityStorage } from 'core/entity-storage';
import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Renderer } from 'core/renderer';
import { GameLoop } from 'core/game-loop';
import { Milliseconds } from 'types/milliseconds';
import { Camera } from 'components/camera';
import { waitForDocumentLoad } from 'utils/ajax';
import { Character } from 'components/character';
import { RenderingSystem } from 'systems/rendering';
import { CameraSystem } from 'systems/camera';
import { PhysicsSystem } from 'systems/physics';
import { Vec2 } from 'types/vec2';
import { KeyboardInput } from 'input/keyboard';
import { delay } from 'utils/async';
import { AnimationSystem } from 'systems/animation';
import { FrameAnimation } from 'components/frame-animation';
import { Body } from 'components/body';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Aabb } from 'types/aabb';
import { Image } from 'types/image';
import { CollisionSystem } from 'systems/collision';
import { Jump } from 'components/jump';
import { JumpingSystem } from 'systems/jumping';
import { Despawnable } from 'components/despawnable';
import { WorldGenerationSystem } from 'systems/world-generation';
import { ScoringSystem } from 'systems/scoring';
import { PointerInput } from 'input/pointer';
import { Collectible } from 'components/collectible';
import { setup } from 'setup';
import { DamageSystem } from 'systems/damage';
import { DebugRenderingSystem } from 'systems/debug-rendering';
import { SpeedSystem } from 'systems/speed';
import { Text } from 'components/text';
import { FloatingText } from 'components/floating-text';
import { ImageAssetLoader } from 'core/image-asset-loader';
import { AssetLoader } from 'core/asset-loader';

const TARGET_SIZE = Vec2.fromCartesian(640, 480);

function getScreenSize(targetSize: Vec2) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const targetAspectRatio = targetSize.x / targetSize.y;
    const screenAspectRatio = windowWidth / windowHeight;

    const width = (screenAspectRatio > targetAspectRatio)
        ? targetSize.x * (windowHeight / targetSize.y)
        : windowWidth;
    const height = (screenAspectRatio > targetAspectRatio)
        ? windowHeight
        : targetSize.y * (windowWidth / targetSize.x);
    
    return Vec2.fromCartesian(width, height);
}

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
    pointerInput: PointerInput
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
    const speedSystem = new SpeedSystem(storage);

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
    const camera = createCamera(storage, character, TARGET_SIZE);

    return loop;
}

function prepareContainer(container: Node) {
    const prevent = (event: Event) => { event.preventDefault() };

    container.addEventListener('scroll', prevent);
    container.addEventListener('touchmove', prevent);
}

async function main() {
    const INITIAL_SCREEN_SIZE = getScreenSize(TARGET_SIZE);

    const assetLoaders = {
        image: new ImageAssetLoader()
    };

    const renderer = new Renderer({
        size           : Vec2.clone(INITIAL_SCREEN_SIZE),
        resolution     : TARGET_SIZE,
        backgroundColor: 'black',
        enableSmoothing: true
    });
    const keyboard = new KeyboardInput();
    const pointer = new PointerInput();

    document.body.appendChild(renderer.getCanvas());

    const gameLoop = await createGameLoop(assetLoaders.image, renderer, keyboard, pointer);
    gameLoop.start();
}

waitForDocumentLoad()
    .then(() => prepareContainer(window.document))
    .then(() => delay(Milliseconds.from(1000)))
    .then(main);