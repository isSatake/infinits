export class AutoKeyMap<K, V> extends Map<K, V> {
  constructor(keyProvider: () => K);
  constructor(keyProvider: () => K, init?: [K, V][]);
  constructor(private keyProvider: () => K, init?: [K, V][]) {
    super(init);
  }
  add(value: V) {
    const key = this.keyProvider();
    this.set(key, value);
    return key;
  }
}
