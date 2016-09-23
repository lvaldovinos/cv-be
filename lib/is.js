const is = exports;

is.object = (obj) => {
  const type = typeof obj;
  const aux = type === 'function' || type === 'object';
  return aux && !!obj;
};

is.string = obj => toString.call(obj) === '[object String]';

is.date = (obj) => {
  if (!this.string(obj)) return false;
  return /(?:([0-9]+)[-T:]+)+([0-9]{2,2})$/gi.test(obj);
};

is.url = (obj) => {
  if (!this.string(obj)) return false;
  return /(http[s]?):\/\/(?:www.)?([a-zA-Z0-9]+)(?:.([a-zA-Z0-9?]+))+\/?/gi.test(obj);
};

is.array = obj => Object.prototype.toString.call(obj) === '[object Array]';
