import { Scene, PerspectiveCamera, WebGLRenderer, ACESFilmicToneMapping } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class World {
    private _canvas: HTMLCanvasElement;
    private _scene: Scene;
    private _camera: PerspectiveCamera;
    private _controls: OrbitControls;
    private _renderer: WebGLRenderer;
    private _aspect: number;
    private _onResizeCallback?: () => void;
    private _onAnimateCallback?: () => void;
    private _isVisible: boolean;
    private _observer: IntersectionObserver | null;
    private _lastHeight: number;
    private _lastWidth: number;
    private _height: number;
    private _width: number;
    private _isFullScreen: boolean;

    constructor(canvas: HTMLCanvasElement, height?: number, width?: number) {
        this._canvas = canvas;
        this._scene = new Scene();
        this._renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
        this._height = height ? height : window.innerHeight;
        this._width = width ? width : window.innerWidth;
        this._isFullScreen = height ? false : true;
        this._init_renderer();
        this._aspect = this._width / this._height;
        this._camera = new PerspectiveCamera(75, this._aspect, 0.1, 10);
        this._init_camera();
        this._isVisible = false;
        this._observer = null;
        this._observable();
        this._lastHeight = window.innerHeight;
        this._lastWidth = window.innerWidth;
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);

        this._addCallBack();
    }

    private _observable() {
        this._observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                this._isVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });

        this._observer.observe(this._canvas);
    }

    private _init_renderer() {
        this._renderer.setSize(this._width, this._height);
        this._renderer.setPixelRatio(1.5);
        this._renderer.setClearColor(0xB6D7F5, 1);
        this._renderer.toneMapping = ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
    }

    private _init_camera() {
        this._camera.position.z = 5;
    }

    private _addCallBack() {
        window.addEventListener('resize', this.onResize);
    }

    public onResize = () => {
        if (Math.abs(window.innerHeight - this._lastHeight) > 75 || window.innerWidth != this._lastWidth) {
            if (this._onResizeCallback) {
                this._onResizeCallback();
            }
            if (this._isFullScreen) {
                this._width = window.innerWidth;
                this._height = window.innerHeight;
            }
            this._aspect = this._width / this._height;
            this._camera.aspect = this._aspect;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(this._width, this._height);
            this._lastHeight = window.innerHeight;
            this._lastWidth = window.innerWidth;
        }
    }

    public setOnResize(callback: () => void) {
        this._onResizeCallback = callback;
    }

    public setOnAnimate(callback: () => void) {
        this._onAnimateCallback = callback;
    }

    public animate = () => {
        requestAnimationFrame(this.animate);
        if (this._onAnimateCallback) {
            this._onAnimateCallback();
        }
        if (this._isVisible) {
            this._aspect = this._width / this._height;
            this._camera.aspect = this._aspect;
            this._camera.updateProjectionMatrix();
            this._renderer.render(this._scene, this._camera);
            if (this._controls)
                this._controls.update();
        }
    }

    public setHeight(height: number) {
        this._height = height;
    }

    public setWidth(width: number) {
        this._width = width;
    }

    public get getCanvas() { return this._canvas; }
    public get getScene() { return this._scene; }
    public get getCamera() { return this._camera; }
    public get getRenderer() { return this._renderer; }
    public get getAspect() { return this._aspect; }

}