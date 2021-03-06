'use strict'
const os = require('os')

module.exports = (slapp) => {

  slapp.command('/inorout', /.*/, (msg, text) => {
    var lines = msg.body.text.split(os.EOL).map((it) => { return it.trim() })
    var text = lines[0] || 'In or Out?'

    // max 15 answers (3 for buttons, 1 for move to bottom, 15 for each answer)
    if (lines.length > 16) {
      msg.respond(`:sob: Sorry, you may only enter 15 options. Here is what you entered:
        
/inorout ${msg.body.text}`)
      return
    }

    // default actions incase the user doesn't specify one
    var actions = [
      {
        name: 'answer',
        text: 'In',
        type: 'button',
        value: 'in',
        style: 'default'
      },
      {
        name: 'answer',
        text: 'Out',
        type: 'button',
        value: 'out',
        style: 'default'
      }
    ]

    if (lines.length > 1) {
      actions = []
      for (var i=1; i<lines.length; i++) {
        var answer = lines[i]
        actions.push({
          name: 'answer',
          text: answer,
          type: 'button',
          value: answer,
          style: 'default'
        })
      }
    }

    // split the buttons into blocks of five if there are that many different
    // questions
    var attachments = []
    actions.forEach((action, num) => {
      let idx = Math.floor(num / 5)
      if (!attachments[idx]) {
        attachments[idx] = {
          text: '',
          fallback: text,
          callback_id: 'in_or_out_callback',
          color: '#47EEBC',
          actions: []
        }
      }
      attachments[idx].actions.push(action)
    })

    // move to the bottom button
    attachments.push({
      text: '',
      fallback: 'move to the bottom',
      callback_id: 'in_or_out_callback',
      actions: [{
        name: 'recycle',
        text: ':arrow_heading_down: move to bottom',
        type: 'button'
      }]
    })

    msg.say({
      text: text,
      attachments: attachments
    }, (err) => {
      if (err && err.message === 'channel_not_found') {
        msg.respond(msg.body.response_url, 'Sorry, I can not write to a channel or group I am not a part of!')
      }
    })
  })

  // Recycle the message to the bottom (most recent) of the stream
  slapp.action('in_or_out_callback', 'recycle', (msg, value) => {
    var orig = msg.body.original_message
    var update = {
      text: 'In or out (moved to bottom): ' + orig.text,
      delete_original: true
    }
    msg.respond(msg.body.response_url, update, (err) => {
      if (err) console.err('uh oh')
      msg.say({
        text: orig.text,
        attachments: orig.attachments
      })
    })
  })

  // Handle an answer
  slapp.action('in_or_out_callback', 'answer', (msg, value) => {
    var infoMsg = msg.body.user.name + ' is ' + value
    var username = msg.body.user.name
    var orig = msg.body.original_message
    var foundExistingLine = false
    orig.attachments = orig.attachments || []

    var newAttachments = []
    var lines = []

    // look for an existing line/attachment and update it if found
    for(var i=0; i < orig.attachments.length; i++) {
      var attachment = orig.attachments[i]

      if (attachment.actions) {
        newAttachments.push(attachment)
        continue
      }

      // parase the attachment text and represent as an object
      var line = new AttachmentLine(attachment.text)
      if (line.answer === value) {
        foundExistingLine = true
        line.add(username)
        lines.push(line)
      } else {
        line.remove(username)
        if (line.count() > 0) {
          lines.push(line)
        }
      }
    }

    // create a new line if next existing
    if (!foundExistingLine) {
      var line = new AttachmentLine()
      line.answer = value
      line.add(username)
      lines.push(line)
    }

    // sort lines by most votes
    lines = lines.sort((a,b) => { return a.count() > b.count() ? -1 : 1 })

    // render and replace the updated attachments list
    orig.attachments = newAttachments.concat(lines.map((l)=>{ return { text: l.string(),  mrkdwn_in: ["text"], color: '#47EEBC' } }))

    // replace the original message
    msg.respond(msg.body.response_url, orig)
  })

}

class AttachmentLine {

  constructor (text) {
    this.entries = []
    this.answer = ''
    if (text) {
      var parts = text.substring(text.indexOf(' ')).split(/»/)
      parts = parts.map((it) => { return it.trim() })
      this.answer = parts[0]
      this.entries = parts[1].split(',').map((val) => { return val.trim() })
    }
  }

  add (entry) {
    this.remove(entry)
    this.entries.push(entry)
    return this
  }

  remove (entry) {
    this.entries = this.entries.filter((val) => { return val !== entry })
    return this
  }

  contains (entry) {
    return this.entries.indexOf(entry) > -1
  }

  count () {
    return this.entries.length
  }

  string() {
    let dots = ''
    return '*' + this.count() + '*' + ' ' + this.answer +  ' » ' + this.entries.join(', ')
  }
}
