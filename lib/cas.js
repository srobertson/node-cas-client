var http    = require('http'),
     url    = require('url'),
     xml2js = require('xml2js'),
          _ = require('underscore'),
     sys    = require('sys');

module.exports = function(options){
  if (_.isString(options)){
    options = {root:options};
  }


  var casURL = url.parse(options.root);
  
  return function(req, res, next){
    options.service = escape(options.service || req.originalUrl);

    var user = req.session.authenticated_user;

    if(user){
      next();
    }else if(req.param('ticket')){
      validate(casURL, req.param('ticket'),function(results){
        req.session.authenticated_user = results;
        next();
      });
    }else{
      var url = options.root + '?service=' + options.service;  
      res.redirect(url);
    }

  }
}

function validate(casURL, ticket, callback){
  var options = {
    host: casURL.hostname,
    port: casURL.port ,
    path: casURL.pathname + '/serviceValidate?ticket='+ticket  + '&service=' + escape("http://localhost:3001/user")
  }
  
  var parser = new xml2js.Parser();
  parser.addListener('end', function(result) {
    console.log(sys.inspect(result));
    callback(result);
  });
  
  var casRes = http.get(options, function(casRes){
    casRes.on('error', function(err){
     callback(new Error('Unathorized'))
    })
    .on('data', function(chunk){
     parser.parseString(chunk);
    })
  });  
}