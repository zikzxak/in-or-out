'use strict'

const handleHowAreYou = 'chatter:handleHowAreYou'
const axios = require('axios')

module.exports = (slapp) => {

  slapp.message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(text + ', how are you?')
      .route(handleHowAreYou, {}, 60)
  })

  slapp.route(handleHowAreYou, (msg) => {
    var resp = msg.body.event && msg.body.event.text

    if (new RegExp('good', 'i').test(resp)) {
      msg
        .say(['Great! Ready?', ':smile: Are you sure?'])
        .route(handleHowAreYou, 60)
    } else {
      msg.say('Me too')
    }
  })

  slapp.message('prh', ['direct_mention', 'direct_message'], (msg) => {

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy+'-'+mm+'-'+dd;

    msg.say('Fetching companies...')
    var companies = 'New companies registered yesterday:' + '\n'
    axios.get('http://avoindata.prh.fi:80/tr/v1?totalResults=true&maxResults=200&resultsFrom=0&companyForm=OY&companyRegistrationFrom='+today+'companyRegistrationTo='+today)
      .then(function (response) {
          response.data.results.forEach(function(company) {
            companies = companies.concat(company.name + '\n')
          })
      msg.say(companies)
    })
    .catch(function (error) {
      console.log(error)
    });
  })

  slapp.message('^(thanks|thank you)', ['mention', 'direct_message'], (msg) => {
    msg.say(['You are welcome', 'Of course'])
  })

  slapp.message('good night|bye', ['mention', 'direct_message'], (msg) => {
    msg.say(['Cheers :beers:', 'Bye', 'Goodbye', 'Adios'])
  })

  slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
    // respond only 40% of the time
    if (Math.random() < 0.4) {
      msg.say([':wave:', ':pray:', ':raised_hands:'])
    }
  })
}
