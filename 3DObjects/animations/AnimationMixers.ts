import { AnimationMixer, AnimationAction, Object3D, AnimationClip} from "three";

export class AnimationMixers extends AnimationMixer {
    private _action: AnimationAction | null;
    private _clip: AnimationClip | null;
    private _model: Object3D;

    constructor(model: Object3D) {
        super(model);
        this._model = model;
        this._action = null;
        this._clip = null;
    }

    public play(): void {
        this._action?.play();
    }

    public setClip(clipName: string): void {
        this._clip = this._model.animations.find((clip) => clip.name === clipName) as AnimationClip;
        this._action = this.clipAction(this._clip);
    }

}