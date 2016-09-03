'use strict'
const express = require('express')
const Slapp = require('slapp')
const BeepBoopConvoStore = require('slapp-convo-beepboop')
const BeepBoopContext = require('slapp-context-beepboop')
const axios = require('axios')
if (!process.env.PORT) throw Error('PORT missing but required')

var slapp = Slapp({
  record: 'out.jsonl',
  convo_store: BeepBoopConvoStore(),
  context: BeepBoopContext()
})

var streamers = 'tissukka'

var twitchGet = 'https://api.twitch.tv/kraken/streams?channel='+streamers

setInterval(function () {
	console.log('getting streams...')
	axios.get(twitchGet)
		.then(function (response) {
			console.log('found streams')
			msg.say(response.data);
		})
		.catch(function (error) {
			console.log(error);
		})
}, 300)

require('beepboop-slapp-presence-polyfill')(slapp, { debug: true })
require('./flows')(slapp)
var app = slapp.attachToExpress(express())

app.get('/', function (req, res) {
  res.send('Hello')
})

console.log('Listening on :' + process.env.PORT)
app.listen(process.env.PORT)
