import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';

import { generateSpace, getStringStartIndex } from './utils';

const throwError = (err) => {
  throw new Error(`[BetterTextarea] ${err}`);
};

const defaultOptions = {
  el: undefined,
  tabSize: 2,
  pairedKeys: [
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

const requiredOptions = ['el'];

class BetterTextarea {
  constructor(args) {
    if (!args) throwError('No options to init');

    const type = args.constructor;

    const options = {};

    // Check type
    if (type === String) {
      options.el = args;
    } else if (type === Object) {
      if (Object.keys(args).length) {
        Object.keys(args).forEach((key) => {
          if (Object.keys(defaultOptions).includes(key)) {
            options[key] = args[key];
          }
        });
      } else {
        throwError('No options to init');
      }
    } else {
      throwError(`Type '${type}' is not supported`);
    }

    // Check required
    requiredOptions.forEach((option) => {
      if (!Object.keys(options).includes(option)) {
        throwError(`Required option '${option}' is missing`);
      }
    });

    const mergeOptions = {
      ...defaultOptions,
      ...options,
    };

    // Validate
    Object.keys(mergeOptions).forEach((key) => {
      if (key === 'el' && !document.querySelector(mergeOptions[key])) {
        throwError(`Can't find DOM element '${mergeOptions[key]}'`);
      }
    });

    Object.assign(this, mergeOptions);

    this.init();
  }

  init() {
    const textarea = document.querySelector(this.el);
    const keyDown$ = Observable.fromEvent(textarea, 'keydown');
    const tab$ = keyDown$.filter(e => e.key === 'Tab');

    keyDown$.subscribe(e => this.filterKeys(e));
    tab$.subscribe(e => this.handleTab(e));

    this.textarea = textarea;
  }

  get cursor() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
    };
  }

  set cursor(pos) {
    this.textarea.focus();

    if (pos.constructor === Object) {
      this.textarea.setSelectionRange(pos.start, pos.end);
    } else {
      this.textarea.setSelectionRange(pos, pos);
    }
  }

  get value() {
    return this.textarea.value;
  }

  set value(v) {
    this.textarea.value = v;
  }

  get selections() {
    const { start, end } = this.cursor;
    return {
      selectionPrev: this.value.substring(0, start),
      selection: this.value.substring(start, end),
      selectionNext: this.value.substring(end),
    };
  }

  filterKeys(e) {
    const pairedKey = this.pairedKeys.find(key => key.open === e.key || key.close === e.key);

    if (pairedKey) {
      this.injectPairedKey(e, pairedKey);
    } else if (e.key === 'Backspace') {
      this.ejectPairedKey(e);
    } else if (e.key === 'Enter') {
      this.injectEnterWithIndent(e);
    }
  }

  handleTab(e) {
    e.preventDefault();

    const indent = generateSpace(this.tabSize);
    const { start: startPos, end: endPos } = this.cursor;

    let { selectionPrev, selection } = this.selections;
    const { selectionNext } = this.selections;

    const lineStartPos = startPos - selectionPrev.split('\n').pop().length;

    if (selection) {
      let startIndentLength = indent.length;
      let endIndentLength = indent.length;

      if (e.shiftKey) {
        startIndentLength = 0;
        endIndentLength = 0;

        selectionPrev = selectionPrev.substring(0, lineStartPos);
        selection = this.value.substring(lineStartPos, endPos);

        selection = selection.split('\n').map((str, index) => {
          const strStartIndex = getStringStartIndex(str);
          const num = strStartIndex > this.tabSize ? this.tabSize : strStartIndex;

          if (index === 0) {
            startIndentLength = -num;
          } else if (index === selection.split('\n').length - 1) {
            endIndentLength = -num;
          }

          str = str.replace(generateSpace(num), '');

          return str;
        }).join('\n');
      } else {
        selectionPrev = selectionPrev.substring(0, lineStartPos) +
                        indent +
                        selectionPrev.substring(lineStartPos, startPos);
        selection = selection.split('\n').join(`\n${indent}`);
      }

      this.value = selectionPrev + selection + selectionNext;
      this.cursor = {
        start: startPos + startIndentLength,
        end: startPos + selection.length + endIndentLength,
      };
    } else {
      let pos = startPos;

      if (e.shiftKey) {
        let str = selectionPrev.substring(lineStartPos, startPos);

        const strStartIndex = getStringStartIndex(str);
        const num = strStartIndex > this.tabSize ? this.tabSize : strStartIndex;

        str = str.replace(generateSpace(num), '');
        pos = startPos - num;

        this.value = selectionPrev.substring(0, lineStartPos) + str + selectionNext;
      } else {
        pos += indent.length;
        this.value = selectionPrev + indent + selectionNext;
      }

      this.cursor = pos;
    }
  }

  injectPairedKey(e, pairedKey) {
    e.preventDefault();

    const { start: startPos } = this.cursor;
    const { selectionPrev, selectionNext } = this.selections;

    let value;

    if (e.key === pairedKey.open) {
      value = pairedKey.open + pairedKey.close;

      if (e.key === pairedKey.close) {
        if (this.value[startPos] === pairedKey.close) {
          value = '';
        } else if (this.value[startPos - 1] === pairedKey.close) {
          value = e.key;
        }
      }
    } else {
      value = e.key;

      if (this.value[startPos] === pairedKey.close) {
        value = '';
      }
    }

    this.value = selectionPrev + value + selectionNext;
    this.cursor = startPos + 1;
  }

  ejectPairedKey(e) {
    const { start: startPos } = this.cursor;
    const { selectionPrev, selectionNext } = this.selections;

    const betweenPairedKey = this.pairedKeys.find((key) => {// eslint-disable-line
      return key.open === this.value[startPos - 1] && key.close === this.value[startPos];
    });

    if (betweenPairedKey) {
      e.preventDefault();
      this.value = selectionPrev.substring(0, startPos - 1) + selectionNext.substring(1);
      this.cursor = startPos - 1;
    }
  }

  injectEnterWithIndent(e) {
    e.preventDefault();

    const { start: startPos, end: endPos } = this.cursor;
    const { selectionPrev, selectionNext } = this.selections;

    const lineStartPos = startPos - selectionPrev.split('\n').pop().length;
    const strStartIndex = getStringStartIndex(this.value.substring(lineStartPos, endPos));

    const betweenPairedKey = this.pairedKeys.find((key) => {// eslint-disable-line
      return key.open === this.value[startPos - 1] && key.close === this.value[startPos];
    });

    let value = `\n${generateSpace(strStartIndex)}`;
    let cursor = strStartIndex;

    if (betweenPairedKey) {
      value = `\n${generateSpace(strStartIndex + this.tabSize)}\n${generateSpace(strStartIndex)}`;
      cursor = strStartIndex + this.tabSize;
    }

    this.value = selectionPrev + value + selectionNext;
    this.cursor = startPos + cursor + 1;
  }
}

export default BetterTextarea;
