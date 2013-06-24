/*
 * Author:       Mike Adair madairATdmsolutions.ca
 *               Richard Greenwood rich@greenwoodmap.com
 * License:      LGPL as per: http://www.gnu.org/copyleft/lesser.html
 */
/*
 * Copyright 2008 Institut Geographique National France, released under the
 * BSD license.
 */

/**
 * Namespace: proj4
 * proj4 extensions : uses Ajax for loading scripts.
 */

    /**
     * Property: ProxyHost
     * Proxy host url.
     */
    proj4.ProxyHost= "";

    /**
     * Property: ProxyHostFQDN
     * Fully Qualified Domain Name of proxy host url. It also
     * contains the port.
     */
    proj4.ProxyHostFQDN= null;

    /**
     * APIFunction: getFQDNForUrl
     * Compute (approximate?) the fully qualified domain name for the URL.
     *
     * Parameters:
     * url - {String}
     *
     * Returns:
     * [String} the FQDN.
     */
    proj4.getFQDNForUrl= function(url) {
        if (url) {
            var pdn= url.match(/^[a-z]+:\/\/([^\/]+)\/?/i);
            if (pdn) {
                return pdn[1];
            }
            // figure out FQDN as there is no scheme ...
            // property host contains name and port number if any
            return window.location.host;
        }
        return null;
    };

    /**
     * APIFunction: setProxyUrl
     * Defines the URL of the proxy to use for the AJAX requests
     * (needed for XML resources).
     *
     * Parameters:
     * url - {String}
     */
    proj4.setProxyUrl= function(url) {
        proj4.ProxyHost= url;
        proj4.ProxyHostFQDN= this.getFQDNForUrl(url);
    };

    /**
     * APIFunction: Try
     * Execute functions until one of them doesn't throw an error.
     *     Capitalized because "try" is a reserved word in JavaScript.
     *
     * Parameters:
     * [*] - {Function} Any number of parameters may be passed to Try()
     *    It will attempt to execute each of them until one of them
     *    successfully executes.
     *    If none executes successfully, returns null.
     *
     * Returns:
     * {*} The value returned by the first successfully executed function.
     */
    proj4.Try= function() {
        var returnValue = null;

        for (var i= 0, len=arguments.length; i<len; i++) {
            var lambda = arguments[i];
            try {
                returnValue = lambda();
                break;
            } catch (e) {}
        }

        return returnValue;
    };

    /**
     * APIFunction: loadScript
     * Load a JS file from a URL into a <script> tag in the page.
     * 
     * Parameters:
     * url - {String} The URL containing the script to load
     * onload - {Function} A method to be executed when the script loads successfully
     * onfail - {Function} A method to be executed when there is an error loading the script
     * loadCheck - {Function} A boolean method that checks to see if the script 
     *            has loaded.  Typically this just checks for the existance of
     *            an object in the file just loaded.
     */
    proj4.loadScript= function(url, onload, onfail, loadCheck) {
      // new transport to prevent IE caching ...
      var request= {
        loaded: false,
        onload: onload,
        onfail: onfail,
        loadCheck: loadCheck,
        transport: proj4.Try(
          function() {return new XMLHttpRequest();},
          function() {return new ActiveXObject('Msxml2.XMLHTTP');},
          function() {return new ActiveXObject('Microsoft.XMLHTTP');}
        ) || null
      };
      if (!request.transport) {
        return;
      }
      if (request.transport.overrideMimeType) {
        request.transport.overrideMimeType('text/xml');
      }
      // pollute cache
      var tick= "_tick_=" + new Date().getTime();
      url += (url.indexOf("?")+1 ? "&" : "?") + tick;
      if (proj4.ProxyHost) {
        if (url.indexOf(proj4.ProxyHost)!=0) {
          if (url.search(/^[a-z]+:\/\//i)!=-1) {
            var udn= url.match(/^[a-z]+:\/\/([^\/]*)\/?/i); // file:///...
            if (udn) {
              udn= udn[1];
            }
            if (proj4.ProxyHostFQDN!=udn) {
              // try not to proxy on same domain, this cause errors
              url= proj4.ProxyHost + encodeURIComponent(url);
            }
          }
        }
      }
      request.transport.open("GET",url,false);// synchronous transport
      request.transport.onreadystatechange = proj4.bind(this.onStateChange,this,request);
      var headers= {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
        'proj4': true
      };
      for (var name in headers) {
        request.transport.setRequestHeader(name, headers[name]);
      }
      request.transport.send(null);
      // Force Firefox to handle ready state 4 for synchronous requests
      if (request.transport.overrideMimeType) {
        this.onStateChange(request);
      }
    };
    
    /**
     * APIFunction: onStateChange
     * Handle loading the JSON and possibly manage errors.
     *
     * Parameters:
     * request - {Object} the current AJAX request.
     */
    proj4.onStateChange= function (request) {
      if (request.transport.readyState>1 && !(request.transport.readyState==4 && request.loaded)) {
        var state= 0;
        try {
          state= request.transport.status || 0;
        } catch (e) {
          state= 0;
        }
        var success= state==0 || (state>=200 && state<300);
        if (request.transport.readyState==4) {
          request.loaded= true;
          if (success) {
            eval(request.transport.responseText);
            if (request.loadCheck && !request.loadCheck()) {
              if (request.onfail) {
                request.onfail();
              }
            } else {
              if (request.onload) {
                request.onload();
              }
            }
          } else {
            if (request.onfail) {
              request.onfail();
            }
          }
          request.transport.onreadystatechange= function() {};
        }
      }
    };

    /**
     * APIFunction: checkReadyState
     * Does nothing.
     */
    proj4.checkReadyState= function() {};
