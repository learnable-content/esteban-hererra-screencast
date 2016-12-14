const builder = require('botbuilder');
const calling = require('botbuilder-calling');
const restify = require('restify');
const mdb = require('moviedb')(process.env.MOVIE_DB_API_KEY);
const prompts = require('./prompts');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});
const bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create calling bot
const callingConnector = new calling.CallConnector({
  callbackUrl: process.env.CALLBACK_URL,
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});
const callingBot = new calling.UniversalCallBot(callingConnector);
server.post('/api/calls', callingConnector.listen());

// Get this information with mdb.configuration()
const imagesBaseUrl = 'https://image.tmdb.org/t/p/';
const posterSize = 'w185';

// Get the supported genres with mdb.genreList()
const genres = {
  action: {
    id: 28,
  },
  adventure: {
    id: 12,
  },
  animation: {
    id: 16,
  },
  comedy: {
    id: 35,
  },
  documentary: {
    id: 99,
  },
  drama: {
    id: 18,
  },
  horror: {
    id: 27,
  },
  mystery: {
    id: 9648,
  },
  romance: {
    id: 10749,
  },
  '(quit)': {
    id: 0,
  },
};

bot.dialog('/', [
  session =>
    builder.Prompts.text(session, 'Hi! Call me'),
]);

callingBot.dialog('/', [
  (session) => {
    // Build up a stack of prompts to play
    const promptList = [
      calling.Prompt.text(session, prompts.menu.prompt),
      calling.Prompt.text(session, prompts.menu.choices),
    ];

    // Prompt user to select a menu option
    calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(promptList), [
        { name: 'movie', speechVariation: ['movie', 'film'] },
        { name: 'quit', speechVariation: ['quit', 'end call', 'hangup', 'goodbye'] },
    ]);
  },
  (session, results) => {
    if (results.response) {
      if (results.response.entity === 'movie') {
        session.beginDialog('/callingGenrePrompt');
      } else {
        session.endDialog(prompts.goodbye);
      }
    } else {
      // Exit the menu
      session.endDialog(prompts.canceled);
    }
  },
  (session, result) => {
    if (result) {
      session.dialogData.genre = result.response.id;
    }
    session.beginDialog('/callingYearPrompt');
  },
  (session, result, next) => {
    if (result) {
      session.dialogData.year = result.response;
    }

    // Delete conversation field from address to trigger starting a new conversation.
    const address = session.message.address;
    delete address.conversation;

    mdb.discoverMovie({
      with_genres: session.dialogData.genre,
      primary_release_year: session.dialogData.year,
    }, (err, res) => {
      const msg = new builder.Message(session);
      // If there's no error
      if (!err) {
        const movies = res.results;
        // Choose a random movie from the array of movies
        const index = Math.floor(Math.random() * movies.length);

        msg.text(`I found this movie: \n\n**${movies[index].title}**\n\n*${movies[index].overview}*`);

        // If the movie has a poster image
        if (movies[index].poster_path) {
          // Add the image as a message attachment
          msg.attachments([{
            contentType: 'image/jpeg',
            contentUrl: `${imagesBaseUrl}${posterSize}${movies[index].poster_path}`,
          }]);
        }
      } else { // There's an error
        msg.text('Oops, an error ocurred trying to get the movie');
      }
      // Send message through chat bot
      bot.send(msg, () => next());
    });
  },
  session => session.endDialog(prompts.goodbye),
]);

callingBot.dialog('/callingGenrePrompt', [
  (session) => {
    calling.Prompts.choice(session, prompts.movie.prompt, [
        { name: 'action', dtmfVariation: '1' },
        { name: 'adventure', dtmfVariation: '2' },
        { name: 'animation', dtmfVariation: '3' },
        { name: 'comedy', dtmfVariation: '4' },
        { name: 'documentary', dtmfVariation: '5' },
        { name: 'drama', dtmfVariation: '6' },
        { name: 'horror', dtmfVariation: '7' },
        { name: 'mystery', dtmfVariation: '8' },
        { name: 'romance', dtmfVariation: '9' },
        { name: 'repeat', dtmfVariation: '0' },
    ]);
  },
  (session, results) => {
    if (results.response) {
      if (results.response.entity === 'repeat') {
        session.replaceDialog('/callingGenrePrompt');
      } else {
        const genreObj = genres[results.response.entity];
        session.send(prompts.result, results.response.entity);
        session.endDialogWithResult({ response: genreObj });
      }
    } else {
      session.endDialog(prompts.canceled);
    }
  },
]);

callingBot.dialog('/callingYearPrompt', [
  (session) => {
    calling.Prompts.digits(session, prompts.year.prompt, 4, { stopTones: '#' });
  },
  (session, results) => {
    if (results.response) {
      // Confirm the users account is valid length otherwise reprompt.
      if (results.response === '0') {
        session.send(prompts.year.none);
        session.endDialogWithResult({ response: '' });
      } else if (results.response.length === 4) {
        session.send(prompts.result, results.response);
        session.endDialogWithResult({ response: results.response });
      } else {
        session.send(prompts.year.invalid);
        session.replaceDialog('/callingYearPrompt');
      }
    } else {
      session.endDialog(prompts.canceled);
    }
  },
]);

