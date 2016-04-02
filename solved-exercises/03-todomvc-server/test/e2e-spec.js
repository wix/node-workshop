"use strict"
const Promise = require('bluebird')
const expect = require('chai').expect
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const Browser = require('zombie')
const eventually = require('./lib/eventually')
const childProcess = require('child_process')

const app = require('../server')

const waitUntilListening = (subProcess) => 
  new Promise((fulfill, reject) => {
    subProcess.stdout.on('data', fulfill)
    subProcess.on('err', reject)
    subProcess.on('exit', (code) => 
      code === 0 ? fulfill() : reject(new Error(`Process returned ${code}`)))
  })

describe("e2e", function() {
  const browser = new Browser()
  const PORT_NUMBER = 5364
  let subProcess
  before(Promise.coroutine(function*() {
     subProcess = childProcess.fork(path.join(__dirname, '../server'), [], {
      env: Object.assign({}, process.env, {
        PORT: PORT_NUMBER
      }),
      silent: true
    })
    yield waitUntilListening(subProcess)
  }))
  
  after(() => subProcess.kill())
    
  it.only("adds a todo correctly", Promise.coroutine(function*() {
    yield browser.visit(`http://localhost:${PORT_NUMBER}/`)
    browser.assert.success()
    browser.fill(".new-todo", "ggg")
    pressEnter(browser, ".new-todo")
    yield eventually(() => {
      expect(browser.text('.todo-list li:nth-child(1) label')).to.equal('ggg')
      expect(browser.text('.todo-list li:nth-child(2) label')).to.equal('')
    })
  }))
})

function pressEnter(browser, selector) {
  const event = browser.document.createEvent('HTMLEvents');
  event.initEvent('keydown', true, true);
  event.key = 13
  browser.dispatchEvent(selector, event)
}