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
    bot.reply(`Thank you for inviting me to channel ${message.channel.name}`);
});

// When someone reference a number in a message
controller.hears(['[0-9]+'], ['ambient'], (bot, message) => {
    var number = message.match[0];
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

        convo.ask('What kind of trivia do you want? GENERAL, MATH, or DATE',
        [
            // When the answer is general
            {
                pattern: 'general',
                callback: (response, convo) => {
                    askParameter(response, convo, 'Great, give me either a number or the keyword random');
                    convo.next();
                }
            },
            // When the answer is math
            {
                pattern: 'math',
                callback: (response, convo) => {
                    askParameter(response, convo, 'Great, give me either a number or the keyword random');
                    convo.next();
                }
            },
            // When the answer is date
            {
                pattern: 'date',
                callback: (response, convo) => {
                    askParameter(response, convo, 'Great, give me either a number, or a day of year in the form month/day (eg. 5/15), or the keyword random');
                    convo.next();
                }
            },
            // When no valid answer is provided
            {
                default: true,
                callback: (response, convo) => {
                    convo.repeat(); // just repeat the question
                    convo.next();
                }
            }
        ], { key: 'type' });

        askParameter = (response, convo, text) => { 
            convo.ask(text, (response, convo) => {
                convo.say('All right, let me see...');
                convo.next(); // End of the conversation
            }, { key: 'number' });
        };

        // When the conversations ends
        convo.on('end', convo => {
            // And the flow is completed
            if (convo.status=='completed') {
                // Extract all the responses in the form of a dictionary
                //let responses = convo.extractResponses();

                // Extract the specific responses by key
                let type  = convo.extractResponse('type').toLowerCase();
                let number  = convo.extractResponse('number').toLowerCase();
                
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
