const {ConvoApp, Convo, Say} = require('@tmtek/convo');
const {Twitch} = require('@tmtek/twitch');

class TwitchStreamsApp extends ConvoApp {

  constructor(clientId) {
    super();
    this.clientId = clientId;
    this.contexts = {
      streams:"list_streams",
      games:"list_games",
      list_index:"list_index",
      stream_selected:"stream_selected"
    };
  }

  onRegisterIntents() {

    this.registerIntent('Default Welcome Intent', (convo, params, option, debug) => {
      return Convo.ask(this.welcome(convo), debug);
    });

    this.registerIntent('request_sign_in', (convo, params, option, debug) => {
        return Convo.ask(this.signin(convo), debug);
    });

    this.registerIntent('request_sign_in_confirmation', (convo, params, signin) => {
      return Convo.ask(this.signinConfirm(convo, signin), debug);
    });

    this.registerIntent('myaccount', (convo, params, option, debug) => {
      return Convo.ask(this.myAccount(convo), debug);
    });

    ///////////////////////////////////////////////
    //STREAMS LIST

    this.registerIntent('whos_streaming', (convo, {game}, option, debug) => {
      return Convo.ask(this.whosStreaming(convo, game), debug);
    });

    this.registerIntent('entire_list_streams', (convo) => {
      return Convo.ask(this.whosStreamingEntire(
        convo.speak("Here's all of them:")
      ));
    });

    this.registerIntent('back_to_list_streams', (convo) => {
      return Convo.ask(this.whosStreamingEntire(
        convo.speak("Here's the list again:")
      ));
    });

    this.registerIntent('select_stream_from_ui', (convo, params, option) => {
      return Convo.ask(this.selectStreamByPosition(
        convo, option, false
      ));
    });

    this.registerIntent('select_from_list', (convo, {position}) => {
      return Convo.ask(this.selectStreamByPosition(
        convo, position, true
      ));
    });

    this.registerIntent('next_from_list', (convo, params, option, debug) => {
      return Convo.ask(this.selectNextStream(convo), debug);
    });

    ///////////////////////////////////////////////
    //SELECTED STREAM

    this.registerIntent('check_live', (convo, {query}) => {
      return Convo.ask(this.checkLive(convo, query));
    });

    this.registerIntent('play_stream', (convo) => {
        return Convo.ask(this.playStream(convo));
    });

    this.registerIntent('play_remote_request', (convo, input, newSurface) => {
      return Convo.ask(this.playStreamFromRemote(convo, newSurface));
    });

    this.registerIntent('rename_channel', (convo, {newname}) => {
      return Convo.ask(this.renameChannel(convo, newname));
    });

    ///////////////////////////////////////////////
    //Games

    this.registerIntent('top_games', (convo, {count}) => {
      return Convo.ask(this.topGames(convo, count));
    });

    ///////////////////////////////////////////////
    //My Channel

    this.registerIntent('my_channel', (convo) => {
      return Convo.ask(this.myChannel(convo));
    });

    this.registerIntent('my_status', (convo, {message}) => {
      return Convo.ask(this.myStatus(convo, message));
    });

    this.registerIntent('my_game', (convo, {game}) => {
      return Convo.ask(this.myGame(convo, game));
    });
  }

