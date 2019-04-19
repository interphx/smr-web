import { ImageAssetLoader } from 'core/image-asset-loader';
import { Renderer } from 'core/renderer';
import { KeyboardInput } from 'input/keyboard';
import { PointerInput } from 'input/pointer';
import { GameScreenFSM } from 'screens/game-screen-fsm';
import { GameplayGameScreen } from 'screens/gameplay';
import { MenuGameScreen } from 'screens/menu';
import { Milliseconds } from 'types/milliseconds';
import { Vec2 } from 'types/vec2';
import { waitForDocumentLoad } from 'utils/ajax';
import { delay } from 'utils/async';

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

function createContainer(size: Vec2) {
    const container = document.createElement('div');
    container.style.width = `${size.x}px`;
    container.style.height = `${size.y}px`;
    container.style.margin = `0 auto`;
    container.style.position = `relative`;
    return container;    
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
    const container = createContainer(Vec2.clone(INITIAL_SCREEN_SIZE));

    document.body.appendChild(container);

    const setScreen = (screenName: 'menu' | 'gameplay') => { screenFsm.transitionTo(screenName) };
    const menuScreen = new MenuGameScreen(
        setScreen,
        assetLoaders.image,
        container
    );
    const gameplayScreen = new GameplayGameScreen(
        setScreen,
        renderer,
        keyboard,
        pointer,
        assetLoaders.image,
        container
    );
    const screens = {
        'menu': menuScreen,
        'gameplay': gameplayScreen
    };

    const screenFsm = new GameScreenFSM(screens);
    screenFsm.transitionTo('menu');
}

waitForDocumentLoad()
    .then(() => prepareContainer(window.document))
    .then(() => delay(Milliseconds.from(1000)))
    .then(main);