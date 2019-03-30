import { ComponentClass, ComponentInstance } from './component';
import { StaticSprite } from 'components/static-sprite';
import { FrameAnimation } from 'components/frame-animation';

function calculateHash(components: ReadonlyArray<ComponentClass>) {
    const names: string[] = [];
    for (let componentClass of components) {
        names.push(componentClass.componentName);
    }
    return names.join('&');
}

export function all<T extends ComponentClass[]>(...args: T) {
    return {
        hash: calculateHash(args),
        includedComponents: args
    };
}