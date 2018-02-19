export const generateSpace = num => ' '.repeat(num);

export const getStringStartIndex = (str) => {
  if (str.match(/\S/)) {
    return str.match(/\S/).index;
  }
  return str.length;
};
