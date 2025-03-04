import { type ClientOptions, Collection, Client as DjsClient, GuildMember, Routes, Team, User } from 'discord.js';
import { glob } from 'glob';
import type { Event } from './Event.js';
import { type Command } from './Command.js';
import 'dotenv/config';
import Logger from './logger.js';

export class Client extends DjsClient {
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();
    public allCommands: Collection<string, Command> = new Collection();
    public prefixCommands: Collection<string, Command> = new Collection();
    public slashCommands: Collection<string, Command> = new Collection();
    public userContextCommands: Collection<string, Command> = new Collection();
    public messageContextCommands: Collection<string, Command> = new Collection();

    public embedColor = 0x000000;
    public log;
    public error;

    constructor(options: ClientOptions) {
        super(options);
        this.embedColor = +process.env.EMBED_COLOR;
        const logger = new Logger(process.env.APP_NAME, process.env.APP_COLOR);
        this.log = logger.log;
        this.error = logger.error;
    }

    public async isBotOwner(member: User): Promise<boolean> {
        const application = await this.application?.fetch();
        if (!application || !application.owner) return false;
        const owner = application.owner;
        if (owner instanceof Team) {
            return owner.members.has(member.id);
        } else {
            return member.id === owner.id;
        }
    }

    public async registerEvents(): Promise<this> {
        for (const eventPath of (await glob(process.env.EVENTS_PATH, { platform: 'linux' }))
            .toString()
            .replaceAll(/dist|prod/g, '..')
            .split(',')) {
            this.log(`Registering event ${eventPath.replace('../events/', '')}`);
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
        for (const cmdPath of (await glob(process.env.COMMANDS_PATH, { platform: 'linux' }))
            .toString()
            .replaceAll(/dist|prod/g, '..')
            .split(',')) {
            this.log(`Registering command ${cmdPath.replace('../commands/', '')}`);
            try {
                const command: Command = (await import(cmdPath)).default as Command;
                if (!command?.name) continue;
                this.cooldowns.set(command.name, new Collection());
                this.allCommands.set(command.name, command);
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
    public async deleteAllCommands(servers: Array<string>): Promise<this> {
        for (const server of servers) {
            if (!this.user) throw new Error(`ClientUser is invalid \n ${this}`);
            if (server === 'global') this.rest.put(Routes.applicationCommands(this.user.id), { body: [] }).catch((err) => this.error(err, server));
            else this.rest.put(Routes.applicationGuildCommands(this.user.id, server), { body: [] }).catch((err) => this.error(err, server));
        }
        this.log('Commands Deleted.');
        return this;
    }
    public formatMessage(user: GuildMember, message: string) {
        message = message.replaceAll('{user}', `<@${user.id}>`);
        message = message.replaceAll('{user.avatar}', `${user.displayAvatarURL({ size: 1024 })}`);
        message = message.replaceAll('{user.banner}', `${user.displayBannerURL({ size: 1024 })}`);
        message = message.replaceAll('{user.id}', user.id);
        message = message.replaceAll('{guild.name}', `${user.guild.name}`);
        message = message.replaceAll('{guild.id}', `${user.guild.id}`);
        message = message.replaceAll('{guild.icon}', `<@${user.guild.iconURL({ size: 1024 })}>`);
        return message;
    }
}
