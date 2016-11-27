# Natural Language Processing with LUIS.ai

This app shows how you a Skype bot can process natural language using a LUIS.ai model.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Microsoft Account.
- A [Movie DB](https://www.themoviedb.org) account with a free developer API key
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.
- A [LUIS.ai](https://www.luis.ai) account.
- To test the bot, either a Skype account and [Ngrok](https://ngrok.com/) or the Microsoft Bot Framework Emulator.

# Installation
1. Fork this repository into your own Github account.
2. Login to [LUIS.ai](https://www.luis.ai) and import the file `MovieBotLuisApp.json` to create a new app.
3. Once the app is created, click on *Train* and then *Publish*.
4. Copy the App Id and the Subscription Key (shown in the example URL when the app is published).
5. Start Ngrok in a console window using `ngrok http 3978` and copy the HTTPS URL you're given.
6. Go to https://dev.botframework.com/ and register a new bot with the following information:
   - Name: MovieBot (any name would do)
   - Bot handle: Any available handle (cannot be changed later)
   - Description: A bot that gives movies information (any description would do)
   - Messaging endpoint: https://[NGROK_URL]/api/messages (for example, https://e2d58786.ngrok.io/api/messages)
7. Copy the MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD keys (your password is only shown one time).
8. Start the app with something like MOVIE_DB_API_KEY=xxxxxx MICROSOFT_APP_ID=xxxxxx MICROSOFT_APP_PASSWORD=xxxxxx LUIS_APP_ID=xxxx LUIS_API_KEY=xxxx node bot.js.
9. To test the  bot, log in to Skype and add the bot from your bot's dashboard with the *Add to Skype button* or start the Microsoft Bot Framework Emulator and enter your Microsoft App Id and password. 
10. Play with the bot by asking for movie recommendations with messages like:
    - Give me a comedy movie
    - Give me a documentary from 2001
    - What's the most popular movie from 2010?
    - What are the best 3 documentaries from 2010?
    - Can you suggest 5 actions movies?
11. The bot should recognize the genre, the year, the number of movies to show, and the sort criteria (by votes or popularity). If a message is not recognized correctly, you can train the LUIS model with new utterances. 

# License
MIT

![Powered by https://www.themoviedb.org](https://www.themoviedb.org/assets/9b3f9c24d9fd5f297ae433eb33d93514/images/v4/logos/408x161-powered-by-rectangle-green.png)

