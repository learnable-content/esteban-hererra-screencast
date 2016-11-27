const builder = require('botbuilder');
const restify = require('restify');
const mdb = require('moviedb')(process.env.MOVIE_DB_API_KEY);
const wordsToNum = require('words-to-num');
require('datejs');

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

const luisUrl = 'api.projectoxford.ai/luis/v1';
const luisModelUrl = `https://${luisUrl}/application?id=${process.env.LUIS_APP_ID}&subscription-key=${process.env.LUIS_API_KEY}`;

const recognizer = new builder.LuisRecognizer(luisModelUrl);
const intents = new builder.IntentDialog({ recognizers: [recognizer] });
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

  const params = {};

  if (session.dialogData.genre) {
    params.with_genres = session.dialogData.genre;
  }
  if (session.dialogData.sort) {
    params.sort_by = session.dialogData.sort === 'popularity' ? 'popularity.desc' : 'vote_average.desc';
  }
  if (session.dialogData.year) {
    params.primary_release_year = session.dialogData.year;
  }

  // Call the Movie DB API passing the genre and release year and sorting by popularity
  mdb.discoverMovie(params, (err, res) => {
    let msg = new builder.Message(session);

    // If there's no error
    if (!err) {
      const movies = res.results;
      let number = session.dialogData.number ? session.dialogData.number : 1;
      const maxMoviesToShow = 20;

      if (number > maxMoviesToShow) {
        number = maxMoviesToShow;
        session.send(`Sorry, I can only show the first ${maxMoviesToShow} movies:\n\n`);
      }

      movies.slice(0, number).forEach((movie) => {
        msg.text('**%(title)s**\n\n*%(overview)s*', movie);

        // If the movie has a poster image
        if (movie.poster_path) {
          // Add the image as a message attachment
          msg.attachments([{
            contentType: 'image/jpeg',
            contentUrl: imagesBaseUrl + posterSize + movie.poster_path,
          }]);
        }
        session.send(msg);
        msg = new builder.Message(session);
      });
    } else { // There's an error
      msg.text('Oops, an error, can you please try again?');
      session.send(msg);
    }

    // End the dialog
    session.endDialog();
  });
};

// If there's no match
intents.matches('Hello', [
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
    session.send('Hi %s. I know about movies, ask me for recommendations...', session.userData.name),
])

// When LUIS.ai couldn't match a better intent
.matches('None', (session) => {
  session.send(`Sorry I didn't understand, I'm a bot that only knows about movies`);
})

// When a user message matches the intent 'movie'
.matches('Movie', [
  (session, args, next) => {
    // Resolve and store any entities passed from LUIS.
    const genreEntity = builder.EntityRecognizer.findEntity(args.entities, 'genre');
    const sortPopularityEntity = builder.EntityRecognizer.findEntity(args.entities, 'sort::popularity');
    const numberEntity = builder.EntityRecognizer.findEntity(args.entities, 'number');
    const dateEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');

    // If there's a genre, find the best match to extract the correct genre object
    if (genreEntity) {
      const match = builder.EntityRecognizer.findBestMatch(genres, genreEntity.entity);
      const genreObj = match ? genres[match.entity] : null;
      session.dialogData.genre = genreObj ? genreObj.id : null;
    }

    // If there's a date, parse it to get the year
    if (dateEntity) {
      const date = Date.parse(dateEntity.resolution.date);
      session.dialogData.year = date ? date.getFullYear() : null;
    }

    // If there's a number, that number shouldn't be the year
    if (numberEntity) {
      // In case the number is a word, for example 'two', convert it to a digit
      const num = wordsToNum.convert(numberEntity.entity);
      session.dialogData.number = session.dialogData.year === num ? 1 : num;
    }

    session.dialogData.sort = sortPopularityEntity ? 'popularity' : 'votes';

    next();
  },
  // Then ask for the release year if none is recognized
  (session, results, next) => {
    if (!session.dialogData.year) {
      session.beginDialog('/yearPrompt');
    } else {
      next();
    }
  },
  // Finally call the Movie DB API
  (session, results) => {
    if (results && results.response) {
      session.dialogData.year = results.response;
    }
    getMovie(session);
  },
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

// Year Prompt Dialog
bot.dialog('/yearPrompt', [
  session =>
    builder.Prompts.text(session,
      `Enter a release year (in the format yyyy) if you want to specify one or just respond with something like 'no' otherwise`),
  (session, results) => {
    // there's a match for something that seems like a year?
    const matched = results.response.match(/\d{4}/g);

    session.endDialogWithResult({ response: matched });
  },
]);

