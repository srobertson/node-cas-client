var http    = require('http'),
   https    = require('https'),
     url    = require('url'),
     xml2js = require('xml2js'),
          _ = require('underscore'),
      debug = false;

module.exports = function(options){

  var casURL = url.parse(options.root);

  
  return function(req, res, next){
    var rr = "http://" + req.header('host');
    var service = escape(options.service ||  rr);
    if (_.isString(options)){
      options = {root:options};
    }

    var validate = function(casURL, ticket, callback){
      var request = {
        host: casURL.hostname,
        port: casURL.port ,
        path: casURL.pathname + '/serviceValidate?ticket='+ticket  + '&service=' + service
      }
      
      var parser = new xml2js.Parser();
      parser.addListener('end', function(result) {
        callback(result['cas:authenticationSuccess']);
      });
      
      var protocol;
      switch(casURL.protocol){
        case 'https:':
          protocol = https;
          break
        default:
          protocol = http;
      }

      var casRes = protocol.get(request, function(casRes){
        casRes.on('error', function(err){
         callback(new Error('Unathorized'))
        })
        .on('data', function(chunk){
          if(debug) console.log(chunk.toString());
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

