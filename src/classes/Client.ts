import { type ClientOptions as DjsClientOptions, Collection, Client as DjsClient, Routes, User } from 'discord.js';
import { glob } from 'glob';
import type { Event } from './Event.js';
import { type Command } from './Command.js';
import 'dotenv/config';
import Logger from './logger.js';

export interface ClientOptions extends DjsClientOptions {
    /**Application Name */
    name: string;
    /**
     * Console Color
     *
     * Should follow this format \x1b[38;2;RED;GREEN;BLUEm
     *
     * RED, GREEN and BLUE should be 0 - 255
     */
    color: string;
    /** Hex Color for embeds, formatted as 0xHEXCODE */
    embedColor: number;
}

export class Client extends DjsClient {
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();
    public prefixCommands: Collection<string, Command> = new Collection();
    public slashCommands: Collection<string, Command> = new Collection();
    public userContextCommands: Collection<string, Command> = new Collection();
    public messageContextCommands: Collection<string, Command> = new Collection();

    public name = '';
    public color = '';
    public embedColor = 0x000000;

    constructor(options: ClientOptions) {
        super(options);
        this.name = options.name;
        this.color = options.color;
        this.embedColor = options.embedColor;
    }

    public logger = new Logger(this.name, this.color);
    /**Console logs data with a blue time code */
    public log = this.logger.log;
    /**Console logs data with a red time code */
    public error = this.logger.error;

    public isBotOwner(member: User): boolean {
        return member.id === this.application?.owner?.id;
    }

    public async registerEvents(): Promise<this> {
        for (const eventPath of (await glob(process.env.EVENTS_PATH, { platform: 'linux' })).toString().replaceAll('dist', '..').split(',')) {
            try {
                const event: Event = (await import(eventPath)).default;
                if (event.once) this.once(event.event, (...args) => event.fn(...args));
                else this.on(event.event, (...args) => event.fn(...args));
            } catch (err: Error | unknown) {
                this.error(eventPath, err);
            }
        }
        this.log('Events Registered.');
        return this;
    }
    public async registerCommands(servers: Array<string>): Promise<this> {
        const commands: Array<Command['applicationData']> = [];
        for (const cmdPath of (await glob(process.env.COMMANDS_PATH, { platform: 'linux' })).toString().replaceAll('dist', '..').split(',')) {
            try {
                const command: Command = (await import(cmdPath)).default as Command;
                this.cooldowns.set(command.name, new Collection());
                if (command.prefixCommand) this.prefixCommands.set(command.name, command);
                if (command.aliases && command.prefixCommand) for (const alias of command.aliases) this.prefixCommands.set(alias, command);
                if (command.slashCommand) commands.push(command.applicationData as never), this.slashCommands.set(command.name, command);
                if (command.contextUserCommand) commands.push(command.contextUserData as never), this.userContextCommands.set(command.name, command);
                if (command.contextMessageCommand) commands.push(command.contextMessageData as never), this.messageContextCommands.set(command.name, command);
            } catch (err: Error | unknown) {
                this.error(cmdPath, err);
            }
        }
        for (const server of servers) {
            if (!this.user) throw new Error(`ClientUser is invalid \n ${this}`);
            if (server === 'global') this.rest.put(Routes.applicationCommands(this.user.id), { body: commands }).catch((err) => this.error(err, server));
            else this.rest.put(Routes.applicationGuildCommands(this.user.id, server), { body: commands }).catch((err) => this.error(err, server));
        }
        this.log('Commands Registered.');
        return this;
    }
}
