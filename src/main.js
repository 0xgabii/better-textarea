import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';

const throwError = (err) => {
  throw new Error(`[BetterTextarea] ${err}`);
};

const defaultOptions = {
  el: undefined,
  tabSize: 2,
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

  handleTab(e) {
    e.preventDefault();

    const generateSpace = num => ' '.repeat(num);
    const checkSpace = (base, start, space) => base.substr(start, space) === generateSpace(space);

    const indent = generateSpace(this.tabSize);
    const { start: startPos, end: endPos } = this.cursor;

    let selectionPrev = this.value.substring(0, startPos);
    let selection = this.value.substring(startPos, endPos);
    const selectionNext = this.value.substring(endPos);

    const lineStartPos = startPos - selectionPrev.split('\n').pop().length;

    if (selection) {
      let startIndentLength = indent.length;
      let endIndentLength = indent.length;

      if (e.shiftKey) {
        startIndentLength = 0;
        endIndentLength = 0;

        selectionPrev = selectionPrev.substring(0, lineStartPos);
        selection = this.value.substring(lineStartPos, endPos);

        selection = selection.split('\n').map((line, index) => {
          for (let num = indent.length; num > 0; num -= 1) {
            if (checkSpace(line, 0, num)) {
              if (index === 0) {
                startIndentLength = -num;
              } else if (index === selection.split('\n').length - 1) {
                endIndentLength = -num;
              }
              line = line.replace(generateSpace(num), '');
              break;
            }
          }
          return line;
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
        let value = selectionPrev.substring(lineStartPos, startPos);

        for (let num = indent.length; num > 0; num -= 1) {
          if (checkSpace(this.value, lineStartPos, num)) {
            value = value.replace(generateSpace(num), '');
            pos = startPos - num;
            break;
          }
        }

        this.value = selectionPrev.substring(0, lineStartPos) + value + selectionNext;
      } else {
        pos += indent.length;
        this.value = selectionPrev + indent + selectionNext;
      }

      this.cursor = pos;
    }
  }
}

export default BetterTextarea;
