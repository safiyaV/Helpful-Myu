import type { Client } from '../classes/Client';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            APP_NAME: string;
            APP_COLOR: string;
            COMMANDS_PATH: string;
            EMBED_COLOR: string;
            EVENTS_PATH: string;
            TOKEN: string;
            WEB_PORT: string;
        }
    }
}
