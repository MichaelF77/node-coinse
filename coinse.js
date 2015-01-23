'use strict';
var request = require('request'),
    crypto = require('crypto'),
    querystring = require('querystring');

var Coinse = function(apiKey, secret, options) {
  this.url = 'https://www.coins-e.com/api/v2/';
  this.publicApiUrl = 'https://www.coins-e.com/api/v2/';
  this.timeout = 5000;
  this.apiKey = apiKey;
  this.secret = secret;
  this._strictSSL = true;

  if (typeof options === 'function') {
    this.nonce = options;
  } else if (options) {
    this.nonce = options.nonce;
    this.agent = options.agent;

    if (typeof options.timeout !== 'undefined') {
      this.timeout = options.timeout;
    }
    if (typeof options.tapi_url !== 'undefined') {
      this.url = options.tapi_url;
    }
    if (typeof options.public_url !== 'undefined') {
      this.publicApiUrl = options.public_url;
    }
    if (typeof options.strict_ssl !== 'undefined') {
      this._strictSSL = !!options.strict_ssl;
    }
  }
};

Coinse.prototype._sendRequest = function (options, callback) {
  var self = this;
  var requestOptions = {
    timeout: self.timeout,
    agent: self.agent,
    strictSSL: self._strictSSL
  };

  for (var key in options) {
    requestOptions[key] = options[key];
  }

  request(requestOptions, function(err, response, body) {
    if(err || response.statusCode !== 200) {
      return callback(new Error(err || response.statusCode));
    }

    var result;
    try {
      result = JSON.parse(body);
    } catch(error) {
      return callback(error);
    }

    if(result.error) {
      return callback(new Error(result.error));
    }

    return callback(null, result);
  });
};

Coinse.prototype.makeRequest = function(method, prefix, pair, params, callback) {
  var self = this;

  if(!self.apiKey || !self.secret) {
    return callback(new Error('Must provide API key and secret to use the trade API.'));
  }

  // If the user provided a function for generating the nonce, then use it.
  if(self.nonce) {
    params.nonce = self.nonce();
  } else {
    params.nonce = Math.round((new Date()).getTime() / 1000);
  }

  var formData = {};
  for (var key in params) {
    formData[key] = params[key];
  }
  formData.method = method;

  var form = querystring.stringify(formData);
  var sign = crypto.createHmac('sha512', self.secret).update(new Buffer(form)).digest('hex').toString();

  return self._sendRequest({
    url: self.url + prefix + '/' + pair,
    method: 'POST',
    form: form,
    headers: {
      sign: sign,
      key: self.apiKey
    }
  }, callback);
};

Coinse.prototype.makePublicApiRequest = function(prefix, pair, method, callback) {
  var p = pair;
  if (p)
  	p = pair + '/';
  this._sendRequest({
    url: this.publicApiUrl + prefix + '/' + p + method
  }, callback);
};

Coinse.prototype.getAllWallets = function(callback) {
  this.makeRequest('getwallets', 'wallets', 'all', {}, callback);
};

Coinse.prototype.getWallet = function(coin, callback) {
  this.makeRequest('getwallet', 'wallet', coin , {}, callback);
};

Coinse.prototype.getDepositAddress = function(coin, callback) {
  this.makeRequest('getdepositaddress', 'wallet', coin , {}, callback);
};

Coinse.prototype.updateWallet = function(coin, callback) {
  this.makeRequest('updatewallet', 'wallet', coin , {}, callback);
};

Coinse.prototype.trade = function(pair, type, rate, quantity, callback) {
  this.makeRequest('neworder', 'market', pair, {
    'order_type': type,
    'rate': rate,
    'quantity': quantity
  }, callback);
};


Coinse.prototype.getOrder = function(pair, order_id, callback) {
  this.makeRequest('getorder', 'market', pair, {
	  'order_id' : order_id
	  }, callback);
};

Coinse.prototype.cancelOrder = function(pair, order_id, callback) {
  this.makeRequest('cancelorder', 'market', pair, {
	  'order_id' : order_id
	  }, callback);
};

Coinse.prototype.listOrders = function(pair, params, callback) {
  this.makeRequest('listorders', 'market', pair, params, callback);
};



Coinse.prototype.markets = function(callback) {
  this.makePublicApiRequest('markets', '', 'list', callback);
};

Coinse.prototype.coins = function(callback) {
  this.makePublicApiRequest('coins', '', 'list', callback);
};

Coinse.prototype.marketdata = function(callback) {
  this.makePublicApiRequest('markets', '', 'data', callback);
};

Coinse.prototype.trades = function(pair, callback) {
  this.makePublicApiRequest('market', pair, 'trades', callback);
};

Coinse.prototype.depth = function(pair, callback) {
  this.makePublicApiRequest('market', pair, 'depth', callback);
};


module.exports = Coinse;
