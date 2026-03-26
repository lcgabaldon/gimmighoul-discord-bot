const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('postrules')
        .setDescription('Post the server rules to a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post rules in (defaults to current channel)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('postwelcome')
        .setDescription('Post welcome/get-full-access message to a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post message in (defaults to current channel)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Open a private thread with the community owner')
        .addStringOption(option =>
            option
                .setName('topic')
                .setDescription('What is this about? (optional)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('postticketinfo')
        .setDescription('Post the ticket system info message to a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post in (defaults to current channel)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('luckyfriend')
        .setDescription('Open a private thread with your Lucky Friend to arrange a trade')
        .addUserOption(option =>
            option
                .setName('trainer')
                .setDescription('The Lucky Friend you want to connect with')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('postluckyfriendinfo')
        .setDescription('Post the Lucky Friend system info message to a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post in (defaults to current channel)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('closeticket')
        .setDescription('Close and archive the current ticket thread'),
    new SlashCommandBuilder()
        .setName('closetrade')
        .setDescription('Close and archive the current Lucky Friend trade thread'),
    new SlashCommandBuilder()
        .setName('postroleselect')
        .setDescription('Post the role selection message with reaction roles')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post in (defaults to current channel)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('postbotinfo')
        .setDescription('Post a message explaining what G1MM1GH0UL bot can do')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to post in (defaults to current channel)')
                .setRequired(false)
        ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();