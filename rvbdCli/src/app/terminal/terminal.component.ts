import {
  Component,
  ElementRef,
  OnInit
} from '@angular/core';


class Terminal {
  /*! terminal.js v2.0 | (c) 2014 Erik Österberg | https://github.com/eosterberg/terminaljs */
  // PROMPT_TYPE
  PROMPT_INPUT = 1;
  PROMPT_PASSWORD = 2;
  PROMPT_CONFIRM = 3;

  terminalBeep;
  html;
  beep;
  print;
  input;
  password;
  confirm;
  clear;
  sleep;
  setTextSize;
  setTextColor;
  setBackgroundColor;
  setWidth;
  setHeight;
  blinkingCursor;

  _innerWindow;
  _output;
  _inputLine;
  _cursor;
  _input;
  _shouldBlinkCursor;
  commmands = [
    'help',
    'version',
    'exec',
    'exit',
    'routermap',
    'routerinterface'
  ]

  fireCursorInterval = function (inputField, terminalObj) {
    const self = this;
    var cursor = terminalObj._cursor
    setTimeout(function () {
      if (inputField.parentElement && terminalObj._shouldBlinkCursor) {
        cursor.style.visibility = cursor.style.visibility === 'visible' ? 'hidden' : 'visible'
        self.fireCursorInterval(inputField, terminalObj)
      } else {
        cursor.style.visibility = 'visible'
      }
    }, 500)
  }

  firstPrompt = true;
  promptInput = function (terminalObj, message, PROMPT_TYPE, callback) {
    const self = this;
    let shouldDisplayInput = (PROMPT_TYPE === self.PROMPT_INPUT)
    let inputField = document.createElement('input')

    inputField.style.position = 'absolute'
    inputField.style.zIndex = '-100'
    inputField.style.outline = 'none'
    inputField.style.border = 'none'
    inputField.style.opacity = '0'
    inputField.style.fontSize = '0.2em'

    terminalObj._inputLine.textContent = ''
    terminalObj._input.style.display = 'block'
    terminalObj.html.appendChild(inputField)
    self.fireCursorInterval(inputField, terminalObj)

    if (message.length) {
      terminalObj.print(PROMPT_TYPE === self.PROMPT_CONFIRM ? message + ' (y/n)' : message);
    }

    inputField.onblur = function () {
      terminalObj._cursor.style.display = 'none'
    }

    inputField.onfocus = function () {
      inputField.value = terminalObj._inputLine.textContent
      terminalObj._cursor.style.display = 'inline'
    }

    terminalObj.html.onclick = function () {
      inputField.focus()
    }

    inputField.onkeydown = function (e) {
      const isShift = !!e.shiftKey;
      if (e.which === 37 || e.which === 39 || e.which === 38 || e.which === 40) {
        // skip the operations
        e.preventDefault();
      } else if (isShift) {
        switch (e.which) {
          case 16: // ignore shift key
            break;
          case 191:
            const lastStr = inputField.value.split(/(\s+)/).pop();
            const result = lastStr === '' ? [] : self.commmands.filter(command => {
              return command.indexOf(lastStr) !== -1;
            });
            terminalObj.print(result.join(' '));
            break;
          default:
            console.log('skip shift + key');
            break;
        }
        e.preventDefault();
      } else if (shouldDisplayInput && e.which === 9) {
        terminalObj.print(self.commmands.join(' '));

        e.preventDefault();
      } else if (shouldDisplayInput && e.which !== 13) {
        setTimeout(function () {
          terminalObj._inputLine.textContent = inputField.value;
        }, 10);
      }
    }
    inputField.onkeyup = function (e) {
      if (PROMPT_TYPE === self.PROMPT_CONFIRM || e.which === 13) {
        terminalObj._input.style.display = 'none';
        const inputValue = inputField.value;
        if (shouldDisplayInput) {
          terminalObj.print(inputValue);
        }

        // terminalObj.html.removeChild(inputField);
        if (typeof(callback) === 'function') {
          if (PROMPT_TYPE === self.PROMPT_CONFIRM) {
            callback(inputValue.toUpperCase()[0] === 'Y' ? true : false)
          } else callback(inputValue)
        }

        setTimeout(function () {
          terminalObj._input.style.display = 'inline';
          terminalObj._inputLine.textContent = '';
          inputField.value = '';
        }, 200);
      }
    }

    if (self.firstPrompt) {
      self.firstPrompt = false
      setTimeout(function () { inputField.focus() }, 50)
    } else {
      inputField.focus()
    }
  }

