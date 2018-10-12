/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 * 
 * updated by peter yun
 * caution: use ExtJS library and i18n
 * date: 1 August, 2018
 */

(function() {
    CKEDITOR.dialog.add('colordialog', function (editor) {
        // Reference the dialog.
        var lang = editor.lang.colordialog;
        var dialog, table;
        var iHex, iR, iG, iB, iH, iS, iV, backgroundNone, cp;
        var isBackgroundNone = false;

        /**
         * Event Listeners
         */
        function onKeyStrokes(evt) {
            //https://css-tricks.com/snippets/javascript/javascript-keycodes/
            switch (evt.keyCode) {
                // SPACE
                // ENTER
                case 32:
                case 13:
                    updateSelected(evt);
                    evt.preventDefault();
                    evt.stopPropagation();
                    break;
                default:
                    // Do not stop not handled events.Co
                    return;
            }
        }

        function onChangeRGB() {
            if (!ColorPicker) { return; }
            cp.setHex(
                ColorPicker.rgb2hex({
                    r: iR.value,
                    g: iG.value,
                    b: iB.value,
                })
                );
            }
            
        function onChangeHSV() {
            if (!ColorPicker) { return; }
            cp.setHex(
                ColorPicker.hsv2hex({
                    h: iH.value,
                    s: iS.value,
                    v: iV.value,
                })
            );
        }

        /**
         * Color Updaters
         */
        function updateInputs(hex) {
            if (!ColorPicker) { return; }
            var rgb = ColorPicker.hex2rgb(hex);
            var hsv = ColorPicker.hex2hsv(hex);
            iHex.value = isBackgroundNone ? PR.i18n('phoenix.generic.none') : hex.toUpperCase();
            // iHex.value = hex;
            iR.value = rgb.r;
            iG.value = rgb.g;
            iB.value = rgb.b;
            iH.value = hsv.h.toFixed(2);
            iS.value = hsv.s.toFixed(2);
            iV.value = hsv.v.toFixed(2);

            dialog.getContentElement('picker', 'selectedColor').setValue(hex);
        }

        function updateSelected(evt) {
            var target = evt.target;
            if (target.id === 'rgb_r' || target.id === 'rgb_g' || target.id === 'rgb_b') {
                onChangeRGB();
            } else if (target.id === 'hsv_h' || target.id === 'hsv_s' || target.id === 'hsv_v') {
                onChangeHSV();
            } else if (target.id === 'hex') {
                cp.setHex(iHex.value);
            }
        }

        function clearStatus() {
            if (backgroundNone) {
                backgroundNone.removeCls('active');
            }
            if (advancedCpContainer) {
                advancedCpContainer.removeCls('background-none');
            }
        }

        function createNewColorTable() {
            html = [];
            html.push('<div class="advanced-colorpicker">');
            html.push('<div class="cke_color_picker_table">');
            html.push('  <div class="cke_color_selector">');
            html.push('    <div class="color_picker_container">');
            html.push('      <div id="color-picker" class="cp cp_normal"></div>');
            html.push('    </div>');
            html.push('    <div class="color_display_container">');
            html.push('      <input class="standard hex" id="hex" type="text" value="">');
            html.push('      <label class="background-none-label">None</label>');
            html.push('      <span class="background-none-checker" id="background-none"></span>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('  <div class="cke_color_rgbhsv_selector io pr-new-form">');
            html.push('    <div class="rgb-container">');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>R:</label>');
            html.push('            <input class="standard" id="rgb_r" type="number" min="0" max="255" value="" />');
            html.push('        </div>');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>G:</label>');
            html.push('            <input class="standard" id="rgb_g" type="number" min="0" max="255" value="" />');
            html.push('        </div>');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>B:</label>');
            html.push('            <input class="standard" id="rgb_b" type="number" min="0" max="255" value="" />');
            html.push('        </div>');
            html.push('    </div>');
            html.push('    <div class="hsv-container">');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>H:</label>');
            html.push('            <input class="standard" id="hsv_h" type="text" value="" />');
            html.push('        </div>');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>S:</label>');
            html.push('            <input class="standard" id="hsv_s" type="text" value="" />');
            html.push('        </div>');
            html.push('        <div class="cp-field-container">');
            html.push('            <label>V:</label>');
            html.push('            <input class="standard" id="hsv_v" type="text" value="" />');
            html.push('        </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            html.push('</div>');
            table = CKEDITOR.dom.element.createFromHtml(html.join(''));
        }

        createNewColorTable();
        CKEDITOR.document.appendStyleSheet(CKEDITOR.getUrl(CKEDITOR.plugins.get('colordialog').path + 'dialogs/colordialog.css'));

        return {
            title: lang.title,
            minWidth: 360,
            minHeight: 260,
            onLoad: function () {
                // Update reference.
                dialog = this;
            },
            onHide: function () {
                clearStatus();
            },
            contents: [{
                id: 'picker',
                label: lang.title,
                accessKey: 'I',
                elements: [{
                    type: 'hbox',
                    padding: 0,
                    widths: ['100%', '0%'],
                    children: [{
                            type: 'html',
                            html: '<div></div>',
                            onLoad: function () {
                                CKEDITOR.document.getById(this.domId).append(table);
                            },
                            focus: function () {
                                var type;
                                var selectedColor = '#2f55cc';
                                if (dialog.advanced) {
                                    type = dialog.advanced.type;
                                    selectedColor = dialog.advanced.selectedColor;
                                }
                                iHex = document.querySelector('#hex');
                                iR = document.querySelector('#rgb_r');
                                iG = document.querySelector('#rgb_g');
                                iB = document.querySelector('#rgb_b');
                                iH = document.querySelector('#hsv_h');
                                iS = document.querySelector('#hsv_s');
                                iV = document.querySelector('#hsv_v');
                                backgroundNone = Ext.select('#background-none');
                                advancedCpContainer = Ext.select('.advanced-colorpicker');
                                cp = ColorPicker(document.querySelector('.cp'), updateInputs);
                                //#rgba(0, 0, 0, 0) is first-selection case
                                //#transparent is IE
                                if (selectedColor == '#rgba(0, 0, 0, 0)' || selectedColor == '#transparent') {
                                    selectedColor = '#000000';
                                }
                                // if (selectedColor == '#000000' || selectedColor == '#rgba(0, 0, 0, 0)') {
                                //     isBackgroundNone = true;
                                //     cp.setHex('#000000');
                                //     iHex.value = PR.i18n('phoenix.generic.none');
                                //     backgroundNone.addCls('active');
                                //     advancedCpContainer.addCls('background-none');
                                // } else {
                                isBackgroundNone = false;
                                cp.setHex(selectedColor);
                                // }
                                _setChangeHandlers();

                                function _setChangeHandlers() {
                                    if (backgroundNone && backgroundNone.elements && backgroundNone.elements[0]) {
                                        backgroundNone.elements[0].onclick = function () {
                                            isBackgroundNone = !isBackgroundNone;
                                            cp.setHex(ColorPicker.rgb2hex({
                                                r: 0,
                                                g: 0,
                                                b: 0
                                            }));
                                            backgroundNone.toggleCls('active');
                                            advancedCpContainer.toggleCls('background-none');
                                        };
                                    }

                                    iHex.onchange = function () {
                                        cp.setHex(iHex.value);
                                    };
                                    iR.onchange = onChangeRGB;
                                    iG.onchange = onChangeRGB;
                                    iB.onchange = onChangeRGB;
                                    iH.onchange = onChangeHSV;
                                    iS.onchange = onChangeHSV;
                                    iV.onchange = onChangeHSV;

                                    iHex.onkeydown = onKeyStrokes;
                                    iR.onkeydown = onKeyStrokes;
                                    iG.onkeydown = onKeyStrokes;
                                    iB.onkeydown = onKeyStrokes;
                                    iH.onkeydown = onKeyStrokes;
                                    iS.onkeydown = onKeyStrokes;
                                    iV.onkeydown = onKeyStrokes;
                                }
                            },
                        },
                        {
                            type: 'html',
                            id: 'selectedColor',
                            html: '<input type="text" class="color_selected_value">',
                        }
                    ]
                } ]
            } ]
        };
    });
})();
