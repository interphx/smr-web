import { ComponentClass } from './component';

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