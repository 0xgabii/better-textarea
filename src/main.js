import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';

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
    { open: '`', close: '`' },
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

    keyDown$.subscribe(e => this.filterKeys(e));

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
    const getPressedKeys = () => {
      const keys = {
        shift: e.shiftKey,
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        [e.key]: e.key,
      };
      return Object.keys(keys).filter(key => keys[key]).join('+');
    };

    const keyMap = {
      Tab: _ => this.injectIndent(_),
      'shift+Tab': _ => this.ejectIndent(_),
      Backspace: _ => this.ejectPairedKey(_),
      Enter: _ => this.injectEnterWithIndent(_),
    };

    if (keyMap[getPressedKeys()]) {
      keyMap[getPressedKeys()](e);
    } else {
      const pairedKey = this.pairedKeys.find(key => key.open === e.key || key.close === e.key);

      if (pairedKey) {
        this.injectPairedKey(e, pairedKey);
      }
    }
  }

  injectIndent(e) {
    e.preventDefault();

    const indent = generateSpace(this.tabSize);
    const { start: startPos } = this.cursor;

    let { selectionPrev, selection } = this.selections;
    const { selectionNext } = this.selections;

    const lineStartPos = startPos - selectionPrev.split('\n').pop().length;

    if (selection) {
      selectionPrev = selectionPrev.substring(0, lineStartPos) +
                      indent +
                      selectionPrev.substring(lineStartPos, startPos);
      selection = selection.split('\n').join(`\n${indent}`);

      this.value = selectionPrev + selection + selectionNext;
      this.cursor = {
        start: startPos + indent.length,
        end: startPos + selection.length + indent.length,
      };
    } else {
      this.value = selectionPrev + indent + selectionNext;
      this.cursor = startPos + indent.length;
    }
  }

  ejectIndent(e) {
    e.preventDefault();

    const { start: startPos, end: endPos } = this.cursor;

    let { selectionPrev, selection } = this.selections;
    const { selectionNext } = this.selections;

    const lineStartPos = startPos - selectionPrev.split('\n').pop().length;

    if (selection) {
      let subtractStartPos = 0;
      let subtractEndPost = 0;

      selectionPrev = selectionPrev.substring(0, lineStartPos);
      selection = this.value.substring(lineStartPos, endPos);

      selection = selection.split('\n').map((str, index) => {
        const strStartIndex = getStringStartIndex(str);
        const num =
          strStartIndex > this.tabSize
            ? this.tabSize
            : strStartIndex;

        if (index === 0) subtractStartPos -= num;
        subtractEndPost -= num;

        str = str.replace(generateSpace(num), '');

        return str;
      }).join('\n');

      this.value = selectionPrev + selection + selectionNext;
      this.cursor = {
        start: lineStartPos > startPos + subtractStartPos
          ? lineStartPos
          : startPos + subtractStartPos,
        end: endPos + subtractEndPost,
      };
    } else {
      let str = selectionPrev.substring(lineStartPos, startPos);

      const strStartIndex = getStringStartIndex(str);
      const num =
        strStartIndex > this.tabSize
          ? this.tabSize
          : strStartIndex;

      str = str.replace(generateSpace(num), '');

      this.value = selectionPrev.substring(0, lineStartPos) + str + selectionNext;
      this.cursor = startPos - num;
    }
  }

  injectPairedKey(e, pairedKey) {
    e.preventDefault();

    const { start: startPos, end: endPos } = this.cursor;
    const { selectionPrev, selection, selectionNext } = this.selections;

    let value = '';
    let cursor;

    if (e.key === pairedKey.open) {
      value = pairedKey.open + selection + pairedKey.close;
      cursor = selection
        ? { start: startPos + 1, end: endPos + 1 }
        : startPos + 1;

      // pairedKey like ', ", `
      if (!selection && e.key === pairedKey.close) {
        if (this.value[startPos] === pairedKey.close) {
          value = '';
          cursor = startPos + 1;
        } else if (this.value[startPos - 1] === pairedKey.close) {
          value = e.key;
          cursor = startPos + 1;
        }
      }
    } else {
      value = e.key;
      cursor = startPos + 1;

      if (this.value[startPos] === pairedKey.close) {
        value = '';
        cursor = startPos + 1;
      }
    }

    this.value = selectionPrev + value + selectionNext;
    this.cursor = cursor;
  }

  ejectPairedKey(e) {
    const { start: startPos } = this.cursor;
    const { selectionPrev, selectionNext } = this.selections;

    const isCursorBetweenPairedKey = this.pairedKeys.find((key) => {// eslint-disable-line
      return key.open === this.value[startPos - 1] && key.close === this.value[startPos];
    });

    if (isCursorBetweenPairedKey) {
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

    const isCursorBetweenPairedKey = this.pairedKeys.find((key) => {// eslint-disable-line
      return key.open === this.value[startPos - 1] && key.close === this.value[endPos];
    });
    const isNotSamePairedKey =
      isCursorBetweenPairedKey
        ? isCursorBetweenPairedKey.open !== isCursorBetweenPairedKey.close
        : false;

    let value = `\n${generateSpace(strStartIndex)}`;
    let cursor = strStartIndex;

    if (isNotSamePairedKey) {
      value = `\n${generateSpace(strStartIndex + this.tabSize)}\n${generateSpace(strStartIndex)}`;
      cursor = strStartIndex + this.tabSize;
    }

    this.value = selectionPrev + value + selectionNext;
    this.cursor = startPos + cursor + 1;
  }
}

export default BetterTextarea;
