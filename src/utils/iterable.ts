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

export function copyArray<T>(source: ReadonlyArray<T>, destination: T[]) {
    const sourceLength = source.length,
          destinationLength = destination.length,
          minLength = Math.min(sourceLength, destinationLength);
    
    let i = 0;
    
    for (i = 0; i < minLength; ++i) {
        destination[i] = source[i];
    }

    while (i < sourceLength) {
        destination.push(source[i]);
        i += 1;
    }

    if (destinationLength !== sourceLength) {
        destination.length = source.length;
    }

    return destination;
}