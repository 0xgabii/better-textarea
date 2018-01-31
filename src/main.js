// import { Observable } from 'rxjs/Observable';
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
    console.log(this.el);
  }
}

export default BetterTextarea;
