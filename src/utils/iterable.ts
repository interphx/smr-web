export function range(from: number, to: number, step: number = Math.sign(to - from) || 1) {
    const result: number[] = [];
    for (let i = from; i < to; i += step) {
        result.push(i);
    }
    return result;
}

export function randomPick<T>(values: ReadonlyArray<T>) {
    return values[Math.floor(Math.random() * values.length)];
}