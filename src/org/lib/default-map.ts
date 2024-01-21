export class DefaultMap<K, V> extends Map<K, V> {
  constructor(provider: (key: K) => V);
  constructor(provider: (key: K) => V, init?: [K, V][]);
  constructor(private provider: (key: K) => V, init?: [K, V][]) {
    super(init);
  }
  get(key: K) {
    let v = super.get(key);
    if (!v) {
      v = this.provider(key);
      super.set(key, v);
    }
    return v;
  }
}
