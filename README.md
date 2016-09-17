# Slack Incoming Webhooks

This Slackbot is a wrapper for the Numbers API that shows how incoming webhooks in Slack work using BotKit.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Slack account with administrative privileges.
- A Wit.ai account.
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.

# Installation
1. Clone this branch and `cd` into it.
2. Open a terminal window and execute the following command to create a config file: `cp config.sample.js config.js`.
3. Go to https://my.slack.com/apps/build/custom-integration and create a Bot.
4. Return to https://my.slack.com/apps/build/custom-integration and this time, create an Incoming Webhook.
5. Copy the Webhook URL into `config.js`. While you're there, you can also change the frequency in which the the incoming webhooks will be sent.
6. Go to https://wit.ai/ and create a new app by importing `NumberBotApp.zip`.
7. Once the app is created, wait a few seconds and check if the circle next to the app name becomes green. As Wit.ai is still in beta, sometimes this doesn't happen, so go to the Settings tab to delete the app and create it again. You may have to do this a few times before the app shows a green status.
8. Once the app is created correctly, go to the Settings tab and generate a Server Access Token if none is shown by clicking the *Reset Token* icon.
9. In a terminal window, install the app dependencies with `npm install`
10. Start the bot with the command `token=<YOUR_BOT_TOKEN> wit_token=<YOUR_WIT_AI_SERVER_ACCESS_TOKEN> node bot.js` by copying the token given by Slack and Wit.ai.
11. After the time specified on `config.js`, the bot will post a message in the channel you configured when the incoming webhook was created. Uncomment lines 50-70 in `bot.js` to change how these messages are sent.

# License
MIT