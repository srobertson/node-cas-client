var cas    = require('../lib/cas.js'),
    http   = require('http');


describe("cas",function(){
  
  var midleware, next, req, res;
  
  beforeEach(function(){
    midleware = cas({root:"http://example.com", service:"http://test.com"});
    next = jasmine.createSpy("next()");
    req  = new http.ClientRequest({});

    req.session = {};
    res  = {};
  });
  
  it('calls next() if an authenticated_user is present in the session', function(){
    
    req.session.authenticated_user = 'blah';
    midleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
  
  it('redirects if  authenticated_user is not present in the session', function(){
    
    req.param    = jasmine.createSpy("param");
    res.redirect = jasmine.createSpy("redirect");
     
    midleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    
    var redirect_url = 'http://example.com?service='+escape('http://test.com');
    expect(res.redirect).toHaveBeenCalledWith(redirect_url);
  });
  
  it('validates the ticket if present',function(){

    var defered = {on:jasmine.createSpy("http spy").andCallFake(function(event,callback){
      defered[event]=callback;
      return this;
    })};
    
    spyOn(http,'get').andCallFake(function(options, callback){
      callback(defered);
    });
    
    req.param    = jasmine.createSpy("param").andReturn("ticket");
    midleware(req, res, next);
    
    defered.data("<cas:authenticationSuccess><email>bob@foo.com</email></cas:authenticationSuccess>");
    defered.data("</cas>");
    
    expect(defered.on).toHaveBeenCalledWith('error',jasmine.any(Function));
    expect(defered.on).toHaveBeenCalledWith('data',jasmine.any(Function));

  });
  

});