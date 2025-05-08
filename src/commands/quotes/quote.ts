import { Command } from '../../classes/Command.js';
import { MessageFlags, ApplicationCommandOptionType } from 'discord.js';
import * as Enums from 'discord-api-types/v10';
import * as Builders from '@discordjs/builders';
import { getQuote, getQuotes } from '../../handlers/database.js';
import { WithId } from 'mongodb';
import { Quote } from 'src/types/database.type.js';
import { client } from '../../index.js';

export default new Command({
    name: 'quote',
    description: 'Creates a quote.',
    disabled: false,
    category: 'quote',
    deferReply: true,
    dm_permission: false,
    hidden: false,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'query',
            description: 'Search a keyword or an ID',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the response',
        },
    ],
    aliases: ['q'],
    async slashCommand({ interaction, options }) {
        if (!interaction.guildId) return;
        const keyword = options.getString('query', true).toLowerCase().replace(' ', '_');
        let quotes = [await getQuote(interaction.guildId, keyword)];
        if (!quotes[0]) quotes = (await getQuotes(interaction.guildId, keyword)) as [];
        if (!quotes[0]) return interaction.editReply('This query has no quotes, senpai~');
        const chosen = choose(quotes as [WithId<Quote>]);
        if (!chosen) return interaction.editReply('This query has no quotes, senpai~');
        interaction.editReply({
            components: [await makeContainer(chosen)],
            flags: MessageFlags.IsComponentsV2,
            files: [],
        });
    },
    async prefixCommand({ message, args }) {
        if (!message.guildId) return;
        if (!args[0]) return message.reply('You nyeed a query, desu~');
        let quotes = [await getQuote(message.guildId, args[0])];
        if (!quotes[0]) quotes = (await getQuotes(message.guildId, args[0])) as [];
        if (!quotes[0]) return message.reply('This query has no quotes, senpai~');
        const chosen = choose(quotes as [WithId<Quote>]);
        if (!chosen) return message.reply('This query has no quotes, senpai~');
        message.reply({
            components: [await makeContainer(chosen)],
            flags: MessageFlags.IsComponentsV2,
            files: [],
        });
    },
});

let count = 0;
function choose(quotes: [WithId<Quote>]) {
    if (!quotes || count > 1000) return undefined;
    count++;
    const chosen = quotes[Math.floor(Math.random() * quotes.length)] as WithId<Quote>;
    if (chosen.deleted) return choose(quotes);
    return chosen;
}

async function makeContainer(quote: WithId<Quote>): Promise<Builders.ContainerBuilder> {
    const container = new Builders.ContainerBuilder()
        .addTextDisplayComponents(new Builders.TextDisplayBuilder().setContent(`## ${quote.id}`))
        .addSeparatorComponents(new Builders.SeparatorBuilder().setSpacing(Enums.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new Builders.TextDisplayBuilder().setContent(quote.content))
        .setAccentColor(client.embedColor);
    const contents: Array<string> = quote.content.split(/[\n\r\s]+/);
    for (const content of contents) {
        const images: Array<string> = [];
        if (content.startsWith('https://tenor.com/view/')) {
            const gif = (await fetch(`${content}.gif`, { redirect: 'follow' }).catch((err: Error) => {})) as Response;
            images.push(`https://c.tenor.com/${gif.url.split('/')[4]}/tenor.gif`);
        } else if (content.startsWith('https://cdn.discordapp.com')) {
            images.push(content);
        }
        if (images.length > 0) {
            const items = images.map((image) => new Builders.MediaGalleryItemBuilder().setURL(image));
            container.addMediaGalleryComponents(new Builders.MediaGalleryBuilder().addItems(...items));
        }
    }
    return container;
}
