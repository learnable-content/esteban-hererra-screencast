# Getting Started With Skype Bots

This app shows how you can create a simple Skype bot using the Node.js SDK for the Microsoft Bot Framework.

You can follow the [tutorial](http://sitepoint.com) to build this application or jump straight to the code.

# Requirements
- A Skype account.
- A Microsoft Account (live, outlook, msn, hotmail, etc).
- A [Movie DB](https://www.themoviedb.org) account with an API key
- [Ngrok](https://ngrok.com/).
- [Node.js](https://nodejs.org/en/download/) version 5 or higher.

# Installation
1. Fork this repository into your own Github account.
2. Start Ngrok in a console window using `ngrok http 3978` and copy the HTTPS URL you're given.
3. Go to https://dev.botframework.com/ and register a new bot with the Ngrok URL.
4. Copy the MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD keys (your password is only shown one time).
5. Start the app with something like MOVIE_DB_API_KEY=xxxxxx MICROSOFT_APP_ID=xxxxxx MICROSOFT_APP_PASSWORD=xxxxxx node bot.js.
6. Log in to Skype and add the bot from your bot's dashboard with the *Add to Skype button*. 
7. Play with the bot in Skype by saying `movie`.

# License
MIT
