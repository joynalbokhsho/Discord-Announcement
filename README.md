# Discord Announcement Bot

A Discord bot that helps manage announcements with role-based permissions and interactive buttons.

## Features

- Detects messages in a specific channel
- Responds with interactive buttons (Announce/Cancel)
- Role-based permission system for announcements
- Automatic button timeout after 5 minutes
- Clean embed formatting for announcements

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the bot:
   - Create a `.env` file in the root directory with the following content:
   ```env
   # Discord Bot Token (Required)
   # Get this from https://discord.com/developers/applications
   BOT_TOKEN=your_bot_token_here

   # Optional: Additional configuration
   # NODE_ENV=development
   # DEBUG=true
   ```
   - Edit `config.yml` and add your:
     - Source channel ID (where staff post messages)
     - Announcement channel ID (where announcements will be posted)
     - Allowed role ID (role required to use the Announce button)

3. Start the bot:
```bash
npm start
```

## Configuration

Edit `config.yml` with your specific settings:

```yaml
sourceChannelId: "" # Channel where staff post messages
announceChannelId: "" # Channel where announcements will be posted
allowedRoleId: "" # Role required to use the Announce button
```

## Usage

1. Send a message in the configured source channel
2. The bot will respond with your message and two buttons:
   - Announce: Posts the message to the announcement channel (requires specified role)
   - Cancel: Disables the buttons without taking action
3. Buttons will automatically disable after 5 minutes

## Requirements

- Node.js 16.9.0 or higher
- Discord.js 14.14.1
- A Discord bot token with the following permissions:
  - `Send Messages`
  - `Embed Links`
  - `Read Message History`
  - `View Channels`
  - `Use External Emojis`
  - `Add Reactions`
  - `Read Messages/View Channels`
  - `Send Messages in Threads`
  - `Use Slash Commands`

To set up the bot permissions:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "Bot" section
4. Enable the required permissions under "Privileged Gateway Intents":
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
5. Use the OAuth2 URL Generator to create an invite link with the required permissions
6. Add the bot to your server using the generated invite link 