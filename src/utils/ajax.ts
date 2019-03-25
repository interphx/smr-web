import { Image } from 'types/image';

export function loadImage(src: string) {
    return new Promise<Image>((resolve, reject) => {
        const image = new Image();

        const tmp: number[] = [0, 0, 0];
        const processRgb =
            (src.indexOf('background') >= 0)
                ? (r: number, g: number, b: number) => {
                    tmp[0] = Math.max(0, r - 40);
                    tmp[1] = Math.max(0, g - 40);
                    tmp[2] = Math.max(0, b - 40);
                    return tmp;
                }
                : (r: number, g: number, b: number) => {
                    tmp[0] = r;
                    tmp[1] = g;
                    tmp[2] = b;
                    return tmp;
                }

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d')!;
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = data[i + 0];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r === 255 && g === 0 && b === 255) {
                    data[i + 3] = 0;
                } else {
                    [data[i + 0], data[i + 1], data[i + 2]] = processRgb(r, g, b);
                }
            }
            context.putImageData(imageData, 0, 0);
            resolve(canvas);
        };
        image.onerror = err => reject(err);

        image.src = src;
    });
}

export function waitForDocumentLoad() {
    const isLoaded = /^loaded|^i|^c/.test(document.readyState);
  
    return new Promise(function(resolve) {
        if (isLoaded) return resolve();

        function onReady () {
            resolve();
            document.removeEventListener('DOMContentLoaded', onReady);
            window.removeEventListener('load', onReady);
        }

        document.addEventListener('DOMContentLoaded', onReady);
        window.addEventListener('load', onReady);
    });
  }