type Factory<T> = () => T;

export class Container {
  private readonly bindings = new Map<string, unknown>();

  bind<T>(token: string, factory: Factory<T>): void {
    if (!this.bindings.has(token)) {
      this.bindings.set(token, factory());
    }
  }

  resolve<T>(token: string): T {
    const instance = this.bindings.get(token);

    if (!instance) {
      throw new Error(`No binding found for token: ${token}`);
    }

    return instance as T;
  }
}

export const container = new Container();