  welcome(convo){
    return convo.speak("Welcome to Twitch Streams.")
      .promise(c =>
        this.isAuthenticated(c.conv) ?
          this.whosStreaming(c) : c
      );
  }
  signin(convo){
    return convo.present(Convo.SignIn("Signing in will allow us to give you information on the channels and games you follow."));
  }
  signinConfirm(convo, signin){
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
  }
  myAccount(convo){
    return convo.promise(() => {
      if (this.isAuthenticated(convo.conv)) {
        let twitch = this.newTwitch(convo);
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
  }
  whosStreaming(convo, game, useFollowingIfAvailable = true) {
    let useFollowing = useFollowingIfAvailable && this.isAuthenticated(convo.conv);
    let twitch = this.newTwitch(convo);
    let fetchStream = useFollowing ? twitch.followedStreams() :twitch.topStreams(game);
    return fetchStream
    .catch(error => convo.speak("there was an error:" + error.toString()))
    .then((response) => {
      if(response.success && response.data) {
        var streams = this.getStreamsFromResponse(response.data);
        const gameWasMentioned = this.stringVarIsNotEmpty(game);
        if (gameWasMentioned) {
            streams = this.getStreamsForGame(streams, game);
        }
        convo.setContext(this.contexts.streams, 10, {list:streams});

        return convo
          .speak(
            useFollowing ?
            Say.sentence(`Here's a list of channels you follow that are live ${(gameWasMentioned ? "streaming " + game : "")}right now:`) :
            Say.sentence(`Here's a list of the top channels that are live right now ${(gameWasMentioned ? "streaming " + game : "")}:`)
          )
          .promise(c => this.responseForStreams(c, streams, 5));
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
  }
  whosStreamingEntire(convo) {
    return convo
      .write("Streams:")
      .speak("Here's the entire list:", false)
      .promise(() =>
        this.responseForStreams(
          convo, convo.getContext(this.contexts.streams).list, 0
        )
      );
  }
  selectStreamByPosition(convo, index = 0, correctForZeroIndex = true) {
    return convo.promise(() => {
        let streams = convo.getContext(this.contexts.streams).list;
        if (streams) {
            let indexCorrection = correctForZeroIndex ? index -1 : index;
            let stream = streams[indexCorrection];
            convo.setContext(this.contexts.list_index, 10, {index:indexCorrection});
            convo.setContext(this.contexts.stream_selected, 5, {stream:stream});
            return this.responseForLiveStream(convo, stream);
        } else {
            return convo
            .speak(`You picked ${index} but I can't see the context.`);
        }
    });
  }
  selectNextStream(convo) {
    return convo.promise(() => {
      let context = convo.getContext(this.contexts.list_index);
      var position = context.index;
      if (isNaN(position)) {
        position = -1;
      }
      let list = convo.getContext(this.contexts.streams).list;
      if (list) {
        const nextPosition = position >= list.length -1 ? 0 : Number(position) + 1;
        return this.selectStreamByPosition(convo, nextPosition, false);
      } else {
        return convo.speak("I can't figure out which thing you wanted to pick.");
      }
    });
  }
  myChannel(convo) {
    if (this.isAuthenticated(convo.conv)) {
      return this.newTwitch(convo)
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
                this.channelCard(channel),
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
  }
  searchForChannel(convo, query) {
    let twitch = this.newTwitch(convo);
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
                               convo.setContext(this.contexts.stream_selected, 5, {stream:stream});
                               return convo
                                 .write(`${stream.channel.display_name}:`)
                                 .speak(this.streamSpeech(convo, stream), false)
                                 .present(this.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
                          } else {
                              let channelName = this.checkChannelForRename(convo.conv, channel);
                               return convo
                                .write(`${channelName}:`)
                                 .speak(Say
                                   .sentence(`${channelName} is not streaming right now.`)
                                   .sentence(`But the channel has ${channel.followers} followers, and the last game streamed was ${channel.game}.`)
                                   .sentence("Anything else you want to know about?"),
                                   false
                                 )
                                 .present(this.channelCard(channel), 'actions.capability.SCREEN_OUTPUT');
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
  }
  checkLive(convo, query) {
    if (!query) {
      return convo.speak("Not sure who you want me to look for. Please ask again.");
    }
    const query_cleaned = this.cleanChannelName(convo.conv, query);
    if (query_cleaned.toLowerCase() === "mychannel") {
      return convo.promise(() => this.myChannel(convo));
    }
    const streams = convo.getContext(this.contexts.streams).list;
    if (streams) {
        const stream = this.getStreamByChannelName(query_cleaned, streams);
        if (stream) {
          convo.setContext(this.contexts.stream_selected, 5, {stream:stream});
          return convo
            .write(stream.channel.display_name)
            .speak(this.streamSpeech(convo, stream), false)
            .present(this.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
        }
        return this.searchForChannel(convo, query_cleaned);
    } else {
      return this.searchForChannel(convo, query_cleaned);
    }
  }
  playStream(convo){
    let streamSelected = convo.getContext(this.contexts.stream_selected);
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
  }
  playStreamFromRemote(convo, surface){
    if (surface.status === 'OK') {
      const context = convo.getContext(this.contexts.stream_selected);
      if(context && context.stream) {
        return convo.speak("Here's that Watch Now link you requested:")
          .promise(() => this.streamCard(convo, context.stream));
      }
    }
    return convo.speak("Can't find a place to send your request.");
  }
  renameChannel(convo, newname) {
    let selectedStream = convo.getContext(this.contexts.stream_selected).stream;
    if (!selectedStream) {
      return convo.speak(`There is no channel selected.`);
    }
    let storage = convo.getStorage();
    if (!storage.rename_channels) {
      storage.rename_channels = {};
    }
    storage.rename_channels[selectedStream.channel.display_name] = name;
    return convo.speak(`Ok, from now on I will refer to channel as:${newname}`);
  }
  topGames(convo, count){
    return convo.promise(() => {
      return this.newTwitch(convo).topGames(count)
      .then((response)=> {
        if(response.success === true && response.data) {
          var games = this.getTopGamesFromResponse(response.data);
          return convo
            .speak("Here's the top games on Twitch:")
            .promise(()=> this.responseForGames(convo, games));
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
  }
  myStatus(convo, message){
    return convo.promise(() => {
      if (this.isAuthenticated(convo.conv)) {
        let twitch = this.newTwitch(convo);
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
  }
  myGame(convo, game){
    return convo.promise(() => {
      if (this.isAuthenticated(convo.conv)) {
        let twitch = this.newTwitch(convo);
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

  newTwitch(convo) {
    let authToken = this.getAuthToken(convo.conv);
    return new Twitch(this.clientId).authToken(authToken);
  }
  stringVarIsNotEmpty(stringvar) {
    return stringvar && stringvar.trim() !== "";
  }
  simplifyStreams(streams) {
    return streams.map((stream) => this.simplifyStream(stream));
  }
  simplifyStream(stream) {
    const r = {};
    r.game = stream.game;
    r.viewers = stream.viewers;
    r.preview = {};
    r.preview.large = stream.preview.large;
    r.channel = this.simplifyChannel(stream.channel);
    return r;
  }
  simplifyChannel(channel) {
    const r = {};
    r._id = channel._id;
    r.name = channel.name;
    r.display_name = channel.display_name;
    r.status = channel.status;
    r.logo = channel.logo;
    return r;
  }
  isAuthenticated(conv) {
      if (conv.user && conv.user.access && conv.user.access.token) {
          return true;
      }
      return false;
  }
  getAuthToken(conv) {
      if (conv.user && conv.user.access && conv.user.access.token) {
          return conv.user.access.token;
      }
    return null;
  }
  getStreamsFromResponse(json) {
      if(json !== null && json.streams !== null) {
          return this.simplifyStreams(json.streams);
      }
      return null;
  }
  getTopGamesFromResponse(json) {
      if(json !== null && json.top !== null) {
          return json.top;
      }
      return null;
  }
  getStreamByChannelName(channel, streams) {
    for (var i = 0; i < streams.length; i++) {
        const stream = streams[i];
        if (stream.channel.display_name.toLowerCase() === channel.toLowerCase()) {
            return streams[i];
        }
    }
    return null;
  }
  getStreamsForGame(streams, game) {
      var gamesToShow = [];
      for (var i = 0; i < streams.length; i++) {
          const stream = streams[i];
          if (!this.stringVarIsNotEmpty(game) || stream.game.toLowerCase() === game.toLowerCase()) {
              gamesToShow.push(streams[i]);
          }
      }
      return gamesToShow;
  }
  checkChannelForRename(conv, channel) {
    if (
      conv.user.storage &&
      conv.user.storage.rename_channels &&
      this.stringVarIsNotEmpty(conv.user.storage.rename_channels[channel.display_name])
    ) {
      return conv.user.storage.rename_channels[channel.display_name];
    }
    return channel.display_name;
  }
  checkSpokenChannelForRename(conv, query) {
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
  }
  cleanChannelName(conv, channel) {
    return this.checkSpokenChannelForRename(conv, channel).split(" ").join("");
  }

  streamSpeech(convo, stream) {
      const stream_name = this.checkChannelForRename(convo.conv, stream.channel);
      const stream_game = stream.game;
      const stream_viewers = stream.viewers;
      const stream_title = stream.channel.status;
      return Say
        .sentence(`${stream_name} is streaming ${stream_game} for ${stream_viewers} viewers.`)
        .sentence(`The stream is titled: ${stream_title}`);
  }
  streamCard(convo, stream) {
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
  }
  channelCard(channel) {
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
  }
  responseForGames(convo, games) {
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
  }
  responseForStreams(convo, streams, speakLength) {
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
          speech.sentence(this.checkChannelForRename(convo.conv, stream.channel));
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
  }
  responseForLiveStream(convo, stream) {
    return convo
      .write(stream.channel.display_name)
      .speak(this.streamSpeech(convo, stream), false)
      .present(this.streamCard(convo, stream), 'actions.capability.SCREEN_OUTPUT');
  }
}

module.exports = {TwitchStreamsApp}
