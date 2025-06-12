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

    // Create embed with the original message
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({ 
            name: message.author.tag, 
            iconURL: message.author.displayAvatarURL() 
        })
        .setDescription(message.content)
        .setTimestamp();

    // Send the message with buttons
    const response = await message.channel.send({
        embeds: [embed],
        components: [createButtons()]
    });

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
    });

    collector.on('collect', async (interaction) => {
        // Check if user has the required role
        const hasRole = interaction.member.roles.cache.has(config.allowedRoleId);

        if (interaction.customId === 'announce') {
            if (!hasRole) {
                await interaction.reply({
                    content: 'You do not have permission to use the Announce button.',
                    ephemeral: true
                });
                return;
            }

            // Get the announcement channel
            const announceChannel = await client.channels.fetch(config.announceChannelId);
            if (!announceChannel) {
                await interaction.reply({
                    content: 'Error: Announcement channel not found.',
                    ephemeral: true
                });
                return;
            }

            // Send the announcement
            await announceChannel.send({ embeds: [embed] });
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
    });
});

// Login to Discord
client.login(process.env.BOT_TOKEN); 