// ==UserScript==
// @name         Zeplin CSS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.zeplin.io/project.html
// @require      http://code.jquery.com/jquery-latest.js
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

$(document).ready(function() {
    var screenContainer = $('#screenContainer');

    Template.initialize();
    screenContainer.on('click', Template.update);
});

var Template = (function() {
    var id = 'layerCss';
    var html =
        '<div id="layerCss">' +
        '<h2>' +
        '<span>Styles</span>' +
        '<button type="button" id="copyLayerCss">click to copy</button>' +
        '</h2>' +
        '<div id="layerCssContent">' +
        '</div>' +
        '</div>';

	var textLayer = $('#textLayerInfo');

    var elements = {
        width: $('#layerWidth'),
        height: $('#layerHeight'),
        opacity: $('#layerOpacity'),
        radius: $('#layerRadius'),
        rotation: $('#layerRotation'),
        backgroundBlendMode: $('#layerBlendMode'),
        fontFamily: $('#layerFontFace'),
        fontSize: $('#layerFontSize'),
        lineHeight: $('#layerLineHeight'),
        letterSpacing: $('#layerLetterSpacing'),
        color: $('#layerTextColor'),
        backgroundColor: $('#layerFillContainer'),
        border: $('#layerBorders'),
        boxSizing: $('#layerBorders .borderPosition'),
        shadow: $('#layerShadowContainer')
    };

    var _prefix = {
        vendors: ['webkit', 'moz', 'ms' , 'o'],
        elements: ['background-blend-mode', 'transform']
    };

    var properties = {};
    var cssContent = null;
    var btnCopy = null;

    return {
        initialize: initialize,
        update: update
    };

    function assignVariables() {
        cssContent = $('#layerCssContent');
        btnCopy = $('#copyLayerCss');
    }

    function prefixProperties() {
        for(var i = 0; i < _prefix.elements.length; i++) {
            var prop = _prefix.elements[i];

            if(properties.hasOwnProperty(prop)) {
                for(var j = 0; j < _prefix.vendors.length; j++) {
                	console.log(prop);
                    properties['-' + _prefix.vendors[j] + '-' + prop] = properties[prop];
                }

                // properties[prop] = properties[prop];

            }
        }
    }

    function assignProperties() {
        properties = {};
        for(var prop in elements) {
            if(elements.hasOwnProperty(prop)) {
                var value = getProperty(prop);
                if(value) {
                    properties[prop] = value;
                }
            }
        }

        prefixProperties();
    }

    function getProperty(prop) {
        if(!elements[prop].is(':visible')) {
            return null;
        }

        var dashedProperty = dashed(prop);

        switch(prop) {
            case 'width':
            case 'height': {
                properties[dashedProperty] = Math.round(parseFloat(elements[prop].html())) + 'px';
                break;
            }
            case 'backgroundBlendMode':
            case 'fontFamily':
            case 'fontSize':
            case 'lineHeight':
            case 'letterSpacing': {
                properties[dashedProperty] = elements[prop].html().toLowerCase();
                break;
            }
            case 'color':
            case 'backgroundColor': {
            	var isGradient = elements[prop].find('.gradient').length !== 0;

            	if(isGradient) {
            		dashedProperty = 'background-image';
            		var values = [];
            		var data = {};

            		elements[prop].find('.colorValue').each(function(i, el) {
        				if(i === 0) {
    						data.top = $(el).text();
        				} else {
							data.bottom = $(el).text();
        				}
            		});

        			values.push('-webkit-linear-gradient(top, '+data.top+',' + data.bottom + ')');
        			values.push('-moz-linear-gradient(top, '+data.top+',' + data.bottom + ')');
        			values.push('-o-linear-gradient(top, '+data.top+',' + data.bottom + ')');
        			values.push('linear-gradient(to bottom, '+data.top+',' + data.bottom + ')');
        			properties[dashedProperty] = values;

            	} else {
            		var $color = elements[prop].find('.colorValue');
	                if($color.length && $color.is(':visible')) {
	                    properties[dashedProperty] = $color.html();
	                }
            	}
                break;
            }
            case 'opacity': {
                properties[dashedProperty] = parseInt(elements[prop].html()) / 100;
                break;
            }
            case 'rotation': {
                if(properties.hasOwnProperty('transform')) {
                    properties.transform += 'rotate(' + parseInt(elements[prop].html()) + 'deg)';
                } else {
                    properties['transform'] = 'rotate(' + parseInt(elements[prop].html()) + 'deg)';
                }
                break;
            }
            case 'boxSizing': {
                var value = elements[prop].html(); // inside, outside
                if(value === 'inside') {
                    properties[dashedProperty] = 'border-box';
                }
                break;
            }
            case 'border': {
                var border = {};

                var $borderThickness = elements[prop].find('.borderThickness');
                if($borderThickness.length && $borderThickness.is(':visible')) {
                    var borderWidth = $borderThickness.html();

                    if(borderWidth) {
                        border.width = borderWidth;
                    }
                }

                var $borderColor = elements[prop].find('.colorValue');
                if($borderColor.length && $borderColor.is(':visible')) {
                    var borderColor = $borderColor.html();
                    if(borderColor) {
                        border.color = borderColor;
                    }
                }


                if(border.hasOwnProperty('width') && border.hasOwnProperty('color')) {
                    properties[dashedProperty] = border.width + ' solid ' + border.color;
                } else {
                    for(prop in border) {
                        if(border.hasOwnProperty(prop)) {
                            properties[dashedProperty + '-' + prop] = border[prop];
                        }
                    }
                }
                break;
            }

            case 'shadow': {
                var $shadow = elements.shadow;
                var shadow = {};

                shadow.type = $shadow.find('.shadowType').html();
                shadow.x = $shadow.find('.shadowOffsetX').html();
                shadow.y = $shadow.find('.shadowOffsetY').html();
                shadow.blur = $shadow.find('.shadowBlurRadius').html();
                shadow.spread = $shadow.find('.shadowSpread').html();
                shadow.color = $shadow.find('.colorValue').html();

            	if(textLayer.is(':visible')) { // it is text shadow
					properties['text-shadow'] = shadow.x + ' ' + shadow.y + ' ' + shadow.blur + ' ' + shadow.color;
            	} else { // it is box shadow
					properties['box-shadow'] = shadow.x + ' ' + shadow.y + ' ' + shadow.blur + ' ' + shadow.spread + ' ' + shadow.color;
	                if(shadow.type !== 'outer') {
	                    properties['box-shadow'] = 'inner ' + properties['box-shadow'];
	                }
            	}

                break;
            }
            // TODO not implemented yet
            case 'radius':
                return null;
            default:
                return null;
        }
    }

    function initialize() {
        insertTemplate();
    }

    function insertTemplate() {
        $('#layerView').prepend(html);
        style();
        assignVariables();
        bindEvents();
    }

    function update() {
        assignProperties();
        updateView();
    }

    function updateView() {
        var htmlList = '';
        for(var prop in properties) {
            if(properties.hasOwnProperty(prop)) {
            	console.log(typeof properties[prop]);
            	if(Object.prototype.toString.call(properties[prop]) === '[object Array]') {
            		for(var i = 0; i < properties[prop].length; i++) {
        				htmlList += '<li>' + prop + ': ' + properties[prop][i] + ';</li>';
            		}
            	} else {
            		htmlList += '<li>' + prop + ': ' + properties[prop] + ';</li>';
            	}
            }
        }

        $('#layerCssContent').html('<ul>' + htmlList + '</ul>');
    }

    function bindEvents() {
        $('#copyLayerCss').on('click', function() {
            copy();
        });
    }

    function copy() {
        var selection = getSelection();
        var selected = false;

        if (!selection || !selection.anchorNode || selection.anchorNode.parentNode !== $('#layerCssContent')[0]) {
            var range = document.createRange();
            selection.removeAllRanges(), range.selectNodeContents(cssContent[0]), selection.addRange(range), selected = true;
        }
        try {
            document.execCommand("copy") && toast("Copied to clipboard!", "right");
        } catch (e) {
            console.error("Unable to copy layer content");
        }
        selected && selection.removeAllRanges();
    }


    function dashed(str) {
        return str.replace(/([A-Z])/g, "-$1").toLowerCase()
    }

    function toast(e, t) {
        var n = document.createElement("div");
        n.classList.add("toast", t), n.textContent = e, document.body.appendChild(n), setTimeout(function() {
            n.classList.add("show"), setTimeout(function() {
                n.addEventListener("transitionend", function() {
                    n.remove();
                }), n.classList.remove("show");
            }, 3000);
        }, 50);
    }

    function style() {
        var css =
                '#copyLayerCss { height: 20px; line-height: 19px; font-size: 14px; color: #ee6723; }' +
                '#layerCss h2 { display: -webkit-flex; -webkit-align-items: flex-end; -webkit-justify-content: space-between; display: flex; align-items: flex-end; justify-content: space-between;}' +
                '#layerCssContent ul {font-size: 12px; padding: 14px 12px 10px; white-space: nowrap; overflow: auto; max-width: 100%;}' +
                '#layerCssContent li + li { margin-top: 2px; }',
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    }
})();
