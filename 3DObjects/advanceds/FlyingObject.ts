import { Matrix4, Object3D, Quaternion, Vector3 } from "three";

export class FlyingObject extends Object3D {
    private _velocity: Vector3;
    private _direction: Vector3;
    private _speed: number;
    private _quaternion: Quaternion;
    private _matrix: Matrix4;
    private _vecX: Vector3;
    private _vecZ: Vector3;

    constructor(target: Object3D) {
        super();
        this._speed = 1;
        this._velocity = new Vector3();
        this._direction = new Vector3(0, 0, 1);

        this._quaternion = new Quaternion();
        this._matrix = new Matrix4();
        this._vecX = new Vector3(0, 0, 0);
        this._vecZ = new Vector3(0, 1, 0);

        this.add(target);
    }

    private _orientToDirection(): void {
        if (this._direction.lengthSq() > 0) {
            this._matrix.lookAt(
                this._vecX,
                this._direction,
                this._vecZ
            );
            this._quaternion.setFromRotationMatrix(this._matrix);

            this.quaternion.copy(this._quaternion);
        }
    }

    private _updateVelocity(): void {
        this._velocity.copy(this._direction).multiplyScalar(this._speed);
    }

    public setDirection(direction: Vector3): void {
        this._direction.copy(direction).normalize();
        this._updateVelocity();
    }

    public setSpeed(speed: number): void {
        this._speed = speed;
        this._updateVelocity();
    }

    public animate(delta: number): void {
        this.position.addScaledVector(this._velocity, delta);
        this._orientToDirection();
    }

}
