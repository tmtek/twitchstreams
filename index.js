const {Convo, Say} = require('@tmtek/convo');
const {Twitch} = require('@tmtek/twitch');

const TwitchStreamsApp = {
  clientId : "",
  contexts:{
    streams:"list_streams",
    games:"list_games",
    list_index:"list_index",
    stream_selected:"stream_selected"
  },
  newTwitch: function(convo) {
    let authToken = TwitchStreamsApp.util.getAuthToken(convo.conv);
    return new Twitch(TwitchStreamsApp.clientId).authToken(authToken);
  },
  util:{
    stringVarIsNotEmpty: function(stringvar) {
      return stringvar && stringvar.trim() !== "";
    },
    simplifyStreams: function(streams) {
      return streams.map((stream) => TwitchStreamsApp.util.simplifyStream(stream));
    },
    simplifyStream: function(stream) {
      const r = {};
      r.game = stream.game;
      r.viewers = stream.viewers;
      r.preview = {};
      r.preview.large = stream.preview.large;
      r.channel = TwitchStreamsApp.util.simplifyChannel(stream.channel);
      return r;
    },
    simplifyChannel: function(channel) {
      const r = {};
      r._id = channel._id;
      r.name = channel.name;
      r.display_name = channel.display_name;
      r.status = channel.status;
      r.logo = channel.logo;
      return r;
    },
    isAuthenticated: function (conv) {
        if (conv.user && conv.user.access && conv.user.access.token) {
            return true;
        }
        return false;
    },
    getAuthToken: function (conv) {
        if (conv.user && conv.user.access && conv.user.access.token) {
            return conv.user.access.token;
        }
      return null;
    },
    getStreamsFromResponse:function(json) {
        if(json !== null && json.streams !== null) {
            return TwitchStreamsApp.util.simplifyStreams(json.streams);
        }
        return null;
    },
    getTopGamesFromResponse:function(json) {
        if(json !== null && json.top !== null) {
            return json.top;
        }
        return null;
    },
    getStreamByChannelName: function(channel, streams) {
      for (var i = 0; i < streams.length; i++) {
          const stream = streams[i];
          if (stream.channel.display_name.toLowerCase() === channel.toLowerCase()) {
              return streams[i];
          }
      }
      return null;
    },
    getStreamsForGame:function(streams, game) {
        var gamesToShow = [];
        for (var i = 0; i < streams.length; i++) {
            const stream = streams[i];
            if (!TwitchStreamsApp.util.stringVarIsNotEmpty(game) || stream.game.toLowerCase() === game.toLowerCase()) {
                gamesToShow.push(streams[i]);
            }
        }
        return gamesToShow;
    },
    checkChannelForRename: function(conv, channel) {
      if (
        conv.user.storage &&
        conv.user.storage.rename_channels &&
        TwitchStreamsApp.util.stringVarIsNotEmpty(conv.user.storage.rename_channels[channel.display_name])
      ) {
        return conv.user.storage.rename_channels[channel.display_name];
      }
      return channel.display_name;
    },
    checkSpokenChannelForRename: function(conv, query) {
      if (
        conv.user &&
        conv.user.storage &&
        conv.user.storage.rename_channels
      ) {
        for(var name in conv.user.storage.rename_channels) {
          if (conv.user.storage.rename_channels[name].toLowerCase() === query.toLowerCase()) {
            return name;
          }
        }
      }
      return query;
    },
    cleanChannelName: function(conv, channel) {
      return TwitchStreamsApp.util.checkSpokenChannelForRename(conv, channel).split(" ").join("");
    },
  },
  responses: {
    streamSpeech: function(convo, stream) {
        const stream_name = TwitchStreamsApp.util.checkChannelForRename(convo.conv, stream.channel);
        const stream_game = stream.game;
        const stream_viewers = stream.viewers;
        const stream_title = stream.channel.status;
        return Say
          .sentence(`${stream_name} is streaming ${stream_game} for ${stream_viewers} viewers.`)
          .sentence(`The stream is titled: ${stream_title}`);
    },
    streamCard: function(convo, stream) {
        const stream_name = stream.channel.name;
        const stream_displayname = stream.channel.display_name;
        const stream_game = stream.game;
        const stream_viewers = stream.viewers;
        const stream_title = stream.channel.status;
        const stream_logo = stream.preview.large;
        return Convo.BasicCard({
            subtitle: "Playing: " +stream_game + " | " + stream_viewers + " Viewers | " + stream_title,
            title: stream_displayname,
            buttons: Convo.Button({
              title: 'Watch Now!',
              url: "https://www.twitch.tv/" + stream_name,
            }),
            image: Convo.Image({
              url: stream_logo,
              alt: 'Channel Logo',
            }),
            display: 'CROPPED',
          });
    },
    channelCard: function(channel) {
        const name = channel.name;
        const displayname = channel.display_name;
        const status = channel.status;
        const logo = channel.logo;
        const followers = channel.followers;
        const directory = channel.game;

        return Convo.BasicCard({
          text:`Followers: ${followers} | Directory: ${directory} | Status: ${status}`,
          title: displayname,
          buttons: Convo.Button({
            title: 'Visit Channel',
            url: "https://www.twitch.tv/" + name,
          }),
          image: Convo.Image({
            url: logo,
            alt: 'Channel Logo',
          }),
          display: 'CROPPED',
        });
    },
    responseForGames: function(convo, games) {
      const speech = new Say();
      var card = null;
      if (games) {
        var cardListItems = {};
        for (var x = 0; x < games.length; x++) {
          const playedGame = games[x];
          const game_name = playedGame.game.name;
          const game_channels = playedGame.channels;
          const game_viewers = playedGame.viewers;
          const game_art = playedGame.game.box.large;
          speech.sentence(`${game_name} is being streamed by ${game_channels} channels for ${game_viewers} viewers.`);
          cardListItems[x+""] = {
              title : game_name,
              description : `${game_channels} Channels | ${game_viewers} Viewers.`,
              image : Convo.Image({
                  url: game_art,
                  alt: 'channel logo',
                })
          };
        }
        return convo
        .speak(speech, false)
        .present(Convo.List({title: "Games:", items: cardListItems}), 'actions.capability.SCREEN_OUTPUT');
      } else {
        return convo.speak(
          speech.sentence("Can't get your streams right now. Anything else I can do for you?")
        );
      }
    },
    responseForStreams: function(convo, streams, speakLength) {
      const speech = new Say();
      if (streams) {
        var richListItems = {};
        const channelsToSpeak = speakLength <= 0 ? streams.length : Math.min(speakLength, streams.length);
        for (var x = 0; x < streams.length; x++) {
          const stream = streams[x];

          const stream_id = stream.channel._id;
          const stream_name = stream.channel.display_name;
          const stream_status = stream.channel.status;
          const stream_icon = stream.channel.logo;
          const stream_game = stream.game;
          const stream_viewers = stream.viewers;

          if (x < channelsToSpeak) {
            speech.sentence(TwitchStreamsApp.util.checkChannelForRename(convo.conv, stream.channel));
            if (x < channelsToSpeak - 1) {
                speech.append(",");
            } else {
              if (channelsToSpeak < streams.length) {
                const howManyMore = streams.length - channelsToSpeak;
                speech
                  .append(` and ${howManyMore} others.`)
                  .sentence("You can ask me to read the rest if you want to hear the entire list,")
                  .append(" or you can ask me to tell you about a specific channel.");
              } else {
                speech.append(".");
              }
            }
          }

          richListItems[x+""] = {
              title : stream_name,
              description : "Playing: " +stream_game + " | " + stream_viewers + " Viewers | " + stream_status,
              image : Convo.Image({
                  url: stream_icon,
                  alt: 'channel logo',
                })
          };
        }
        return convo
          .speak(speech, false)
          .present(Convo.List({title:"Streams:", items:richListItems}), 'actions.capability.SCREEN_OUTPUT');
      } else {
        return convo.speak(speech.sentence("There are no streams."));
      }

    },
    responseForLiveStream: function(convo, stream) {
      return convo
        .speak(TwitchStreamsApp.responses.streamSpeech(convo, stream))
        .present(TwitchStreamsApp.responses.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
    },
  },
  actions: {
    welcome: function(convo){
      return convo.speak("Welcome to Twitch Streams.")
        .promise(c =>
          TwitchStreamsApp.util.isAuthenticated(c.conv) ?
            TwitchStreamsApp.actions.whosStreaming(c) : c
        );
    },
    signin: function(convo){
      return convo.present(Convo.SignIn("Signing in will allow us to give you information on the channels and games you follow."));
    },
    signinConfirm : function(convo, signin){
      return convo.promise(() =>
        signin.status !== 'OK' ?
        convo.speak(Say
          .sentence("We failed to sign you in.")
          .sentence("Try again anytime by asking me to sign in.")
          )
        :
        convo.speak(Say
          .sentence("You are now signed into your Twitch account.")
          .sentence("What can I help you with?")
        )
      );
    },
    myAccount: function(convo){
      return convo.promise(() => {
        if (TwitchStreamsApp.util.isAuthenticated(convo.conv)) {
          let twitch = TwitchStreamsApp.newTwitch(convo);
          return twitch.user()
          .then((response) => {
            if (response.success) {
              return convo.speak(`You are logged in as ${response.data.name}. ${response.data.bio}`)
              .speak(`Your access token is ${twitch.authToken}`);
            } else {
              return convo.speak(`Not able to get you user info: ${response.message}`);
            }
          });
        } else {
          return convo
            .speak(Say
              .sentence("You haven't signed into your Twitch account.")
              .sentence("Ask me to sign in if you'd like to.")
            );
        }
      });
    },
    whosStreaming: function(convo, game, useFollowingIfAvailable = true) {
      let useFollowing = useFollowingIfAvailable && TwitchStreamsApp.util.isAuthenticated(convo.conv);
      let twitch = TwitchStreamsApp.newTwitch(convo);
      let fetchStream = useFollowing ? twitch.followedStreams() :twitch.topStreams(game);
      return fetchStream
      .catch(error => convo.speak("there was an error:" + error.toString()))
      .then((response) => {
          if(response.success && response.data) {
            var streams = TwitchStreamsApp.util.getStreamsFromResponse(response.data);
            const gameWasMentioned = TwitchStreamsApp.util.stringVarIsNotEmpty(game);
            if (gameWasMentioned) {
                streams = TwitchStreamsApp.util.getStreamsForGame(streams, game);
            }
            convo.setContext(TwitchStreamsApp.contexts.streams, 10, {list:streams});

            return convo
              .speak(
                useFollowing ?
                Say.sentence(`Here's a list of channels you follow that are live ${(gameWasMentioned ? "streaming " + game : "")}right now:`) :
                Say.sentence(`Here's a list of the top channels that are live right now ${(gameWasMentioned ? "streaming " + game : "")}:`)
              )
              .promise(c => TwitchStreamsApp.responses.responseForStreams(c, streams, 5));
          } else {
            if (response.requiresReauth === true) {
              /*
              return convo
                .speak(Say
                  .sentence("You are not signed in, so I can't get that for you.")
                  .sentence("Ask me to sign in, then we can try again.")
                );
                */
              return  this.whosStreaming(convo, game, false);
            } else {
              return convo
                .speak(Say
                  .sentence("Something went wrong while we were communicating with Twitch.")
                  .sentence("Give it another shot and see what happens.")
                  .sentence(response.message)
                );
            }
          }
        });

    },
    whosStreamingEntire: function (convo) {
      return convo
        .write("Streams:")
        .speak("Here's the entire list:", false)
        .promise(() =>
          TwitchStreamsApp.responses.responseForStreams(
            convo, convo.getContext(TwitchStreamsApp.contexts.streams).list, 0
          )
        );
    },
    selectStreamByPosition: function(convo, index = 0, correctForZeroIndex = true) {
      return convo.promise(() => {
          let streams = convo.getContext(TwitchStreamsApp.contexts.streams).list;
          if (streams) {
              let indexCorrection = correctForZeroIndex ? index -1 : index;
              let stream = streams[indexCorrection];
              convo.setContext(TwitchStreamsApp.contexts.list_index, 10, {index:indexCorrection});
              convo.setContext(TwitchStreamsApp.contexts.stream_selected, 5, {stream:stream});
              return TwitchStreamsApp.responses.responseForLiveStream(convo, stream);
          } else {
              return convo
              .speak(`You picked ${index} but I can't see the context.`);
          }
      });
    },
    selectNextStream: function(convo) {
      return convo.promise(() => {
        let context = convo.getContext(TwitchStreamsApp.contexts.list_index);
        var position = context.index;
        if (isNaN(position)) {
          position = -1;
        }
        let list = convo.getContext(TwitchStreamsApp.contexts.streams).list;
        if (list) {
          const nextPosition = position >= list.length -1 ? 0 : Number(position) + 1;
          return TwitchStreamsApp.actions.selectStreamByPosition(convo, nextPosition, false);
        } else {
          return convo.speak("I can't figure out which thing you wanted to pick.");
        }
      });
    },
    myChannel: function(convo) {
      if (TwitchStreamsApp.util.isAuthenticated(convo.conv)) {
        return TwitchStreamsApp.newTwitch(convo)
        .myChannel()
        .then((response) => {
          if (response.success) {
              const channel = response.data;
              return convo
                .write("Your channel:")
                .speak(Say
                  .sentence(`Your channel is called ${channel.display_name}.`)
                  .sentence(`You have ${channel.followers} followers.`)
                  .sentence(`Your current directory is ${channel.game}.`)
                  .sentence(`Your current status is: ${channel.status}.`),
                  false
                )
                .present(
                  TwitchStreamsApp.responses.channelCard(channel),
                  'actions.capability.SCREEN_OUTPUT'
                );
          } else {
            return convo
              .speak(`Couldn't get your channel:${response.message}`);
          }
        });
      } else {
        return convo
          .speak(Say
            .sentence("You haven't signed into your Twitch account.")
            .sentence("Ask me to sign in if you'd like to.")
          );
      }
    },
    searchForChannel: function(convo, query) {
      let twitch = TwitchStreamsApp.newTwitch(convo);
      return twitch.searchForChannel(query)
          .then((response)=>{
              if(response.success === true) {
                  let channels = response.data.channels;
                  if (channels && channels.length > 0) {
                      const channel = channels[0];
                      return twitch.streamForChannel(channel)
                      .then((response)=> {
                          if(response.success === true) {
                              let streams = response.data.streams;
                              if(streams && streams.length > 0) {
                                   const stream = streams[0];
                                   convo.setContext(TwitchStreamsApp.contexts.stream_selected, 5, {stream:stream});
                                   return convo
                                     .write(`${stream.channel.display_name}:`)
                                     .speak(TwitchStreamsApp.responses.streamSpeech(convo, stream), false)
                                     .present(TwitchStreamsApp.responses.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
                              } else {
                                  let channelName = TwitchStreamsApp.util.checkChannelForRename(convo.conv, channel);
                                   return convo
                                    .write(`${channelName}:`)
                                     .speak(Say
                                       .sentence(`${channelName} is not streaming right now.`)
                                       .sentence(`But the channel has ${channel.followers} followers, and the last game streamed was ${channel.game}.`)
                                       .sentence("Anything else you want to know about?"),
                                       false
                                     )
                                     .present(TwitchStreamsApp.responses.channelCard(channel), 'actions.capability.SCREEN_OUTPUT');
                              }
                          } else {
                              return convo
                                .speak(response.message);
                          }
                      });
                  }
              } else {
                return convo
                  .speak(`Can't find a channel for ${query}`);
              }
          });
    },
    checkLive: function(convo, query) {
      if (!query) {
        return convo.speak("Not sure who you want me to look for. Please ask again.");
      }
      const query_cleaned = TwitchStreamsApp.util.cleanChannelName(convo.conv, query);
      if (query_cleaned.toLowerCase() === "mychannel") {
        return convo.promise(() => TwitchStreamsApp.actions.myChannel(convo));
      }
      const streams = convo.getContext(TwitchStreamsApp.contexts.streams).list;
      if (streams) {
          const stream = TwitchStreamsApp.util.getStreamByChannelName(query_cleaned, streams);
          if (stream) {
            convo.setContext(TwitchStreamsApp.contexts.stream_selected, 5, {stream:stream});
            return convo
              .write(stream.channel.display_name)
              .speak(TwitchStreamsApp.responses.streamSpeech(convo, stream), false)
              .present(TwitchStreamsApp.responses.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
          }
          return TwitchStreamsApp.actions.searchForChannel(convo, query_cleaned);
      } else {
        return TwitchStreamsApp.actions.searchForChannel(convo, query_cleaned);
      }
    },
    playStream: function (convo){
      let streamSelected = convo.getContext(TwitchStreamsApp.contexts.stream_selected);
      if (streamSelected && streamSelected.stream) {
          const stream = streamSelected.stream;
          return convo.present(
              "Well... you do have a Watch Now link at the bottom of that card you are looking at. Use it!",
              'actions.capability.SCREEN_OUTPUT',
              {
                context:'I have a Watch Now Link for you.',
                notification:`Your Watch Now link for ${stream.channel.display_name}`
              }
          );
      }
      return convo.speak("There is no stream to play.");
    },
    playStreamFromRemote: function (convo, surface){
      if (surface.status === 'OK') {
        const context = convo.getContext(TwitchStreamsApp.contexts.stream_selected);
        if(context && context.stream) {
          return convo.speak("Here's that Watch Now link you requested:")
            .promise(() => TwitchStreamsApp.responses.streamCard(convo, context.stream));
        }
      }
      return convo.speak("Can't find a place to send your request.");
    },
    renameChannel: function (convo, newname) {
      let selectedStream = convo.getContext(TwitchStreamsApp.contexts.stream_selected).stream;
      if (!selectedStream) {
        return convo.speak(`There is no channel selected.`);
      }
      let storage = convo.getStorage();
      if (!storage.rename_channels) {
        storage.rename_channels = {};
      }
      storage.rename_channels[selectedStream.channel.display_name] = name;
      return convo.speak(`Ok, from now on I will refer to channel as:${newname}`);
    },
    topGames: function(convo, count){
      return convo.promise(() => {
        return TwitchStreamsApp.newTwitch(convo).topGames(count)
        .then((response)=> {
          if(response.success === true && response.data) {
            var games = TwitchStreamsApp.util.getTopGamesFromResponse(response.data);
            return convo
              .speak("Here's the top games on Twitch:")
              .promise(()=> TwitchStreamsApp.responses.responseForGames(convo, games));
          } else {
            return convo
              .speak(Say
                .sentence("Something went wrong while we were communicating with Twitch.")
                .sentence("Give it another shot and see what happens.")
                .sentence(response.message)
              );
          }
        });
      });
    },
    myStatus: function(convo, message){
      return convo.promise(() => {
        if (TwitchStreamsApp.util.isAuthenticated(convo.conv)) {
          let twitch = TwitchStreamsApp.newTwitch(convo);
          return twitch.myChannel()
          .then((response) => {
            if (response.success) {
                const channel = response.data;
                  return twitch.updateChannel(channel, {status:message})
                  .then((response) => {
                    if (response.success) {
                        return convo.speak(`Updated ${channel.display_name}'s status to: ${message}`);
                    } else {
                        return convo.speak(response.message);
                    }
                  });
            } else {
              return convo.speak(response.message);
            }
          });
        } else {
          return convo.speak(Say
            .sentence("You haven't signed into your Twitch account.")
            .sentence("You'll need to to udate your status.")
            .sentence("Ask me to sign in if you'd like to.")
          );
        }
      });
    },
    myGame: function(convo, game){
      return convo.promise(() => {
        if (TwitchStreamsApp.util.isAuthenticated(convo.conv)) {
          let twitch = TwitchStreamsApp.newTwitch(convo);
          return twitch.myChannel()
          .then((response) => {
            if (response.success) {
                const channel = response.data;
                  return twitch.updateChannel(channel, {game:game})
                  .then((response) => {
                    if (response.success) {
                        return convo.speak(`Updated ${channel.display_name}'s directory to: ${game}`);
                    } else {
                        return convo.speak(response.message);
                    }
                  });
            } else {
              return convo.speak(response.message);
            }
          });
        } else {
          return convo.speak(Say
            .sentence("You haven't signed into your Twitch account.")
            .sentence("You'll need to to udate your game.")
            .sentence("Ask me to sign in if you'd like to.")
          );
        }
      });
    }
  },
};

module.exports = {TwitchStreamsApp}
