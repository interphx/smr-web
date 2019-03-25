import { hasProperty } from 'utils/object';

export class ComponentStorage<T extends (new (...args: any[]) => any)> {
    private components: {[entityId: string]: T} = Object.create(null);

    get(entityId: string) {
        return this.components[entityId];
    }

    has(entityId: string) {
        return hasProperty(this.components, entityId);
    }

    set(entityId: string, component: InstanceType<T>) {
        this.components[entityId] = component;
    }

    remove(entityId: string) {
        if (this.components[entityId]) {
            delete this.components[entityId];
        }
    }
}