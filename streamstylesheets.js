(function (window, count) {

    var ef = function () {},
    detailscache = {},
    render = function (desc) {
        var output = '';
        if (desc.label || desc.type === 'none') {
            output += getHtml('div', desc.label || 'Disabled', null, 's3-elem-label');
        }
        var input = '',
        attribs = {'data-desc': JSON.stringify(desc)};
        switch (desc.type) {
            case 'color':
                attribs.type = 'color';
                attribs.placeholder = '#000000';
                attribs.pattern = '#[a-f0-9]{6}';
                input = getHtml('input', null, null, 's3-input s3-color-picker', attribs);
                break;
            case 'none':
                attribs.type = 'checkbox';
                input += getHtml('input', null, null, 's3-disabled', attribs);
                break;
            case 'option':
                var opts = '';
                for (var i = 0; i < desc.options.length; i++) {
                    var curopt = desc.options[i];
                    opts += getHtml('option', curopt, null, null, {value: curopt});
                }
                input = getHtml('select', opts, null, 's3-input s3-select', attribs);
                break;
            case 'range':
                attribs.type = ('min' in desc) && ('max' in desc) ? 'range' : 'number';;
                if ('min' in desc) {
                    attribs.min = desc.min;
                }
                if ('max' in desc) {
                    attribs.max = desc.max;
                }
                if ('step' in desc) {
                    attribs.step = desc.step;
                }
                input = getHtml('input', null, null, 's3-input s3-' + attribs.type, attribs);
                break;
            case 'complete':
            case 'text':
            default:
                input = getHtml('input', null, null, 's3-input s3-text', attribs);
        }
        output += getHtml('div', input, null, 's3-input-container');
        return output;
    },
    rf = {
        margin: [{type: 'range', label: 'top'}, {type: 'range', label: 'right'}, {type: 'range', label: 'bottom'}, {type: 'range', label: 'left'}],
        marginTop: [{type: 'range', units: ['px', 'em', '%']}],
        background: [{type: 'text'}],
        backgroundColor: [{type: 'color'}],
        backgroundRepeat: [{type: 'option', options: ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'inherit']}],
        border: [{type: 'none'}, {type: 'text', label: 'thickness'}, {type: 'option', options: ['solid', 'dotted', 'dashed'], label: 'style'}, {type: 'color', label: 'color'}],
        boxShadow: [{type: 'option', options: ['outline', 'inset'], label: 'outline'}, {type: 'range', label: 'x length'}, {type: 'range', label: 'y length'}, {type: 'range', label: 'blur radius', min: 0, units: ['px']}, {type: 'range', label: 'spread', min: 0, units: ['px']}, {type: 'color', label: 'color'}],
        content: [{type: 'text'}],
        cursor: [{type: 'complete', options: ['auto', 'crosshair', 'default', 'pointer', 'move', 'e-resize', 'ne-resize', 'nw-resize', 'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help', 'progress']}],
        display: [{type: 'option', options: ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-column-group', 'table-column', 'table-cell', 'table-caption', 'none', 'inherit']}],
        fontFamily: [{type: 'text'}],
        fontStyle: [{type: 'option', options: ['inherit', 'initial', 'italic', 'normal', 'oblique']}],
        fontVariant: [{type: 'text'}],
        fontWeight: [{type: 'complete', options: ['bold', 'lighter', 'normal']}],
        opacity: [{type: 'range', min: 0, max: 1, step: '.01'}],
        overflow: [{type: 'option', options: ['auto', 'hidden', 'initial', 'inherit', 'overlay', 'scroll', 'visible']}],
        position: [{type: 'option', options: ['absolute', 'fixed', 'inherit', 'initial', 'relative', 'static']}],
        speak: [{type: 'option', options: ['auto', 'inherit', 'initial', 'none', 'normal']}],
        textAlign: [{type: 'option', options: ['left', 'right', 'center', 'justify', 'inherit']}],
        textTransform: [{type: 'option', options: ['capitalize', 'uppercase', 'lowercase', 'none', 'inherit']}],
        width: [{type: 'range', min: 0, units: ['px', 'em', '%']}]
    },
    requiresPrefix = ['borderRadius'];
    rf.lineHeight = rf.minWidth = rf.minHeight = rf.borderBottomLeftRadius = rf.borderBottomRightRadius = rf.borderTopLeftRadius = rf.borderTopRightRadius = rf.borderRadius = rf.height = rf.width;
    rf.padding = rf.margin;
    rf.zIndex = rf.right = rf.bottom = rf.left = rf.top = rf.marginRight = rf.marginBottom = rf.marginLeft = rf.paddingRight = rf.paddingBottom = rf.paddingLeft = rf.paddingTop = rf.marginTop;
    rf.borderTop = rf.borderRight = rf.borderBottom = rf.borderLeft = rf.border;
    rf.color = rf.backgroundColor;
    console.log(rf);

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
     * Convert an rgb(a) string into a hexadecimal
     * @param {stirng} string An rgb(a) color definition
     * @returns {object} An object with two properties, hex (the hexadecimal value of the color) and a (The alpha value)
     */
    function rgbStringToHex(string) {
        var bits = string.replace(' ', '').replace(/rgb(:?a)?\(([^\)]*)\)/, "$2").split(',');
        return {hex: string.match(/^#/) ? string : rgbToHex(+bits[0], +bits[1], +bits[2]), a: bits[4] ? bits[4] : 1};
    }
    
    /**
     * Convert a color from its RGB components into a hexadecimal value with leading hash
     * @see http://goo.gl/amRqN4
     * @param {int} r The red color value
     * @param {int} g The green color value
     * @param {int} b The blue color value
     * @returns {string} The hexadecimal value of the RGB string
     */
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

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
     * 
     * @param {string} rule
     * @param {mixed} value
     */
    function updateCodeArea(rule, value) {
        var r = rule.replace(' ', '-');
        var prefs = requiresPrefix.indexOf(r) !== -1 ? ['-webkit-', '-moz-', ''] : [''];
        var bits = [];
        for (var i = 0; i < prefs.length; i++) {
            bits[bits.length] = prefs[i] + r + ': ' + value + ';';
        }
        $('#s3-code-area').html(bits.join('<br/>'));
    }
    
    window.streamStyleSheets = function (opts) {
        var T = {
            currentkey: null,
            history: [],
            historykey: 0,
            s: $.extend({
                autoinit: true,
                allowedpseudostates: ['hover'],
                datalist: [],
                oninit: ef
            }, opts),
            values: {}
        },
        updatinghistory = false;
        
        
        T.init = function() {
            if (!$('#s3-pulse-container').length) {
                // The pulse container has not yet been created, do so now
                $('body').append(getHtml('div', null, 's3-pulse-container-all'));
            }
            cacheDetails();
            T.renderEditor();
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
                    T.renderPulse(this);
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
    
        /**
         * Render a pulse animation on the middle of an element
         * @param {DOMElement} elem The element for which a pulse is being rendered
         */
        T.renderPulse = function(elem) {
            var rect = elem.getBoundingClientRect(),
            output = getHtml('div', null, null, 's3-pulse') + getHtml('div', null, null, 's3-dot'),
            elemkey = $(elem).data('s3-elem-key');
            // Remove any previous instances of the pulse
            $('[data-s3-for="' + elemkey + '"]').remove();
            $('#s3-pulse-container-all').append(getHtml('div', output, null, 's3-pulse-container', {'data-s3-for': elemkey}));
            var pulse = $('[data-s3-for="' + elemkey + '"]');
            pulse.css({top: rect.top + (rect.height / 2), left: rect.left + (rect.width / 2)});
            pulse.click(T.displayEditor);
        };

        /**
         * Render the editor body
         */
        T.renderEditor = function () {
            if ($('#s3-theme-editor').length) {
                // The editor has already been built
                return;
            }
            var html = getHtml('div', T.renderHeadButtons(), 's3-editor-head');

            html += getHtml('div', null, 's3-theme-body');
            $('body').append(getHtml('div', getHtml('div', html, 's3-theme-editor'), 's3-theme-editor-container', 's3-hidden'));
        };

        /**
         * Render the header buttons
         * @returns {html}
         */
        T.renderHeadButtons = function () {
            return getHtml('span', getHtml('div', null, 's3-menu-item-container'), 's3-menu', 's3-head-btn s3icons-reorder') + 
                    getHtml('span', null, 's3-close-window', 's3-head-btn s3icons-check');
        };

        T.displayEditor = function() {
            var t = $(this);
            $('.s3-pulse', t).addClass('s3-active-pulse');
            $('.s3-dot', t).addClass('s3-active-dot');
            T.buildMenu(t);
            $('#s3-theme-editor-container').removeClass('s3-hidden');
            T.currentkey = t.data('s3-for');
        };
        
        
        function renderRules(data, rule, def) {
            if (!data) {
                return;
            }
            var r = rule.replace(/([^a-z])/g, function (x) {
                return ' ' + x.toLowerCase();
            }),
            output = getHtml('div', r, null, 's3-rule-title'),
            cssrule = r.replace(' ', '-');
            for (var i = 0; i < data.length; i++) {
                output += getHtml('div', render(data[i]), null, 's3-rule-container');
            }
            output += getHtml('div', null, 's3-code-area');
            $('#s3-theme-body').html(getHtml('div', output, 's3-body-inner'));
            var disabler = $('.s3-disabled');
            if (def === 'none') {
                disabler.attr({checked: 'checked'});
            } else {
                var defbits = def.split(/[^, ] ,/),
                valbits = [];
                disabler.removeAttr('checked');
                $('.s3-input').each(function (e) {
                    var desc = $(this).data('desc');
                    if (e < defbits.length) {
                        var val = defbits[e];
                        switch (desc.type) {
                            case 'color':
                                val = rgbStringToHex(val).hex;
                                break;
                            case 'range':
                                val = +val.replace('px', '');
                                break;
                        }
                        $(this).val(val);
                        valbits[valbits.length] = val;
                    }
                });
                updateCodeArea(r, valbits.join(' '));
            }
            
            disabler.change(function () {
                var s3i = $('.s3-input');
                if (this.checked) {
                    // Disable all inputs
                    s3i.attr({disabled: 'disabled'});
                    updateCodeArea(r, 'none');
                    $(T.currentkey).css(cssrule, 'none');
                } else {
                    // Reenable the inputs and fire the on change event
                    s3i.removeAttr('disabled');
                    s3i.change();
                }
            });

            $('.s3-input').change(function () {
                if (!disabler.length || !disabler[0].checked) {
                    var vb = [];
                    $('.s3-input').each(function (e) {
                        vb[e] = this.value;
                    });
                    var cssvalue = vb.join(' ');
                    updateCodeArea(r, cssvalue);
                    $(T.currentkey).css(cssrule, cssvalue);
                    if (!updatinghistory) {
                        T.updatehistory(cssrule);
                        console.log(T.history);
                    }
                }
            });
        }
        
        /**
         * 
         * @param {string} rule The css rule being updated
         */
        T.updatehistory = function (rule) {
            updatinghistory = true;
            // Make sure that there is nothing infront of the history
            T.history = T.history.splice(0, T.historykey);
            T.history[T.historykey] = {selector: T.currentkey, rule: rule, value: $(T.currentkey).css(rule)};
            $('.s3-input').change();
            T.historykey++;
            updatinghistory = false;
        };

        /**
         * Build the menu that allows the user to switch between rules to edit
         * @param {jqelem} elem
         */
        T.buildMenu = function(elem) {
            var key = elem.data('s3-for'),
            sl = detailscache[key]['allowedstyles'],
            mc = $('#s3-menu-item-container');
            mc.children().remove();
            sl.sort(function (a, b) {
                return (a > b) - (a < b);
            });
            for (var i = 0; i < sl.length; i ++) {
                mc.append(getHtml('span', sl[i], null, 's3-menu-item', {'data-rule': sl[i]}));
            }
            $('.s3-menu-item').click(function () {
                var r = $(this).data('rule');
                var rule = r.replace(/-(.)/g, function (x) {
                    return x[1].toUpperCase();
                }),
                desc = rf[rule];
                renderRules(desc, rule, getStyle($(key)[0], r));
            });
            $('.s3-menu-item:first').click();
        };
        
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
                            T.renderPulse(this);
                        });
                    }
                }, 200);
            });
            $('#s3-close-window').unbind('click.s3').bind('click.s3', function () {
                $('.s3-active-pulse').removeClass('s3-active-pulse');
                $('.s3-active-dot').removeClass('s3-active-dot');
                $('#s3-theme-editor-container').addClass('s3-hidden');
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