  constructor(id: string) {
    if (!this.terminalBeep) {
      this.terminalBeep = document.createElement('audio')
      var source = '<source src="http://www.erikosterberg.com/terminaljs/beep.'
      this.terminalBeep.innerHTML = source + 'mp3" type="audio/mpeg">' + source + 'ogg" type="audio/ogg">'
      this.terminalBeep.volume = 0.05
    }

    this.html = document.createElement('div')
    this.html.className = 'Terminal'
    if (typeof(id) === 'string') { this.html.id = id }

    this._innerWindow = document.createElement('div')
    this._output = document.createElement('p')
    this._inputLine = document.createElement('span') //the span element where the users input is put
    this._cursor = document.createElement('span')
    this._input = document.createElement('p') //the full element administering the user input, including cursor

    this._shouldBlinkCursor = true

    this.beep = function () {
      this.terminalBeep.load()
      this.terminalBeep.play()
    }

    this.print = function (message) {
      var newLine = document.createElement('div')
      newLine.textContent = message
      this._output.appendChild(newLine)
    }

    this.input = function (message, callback) {
      this.promptInput(this, message, this.PROMPT_INPUT, callback)
    }

    this.password = function (message, callback) {
      this.promptInput(this, message, this.PROMPT_PASSWORD, callback)
    }

    this.confirm = function (message, callback) {
      this.promptInput(this, message, this.PROMPT_CONFIRM, callback)
    }

    this.clear = function () {
      this._output.innerHTML = ''
    }

    this.sleep = function (milliseconds, callback) {
      setTimeout(callback, milliseconds)
    }

    this.setTextSize = function (size) {
      this._output.style.fontSize = size
      this._input.style.fontSize = size
    }

    this.setTextColor = function (col) {
      this.html.style.color = col
      this._cursor.style.background = col
    }

    this.setBackgroundColor = function (col) {
      this.html.style.background = col
    }

    this.setWidth = function (width) {
      this.html.style.width = width
    }

    this.setHeight = function (height) {
      this.html.style.height = height
    }

    this.blinkingCursor = function (bool) {
      bool = bool.toString().toUpperCase()
      this._shouldBlinkCursor = (bool === 'TRUE' || bool === '1' || bool === 'YES')
    }

    this._input.appendChild(this._inputLine)
    this._input.appendChild(this._cursor)
    this._innerWindow.appendChild(this._output)
    this._innerWindow.appendChild(this._input)
    this.html.appendChild(this._innerWindow)

    this.setBackgroundColor('black')
    this.setTextColor('white')
    this.setTextSize('1em')
    this.setWidth('100%')
    this.setHeight('100%')

    this.html.style.fontFamily = 'Monaco, Courier'
    this.html.style.margin = '0'
    this.html.style['overflow-y'] = 'auto'
    this._innerWindow.style.padding = '10px'
    this._input.style.margin = '0'
    this._output.style.margin = '0'
    this._cursor.style.background = 'white'
    this._cursor.innerHTML = 'C' //put something in the cursor..
    this._cursor.style.display = 'none' //then hide it
    this._input.style.display = 'none'
  }
}

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css']
})
export class TerminalComponent implements OnInit {

  constructor(private el:ElementRef) {
    console.warn(el);
  }

  ngOnInit() {
    let rvbdTerminal = new Terminal('terminal')
    rvbdTerminal.setHeight("200px")
    rvbdTerminal.setWidth('600px')
    document.body.appendChild(rvbdTerminal.html)
    rvbdTerminal.print('<= Router Configuration =>')
    rvbdTerminal.input('Start to configure: ', function (input) {
      const executionMsg = rvbdTerminal.commmands.indexOf(input) === -1
        ? `Unknown command '${input}'`
        : `Execution ${input} is in progress`;
      rvbdTerminal.print(executionMsg);
      rvbdTerminal.print('');
    });

    // websocket
    let ws = null;
    if (WebSocket === undefined) {
      console.warn("Your browser does not support WebSockets");
    } else {
      ws = new WebSocket('ws://' + location.host  + '/ws');
      ws.onopen = function() {
        console.log("Socket is open");
      };
      ws.onmessage = function (e) {
        console.log("Got some shit:" + e.data);
      }
      ws.onclose = function () {
        console.log("Socket closed");
      }
    }
  }

}
