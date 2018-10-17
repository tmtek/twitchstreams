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
const {TwitchStreamsApp} = require('@tmtek/twitchstreams');

///////////////////////////////////////////////

const clientId = "your client id";

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  new TwitchStreamsApp(clientId)
    .setClassMappings({
      SignIn: obj => new SignIn(obj),
      SimpleResponse: obj => new SimpleResponse(obj),
      NewSurface: obj => new NewSurface(obj),
      BasicCard: obj => new BasicCard(obj),
      List: obj => new List(obj),
      Button: obj => new Button(obj),
      Image: obj => new Image(obj)
    })
    .bind(dialogflow({debug: true, clientId: clientId}))
);
