export class EntityPool {
    private entityIndices: {[key: string]: number} = Object.create(null);
    private entities: string[] = [];
    private firstUnusedIndex: number = 0;

    private has(entity: string) {
        return (entity in this.entityIndices);
    }

    public isUsed(entity: string) {
        return this.entityIndices[entity] < this.firstUnusedIndex;
    }

    public isFree(entity: string) {
        return this.entityIndices[entity] >= this.firstUnusedIndex;
    }

    private swap(indexA: number, indexB: number) {
        const a = this.entities[indexA];
        const b = this.entities[indexB];

        this.entities[indexA] = b;
        this.entities[indexB] = a;

        this.entityIndices[a] = indexB;
        this.entityIndices[b] = indexA;
    }

    private addNewUsed(entity: string) {
        this.entityIndices[entity] = this.entities.push(entity) - 1;
        this.swap(this.entities.length - 1, this.firstUnusedIndex);
        this.firstUnusedIndex += 1;
    }

    private makeUsed(entity: string) {
        this.swap(this.entityIndices[entity], this.firstUnusedIndex);
        this.firstUnusedIndex += 1;
    }

    private makeUnused(entity: string) {
        this.swap(this.entityIndices[entity], this.firstUnusedIndex - 1);
        this.firstUnusedIndex -= 1;
    }

    addUsedEntity(entity: string) {
        this.addNewUsed(entity);
    }

    getEntity() {
        if (this.firstUnusedIndex < this.entities.length) {
            const result = this.entities[this.firstUnusedIndex];
            this.makeUsed(result);
            return result;
        }
        return null;
    }

    freeEntity(entity: string) {
        this.makeUnused(entity);
    }

    tryFreeEntity(entity: string) {
        if (this.isUsed(entity)) {
            this.freeEntity(entity);
        }
    }

    hasEntity(entity: string) {
        return this.has(entity);
    }
}