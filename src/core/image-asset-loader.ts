import { Image } from 'types/image';
import { AssetLoader } from './asset-loader';
import { loadImage } from 'utils/ajax';
import { identity } from 'utils/functional';

type PathResolver = (assetName: string) => string;

export class ImageAssetLoader implements AssetLoader<Image> {
    private pathResolver:PathResolver;
    private cache: { [assetName: string]: Image };

    constructor(pathResolver: PathResolver = identity) {
        this.pathResolver = pathResolver;
        this.cache = Object.create(null);
    }

    async get(assetName: string): Promise<Image> {
        if (!(assetName in this.cache)) {
            this.cache[assetName] = await loadImage(this.pathResolver(assetName));
        }
        return Promise.resolve(this.cache[assetName]);
    }
}