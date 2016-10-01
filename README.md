# Outgoing Webhooks vs Slash Commands

This Slackbot shows how to use outgoing webhooks and Slash Commands with BotKit. It belongs to the fourth part of a series of tutorials about Slackbots.

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
6. Open a new terminal window and install [Localtunnel](https://localtunnel.github.io/www/) globally with `npm install -g localtunnel`.
7. Once installed, execute `lt --port 3000 --subdomain testingbots` (or any other subdomain if it's not available).
8. Return to https://my.slack.com/apps/build/custom-integration and this time, create an Outgoing Webhook. In the URL enter `https://testingbots.localtunnel.me/slack/receive` (or any other subdomain you specified in the previous step).
9. Return to https://my.slack.com/apps/build/custom-integration and this time, create an Slash Command. In the URL enter `https://testingbots.localtunnel.me/slack/receive` (or any other subdomain you specified in the previous step).
10. In another window, go to https://wit.ai/ and create a new app by importing `NumberBotApp.zip`.
11. Once the app is created, wait a few seconds and check if the circle next to the app name becomes green. As Wit.ai is still in beta, sometimes this doesn't happen, so go to the Settings tab to delete the app and create it again. You may have to do this a few times before the app shows a green status.
12. Once the app is created correctly, go to the Settings tab and generate a Server Access Token if none is shown by clicking the *Reset Token* icon.
13. In a terminal window, install the app dependencies with `npm install`
14. Start the bot with the command `token=<YOUR_BOT_TOKEN> wit_token=<YOUR_WIT_AI_SERVER_ACCESS_TOKEN> ow_token=<OUTGOING_WEBHOOK_TOKEN> cmd_token=<SLASH_COMMAND_TOKEN> node bot.js` by copying the token given by Slack (when you created the bot), the Wit.ai token, the Outgoing Webhook token, and the Slash Command token.
15. Play with the bot by sending a message with the keyword configured to trigger the Outgoing Webhook and by executing the configured Slash Command.

# License
MIT
