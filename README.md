# Skype Calling API

This app presents a Skype bot that can process voice calls to give a movie recommendation.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Microsoft Account.
- A [Movie DB](https://www.themoviedb.org) account with a free developer API key
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.
- To test the bot, a Skype account and [Ngrok](https://ngrok.com/).

# Installation
1. Fork this repository into your own Github account.
2. Start Ngrok in a console window using `ngrok http 3978` and copy the HTTPS URL you're given.
3. Go to https://dev.botframework.com/ and register a new bot with the following information:
   - Name: MovieBot (any name would do)
   - Bot handle: Any available handle (cannot be changed later)
   - Description: A bot that gives movies information (any description would do)
   - Messaging endpoint: https://[NGROK_URL]/api/messages (for example, https://e2d58786.ngrok.io/api/messages)
4. Copy the MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD keys (your password is only shown one time).
5. Start the app with something like MOVIE_DB_API_KEY=xxxxxx MICROSOFT_APP_ID=xxxxxx MICROSOFT_APP_PASSWORD=xxxxxx CALLBACK_URL=https://[NGROK_URL]/api/calls node callingBot.js.
6. Once the bot is registered, in the Channel section in your bot's dashboard, edit the settings of the Skype channel, activating the option calls and entering in the *Calling Webhook* field the calling endpoint with the ngrok URL (https://[NGROK_URL]/api/calls)  
7. To test the  bot, log in to Skype and add the bot from your bot's dashboard with the *Add to Skype button*.
8. Call the bot and follow the prompts. 

# License
MIT

![Powered by https://www.themoviedb.org](https://www.themoviedb.org/assets/9b3f9c24d9fd5f297ae433eb33d93514/images/v4/logos/408x161-powered-by-rectangle-green.png)

