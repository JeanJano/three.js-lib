import { BufferGeometry, Group, Material, Mesh } from "three";

export class OrbitalGroup extends Group {
    private _geometry: BufferGeometry;
    private _material: Material;
    private _numMeshes: number;
    private _radius: number;
    private _rotationSpeed: number;
    private _rotationRange: number;
    private _targetRotX: number;
    private _targetRotY: number;
    private _lastTime: DOMHighResTimeStamp;

    constructor(geo: BufferGeometry, mat: Material) {
        super();
        this._geometry = geo;
        this._material = mat;
        this._numMeshes = 8;
        this._radius = 3;
        this._rotationSpeed = 0.004;
        this._rotationRange = Math.PI / 42;
        this._targetRotX = 0;
        this._targetRotY = 0;
        this._lastTime = performance.now();

        this._create();
        this._removeCallbacks();
        this._addCallbacks();
    }

    private _addCallbacks() {
        addEventListener('mousemove', this._mousemove);
    }

    private _removeCallbacks() {
        removeEventListener('mousemove', this._mousemove);
    }

    private _create(): void {
        for (let i = 0; i < this._numMeshes; i++) {
            const angle = (i / this._numMeshes) * Math.PI * 2;
            const x = Math.cos(angle) * this._radius;
            const y = Math.sin(angle) * this._radius;

            const mesh = new Mesh(this._geometry, this._material.clone());
            mesh.position.set(x, y, -4);
            this.add(mesh);
        }
    }

    private _mousemove = (e: MouseEvent) => {
        const xNorm = (e.clientX / window.innerWidth) * 2 - 1;
        const yNorm = (e.clientY / window.innerHeight) * 2 - 1;

        this._targetRotX = -yNorm * this._rotationRange;
        this._targetRotY = -xNorm * this._rotationRange;
    }

    public animate() {
        const now = performance.now();
        const dt = (now - this._lastTime) / 1000;
        this._lastTime = now;

        this.children.forEach((child) => {
            child.rotation.x += this._rotationSpeed * dt * 60;
            child.rotation.y += this._rotationSpeed * dt * 60;
        });

        this.rotation.z += 0.002 * dt * 60;
        this.rotation.x += (this._targetRotX - this.rotation.x) * 0.1;
        this.rotation.y += (this._targetRotY - this.rotation.y) * 0.1;
    }


}