export interface AssetLoader<T> {
    get(assetName: string): Promise<T>;
}