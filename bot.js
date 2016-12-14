const builder = require('botbuilder');
const restify = require('restify');
const mdb = require('moviedb')(process.env.MOVIE_DB_API_KEY);
const wordsToNum = require('words-to-num');
const request = require('superagent');
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
    const msg = new builder.Message(session);

    // If there's no error
    if (!err) {
      const movies = res.results;
      let number = session.dialogData.number ? session.dialogData.number : 1;
      let startIndex = 0;
      const maxMoviesToShow = 20;

      /* For simplicity, we only show a max of 20 movies
         (the first page of results returned by the API) */
      if (number > maxMoviesToShow) {
        number = maxMoviesToShow;
        session.send(`Sorry, I can only show the first ${maxMoviesToShow} movies:\n\n`);
      } else if (number === 1) {
        /* If the user only requested one movie
          let's randomly choose one */
        startIndex = Math.floor(Math.random() * maxMoviesToShow);
        number = startIndex + 1;
      }

      const cards = [];

      movies.slice(startIndex, number).forEach((movie) => {
        const card = new builder.HeroCard(session);
        card.title(movie.title);
        card.text(movie.overview);

        // If the movie has a poster image
        if (movie.poster_path) {
          // Add the image as a message attachment
          const imgUrl = `${imagesBaseUrl}${posterSize}${movie.poster_path}`;
          card.images([
            builder.CardImage.create(session, imgUrl)
              .tap(builder.CardAction.showImage(session, imgUrl)),
          ])
          .buttons([
            builder.CardAction.openUrl(session, `https://www.themoviedb.org/movie/${movie.id}`, 'Movie Information'),
          ]);
          cards.push(card);
        }
      });

      msg.attachmentLayout(builder.AttachmentLayout.carousel).attachments(cards);
    } else { // There's an error
      msg.text('Oops, an error, can you please try again?');
    }

    // End the dialog
    session.endDialog(msg);
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
    builder.Prompts.text(session, `Hi ${session.userData.name}. How are you?`),
  (session, results) => {
    // Call the Text Analytics API
    request
      .post('https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment')
      .send({
        // It takes an array of documents
        documents: [
          {
            language: 'en',
            id: '1', // a unique identifier is required
            text: results.response,
          },
        ],
      })
      // The API key
      .set('Ocp-Apim-Subscription-Key', process.env.TEXT_ANALYTICS_API_KEY)
      // The API only accepts JSON for now
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        if (!err) {
          console.log(res.body);
          // If there's a positive sentiment
          if (res.body.documents[0].score > 0.6) {
            session.send('Good');
          } else { // If there's a negative sentiment
            session.send(`I'm detecting a negative sentiment, maybe a funny movie can cheer you up?`);

            session.dialogData.genre = genres.comedy.id;
            getMovie(session);
          }
        }

        session.send('I know about movies, so ask me for recommendations if you want');
      });
  },
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
    const numberEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
    const dateEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');

    // If there's a genre, find the best match to extract the correct genre object
    if (genreEntity) {
      const match = builder.EntityRecognizer.findBestMatch(genres, genreEntity.entity);
      const genreObj = match ? genres[match.entity] : null;
      session.dialogData.genre = genreObj ? genreObj.id : null;
    }

    // If there's a date, parse it to get the year
    if (dateEntity) {
      /* We need to parse the date because LUIS doesn't return a date instace or timestamp,
       but a string */
      const date = Date.parse(dateEntity.resolution.date);
      session.dialogData.year = date ? date.getFullYear() : null;
    }

    // If there's a number, that number shouldn't be the year
    if (numberEntity) {
      /* Numbers are returned by LUIS as they are entered, for example, "one",
        so let's try to convert it to a digit just in case */
      const num = wordsToNum.convert(numberEntity.entity);
      /* If the year is a number, like 2015, is recognized by LUIS  as both, a date and a number,
        so let's check if the returned number entity is equal to the year to discard it */
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
    session.endDialog();
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

