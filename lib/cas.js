var http    = require('http'),
     url    = require('url'),
     xml2js = require('xml2js'),
          _ = require('underscore');

module.exports = function(options){

  var casURL = url.parse(options.root);
  
  return function(req, res, next){

    var rr = "http://" + req.header('host')+req.originalUrl;
    console.log("aaaaa",rr)
    var service = escape(options.service ||  rr);
    console.log("bbbb",service)
    if (_.isString(options)){
      options = {root:options};
    }

    var validate = function(casURL, ticket, callback){
      var request = {
        host: casURL.hostname,
        port: casURL.port ,
        path: casURL.pathname + '/serviceValidate?ticket='+ticket  + '&service=' + service
      }
      console.log(request.path)
      var parser = new xml2js.Parser();
      parser.addListener('end', function(result) {
        callback(result['cas:authenticationSuccess']);
      });

      var casRes = http.get(request, function(casRes){
        casRes.on('error', function(err){
         callback(new Error('Unathorized'))
        })
        .on('data', function(chunk){
          parser.parseString(chunk);
        })
      });  
    }

    var user = req.session.authenticated_user;

    if(user){
      next();
    }else if(req.param('ticket')){
      validate(casURL, req.param('ticket'),function(results){
        req.session.authenticated_user = results;
        next();
      });
    }else{
      var redirectTo = options.root + '/login?service=' + service;
      res.redirect(redirectTo);
    }

  }
}

