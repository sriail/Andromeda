self.__uv$config = {
  prefix: '/~/uv/',
  encodeUrl: (url) => {
    // Simple XOR encoding
    return btoa(url);
  },
  decodeUrl: (encoded) => {
    return atob(encoded);
  },
  handler: '/uv/uv.handler.js',
  client: '/uv/uv.client.js',
  bundle: '/uv/uv.bundle.js',
  config: '/uv/uv.config.js',
  sw: '/uv/uv.sw.js',
};
