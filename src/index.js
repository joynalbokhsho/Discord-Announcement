require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const yaml = require('js-yaml');
const fs = require('fs');

// Load configuration
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'));

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// Bot ready event
client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`👀 Watching channel: ${config.sourceChannelId}`);
    console.log(`📢 Announcement channel: ${config.announceChannelId}`);
    console.log(`🔑 Required role: ${config.allowedRoleId}`);
});

// Create buttons
const createButtons = () => {
    const announceButton = new ButtonBuilder()
        .setCustomId('announce')
        .setLabel('Announce')
        .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder()
        .addComponents(announceButton, cancelButton);
};

// Handle message events
client.on('messageCreate', async (message) => {
    // Check if message is from the source channel
    if (message.channelId !== config.sourceChannelId) return;
    
    // Ignore bot messages
    if (message.author.bot) return;

    console.log(`📝 New message from ${message.author.tag} in source channel`);

    // Send the original message content
    const response = await message.channel.send({
        content: message.content,
        components: [createButtons()]
    });

    console.log(`✅ Added announcement buttons to message`);

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
    });

    collector.on('collect', async (interaction) => {
        console.log(`🔘 Button clicked by ${interaction.user.tag}: ${interaction.customId}`);
        
        // Check if user has the required role
        const hasRole = interaction.member.roles.cache.has(config.allowedRoleId);

        if (interaction.customId === 'announce') {
            if (!hasRole) {
                console.log(`❌ User ${interaction.user.tag} attempted to announce without permission`);
                await interaction.reply({
                    content: 'You do not have permission to use the Announce button.',
                    ephemeral: true
                });
                return;
            }

            // Get the announcement channel
            const announceChannel = await client.channels.fetch(config.announceChannelId);
            if (!announceChannel) {
                console.log(`❌ Announcement channel not found: ${config.announceChannelId}`);
                await interaction.reply({
                    content: 'Error: Announcement channel not found.',
                    ephemeral: true
                });
                return;
            }

            // Send the announcement as plain text
            await announceChannel.send(message.content);
            console.log(`📢 Announcement posted by ${interaction.user.tag}`);
            await interaction.reply({
                content: 'Announcement has been posted!',
                ephemeral: true
            });
        }

        // Disable buttons after use
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                ButtonBuilder.from(interaction.message.components[0].components[0])
                    .setDisabled(true),
                ButtonBuilder.from(interaction.message.components[0].components[1])
                    .setDisabled(true)
            );

        await interaction.message.edit({
            components: [disabledRow]
        });
        console.log(`🔒 Buttons disabled for message`);
    });

    collector.on('end', () => {
        // Disable buttons after timeout
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                ButtonBuilder.from(response.components[0].components[0])
                    .setDisabled(true),
                ButtonBuilder.from(response.components[0].components[1])
                    .setDisabled(true)
            );

        response.edit({
            components: [disabledRow]
        }).catch(console.error);
        console.log(`⏰ Buttons timed out and disabled`);
    });
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.BOT_TOKEN)
    .then(() => console.log('🔑 Bot token validated'))
    .catch(error => console.error('❌ Failed to login:', error)); 