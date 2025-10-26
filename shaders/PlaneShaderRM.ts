import { Clock, Color, DirectionalLight, MathUtils, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from "three";

export class PlaneShaderRM extends Mesh {
    private _camera: PerspectiveCamera;
    private _light: DirectionalLight;
    private _time: number;
    private _lastTime: number;
    private _cameraForwardPos: Vector3;
    private _vectorZero: Vector3;
    private _clickIntensity: number;
    private _isMobile: boolean = false;
    private _scrollTarget: number;
    private _scrollSize: number;

    constructor(vertex: string, fragment: string, camera: PerspectiveCamera, light: DirectionalLight) {
        const geometry = new PlaneGeometry();
        const material = new ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            uniforms: {
                u_eps: { value: 0.01 },
                u_maxDis: { value: 1000 },
                u_maxSteps: { value: 50 },

                u_clearColor: { value: new Color(0x000000) },
                u_camPos: { value: camera.position },
                u_camToWorldMat: { value: camera.matrixWorld },
                u_camInvProjMat: { value: camera.projectionMatrixInverse },

                u_lightDir: { value: light.position },
                u_lightColor: { value: light.color },

                u_diffIntensity: { value: 0.3 },
                u_specIntensity: { value: 1 },
                u_ambientIntensity: { value: 0.625 },
                u_shininess: { value: 12 },

                u_time: { value: 0 },
                u_mouse: { value: new Vector2(0.5, 0.5) },
                u_mousePressed: { value: 0 },
                u_clickIntensity: { value: 0 },

                u_isMobile: { value: false },
                u_size: { value: 1 }
            }
        })
        super(geometry, material);

        this._camera = camera;
        this._light = light;

        this._time = Date.now();
        this._lastTime = Date.now();
        this._cameraForwardPos = new Vector3(0, 0, -1);
        this._vectorZero = new Vector3(0,0,0)
        this._clickIntensity = 0;
        this._scrollTarget = 1;
        this._scrollSize = 1;

        const nearPlaneWidth = camera.near * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 2;
        const nearPlaneHeight = nearPlaneWidth / camera.aspect;
        this.scale.set(nearPlaneWidth, nearPlaneHeight, 1);

        this._addCallbacks();
        this._updateIsMobile();
    }

    private _addCallbacks() {
        window.addEventListener('scroll', this._onScroll);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('mousedown', this._onMouseDown);
    }

    private _onMouseMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / innerHeight;
        if ((this.material as ShaderMaterial).uniforms) {
            (this.material as ShaderMaterial).uniforms.u_mouse.value.set(x, y);
        }
    }

    private _onMouseDown = (e: MouseEvent) => {
        if (e.button === 0 && (this.material as ShaderMaterial).uniforms) {
            (this.material as ShaderMaterial).uniforms.u_mousePressed.value = 1.;
        }
    }

    private _onMouseUp = (e: MouseEvent) => {
        if (e.button === 0 && (this.material as ShaderMaterial).uniforms) {
            (this.material as ShaderMaterial).uniforms.u_mousePressed.value = 0.;
        }
    }

    private _onScroll = () => {
        const scrollY = window.scrollY;
        const fadeStart = 0;
        const fadeEnd = 700;
        const t = Math.min(Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0), 1);
        this._scrollTarget = 1 - t;
    }

    private _checkIfMobile(): boolean {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        return isTouch || isSmallScreen;
    }

    private _updateIsMobile() {
        this._isMobile = this._checkIfMobile();
        if ((this.material as ShaderMaterial).uniforms) {
            (this.material as ShaderMaterial).uniforms.u_isMobile.value = this._isMobile;
        }
    }

    public onResize() {
        const nearPlaneWidth = this._camera.near * Math.tan(MathUtils.degToRad(this._camera.fov / 2)) * this._camera.aspect * 2;
        const nearPlaneHeight = nearPlaneWidth / this._camera.aspect;
        this.scale.set(nearPlaneWidth, nearPlaneHeight, 1);
        this._updateIsMobile();
    }

    public animate() {
        const now = Date.now();
        const dt = (now - this._lastTime) / 1000; // dt en secondes (ex: 0.016)
        this._lastTime = now;

        this._cameraForwardPos = this._camera.position.clone().add(this._camera.getWorldDirection(this._vectorZero).multiplyScalar(this._camera.near));
        this.position.copy(this._cameraForwardPos);
        this.rotation.copy(this._camera.rotation);

        this._scrollSize += (this._scrollTarget - this._scrollSize) * 1 * dt;

        if ((this.material as ShaderMaterial).uniforms) {
            const target = (this.material as ShaderMaterial).uniforms.u_mousePressed.value;
            this._clickIntensity += (target - this._clickIntensity) * 3 * dt;
            (this.material as ShaderMaterial).uniforms.u_clickIntensity.value = this._clickIntensity;
            (this.material as ShaderMaterial).uniforms.u_time.value =(Date.now() - this._time) / 1000;
            (this.material as ShaderMaterial).uniforms.u_size.value = this._scrollSize;
        }
    }

    public setBackgroundColor(color: Color) {
        if ((this.material as ShaderMaterial).uniforms) {
            (this.material as ShaderMaterial).uniforms.u_clearColor.value = color;
        }
    }
}