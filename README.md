# Twitch Streams

Twitch Streams is a Twitch client built using DialogFlow, and runs on the following platforms:

* Google Assistant (Home, Phones)


## Activating Twitch Streams

Twitch Streams can be activated by speaking the following to your Google Assistant:

> "Ok Google, talk to Twitch Streams"

This will cause the assistant to load Twitch Streams and until your conversation is complete, you will be speaking directly to it, and not Google.

If you are not signed in, Twitch Streams will welcome you, and explain the basic commands you can ask of it. If you are signed in, Twitch Streams will automatically tell you who the top 5 streamers that are live that you follow are.

### Asking Twitch Streams questions directly

Any command that Twitch Streams offers can be invoked directly like so:

> "Ok Google, ask Twitch streams who's streaming."
>
> "Ok Google, ask Twitch Streams about King Gothalion"



## Sign In

Linking your Twitch account to Twitch Streams allows you to access your own personalized content on Twitch. The app will work without signing in, but you will not  have access to personalized features.

> "(Sign in / Log in)"

This command will start the sign in process for you if you have not yet signed in. If you have, the app will let you know, and not take any action.

In order for this command to work, you must have a phone associated with your Google account. The command will prompt you to go to your phone, and answer a notification that you will receive, and complete the login process that it walks you through. After this process if complete, all of the Twitch Streams features will be available to you.

> "Am I signed in?"

> "My Account"

This command will tell you if you are currently signed in. If so it will tell you the name of your Twitch account and other related information.

## Live Streams

The primary function of the Twitch Streams app is to tell you what streamers are streaming live on Twitch , and then point you to them for viewing.


> "Who's (streaming / live / online)?"

This command behaves diferently depending on if you are signed in or not:

If not, the app will respond with a list of the top streams (in terms of current viewers) on Twitch right now.

If you are signed in, then the app will respond with a list of streams you follow that are live right now.

> "Who's (streaming /playing) {game}?"

This command does the same thing as the on above, but limits the results to the named game. If you are not signed in, then the resulting list is the top streams for that specific game. If you are logged in, then it will be a list of all streams you follow playing that game.

### sub-commands:

> "Select {channel name}"

> "Pick the first one"

> "Read them all"

## Specific Streamers/Channels

Twitch Streams can give you detailed information on specific streamers you're interested in. Simply ask the following:

> "Tell me about {channel name}"

This will lookup the channel by name using Twitch search, and return the top result.

If the channel is live, you will be told about the status of the stream, what directory it is in, and how many people are watching. If the channel is not live, you will be given details about the channel itself.

### sub-commands

> "Play it"

> "Next"

> "Refer to channel as {spoken name}"

## Top Games

You can ask Twitch Streams what the top games on Twitch are right now:

> "What are the top games?"

> "What are the top 5 games?"

Twitch Streams will read you the list of games and tell you how many channels and how many viewers are currently
