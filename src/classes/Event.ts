import { ClientEvents } from 'discord.js';

export class Event<T extends keyof ClientEvents = keyof ClientEvents> {
    #event: T;
    #once: boolean;
    #fn: (...args: ClientEvents[T]) => Promise<void | unknown>;
    constructor(event: T, options: { once?: boolean; fn: (...args: ClientEvents[T]) => Promise<void | unknown> }) {
        this.#event = event;
        this.#once = options?.once ?? false;
        this.#fn = options.fn;
    }

    public get event(): T {
        return this.#event;
    }
    public get once(): boolean {
        return this.#once;
    }
    public get fn(): (...args: ClientEvents[T]) => Promise<void | unknown> {
        return this.#fn;
    }
}
