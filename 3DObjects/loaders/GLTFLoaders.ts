import { Object3D } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GLTFLoaders extends Object3D {
    private _gltfLoader: GLTFLoader;
    private _modelName: string;

    constructor(src: string) {
        super();
        this._modelName = src;
        this._gltfLoader = new GLTFLoader();
        this._setLoader();
    }

    static async create(src: string): Promise<GLTFLoaders> {
        const loader = new GLTFLoaders(src);
        await loader._load();
        return loader;
    }
    
    private _setLoader(): void {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        this._gltfLoader.setDRACOLoader(dracoLoader);
    }

    private _load(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._gltfLoader.load(
                this._modelName,
                (gltf: GLTF) => {
                    const model = gltf.scene;
                    this.add(model);
                    this.animations = gltf.animations;
                    resolve();
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

}