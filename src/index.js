require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const yaml = require('js-yaml');
const fs = require('fs');
const logger = require('./logger');

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
    logger.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    logger.log(`👀 Watching channel: ${config.sourceChannelId}`);
    logger.log(`📢 Announcement channel: ${config.announceChannelId}`);
    logger.log(`🔑 Required role: ${config.allowedRoleId}`);
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

    logger.log(`📝 New message from ${message.author.tag} in source channel`);

    // Send the original message content with attachments
    const response = await message.channel.send({
        content: message.content,
        files: message.attachments.map(attachment => ({
            attachment: attachment.url,
            name: attachment.name
        })),
        components: [createButtons()]
    });

    logger.log(`✅ Added announcement buttons to message`);

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
        time: 0 // Infinite timeout
    });

    collector.on('collect', async (interaction) => {
        try {
            // Defer the reply to prevent interaction timeout
            await interaction.deferReply({ ephemeral: true });
            
            logger.log(`🔘 Button clicked by ${interaction.user.tag}: ${interaction.customId}`);
            
            // Check if user has the required role
            const hasRole = interaction.member.roles.cache.has(config.allowedRoleId);

            if (!hasRole) {
                logger.log(`❌ User ${interaction.user.tag} attempted to use buttons without permission`);
                await interaction.editReply({
                    content: 'You do not have permission to use these buttons.',
                    ephemeral: true
                });
                return;
            }

            if (interaction.customId === 'announce') {
                // Get the announcement channel
                const announceChannel = await client.channels.fetch(config.announceChannelId);
                if (!announceChannel) {
                    logger.error(`Announcement channel not found: ${config.announceChannelId}`);
                    await interaction.editReply({
                        content: 'Error: Announcement channel not found.',
                        ephemeral: true
                    });
                    return;
                }

                // Send the announcement with attachments
                await announceChannel.send({
                    content: message.content,
                    files: message.attachments.map(attachment => ({
                        attachment: attachment.url,
                        name: attachment.name
                    }))
                });
                logger.log(`📢 Announcement posted by ${interaction.user.tag}`);
                await interaction.editReply({
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
            logger.log(`🔒 Buttons disabled for message`);
        } catch (error) {
            logger.error(`Error handling interaction: ${error.message}`);
            try {
                await interaction.editReply({
                    content: 'An error occurred while processing your request.',
                    ephemeral: true
                });
            } catch (e) {
                logger.error(`Failed to send error message: ${e.message}`);
            }
        }
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
        }).catch(error => logger.error(`Failed to disable buttons: ${error.message}`));
        logger.log(`⏰ Buttons timed out and disabled`);
    });
});

// Error handling
client.on('error', error => {
    logger.error(`Discord client error: ${error.message}`);
});

process.on('unhandledRejection', error => {
    logger.error(`Unhandled promise rejection: ${error.message}`);
});

// Login to Discord
client.login(process.env.BOT_TOKEN)
    .then(() => logger.log('🔑 Bot token validated'))
    .catch(error => logger.error(`Failed to login: ${error.message}`)); 