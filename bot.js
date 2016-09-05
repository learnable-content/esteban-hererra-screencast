const Botkit = require('botkit');
const request = require('superagent');
const Wit = require('node-wit').Wit;
const log = require('node-wit').log;

// Cheking for the token
if (!process.env.token) {
    console.log('Error: Specify a Slack token in an environment variable');
    process.exit(1);
}

if (!process.env.wit_token) {
    console.log('Error: Specify a Wit token in an environment variable');
    process.exit(1);
}

// Creates the Slack bot
const controller = Botkit.slackbot();

// Starts the websocket connection
controller.spawn({
    token: process.env.token
}).startRTM();

// Listening for the event when the bot joins a channel
controller.on('channel_joined', (bot, message) => {
    bot.say({
        text: `Thank you for inviting me to channel ${message.channel.name}`,
        channel: message.channel.id
    });
});

// When someone reference a number in a message
controller.hears(['[0-9]+'], ['ambient'], (bot, message) => {
    const number = message.match[0];
    request
        .get(`http://numbersapi.com/${number}`)
        .end((err, res) => {
            if(!err) {
                bot.reply(message, res.text);
            }
        }
    );
});

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {userId: userId, context: sessionState, bot: botObject, message: messageObject}
const sessions = {};

const findOrCreateSession = (userId, bot, message) => {
    let sessionId = null;
    // Let's see if we already have a session for the user
    Object.keys(sessions).forEach(key => {
        if (sessions[key].userId === userId) {
            // Yep, got it!
            sessionId = key;
        }
    });
    if (!sessionId) {
        // No session found for user, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = {userId: userId, context: {}, bot: bot, message: message};
    }
    return sessionId;
};

//Extract an entity value from the entities returned by Wit
const firstEntityValue = (entities, entity) => {
    const val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value;
    
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

// Our bot actions
const actions = {
    send(req, res) {
        const sessionId = req.sessionId;
        const text = res.text;
        // Our bot has something to say!
        // Let's retrieve the bot and message objects to post a message
        const bot = sessions[sessionId].bot;
        const message = sessions[sessionId].message;
    
        // We return a promise to let our bot know when we're done sending
        return new Promise(function(resolve) {
            bot.reply(message, text);
            return resolve();
        });
    },
    getTrivia(req) {
        return new Promise(function(resolve) {
            const context = req.context; 
            const entities = req.entities;

            const intent = firstEntityValue(entities, 'intent');
            const rawType = firstEntityValue(entities, 'type');
            const type = (rawType
                        ? rawType !== 'general' ? rawType : ''
                        : context.type)
                     || '';
            const random = firstEntityValue(entities, 'random');
            const number = random ? 'random' : firstEntityValue(entities, 'number');
        
            if((intent && intent === 'trivia') || number) {
                if(number) {
                    // Make the request to the API
                    request
                        .get(`http://numbersapi.com/${number}/${type}`)
                        .end((err, res) => {
                            if(err) {
                                context.response =  'Sorry, I couldn\'t process your request';
                            } else {
                                context.response = res.text;
                            }
                            context.done = true;
                            delete context.missingNumber;
                            return resolve(context);
                        }
                    ); 
                }  else {
                    context.type = type;
                    context.missingNumber = true;
                    return resolve(context);
                }         
            } else {
                context.response = 'Sorry, I didn\'t understand what you want. I\'m still just a bot, can you try again?';
                context.done = true;
                return resolve(context);
            }
        });
    },
};

// Setting up our bot
const wit = new Wit({
    accessToken: process.env.wit_token,
    actions,
    logger: new log.Logger(log.INFO)
});

controller.hears(['(.*)'], ['direct_mention', 'mention'], (bot, message) => {
    const text = message.match[0];

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(message.user, bot, message);

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
