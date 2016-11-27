const builder = require('botbuilder');
const restify = require('restify');
const mdb = require('moviedb')(process.env.MOVIE_DB_API_KEY);

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

const intents = new builder.IntentDialog();
bot.dialog('/', intents);

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

const getMovie = (session) => {
  // Send typing message
  session.sendTyping();

  // Call the Movie DB API passing the genre and release year and sorting by popularity
  mdb.discoverMovie({
    sort_by: 'popularity.desc',
    with_genres: session.dialogData.genre,
    primary_release_year: session.dialogData.year,
  }, (err, res) => {
    const msg = new builder.Message(session);
    // If there's no error
    if (!err) {
      const movies = res.results;
      // Choose a random movie from the array of movies
      const index = Math.floor(Math.random() * movies.length);

      msg.text('I found this movie: \n\n**%(title)s**\n\n*%(overview)s*', movies[index]);

      // If the movie has a poster image
      if (movies[index].poster_path) {
        // Add the image as a message attachment
        msg.attachments([{
          contentType: 'image/jpeg',
          contentUrl: imagesBaseUrl + posterSize + movies[index].poster_path,
        }]);
      }
    } else { // There's an error
      msg.text(`Oops, an error, can you please say 'movie' again?`);
    }

    // End the dialog
    session.endDialog(msg);
  });
};

// If there's no match
intents.onDefault([
  (session, args, next) => {
    if (!session.userData.name) {
      // Begin the askName dialog
      session.beginDialog('/askName');
    } else {
      // Execute the next function
      next();
    }
  },
  session =>
    session.send(`I'm new around here %s. I only know the 'movie' command, say it if you want a movie recommendation`, session.userData.name),
]);

// askName dialog
bot.dialog('/askName', [
  session =>
    builder.Prompts.text(session, `Hi! I'm MovieBot. What's your name?`),
  (session, results) => {
    // Store the user's name on the userData session attribute
    session.userData.name = results.response;
    session.endDialog('Hello %s', session.userData.name);
  },
]);

// When a user message matches 'movie'
intents.matches(/^movie/i, [
  // First ask for the genere
  session =>
    session.beginDialog('/genrePrompt'),
  // Then ask for the release year
  (session, results) => {
    if (results.response.id > 0) {
      session.dialogData.genre = results.response.id;
      session.beginDialog('/yearPrompt');
    } else { // If the user chose the quit option
      session.send('Okay, maybe next time');
      session.endDialog();
    }
  },
  // Finally call the Movie DB API
  (session, results) => {
    session.dialogData.year = results.response;
    getMovie(session);
  },
]);

// Genre Prompt Dialog
bot.dialog('/genrePrompt', [
  session =>
    builder.Prompts.choice(session, 'What genre would you like?', genres),
  (session, results) => {
    // Use the genre choosen by the user as the index
    const choice = genres[results.response.entity.toLowerCase()];

    session.endDialogWithResult({ response: choice });
  },
]);

// Year Prompt Dialog
bot.dialog('/yearPrompt', [
  session =>
    builder.Prompts.text(session, `Enter a release year (in the format yyyy) if you want to specify one or just respond with something like 'no' otherwise`),
  (session, results) => {
    // there's a match for something that seems like a year?
    const matched = results.response.match(/\d{4}/g);

    session.endDialogWithResult({ response: matched });
  },
]);

