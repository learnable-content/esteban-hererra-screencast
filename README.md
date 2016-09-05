# Slackbots and natural language

This Slackbot is a wrapper for the Numbers API that shows how to process natural language using Wit.ai and BotKit.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Slack account with administrative privileges
- A Wit.ai account
- [Node.js](https://nodejs.org/en/download/)

# Installation
1. Clone this branch and `cd` into it.
2. Go to https://my.slack.com/apps/build/custom-integration and create a Bot.
3. Copy the token given by Slack.
4. Go to Wit.ai and create a new app by importing `NumberBotApp.zip`.
5. Once the app is created and the circle next to its name is green, go to the Settings tab and copy your Server Access Token (if none is shown, create one by clicking the *Reset Token* icon).
4. Start the bot with `token=<YOUR_BOT_TOKEN> wit_token=<YOUR_WIT_AI_SERVER_ACCESS_TOKEN> node bot.js`.
5. Invite the bot to one of your team's channels with `/invite @<NAME_OF_YOUR_BOT>`.
6. Play with the bot. It will give a random fact every time a number is mentioned in a message. Or ask for a general, math, or date fact, with, for example:
    - Give me some general fact about one
    - What's with 10 as a date?
    - What can you tell me about twenty?
    - Tell me something interesting about 7
    - Give me a date fact about 4
    - Give me a math fact
7. If the bot doesn't recognize one of your messages, or you want it to recognize more phrases, you can train it on Wit.ai in the *Understanding* tab or by validating the messages on the *Inbox* tab.

# License
MIT
