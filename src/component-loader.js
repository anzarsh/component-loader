(function(){
	
	var ComponentLoader = function() {
		this.html = document.body;
		this.components = {};
		this.modules = {};
		this.addCustomEventIE();

		this.emit("COMInit");
	};



	/*files loaders*/

	ComponentLoader.prototype.load = function(params) {
		this.emit("COMLoadStart");
		params.processing();

		var self = this;
		var postfix = ["html", "css", "js"];
		var components = params.components;
		var modules = params.modules;
		this._count = Object.keys(components).length * postfix.length
									 + Object.keys(modules).length;
		this._params = params;
		var xhr = {};

		for (var comp in components) {
		
			for (var i=0; i<postfix.length; i++) {

				var name = comp + postfix[i];

				xhr[name] = new XMLHttpRequest();
				xhr[name].name = comp;
				xhr[name].fullName = comp + "." + postfix[i];
				if(postfix[i] == "html") {
					self._loadHTML(xhr[name], components[comp]);
				} else if(postfix[i] == "css") {
					self._loadCSS(xhr[name], components[comp]);
				} else if(postfix[i] == "js") {
					self._loadJS(xhr[name], components[comp]);
				}

			} // end for postfix

		} // end for components


		for (var module in modules) {
				var name = module;
				xhr[name] = new XMLHttpRequest();
				xhr[name].name = module;
				xhr[name].fullName = module + ".js";
				self._loadModule(xhr[name], modules[module]);
		}

		this.emit("COMLoadStarted");
	};

	ComponentLoader.prototype._loadHTML = function(xhr, path) {
		var self = this;
		xhr.open("GET", path + "/" + xhr.name + ".html", true);
		// xhr.responseType = "document";
		try {
			xhr.overrideMimeType("text/plain; charset=utf-8");
		} catch(e) {}
		xhr.onreadystatechange = function(e) {
			if(this.readyState != 4) return;
			if(this.status == 404) {
				self._count--;
				self._params.warning(
					path + "/" + self.name + ".html" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else if(this.status != 200) {
				self._params.error(
					path + "/" + self.name + ".html" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else {

				self.components[this.name] = self.components[this.name] || {};
				var documentFragment = document.createElement("body");
				documentFragment.innerHTML = this.responseText;
				var component = documentFragment.querySelector("."+this.name);

				if(component) {
				
					self.components[this.name].html = component;
				
				} else {
				
					documentFragment = document.createElement("table");
					documentFragment.innerHTML = this.responseText;
					var component = documentFragment.querySelector("."+this.name);
				
					if(component) {
				
						self.components[this.name].html = component;
				
					}
				
				}

				self._count--;
				if(!self._count) {
					self.emit("COMLoadEnd");
					self._params.success();
				}
			}
		};
		xhr.send(null);
	};

	ComponentLoader.prototype._loadCSS = function(xhr, path) {
		var self = this;
		xhr.open("GET", path + "/" + xhr.name + ".css", true);
		try {
			xhr.overrideMimeType("text/plain; charset=utf-8");
		} catch(e) {}
		xhr.onreadystatechange = function(e) {
			if(this.readyState != 4) return;
			if(this.status == 404) {
				self._count--;
				self._params.warning(
					path + "/" + self.name + ".css" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else if(this.status != 200) {
				self._params.error(
					path + "/" + self.name + ".css" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else {
				self.components[this.name] = self.components[this.name] || {};
				self.components[this.name].css = this.responseText;
				self._count--;
				if(!self._count) {
					self.emit("COMLoadEnd");
					self._params.success();
				}
			}
		};
		xhr.send(null);
	};

	ComponentLoader.prototype._loadJS = function(xhr, path) {
		var self = this;
		xhr.open("GET", path + "/" + xhr.name + ".js", true);
		try {
			xhr.overrideMimeType("text/plain; charset=utf-8");
		}catch(e){}
		xhr.onreadystatechange = function(e) {
			if(this.readyState != 4) return;
			if(this.status == 404) {
				self._count--;
				self._params.warning(
					path + "/" + self.name + ".js" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else if(this.status != 200) {
				self._params.error(
					path + "/" + self.name + ".js" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else {
				self.components[this.name] = self.components[this.name] || {};
				self.components[this.name].constructor = eval(this.responseText);
				self.components[this.name].constructor.prototype
					.emit = self.emit;
				self.components[this.name].constructor.prototype
					.updateData = self.updateData;
				self.components[this.name].constructor.prototype
					.setParams = self.setParams;
				self._count--;
				if(!self._count) {
					self.emit("COMLoadEnd");
					self._params.success();
				}
			}
		};
		xhr.send(null);
	};

	ComponentLoader.prototype._loadModule = function(xhr, path) {
		var self = this;
		xhr.open("GET", path + "/" + xhr.name + ".js", true);
		try {
			xhr.overrideMimeType("text/plain; charset=utf-8");
		}catch(e){}
		xhr.onreadystatechange = function(e){
			if(this.readyState != 4) return;
			if(this.status == 404) {
				self._count--;
				self._params.warning(
					path + "/" + self.name + ".js" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else if(this.status != 200) {
				self._params.error(
					path + "/" + self.name + ".js" + " : "
					 + this.status + " (" + this.statusText + ")"
				);
			} else {
				self.modules[this.name] = self.modules[this.name] || {};
				self.modules[this.name].constructor = eval(this.responseText);
				self.modules[this.name].constructor.prototype.emit = self.emit;
				self._count--;
				if(!self._count) {
					self.emit("COMLoadEnd");
					self._params.success();
				}
			}
		};
		xhr.send(null);
	};

	/*files loaders*/



	/*method of insert styles and html*/

	ComponentLoader.prototype.insertComponents = function(elem) {
		this.emit("COMRenderStart");

		this.insertStyles();

		this.COM = elem; // component object model

		this.insertHTML(this.COM);

		this.addComponentsEvents(this.COM);

		this.addModules();
		
		this.emit("COMRenderEnd");
	};

	ComponentLoader.prototype.insertStyles = function() {
		var styles = "";
		
		var components = this.components;
		for(var comp in components){
			if(components[comp].css)
				styles += components[comp].css;
		}
		var style = document.createElement("style");
		style.textContent = styles;
		document.head.appendChild(style);
	};

	ComponentLoader.prototype.insertHTML = function(elem) {
		var componentTemplates = this.components;
		var componentsInElem = elem.querySelectorAll("[component]");

		this.clearComponents(componentsInElem);

		this.addQuickLinks(elem);

		elem.comNodes = [];
		elem.comNode = {};

		for (var i=0; i<componentsInElem.length; i++) {

			var compName = componentsInElem[i]
											.getAttribute("component");
			var compParamsName = componentsInElem[i]
											.getAttribute("component-params");

			elem.js = elem.js || {}
			elem.js.params = elem.js.params || {};
			var params = elem.js.params[compParamsName] || [null];

			for (var j=0; j<params.length; j++){
				
				componentsInElem[i].appendChild(
					componentTemplates[compName].html.cloneNode(true));
				elem.comNode[compName] = componentsInElem[i].lastChild;
				elem.comNodes.push(componentsInElem[i].lastChild);

				elem.comNode[compName].js = 
								new componentTemplates[compName].constructor();
				elem.comNode[compName].js.componentLoader = this;
				elem.comNode[compName].js.html = elem.comNode[compName];
				elem.comNode[compName].js.params = { self : params[j] };
				elem.comNode[compName].parentCom = elem;
				
				this.insertHTML(componentsInElem[i].lastChild);
				elem.comNode[compName].js.updateData(params[j]);

			}

		}
	};

	ComponentLoader.prototype.clearComponents = function(components) {
		for (var i=0; i<components.length; i++) {

			var currentComponent = components[i];
			while(currentComponent.hasChildNodes())
				currentComponent.removeChild(currentComponent.firstChild);

		}
	};

	ComponentLoader.prototype.addQuickLinks = function(elem) {
		var elements = elem.querySelectorAll("[element]");

		elem.elements = {};

		for (var i=0; i<elements.length; i++) {
			var elementName = elements[i].getAttribute("element");
			elem.elements[elementName] = elements[i];
		}
	};

	ComponentLoader.prototype.addComponentsEvents = function(elem) {
		if(elem.js && elem.js.addEvents)
			elem.js.addEvents();

		for(var i=0; i<elem.comNodes.length; i++){
			this.addComponentsEvents(elem.comNodes[i]);
		}
	};

	ComponentLoader.prototype.addModules = function() {
		var tempModules = this.modules;
		this.COM.modules = {};

		for (var module in tempModules){
			this.COM.modules[module] = new tempModules[module].constructor();
			this.COM.modules[module].html = document.body;
			this.COM.modules[module].addEvents();
		}
	};

	/*method of insert styles and html-components*/



	/*method of updating html-components*/

	ComponentLoader.prototype.updateComponent = function(elem) {
		this.emit("COMUpdateStart", elem);

		this.updateHTML(elem);

		this.addComponentsEvents(elem);

		this.emit("COMUpdateEnd", elem);
	};

	ComponentLoader.prototype.updateHTML = function(elem) {
		var componentTemplates = this.components;
		var componentsInElem = elem.querySelectorAll("[component]");

		this.clearComponents(componentsInElem);

		this.addQuickLinks(elem);

		elem.comNodes = [];
		elem.comNode = {};

		for (var i=0; i<componentsInElem.length; i++) {

			var compName = componentsInElem[i]
											.getAttribute("component");
			var compParamsName = componentsInElem[i]
											.getAttribute("component-params");

			elem.js = elem.js || {}
			elem.js.params = elem.js.params || {};
			var params = elem.js.params[compParamsName] || [null];

			for (var j=0; j<params.length; j++){
				
				componentsInElem[i].appendChild(
					componentTemplates[compName].html.cloneNode(true));
				elem.comNode[compName] = componentsInElem[i].lastChild;
				elem.comNodes.push(componentsInElem[i].lastChild);

				elem.comNode[compName].js = 
								new componentTemplates[compName].constructor();
				elem.comNode[compName].js.componentLoader = this;
				elem.comNode[compName].js.html = elem.comNode[compName];
				elem.comNode[compName].js.params = { self : params[j] };
				elem.comNode[compName].parentCom = elem;
				
				this.updateHTML(componentsInElem[i].lastChild);
				elem.comNode[compName].js.updateData();

			}

		}
	};

	/*method of updating html-components*/



	/*adds custom events support for ie9-11*/

	ComponentLoader.prototype.addCustomEventIE = function() {
		try {
			new CustomEvent(
				"IE has CustomEvent, but doesn't support constructor");
		} catch (e) {
			window.CustomEvent = function(event, params) {
			var evt;
			params = params || {
				bubbles: false,
				cancelable: false,
				detail: undefined
			};
			evt = document.createEvent("CustomEvent");
			evt.initCustomEvent(
				event,
				params.bubbles,
				params.cancelable,
				params.detail
			);
			return evt;
			};
			CustomEvent.prototype = Object.create(window.Event.prototype);
		}
	};

	ComponentLoader.prototype.emit = function(eventName, data) {
		return this.html.dispatchEvent(new CustomEvent(eventName, {
	  	bubbles: true,
	  	cancelable: true,
	  	detail: data
	  }));
	};

	/*adds custom events support for ie9-11*/



	/*methods for adding in component's prototype*/

	ComponentLoader.prototype.updateData = function() {
		var params = this.params.self || null;
		if(!params) return;

		for(var elemParams in params){
			if(this.html.elements[elemParams]) {
			
				if(params[elemParams] === null) {

					this.html.elements[elemParams].textContent = "";

				} else if(typeof params[elemParams] !== "object" &&
									typeof params[elemParams] !== "array") {

					this.html.elements[elemParams].textContent = 
																								params[elemParams];

				} else if(typeof params[elemParams] === "object"){
					
					var attrs = params[elemParams];
					for(var attr in attrs) {
						if(attr == "text"){
							this.html.elements[elemParams].textContent = attrs[attr];
						} else {
							this.html.elements[elemParams]
								.setAttribute(attr, attrs[attr]);
						}
					}

				} // if-else-if end

			} else if(elemParams == "html" &&
								typeof params[elemParams] === "object") {
				var attrs = params[elemParams];
				for(var attr in attrs) {
					this.html.setAttribute(attr, attrs[attr]);
				}
			}
			
		} // for end
	};

	ComponentLoader.prototype.setParams = function(params) {
		if(!params) return;

		this.params = this.params || {};

		for(var param in params){
			this.params[param] = params[param];
		}

		this.componentLoader.updateComponent(this.html);
	};

	ComponentLoader.prototype.updateParams = function(params) {
		this.params.self = { self : params};
		this.updateData();
	};

	/*methods for adding in component's prototype*/


	window.lib = window.lib || {};
	window.lib.ComponentLoader = ComponentLoader;

})();