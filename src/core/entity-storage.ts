import { ComponentStorage } from './component-storage';
import { hasProperty } from 'utils/object';

type ComponentClass = 
    (new (...args: any[]) => any) &
    {
        componentName: string;
    };

type ComponentInstance<T extends ComponentClass> =
    InstanceType<T> &
    { constructor: ComponentClass };

export class EntityStorage {
    lastEntityId: number = Number.MIN_SAFE_INTEGER;
    storages: {[componentName: string]: ComponentStorage<any>} = Object.create(null);
    entities: {[entityId: string]: boolean | undefined} = Object.create(null);

    registerComponentType<T extends ComponentClass>(componentType: T) {
        this.storages[componentType.componentName] = new ComponentStorage<T>();
    }

    createEntity() {
        this.lastEntityId += 1;
        const entityId = this.lastEntityId.toString();
        this.entities[entityId] = true;
        return entityId;
    }

    removeEntity(entityId: string) {
        for (let key in this.storages) {
            if (!hasProperty(this.storages, key)) continue;
            this.storages[key].remove(entityId);
        }
        delete this.entities[entityId];
    }

    setComponent<T extends ComponentClass>(entityId: string, component: InstanceType<T>) {
        this.storages[(component.constructor as ComponentClass).componentName].set(entityId, component);
    }

    getComponent<T extends ComponentClass>(entityId: string, componentType: T): ComponentInstance<T> {
        return this.storages[componentType.componentName].get(entityId);
    }

    hasComponent<T extends ComponentClass>(entityId: string, componentType: T) {
        return this.storages[componentType.componentName].has(entityId);
    }

    private tmpComponents: any[] = [undefined, undefined, undefined, undefined, undefined];
    getComponents<
        T0 extends ComponentClass
    >(entityId: string, componentTypes: [T0]): [ComponentInstance<T0>];
    getComponents<
        T0 extends ComponentClass,
        T1 extends ComponentClass
    >(entityId: string, componentTypes: [T0, T1]): [ComponentInstance<T0>, ComponentInstance<T1>];
    getComponents<
        T0 extends ComponentClass,
        T1 extends ComponentClass,
        T2 extends ComponentClass
    >(entityId: string, componentTypes: [T0, T1, T2]): [ComponentInstance<T0>, ComponentInstance<T1>, ComponentInstance<T2>];
    getComponents<
        T0 extends ComponentClass,
        T1 extends ComponentClass,
        T2 extends ComponentClass,
        T3 extends ComponentClass
    >(entityId: string, componentTypes: [T0, T1, T2, T3]): [ComponentInstance<T0>, ComponentInstance<T1>, ComponentInstance<T2>, ComponentInstance<T3>];
    getComponents<
        T0 extends ComponentClass,
        T1 extends ComponentClass,
        T2 extends ComponentClass,
        T3 extends ComponentClass,
        T4 extends ComponentClass
    >(entityId: string, componentTypes: [T0, T1, T2, T3, T4]): [ComponentInstance<T0>, ComponentInstance<T1>, ComponentInstance<T2>, ComponentInstance<T3>, ComponentInstance<T4>];
    getComponents<
        T0 extends ComponentClass,
        T1 extends ComponentClass,
        T2 extends ComponentClass,
        T3 extends ComponentClass,
        T4 extends ComponentClass
    >(entityId: string, componentTypes: [T0] | [T0, T1] | [T0, T1, T2] | [T0, T1, T2, T3] | [T0, T1, T2, T3, T4]) {
        for (let i = 0, len = componentTypes.length; i < len; ++i) {
            this.tmpComponents[i] = this.storages[componentTypes[i].componentName].get(entityId);
        }
        return this.tmpComponents;
    }

    private tmpEntities: string[] = [];
    getEntitiesWith<T extends ReadonlyArray<ComponentClass>>(componentTypes: T) {
        this.tmpEntities.length = 0;
        for (let entityId in this.entities) {
            if (!hasProperty(this.entities, entityId)) continue;
            let isValid = true;
            for (let componentType of componentTypes) {
                if (!this.hasComponent(entityId, componentType)) {
                    isValid = false;
                    break;
                }
            }
            if (isValid) {
                this.tmpEntities.push(entityId);
            }
        }
        return this.tmpEntities.slice();
    }
}