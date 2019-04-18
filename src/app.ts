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
import { GameScreenFSM } from 'screens/game-screen-fsm';
import { MenuGameScreen } from 'screens/menu-game-screen';
import { GameplayGameScreen } from 'screens/gameplay-game-screen';

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

    const menuScreen = new MenuGameScreen();
    const gameplayScreen = new GameplayGameScreen(
        (screenName) => {},
        renderer,
        keyboard,
        pointer,
        assetLoaders.image
    );

    const screenFsm = new GameScreenFSM({
        'menu': menuScreen,
        'gameplay': gameplayScreen
    }, 'gameplay');

    gameplayScreen.start();
}

waitForDocumentLoad()
    .then(() => prepareContainer(window.document))
    .then(() => delay(Milliseconds.from(1000)))
    .then(main);