const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, Partials } = require('discord.js');
require('dotenv').config();

console.log('Starting bot...');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Required for welcome messages
        GatewayIntentBits.GuildMessageReactions, // Required for reaction roles
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction], // Required to track reactions on old messages
});

// When the client is ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Welcome new members
client.on('guildMemberAdd', member => {
    // Welcome channel message
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;

    if (welcomeChannelId) {
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

        if (welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 A New Trainer Appears!')
                .setDescription(`*clink clink clink... the sound of coins rattling...*\n\n**G1MM1GH0UL** pops out from his treasure chest, gold coins flying everywhere! He spots ${member} and jumps with excitement!\n\n**G1MM1GH0UL** scrambles over with a big grin, scattering coins in his wake.\n\n**Welcome to El Paso Go!, Trainer!**\n\nSee you at our next meetup!\n\n**G1MM1GH0UL** gives you a friendly wave and scurries back to his treasure chest, ready to welcome the next trainer!`)
                .setThumbnail(member.user.displayAvatarURL())
                .setFooter({ text: 'El Paso Go! • Community Ambassador Program' })
                .setTimestamp();

            welcomeChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed]
            });
        }
    }

    // Join log
    const joinLogChannelId = process.env.JOIN_LOG_CHANNEL_ID;
    if (joinLogChannelId) {
        const joinLogChannel = member.guild.channels.cache.get(joinLogChannelId);

        if (joinLogChannel) {
            const joinLogEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green for join
                .setTitle('✅ Member Joined')
                .setDescription(`${member.user.tag} (${member.user.id})`)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
                )
                .setTimestamp();

            joinLogChannel.send({ embeds: [joinLogEmbed] });
        }
    }

    console.log(`✅ New member joined: ${member.user.tag}`);
});

// Member leave logging
client.on('guildMemberRemove', member => {
    const joinLogChannelId = process.env.JOIN_LOG_CHANNEL_ID;
    if (joinLogChannelId) {
        const joinLogChannel = member.guild.channels.cache.get(joinLogChannelId);

        if (joinLogChannel) {
            const leaveLogEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red for leave
                .setTitle('❌ Member Left')
                .setDescription(`${member.user.tag} (${member.user.id})`)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
                    { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
                )
                .setTimestamp();

            joinLogChannel.send({ embeds: [leaveLogEmbed] });
        }
    }

    console.log(`❌ Member left: ${member.user.tag}`);
});

// Error handling
client.on('error', error => {
    console.error('Client error:', error);
});

// Role selection emoji-to-role mapping
const roleReactionMap = {
    '📢': 'Event Ping',
    '📍': 'Meetup Ping',
    '🥊': 'PvP',
    'TeamInstinct': 'Team Instinct',
    'TeamMystic': 'Team Mystic',
    'TeamValor': 'Team Valor',
};

// Reaction roles - when someone adds a reaction
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;

    // If reaction is partial, fetch it
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    // Check if this is the rules message (Verified Trainer)
    const rulesMessageId = process.env.RULES_MESSAGE_ID;
    if (rulesMessageId && reaction.message.id === rulesMessageId && reaction.emoji.name === '🪙') {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member) return;

        const verifiedRoleName = process.env.VERIFIED_ROLE_NAME || 'Verified Trainer';
        const verifiedRole = reaction.message.guild.roles.cache.find(role => role.name === verifiedRoleName);

        if (!verifiedRole) {
            console.error(`Role "${verifiedRoleName}" not found!`);
            return;
        }

        try {
            await member.roles.add(verifiedRole);
            console.log(`✅ Gave ${verifiedRoleName} role to ${user.tag}`);
        } catch (error) {
            console.error('Error adding role:', error);
        }
    }

    // Check if this is the role selection message
    const rolesMessageId = process.env.ROLES_MESSAGE_ID;
    if (rolesMessageId && reaction.message.id === rolesMessageId) {
        const emojiKey = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.name;
        const roleName = roleReactionMap[emojiKey];

        if (!roleName) return;

        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member) return;

        const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.error(`Role "${roleName}" not found!`);
            return;
        }

        try {
            await member.roles.add(role);
            console.log(`✅ Gave ${roleName} role to ${user.tag}`);
        } catch (error) {
            console.error('Error adding role:', error);
        }
    }
});

