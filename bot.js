const Botkit = require('botkit');
const request = require('superagent');
const Wit = require('node-wit').Wit;
const Log = require('node-wit').log;
const config = require('./config');


// Server port for outcoming webhook and slack command
const port = process.env.PORT || 3000;

// Creates the Slack bot
const controller = Botkit.slackbot({
  debug: false,
  retry: Infinity, // reconnect to Slack RTM when connection goes bad
});

// Starts the websocket connection with the incoming webhook configuration
const beepboop = require('beepboop-botkit').start(controller, { debug: true });

// Send the user who added the bot to their team a welcome message the first time it's connected
beepboop.on('botkit.rtm.started', (bot, resource, meta) => {
  const slackUserId = resource.SlackUserID;

  if (meta.isNew && slackUserId) {
    bot.startPrivateConversation({ user: slackUserId }, (err, convo) => {
      if (err) {
        console.log(err);
      } else {
        convo.say('I am a bot that has just joined your team');
        convo.say('You must now /invite me to a channel so that I can be of use!');
      }
    });
  }
});


// Outcoming webhook and slack command specific code
controller.setupWebserver(port, (err, expressWebserver) => {
  controller.createWebhookEndpoints(expressWebserver, [process.env.SLACK_VERIFY_TOKEN]);
});


controller.on('slash_command', (bot, message) => {
  let number;

  if (message.text !== '') {
    number = message.text;
  } else {
    number = Math.floor(Math.random() * 100);
  }

  // Immediately reply a confirmation to user
  bot.replyPrivate(message, 'Command received...');

  request
    .get(`http://numbersapi.com/${number}`)
    .end((err, res) => {
      if (err) {
        bot.replyPrivateDelayed(message, 'Got an error, can you try again with a valid number?');
      } else {
        bot.replyPrivateDelayed(message, res.text);
      }
    }
  );
});


// Incoming webhook specific code
const sendTrivia = () => {
  const date = new Date();
  const today = `${date.getMonth() + 1}/${date.getDate()}`;

  request
    .get(`http://numbersapi.com/${today}/date`)
    .end((err, res) => {
      if (err) {
        console.error('Got an error from the Numbers API: ', err.stack || err);
      } else {
        // Send the webhook to all teams
        Object.keys(beepboop.workers).forEach((id) => {
          // this is an instance of a botkit worker
          const bot = beepboop.workers[id].worker;

          if (bot.config.SlackIncomingWebhookURL) {
            bot.configureIncomingWebhook({ url: bot.config.SlackIncomingWebhookURL });
            bot.sendWebhook({
              text: res.text,
            },
            (webhookErr, webhookRes) => {
              if (webhookErr) {
                console.error('Got an error when sending the webhook: ', webhookErr.stack || webhookErr);
              } else {
                console.log(webhookRes);
              }
            });
          }
        });
      }
    }
  );
};

// Send an incoming webhook every X milliseconds
const interval = config.SEND_TRIVIA_FREQ_MS;
setInterval(sendTrivia, interval);


// Listening for the event when the bot joins a channel
controller.on('channel_joined', (bot, { channel: { id, name } }) => {
  bot.say({
    text: `Thank you for inviting me to channel ${name}`,
    channel: id,
  });
});

// When someone reference a number in a message
controller.hears(['[0-9]+'], ['ambient'], (bot, message) => {
  const [number] = message.match;
  request
    .get(`http://numbersapi.com/${number}`)
    .end((err, res) => {
      if (!err) {
        bot.reply(message, res.text);
      }
    });
});

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {userId, context: sessionState, botObject, messageObject}
const sessions = {};

const maybeCreateSession = (userId, bot, message) => {
  if (!sessions[userId]) {
    // No session found for user, let's create a new one
    sessions[userId] = {
      userId,
      context: {},
      bot,
      message,
    };
  }

  return userId;
};

// Extract an entity value from the entities returned by Wit
const firstEntityValue = (entities, entity) => {
  const match = entities && entities[entity];
  const isFullArray = Array.isArray(match) && match.length > 0;
  const val = isFullArray ? match[0].value : null;

  if (!val) {
    return null;
  }

  return typeof val === 'object' ? val.value : val;
};

// Our bot actions
const actions = {
  send(req, res) {
    // Our bot has something to say!
    // Let's retrieve the bot and message objects to post a message
    const { bot, message } = sessions[req.sessionId];
    const text = res.text;

    // We return a promise to let our bot know when we're done sending
    return new Promise((resolve) => {
      bot.reply(message, text);
      return resolve();
    });
  },
  getTrivia({ context, entities }) {
    return new Promise((resolve) => {
      const intent = firstEntityValue(entities, 'intent');
      const rawType = firstEntityValue(entities, 'type');
      const random = firstEntityValue(entities, 'random');

      const type = (rawType
          ? rawType !== 'general' ? rawType : ''
          : context.type)
        || '';
      const number = random ? 'random' : firstEntityValue(entities, 'number');
      const newContext = Object.assign({}, context);

      if ((intent && intent === 'trivia') || number) {
        if (number) {
          // Make the request to the API
          request
            .get(`http://numbersapi.com/${number}/${type}`)
            .end((err, { text }) => {
              if (err) {
                newContext.response = 'Sorry, I couldn\'t process your request';
              } else {
                newContext.response = text;
              }
              newContext.done = true;
              delete newContext.missingNumber;

              return resolve(newContext);
            }
          );
        } else {
          newContext.type = type;
          newContext.missingNumber = true;

          return resolve(newContext);
        }
      } else {
        newContext.response = 'Sorry, I didn\'t understand what you want. I\'m still just a bot, ' +
          'can you try again?';
        newContext.done = true;

        return resolve(newContext);
      }
    });
  },
};

// Setting up our bot
const wit = new Wit({
  accessToken: process.env.wit_token,
  actions,
  logger: new Log.Logger(Log.INFO),
});

controller.hears(['(.*)'], ['direct_mention', 'mention'], (bot, message) => {
  const [text] = message.match;

  // We retrieve the user's current session, or create one if it doesn't exist
  // This is needed for our bot to figure out the conversation history
  const sessionId = maybeCreateSession(message.user, bot, message);

  // Let's forward the message to the Wit.ai Bot Engine
  // This will run all actions until our bot has nothing left to do
  wit.runActions(
    sessionId, // the user's current session
    text, // the user's message
    sessions[sessionId].context // the user's current session state
  ).then((context) => {
    // Our bot did everything it has to do.
    // Now it will be waiting for further user messages to proceed.

    // Based on the session state, you might want to reset or update the session.
    if (context.done) {
      delete sessions[sessionId];
    } else {
      // Updating the user's current session state
      sessions[sessionId].context = context;
    }
  })
    .catch((err) => {
      console.error('Got an error from Wit: ', err.stack || err);
    });
});
