# Slackbots and natural language

This Slackbot is a wrapper for the Numbers API that shows how to process natural language using Wit.ai and BotKit.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Slack account with administrative privileges.
- A Wit.ai account.
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.

# Installation
1. Clone this branch and `cd` into it.
2. Go to https://my.slack.com/apps/build/custom-integration and create a Bot.
3. Go to https://wit.ai/ and create a new app by importing `NumberBotApp.zip`.
4. Once the app is created, wait a few seconds and check if the circle next to the app name becomes green. As Wit.ai is still in beta, sometimes this doesn't happen, so go to the Settings tab to delete the app and create it again. You may have to do this a few times before the app shows a green status.
5. Once the app is created correctly, go to the Settings tab and generate a Server Access Token if none is shown by clicking the *Reset Token* icon.
6. Open a terminal window and install the dependencies with `npm install`
7. Start the bot with the command `token=<YOUR_BOT_TOKEN> wit_token=<YOUR_WIT_AI_SERVER_ACCESS_TOKEN> node bot.js` by copying the token given by Slack and Wit.ai.
8. Invite the bot to one of your team's channels with `/invite @<NAME_OF_YOUR_BOT>`.
9. Play with the bot. It will give a random fact every time a number is mentioned in a message. Or ask for a general, math, or date fact, with, for example:
    - Give me some general fact about one
    - What's with 10 as a date?
    - What can you tell me about twenty?
    - Tell me something interesting about 7
    - Give me a date fact about 4
    - Give me a math fact
10. If the bot doesn't recognize one of your messages, or you want it to recognize more phrases, you can train it on Wit.ai in the *Understanding* tab or by validating the messages on the *Inbox* tab.

# License
MIT
