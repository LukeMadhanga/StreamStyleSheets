(function (window, count) {

    var ef = function () {},
    detailscache = {};

    /**
     * Trim the ends of a string
     * @param {string} string The string to trim
     * @returns {string} The trimmed string
     */
    function trim(string) {
        return string ? string.replace(/^\s+(.*)\s+/mg, "$1") : '';
    }
    
    /**
     * Convert an array-like object into an array
     * @param {object} object The object to convert into an array
     * @returns {array} The array
     */
    function toArray(object) {
        return Array.prototype.slice.call(object);
    }
    
    /**
     * Test whether a given object is of a given type, e.g. string, function etc.
     * @param {mixed} object The object to test
     * @param {string} type The expected type
     * @returns {boolean} <b>True</b> if the tested variable is of the type specified
     */
    function is_a(object, type) {
        return Object.prototype.toString.call(object).toLowerCase() === '[object ' + type + ']'.toLowerCase();
    }
    
    
    
    /**
     * Generate a xhtml element, e.g. a div element
     * @syntax cHE.getHtml(tagname, body, htmlid, cssclass, {attribute: value});
     * @param {string} tagname The type of element to generate
     * @param {string} body The body to go with 
     * @param {string} id The id of this element
     * @param {string} cssclass The css class of this element
     * @param {object} moreattrs An object in the form {html_attribute: value, ...}
     * @returns {html} The relevant html as interpreted by the browser
     */
    function getHtml(tagname, body, id, cssclass, moreattrs) {
        var html = document.createElement(tagname);
        if (body) {
            html.innerHTML = body;
        }
        if (id) {
            html.id = id;
        }
        if (cssclass) {
            html.className = cssclass;
        }
        setAttributes(html, moreattrs);
        return html.outerHTML;
    };

    /**
     * Set the custom attributes
     * @param {object(DOMElement)} obj
     * @param {object(plain)} attrs
     * @returns {object(DOMElement)}
     */
    function setAttributes(obj, attrs) {
        if (is_a(attrs, 'object')) {
            for (var x in attrs) {
                if (attrs.hasOwnProperty(x)) {
                    var val = attrs[x];
                    if (typeof val === 'boolean') {
                        // Convert booleans to their integer representations
                        val = val ? 1 : 0;
                    }
                    obj.setAttribute(x, val);
                }
            }
        }
    }

    /**
     * The vendor prefix for the current browser
     * @type object An object with the properties {dom: string, lowercase: string, css: string, js: string}
     */
    var vendor = (function () {
        var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (toArray(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
        return {
            dom: dom,
            lowercase: pre,
            css: '-' + pre + '-',
            js: pre[0].toUpperCase() + pre.substr(1)
        };
    })(),

    /**
     * A list of CSS styles supported by this browser
     * @type array
     */
    stylelist = (function () {
        var output = [],
        allstyles = document.body.style;
        for (var x in allstyles) {
            if (x) {
                var s = x.replace(/([A-Z])/g, "-$1").toLowerCase();
                output[output.length] = s.replace(vendor.lowercase + '-', vendor.css);
            }
        }
        return output;
    })(),

    /**
     * The default styles 
     * @type object An object with all of the default properties
     */
    styledefaults = (function () {
        // Start off by creating a default element that will be added to the DOM in order to get default styles
        var output = {},
        elem = document.createElement('a');
        elem.id = 's3-def-elem';
        $('body').append(elem);
        for (var i = 0; i < stylelist.length; i++) {
            var rule = stylelist[i],
                    def = getStyle(elem, rule);
            output[rule] = def;
        }
        $(elem).remove();
        return output;
    })(),
    /**
     * The timeout indicator for the window resize event
     * @type int
     */
    resizeTimeout;

    /**
     * Get a unique CSS selector for a given object
     * @returns {string} The event key in the form 'tagname#elemid.class1.classn'
     */
    function getElementEventKey() {
        var t = $(this),
        key = $(this).data('s3-elem-key');
        if (!key) {
            var key = this.tagName.toLowerCase();
            if (this.id) {
                // Add the id
                key += '#' + this.id;
            }
            if (!this.classList.length && !this.id) {
                // There is no distinguishing info about this item: add some
                this.classList[this.classList.length] = 'streamstylesheets-' + key + '-' + $(key).index(this);
            }
            if (this.classList.length) {
                // Add the classes to the key
                key += '.' + toArray(this.classList).join('.').replace(/\s+/, '');
            }
            t.data('s3-elem-key', key);
        }
        return key;
    }

    /**
     * 
     * @from http://goo.gl/iCGy
     * @param {type} elem
     * @param {type} rule
     * @returns {String}
     */
    function getStyle(elem, rule) {
        var output = null;
        if (document.defaultView && document.defaultView.getComputedStyle) {
            output = document.defaultView.getComputedStyle(elem, "").getPropertyValue(rule);
        } else if (elem.currentStyle) {
            rule = rule.replace(/\-(\w)/g, function (strmatch, p1) {
                return p1.toUpperCase();
            });
            output = elem.currentStyle[rule];
        }
        return output;
    }
    
    /**
     * Render a pulse animation on the middle of an element
     * @param {DOMElement} elem The element for which a pulse is being rendered
     */
    function renderPulse(elem) {
        var rect = elem.getBoundingClientRect(),
        output = getHtml('div', null, null, 's3-pulse') + getHtml('div', null, null, 's3-dot'),
        elemkey = $(elem).data('s3-elem-key');
        // Remove any previous instances of the pulse
        $('[data-s3-for="' + elemkey + '"]').remove();
        $('#s3-pulse-container-all').append(getHtml('div', output, null, 's3-pulse-container', {'data-s3-for': elemkey}));
        var pulse = $('[data-s3-for="' + elemkey + '"]');
        pulse.css({top: rect.top + (rect.height / 2), left: rect.left + (rect.width / 2)});
        pulse.click(displayEditor);
    }
    
    /**
     * Render the editor body
     */
    function renderEditor() {
        if ($('#s3-theme-editor').length) {
            // The editor has already been built
            return;
        }
        var html = getHtml('div', renderHeadButtons(), 's3-editor-head');
        
        html += getHtml('div', null, 's3-theme-body');
        $('body').append(getHtml('div', getHtml('div', html, 's3-theme-editor'), 's3-theme-editor-container', 's3-hidden'));
    }
    
    /**
     * Render the header buttons
     * @returns {html}
     */
    function renderHeadButtons() {
        return getHtml('span', getHtml('div', null, 's3-menu-item-container'), 's3-menu', 's3-head-btn s3icons-reorder') + 
                getHtml('span', null, 's3-close-window', 's3-head-btn s3icons-check');
    }
    
    function displayEditor() {
        var t = $(this);
        $('.s3-pulse', t).addClass('s3-active-pulse');
        $('.s3-dot', t).addClass('s3-active-dot');
        buildMenu(t);
        $('#s3-theme-editor-container').removeClass('s3-hidden');
    }
    
    /**
     * Build the menu that allows the user to switch between rules to edit
     * @param {jqelem} elem
     */
    function buildMenu(elem) {
        var key = elem.data('s3-for'),
        sl = detailscache[key]['allowedstyles'],
        mc = $('#s3-menu-item-container');
        mc.children().remove();
        for (var i = 0; i < sl.length; i ++) {
            mc.append(getHtml('span', sl[i], null, 's3-menu-item', {'data-rule': sl[i]}));
        }
        $('.s3-menu-item').click(function () {
            
        });
    }
    
    window.streamStyleSheets = function (opts) {
        var T = {
            s: $.extend({
                autoinit: true,
                allowedpseudostates: ['hover'],
                datalist: [],
                oninit: ef
            }, opts)
        };
        
        
        T.init = function() {
            if (!$('#s3-pulse-container').length) {
                // The pulse container has not yet been created, do so now
                $('body').append(getHtml('div', null, 's3-pulse-container-all'));
            }
            cacheDetails();
            renderEditor();
            initBinding();
            execCallback('init');
        };
        
        /**
         * Execute a callback
         * @syntax execCallback(funcname, thisarg[,...])
         * @param {string} funcname The name of the function to call, excluding the leading 'on'
         * @param {object} thisarg The object to set as 'this' when calling the function
         * @returns {unresolved} The return values from the callback
         */
        function execCallback(funcname, thisarg) {
            var func = T.s['on' + funcname];
            if (is_a(func, 'function')) {
                return func.apply(thisarg, toArray(arguments).splice(2));
            }
        }

        function runDefaultEvents() {

        }
        
        /**
         * Cache CSS details about this item and jQuery events
         */
        function cacheDetails() {
            var dl = T.s.datalist;
            // Iterate through all of the objects supplied by the caller, getting the events and styles
            for (var i = 0; i < dl.length; i++) {
                var curobj = dl[i],
                elements = $(curobj.selector);
                elements.data({'s3-settings': curobj});
                elements.each(function () {
                    var ev = $._data(this, 'events'),
                    key = getElementEventKey.call(this),
                    output = {css: {}, defcss: {}, allowedstyles: curobj.allowedstyles},
                    hasstyles = false;
                    renderPulse(this);
                    if (ev) {
                        // This element has events. Add them to the details
                        output.events = ev;
                    }
                    for (var i = 0; i < curobj.allowedstyles.length; i++) {
                        // Start off by getting a list of allowed pseudo states
                        var aps = T.s.allowedpseudostates || curobj.allowedpseudostates,
                        rule = curobj.allowedstyles[i],
                        res = getStyle(this, rule, state ? ':' + state : undefined),
                        ruleoutput = {};
                        aps[aps.length] = undefined;
                        for (var j = 0; j < aps.length; j++) {
                            var state = aps[j];
                            if (res) {
                                // There is a value for this CSS rule
                                // Determine whether the value is a default. If so, cache it as one, otherwise put it in the main css output
                                var outputkey = styledefaults[rule] === res ? 'defcss' : 'css';
                                ruleoutput[state ? state : 'main'] = res;
                                hasstyles = true;
                            }
                        }
                        for (var x in ruleoutput) {
                            // Remove any duplicate properties
                            if (x !== 'main' && ruleoutput[x] === ruleoutput['main']) {
                                delete ruleoutput[x];
                            }
                        }
                        output[outputkey][rule] = ruleoutput;
                    }
                    if (ev || hasstyles) {
                        // There are events and/or styles
                        detailscache[key] = output;
                    }
                    $(this).unbind();
                });
            }
        }
        
        function initBinding() {
            $(window).unbind('resize.s3').bind('resize.s3', function () {
                window.clearTimeout(resizeTimeout);
                resizeTimeout = window.setTimeout(function () {
                    var dl = T.s.datalist;
                    // Iterate through all of the objects and reposition the pulses
                    for (var i = 0; i < dl.length; i++) {
                        var curobj = dl[i],
                        elements = $(curobj.selector);
                        elements.each(function () {
                            renderPulse(this);
                        });
                    }
                }, 200);
            });
            $('#s3-close-window').unbind('click.s3').bind('click.s3', function () {
                
            });
        }

        // Auto-executing function
        (function () {
            if (T.s.autoinit) {
                // Initialise the function automatically
                T.init();
            }
        })();

        return T;
    };

})(this, 0);