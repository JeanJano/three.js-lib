export class PoolObject<T> {
    private _available: T[];
    private _factory: () => T;

    constructor(factory: () => T) {
        this._available = [];
        this._factory = factory;
    }

    public get(): T {
        if (this._available.length > 0) {
            console.log("get available");
            return this._available.pop()!;
        }
        console.log("get new")
        return this._factory();
    }

    public release(obj: T): void {
        console.log("release");
        this._available.push(obj);
    }
}