// Reaction roles - when someone removes a reaction
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    // Check if this is the role selection message
    const rolesMessageId = process.env.ROLES_MESSAGE_ID;
    if (rolesMessageId && reaction.message.id === rolesMessageId) {
        const emojiKey = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.name;
        const roleName = roleReactionMap[emojiKey];

        if (!roleName) return;

        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member) return;

        const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.error(`Role "${roleName}" not found!`);
            return;
        }

        try {
            await member.roles.remove(role);
            console.log(`❌ Removed ${roleName} role from ${user.tag}`);
        } catch (error) {
            console.error('Error removing role:', error);
        }
    }
});

// Command to post rules
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Log command usage
    console.log(`Received command: ${interaction.commandName} from ${interaction.user.tag}`);

    const commandLogChannelId = process.env.COMMAND_LOG_CHANNEL_ID;
    if (commandLogChannelId) {
        const commandLogChannel = interaction.guild.channels.cache.get(commandLogChannelId);

        if (commandLogChannel) {
            const commandLogEmbed = new EmbedBuilder()
                .setColor('#FFA500') // Orange for commands
                .setTitle('🔧 Command Used')
                .setDescription(`\`/${interaction.commandName}\``)
                .addFields(
                    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true }
                )
                .setTimestamp();

            commandLogChannel.send({ embeds: [commandLogEmbed] }).catch(err => {
                console.error('Error sending command log:', err);
            });
        }
    }

    if (interaction.commandName === 'postrules') {
        //Only Founder can run this command
        const hasFounderRole = interaction.member.roles.cache.some(role => role.name === 'Founder');
        if (!hasFounderRole) {
            return interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
        }

        try {
            // Get the channel from the command option, or use the current channel
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Create an embed for rules
            const rulesEmbed = new EmbedBuilder()
                .setColor('#FFD700') // Gold color for Gimmighoul
                .setDescription('**1. This is a family friendly community.**All posts and discussions must respect this. Community members are expected to follow this rule at our in-person meetups as well.\n\n**2. Per Niantic\'s TOS all Campfire members must be 13 years old or older.**Younger players are welcome to participate in community meetups as long as a parent or guardian is present.\n\n**3. This community follows all of Niantic and Pokémon GO\'s TOS.**We do not condone or allow discussion of activities that violate said TOS. Such activities include but are not limited to: third-party trackers, spoofing, account sharing, multi-accounting, map scanners, and auto-walkers.\n\n**4. Community members are expected to be respectful of other people and property.**This applies to other players as well as non-players, public and private property.\n\n**5. This community is part of Niantic\'s Community Ambassador program.**Thanks to this we may have digital and physical prizes at Community Ambassador hosted meetups. They are a perk of the program but not guaranteed for any player at any meetup.\n\n**6. We welcome members of all races, ages (13+ for Campfire), beliefs, gender identities, nationalities, trainer levels, economic backgrounds, and so on.**\n**7. You are responsible for your own safety and wellbeing at our meetups.**We welcome and encourage participating in our in-person meetups and look forward to meeting you! If you are unable to participate in our in-person meetups for any reason, you are still welcome in our community.\n\n**8. Owner and administrators of this community reserve the right to give warnings or timeouts to members who violate these rules and ban members at their discretion.**Questions, concerns, and comments can be directed to the community owner and admins.\n\n**9. Do not cause drama or fight with each other.**Anyone breaking this rule will be removed from the group.\n\n**10. Do not post/share meet-ups from other communities.**As a Community Ambassador group, we go through various checks by Niantic which other communities do not, and it could be confusing to some players who may mistake it as our event.\n\n**11. No controversial subjects or topics are to be discussed in this group.**We also ask members not to promote or self-promote online stores, streams/streamers, etc.\n\n**12. Please avoid sharing non-Niantic links or apps. This also includes attempting to sell in-game and out-of-game items, currency, or services.**This includes screenshots with IV overlays, any services, or items, but people are welcome to share information that comes from official sources.')
                .addFields(
                    { name: '\u200B', value: '\u200B' }, // Blank field for spacing
                    {
                        name: 'Niantic Terms of Service:',
                        value: 'https://www.nianticlabs.com/terms?hl=en',
                        inline: false
                    },
                    {
                        name: 'Niantic Privacy Policy:',
                        value: 'https://www.nianticlabs.com/privacy?hl=en',
                        inline: false
                    },
                    {
                        name: 'Niantic Player Guidelines:',
                        value: 'https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1797-niantic-player-guidelines/',
                        inline: false
                    },
                    { name: '\u200B', value: '\u200B' }, // Blank field for spacing
                    {
                        name: '🪙 Ready to Join?',
                        value: '**G1MM1GH0UL** guards the entrance to the server! In order for **G1MM1GH0UL** to let you pass, you must pay the price of 1 coin! Leave the coin (🪙) below to gain access to the El Paso Go! Official Discord!',
                        inline: false
                    }
                )
                .setFooter({ text: 'Version 2.03 • Last updated: January 18th, 2026' })

            // Post a character message with the embed
            const rulesMessage = await targetChannel.send({
                content: '*you step into a new area, the noise of gold coins scattering continues, from the darkness emerges* **G1MM1GH0UL** once again!\n\nFrantically picking up the coins, tossing them into a chest nearby, **G1MM1GH0UL** looks up, jumping in excitement; he pulls out a scroll from within his chest of treasure and approaches you. **G1MM1GH0UL** unravels it, presenting you the document. Across the top, the text reads:\n\n***The Sacred El Paso Go! Rules***',
                embeds: [rulesEmbed]
            });

            // Add coin reaction automatically
            await rulesMessage.react('🪙');

            // Store the message ID in .env note for user
            console.log(`\n⚠️  IMPORTANT: Add this to your .env file:\nRULES_MESSAGE_ID=${rulesMessage.id}\n`);

            // Confirm to the user (only they see this)
            await interaction.reply({
                content: `✅ Rules posted!\n\n**IMPORTANT:** Add this to your \`.env\` file:\n\`\`\`\nRULES_MESSAGE_ID=${rulesMessage.id}\n\`\`\`\nThen restart the bot for reaction roles to work!`,
                ephemeral: true
            });
            console.log('Rules embed sent successfully!');
        } catch (error) {
            console.error('Error sending rules:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'postwelcome') {
        //Only Founder can run this command
        const hasFounderRole = interaction.member.roles.cache.some(role => role.name === 'Founder');
        if (!hasFounderRole) {
            return interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
        }

        try {
            // Get the channel from the command option, or use the current channel
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Create an embed for how to get full access
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('Welcome to the El Paso Go! Official Discord!')
                .setDescription('We are glad to have you! In order to maintain an organized and optimized experience here, we ask all who join to link their Campfire before accessing the full server, as well as reading and acknowledging the rules!\n\n**Step 1: Connect Your Campfire** 🔗\nLinking your Campfire account is **highly recommended** and makes you eligible for:\n• Discord giveaways\n• Digital code rewards\n• Check-in tracking and leaderboards\n• In-game rewards from meetups\n\n**How to connect:**\nUse the `/connect` command in this channel and follow the steps that appear!\n\n**Step 2: Read and Acknowledge the Rules** 📜\nAfter connecting (if you choose to skip for now, you can use `/connect` later in any text channel), head over to <#' + (process.env.RULES_CHANNEL_ID || 'rules-channel-id') + '> and read through our community guidelines. When you\'re done, you **MUST** react with the 🪙 coin emoji to gain full access to the server!\n\nThat\'s it! **G1MM1GH0UL** is excited to see you at our meetups!')
                .setFooter({ text: 'El Paso Go! • Community Ambassador Program' })

            // Post the welcome message
            await targetChannel.send({
                content: '*you hear excited chirping and the sound of coins clinking...* **G1MM1GH0UL** bursts through the door!\n\n**G1MM1GH0UL** spots you and immediately starts jumping up and down with excitement! A new trainer has arrived!',
                embeds: [welcomeEmbed]
            });

            // Confirm to the user (only they see this)
            await interaction.reply({ content: '✅ Welcome message posted!', ephemeral: true });
            console.log('Welcome embed sent successfully!');
        } catch (error) {
            console.error('Error sending welcome message:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'ticket') {
        try {
            // Get the questions-and-concerns channel
            const ticketChannelId = process.env.TICKET_CHANNEL_ID;
            if (!ticketChannelId) {
                return interaction.reply({ content: 'Ticket system is not configured yet.', ephemeral: true });
            }

            const ticketChannel = interaction.guild.channels.cache.get(ticketChannelId);
            if (!ticketChannel) {
                return interaction.reply({ content: 'Could not find the ticket channel.', ephemeral: true });
            }

            // Get the optional topic
            const topic = interaction.options.getString('topic');
            const threadName = topic
                ? `${interaction.user.username} - ${topic}`
                : `${interaction.user.username} - Ticket`;

            // Create private thread
            const thread = await ticketChannel.threads.create({
                name: threadName,
                type: 12, // PrivateThread
                reason: `Ticket opened by ${interaction.user.tag}`,
            });

            // Add the member who opened it
            await thread.members.add(interaction.user.id);

            // Add Founder and Community Ambassador roles to the thread
            const adminRoles = ['Founder', 'Community Ambassador'];
            const mentionIds = [];

            for (const roleName of adminRoles) {
                const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (role) {
                    const members = interaction.guild.members.cache.filter(
                        m => m.roles.cache.has(role.id)
                    );
                    for (const [id] of members) {
                        await thread.members.add(id);
                        mentionIds.push(id);
                    }
                }
            }

            // Post opening message in the thread
            const ticketEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 A Private Audience with G1MM1GH0UL!')
                .setDescription(
                    `*G1MM1GH0UL peeks out from behind his treasure chest, noticing ${interaction.user} approaching...*\n\n` +
                    `**G1MM1GH0UL** pulls out a small scroll and quill, ready to listen!\n\n` +
                    (topic ? `**Topic:** ${topic}\n\n` : '') +
                    `Go ahead and share what's on your mind — the community owner & ambassador will get back to you here!`
                )
                .setFooter({ text: 'El Paso Go! • Private Ticket' })

            // Ping admins so they get notified
            const mentions = [...new Set(mentionIds)].map(id => `<@${id}>`).join(' ');
            await thread.send({ content: mentions, embeds: [ticketEmbed] });

            // Reply to the user
            await interaction.reply({
                content: `✅ Your private ticket has been opened! Head over to ${thread} to continue.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error creating ticket:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred creating your ticket!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'postticketinfo') {
        // Only Founder can run this command
        const hasFounderRole = interaction.member.roles.cache.some(role => role.name === 'Founder');
        if (!hasFounderRole) {
            return interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
        }

        try {
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            const ticketInfoEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 Questions? Concerns? G1MM1GH0UL Can Help!')
                .setDescription(
                    `*G1MM1GH0UL sets up a small desk in the corner, placing a quill and inkwell neatly beside a stack of scrolls...*\n\n` +
                    `Need to reach out to the community ambassadors about something? You can open a **private ticket** right here!\n\n` +
                    `**How it works:**\n` +
                    `Use the \`/ticket\` command to open a private thread. You can optionally include a topic, like:\n` +
                    `\`/ticket topic: Question about meetups\`\n\n` +
                    `**Your privacy is protected!** No one in the server can see that you opened a ticket or what you discuss — only you and the Community Ambassadors will have access to the thread.\n\n` +
                    `*G1MM1GH0UL taps the desk with a grin, ready for business.*\n\n` +
                    `Now, if you have a concern, use \`/ticket\` to contact the ambassadors directly! **G1MM1GH0UL** will make sure your message gets to the right people! 🪙`
                )
                .setFooter({ text: 'El Paso Go! • Private Ticket System' })

            await targetChannel.send({ embeds: [ticketInfoEmbed] });

            await interaction.reply({ content: '✅ Ticket info message posted!', ephemeral: true });
        } catch (error) {
            console.error('Error posting ticket info:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'luckyfriend') {
        try {
            // Get the lucky-friend-connect channel
            const luckyFriendChannelId = process.env.LUCKY_FRIEND_CHANNEL_ID;
            if (!luckyFriendChannelId) {
                return interaction.reply({ content: 'Lucky Friend system is not configured yet.', ephemeral: true });
            }

            const luckyFriendChannel = interaction.guild.channels.cache.get(luckyFriendChannelId);
            if (!luckyFriendChannel) {
                return interaction.reply({ content: 'Could not find the Lucky Friend channel.', ephemeral: true });
            }

            // Get the selected trainer
            const targetUser = interaction.options.getUser('trainer');

            // Prevent selecting yourself
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({ content: '❌ You can\'t open a Lucky Friend thread with yourself!', ephemeral: true });
            }

            // Prevent selecting a bot
            if (targetUser.bot) {
                return interaction.reply({ content: '❌ You can\'t trade with a bot, trainer!', ephemeral: true });
            }

            const threadName = `${interaction.user.username} & ${targetUser.username} - Lucky Trade`;

            // Create private thread
            const thread = await luckyFriendChannel.threads.create({
                name: threadName,
                type: 12, // PrivateThread
                reason: `Lucky Friend thread opened by ${interaction.user.tag} for ${targetUser.tag}`,
            });

            // Add both trainers
            await thread.members.add(interaction.user.id);
            await thread.members.add(targetUser.id);

            // Post opening message in the thread
            const luckyFriendEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 The Stars Have Aligned!')
                .setDescription(
                    `*G1MM1GH0UL bursts out of his treasure chest, eyes wide with excitement! He can sense it — something special is happening...*\n\n` +
                    `**G1MM1GH0UL** frantically digs through his pile of gold coins and pulls out a glowing Lucky Trade charm!\n\n` +
                    `✨ **${interaction.user} and ${targetUser} are Lucky Friends!** ✨\n\n` +
                    `**G1MM1GH0UL** hops between both trainers, barely able to contain himself! Use this thread to figure out the details — what you're trading, when and where you'll meet up!\n\n` +
                    `*G1MM1GH0UL gives both trainers a thumbs up and scurries off, leaving a trail of golden coins behind...*`
                )
                .setFooter({ text: 'El Paso Go! • Lucky Friend Trade' })

            await thread.send({ content: `${interaction.user} ${targetUser}`, embeds: [luckyFriendEmbed] });

            // Reply to the user
            await interaction.reply({
                content: `✅ Lucky Friend thread opened! Head over to ${thread} to coordinate your trade with ${targetUser}!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error creating lucky friend thread:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred creating your Lucky Friend thread!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'postluckyfriendinfo') {
        // Only Founder can run this command
        const hasFounderRole = interaction.member.roles.cache.some(role => role.name === 'Founder');
        if (!hasFounderRole) {
            return interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
        }

        try {
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            const luckyFriendInfoEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 Lucky Friend Trade Connect!')
                .setDescription(
                    `*G1MM1GH0UL sits atop his treasure chest, polishing a glowing Lucky Trinket..*\n\n` +
                    `Became Lucky Friends with someone in the community? Use this channel to connect with them and set up your trade!\n\n` +
                    `**How it works:**\n` +
                    `Use the \`/luckyfriend\` command and select the trainer you're Lucky Friends with:\n` +
                    `\`/luckyfriend trainer: @TheirName\`\n\n` +
                    `This will open a **private thread** with just the two of you — no one else in the server can see it! Use the thread to decide what you're trading, when to meet up, and where.\n\n` +
                    `*G1MM1GH0UL holds up the Lucky Trinket, and it sparkles brilliantly!*\n\n` +
                    `Now go on, trainers — use \`/luckyfriend\` and make that Lucky Trade happen! **G1MM1GH0UL** is rooting for you! 🪙`
                )
                .setFooter({ text: 'El Paso Go!' })

            await targetChannel.send({ embeds: [luckyFriendInfoEmbed] });

            await interaction.reply({ content: '✅ Lucky Friend info message posted!', ephemeral: true });
        } catch (error) {
            console.error('Error posting lucky friend info:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'closeticket') {
        // Only Founder or Community Ambassador can close tickets
        const hasAdminRole = interaction.member.roles.cache.some(
            role => role.name === 'Founder' || role.name === 'Community Ambassador'
        );
        if (!hasAdminRole) {
            return interaction.reply({ content: '❌ Only the Founder or Community Ambassador can close tickets.', ephemeral: true });
        }

        // Must be used inside a thread
        if (!interaction.channel.isThread()) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket thread.', ephemeral: true });
        }

        // Check that the thread is in the ticket channel
        if (interaction.channel.parentId !== process.env.TICKET_CHANNEL_ID) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket thread.', ephemeral: true });
        }

        try {
            const closeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 Ticket Closed!')
                .setDescription(
                    `*G1MM1GH0UL carefully rolls up the scroll, ties it with a golden ribbon, and places it back in his treasure chest for safekeeping...*\n\n` +
                    `This ticket has been closed by ${interaction.user}. If you need further help, feel free to open a new one with \`/ticket\`!`
                )
                .setFooter({ text: 'El Paso Go! • Private Ticket' })

            await interaction.reply({ embeds: [closeEmbed] });
            await interaction.channel.setLocked(true);
            await interaction.channel.setArchived(true);
        } catch (error) {
            console.error('Error closing ticket:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred closing this ticket!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'closetrade') {
        // Must be used inside a thread
        if (!interaction.channel.isThread()) {
            return interaction.reply({ content: '❌ This command can only be used inside a Lucky Friend trade thread.', ephemeral: true });
        }

        // Check that the thread is in the lucky friend channel
        if (interaction.channel.parentId !== process.env.LUCKY_FRIEND_CHANNEL_ID) {
            return interaction.reply({ content: '❌ This command can only be used inside a Lucky Friend trade thread.', ephemeral: true });
        }

        try {
            const closeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🪙 Lucky Trade Complete!')
                .setDescription(
                    `*G1MM1GH0UL watches the trade happen, eyes sparkling with joy! He tosses a handful of gold coins into the air in celebration!*\n\n` +
                    `**G1MM1GH0UL** stamps this trade as complete! Congratulations, trainers!\n\n` +
                    `*G1MM1GH0UL waves goodbye and dashes back to his treasure chest, already excited for the next Lucky Trade...*`
                )
                .setFooter({ text: 'El Paso Go! • Lucky Friend Trade' })

            await interaction.reply({ embeds: [closeEmbed] });
            await interaction.channel.setLocked(true);
            await interaction.channel.setArchived(true);
        } catch (error) {
            console.error('Error closing trade thread:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred closing this trade thread!', ephemeral: true });
            }
        }
    }

    if (interaction.commandName === 'postroleselect') {
        // Only Founder can run this command
        const hasFounderRole = interaction.member.roles.cache.some(role => role.name === 'Founder');
        if (!hasFounderRole) {
            return interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
        }

        try {
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Get custom emojis from the server
            const elPasoGoLogo = interaction.guild.emojis.cache.find(e => e.name === 'ElPasoGoLogo');
            const teamInstinct = interaction.guild.emojis.cache.find(e => e.name === 'TeamInstinct');
            const teamMystic = interaction.guild.emojis.cache.find(e => e.name === 'TeamMystic');
            const teamValor = interaction.guild.emojis.cache.find(e => e.name === 'TeamValor');

            const rolesEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setDescription(
                    `${elPasoGoLogo || '🪙'} **Roles & Pings**\n` +
                    `Customize your El Paso Go! experience by choosing the roles you want and opt in/out of certain text channels & pings!\n\n` +
                    `❗ **Ping Roles**\n` +
                    `**Event Ping** for important server updates 📢\n` +
                    `**Meetup Ping** for Campfire meetup alerts 📍\n` +
                    `**PvP** for PvP discussions and battle talk 🥊\n\n` +
                    `🏳️ **Team Roles**\n` +
                    `Team Instinct ${teamInstinct || '⚡'}\n` +
                    `Team Mystic ${teamMystic || '❄️'}\n` +
                    `Team Valor ${teamValor || '🔥'}\n\n` +
                    `*G1MM1GH0UL lays out a selection of shiny badges on the ground in front of you, each one glowing with a different light...*\n\n` +
                    `React below with the corresponding emoji to grab your roles! Remove your reaction to remove the role.`
                )
                .setFooter({ text: 'El Paso Go! • Role Selection' })

            const rolesMessage = await targetChannel.send({ embeds: [rolesEmbed] });

            // Add all reaction emojis to the message
            await rolesMessage.react('📢');
            await rolesMessage.react('📍');
            await rolesMessage.react('🥊');
            if (teamInstinct) await rolesMessage.react(teamInstinct);
            if (teamMystic) await rolesMessage.react(teamMystic);
            if (teamValor) await rolesMessage.react(teamValor);

            console.log(`\n⚠️  IMPORTANT: Add this to your .env file:\nROLES_MESSAGE_ID=${rolesMessage.id}\n`);

            await interaction.reply({
                content: `✅ Role selection posted!\n\n**IMPORTANT:** Add this to your \`.env\` file:\n\`\`\`\nROLES_MESSAGE_ID=${rolesMessage.id}\n\`\`\`\nThen restart the bot for reaction roles to work!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error posting role selection:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred!', ephemeral: true });
            }
        }
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Login successful!'))
    .catch(error => {
        console.error('Failed to login:', error);
        process.exit(1);
    });