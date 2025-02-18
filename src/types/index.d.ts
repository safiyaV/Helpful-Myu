import type { Client } from '../classes/Client';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            COMMANDS_PATH: string;
            EVENTS_PATH: string;
            TOKEN: string;
            WEB_PORT: string;
        }
    }
}
