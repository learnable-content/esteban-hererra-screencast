const builder = require('botbuilder');
const restify = require('restify');
const mdb = require('moviedb')(process.env.MOVIE_DB_API_KEY);

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
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
  session.sendTyping();

  mdb.discoverMovie({
    sort_by: 'popularity.desc',
    with_genres: session.dialogData.genre,
    primary_release_year: session.dialogData.year,
  }, (err, res) => {
    const msg = new builder.Message(session);
    if (!err) {
      const movies = res.results;
      const index = Math.floor(Math.random() * movies.length);

      msg.text('I found this movie: \n\n**%(title)s**\n\n*%(overview)s*', movies[index]);

      if (movies[index].poster_path) {
        msg.attachments([{
          contentType: 'image/jpeg',
          contentUrl: imagesBaseUrl + posterSize + movies[index].poster_path,
        }]);
      }
    } else {
      msg.text('Oops, an error, can you please say \'movie\' again?');
    }

    session.endDialog(msg);
  });
};

intents.onDefault([
  (session, args, next) => {
    if (!session.userData.name) {
      session.beginDialog('/askName');
    } else {
      next();
    }
  },
  session =>
    session.send(`I'm new around here %s. I only know the 'movie' command, say it if you want a movie recommendation`, session.userData.name),
]);

bot.dialog('/askName', [
  session =>
    builder.Prompts.text(session, `Hi! I'm MovieBot. What's your name?`),
  (session, results) => {
    // should we be mutating the session like this?
    session.userData.name = results.response;
    session.endDialog('Hello %s', session.userData.name);
  },
]);

intents.matches(/^movie/i, [
  session =>
    session.beginDialog('/genrePrompt'),
  (session, results) => {
    if (results.response.id > 0) {
      session.dialogData.genre = results.response.id;
      session.beginDialog('/yearPrompt');
    } else {
      session.send('Okay, maybe next time');
      session.endDialog();
    }
  },
  (session, results) => {
    session.dialogData.year = results.response;
    getMovie(session);
  },
]);

bot.dialog('/genrePrompt', [
  session =>
    builder.Prompts.choice(session, 'What genre would you like?', genres),
  (session, results) => {
    const choice = genres[results.response.entity.toLowerCase()];

    session.endDialogWithResult({ response: choice });
  },
]);

bot.dialog('/yearPrompt', [
  session =>
    builder.Prompts.text(session, `Enter a release year (in the format yyyy) if you want to specify one or just respond with something like 'no' otherwise`),
  (session, results) => {
    const matched = results.response.match(/\d{4}/g);

    session.endDialogWithResult({ response: matched });
  },
]);

