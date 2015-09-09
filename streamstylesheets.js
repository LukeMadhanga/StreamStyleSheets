(function ($, count, window) {
    
    var ef = function () {},
    detailscache = {},
    rf = {
        background: [{type: 'text'}],
        backgroundAttachment: [{type: 'option', options: ['scroll', 'fixed', 'inherit']}],
        backgroundColor: [{type: 'color'}],
        backgroundRepeat: [{type: 'option', options: ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'inherit']}],
        border: [{type: 'text', label: 'thickness'}, {type: 'option', options: ['solid', 'dotted', 'dashed'], label: 'style'}, {type: 'color', label: 'color'}],
        boxShadow: [{type: 'option', options: ['', 'inset'], label: 'outline'}, {type: 'range', label: 'x length', units: ['px', 'em']}, {type: 'range', label: 'y length', units: ['px', 'em']}, {type: 'range', label: 'blur radius', min: 0, units: ['px']}, {type: 'range', label: 'spread', min: 0, units: ['px']}, {type: 'color', label: 'color'}],
        boxSizing: [{type: 'option', options: ['content-box', 'padding-box', 'border-box', 'inherit']}],
        cursor: [{type: 'complete', options: ['auto', 'crosshair', 'default', 'pointer', 'move', 'e-resize', 'ne-resize', 'nw-resize', 'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help', 'progress']}],
        display: [{type: 'option', options: ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-column-group', 'table-column', 'table-cell', 'table-caption', 'none', 'inherit']}],
        float: [{type: 'option', options: ['left', 'right', 'none', 'inherit']}],
        fontStyle: [{type: 'option', options: ['inherit', 'initial', 'italic', 'normal', 'oblique']}],
        fontWeight: [{type: 'complete', options: ['bold', 'lighter', 'normal']}],
        margin: [{type: 'range', label: 'top', units: ['px', 'em', '%']}, {type: 'range', label: 'right', units: ['px', 'em', '%']}, {type: 'range', label: 'bottom', units: ['px', 'em', '%']}, {type: 'range', label: 'left', units: ['px', 'em', '%']}],
        marginTop: [{type: 'range', units: ['px', 'em', '%']}],
        opacity: [{type: 'range', min: 0, max: 1, step: '.01'}],
        overflow: [{type: 'option', options: ['auto', 'hidden', 'initial', 'inherit', 'overlay', 'scroll', 'visible']}],
        position: [{type: 'option', options: ['absolute', 'fixed', 'inherit', 'initial', 'relative', 'static']}],
        speak: [{type: 'option', options: ['auto', 'inherit', 'initial', 'none', 'normal']}],
        textAlign: [{type: 'option', options: ['left', 'right', 'center', 'justify', 'inherit']}],
        textTransform: [{type: 'option', options: ['capitalize', 'uppercase', 'lowercase', 'none', 'inherit']}],
        whiteSpace: [{type: 'option', options: ['normal', 'pre', 'nowrap', 'pre-wrap', 'pre-line', 'inherit']}],
        width: [{type: 'range', min: 0, units: ['px', 'em', '%']}]
    },
    requiresPrefix = ['borderRadius', 'transition', 'transform'];
    // Only has text value
    //rf.baselineShift = rf.backgroundSize = rf.backgroundPosition = rf.backgroundPositionX = rf.backgroundPositionY = rf.backgroundOrigin = rf.backgroundClip = rf.transform = rf.fontVariant = rf.content = rf.fontFamily = rf.backgroundImage = rf.verticalAlign = rf.outline = rf.transition = rf.background;
    // Only has number value
    rf.letterSpacing = rf.lineHeight = rf.minWidth = rf.minHeight = rf.borderBottomLeftRadius = rf.borderBottomRightRadius = rf.borderTopLeftRadius = rf.borderTopRightRadius = rf.borderRadius = rf.height = rf.width;
    rf.padding = rf.margin;
    rf.zIndex = rf.right = rf.bottom = rf.left = rf.top = rf.marginRight = rf.marginBottom = rf.marginLeft = rf.paddingRight = rf.paddingBottom = rf.paddingLeft = rf.paddingTop = rf.marginTop;
    rf.borderTop = rf.borderRight = rf.borderBottom = rf.borderLeft = rf.border;
    rf.color = rf.backgroundColor;
    
    var methods = {
        init: function (opts) {
            var T = this;
            if (T.length > 1) {
                // If the length is more than one, apply this function to all objects
                T.each(function() {
                    $(this).streamStyleSheets(opts);
                });
                return T;
            } else if (!T.length || T.data('streamstylesheetsdata')) {
                // There are no objects or
                // This object has already been instantiated
                return T;
            }
            var data = {
                currentkey: null,
                instancecount: ++count,
                s: $.extend({
                    active: false,
                    autoinit: true,
                    allowedpseudostates: ['hover'],
                    datalist: [],
                    onbeforesave: ef,
                    oninit: ef,
                    onsave: ef,
                    onsavefail: ef,
                    submitpath: '',
                    title: tx('Untitled')
                }, opts),
                values: {}
            },
            hist = [],
            hkey = 0,
            hint = null,
            hentry,
            updatinghistory = false;

            /**
             * Initialise the plugin
             */
            data.init = function() {
                if (!$('#s3-pulse-container').length) {
                    // The pulse container has not yet been created, do so now
                    $('body').append(getHtml('div', null, 's3-pulse-container-all'));
                }
                data.cacheDetails();
                data.renderEditor();
                initBinding();
                execCallback('init');
            };
            
            /**
             * Move in history
             * @param {boolean} undo
             */
           function moveInHistory(undo) {
               if (undo && hkey === 0 || !undo && hkey === (hist.length - 1)) {
                   // There is no movement in history
                   return;
               }
               updatinghistory = true;
               hkey = undo ? hkey - 1 : hkey + 1;
               var obj = hist[hkey];
               $(obj.selector).css(obj.rule, obj[undo ? 'undo' : 'redo']);
               updatinghistory = false;
           }

           /**
            * Save the changes made
            */
           function saveChanges() {
               $('.s3-active-pulse').removeClass('s3-active-pulse');
               $('.s3-active-dot').removeClass('s3-active-dot');
               $('#s3-theme-editor-container').addClass('s3-hidden');
               var cur = $(data.currentkey),
               settings = cur.data('s3-settings');
               for (var i = 0; i < settings.allowedstyles.length; i++) {
                   var rule = settings.allowedstyles[i];
                   data.values[settings.selector][rule] = cur.css(rule);
               }
               T.data('s3.streamstylesheetsdata', data);
           }

           function initBinding() {
               $(window).unbind('resize.s3resize').bind('resize.s3resize', function () {
                   window.clearTimeout(resizeTimeout);
                   resizeTimeout = window.setTimeout(function () {
                       var dl = data.s.datalist;
                       // Iterate through all of the objects and reposition the pulses
                       for (var i = 0; i < dl.length; i++) {
                           var curobj = dl[i],
                           elements = $(curobj.selector);
                           elements.each(function () {
                               data.renderPulse(this);
                           });
                       }
                   }, 200);
               });
               $(window).unbind('keydown.s3kp').bind('keydown.s3kp', function (e) {
                   var iscmd = e.metaKey || e.ctrlKey;
                   if (iscmd && (e.which === 90 || e.which === 89) && ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(e.target.tagName) === -1) {
                       // An undo/redo has been requested
                       moveInHistory(e.metaKey ? !(e.shiftKey && e.which === 90) : e.which === 90);
                   }
               });
               $('#s3-undo').unbind('click.s3undo').bind('click.s3undo', function () {
                   moveInHistory(true);
               });
               $('#s3-redo').unbind('click.s3redo').bind('click.s3redo', function () {
                   moveInHistory();
               });
               $('#s3-save').unbind('click.s3save').bind('click.s3save', function () {
                   var data = T.data('s3.streamstylesheetsdata');
                   streamConfirm(tx('Are you sure?'), function () {
                       if (execCallback('beforesave', null, {instance: data}) === false) {
                           return false;
                       }
                       $.ajax({
                           url: data.s.submitpath,
                           dataType: 'JSON',
                           type: 'post',
                           data: {payload: JSON.stringify({
                                   data: data.values, 
                                   title: $('#s3-title').val(), 
                                   active: $('#s3-active-toggle')[0].checked ? 1 : 0
                               })
                           }
                       }).done(function (e) {
                           if (e.result === 'OK') {
                               if (execCallback('save', null, {data: e.data}) === false) {
                                   return false;
                               }
                               document.location = e.data;
                           } else {
                               execCallback('savefail');
                               streamConfirm(tx('Oops'), function () {}, tx('Failed to save style changes'), {nocancel: true});
                           }
                       }).fail(function (e) {
                           execCallback('savefail');
                           streamConfirm(tx('Oops'), function () {}, tx('Failed to save style changes'), {nocancel: true});
                           console.error(e.responseText);
                       });
                   }, tx('Are you sure that you want to modify this theme variant?'));
               });
               $('#s3-close-window').unbind('click.s3save').bind('click.s3save', saveChanges);
           }

            /**
             * Execute a callback
             * @syntax execCallback(funcname, thisarg[,...])
             * @param {string} funcname The name of the function to call, excluding the leading 'on'
             * @param {object} thisarg The object to set as 'this' when calling the function
             * @returns {unresolved} The return values from the callback
             */
            function execCallback(funcname, thisarg) {
                var func = data.s['on' + funcname];
                if (is_a(func, 'function')) {
                    return func.apply(thisarg, toArray(arguments).splice(2));
                }
            }

            /**
             * Cache CSS details about this item and jQuery events
             */
            data.cacheDetails = function() {
                var dl = data.s.datalist;
                // Iterate through all of the objects supplied by the caller, getting the events and styles
                for (var i = 0; i < dl.length; i++) {
                    var curobj = dl[i],
                    elements = $(curobj.selector);
                    elements.data({'s3-settings': curobj});
                    data.values[curobj.selector] = {};
                    elements.each(function () {
                        var ev = $._data(this, 'events'),
                        key = getElementEventKey.call(this),
                        output = {css: {}, defcss: {}, allowedstyles: curobj.allowedstyles},
                        hasstyles = false;
                        data.renderPulse(this);
                        if (ev) {
                            // This element has events. Add them to the details
                            output.events = ev;
                        }
                        for (var i = 0; i < curobj.allowedstyles.length; i++) {
                            // Start off by getting a list of allowed pseudo states
                            var aps = data.s.allowedpseudostates || curobj.allowedpseudostates,
                            rule = curobj.allowedstyles[i],
                            res = getStyle(this, rule, state ? ':' + state : undefined),
                            ruleoutput = {};
                            aps[aps.length] = undefined;
                            for (var j = 0; j < aps.length; j++) {
                                var state = aps[j];
                                if (res) {
                                    // There is a value for this CSS rule
                                    // Determine whether the value is a default. If so, cache it as one, otherwise put it in the main css output
                                    var outputkey = styledefaults[rule] === res ? 'defcss' : 'css',
                                    statekey = state ? state : 'main';
                                    ruleoutput[statekey] = res;
                                    if (statekey === 'main' && outputkey === 'css') {
                                        // Store the current states
                                        data.values[curobj.selector][rule] = res;
                                    }
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
                T.data('s3.streamstylesheetsdata', data);
            };

            /**
             * Render a pulse animation on the middle of an element
             * @param {DOMElement} elem The element for which a pulse is being rendered
             */
            data.renderPulse = function(elem) {
                var rect = elem.getBoundingClientRect(),
                output = getHtml('div', null, null, 's3-pulse') + getHtml('div', null, null, 's3-dot'),
                elemkey = $(elem).data('s3-elem-key');
                // Remove any previous instances of the pulse
                $('[data-s3-for="' + elemkey + '"]').remove();
                $('#s3-pulse-container-all').append(getHtml('div', output, null, 's3-pulse-container', {'data-s3-for': elemkey}));
                var pulse = $('[data-s3-for="' + elemkey + '"]');
                pulse.css({top: rect.top + (rect.height / 2), left: rect.left + (rect.width / 2)});
                pulse.click(data.displayEditor);
            };

            /**
             * Render the editor body
             */
            data.renderEditor = function () {
                if ($('#s3-theme-editor').length) {
                    // The editor has already been built
                    return;
                }
                var html = getHtml('div', data.renderHeadButtons(), 's3-editor-head'),
                body = $('body'),
                activeattrs = {type: 'checkbox'};
                if (data.s.active) {
                    activeattrs['checked'] = 'checked';
                }
                html += getHtml('div', null, 's3-theme-body');
                body.append(getHtml('div', getHtml('div', html, 's3-theme-editor'), 's3-theme-editor-container', 's3-hidden'));
                body.append(getHtml('div',
                    getHtml('input', null, 's3-title', null, {value: data.s.title}) +
                    getHtml('div', getHtml('span', 'Active') + getHtml('input', null, 's3-active-toggle', null, activeattrs), 's3-active') +
                    getHtml('span', null, 's3-undo', 's3icons-reply s3-icon-button') +
                    getHtml('span', null, 's3-redo', 's3icons-forward s3-icon-button') + 
                    getHtml('span', null, 's3-save', 's3icons-check s3-icon-button'),
                's3-button-bay'));
            };

            /**
             * Render the header buttons
             * @returns {html}
             */
            data.renderHeadButtons = function () {
                return getHtml('span', getHtml('div', null, 's3-menu-item-container'), 's3-menu', 's3-head-btn s3icons-reorder') + 
                        getHtml('span', null, 's3-close-window', 's3-head-btn s3icons-check');
            };

            /**
             * Display the CSS editor
             */
            data.displayEditor = function() {
                var t = $(this);
                data.currentkey = t.data('s3-for');
                $('.s3-pulse', t).addClass('s3-active-pulse');
                $('.s3-dot', t).addClass('s3-active-dot');
                data.buildMenu(t);
                $('#s3-theme-editor-container').removeClass('s3-hidden');
            };

            /**
             * 
             * @param {type} ruledata
             * @param {type} rule
             * @param {type} def
             */
            function renderRules(ruledata, rule, def) {
                if (!data) {
                    return;
                }
                var r = rule.replace(/([^a-z])/g, function (x) {
                    return ' ' + x.toLowerCase();
                }),
                cssrule = r.replace(' ', '-'),
                cur = $(data.currentkey),
                settings = cur.data('s3-settings'),
                checked = settings.selector in data.values ? !!data.values[settings.selector][rule] : true,
                enabledinput = getHtml('input', null, null, 's3-enabled', {type: 'checkbox', checked: checked, title: 'Enabled'}),
                output = getHtml('div', r + enabledinput, null, 's3-rule-title');
                for (var i = 0; i < ruledata.length; i++) {
                    output += getHtml('div', render(ruledata[i]), null, 's3-rule-container');
                }
                output += getHtml('div', null, 's3-code-area');
                $('#s3-theme-body').html(getHtml('div', output, 's3-body-inner'));
                var disabler = $('.s3-disabled'),
                enableall = $('.s3-enabled');
                if (def === 'none') {
                    if (disabler.length) {
                        disabler.attr({checked: 'checked'});
                    } else {
                        enableall[0].checked = false;
                    }
                } else {
                    def = preprocessValue(def, rule);
                    var inputs = $('.s3-input').not('.s3-units'),
                    defbits = def.split(' '),
                    valbits = [];
                    disabler.removeAttr('checked');
                    if (inputs.length < defbits.length) {
                        // There aren't enough inputs so only use the first one
                        defbits = [def];
                    }
                    inputs.each(function (e) {
                        var t = $(this),
                        desc = $(this).data('desc');
                        if (e < defbits.length) {
                            var val = defbits[e],
                            units = '';
                            switch (desc.type) {
                                case 'range':
                                    var bits = val.split(/[^\d\.]/);
                                    val = +bits[0];
                                    units = bits[1] || '';
                                    break;
                            }
                            t[0].value = val;
                            if (units) {
                                t.siblings('.s3-units')[0].value = units;
                            }
                            valbits[valbits.length] = val;
                        }
                    });
                    updateCodeArea(r, valbits.join(' '));
                }

                disabler.change(function () {
                    var s3i = $('.s3-input').not('.s3-units');
                    if (this.checked) {
                        // Disable all inputs
                        s3i.attr({disabled: 'disabled'});
                        updateCodeArea(r, 'none');
                        $(data.currentkey).css(cssrule, 'none');
                        data.updateHistory(cssrule, 'none');
                    } else {
                        // Reenable the inputs and fire the on change event
                        s3i.removeAttr('disabled');
                        s3i.change();
                    }
                });

                enableall.change(function () {
                    var s3i = $('.s3-input').not('.s3-units');
                    if (this.checked) {
                        // Make sure that everything is enabled
                        s3i.removeAttr('disabled');
                        s3i.change();
                    } else {
                        var defaultstyle = 'initial' || styledefaults[cssrule];
                        s3i.attr({disabled: 'disabled'});
                        updateCodeArea(r, 'intial');
                        $(data.currentkey).css(cssrule, defaultstyle);
                        data.updateHistory(cssrule, defaultstyle);
                        data.values[settings.selector][cssrule] = 'initial';
                        T.data('s3.streamstylesheetsdata', data);
                    }
                });

                $('.s3-input').change(function () {
                    if (enableall[0].checked && (!disabler.length || !disabler[0].checked)) {
                        var vb = [];
                        $('.s3-input').not('.s3-units').each(function (e) {
                            if (this.value) {
                                var units = $(this).siblings('.s3-units').val() || '';
                                vb[e] = this.value + units;
                            }
                        });
                        var cssvalue = vb.join(' '),
                        el = $(data.currentkey);
                        updateCodeArea(r, cssvalue);
                        if (!updatinghistory) {
                            data.updateHistory(cssrule, cssvalue);
                        }
                        el.css(cssrule, cssvalue);
                    }
                });
            }

            /**
             * Update the history state
             * @param {string} rule The css rule being updated
             * @param {string} newvalue The css rule being updated
             */
            data.updateHistory = function (rule, newvalue) {
                hentry = {selector: data.currentkey, rule: rule, undo: $(data.currentkey).css(rule), redo: newvalue};
                if (hint !== null) {
                    // Only update the history every so and so
                    return false;
                }
                updatinghistory = true;
                // Make sure that there is nothing infront of the history
                hist = hist.splice(0, hkey);
                hist[hkey] = hentry;
                $('.s3-input').change();
                hkey++;
                updatinghistory = false;
                hint = window.setTimeout(function () {
                    hint = null;
                }, 500);
            };

            /**
             * Build the menu that allows the user to switch between rules to edit
             * @param {jqelem} elem
             */
            data.buildMenu = function(elem) {
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
                    desc = rf[rule] || rf.background;
                    renderRules(desc, rule, getStyle($(key)[0], r));
                });
                $('.s3-menu-item:first').click();
            };
            
            if (data.s.autoinit) {
                // Initialise the function automatically
                data.init();
            }
            console.log(styledefaults);
            T.data('s3.streamstylesheetsdata', data);
            return T;
        }
    };
    
    /**
     * Trim the ends of a string
     * @param {string} string The string to trim
     * @returns {string} The trimmed string
     */
    function trim(string) {
        return string ? string.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ') : '';
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
     * Pre-process the css value for use on the editor
     * @param {string} val The value to process
     * @param {string} rule The css rule for which the value is being processed
     * @return {string} The processed value
     */
    function preprocessValue(val, rule) {
        var rgb = trim(val.replace(/.*(rgb(:?a)?\([^\)]*\)).*/, "$1")),
        hex;
        if (rgb.match(/^rgb/)) {
            hex = rgbStringToHex(rgb).hex;
            val = val.replace(rgb, hex);
        }
        switch (rule) {
            case 'boxShadow':
                // In chrome, the box shadow string is in the form 'colour x y ...' instead of 'x, y, ..., color'
                val = trim(val.replace(hex, '') + ' ' + hex);
                if (!val.match(/^inset/)) {
                    // Add a blank space at the beginning so that on split, there is an empty value
                    val = ' ' + val;
                }
                break;
            case 'padding':
            case 'margin':
                // This is the kind of value that can be defined a manner of ways to represent four values
                var bits = val.split(' ');
                switch (bits.length) {
                    case 1:
                        val = val + ' ' + val + ' ' + val + ' ' + val;
                        break;
                    case 2:
                        val = val + ' ' + val;
                        break;
                    case 3:
                        val = val + ' ' + bits[1];
                        break;
                }
                break;
        }
        return val;
    }
    
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
     * Get a style for an element
     * @from http://goo.gl/iCGy
     * @param {DOMElement} elem The element from which to get the style
     * @param {string} rule The css rule to retrieve
     * @returns {string}
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
        var r = rule.replace(' ', '-'),
        prefs = requiresPrefix.indexOf(r) !== -1 ? ['-webkit-', '-moz-', ''] : [''],
        bits = [],
        cssrule = r.replace(/-(.)/g, function (x) {
            return x[1].toUpperCase();
        });
        for (var i = 0; i < prefs.length; i++) {
            bits[bits.length] = prefs[i] + r + ': ' + value + ';';
        }
        $('#s3-code-area').html(bits.join('<br/>'));
    }
    
    function render (desc) {
        var output = '';
        if (desc.label || desc.type === 'none') {
            output += getHtml('div', desc.label || 'Disabled', null, 's3-elem-label');
        }
        var input = '',
        classes = ['s3-input'],
        attribs = {'data-desc': JSON.stringify(desc)};
        if (desc.units) {
            classes[classes.length] = 's3-with-units';
        }
        switch (desc.type) {
            case 'color':
                attribs.type = 'color';
                attribs.placeholder = '#000000';
                attribs.pattern = '#[a-f0-9]{6}';
                input = getHtml('input', null, null, classes.concat(['s3-color-picker']).join(' '), attribs);
                break;
            case 'none':
                attribs.type = 'checkbox';
                input += getHtml('input', null, null, 's3-disabled', attribs);
                break;
            case 'option':
                input = renderOptionsField(desc, classes, attribs);
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
                input = getHtml('input', null, null, classes.concat(['s3-' + attribs.type]).join(' '), attribs);
                break;
            case 'complete':
            case 'text':
            default:
                input = getHtml('input', null, null, classes.concat(['s3-text']).join(' '), attribs);
        }
        if (desc.units) {
            input += renderOptionsField({options: desc.units}, ['s3-input', 's3-units'], null);
        }
        output += getHtml('div', input, null, 's3-input-container');
        return output;
    }
    
    function renderOptionsField(desc, classes, attribs) {
        var opts = '';
        for (var i = 0; i < desc.options.length; i++) {
            var curopt = desc.options[i];
            opts += getHtml('option', curopt || 'Select...', null, null, {value: curopt});
        }
        return getHtml('select', opts, null, classes.concat(['s3-select']).join(' '), attribs);
    }

    $.fn.streamStyleSheets = function(methodOrOpts) {
        if (methods[methodOrOpts]) {
            // The first option passed is a method, therefore call this method
            return methods[methodOrOpts].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (Object.prototype.toString.call(methodOrOpts) === '[object Object]' || !methodOrOpts) {
            // The default action is to call the init function
            return methods.init.apply(this, arguments);
        } else {
            // The user has passed us something dodgy, throw an error
            $.error(['The method ', methodOrOpts, ' does not exist'].join(''));
        }
    };
    
})(jQuery, 0, this);