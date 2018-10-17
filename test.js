const {Convo, Say} = require('@tmtek/convo');
const {TwitchStreamsApp} = require('./index');

TwitchStreamsApp.clientId = "your client id";


//Convo.ask(TwitchStreamsApp.actions.welcome(new Convo()), {log:true});
//Convo.ask(TwitchStreamsApp.actions.signin(new Convo()), {log:true});
//Convo.ask(TwitchStreamsApp.actions.signinConfirm(new Convo(), {status:"OK"}), {log:true});
//Convo.ask(TwitchStreamsApp.actions.myAccount(new Convo()), {log:true});

//Convo.ask(TwitchStreamsApp.actions.whosStreaming(new Convo()), {log:true})
/*
Convo.ask(TwitchStreamsApp.actions.whosStreaming(new Convo()), {log:true})
.then(convo => Convo.ask(TwitchStreamsApp.actions.selectNextStream(new Convo(convo)), {log:true}))
.then(convo => Convo.ask(TwitchStreamsApp.actions.selectNextStream(new Convo(convo)), {log:true}));
*/

/*
Convo.ask(TwitchStreamsApp.actions.whosStreamingEntire(new Convo(mockConv)
    .setContext(TwitchStreamsApp.contexts.streams, 1, {list:mockStreams})
));
*/

/*
Convo.ask(TwitchStreamsApp.actions.selectStreamByPosition(
  new Convo(mockConv).setContext(TwitchStreamsApp.contexts.streams, 1, {list:mockStreams}), 1, false
));
*/

/*
Convo.ask(TwitchStreamsApp.actions.selectNextStream(
  new Convo(mockConv)
    .setContext(TwitchStreamsApp.contexts.streams, 1, {list:mockStreams})
    .setContext(TwitchStreamsApp.contexts.list_index, 1, {position:1})
));
*/

//Convo.ask(TwitchStreamsApp.actions.myChannel(new Convo(mockConv)));
//Convo.ask(TwitchStreamsApp.actions.searchForChannel(new Convo(mockConv), "tmtek"));
//Convo.ask(TwitchStreamsApp.actions.checkLive(new Convo(mockConv), "KingGothalion"));
/*
Convo.ask(TwitchStreamsApp.actions.playStream(new Convo(mockConv)
  .setContext(TwitchStreamsApp.contexts.stream_selected, 1, {stream:mockStreams[0]})
));
*/

/*
Convo.ask(TwitchStreamsApp.actions.playStreamFromRemote(new Convo(mockConv)
  .setContext(TwitchStreamsApp.contexts.stream_selected, 1, {stream:mockStreams[0]}),
  {status:"OK"}
));
*/
/*
Convo.ask(TwitchStreamsApp.actions.renameChannel(
  new Convo(mockConv)
    .setContext(TwitchStreamsApp.contexts.stream_selected, 1, {stream:mockStreams[0]}),
  "The New Name"
));
*/
//Convo.ask(TwitchStreamsApp.actions.topGames(new Convo(mockConv), 5));
//Convo.ask(TwitchStreamsApp.actions.myStatus(new Convo(mockConv), "Status updated from new app! =)"));
//Convo.ask(TwitchStreamsApp.actions.myGame(new Convo(mockConv), "IRL"));
