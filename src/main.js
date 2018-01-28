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
  constructor(param) {
    if (!param) throwError('No options to init');

    const type = param.constructor;

    const options = {};

    // Check type
    if (type === String) {
      options.el = param;
    } else if (type === Object) {
      if (Object.keys(param).length) {
        Object.keys(param).forEach((key) => {
          if (Object.keys(defaultOptions).includes(key)) {
            options[key] = param[key];
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
  }
}

export default BetterTextarea;
