import { Command } from '../../classes/Command.js';
import { GuildMember, Message, MessageFlags, ApplicationCommandOptionType } from 'discord.js';
import * as Enums from 'discord-api-types/v10';
import * as Builders from '@discordjs/builders';
import { getQuote, getQuotes } from '../../handlers/database.js';
import { WithId } from 'mongodb';
import { Quote } from 'src/types/database.type.js';
import { client } from '../../index.js';

export default new Command({
    name: 'quotesearch',
    description: 'Search quote by ID or Keyword',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'query',
            description: 'Keyword or ID you want to search',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the response',
        },
    ],
    deferReply: true,
    aliases: ['qs', 'qsearch'],
    category: 'quote',
    async slashCommand({ interaction, options }) {
        if (!interaction.guildId || !interaction.member) return;
        const query = options.getString('query', true);
        if (!query) return interaction.editReply('Nyu query provided miyaaaa~!');
        let quotes = [await getQuote(interaction.guildId, query)] as Array<WithId<Quote>>;
        if (!quotes[0]) quotes = (await getQuotes(interaction.guildId, query)) as Array<WithId<Quote>>;
        const quote = quotes[0];
        if (!quote) return interaction.editReply('This query has no quotes, sempai~');
        interaction.editReply({
            components: [await makeContainer(quote, quotes, 'interaction', (interaction.member as GuildMember).id)],
            flags: MessageFlags.IsComponentsV2,
            files: [],
        });
    },
    async prefixCommand({ message, args }) {
        const member = await message.guild?.members.fetch(message.author);
        if (!member) return;
        if (!message.guildId) return;
        if (!args[0]) return message.reply('Nyu query provided miyaaaa~!');
        let quotes = [await getQuote(message.guildId, args[0])] as Array<WithId<Quote>>;
        if (!quotes[0]) quotes = (await getQuotes(message.guildId, args[0])) as Array<WithId<Quote>>;
        const quote = quotes[0];
        if (!quote) return message.reply('This query has no quotes, sempai~');
        message.reply({
            components: [await makeContainer(quote, quotes, message, member.id)],
            flags: MessageFlags.IsComponentsV2,
            files: [],
        });
    },
    async selectMenu({ interaction, args }) {
        if (!interaction.guildId) return;
        interaction.deferUpdate();
        const quote = await getQuote(interaction.guildId, interaction.values[0]);
        const quotes = (await getQuotes(interaction.guildId, interaction.values[0].split('_').slice(0, -1).join('_'))) as Array<WithId<Quote>>;
        if (!quote) return;
        interaction.message.edit({
            components: [await makeContainer(quote, quotes, interaction.message, args[1])],
            flags: MessageFlags.IsComponentsV2,
            files: [],
        });
    },
});

async function makeContainer(quote: WithId<Quote>, quotes: Array<WithId<Quote>>, message: Message<boolean> | 'interaction', member: string): Promise<Builders.ContainerBuilder> {
    const createdBy = await client.users.fetch(quote.createdBy);
    const container = new Builders.ContainerBuilder()
        .addTextDisplayComponents(new Builders.TextDisplayBuilder().setContent(`## Quote ${quote.id}`))
        .addSeparatorComponents(new Builders.SeparatorBuilder().setSpacing(Enums.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
            new Builders.TextDisplayBuilder().setContent(
                `**Keyword:** ${quote.name}\n**Content:** ${quote.content}\n**Created By:** ${createdBy.username} (${createdBy.id}) <t:${Math.floor(
                    quote.createdAt.getTime() / 1_000
                )}:R>`
            )
        )
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

    const pages = Math.ceil(quotes.length / 25);
    if (quotes.length > 1) {
        container.addSeparatorComponents(new Builders.SeparatorBuilder().setSpacing(Enums.SeparatorSpacingSize.Small).setDivider(true));
        for (let page = 0; page < pages; page++) {
            const options = quotes
                .slice(25 * page, 25 * (page + 1))
                .map((quote) => new Builders.SelectMenuOptionBuilder().setLabel(`ID: ${quote.id} Text: ${quote.content.substring(0, 45)}`).setValue(quote.id));
            container.addActionRowComponents(
                new Builders.ActionRowBuilder<Builders.MessageActionRowComponentBuilder>().addComponents(
                    new Builders.StringSelectMenuBuilder()
                        .setCustomId(`test_${member}_${typeof message === 'string' ? message : message.id}_${page}`)
                        .addOptions(...options)
                        .setPlaceholder(`Quotes ${25 * page + 1} to ${25 * page + options.length}`)
                )
            );
        }
    }
    return container;
}
