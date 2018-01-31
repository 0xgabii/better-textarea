import BetterTextArea from '../src/main';

document.body.innerHTML = '<textarea id="textarea"></textarea>';

describe('Check parameters', () => {
  test('if nothing is given', () => {
    expect(() => new BetterTextArea()).toThrowError(/No options to init/);
  });

  test('if meaningless string is given', () => {
    expect(() => new BetterTextArea('blablabla')).toThrowError(/Can't find DOM element 'blablabla'/);
  });

  test('if nonexistent selector string is given', () => {
    expect(() => new BetterTextArea('#ta')).toThrowError(/Can't find DOM element '#ta'/);
  });

  test('if selector string is given', () => {
    let textarea;

    expect(() => {
      textarea = new BetterTextArea('#textarea');
    }).not.toThrow();
    expect(textarea.el).toBe('#textarea');
  });

  test('if empty object is given', () => {
    expect(() => new BetterTextArea({})).toThrowError(/No options to init/);
  });

  test('if missing required options object is given', () => {
    expect(() => new BetterTextArea({ tabSize: 4 })).toThrowError(/Required option/);
  });

  test('if object is given', () => {
    let textarea;

    expect(() => {
      textarea = new BetterTextArea({
        el: '#textarea',
      });
    }).not.toThrow();
    expect(textarea.el).toBe('#textarea');
    expect(textarea.tabSize).toBe(2);
  });

  test("when finished, call 'init' method", () => {
    const spy = jest.spyOn(BetterTextArea.prototype, 'init');

    // eslint-disable-next-line
    const textarea = new BetterTextArea({
      el: '#textarea',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
