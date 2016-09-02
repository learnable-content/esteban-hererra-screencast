const Botkit = require('botkit');
const request = require('superagent');

// Cheking for the token
if (!process.env.token) {
    console.log('Error: Specify a token in an environment variable');
    process.exit(1);
}

// Creates the Slack bot
const controller = Botkit.slackbot();

// Creates the bot object
const bot = controller.spawn({
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

// When someone sends a message to the bot with the word trivia
controller.hears(['trivia'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    bot.startConversation(message, (err, convo) => {

        const askParameter = (response, convoAskParameter, text) => { 
            convoAskParameter.ask(text, (response, convoAsk) => {
                convoAsk.say('All right, let me see...');
                convoAsk.next(); // End of the conversation
            }, { key: 'number' });
        };

        convo.ask('What kind of trivia do you want? GENERAL, MATH, or DATE',
        [
            // When the answer is general
            {
                pattern: 'general',
                callback: (response, convoCallback) => {
                    askParameter(response, convoCallback, 'Great, give me either a number or the keyword random');
                    convoCallback.next();
                }
            },
            // When the answer is math
            {
                pattern: 'math',
                callback: (response, convoCallback) => {
                    askParameter(response, convoCallback, 'Great, give me either a number or the keyword random');
                    convoCallback.next();
                }
            },
            // When the answer is date
            {
                pattern: 'date',
                callback: (response, convoCallback) => {
                    askParameter(response, convoCallback, 'Great, give me either a number, or a day of year in the form month/day (eg. 5/15), or the keyword random');
                    convoCallback.next();
                }
            },
            // When no valid answer is provided
            {
                default: true,
                callback: (response, convoCallback) => {
                    convoCallback.repeat(); // just repeat the question
                    convoCallback.next();
                }
            }
        ], { key: 'type' });

        // When the conversations ends
        convo.on('end', convoEnd => {
            // And the flow is completed
            if (convoEnd.status=='completed') {
                // Extract all the responses in the form of a dictionary
                //let responses = convoEnd.extractResponses();

                // Extract the specific responses by key
                const type  = convoEnd.extractResponse('type').toLowerCase() !== 'general' 
                                    ? convoEnd.extractResponse('type').toLowerCase() 
                                    : '';
                const number  = convoEnd.extractResponse('number').toLowerCase();
                
                // Make the request to the API
                request
                    .get(`http://numbersapi.com/${number}/${type}`)
                    .end((err, res) => {
                        if(err) {
                            bot.reply(message, 'Sorry, I couldn\'t process your request');
                        } else {
                            bot.reply(message, res.text);
                        }
                    }
                );
            } else {
                bot.reply('Sorry, something happened that caused the conversation to stop prematurely');
            }

        });
    });

});
