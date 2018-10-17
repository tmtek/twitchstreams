'use strict';

///////////////////////////////////////////////

const {
  dialogflow,
  SignIn,
  SimpleResponse,
  BasicCard,
  List,
  Button,
  Image,
  NewSurface
} = require('actions-on-google');
const functions = require('firebase-functions');
const {Convo} = require('@tmtek/convo');
const {TwitchStreamsApp} = require('@tmtek/twitchstreams');

///////////////////////////////////////////////

Convo.setClassMappings({
  SignIn: obj => new SignIn(obj),
  SimpleResponse: obj => new SimpleResponse(obj),
  NewSurface: obj => new NewSurface(obj),
  BasicCard: obj => new BasicCard(obj),
  List: obj => new List(obj),
  Button: obj => new Button(obj),
  Image: obj => new Image(obj)
});

TwitchStreamsApp.clientId = "your client id";
const app = dialogflow({debug: true, clientId: TwitchStreamsApp.clientId});

///////////////////////////////////////////////
//WELCOME & SIGN IN

app.intent('Default Welcome Intent', (conv) => {
  return Convo.ask(TwitchStreamsApp.actions.welcome(new Convo(conv)));
});

app.intent('request_sign_in', (conv) => {
    Convo.ask(TwitchStreamsApp.actions.signin(new Convo(conv)));
});

app.intent('request_sign_in_confirmation', (conv, params, signin) => {
  return Convo.ask(TwitchStreamsApp.actions.signinConfirm(new Convo(conv), signin));
});

app.intent('myaccount', (conv) => {
  return Convo.ask(TwitchStreamsApp.actions.myAccount(new Convo(conv)));
});

///////////////////////////////////////////////
//STREAMS LIST

app.intent('whos_streaming', (conv, {game}) => {
  return Convo.ask(TwitchStreamsApp.actions.whosStreaming(new Convo(conv), game));
});

app.intent('entire_list_streams', (conv) => {
  return Convo.ask(TwitchStreamsApp.actions.whosStreamingEntire(
    new Convo(conv).speak("Here's all of them:")
  ));
});

app.intent('back_to_list_streams', (conv) => {
  return Convo.ask(TwitchStreamsApp.actions.whosStreamingEntire(
    new Convo(conv).speak("Here's the list again:")
  ));
});

app.intent('select_stream_from_ui', (conv, params, option) => {
  return Convo.ask(TwitchStreamsApp.actions.selectStreamByPosition(
    new Convo(conv), option, false
  ));
});

app.intent('select_from_list', (conv, {position}) => {
  return Convo.ask(TwitchStreamsApp.actions.selectStreamByPosition(
    new Convo(conv), position, true
  ));
});

app.intent('next_from_list', (conv, {position = -1}) => {
  return Convo.ask(TwitchStreamsApp.actions.selectNextStream(new Convo(conv)));
});

///////////////////////////////////////////////
//SELECTED STREAM

app.intent('check_live', (conv, {query}) => {
  return Convo.ask(TwitchStreamsApp.actions.checkLive(new Convo(conv), query));
});

app.intent('play_stream', (conv) => {
    return Convo.ask(TwitchStreamsApp.actions.playStream(new Convo(conv)));
});

app.intent('play_remote_request', (conv, input, newSurface) => {
  return Convo.ask(TwitchStreamsApp.actions.playStreamFromRemote(new Convo(conv), newSurface));
});

app.intent('rename_channel', (conv, {newname}) => {
  return Convo.ask(TwitchStreamsApp.actions.renameChannel(new Convo(conv), newname));
});

///////////////////////////////////////////////
//Games

app.intent('top_games', (conv, {count}) => {
  return Convo.ask(TwitchStreamsApp.actions.topGames(new Convo(conv), count));
});

///////////////////////////////////////////////
//My Channel

app.intent('my_channel', (conv) => {
  return Convo.ask(TwitchStreamsApp.actions.myChannel(new Convo(conv)));
});

app.intent('my_status', (conv, {message}) => {
  return Convo.ask(TwitchStreamsApp.actions.myStatus(new Convo(conv), message));
});

app.intent('my_game', (conv, {game}) => {
  return Convo.ask(TwitchStreamsApp.actions.myGame(new Convo(conv), game));
});

///////////////////////////////////////////////

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
