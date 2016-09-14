# Getting Started with Slackbots

This Slack bot is a wrapper for the Numbers API that shows how to receive and send simple messages and initiate a conversation using BotKit.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Slack account with administrative privileges.
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.

# Installation
1. Clone this branch and `cd` into it.
2. Go to https://my.slack.com/apps/build/custom-integration and create a Bot
3. Copy the token given by Slack
4. Go back to the terminal window and install the depencies of the app with `npm install`
4. Start the bot with `token=<YOUR_BOT_TOKEN> node bot.js`
5. Invite the bot to one of your team's channels with `/invite @<NAME_OF_YOUR_BOT>`
6. Play with the bot. It will give a random fact every time a number is mentioned in a message. Or initiate a conversation with either a mention, a direct mention, or a direct message with the word `trivia`, for example, `@<NAME_OF_YOUR_BOT> trivia`.

# License
MIT
