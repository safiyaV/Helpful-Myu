import { Command } from '../../classes/Command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { deleteQuote, getQuote } from '../../handlers/database.js';

export default new Command({
    name: 'deletequote',
    description: 'Deletes a quote.',
    disabled: false,
    category: 'quotes',
    deferReply: true,
    dm_permission: false,
    hidden: false,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'id',
            description: 'The id of the quote you want to delete',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the quote creation response',
        },
    ],
    aliases: ['qd', 'qdelete'],
    async slashCommand({ interaction, options, client }) {
        if (!interaction.guildId) return;
        const id = options.getString('id', true);
        const quote = await getQuote(interaction.guildId, id);
        if (!quote) return interaction.editReply(`There is no quote with the ID \`${id}\``);
        const createdBy = await client.users.fetch(quote.createdBy);
        if (!interaction.memberPermissions?.has('Administrator')) if (interaction.user.id !== createdBy.id) return;
        interaction.editReply({
            embeds: [
                {
                    color: client.embedColor,
                    title: 'Do you wanna compost this quote, myaa?',
                    description: `**ID:** ${quote.id}\n**Keyword:** ${quote.name}\n**Content:** ${quote.content}\n**Created By:** ${createdBy.username} (${
                        createdBy.id
                    })\n**Created At:** <t:${Math.floor(new Date(quote.createdAt).getTime() / 1_000)}:F>\n`,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Requested by ${interaction.user.username}`,
                        icon_url: interaction.user.displayAvatarURL(),
                    },
                },
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            customId: `deletequote;${interaction.user.id};interaction;${quote.id}`,
                            label: 'Yes',
                            style: 4,
                        },
                        {
                            type: 2,
                            customId: `cancel;${interaction.user.id};interaction`,
                            label: 'No',
                            style: 2,
                        },
                    ],
                },
            ],
        });
    },
    async prefixCommand({ message, args, client }) {
        if (!message.guildId) return;
        if (!args[0]) return message.reply("I can't delete nothing!!");
        const id = args[0] as string;
        const quote = await getQuote(message.guildId, id);
        if (!quote) return message.reply(`There is no quote with the ID \`${id}\``);
        const createdBy = await message.client.users.fetch(quote.createdBy);
        if (!message.member?.permissions.has('Administrator')) if (message.author.id !== createdBy.id) return;
        message.reply({
            embeds: [
                {
                    color: client.embedColor,
                    title: 'Do you wanna compost this quote, myaa?',
                    description: `**ID:** ${quote.id}\n**Keyword:** ${quote.name}\n**Content:** ${quote.content}\n**Created By:** ${createdBy.username} (${
                        createdBy.id
                    })\n**Created At:** <t:${Math.floor(new Date(quote.createdAt).getTime() / 1_000)}:F>\n`,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Requested by ${message.author.username}`,
                        icon_url: message.author.displayAvatarURL(),
                    },
                },
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            customId: `deletequote;${message.author.id};${message.id};${quote.id}`,
                            label: 'Yes',
                            style: 4,
                        },
                        {
                            type: 2,
                            customId: `cancel;${message.author.id};${message.id}`,
                            label: 'No',
                            style: 2,
                        },
                    ],
                },
            ],
        });
    },
    async button({ interaction, message, args }) {
        deleteQuote(interaction.guildId as string, args[3]).then(() => {
            interaction.deleteReply().catch((err: Error) => {});
            interaction.reply({ content: 'Quote deleted.', flags: ['Ephemeral'] }).catch((err: Error) => {});
            interaction.message.delete().catch((err: Error) => {});
            message?.delete().catch((err: Error) => {});
        });
    },
});
