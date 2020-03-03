/*!
 * Name          : steelseries.js
 * Authors       : Gerrit Grunwald, Mark Crossley
 * Last modified : 25.01.2016
 * Revision      : 0.14.17
 *
 * Copyright (c) 2011, Gerrit Grunwald, Mark Crossley
 * All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without modification, are permitted
 *  provided that the following conditions are met:
 *
 *  # Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *  # Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided with the distribution.
 *
 *   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING,
 *   BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 *   SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 *   DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *   INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 *   OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/*globals Tween */
/*jshint onevar:false,plusplus:false,nomen:false,bitwise:false*/

var steelseries = (function () {
    // Constants
    var HALF_PI     = Math.PI * 0.5,
        TWO_PI      = Math.PI * 2,
        PI          = Math.PI,
        RAD_FACTOR  = Math.PI / 180,
        DEG_FACTOR  = 180 / Math.PI,
        doc         = document,
        lcdFontName = 'LCDMono2Ultra,Arial,Verdana,sans-serif',
        stdFontName = 'Arial,Verdana,sans-serif';

    //*************************************   C O M P O N O N E N T S   ************************************************
    var radial = function (canvas, parameters) {
        parameters = parameters || {};
        var gaugeType = (undefined === parameters.gaugeType ? steelseries.GaugeType.TYPE4 : parameters.gaugeType),
            size = (undefined === parameters.size ? 0 : parameters.size),
            minValue = (undefined === parameters.minValue ? 0 : parameters.minValue),
            maxValue = (undefined === parameters.maxValue ? (minValue + 100) : parameters.maxValue),
            niceScale = (undefined === parameters.niceScale ? true : parameters.niceScale),
            threshold = (undefined === parameters.threshold ? (maxValue - minValue) / 2 + minValue: parameters.threshold),
            thresholdRising = (undefined === parameters.thresholdRising ? true : parameters.thresholdRising),
            section = (undefined === parameters.section ? null : parameters.section),
            area = (undefined === parameters.area ? null : parameters.area),
            titleString = (undefined === parameters.titleString ? '' : parameters.titleString),
            unitString = (undefined === parameters.unitString ? '' : parameters.unitString),
            frameDesign = (undefined === parameters.frameDesign ? steelseries.FrameDesign.METAL : parameters.frameDesign),
            frameVisible = (undefined === parameters.frameVisible ? true : parameters.frameVisible),
            backgroundColor = (undefined === parameters.backgroundColor ? steelseries.BackgroundColor.DARK_GRAY : parameters.backgroundColor),
            backgroundVisible = (undefined === parameters.backgroundVisible ? true : parameters.backgroundVisible),
            pointerType = (undefined === parameters.pointerType ? steelseries.PointerType.TYPE1 : parameters.pointerType),
            pointerColor = (undefined === parameters.pointerColor ? steelseries.ColorDef.RED : parameters.pointerColor),
            knobType = (undefined === parameters.knobType ? steelseries.KnobType.STANDARD_KNOB : parameters.knobType),
            knobStyle = (undefined === parameters.knobStyle ? steelseries.KnobStyle.SILVER : parameters.knobStyle),
            lcdColor = (undefined === parameters.lcdColor ? steelseries.LcdColor.STANDARD : parameters.lcdColor),
            lcdVisible = (undefined === parameters.lcdVisible ? true : parameters.lcdVisible),
            lcdDecimals = (undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals),
            digitalFont = (undefined === parameters.digitalFont ? false : parameters.digitalFont),
            fractionalScaleDecimals = (undefined === parameters.fractionalScaleDecimals ? 1 : parameters.fractionalScaleDecimals),
            ledColor = (undefined === parameters.ledColor ? steelseries.LedColor.RED_LED : parameters.ledColor),
            ledVisible = (undefined === parameters.ledVisible ? true : parameters.ledVisible),
            userLedColor = (undefined === parameters.userLedColor ? steelseries.LedColor.GREEN_LED : parameters.userLedColor),
            userLedVisible = (undefined === parameters.userLedVisible ? false : parameters.userLedVisible),
            thresholdVisible = (undefined === parameters.thresholdVisible ? true : parameters.thresholdVisible),
            minMeasuredValueVisible = (undefined === parameters.minMeasuredValueVisible ? false : parameters.minMeasuredValueVisible),
            maxMeasuredValueVisible = (undefined === parameters.maxMeasuredValueVisible ? false : parameters.maxMeasuredValueVisible),
            foregroundType = (undefined === parameters.foregroundType ? steelseries.ForegroundType.TYPE1 : parameters.foregroundType),
            foregroundVisible = (undefined === parameters.foregroundVisible ? true : parameters.foregroundVisible),
            labelNumberFormat = (undefined === parameters.labelNumberFormat ? steelseries.LabelNumberFormat.STANDARD : parameters.labelNumberFormat),
            playAlarm = (undefined === parameters.playAlarm ? false : parameters.playAlarm),
            alarmSound = (undefined === parameters.alarmSound ? false : parameters.alarmSound),
            customLayer = (undefined === parameters.customLayer ? null : parameters.customLayer),
            tickLabelOrientation = (undefined === parameters.tickLabelOrientation ? (gaugeType === steelseries.GaugeType.TYPE1 ? steelseries.TickLabelOrientation.TANGENT : steelseries.TickLabelOrientation.NORMAL) : parameters.tickLabelOrientation),
            trendVisible = (undefined === parameters.trendVisible ? false : parameters.trendVisible),
            trendColors = (undefined === parameters.trendColors ? [steelseries.LedColor.RED_LED, steelseries.LedColor.GREEN_LED, steelseries.LedColor.CYAN_LED] : parameters.trendColors),
            useOdometer = (undefined === parameters.useOdometer ? false : parameters.useOdometer),
            odometerParams = (undefined === parameters.odometerParams ? {} : parameters.odometerParams),
            odometerUseValue = (undefined === parameters.odometerUseValue ? false : parameters.odometerUseValue),
            fullScaleDeflectionTime = (undefined === parameters.fullScaleDeflectionTime ? 2.5 : parameters.fullScaleDeflectionTime);

        // Get the canvas context and clear it
        var mainCtx = getCanvasContext(canvas);
        // Has a size been specified?
        if (size === 0) {
            size = Math.min(mainCtx.canvas.width, mainCtx.canvas.height);
        }

        // Set the size - also clears the canvas
        mainCtx.canvas.width = size;
        mainCtx.canvas.height = size;

        // Create audio tag for alarm sound
        var audioElement;
        if (playAlarm && alarmSound !== false) {
            audioElement = doc.createElement('audio');
            audioElement.setAttribute('src', alarmSound);
            audioElement.setAttribute('preload', 'auto');
        }

        var value = minValue;
        var odoValue = minValue;
        var self = this;

        // Properties
        var minMeasuredValue = maxValue;
        var maxMeasuredValue = minValue;

        var ledBlinking = false;
        var userLedBlinking = false;

        var ledTimerId = 0;
        var userLedTimerId = 0;
        var tween;
        var repainting = false;

        var trendIndicator = steelseries.TrendState.OFF;
        var trendSize = size * 0.06;
        var trendPosX = size * 0.29;
        var trendPosY = size * 0.36;

        // GaugeType specific private variables
        var freeAreaAngle;
        var rotationOffset;
        var tickmarkOffset;
        var angleRange;
        var angleStep;

        var angle = rotationOffset + (value - minValue) * angleStep;

        var imageWidth = size;
        var imageHeight = size;

        var centerX = imageWidth / 2;
        var centerY = imageHeight / 2;

        // Misc
        var ledSize = size * 0.093457;
//        var ledPosX = 0.6 * imageWidth;
//        var ledPosY = 0.4 * imageHeight;
//        var userLedPosX = gaugeType === steelseries.GaugeType.TYPE3 ? 0.6 * imageWidth : centerX - ledSize / 2;
//        var userLedPosY = gaugeType === steelseries.GaugeType.TYPE3 ? 0.72 * imageHeight : 0.75 * imageHeight;
        var userLedPosX = gaugeType === steelseries.GaugeType.TYPE3 ? 0.6 * imageWidth : centerX - 1.25 * ledSize;
        var userLedPosY = gaugeType === steelseries.GaugeType.TYPE3 ? 0.72 * imageHeight : 0.7 * imageHeight;
        var ledPosX = gaugeType === steelseries.GaugeType.TYPE3 ? 0.6 * imageWidth : centerX + 0.4 * ledSize;
        var ledPosY = userLedPosY;
        var lcdFontHeight = Math.floor(imageWidth / 10);
        var stdFont = lcdFontHeight + 'px ' + stdFontName;
        var lcdFont = lcdFontHeight + 'px ' + lcdFontName;
        var lcdHeight = imageHeight * 0.13;
        var lcdWidth = imageWidth * 0.4;
        var lcdPosX = (imageWidth - lcdWidth) / 2;
        var lcdPosY = imageHeight * 0.57;
        var odoPosX, odoPosY = imageHeight * 0.61;
        var shadowOffset = imageWidth * 0.006;

        // Constants
        var initialized = false;

        // Tickmark specific private variables
        var niceMinValue = minValue;
        var niceMaxValue = maxValue;
        var niceRange = maxValue - minValue;
        var range = niceMaxValue - niceMinValue;
        var minorTickSpacing = 0;
        var majorTickSpacing = 0;
        var maxNoOfMinorTicks = 10;
        var maxNoOfMajorTicks = 10;

        // Method to calculate nice values for min, max and range for the tickmarks
        var calculate = function calculate() {
            if (niceScale) {
                niceRange = calcNiceNumber(maxValue - minValue, false);
                majorTickSpacing = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true);
                niceMinValue = Math.floor(minValue / majorTickSpacing) * majorTickSpacing;
                niceMaxValue = Math.ceil(maxValue / majorTickSpacing) * majorTickSpacing;
                minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true);
                minValue = niceMinValue;
                maxValue = niceMaxValue;
                range = maxValue - minValue;
            } else {
                niceRange = (maxValue - minValue);
                niceMinValue = minValue;
                niceMaxValue = maxValue;
                range = niceRange;
                majorTickSpacing = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true);
                minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true);
            }
            // Make sure values are still in range
            value = value < minValue ? minValue : value > maxValue ? maxValue : value;
            minMeasuredValue = minMeasuredValue < minValue ? minValue : minMeasuredValue > maxValue ? maxValue : minMeasuredValue;
            maxMeasuredValue = maxMeasuredValue < minValue ? minValue : maxMeasuredValue > maxValue ? maxValue : maxMeasuredValue;
            threshold = threshold < minValue ? minValue : threshold > maxValue ? maxValue : threshold;

            switch (gaugeType.type) {
            case 'type1':
                freeAreaAngle = 0;
                rotationOffset = PI;
                tickmarkOffset = HALF_PI;
                angleRange = HALF_PI;
                angleStep = angleRange / range;
                break;

            case 'type2':
                freeAreaAngle = 0;
                rotationOffset = PI;
                tickmarkOffset = HALF_PI;
                angleRange = PI;
                angleStep = angleRange / range;
                break;

            case 'type3':
                freeAreaAngle = 0;
                rotationOffset = HALF_PI;
                tickmarkOffset = 0;
                angleRange = 1.5 * PI;
                angleStep = angleRange / range;
                break;

            case 'type4':
            /* falls through */
            default:
                freeAreaAngle = 60 * RAD_FACTOR;
                rotationOffset = HALF_PI + (freeAreaAngle / 2);
                tickmarkOffset = 0;
                angleRange = TWO_PI - freeAreaAngle;
                angleStep = angleRange / range;
                break;
            }
            angle = rotationOffset + (value - minValue) * angleStep;
        };

        // **************   Buffer creation  ********************
        // Buffer for the frame
        var frameBuffer = createBuffer(size, size);
        var frameContext = frameBuffer.getContext('2d');

        // Buffer for the background
        var backgroundBuffer = createBuffer(size, size);
        var backgroundContext = backgroundBuffer.getContext('2d');

        var lcdBuffer;

        // Buffer for led on painting code
        var ledBufferOn = createBuffer(ledSize, ledSize);
        var ledContextOn = ledBufferOn.getContext('2d');

        // Buffer for led off painting code
        var ledBufferOff = createBuffer(ledSize, ledSize);
        var ledContextOff = ledBufferOff.getContext('2d');

        // Buffer for current led painting code
        var ledBuffer = ledBufferOff;

        // Buffer for user led on painting code
        var userLedBufferOn = createBuffer(ledSize, ledSize);
        var userLedContextOn = userLedBufferOn.getContext('2d');

        // Buffer for user led off painting code
        var userLedBufferOff = createBuffer(ledSize, ledSize);
        var userLedContextOff = userLedBufferOff.getContext('2d');

        // Buffer for current user led painting code
        var userLedBuffer = userLedBufferOff;

        // Buffer for the minMeasuredValue indicator
        var minMeasuredValueBuffer = createBuffer(Math.ceil(size * 0.028037), Math.ceil(size * 0.028037));
        var minMeasuredValueCtx = minMeasuredValueBuffer.getContext('2d');

        // Buffer for the maxMeasuredValue indicator
        var maxMeasuredValueBuffer = createBuffer(Math.ceil(size * 0.028037), Math.ceil(size * 0.028037));
        var maxMeasuredValueCtx = maxMeasuredValueBuffer.getContext('2d');

        // Buffer for pointer image painting code
        var pointerBuffer = createBuffer(size, size);
        var pointerContext = pointerBuffer.getContext('2d');

        // Buffer for static foreground painting code
        var foregroundBuffer = createBuffer(size, size);
        var foregroundContext = foregroundBuffer.getContext('2d');

        // Buffers for trend indicators
        var trendUpBuffer, trendSteadyBuffer, trendDownBuffer, trendOffBuffer;

        // Buffer for odometer
        var odoGauge, odoBuffer, odoContext;
        if (useOdometer && lcdVisible) {
            odoBuffer = createBuffer(10, 10);          // size doesn't matter, it will get reset by odometer code
            odoContext = odoBuffer.getContext('2d');
        }

        // **************   Image creation  ********************
        var drawLcdText = function (ctx, value) {
            ctx.restore();
            ctx.save();
            ctx.textAlign = 'right';
            ctx.strokeStyle = lcdColor.textColor;
            ctx.fillStyle = lcdColor.textColor;

            if (lcdColor === steelseries.LcdColor.STANDARD || lcdColor === steelseries.LcdColor.STANDARD_GREEN) {
                ctx.shadowColor = 'gray';
                ctx.shadowOffsetX = imageWidth * 0.007;
                ctx.shadowOffsetY = imageWidth * 0.007;
                ctx.shadowBlur = imageWidth * 0.007;
            }
            if (digitalFont) {
                ctx.font = lcdFont;
            } else {
                ctx.font = stdFont;
            }
            ctx.fillText(value.toFixed(lcdDecimals), lcdPosX + lcdWidth - lcdWidth * 0.05, lcdPosY + lcdHeight * 0.5 + lcdFontHeight * 0.38, lcdWidth * 0.9);

            ctx.restore();
        };

        var drawPostsImage = function (ctx) {
            ctx.save();

            if ('type1' === gaugeType.type) {
                // Draw max center top post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.523364, imageHeight * 0.130841);
            }

            if ('type1' === gaugeType.type || 'type2' === gaugeType.type) {
                // Draw min left post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.130841, imageHeight * 0.514018);
            }

            if ('type2' === gaugeType.type || 'type3' === gaugeType.type) {
                // Draw max right post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.831775, imageHeight * 0.514018);
            }

            if ('type3' === gaugeType.type) {
                // Draw min center bottom post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.523364, imageHeight * 0.831775);
            }

            if ('type4' === gaugeType.type) {
                // Min post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.336448, imageHeight * 0.803738);

                // Max post
                ctx.drawImage(createKnobImage(Math.ceil(imageHeight * 0.037383), steelseries.KnobType.STANDARD_KNOB, knobStyle), imageWidth * 0.626168, imageHeight * 0.803738);
            }

            ctx.restore();

        };

        var createThresholdImage = function () {
            var thresholdBuffer = doc.createElement('canvas');
            thresholdBuffer.width = Math.ceil(size * 0.046728);
            thresholdBuffer.height = Math.ceil(thresholdBuffer.width * 0.9);
            var thresholdCtx = thresholdBuffer.getContext('2d');

            thresholdCtx.save();
            var gradThreshold = thresholdCtx.createLinearGradient(0, 0.1, 0, thresholdBuffer.height * 0.9);
            gradThreshold.addColorStop(0, '#520000');
            gradThreshold.addColorStop(0.3, '#fc1d00');
            gradThreshold.addColorStop(0.59, '#fc1d00');
            gradThreshold.addColorStop(1, '#520000');
            thresholdCtx.fillStyle = gradThreshold;

            thresholdCtx.beginPath();
            thresholdCtx.moveTo(thresholdBuffer.width * 0.5, 0.1);
            thresholdCtx.lineTo(thresholdBuffer.width * 0.9, thresholdBuffer.height * 0.9);
            thresholdCtx.lineTo(thresholdBuffer.width * 0.1, thresholdBuffer.height * 0.9);
            thresholdCtx.lineTo(thresholdBuffer.width * 0.5, 0.1);
            thresholdCtx.closePath();

            thresholdCtx.fill();
            thresholdCtx.strokeStyle = '#FFFFFF';
            thresholdCtx.stroke();

            thresholdCtx.restore();

            return thresholdBuffer;
        };

        var drawAreaSectionImage = function (ctx, start, stop, color, filled) {
            if (start < minValue) {
                start = minValue;
            } else if (start > maxValue) {
                start = maxValue;
            }
            if (stop < minValue) {
                stop = minValue;
            } else if (stop > maxValue) {
                stop = maxValue;
            }
            if (start >= stop) {
                return;
            }
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = imageWidth * 0.035;
            var startAngle = (angleRange / range * start - angleRange / range * minValue);
            var stopAngle = startAngle + (stop - start) / (range / angleRange);
            ctx.translate(centerX, centerY);
            ctx.rotate(rotationOffset);
            ctx.beginPath();
            if (filled) {
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, imageWidth * 0.365 - ctx.lineWidth / 2, startAngle, stopAngle, false);
            } else {
                ctx.arc(0, 0, imageWidth * 0.365, startAngle, stopAngle, false);
            }
            if (filled) {
                ctx.moveTo(0, 0);
                ctx.fill();
            } else {
                ctx.stroke();
            }

            ctx.translate(-centerX, -centerY);
            ctx.restore();
        };

        var drawTickmarksImage = function (ctx, labelNumberFormat) {
            var fontSize = Math.ceil(imageWidth * 0.04),
                alpha = rotationOffset,      // Tracks total rotation
                rotationStep = angleStep * minorTickSpacing,
                textRotationAngle,
                valueCounter = minValue,
                majorTickCounter = maxNoOfMinorTicks - 1,
                OUTER_POINT = imageWidth * 0.38,
                MAJOR_INNER_POINT = imageWidth * 0.35,
                MED_INNER_POINT = imageWidth * 0.355,
                MINOR_INNER_POINT = imageWidth * 0.36,
                TEXT_TRANSLATE_X = imageWidth * 0.3,
                TEXT_WIDTH = imageWidth * 0.1,
                HALF_MAX_NO_OF_MINOR_TICKS = maxNoOfMinorTicks / 2,
                MAX_VALUE_ROUNDED = parseFloat(maxValue.toFixed(2)),
                i;

            backgroundColor.labelColor.setAlpha(1);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = fontSize + 'px ' + stdFontName;
            ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor();
            ctx.fillStyle = backgroundColor.labelColor.getRgbaColor();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotationOffset);

            if (gaugeType.type === 'type1' || gaugeType.type === 'type2') {
                TEXT_WIDTH = imageWidth * 0.04;
            }

            for (i = minValue; parseFloat(i.toFixed(2)) <= MAX_VALUE_ROUNDED; i += minorTickSpacing) {
                textRotationAngle = rotationStep + HALF_PI;
                majorTickCounter++;
                // Draw major tickmarks
                if (majorTickCounter === maxNoOfMinorTicks) {
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(OUTER_POINT, 0);
                    ctx.lineTo(MAJOR_INNER_POINT, 0);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.save();
                    ctx.translate(TEXT_TRANSLATE_X, 0);

                    switch (tickLabelOrientation.type) {
                    case 'horizontal':
                        textRotationAngle = -alpha;
                        break;

                    case 'tangent':
                        textRotationAngle = (alpha <= HALF_PI + PI ? PI : 0);
                        break;

                    case 'normal':
                    /* falls through */
                    default:
                        textRotationAngle = HALF_PI;
                        break;
                    }
                    ctx.rotate(textRotationAngle);

                    switch (labelNumberFormat.format) {
                    case 'fractional':
                        ctx.fillText((valueCounter.toFixed(fractionalScaleDecimals)), 0, 0, TEXT_WIDTH);
                        break;

                    case 'scientific':
                        ctx.fillText((valueCounter.toPrecision(2)), 0, 0, TEXT_WIDTH);
                        break;

                    case 'standard':
                    /* falls through */
                    default:
                        ctx.fillText((valueCounter.toFixed(0)), 0, 0, TEXT_WIDTH);
                        break;
                    }
                    ctx.translate(-TEXT_TRANSLATE_X, 0);
                    ctx.restore();

                    valueCounter += majorTickSpacing;
                    majorTickCounter = 0;
                    ctx.rotate(rotationStep);
                    alpha += rotationStep;
                    continue;
                }

                // Draw tickmark every minor tickmark spacing
                if (0 === maxNoOfMinorTicks % 2 && majorTickCounter === (HALF_MAX_NO_OF_MINOR_TICKS)) {
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(OUTER_POINT, 0);
                    ctx.lineTo(MED_INNER_POINT, 0);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(OUTER_POINT, 0);
                    ctx.lineTo(MINOR_INNER_POINT, 0);
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.rotate(rotationStep);
                alpha += rotationStep;
            }


            ctx.translate(-centerX, -centerY);
            ctx.restore();
        };

        // **************   Initialization  ********************
        // Draw all static painting code to background
        var init = function (parameters) {
            parameters = parameters || {};
            var drawFrame = (undefined === parameters.frame ? false : parameters.frame);
            var drawBackground = (undefined === parameters.background ? false : parameters.background);
            var drawLed = (undefined === parameters.led ? false : parameters.led);
            var drawUserLed = (undefined === parameters.userLed ? false : parameters.userLed);
            var drawPointer = (undefined === parameters.pointer ? false : parameters.pointer);
            var drawForeground = (undefined === parameters.foreground ? false : parameters.foreground);
            var drawTrend = (undefined === parameters.trend ? false : parameters.trend);
            var drawOdo = (undefined === parameters.odo ? false : parameters.odo);

            initialized = true;

            // Calculate the current min and max values and the range
            calculate();

            // Create frame in frame buffer (backgroundBuffer)
            if (drawFrame && frameVisible) {
                drawRadialFrameImage(frameContext, frameDesign, centerX, centerY, imageWidth, imageHeight);
            }

            // Create background in background buffer (backgroundBuffer)
            if (drawBackground && backgroundVisible) {
                drawRadialBackgroundImage(backgroundContext, backgroundColor, centerX, centerY, imageWidth, imageHeight);

                // Create custom layer in background buffer (backgroundBuffer)
                drawRadialCustomImage(backgroundContext, customLayer, centerX, centerY, imageWidth, imageHeight);
            }

            if (drawLed) {
                // Draw LED ON in ledBuffer_ON
                ledContextOn.drawImage(createLedImage(Math.ceil(size * 0.093457), 1, ledColor), 0, 0);

                // Draw LED OFF in ledBuffer_OFF
                ledContextOff.drawImage(createLedImage(Math.ceil(size * 0.093457), 0, ledColor), 0, 0);
            }

            if (drawUserLed) {
                // Draw user LED ON in userLedBuffer_ON
                userLedContextOn.drawImage(createLedImage(Math.ceil(size * 0.093457), 1, userLedColor), 0, 0);

                // Draw user LED OFF in userLedBuffer_OFF
                userLedContextOff.drawImage(createLedImage(Math.ceil(size * 0.093457), 0, userLedColor), 0, 0);
            }

            // Draw min measured value indicator in minMeasuredValueBuffer
            if (minMeasuredValueVisible) {
                minMeasuredValueCtx.drawImage(createMeasuredValueImage(Math.ceil(size * 0.028037), steelseries.ColorDef.BLUE.dark.getRgbaColor(), true, true), 0, 0);
            }

            // Draw max measured value indicator in maxMeasuredValueBuffer
            if (maxMeasuredValueVisible) {
                maxMeasuredValueCtx.drawImage(createMeasuredValueImage(Math.ceil(size * 0.028037), steelseries.ColorDef.RED.medium.getRgbaColor(), true), 0, 0);
            }

            // Create alignment posts in background buffer (backgroundBuffer)
            if (drawBackground && backgroundVisible) {
                drawPostsImage(backgroundContext);

                // Create section in background buffer (backgroundBuffer)
                if (null !== section && 0 < section.length) {
                    var sectionIndex = section.length;
                    do {
                        sectionIndex--;
                        drawAreaSectionImage(backgroundContext, section[sectionIndex].start, section[sectionIndex].stop, section[sectionIndex].color, false);
                    }
                    while (0 < sectionIndex);
                }

                // Create area in background buffer (backgroundBuffer)
                if (null !== area && 0 < area.length) {
                    var areaIndex = area.length;
                    do {
                        areaIndex--;
                        drawAreaSectionImage(backgroundContext, area[areaIndex].start, area[areaIndex].stop, area[areaIndex].color, true);
                    }
                    while (0 < areaIndex);
                }

                // Create tickmarks in background buffer (backgroundBuffer)
                drawTickmarksImage(backgroundContext, labelNumberFormat);

                // Create title in background buffer (backgroundBuffer)
                drawTitleImage(backgroundContext, imageWidth, imageHeight, titleString, unitString, backgroundColor, true, true);
            }

            // Draw threshold image to background context
            if (drawBackground && thresholdVisible) {
                backgroundContext.save();
                backgroundContext.translate(centerX, centerY);
                backgroundContext.rotate(rotationOffset + (threshold - minValue) * angleStep + HALF_PI);
                backgroundContext.translate(-centerX, -centerY);
                backgroundContext.drawImage(createThresholdImage(), imageWidth * 0.475, imageHeight * 0.13);
                backgroundContext.translate(centerX, centerY);
                backgroundContext.restore();
            }

            // Create lcd background if selected in background buffer (backgroundBuffer)
            if (drawBackground && lcdVisible) {
                if (useOdometer && drawOdo) {
                    odoGauge = new steelseries.Odometer('', {
                            _context: odoContext,
                            height: size * 0.075,
                            decimals: odometerParams.decimals,
                            digits: (odometerParams.digits === undefined ? 5 : odometerParams.digits),
                            valueForeColor: odometerParams.valueForeColor,
                            valueBackColor: odometerParams.valueBackColor,
                            decimalForeColor: odometerParams.decimalForeColor,
                            decimalBackColor: odometerParams.decimalBackColor,
                            font: odometerParams.font,
                            value: value
                        });
                    odoPosX = (imageWidth - odoBuffer.width) / 2;
                } else if (!useOdometer) {
                    lcdBuffer = createLcdBackgroundImage(lcdWidth, lcdHeight, lcdColor);
                    backgroundContext.drawImage(lcdBuffer, lcdPosX, lcdPosY);
                }
            }

            // Create pointer image in pointer buffer (contentBuffer)
            if (drawPointer) {
                drawPointerImage(pointerContext, imageWidth, pointerType, pointerColor, backgroundColor.labelColor);
            }

            // Create foreground in foreground buffer (foregroundBuffer)
            if (drawForeground && foregroundVisible) {
                var knobVisible = (pointerType.type === 'type15' || pointerType.type === 'type16' ? false : true);
                drawRadialForegroundImage(foregroundContext, foregroundType, imageWidth, imageHeight, knobVisible, knobType, knobStyle, gaugeType);
            }

            // Create the trend indicator buffers
            if (drawTrend && trendVisible) {
                trendUpBuffer = createTrendIndicator(trendSize, steelseries.TrendState.UP, trendColors);
                trendSteadyBuffer = createTrendIndicator(trendSize, steelseries.TrendState.STEADY, trendColors);
                trendDownBuffer = createTrendIndicator(trendSize, steelseries.TrendState.DOWN, trendColors);
                trendOffBuffer = createTrendIndicator(trendSize, steelseries.TrendState.OFF, trendColors);
            }
        };

        var resetBuffers = function (buffers) {
            buffers = buffers || {};
            var resetFrame = (undefined === buffers.frame ? false : buffers.frame);
            var resetBackground = (undefined === buffers.background ? false : buffers.background);
            var resetLed = (undefined === buffers.led ? false : buffers.led);
            var resetUserLed = (undefined === buffers.userLed ? false : buffers.userLed);
            var resetPointer = (undefined === buffers.pointer ? false : buffers.pointer);
            var resetForeground = (undefined === buffers.foreground ? false : buffers.foreground);

            if (resetFrame) {
                frameBuffer.width = size;
                frameBuffer.height = size;
                frameContext = frameBuffer.getContext('2d');
            }

            if (resetBackground) {
                backgroundBuffer.width = size;
                backgroundBuffer.height = size;
                backgroundContext = backgroundBuffer.getContext('2d');
            }

            if (resetLed) {
                ledBufferOn.width = Math.ceil(size * 0.093457);
                ledBufferOn.height = Math.ceil(size * 0.093457);
                ledContextOn = ledBufferOn.getContext('2d');

                ledBufferOff.width = Math.ceil(size * 0.093457);
                ledBufferOff.height = Math.ceil(size * 0.093457);
                ledContextOff = ledBufferOff.getContext('2d');

                // Buffer for current led painting code
                ledBuffer = ledBufferOff;
            }

            if (resetUserLed) {
                userLedBufferOn.width = Math.ceil(size * 0.093457);
                userLedBufferOn.height = Math.ceil(size * 0.093457);
                userLedContextOn = userLedBufferOn.getContext('2d');

                userLedBufferOff.width = Math.ceil(size * 0.093457);
                userLedBufferOff.height = Math.ceil(size * 0.093457);
                userLedContextOff = userLedBufferOff.getContext('2d');

                // Buffer for current user led painting code
                userLedBuffer = userLedBufferOff;
            }

            if (resetPointer) {
                pointerBuffer.width = size;
                pointerBuffer.height = size;
                pointerContext = pointerBuffer.getContext('2d');
            }

            if (resetForeground) {
                foregroundBuffer.width = size;
                foregroundBuffer.height = size;
                foregroundContext = foregroundBuffer.getContext('2d');
            }
        };

        var toggleAndRepaintLed = function () {
            if (ledVisible) {
                if (ledBuffer === ledBufferOn) {
                    ledBuffer = ledBufferOff;
                } else {
                    ledBuffer = ledBufferOn;
                }
                if (!repainting) {
                    repainting = true;
                    requestAnimFrame(self.repaint);
                }
            }
        };

        var toggleAndRepaintUserLed = function () {
            if (userLedVisible) {
                if (userLedBuffer === userLedBufferOn) {
                    userLedBuffer = userLedBufferOff;
                } else {
                    userLedBuffer = userLedBufferOn;
                }
                if (!repainting) {
                    repainting = true;
                    requestAnimFrame(self.repaint);
                }
            }
        };

        var blink = function (blinking) {
            if (blinking) {
                ledTimerId = setInterval(toggleAndRepaintLed, 1000);
            } else {
                clearInterval(ledTimerId);
                ledBuffer = ledBufferOff;
            }
        };

        var blinkUser = function (blinking) {
            if (blinking) {
                userLedTimerId = setInterval(toggleAndRepaintUserLed, 1000);
            } else {
                clearInterval(userLedTimerId);
                userLedBuffer = userLedBufferOff;
            }
        };

        //************************************ Public methods **************************************
        this.setValue = function (newValue) {
            newValue = parseFloat(newValue);
            var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
            if (value !== targetValue) {
                value = targetValue;

                if (value > maxMeasuredValue) {
                    maxMeasuredValue = value;
                }
                if (value < minMeasuredValue) {
                    minMeasuredValue = value;
                }

                this.repaint();
            }
            return this;
        };

        this.getValue = function () {
            return value;
        };

        this.setOdoValue = function (newValue) {
            newValue = parseFloat(newValue);
            var targetValue = (newValue < 0 ? 0 : newValue);
            if (odoValue !== targetValue) {
                odoValue = targetValue;
                this.repaint();
            }
            return this;
        };

        this.getOdoValue = function () {
            return odoValue;
        };

        this.setValueAnimated = function (newValue, callback) {
            newValue = parseFloat(newValue);
            var targetValue = (newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue)),
                gauge = this,
                time;

            if (value !== targetValue) {
                if (undefined !== tween && tween.isPlaying) {
                    tween.stop();
                }
                time = fullScaleDeflectionTime * Math.abs(targetValue - value) / (maxValue - minValue);
                time = Math.max(time, fullScaleDeflectionTime / 5);
                tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, time);
                //tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, 1);
                //tween = new Tween(new Object(), '', Tween.strongEaseInOut, value, targetValue, 1);

                tween.onMotionChanged = function (event) {
                    value = event.target._pos;

                    if ((value >= threshold && !ledBlinking && thresholdRising) ||
                        (value <= threshold && !ledBlinking && !thresholdRising)) {
                        ledBlinking = true;
                        blink(ledBlinking);
                        if (playAlarm) {
                            audioElement.play();
                        }
                    } else if ((value < threshold && ledBlinking && thresholdRising) ||
                               (value > threshold && ledBlinking && !thresholdRising)) {
                        ledBlinking = false;
                        blink(ledBlinking);
                        if (playAlarm) {
                            audioElement.pause();
                        }
                    }

                    if (value > maxMeasuredValue) {
                        maxMeasuredValue = value;
                    }
                    if (value < minMeasuredValue) {
                        minMeasuredValue = value;
                    }
                    if (!repainting) {
                        repainting = true;
                        requestAnimFrame(gauge.repaint);
                    }
                };

                // do we have a callback function to process?
                if (callback && typeof(callback) === "function") {
                    tween.onMotionFinished = callback;
                }

                tween.start();
            }
            return this;
        };

        this.resetMinMeasuredValue = function () {
            minMeasuredValue = value;
            this.repaint();
        };

        this.resetMaxMeasuredValue = function () {
            maxMeasuredValue = value;
            this.repaint();
            return this;
        };

        this.setMinMeasuredValueVisible = function (visible) {
            minMeasuredValueVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setMaxMeasuredValueVisible = function (visible) {
            maxMeasuredValueVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setMaxMeasuredValue = function (newValue) {
            newValue = parseFloat(newValue);
            var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
            maxMeasuredValue = targetValue;
            this.repaint();
            return this;
        };

        this.setMinMeasuredValue = function (newValue) {
            newValue = parseFloat(newValue);
            var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
            minMeasuredValue = targetValue;
            this.repaint();
            return this;
        };

        this.setTitleString = function (title) {
            titleString = title;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setUnitString = function (unit) {
            unitString = unit;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setMinValue = function (newValue) {
            minValue = parseFloat(newValue);
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.getMinValue = function () {
            return minValue;
        };

        this.setMaxValue = function (newValue) {
            maxValue = parseFloat(newValue);
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.getMaxValue = function () {
            return maxValue;
        };

        this.setThreshold = function (newValue) {
            newValue = parseFloat(newValue);
            var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
            threshold = targetValue;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setArea = function (areaVal) {
            area = areaVal;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setSection = function (areaSec) {
            section = areaSec;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setThresholdVisible = function (visible) {
            thresholdVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setThresholdRising = function (rising) {
            thresholdRising = !!rising;
            // reset existing threshold alerts
//            ledBlinking = !ledBlinking;
//            blink(ledBlinking);
            this.repaint();
            return this;
        };

        this.setLcdDecimals = function (decimals) {
            lcdDecimals = parseInt(decimals, 10);
            this.repaint();
            return this;
        };

        this.setFrameDesign = function (newFrameDesign) {
            resetBuffers({frame: true});
            frameDesign = newFrameDesign;
            init({frame: true});
            this.repaint();
            return this;
        };

        this.setBackgroundColor = function (newBackgroundColor) {
            resetBuffers({background: true,
                          pointer: (pointerType.type === 'type2' || pointerType.type === 'type13' ? true : false)       // type2 & 13 depend on background
                });
            backgroundColor = newBackgroundColor;
            init({background: true,   // type2 & 13 depend on background
                  pointer: (pointerType.type === 'type2' || pointerType.type === 'type13' ? true : false)
                });
            this.repaint();
            return this;
        };

        this.setForegroundType = function (newForegroundType) {
            resetBuffers({foreground: true});
            foregroundType = newForegroundType;
            init({foreground: true});
            this.repaint();
            return this;
        };

        this.setPointerType = function (newPointerType) {
            resetBuffers({pointer: true,
                          foreground: true
                         });
            pointerType = newPointerType;
            init({pointer: true,
                  foreground: true
                });
            this.repaint();
            return this;
        };

        this.setPointerColor = function (newPointerColor) {
            resetBuffers({pointer: true});
            pointerColor = newPointerColor;
            init({pointer: true});
            this.repaint();
            return this;
        };

        this.setLedColor = function (newLedColor) {
            resetBuffers({led: true});
            ledColor = newLedColor;
            init({led: true});
            this.repaint();
            return this;
        };

        this.setUserLedColor = function (newLedColor) {
            resetBuffers({userLed: true});
            userLedColor = newLedColor;
            init({userLed: true});
            this.repaint();
            return this;
        };

        this.toggleUserLed = function () {
            if (userLedBuffer === userLedBufferOn) {
                userLedBuffer = userLedBufferOff;
            } else {
                userLedBuffer = userLedBufferOn;
            }
            this.repaint();
            return this;
        };

        this.setUserLedOnOff = function (on) {
            if (true === on) {
                userLedBuffer = userLedBufferOn;
            } else {
                userLedBuffer = userLedBufferOff;
            }
            this.repaint();
            return this;
        };


        // Aggiunto questa funzione per comandare il LED rosso
        this.setLedOnOff = function (on) {
            if (true === on) {
                ledBuffer = ledBufferOn;
            } else {
                ledBuffer = ledBufferOff;
            }
            this.repaint();
            return this;
        };

       this.blinkUserLed = function (blink) {
            if (blink) {
                if (!userLedBlinking) {
                    blinkUser(true);
                    userLedBlinking = true;
                }
            } else {
                if (userLedBlinking) {
                    clearInterval(userLedTimerId);
                    userLedBlinking = false;
                }
            }
            return this;
        };

        // Aggiunto questa funzione per comandare il LED rosso
        this.blinkLed = function (blinkstatus) {
            if (blinkstatus) {
                if (!ledBlinking) {
                    blink(true);
                    ledBlinking = true;
                }
            } else {
                if (ledBlinking) {
                    clearInterval(ledTimerId);
                    ledBlinking = false;
                }
            }
            return this;
        };
        this.setLedVisible = function (visible) {
            ledVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setUserLedVisible = function (visible) {
            userLedVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setLcdColor = function (newLcdColor) {
            lcdColor = newLcdColor;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setTrend = function (newValue) {
            trendIndicator = newValue;
            this.repaint();
            return this;
        };

        this.setTrendVisible = function (visible) {
            trendVisible = !!visible;
            this.repaint();
            return this;
        };

        this.setFractionalScaleDecimals = function (decimals) {
            fractionalScaleDecimals = parseInt(decimals, 10);
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.setLabelNumberFormat = function (format) {
            labelNumberFormat = format;
            resetBuffers({background: true});
            init({background: true});
            this.repaint();
            return this;
        };

        this.repaint = function () {
            if (!initialized) {
                init({frame: true,
                      background: true,
                      led: true,
                      userLed: true,
                      pointer: true,
                      trend: true,
                      foreground: true,
                      odo: true});
            }
            mainCtx.clearRect(0, 0, size, size);

            // Draw frame
            if (frameVisible) {
                mainCtx.drawImage(frameBuffer, 0, 0);
            }

            // Draw buffered image to visible canvas
            mainCtx.drawImage(backgroundBuffer, 0, 0);

            // Draw lcd display
            if (lcdVisible) {
                if (useOdometer) {
                    odoGauge.setValue(odometerUseValue ? value : odoValue);
                    mainCtx.drawImage(odoBuffer, odoPosX, odoPosY);
                } else {
                    drawLcdText(mainCtx, value);
                }
            }

            // Draw led
            if (ledVisible) {
                mainCtx.drawImage(ledBuffer, ledPosX, ledPosY);
            }

            // Draw user led
            if (userLedVisible) {
                mainCtx.drawImage(userLedBuffer, userLedPosX, userLedPosY);
            }

            // Draw the trend indicator
            if (trendVisible) {
                switch (trendIndicator.state) {
                case 'up':
                    mainCtx.drawImage(trendUpBuffer, trendPosX, trendPosY);
                    break;
                case 'steady':
                    mainCtx.drawImage(trendSteadyBuffer, trendPosX, trendPosY);
                    break;
                case 'down':
                    mainCtx.drawImage(trendDownBuffer, trendPosX, trendPosY);
                    break;
                case 'off':
                    mainCtx.drawImage(trendOffBuffer, trendPosX, trendPosY);
                    break;
                }
            }

            // Draw min measured value indicator
            if (minMeasuredValueVisible) {
                mainCtx.save();
                mainCtx.translate(centerX, centerY);
                mainCtx.rotate(rotationOffset + HALF_PI + (minMeasuredValue - minValue) * angleStep);
                mainCtx.translate(-centerX, -centerY);
                mainCtx.drawImage(minMeasuredValueBuffer, mainCtx.canvas.width * 0.4865, mainCtx.canvas.height * 0.105);
                mainCtx.restore();
            }

            // Draw max measured value indicator
            if (maxMeasuredValueVisible) {
                mainCtx.save();
                mainCtx.translate(centerX, centerY);
                mainCtx.rotate(rotationOffset + HALF_PI + (maxMeasuredValue - minValue) * angleStep);
                mainCtx.translate(-centerX, -centerY);
                mainCtx.drawImage(maxMeasuredValueBuffer, mainCtx.canvas.width * 0.4865, mainCtx.canvas.height * 0.105);
                mainCtx.restore();
            }

            angle = rotationOffset + HALF_PI + (value - minValue) * angleStep;

            // Define rotation center
            mainCtx.save();
            mainCtx.translate(centerX, centerY);
            mainCtx.rotate(angle);
            mainCtx.translate(-centerX, -centerY);
            // Set the pointer shadow params
            mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset;
            mainCtx.shadowBlur = shadowOffset * 2;
            // Draw the pointer
            mainCtx.drawImage(pointerBuffer, 0, 0);
            // Undo the translations & shadow settings
            mainCtx.restore();

            // Draw foreground
            if (foregroundVisible) {
                mainCtx.drawImage(foregroundBuffer, 0, 0);
            }

            repainting = false;
        };

        // Visualize the component
        this.repaint();

        return this;
    };


    //************************************  I M A G E   -   F U N C T I O N S  *****************************************

    // var drawRoseImage = function (ctx, centerX, centerY, imageWidth, imageHeight, backgroundColor) {
    //     var fill = true,
    //         i, grad,
    //         symbolColor = backgroundColor.symbolColor.getRgbaColor();
    //
    //     ctx.save();
    //     ctx.lineWidth = 1;
    //     ctx.fillStyle = symbolColor;
    //     ctx.strokeStyle = symbolColor;
    //     ctx.translate(centerX, centerY);
    //     // broken ring
    //     for (i = 0; i < 360; i += 15) {
    //         fill = !fill;
    //
    //         ctx.beginPath();
    //         ctx.arc(0, 0, imageWidth * 0.26, i * RAD_FACTOR, (i + 15) * RAD_FACTOR, false);
    //         ctx.arc(0, 0, imageWidth * 0.23, (i + 15) * RAD_FACTOR, i * RAD_FACTOR, true);
    //         ctx.closePath();
    //         if (fill) {
    //             ctx.fill();
    //         }
    //         ctx.stroke();
    //     }
    //
    //     ctx.translate(-centerX, -centerY);
    //
    //     // Replacement code, not quite the same but much smaller!
    //
    //     for (i = 0; 360 >= i; i += 90) {
    //         // Small pointers
    //         ctx.beginPath();
    //         ctx.moveTo(imageWidth * 0.560747, imageHeight * 0.584112);
    //         ctx.lineTo(imageWidth * 0.640186, imageHeight * 0.644859);
    //         ctx.lineTo(imageWidth * 0.584112, imageHeight * 0.560747);
    //         ctx.lineTo(imageWidth * 0.560747, imageHeight * 0.584112);
    //         ctx.closePath();
    //         ctx.fillStyle = symbolColor;
    //         ctx.fill();
    //         ctx.stroke();
    //         // Large pointers
    //         ctx.beginPath();
    //         ctx.moveTo(imageWidth * 0.523364, imageHeight * 0.397196);
    //         ctx.lineTo(imageWidth * 0.5, imageHeight * 0.196261);
    //         ctx.lineTo(imageWidth * 0.471962, imageHeight * 0.397196);
    //         ctx.lineTo(imageWidth * 0.523364, imageHeight * 0.397196);
    //         ctx.closePath();
    //         grad = ctx.createLinearGradient(0.476635 * imageWidth, 0, 0.518691 * imageWidth, 0);
    //         grad.addColorStop(0, 'rgb(222, 223, 218)');
    //         grad.addColorStop(0.48, 'rgb(222, 223, 218)');
    //         grad.addColorStop(0.49, symbolColor);
    //         grad.addColorStop(1, symbolColor);
    //         ctx.fillStyle = grad;
    //         ctx.fill();
    //         ctx.stroke();
    //         ctx.translate(centerX, centerY);
    //         ctx.rotate(i * RAD_FACTOR);
    //         ctx.translate(-centerX, -centerY);
    //     }
    //
    //     // Central ring
    //     ctx.beginPath();
    //     ctx.translate(centerX, centerY);
    //     ctx.arc(0, 0, imageWidth * 0.1, 0, TWO_PI, false);
    //     ctx.lineWidth = imageWidth * 0.022;
    //     ctx.stroke();
    //     ctx.translate(-centerX, -centerY);
    //
    //     ctx.restore();
    //
    // };
    //
    var drawPointerImage = function (ctx, size, ptrType, ptrColor, lblColor) {
        var ptrBuffer, ptrCtx,
            grad, radius,
            cacheKey = size.toString() + ptrType.type + ptrColor.light.getHexColor() + ptrColor.medium.getHexColor();

        // check if we have already created and cached this buffer, if not create it
        if (!drawPointerImage.cache[cacheKey]) {
            // create a pointer buffer
            ptrBuffer = createBuffer(size, size);
            ptrCtx = ptrBuffer.getContext('2d');

            switch (ptrType.type) {
            case 'type2':
                grad = ptrCtx.createLinearGradient(0, size * 0.471962, 0, size * 0.130841);
                grad.addColorStop(0, lblColor.getRgbaColor());
                grad.addColorStop(0.36, lblColor.getRgbaColor());
                grad.addColorStop(0.361, ptrColor.light.getRgbaColor());
                grad.addColorStop(1, ptrColor.light.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.518691, size * 0.471962);
                ptrCtx.lineTo(size * 0.509345, size * 0.462616);
                ptrCtx.lineTo(size * 0.509345, size * 0.341121);
                ptrCtx.lineTo(size * 0.504672, size * 0.130841);
                ptrCtx.lineTo(size * 0.495327, size * 0.130841);
                ptrCtx.lineTo(size * 0.490654, size * 0.341121);
                ptrCtx.lineTo(size * 0.490654, size * 0.462616);
                ptrCtx.lineTo(size * 0.481308, size * 0.471962);
                ptrCtx.closePath();
                ptrCtx.fill();
                break;

            case 'type3':
                ptrCtx.beginPath();
                ptrCtx.rect(size * 0.495327, size * 0.130841, size * 0.009345, size * 0.373831);
                ptrCtx.closePath();
                ptrCtx.fillStyle = ptrColor.light.getRgbaColor();
                ptrCtx.fill();
                break;

            case 'type4':
                grad = ptrCtx.createLinearGradient(0.467289 * size, 0, 0.528036 * size, 0);
                grad.addColorStop(0, ptrColor.dark.getRgbaColor());
                grad.addColorStop(0.51, ptrColor.dark.getRgbaColor());
                grad.addColorStop(0.52, ptrColor.light.getRgbaColor());
                grad.addColorStop(1, ptrColor.light.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.5, size * 0.126168);
                ptrCtx.lineTo(size * 0.514018, size * 0.135514);
                ptrCtx.lineTo(size * 0.532710, size * 0.5);
                ptrCtx.lineTo(size * 0.523364, size * 0.602803);
                ptrCtx.lineTo(size * 0.476635, size * 0.602803);
                ptrCtx.lineTo(size * 0.467289, size * 0.5);
                ptrCtx.lineTo(size * 0.485981, size * 0.135514);
                ptrCtx.lineTo(size * 0.5, size * 0.126168);
                ptrCtx.closePath();
                ptrCtx.fill();
                break;

            case 'type5':
                grad = ptrCtx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0);
                grad.addColorStop(0, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.5, size * 0.495327);
                ptrCtx.lineTo(size * 0.528037, size * 0.495327);
                ptrCtx.lineTo(size * 0.5, size * 0.149532);
                ptrCtx.lineTo(size * 0.471962, size * 0.495327);
                ptrCtx.lineTo(size * 0.5, size * 0.495327);
                ptrCtx.closePath();
                ptrCtx.fill();

                ptrCtx.lineWidth = 1;
                ptrCtx.lineCap = 'square';
                ptrCtx.lineJoin = 'miter';
                ptrCtx.strokeStyle = ptrColor.dark.getRgbaColor();
                ptrCtx.stroke();
                break;

            case 'type6':
                ptrCtx.fillStyle = ptrColor.medium.getRgbaColor();
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.481308, size * 0.485981);
                ptrCtx.lineTo(size * 0.481308, size * 0.392523);
                ptrCtx.lineTo(size * 0.485981, size * 0.317757);
                ptrCtx.lineTo(size * 0.495327, size * 0.130841);
                ptrCtx.lineTo(size * 0.504672, size * 0.130841);
                ptrCtx.lineTo(size * 0.514018, size * 0.317757);
                ptrCtx.lineTo(size * 0.518691, size * 0.387850);
                ptrCtx.lineTo(size * 0.518691, size * 0.485981);
                ptrCtx.lineTo(size * 0.504672, size * 0.485981);
                ptrCtx.lineTo(size * 0.504672, size * 0.387850);
                ptrCtx.lineTo(size * 0.5, size * 0.317757);
                ptrCtx.lineTo(size * 0.495327, size * 0.392523);
                ptrCtx.lineTo(size * 0.495327, size * 0.485981);
                ptrCtx.lineTo(size * 0.481308, size * 0.485981);
                ptrCtx.closePath();
                ptrCtx.fill();
                break;

            case 'type7':
                grad = ptrCtx.createLinearGradient(0.481308 * size, 0, 0.518691 * size, 0);
                grad.addColorStop(0, ptrColor.dark.getRgbaColor());
                grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.490654, size * 0.130841);
                ptrCtx.lineTo(size * 0.481308, size * 0.5);
                ptrCtx.lineTo(size * 0.518691, size * 0.5);
                ptrCtx.lineTo(size * 0.504672, size * 0.130841);
                ptrCtx.lineTo(size * 0.490654, size * 0.130841);
                ptrCtx.closePath();
                ptrCtx.fill();
                break;

            case 'type8':
                grad = ptrCtx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0);
                grad.addColorStop(0, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = ptrColor.dark.getRgbaColor();
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.5, size * 0.532710);
                ptrCtx.lineTo(size * 0.532710, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.532710, size * 0.5, size * 0.509345, size * 0.457943, size * 0.5, size * 0.149532);
                ptrCtx.bezierCurveTo(size * 0.490654, size * 0.457943, size * 0.467289, size * 0.5, size * 0.467289, size * 0.5);
                ptrCtx.lineTo(size * 0.5, size * 0.532710);
                ptrCtx.closePath();
                ptrCtx.fill();
                ptrCtx.stroke();
                break;

            case 'type9':
                grad = ptrCtx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0);
                grad.addColorStop(0, 'rgb(50, 50, 50)');
                grad.addColorStop(0.5, '#666666');
                grad.addColorStop(1, 'rgb(50, 50, 50)');
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = '#2E2E2E';
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.495327, size * 0.233644);
                ptrCtx.lineTo(size * 0.504672, size * 0.233644);
                ptrCtx.lineTo(size * 0.514018, size * 0.439252);
                ptrCtx.lineTo(size * 0.485981, size * 0.439252);
                ptrCtx.lineTo(size * 0.495327, size * 0.233644);
                ptrCtx.closePath();
                ptrCtx.moveTo(size * 0.490654, size * 0.130841);
                ptrCtx.lineTo(size * 0.471962, size * 0.471962);
                ptrCtx.lineTo(size * 0.471962, size * 0.528037);
                ptrCtx.bezierCurveTo(size * 0.471962, size * 0.528037, size * 0.476635, size * 0.602803, size * 0.476635, size * 0.602803);
                ptrCtx.bezierCurveTo(size * 0.476635, size * 0.607476, size * 0.481308, size * 0.607476, size * 0.5, size * 0.607476);
                ptrCtx.bezierCurveTo(size * 0.518691, size * 0.607476, size * 0.523364, size * 0.607476, size * 0.523364, size * 0.602803);
                ptrCtx.bezierCurveTo(size * 0.523364, size * 0.602803, size * 0.528037, size * 0.528037, size * 0.528037, size * 0.528037);
                ptrCtx.lineTo(size * 0.528037, size * 0.471962);
                ptrCtx.lineTo(size * 0.509345, size * 0.130841);
                ptrCtx.lineTo(size * 0.490654, size * 0.130841);
                ptrCtx.closePath();
                ptrCtx.fill();

                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.495327, size * 0.219626);
                ptrCtx.lineTo(size * 0.504672, size * 0.219626);
                ptrCtx.lineTo(size * 0.504672, size * 0.135514);
                ptrCtx.lineTo(size * 0.495327, size * 0.135514);
                ptrCtx.lineTo(size * 0.495327, size * 0.219626);
                ptrCtx.closePath();

                ptrCtx.fillStyle = ptrColor.medium.getRgbaColor();
                ptrCtx.fill();
                break;

            case 'type10':
                // POINTER_TYPE10
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.5, size * 0.149532);
                ptrCtx.bezierCurveTo(size * 0.5, size * 0.149532, size * 0.443925, size * 0.490654, size * 0.443925, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.443925, size * 0.532710, size * 0.467289, size * 0.556074, size * 0.5, size * 0.556074);
                ptrCtx.bezierCurveTo(size * 0.532710, size * 0.556074, size * 0.556074, size * 0.532710, size * 0.556074, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.556074, size * 0.490654, size * 0.5, size * 0.149532, size * 0.5, size * 0.149532);
                ptrCtx.closePath();
                grad = ptrCtx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0);
                grad.addColorStop(0, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = ptrColor.medium.getRgbaColor();
                ptrCtx.lineWidth = 1;
                ptrCtx.lineCap = 'square';
                ptrCtx.lineJoin = 'miter';
                ptrCtx.fill();
                ptrCtx.stroke();
                break;

            case 'type11':
                // POINTER_TYPE11
                ptrCtx.beginPath();
                ptrCtx.moveTo(0.5 * size, 0.168224 * size);
                ptrCtx.lineTo(0.485981 * size, 0.5 * size);
                ptrCtx.bezierCurveTo(0.485981 * size, 0.5 * size, 0.481308 * size, 0.584112 * size, 0.5 * size, 0.584112 * size);
                ptrCtx.bezierCurveTo(0.514018 * size, 0.584112 * size, 0.509345 * size, 0.5 * size, 0.509345 * size, 0.5 * size);
                ptrCtx.lineTo(0.5 * size, 0.168224 * size);
                ptrCtx.closePath();
                grad = ptrCtx.createLinearGradient(0, 0.168224 * size, 0, 0.584112 * size);
                grad.addColorStop(0, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.dark.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = ptrColor.dark.getRgbaColor();
                ptrCtx.fill();
                ptrCtx.stroke();
                break;

            case 'type12':
                // POINTER_TYPE12
                ptrCtx.beginPath();
                ptrCtx.moveTo(0.5 * size, 0.168224 * size);
                ptrCtx.lineTo(0.485981 * size, 0.5 * size);
                ptrCtx.lineTo(0.5 * size, 0.504672 * size);
                ptrCtx.lineTo(0.509345 * size, 0.5 * size);
                ptrCtx.lineTo(0.5 * size, 0.168224 * size);
                ptrCtx.closePath();
                grad = ptrCtx.createLinearGradient(0, 0.168224 * size, 0, 0.504672 * size);
                grad.addColorStop(0, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.dark.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = ptrColor.dark.getRgbaColor();
                ptrCtx.fill();
                ptrCtx.stroke();
                break;

            case 'type13':
                // POINTER_TYPE13
            case 'type14':
                // POINTER_TYPE14 (same shape as 13)
                ptrCtx.beginPath();
                ptrCtx.moveTo(0.485981 * size, 0.168224 * size);
                ptrCtx.lineTo(0.5 * size, 0.130841 * size);
                ptrCtx.lineTo(0.509345 * size, 0.168224 * size);
                ptrCtx.lineTo(0.509345 * size, 0.509345 * size);
                ptrCtx.lineTo(0.485981 * size, 0.509345 * size);
                ptrCtx.lineTo(0.485981 * size, 0.168224 * size);
                ptrCtx.closePath();
                if (ptrType.type === 'type13') {
                    // TYPE13
                    grad = ptrCtx.createLinearGradient(0, 0.5 * size, 0, 0.130841 * size);
                    grad.addColorStop(0, lblColor.getRgbaColor());
                    grad.addColorStop(0.85, lblColor.getRgbaColor());
                    grad.addColorStop(0.85, ptrColor.medium.getRgbaColor());
                    grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                    ptrCtx.fillStyle = grad;
                } else {
                    // TYPE14
                    grad = ptrCtx.createLinearGradient(0.485981 * size, 0, 0.509345 * size, 0);
                    grad.addColorStop(0, ptrColor.veryDark.getRgbaColor());
                    grad.addColorStop(0.5, ptrColor.light.getRgbaColor());
                    grad.addColorStop(1, ptrColor.veryDark.getRgbaColor());
                    ptrCtx.fillStyle = grad;
                }
                ptrCtx.fill();
                break;

            case 'type15':
                // POINTER TYPE15 - Classic with crescent
            case 'type16':
                // POINTER TYPE16 - Classic without crescent
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.509345, size * 0.457943);
                ptrCtx.lineTo(size * 0.5015, size * 0.13);
                ptrCtx.lineTo(size * 0.4985, size * 0.13);
                ptrCtx.lineTo(size * 0.490654, size * 0.457943);
                ptrCtx.bezierCurveTo(size * 0.490654, size * 0.457943, size * 0.490654, size * 0.457943, size * 0.490654, size * 0.457943);
                ptrCtx.bezierCurveTo(size * 0.471962, size * 0.462616, size * 0.457943, size * 0.481308, size * 0.457943, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.457943, size * 0.518691, size * 0.471962, size * 0.537383, size * 0.490654, size * 0.542056);
                ptrCtx.bezierCurveTo(size * 0.490654, size * 0.542056, size * 0.490654, size * 0.542056, size * 0.490654, size * 0.542056);
                if (ptrType.type === 'type15') {
                    ptrCtx.lineTo(size * 0.490654, size * 0.57);
                    ptrCtx.bezierCurveTo(size * 0.46, size * 0.58, size * 0.46, size * 0.62, size * 0.490654, size * 0.63);
                    ptrCtx.bezierCurveTo(size * 0.47, size * 0.62, size * 0.48, size * 0.59, size * 0.5, size * 0.59);
                    ptrCtx.bezierCurveTo(size * 0.53, size * 0.59, size * 0.52, size * 0.62, size * 0.509345, size * 0.63);
                    ptrCtx.bezierCurveTo(size * 0.54, size * 0.62, size * 0.54, size * 0.58, size * 0.509345, size * 0.57);
                    ptrCtx.lineTo(size * 0.509345, size * 0.57);
                } else {
                    ptrCtx.lineTo(size * 0.490654, size * 0.621495);
                    ptrCtx.lineTo(size * 0.509345, size * 0.621495);
                }
                ptrCtx.lineTo(size * 0.509345, size * 0.542056);
                ptrCtx.bezierCurveTo(size * 0.509345, size * 0.542056, size * 0.509345, size * 0.542056, size * 0.509345, size * 0.542056);
                ptrCtx.bezierCurveTo(size * 0.528037, size * 0.537383, size * 0.542056, size * 0.518691, size * 0.542056, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.542056, size * 0.481308, size * 0.528037, size * 0.462616, size * 0.509345, size * 0.457943);
                ptrCtx.bezierCurveTo(size * 0.509345, size * 0.457943, size * 0.509345, size * 0.457943, size * 0.509345, size * 0.457943);
                ptrCtx.closePath();
                if (ptrType.type === 'type15') {
                    grad = ptrCtx.createLinearGradient(0, 0, 0, size * 0.63);
                } else {
                    grad = ptrCtx.createLinearGradient(0, 0, 0, size * 0.621495);
                }
                grad.addColorStop(0, ptrColor.medium.getRgbaColor());
                grad.addColorStop(0.388888, ptrColor.medium.getRgbaColor());
                grad.addColorStop(0.5, ptrColor.light.getRgbaColor());
                grad.addColorStop(0.611111, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.medium.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.strokeStyle = ptrColor.dark.getRgbaColor();
                ptrCtx.fill();
                ptrCtx.stroke();
                // Draw the rings
                ptrCtx.beginPath();
                radius = size * 0.065420 / 2;
                ptrCtx.arc(size * 0.5, size * 0.5, radius, 0, TWO_PI);
                grad = ptrCtx.createLinearGradient(size * 0.5 - radius, size * 0.5 + radius, 0, size * 0.5 + radius);
                grad.addColorStop(0, '#e6b35c');
                grad.addColorStop(0.01, '#e6b35c');
                grad.addColorStop(0.99, '#c48200');
                grad.addColorStop(1, '#c48200');
                ptrCtx.fillStyle = grad;
                ptrCtx.closePath();
                ptrCtx.fill();
                ptrCtx.beginPath();
                radius = size * 0.046728 / 2;
                ptrCtx.arc(size * 0.5, size * 0.5, radius, 0, TWO_PI);
                grad = ptrCtx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, radius);
                grad.addColorStop(0, '#c5c5c5');
                grad.addColorStop(0.19, '#c5c5c5');
                grad.addColorStop(0.22, '#000000');
                grad.addColorStop(0.8, '#000000');
                grad.addColorStop(0.99, '#707070');
                grad.addColorStop(1, '#707070');
                ptrCtx.fillStyle = grad;
                ptrCtx.closePath();
                ptrCtx.fill();
                break;

            case 'type1':
            /* falls through */
            default:
                grad = ptrCtx.createLinearGradient(0, size * 0.471962, 0, size * 0.130841);
                grad.addColorStop(0, ptrColor.veryDark.getRgbaColor());
                grad.addColorStop(0.3, ptrColor.medium.getRgbaColor());
                grad.addColorStop(0.59, ptrColor.medium.getRgbaColor());
                grad.addColorStop(1, ptrColor.veryDark.getRgbaColor());
                ptrCtx.fillStyle = grad;
                ptrCtx.beginPath();
                ptrCtx.moveTo(size * 0.518691, size * 0.471962);
                ptrCtx.bezierCurveTo(size * 0.514018, size * 0.457943, size * 0.509345, size * 0.415887, size * 0.509345, size * 0.401869);
                ptrCtx.bezierCurveTo(size * 0.504672, size * 0.383177, size * 0.5, size * 0.130841, size * 0.5, size * 0.130841);
                ptrCtx.bezierCurveTo(size * 0.5, size * 0.130841, size * 0.490654, size * 0.383177, size * 0.490654, size * 0.397196);
                ptrCtx.bezierCurveTo(size * 0.490654, size * 0.415887, size * 0.485981, size * 0.457943, size * 0.481308, size * 0.471962);
                ptrCtx.bezierCurveTo(size * 0.471962, size * 0.481308, size * 0.467289, size * 0.490654, size * 0.467289, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.467289, size * 0.518691, size * 0.481308, size * 0.532710, size * 0.5, size * 0.532710);
                ptrCtx.bezierCurveTo(size * 0.518691, size * 0.532710, size * 0.532710, size * 0.518691, size * 0.532710, size * 0.5);
                ptrCtx.bezierCurveTo(size * 0.532710, size * 0.490654, size * 0.528037, size * 0.481308, size * 0.518691, size * 0.471962);
                ptrCtx.closePath();
                ptrCtx.fill();
                break;
            }
            // cache buffer
            drawPointerImage.cache[cacheKey] = ptrBuffer;
        }
        ctx.drawImage(drawPointerImage.cache[cacheKey], 0, 0);
        return this;
    };
    drawPointerImage.cache = {};

    var drawRadialFrameImage = function (ctx, frameDesign, centerX, centerY, imageWidth, imageHeight) {
        var radFBuffer, radFCtx,
            grad, outerX, innerX, fractions, colors,
            cacheKey = imageWidth.toString() + imageHeight + frameDesign.design;

        // check if we have already created and cached this buffer, if not create it
        if (!drawRadialFrameImage.cache[cacheKey]) {
            // Setup buffer
            radFBuffer = createBuffer(imageWidth, imageHeight);
            radFCtx = radFBuffer.getContext('2d');

            // outer gray frame
            radFCtx.fillStyle = '#848484';
            radFCtx.strokeStyle = 'rgba(132, 132, 132, 0.5)';
            radFCtx.beginPath();
            radFCtx.arc(centerX, centerY, imageWidth / 2, 0, TWO_PI, true);
            radFCtx.closePath();
            radFCtx.fill();
            radFCtx.stroke();

            radFCtx.beginPath();
            radFCtx.arc(centerX, centerY, imageWidth * 0.990654 / 2, 0, TWO_PI, true);
            radFCtx.closePath();

            // main gradient frame
            switch (frameDesign.design) {
            case 'metal':
                grad = radFCtx.createLinearGradient(0, imageWidth * 0.004672, 0, imageHeight * 0.990654);
                grad.addColorStop(0, '#fefefe');
                grad.addColorStop(0.07, 'rgb(210, 210, 210)');
                grad.addColorStop(0.12, 'rgb(179, 179, 179)');
                grad.addColorStop(1, 'rgb(213, 213, 213)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'brass':
                grad = radFCtx.createLinearGradient(0, imageWidth * 0.004672, 0, imageHeight * 0.990654);
                grad.addColorStop(0, 'rgb(249, 243, 155)');
                grad.addColorStop(0.05, 'rgb(246, 226, 101)');
                grad.addColorStop(0.10, 'rgb(240, 225, 132)');
                grad.addColorStop(0.50, 'rgb(90, 57, 22)');
                grad.addColorStop(0.90, 'rgb(249, 237, 139)');
                grad.addColorStop(0.95, 'rgb(243, 226, 108)');
                grad.addColorStop(1, 'rgb(202, 182, 113)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'steel':
                grad = radFCtx.createLinearGradient(0, imageWidth * 0.004672, 0, imageHeight * 0.990654);
                grad.addColorStop(0, 'rgb(231, 237, 237)');
                grad.addColorStop(0.05, 'rgb(189, 199, 198)');
                grad.addColorStop(0.10, 'rgb(192, 201, 200)');
                grad.addColorStop(0.50, 'rgb(23, 31, 33)');
                grad.addColorStop(0.90, 'rgb(196, 205, 204)');
                grad.addColorStop(0.95, 'rgb(194, 204, 203)');
                grad.addColorStop(1, 'rgb(189, 201, 199)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'gold':
                grad = radFCtx.createLinearGradient(0, imageWidth * 0.004672, 0, imageHeight * 0.990654);
                grad.addColorStop(0, 'rgb(255, 255, 207)');
                grad.addColorStop(0.15, 'rgb(255, 237, 96)');
                grad.addColorStop(0.22, 'rgb(254, 199, 57)');
                grad.addColorStop(0.3, 'rgb(255, 249, 203)');
                grad.addColorStop(0.38, 'rgb(255, 199, 64)');
                grad.addColorStop(0.44, 'rgb(252, 194, 60)');
                grad.addColorStop(0.51, 'rgb(255, 204, 59)');
                grad.addColorStop(0.6, 'rgb(213, 134, 29)');
                grad.addColorStop(0.68, 'rgb(255, 201, 56)');
                grad.addColorStop(0.75, 'rgb(212, 135, 29)');
                grad.addColorStop(1, 'rgb(247, 238, 101)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'anthracite':
                grad = radFCtx.createLinearGradient(0, 0.004672 * imageHeight, 0, 0.995326 * imageHeight);
                grad.addColorStop(0, 'rgb(118, 117, 135)');
                grad.addColorStop(0.06, 'rgb(74, 74, 82)');
                grad.addColorStop(0.12, 'rgb(50, 50, 54)');
                grad.addColorStop(1, 'rgb(79, 79, 87)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'tiltedGray':
                grad = radFCtx.createLinearGradient(0.233644 * imageWidth, 0.084112 * imageHeight, 0.81258 * imageWidth, 0.910919 * imageHeight);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.07, 'rgb(210, 210, 210)');
                grad.addColorStop(0.16, 'rgb(179, 179, 179)');
                grad.addColorStop(0.33, '#ffffff');
                grad.addColorStop(0.55, '#c5c5c5');
                grad.addColorStop(0.79, '#ffffff');
                grad.addColorStop(1, '#666666');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'tiltedBlack':
                grad = radFCtx.createLinearGradient(0.228971 * imageWidth, 0.079439 * imageHeight, 0.802547 * imageWidth, 0.898591 * imageHeight);
                grad.addColorStop(0, '#666666');
                grad.addColorStop(0.21, '#000000');
                grad.addColorStop(0.47, '#666666');
                grad.addColorStop(0.99, '#000000');
                grad.addColorStop(1, '#000000');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                break;

            case 'glossyMetal':
                grad = radFCtx.createRadialGradient(0.5 * imageWidth, 0.5 * imageHeight, 0, 0.5 * imageWidth, 0.5 * imageWidth, 0.5 * imageWidth);
                grad.addColorStop(0, 'rgb(207, 207, 207)');
                grad.addColorStop(0.96, 'rgb(205, 204, 205)');
                grad.addColorStop(1, 'rgb(244, 244, 244)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();
                radFCtx.beginPath();
                radFCtx.arc(0.5 * imageWidth, 0.5 * imageHeight, 0.973962 * imageWidth / 2, 0, TWO_PI);
                radFCtx.closePath();
                grad = radFCtx.createLinearGradient(0, imageHeight - 0.971962 * imageHeight, 0, 0.971962 * imageHeight);
                grad.addColorStop(0, 'rgb(249, 249, 249)');
                grad.addColorStop(0.23, 'rgb(200, 195, 191)');
                grad.addColorStop(0.36, '#ffffff');
                grad.addColorStop(0.59, 'rgb(29, 29, 29)');
                grad.addColorStop(0.76, 'rgb(200, 194, 192)');
                grad.addColorStop(1, 'rgb(209, 209, 209)');
                radFCtx.fillStyle = grad;
                radFCtx.fill();

                radFCtx.beginPath();
                radFCtx.arc(0.5 * imageWidth, 0.5 * imageHeight, 0.869158 * imageWidth / 2, 0, TWO_PI);
                radFCtx.closePath();
                radFCtx.fillStyle = '#f6f6f6';
                radFCtx.fill();

                radFCtx.beginPath();
                radFCtx.arc(0.5 * imageWidth, 0.5 * imageHeight, 0.85 * imageWidth / 2, 0, TWO_PI);
                radFCtx.closePath();
                radFCtx.fillStyle = '#333333';
                radFCtx.fill();
                break;

            case 'blackMetal':
                fractions = [0,
                             0.125,
                             0.347222,
                             0.5,
                             0.680555,
                             0.875,
                             1];

                colors = [ new RgbaColor(254, 254, 254, 1),
                           new RgbaColor(0, 0, 0, 1),
                           new RgbaColor(153, 153, 153, 1),
                           new RgbaColor(0, 0, 0, 1),
                           new RgbaColor(153, 153, 153, 1),
                           new RgbaColor(0, 0, 0, 1),
                           new RgbaColor(254, 254, 254, 1)];

                radFCtx.save();
                radFCtx.arc(centerX, centerY, imageWidth * 0.990654 / 2, 0, TWO_PI, true);
                radFCtx.clip();
                outerX = imageWidth * 0.495327;
                innerX = imageWidth * 0.420560;
                grad = new ConicalGradient(fractions, colors);
                grad.fillCircle(radFCtx, centerX, centerY, innerX, outerX);
                // fade outer edge
                radFCtx.strokeStyle = '#848484';
                radFCtx.strokeStyle = 'rgba(132, 132, 132, 0.8)';
                radFCtx.beginPath();
                radFCtx.lineWidth = imageWidth / 90;
                radFCtx.arc(centerX, centerY, imageWidth / 2, 0, TWO_PI, true);
                radFCtx.closePath();
                radFCtx.stroke();
                radFCtx.restore();
                break;

            case 'shinyMetal':
                fractions = [0,
                             0.125,
                             0.25,
                             0.347222,
                             0.5,
                             0.652777,
                             0.75,
                             0.875,
                             1];

                colors = [ new RgbaColor(254, 254, 254, 1),
                           new RgbaColor(210, 210, 210, 1),
                           new RgbaColor(179, 179, 179, 1),
                           new RgbaColor(238, 238, 238, 1),
                           new RgbaColor(160, 160, 160, 1),
                           new RgbaColor(238, 238, 238, 1),
                           new RgbaColor(179, 179, 179, 1),
                           new RgbaColor(210, 210, 210, 1),
                           new RgbaColor(254, 254, 254, 1)];

                radFCtx.save();
                radFCtx.arc(centerX, centerY, imageWidth * 0.990654 / 2, 0, TWO_PI, true);
                radFCtx.clip();
                outerX = imageWidth * 0.495327;
                innerX = imageWidth * 0.420560;
                grad = new ConicalGradient(fractions, colors);
                grad.fillCircle(radFCtx, centerX, centerY, innerX, outerX);
                // fade outer edge
                radFCtx.strokeStyle = '#848484';
                radFCtx.strokeStyle = 'rgba(132, 132, 132, 0.8)';
                radFCtx.beginPath();
                radFCtx.lineWidth = imageWidth / 90;
                radFCtx.arc(centerX, centerY, imageWidth / 2, 0, TWO_PI, true);
                radFCtx.closePath();
                radFCtx.stroke();
                radFCtx.restore();
                break;

            case 'chrome':
                fractions = [0,
                             0.09,
                             0.12,
                             0.16,
                             0.25,
                             0.29,
                             0.33,
                             0.38,
                             0.48,
                             0.52,
                             0.63,
                             0.68,
                             0.8,
                             0.83,
                             0.87,
                             0.97,
                             1];

                colors = [ new RgbaColor(255, 255, 255, 1),
                           new RgbaColor(255, 255, 255, 1),
                           new RgbaColor(136, 136, 138, 1),
                           new RgbaColor(164, 185, 190, 1),
                           new RgbaColor(158, 179, 182, 1),
                           new RgbaColor(112, 112, 112, 1),
                           new RgbaColor(221, 227, 227, 1),
                           new RgbaColor(155, 176, 179, 1),
                           new RgbaColor(156, 176, 177, 1),
                           new RgbaColor(254, 255, 255, 1),
                           new RgbaColor(255, 255, 255, 1),
                           new RgbaColor(156, 180, 180, 1),
                           new RgbaColor(198, 209, 211, 1),
                           new RgbaColor(246, 248, 247, 1),
                           new RgbaColor(204, 216, 216, 1),
                           new RgbaColor(164, 188, 190, 1),
                           new RgbaColor(255, 255, 255, 1)];

                radFCtx.save();
                radFCtx.arc(centerX, centerY, imageWidth * 0.990654 / 2, 0, TWO_PI, true);
                radFCtx.clip();
                outerX = imageWidth * 0.495327;
                innerX = imageWidth * 0.420560;
                grad = new ConicalGradient(fractions, colors);
                grad.fillCircle(radFCtx, centerX, centerY, innerX, outerX);
                // fade outer edge
                radFCtx.strokeStyle = '#848484';
                radFCtx.strokeStyle = 'rgba(132, 132, 132, 0.8)';
                radFCtx.beginPath();
                radFCtx.lineWidth = imageWidth / 90;
                radFCtx.arc(centerX, centerY, imageWidth / 2, 0, TWO_PI, true);
                radFCtx.closePath();
                radFCtx.stroke();
                radFCtx.restore();

                break;
            }

            // inner bright frame
            radFCtx.fillStyle = 'rgb(191, 191, 191)';
            radFCtx.beginPath();
            radFCtx.arc(centerX, centerY, imageWidth * 0.841121 / 2, 0, TWO_PI, true);
            radFCtx.closePath();
            radFCtx.fill();

            // clip out center so it is transparent if the background is not visible
            radFCtx.globalCompositeOperation = 'destination-out';
            // Background ellipse
            radFCtx.beginPath();
            radFCtx.arc(centerX, centerY, imageWidth * 0.83 / 2, 0, TWO_PI, true);
            radFCtx.closePath();
            radFCtx.fill();

            // cache the buffer
            drawRadialFrameImage.cache[cacheKey] = radFBuffer;
        }
        ctx.drawImage(drawRadialFrameImage.cache[cacheKey], 0, 0);
        return this;
    };
    drawRadialFrameImage.cache = {};


    var drawRadialBackgroundImage = function (ctx, backgroundColor, centerX, centerY, imageWidth, imageHeight) {
        var radBBuffer, radBCtx,
            grad, fractions, colors,
            backgroundOffsetX = imageWidth * 0.831775 / 2,
            mono, textureColor, texture,
            radius, turnRadius, stepSize,
            end, i,
            cacheKey = imageWidth.toString() + imageHeight + backgroundColor.name;

        // check if we have already created and cached this buffer, if not create it
        if (!drawRadialBackgroundImage.cache[cacheKey]) {
            // Setup buffer
            radBBuffer = createBuffer(imageWidth, imageHeight);
            radBCtx = radBBuffer.getContext('2d');

            // Background ellipse
            radBCtx.beginPath();
            radBCtx.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI, true);
            radBCtx.closePath();

            // If the backgroundColor is a texture fill it with the texture instead of the gradient
            if (backgroundColor.name === 'CARBON' || backgroundColor.name === 'PUNCHED_SHEET' ||
                backgroundColor.name === 'BRUSHED_METAL' || backgroundColor.name === 'BRUSHED_STAINLESS') {

                if (backgroundColor.name === 'CARBON') {
                    radBCtx.fillStyle = radBCtx.createPattern(carbonBuffer, 'repeat');
                    radBCtx.fill();
                }

                if (backgroundColor.name === 'PUNCHED_SHEET') {
                    radBCtx.fillStyle = radBCtx.createPattern(punchedSheetBuffer, 'repeat');
                    radBCtx.fill();
                }

                // Add another inner shadow to make the look more realistic
                grad = radBCtx.createLinearGradient(backgroundOffsetX, 0, imageWidth - backgroundOffsetX, 0);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
                grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
                radBCtx.fillStyle = grad;
                radBCtx.beginPath();
                radBCtx.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI, true);
                radBCtx.closePath();
                radBCtx.fill();

                if (backgroundColor.name === 'BRUSHED_METAL' || backgroundColor.name === 'BRUSHED_STAINLESS') {
                    mono = (backgroundColor.name === 'BRUSHED_METAL' ? true : false);
                    textureColor = parseInt(backgroundColor.gradientStop.getHexColor().substr(-6), 16);
                    texture = brushedMetalTexture(textureColor, 5, 0.1, mono, 0.5);
                    radBCtx.fillStyle = radBCtx.createPattern(texture.fill(0, 0, imageWidth, imageHeight), 'no-repeat');
                    radBCtx.fill();
                }
            } else if (backgroundColor.name === 'STAINLESS' || backgroundColor.name === 'TURNED') {
                // Define the fractions of the conical gradient paint
                fractions = [0,
                             0.03,
                             0.10,
                             0.14,
                             0.24,
                             0.33,
                             0.38,
                             0.5,
                             0.62,
                             0.67,
                             0.76,
                             0.81,
                             0.85,
                             0.97,
                             1];

                // Define the colors of the conical gradient paint
                colors = [new RgbaColor('#FDFDFD'),
                          new RgbaColor('#FDFDFD'),
                          new RgbaColor('#B2B2B4'),
                          new RgbaColor('#ACACAE'),
                          new RgbaColor('#FDFDFD'),
                          new RgbaColor('#8E8E8E'),
                          new RgbaColor('#8E8E8E'),
                          new RgbaColor('#FDFDFD'),
                          new RgbaColor('#8E8E8E'),
                          new RgbaColor('#8E8E8E'),
                          new RgbaColor('#FDFDFD'),
                          new RgbaColor('#ACACAE'),
                          new RgbaColor('#B2B2B4'),
                          new RgbaColor('#FDFDFD'),
                          new RgbaColor('#FDFDFD')];

                grad = new ConicalGradient(fractions, colors);
                grad.fillCircle(radBCtx, centerX, centerY, 0, backgroundOffsetX);

                if (backgroundColor.name === 'TURNED') {
                    // Define the turning radius
                    radius = backgroundOffsetX;
                    turnRadius = radius * 0.55;
                    // Step size proporational to radius
                    stepSize = RAD_FACTOR * (500 / radius);
                    // Save before we start
                    radBCtx.save();
                    // restrict the turnings to the desired area
                    radBCtx.beginPath();
                    radBCtx.arc(centerX, centerY, radius, 0, TWO_PI);
                    radBCtx.closePath();
                    radBCtx.clip();
                    // set the style for the turnings
                    radBCtx.lineWidth = 0.5;
                    end = TWO_PI - stepSize * 0.3;
                    // Step the engine round'n'round
                    for (i = 0 ; i < end; i += stepSize) {
                        // draw a 'turn'
                        radBCtx.strokeStyle = 'rgba(240, 240, 255, 0.25)';
                        radBCtx.beginPath();
                        radBCtx.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI);
                        radBCtx.stroke();
                        // rotate the 'piece' a fraction to draw 'shadow'
                        radBCtx.translate(centerX, centerY);
                        radBCtx.rotate(stepSize * 0.3);
                        radBCtx.translate(-centerX, -centerY);
                        // draw a 'turn'
                        radBCtx.strokeStyle = 'rgba(25, 10, 10, 0.1)';
                        radBCtx.beginPath();
                        radBCtx.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI);
                        radBCtx.stroke();
                        // now rotate on to the next 'scribe' position minus the 'fraction'
                        radBCtx.translate(centerX, centerY);
                        radBCtx.rotate(stepSize - stepSize * 0.3);
                        radBCtx.translate(-centerX, -centerY);
                    }
                    // Restore canvas now we are done
                    radBCtx.restore();
                }
            } else {
                grad = radBCtx.createLinearGradient(0, imageWidth * 0.084112, 0, backgroundOffsetX * 2);
                grad.addColorStop(0, backgroundColor.gradientStart.getRgbaColor());
                grad.addColorStop(0.4, backgroundColor.gradientFraction.getRgbaColor());
                grad.addColorStop(1, backgroundColor.gradientStop.getRgbaColor());
                radBCtx.fillStyle = grad;
                radBCtx.fill();
            }
            // Inner shadow
            grad = radBCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, backgroundOffsetX);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.71, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.86, 'rgba(0, 0, 0, 0.03)');
            grad.addColorStop(0.92, 'rgba(0, 0, 0, 0.07)');
            grad.addColorStop(0.97, 'rgba(0, 0, 0, 0.15)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            radBCtx.fillStyle = grad;

            radBCtx.beginPath();
            radBCtx.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI, true);
            radBCtx.closePath();
            radBCtx.fill();

            // cache the buffer
            drawRadialBackgroundImage.cache[cacheKey] = radBBuffer;
        }
        ctx.drawImage(drawRadialBackgroundImage.cache[cacheKey], 0, 0);
        return this;
    };
    drawRadialBackgroundImage.cache = {};

    var drawRadialCustomImage = function (ctx, img, centerX, centerY, imageWidth, imageHeight) {
        var drawWidth = imageWidth * 0.831775,
            drawHeight = imageHeight * 0.831775,
            x = (imageWidth - drawWidth) / 2,
            y = (imageHeight - drawHeight) / 2;

        if (img !== null && img.height > 0 && img.width > 0) {
            ctx.save();
            // Set the clipping area
            ctx.beginPath();
            ctx.arc(centerX, centerY, imageWidth * 0.831775 / 2, 0, TWO_PI, true);
            ctx.clip();
            // Add the image
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            ctx.restore();
        }
        return this;
    };
    var drawRadialForegroundImage = function (ctx, foregroundType, imageWidth, imageHeight, withCenterKnob, knob, style, gaugeType, orientation) {
        var radFgBuffer, radFgCtx,
            knobSize = Math.ceil(imageHeight * 0.084112),
            knobX = imageWidth * 0.5 - knobSize / 2,
            knobY = imageHeight * 0.5 - knobSize / 2,
            shadowOffset = imageWidth * 0.008,
            gradHighlight, gradHighlight2,
            cacheKey = foregroundType.type + imageWidth + imageHeight + withCenterKnob + (knob !== undefined ? knob.type : '-') +
                       (style !== undefined ? style.style : '-') + (orientation !== undefined ? orientation.type : '-');

        // check if we have already created and cached this buffer, if so return it and exit
        if (!drawRadialForegroundImage.cache[cacheKey]) {
            // Setup buffer
            radFgBuffer = createBuffer(imageWidth, imageHeight);
            radFgCtx = radFgBuffer.getContext('2d');

            // center post
            if (withCenterKnob) {
                // Set the pointer shadow params
                radFgCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                radFgCtx.shadowOffsetX = radFgCtx.shadowOffsetY = shadowOffset;
                radFgCtx.shadowBlur = shadowOffset * 2;

                if (gaugeType === steelseries.GaugeType.TYPE5) {
                    if (steelseries.Orientation.WEST === orientation) {
                        knobX = imageWidth * 0.733644 - knobSize / 2;
                        radFgCtx.drawImage(createKnobImage(knobSize, knob, style), knobX, knobY);
                    } else if (steelseries.Orientation.EAST === orientation) {
                        knobX = imageWidth * (1 - 0.733644) - knobSize / 2;
                        radFgCtx.drawImage(createKnobImage(knobSize, knob, style), knobX, knobY);
                    } else {
                        knobY = imageHeight * 0.733644 - knobSize / 2;
                        radFgCtx.drawImage(createKnobImage(knobSize, knob, style), knobX, imageHeight * 0.6857);
                    }
                } else {
                    radFgCtx.drawImage(createKnobImage(knobSize, knob, style), knobX, knobY);
                }
                // Undo shadow drawing
                radFgCtx.shadowOffsetX = radFgCtx.shadowOffsetY = 0;
                radFgCtx.shadowBlur = 0;
            }

            // highlight
            switch (foregroundType.type) {
            case 'type2':
                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.135514, imageHeight * 0.696261);
                radFgCtx.bezierCurveTo(imageWidth * 0.214953, imageHeight * 0.588785, imageWidth * 0.317757, imageHeight * 0.5, imageWidth * 0.462616, imageHeight * 0.425233);
                radFgCtx.bezierCurveTo(imageWidth * 0.612149, imageHeight * 0.345794, imageWidth * 0.733644, imageHeight * 0.317757, imageWidth * 0.873831, imageHeight * 0.322429);
                radFgCtx.bezierCurveTo(imageWidth * 0.766355, imageHeight * 0.112149, imageWidth * 0.528037, imageHeight * 0.023364, imageWidth * 0.313084, imageHeight * 0.130841);
                radFgCtx.bezierCurveTo(imageWidth * 0.098130, imageHeight * 0.238317, imageWidth * 0.028037, imageHeight * 0.485981, imageWidth * 0.135514, imageHeight * 0.696261);
                radFgCtx.closePath();
                gradHighlight = radFgCtx.createLinearGradient(0.313084 * imageWidth, 0.135514 * imageHeight, 0.495528 * imageWidth, 0.493582 * imageHeight);
                gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.275)');
                gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.015)');
                break;

            case 'type3':
                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.084112, imageHeight * 0.509345);
                radFgCtx.bezierCurveTo(imageWidth * 0.210280, imageHeight * 0.556074, imageWidth * 0.462616, imageHeight * 0.560747, imageWidth * 0.5, imageHeight * 0.560747);
                radFgCtx.bezierCurveTo(imageWidth * 0.537383, imageHeight * 0.560747, imageWidth * 0.794392, imageHeight * 0.560747, imageWidth * 0.915887, imageHeight * 0.509345);
                radFgCtx.bezierCurveTo(imageWidth * 0.915887, imageHeight * 0.275700, imageWidth * 0.738317, imageHeight * 0.084112, imageWidth * 0.5, imageHeight * 0.084112);
                radFgCtx.bezierCurveTo(imageWidth * 0.261682, imageHeight * 0.084112, imageWidth * 0.084112, imageHeight * 0.275700, imageWidth * 0.084112, imageHeight * 0.509345);
                radFgCtx.closePath();
                gradHighlight = radFgCtx.createLinearGradient(0, 0.093457 * imageHeight, 0, 0.556073 * imageHeight);
                gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.275)');
                gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.015)');
                break;

            case 'type4':
                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.677570, imageHeight * 0.242990);
                radFgCtx.bezierCurveTo(imageWidth * 0.771028, imageHeight * 0.308411, imageWidth * 0.822429, imageHeight * 0.411214, imageWidth * 0.813084, imageHeight * 0.528037);
                radFgCtx.bezierCurveTo(imageWidth * 0.799065, imageHeight * 0.654205, imageWidth * 0.719626, imageHeight * 0.757009, imageWidth * 0.593457, imageHeight * 0.799065);
                radFgCtx.bezierCurveTo(imageWidth * 0.485981, imageHeight * 0.831775, imageWidth * 0.369158, imageHeight * 0.808411, imageWidth * 0.285046, imageHeight * 0.728971);
                radFgCtx.bezierCurveTo(imageWidth * 0.275700, imageHeight * 0.719626, imageWidth * 0.252336, imageHeight * 0.714953, imageWidth * 0.233644, imageHeight * 0.728971);
                radFgCtx.bezierCurveTo(imageWidth * 0.214953, imageHeight * 0.747663, imageWidth * 0.219626, imageHeight * 0.771028, imageWidth * 0.228971, imageHeight * 0.775700);
                radFgCtx.bezierCurveTo(imageWidth * 0.331775, imageHeight * 0.878504, imageWidth * 0.476635, imageHeight * 0.915887, imageWidth * 0.616822, imageHeight * 0.869158);
                radFgCtx.bezierCurveTo(imageWidth * 0.771028, imageHeight * 0.822429, imageWidth * 0.873831, imageHeight * 0.691588, imageWidth * 0.887850, imageHeight * 0.532710);
                radFgCtx.bezierCurveTo(imageWidth * 0.897196, imageHeight * 0.387850, imageWidth * 0.836448, imageHeight * 0.257009, imageWidth * 0.719626, imageHeight * 0.182242);
                radFgCtx.bezierCurveTo(imageWidth * 0.705607, imageHeight * 0.172897, imageWidth * 0.682242, imageHeight * 0.163551, imageWidth * 0.663551, imageHeight * 0.186915);
                radFgCtx.bezierCurveTo(imageWidth * 0.654205, imageHeight * 0.205607, imageWidth * 0.668224, imageHeight * 0.238317, imageWidth * 0.677570, imageHeight * 0.242990);
                radFgCtx.closePath();
                gradHighlight = radFgCtx.createRadialGradient((0.5) * imageWidth, ((0.5) * imageHeight), 0, ((0.5) * imageWidth), ((0.5) * imageHeight), 0.387850 * imageWidth);
                gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradHighlight.addColorStop(0.82, 'rgba(255, 255, 255, 0)');
                gradHighlight.addColorStop(0.83, 'rgba(255, 255, 255, 0)');
                gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.15)');

                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.261682, imageHeight * 0.224299);
                radFgCtx.bezierCurveTo(imageWidth * 0.285046, imageHeight * 0.238317, imageWidth * 0.252336, imageHeight * 0.285046, imageWidth * 0.242990, imageHeight * 0.317757);
                radFgCtx.bezierCurveTo(imageWidth * 0.242990, imageHeight * 0.350467, imageWidth * 0.271028, imageHeight * 0.383177, imageWidth * 0.271028, imageHeight * 0.397196);
                radFgCtx.bezierCurveTo(imageWidth * 0.275700, imageHeight * 0.415887, imageWidth * 0.261682, imageHeight * 0.457943, imageWidth * 0.238317, imageHeight * 0.509345);
                radFgCtx.bezierCurveTo(imageWidth * 0.224299, imageHeight * 0.542056, imageWidth * 0.177570, imageHeight * 0.612149, imageWidth * 0.158878, imageHeight * 0.612149);
                radFgCtx.bezierCurveTo(imageWidth * 0.144859, imageHeight * 0.612149, imageWidth * 0.088785, imageHeight * 0.546728, imageWidth * 0.130841, imageHeight * 0.369158);
                radFgCtx.bezierCurveTo(imageWidth * 0.140186, imageHeight * 0.336448, imageWidth * 0.214953, imageHeight * 0.200934, imageWidth * 0.261682, imageHeight * 0.224299);
                radFgCtx.closePath();
                gradHighlight2 = radFgCtx.createLinearGradient(0.130841 * imageWidth, 0.369158 * imageHeight, 0.273839 * imageWidth, 0.412877 * imageHeight);
                gradHighlight2.addColorStop(0, 'rgba(255, 255, 255, 0.275)');
                gradHighlight2.addColorStop(1, 'rgba(255, 255, 255, 0.015)');
                radFgCtx.fillStyle = gradHighlight2;
                radFgCtx.fill();
                break;

            case 'type5':
                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.084112, imageHeight * 0.5);
                radFgCtx.bezierCurveTo(imageWidth * 0.084112, imageHeight * 0.271028, imageWidth * 0.271028, imageHeight * 0.084112, imageWidth * 0.5, imageHeight * 0.084112);
                radFgCtx.bezierCurveTo(imageWidth * 0.700934, imageHeight * 0.084112, imageWidth * 0.864485, imageHeight * 0.224299, imageWidth * 0.906542, imageHeight * 0.411214);
                radFgCtx.bezierCurveTo(imageWidth * 0.911214, imageHeight * 0.439252, imageWidth * 0.911214, imageHeight * 0.518691, imageWidth * 0.845794, imageHeight * 0.537383);
                radFgCtx.bezierCurveTo(imageWidth * 0.794392, imageHeight * 0.546728, imageWidth * 0.551401, imageHeight * 0.411214, imageWidth * 0.392523, imageHeight * 0.457943);
                radFgCtx.bezierCurveTo(imageWidth * 0.168224, imageHeight * 0.509345, imageWidth * 0.135514, imageHeight * 0.775700, imageWidth * 0.093457, imageHeight * 0.593457);
                radFgCtx.bezierCurveTo(imageWidth * 0.088785, imageHeight * 0.560747, imageWidth * 0.084112, imageHeight * 0.532710, imageWidth * 0.084112, imageHeight * 0.5);
                radFgCtx.closePath();
                gradHighlight = radFgCtx.createLinearGradient(0, 0.084112 * imageHeight, 0, 0.644859 * imageHeight);
                gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.275)');
                gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.015)');
                break;

            case 'type1':
            /* falls through */
            default:
                radFgCtx.beginPath();
                radFgCtx.moveTo(imageWidth * 0.084112, imageHeight * 0.509345);
                radFgCtx.bezierCurveTo(imageWidth * 0.205607, imageHeight * 0.448598, imageWidth * 0.336448, imageHeight * 0.415887, imageWidth * 0.5, imageHeight * 0.415887);
                radFgCtx.bezierCurveTo(imageWidth * 0.672897, imageHeight * 0.415887, imageWidth * 0.789719, imageHeight * 0.443925, imageWidth * 0.915887, imageHeight * 0.509345);
                radFgCtx.bezierCurveTo(imageWidth * 0.915887, imageHeight * 0.275700, imageWidth * 0.738317, imageHeight * 0.084112, imageWidth * 0.5, imageHeight * 0.084112);
                radFgCtx.bezierCurveTo(imageWidth * 0.261682, imageHeight * 0.084112, imageWidth * 0.084112, imageHeight * 0.275700, imageWidth * 0.084112, imageHeight * 0.509345);
                radFgCtx.closePath();
                gradHighlight = radFgCtx.createLinearGradient(0, 0.088785 * imageHeight, 0, 0.490654 * imageHeight);
                gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.275)');
                gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.015)');
                break;
            }
            radFgCtx.fillStyle = gradHighlight;
            radFgCtx.fill();

            // cache the buffer
            drawRadialForegroundImage.cache[cacheKey] = radFgBuffer;
        }
        ctx.drawImage(drawRadialForegroundImage.cache[cacheKey], 0, 0);
        return this;
    };
    drawRadialForegroundImage.cache = {};

    var createKnobImage = function (size, knob, style) {
        var knobBuffer, knobCtx,
            maxPostCenterX = size / 2,
            maxPostCenterY = size / 2,
            grad,
            cacheKey = size.toString() + knob.type + style.style;

        // check if we have already created and cached this buffer, if not create it
        if (!createKnobImage.cache[cacheKey]) {
            knobBuffer = createBuffer(size * 1.18889, size * 1.18889);
            knobCtx = knobBuffer.getContext('2d');

            switch (knob.type) {
            case 'metalKnob':
                // METALKNOB_FRAME
                knobCtx.beginPath();
                knobCtx.moveTo(0, size * 0.5);
                knobCtx.bezierCurveTo(0, size * 0.222222, size * 0.222222, 0, size * 0.5, 0);
                knobCtx.bezierCurveTo(size * 0.777777, 0, size, size * 0.222222, size, size * 0.5);
                knobCtx.bezierCurveTo(size, size * 0.777777, size * 0.777777, size, size * 0.5, size);
                knobCtx.bezierCurveTo(size * 0.222222, size, 0, size * 0.777777, 0, size * 0.5);
                knobCtx.closePath();
                grad = knobCtx.createLinearGradient(0, 0, 0, size);
                grad.addColorStop(0, 'rgb(92, 95, 101)');
                grad.addColorStop(0.47, 'rgb(46, 49, 53)');
                grad.addColorStop(1, 'rgb(22, 23, 26)');
                knobCtx.fillStyle = grad;
                knobCtx.fill();

                // METALKNOB_MAIN
                knobCtx.beginPath();
                knobCtx.moveTo(size * 0.055555, size * 0.5);
                knobCtx.bezierCurveTo(size * 0.055555, size * 0.277777, size * 0.277777, size * 0.055555, size * 0.5, size * 0.055555);
                knobCtx.bezierCurveTo(size * 0.722222, size * 0.055555, size * 0.944444, size * 0.277777, size * 0.944444, size * 0.5);
                knobCtx.bezierCurveTo(size * 0.944444, size * 0.722222, size * 0.722222, size * 0.944444, size * 0.5, size * 0.944444);
                knobCtx.bezierCurveTo(size * 0.277777, size * 0.944444, size * 0.055555, size * 0.722222, size * 0.055555, size * 0.5);
                knobCtx.closePath();
                grad = knobCtx.createLinearGradient(0, 0.055555 * size, 0, 0.944443 * size);
                switch (style.style) {
                case 'black':
                    grad.addColorStop(0, 'rgb(43, 42, 47)');
                    grad.addColorStop(1, 'rgb(26, 27, 32)');
                    break;

                case 'brass':
                    grad.addColorStop(0, 'rgb(150, 110, 54)');
                    grad.addColorStop(1, 'rgb(124, 95, 61)');
                    break;

                case 'silver':
                /* falls through */
                default:
                    grad.addColorStop(0, 'rgb(204, 204, 204)');
                    grad.addColorStop(1, 'rgb(87, 92, 98)');
                    break;
                }
                knobCtx.fillStyle = grad;
                knobCtx.fill();

                // METALKNOB_LOWERHL
                knobCtx.beginPath();
                knobCtx.moveTo(size * 0.777777, size * 0.833333);
                knobCtx.bezierCurveTo(size * 0.722222, size * 0.722222, size * 0.611111, size * 0.666666, size * 0.5, size * 0.666666);
                knobCtx.bezierCurveTo(size * 0.388888, size * 0.666666, size * 0.277777, size * 0.722222, size * 0.222222, size * 0.833333);
                knobCtx.bezierCurveTo(size * 0.277777, size * 0.888888, size * 0.388888, size * 0.944444, size * 0.5, size * 0.944444);
                knobCtx.bezierCurveTo(size * 0.611111, size * 0.944444, size * 0.722222, size * 0.888888, size * 0.777777, size * 0.833333);
                knobCtx.closePath();
                grad = knobCtx.createRadialGradient((0.555555) * size, ((0.944444) * size), 0, ((0.555555) * size), ((0.944444) * size), 0.388888 * size);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                knobCtx.fillStyle = grad;
                knobCtx.fill();

                // METALKNOB_UPPERHL
                knobCtx.beginPath();
                knobCtx.moveTo(size * 0.944444, size * 0.277777);
                knobCtx.bezierCurveTo(size * 0.833333, size * 0.111111, size * 0.666666, 0, size * 0.5, 0);
                knobCtx.bezierCurveTo(size * 0.333333, 0, size * 0.166666, size * 0.111111, size * 0.055555, size * 0.277777);
                knobCtx.bezierCurveTo(size * 0.166666, size * 0.333333, size * 0.333333, size * 0.388888, size * 0.5, size * 0.388888);
                knobCtx.bezierCurveTo(size * 0.666666, size * 0.388888, size * 0.833333, size * 0.333333, size * 0.944444, size * 0.277777);
                knobCtx.closePath();
                grad = knobCtx.createRadialGradient(0.5 * size, 0, 0, ((0.5) * size), 0, 0.583333 * size);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.749019)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                knobCtx.fillStyle = grad;
                knobCtx.fill();

                // METALKNOB_INNERFRAME
                knobCtx.beginPath();
                knobCtx.moveTo(size * 0.277777, size * 0.555555);
                knobCtx.bezierCurveTo(size * 0.277777, size * 0.388888, size * 0.388888, size * 0.277777, size * 0.5, size * 0.277777);
                knobCtx.bezierCurveTo(size * 0.611111, size * 0.277777, size * 0.777777, size * 0.388888, size * 0.777777, size * 0.555555);
                knobCtx.bezierCurveTo(size * 0.777777, size * 0.666666, size * 0.611111, size * 0.777777, size * 0.5, size * 0.777777);
                knobCtx.bezierCurveTo(size * 0.388888, size * 0.777777, size * 0.277777, size * 0.666666, size * 0.277777, size * 0.555555);
                knobCtx.closePath();
                grad = knobCtx.createLinearGradient(0, 0.277777 * size, 0, 0.722221 * size);
                grad.addColorStop(0, '#000000');
                grad.addColorStop(1, 'rgb(204, 204, 204)');
                knobCtx.fillStyle = grad;
                knobCtx.fill();

                // METALKNOB_INNERBACKGROUND
                knobCtx.beginPath();
                knobCtx.moveTo(size * 0.333333, size * 0.555555);
                knobCtx.bezierCurveTo(size * 0.333333, size * 0.444444, size * 0.388888, size * 0.333333, size * 0.5, size * 0.333333);
                knobCtx.bezierCurveTo(size * 0.611111, size * 0.333333, size * 0.722222, size * 0.444444, size * 0.722222, size * 0.555555);
                knobCtx.bezierCurveTo(size * 0.722222, size * 0.611111, size * 0.611111, size * 0.722222, size * 0.5, size * 0.722222);
                knobCtx.bezierCurveTo(size * 0.388888, size * 0.722222, size * 0.333333, size * 0.611111, size * 0.333333, size * 0.555555);
                knobCtx.closePath();
                grad = knobCtx.createLinearGradient(0, 0.333333 * size, 0, 0.666666 * size);
                grad.addColorStop(0, 'rgb(10, 9, 1)');
                grad.addColorStop(1, 'rgb(42, 41, 37)');
                knobCtx.fillStyle = grad;
                knobCtx.fill();
                break;

            case 'standardKnob':
                grad = knobCtx.createLinearGradient(0, 0, 0, size);
                grad.addColorStop(0, 'rgb(180, 180, 180)');
                grad.addColorStop(0.46, 'rgb(63, 63, 63)');
                grad.addColorStop(1, 'rgb(40, 40, 40)');
                knobCtx.fillStyle = grad;
                knobCtx.beginPath();
                knobCtx.arc(maxPostCenterX, maxPostCenterY, size / 2, 0, TWO_PI, true);
                knobCtx.closePath();
                knobCtx.fill();
                grad = knobCtx.createLinearGradient(0, size - size * 0.77, 0, size - size * 0.77 + size * 0.77);
                switch (style.style) {
                case 'black':
                    grad.addColorStop(0, 'rgb(191, 191, 191)');
                    grad.addColorStop(0.5, 'rgb(45, 44, 49)');
                    grad.addColorStop(1, 'rgb(125, 126, 128)');
                    break;

                case 'brass':
                    grad.addColorStop(0, 'rgb(223, 208, 174)');
                    grad.addColorStop(0.5, 'rgb(123, 95, 63)');
                    grad.addColorStop(1, 'rgb(207, 190, 157)');
                    break;

                case 'silver':
                /* falls through */
                default:
                    grad.addColorStop(0, 'rgb(215, 215, 215)');
                    grad.addColorStop(0.5, 'rgb(116, 116, 116)');
                    grad.addColorStop(1, 'rgb(215, 215, 215)');
                    break;
                }
                knobCtx.fillStyle = grad;
                knobCtx.beginPath();
                knobCtx.arc(maxPostCenterX, maxPostCenterY, size * 0.77 / 2, 0, TWO_PI, true);
                knobCtx.closePath();
                knobCtx.fill();

                grad = knobCtx.createRadialGradient(maxPostCenterX, maxPostCenterY, 0, maxPostCenterX, maxPostCenterY, size * 0.77 / 2);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(0.75, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(0.76, 'rgba(0, 0, 0, 0.01)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                knobCtx.fillStyle = grad;
                knobCtx.beginPath();
                knobCtx.arc(maxPostCenterX, maxPostCenterY, size * 0.77 / 2, 0, TWO_PI, true);
                knobCtx.closePath();
                knobCtx.fill();
                break;
            }

            // cache the buffer
            createKnobImage.cache[cacheKey] = knobBuffer;
        }
        return createKnobImage.cache[cacheKey];
    };
    createKnobImage.cache = {};

    var createLedImage = function (size, state, ledColor) {
        var ledBuffer, ledCtx,
            // Bug in Chrome browser, radialGradients do not draw correctly if the center is not an integer value
            ledCenterX = 2 * Math.round(size / 4),
            ledCenterY = 2 * Math.round(size / 4),
            grad,
            cacheKey = size.toString() + state + ledColor.outerColor_ON;

        // check if we have already created and cached this buffer, if not create it
        if (!createLedImage.cache[cacheKey]) {
            ledBuffer = createBuffer(size, size);
            ledCtx = ledBuffer.getContext('2d');

            switch (state) {
            case 0: // LED OFF
                // OFF Gradient
                grad = ledCtx.createRadialGradient(ledCenterX, ledCenterY, 0, ledCenterX, ledCenterY, size * 0.5 / 2);
                grad.addColorStop(0, ledColor.innerColor1_OFF);
                grad.addColorStop(0.2, ledColor.innerColor2_OFF);
                grad.addColorStop(1, ledColor.outerColor_OFF);
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, ledCenterY, size * 0.5 / 2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();

                // InnerShadow
                grad = ledCtx.createRadialGradient(ledCenterX, ledCenterY, 0, ledCenterX, ledCenterY, size * 0.5 / 2);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, ledCenterY, size * 0.5 / 2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();

                // LightReflex
                grad = ledCtx.createLinearGradient(0, 0.35 * size, 0, 0.35 * size + 0.15 * size);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, 0.35 * size + 0.2 * size / 2, size * 0.2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();
                break;

            case 1: // LED ON
                // ON Gradient
                grad = ledCtx.createRadialGradient(ledCenterX, ledCenterY, 0, ledCenterX, ledCenterY, size * 0.5 / 2);
                grad.addColorStop(0, ledColor.innerColor1_ON);
                grad.addColorStop(0.2, ledColor.innerColor2_ON);
                grad.addColorStop(1, ledColor.outerColor_ON);
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, ledCenterY, size * 0.5 / 2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();

                // InnerShadow
                grad = ledCtx.createRadialGradient(ledCenterX, ledCenterY, 0, ledCenterX, ledCenterY, size * 0.5 / 2);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, ledCenterY, size * 0.5 / 2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();

                // LightReflex
                grad = ledCtx.createLinearGradient(0, 0.35 * size, 0, 0.35 * size + 0.15 * size);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, 0.35 * size + 0.2 * size / 2, size * 0.2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();

                // Corona
                grad = ledCtx.createRadialGradient(ledCenterX, ledCenterY, 0, ledCenterX, ledCenterY, size / 2);
                grad.addColorStop(0, setAlpha(ledColor.coronaColor, 0));
                grad.addColorStop(0.6, setAlpha(ledColor.coronaColor, 0.4));
                grad.addColorStop(0.7, setAlpha(ledColor.coronaColor, 0.25));
                grad.addColorStop(0.8, setAlpha(ledColor.coronaColor, 0.15));
                grad.addColorStop(0.85, setAlpha(ledColor.coronaColor, 0.05));
                grad.addColorStop(1, setAlpha(ledColor.coronaColor, 0));
                ledCtx.fillStyle = grad;

                ledCtx.beginPath();
                ledCtx.arc(ledCenterX, ledCenterY, size / 2, 0, TWO_PI, true);
                ledCtx.closePath();
                ledCtx.fill();
                break;
            }
            // cache the buffer
            createLedImage.cache[cacheKey] = ledBuffer;
        }
        return createLedImage.cache[cacheKey];
    };
    createLedImage.cache = {};

    var createLcdBackgroundImage = function (width, height, lcdColor) {
        var lcdBuffer, lcdCtx,
            xB = 0,
            yB = 0,
            wB = width,
            hB = height,
            rB = Math.min(width, height) * 0.095,
            grad,
            xF = 1,
            yF = 1,
            wF = width - 2,
            hF = height - 2,
            rF = rB - 1,
            cacheKey = width.toString() + height + JSON.stringify(lcdColor);

        // check if we have already created and cached this buffer, if not create it
        if (!createLcdBackgroundImage.cache[cacheKey]) {
            lcdBuffer = createBuffer(width, height);
            lcdCtx = lcdBuffer.getContext('2d');
            // background
            grad = lcdCtx.createLinearGradient(0, yB, 0, yB + hB);
            grad.addColorStop(0, '#4c4c4c');
            grad.addColorStop(0.08, '#666666');
            grad.addColorStop(0.92, '#666666');
            grad.addColorStop(1, '#e6e6e6');
            lcdCtx.fillStyle = grad;
            roundedRectangle(lcdCtx, xB, yB, wB, hB, rB);
            lcdCtx.fill();

            // foreground
            grad = lcdCtx.createLinearGradient(0, yF, 0, yF + hF);
            grad.addColorStop(0, lcdColor.gradientStartColor);
            grad.addColorStop(0.03, lcdColor.gradientFraction1Color);
            grad.addColorStop(0.49, lcdColor.gradientFraction2Color);
            grad.addColorStop(0.5, lcdColor.gradientFraction3Color);
            grad.addColorStop(1, lcdColor.gradientStopColor);
            lcdCtx.fillStyle = grad;
            roundedRectangle(lcdCtx, xF, yF, wF, hF, rF);
            lcdCtx.fill();
            // cache the buffer
            createLcdBackgroundImage.cache[cacheKey] = lcdBuffer;
        }
        return createLcdBackgroundImage.cache[cacheKey];
    };
    createLcdBackgroundImage.cache = {};

    var createMeasuredValueImage = function (size, indicatorColor, radial, vertical) {
        var indicatorBuffer, indicatorCtx,
            cacheKey = size.toString() + indicatorColor + radial + vertical;

        // check if we have already created and cached this buffer, if so return it and exit
        if (!createMeasuredValueImage.cache[cacheKey]) {
            indicatorBuffer = doc.createElement('canvas');
            indicatorCtx = indicatorBuffer.getContext('2d');
            indicatorBuffer.width = size;
            indicatorBuffer.height = size;
            indicatorCtx.fillStyle = indicatorColor;
            if (radial) {
                indicatorCtx.beginPath();
                indicatorCtx.moveTo(size * 0.5, size);
                indicatorCtx.lineTo(0, 0);
                indicatorCtx.lineTo(size, 0);
                indicatorCtx.closePath();
                indicatorCtx.fill();
            } else {
                if (vertical) {
                    indicatorCtx.beginPath();
                    indicatorCtx.moveTo(size, size * 0.5);
                    indicatorCtx.lineTo(0, 0);
                    indicatorCtx.lineTo(0, size);
                    indicatorCtx.closePath();
                    indicatorCtx.fill();
                } else {
                    indicatorCtx.beginPath();
                    indicatorCtx.moveTo(size * 0.5, 0);
                    indicatorCtx.lineTo(size, size);
                    indicatorCtx.lineTo(0, size);
                    indicatorCtx.closePath();
                    indicatorCtx.fill();
                }
            }
            // cache the buffer
            createMeasuredValueImage.cache[cacheKey] = indicatorBuffer;
        }
        return createMeasuredValueImage.cache[cacheKey];
    };
    createMeasuredValueImage.cache = {};

    var createTrendIndicator = function (width, onSection, colors) {
        var height = width * 2,
            trendBuffer, trendCtx,
            fill,
            cacheKey = onSection.state + width + JSON.stringify(colors),

            drawUpArrow = function () {
                // draw up arrow (red)
                var ledColor = colors[0];

                if (onSection.state === 'up') {
                    fill = trendCtx.createRadialGradient(0.5 * width, 0.2 * height, 0, 0.5 * width, 0.2 * height, 0.5 * width);
                    fill.addColorStop(0, ledColor.innerColor1_ON);
                    fill.addColorStop(0.2, ledColor.innerColor2_ON);
                    fill.addColorStop(1, ledColor.outerColor_ON);
                } else {
                    fill = trendCtx.createLinearGradient(0, 0, 0, 0.5 * height);
                    fill.addColorStop(0, '#323232');
                    fill.addColorStop(1, '#5c5c5c');
                }
                trendCtx.fillStyle = fill;
                trendCtx.beginPath();
                trendCtx.moveTo(0.5 * width, 0);
                trendCtx.lineTo(width, 0.2 * height);
                trendCtx.lineTo(0.752 * width, 0.2 * height);
                trendCtx.lineTo(0.752 * width, 0.37 * height);
                trendCtx.lineTo(0.252 * width, 0.37 * height);
                trendCtx.lineTo(0.252 * width, 0.2 * height);
                trendCtx.lineTo(0, 0.2 * height);
                trendCtx.closePath();
                trendCtx.fill();
                if (onSection.state !== 'up') {
                    // Inner shadow
                    trendCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0, 0.2 * height);
                    trendCtx.lineTo(0.5 * width, 0);
                    trendCtx.lineTo(width, 0.2 * height);
                    trendCtx.moveTo(0.252 * width, 0.2 * height);
                    trendCtx.lineTo(0.252 * width, 0.37 * height);
                    trendCtx.stroke();
                    // Inner highlight
                    trendCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.252 * width, 0.37 * height);
                    trendCtx.lineTo(0.752 * width, 0.37 * height);
                    trendCtx.lineTo(0.752 * width, 0.2 * height);
                    trendCtx.lineTo(width, 0.2 * height);
                    trendCtx.stroke();
                } else {
                    // draw halo
                    fill = trendCtx.createRadialGradient(0.5 * width, 0.2 * height, 0, 0.5 * width, 0.2 * height, 0.7 * width);
                    fill.addColorStop(0, setAlpha(ledColor.coronaColor, 0));
                    fill.addColorStop(0.5, setAlpha(ledColor.coronaColor, 0.3));
                    fill.addColorStop(0.7, setAlpha(ledColor.coronaColor, 0.2));
                    fill.addColorStop(0.8, setAlpha(ledColor.coronaColor, 0.1));
                    fill.addColorStop(0.85, setAlpha(ledColor.coronaColor, 0.05));
                    fill.addColorStop(1, setAlpha(ledColor.coronaColor, 0));
                    trendCtx.fillStyle = fill;

                    trendCtx.beginPath();
                    trendCtx.arc(0.5 * width, 0.2 * height, 0.7 * width, 0, TWO_PI, true);
                    trendCtx.closePath();
                    trendCtx.fill();
                }
            },

            drawEquals = function () {
                // draw equal symbol
                var ledColor = colors[1];

                trendCtx.beginPath();
                if (onSection.state === 'steady') {
                    fill = ledColor.outerColor_ON;
                    trendCtx.fillStyle = fill;
                    trendCtx.rect(0.128 * width, 0.41 * height, 0.744 * width, 0.074 * height);
                    trendCtx.rect(0.128 * width, 0.516 * height, 0.744 * width, 0.074 * height);
                    trendCtx.closePath();
                    trendCtx.fill();
                } else {
                    fill = trendCtx.createLinearGradient(0, 0.41 * height, 0, 0.41 * height + 0.074 * height);
                    fill.addColorStop(0, '#323232');
                    fill.addColorStop(1, '#5c5c5c');
                    trendCtx.fillStyle = fill;
                    trendCtx.rect(0.128 * width, 0.41 * height, 0.744 * width, 0.074 * height);
                    trendCtx.closePath();
                    trendCtx.fill();
                    fill = trendCtx.createLinearGradient(0, 0.516 * height, 0, 0.516 * height + 0.074 * height);
                    fill.addColorStop(0, '#323232');
                    fill.addColorStop(1, '#5c5c5c');
                    trendCtx.fillStyle = fill;
                    trendCtx.rect(0.128 * width, 0.516 * height, 0.744 * width, 0.074 * height);
                    trendCtx.closePath();
                    trendCtx.fill();
                }
                if (onSection.state !== 'steady') {
                    // inner shadow
                    trendCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.128 * width, 0.41 * height + 0.074 * height);
                    trendCtx.lineTo(0.128 * width, 0.41 * height);
                    trendCtx.lineTo(0.128 * width + 0.744 * width, 0.41 * height);
                    trendCtx.stroke();
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.128 * width, 0.516 * height + 0.074 * height);
                    trendCtx.lineTo(0.128 * width, 0.516 * height);
                    trendCtx.lineTo(0.128 * width + 0.744 * width, 0.516 * height);
                    trendCtx.stroke();
                    // inner highlight
                    trendCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.128 * width + 0.744 * width, 0.41 * height);
                    trendCtx.lineTo(0.128 * width + 0.744 * width, 0.41 * height + 0.074 * height);
                    trendCtx.lineTo(0.128 * width, 0.41 * height + 0.074 * height);
                    trendCtx.stroke();
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.128 * width + 0.744 * width, 0.516 * height);
                    trendCtx.lineTo(0.128 * width + 0.744 * width, 0.516 * height + 0.074 * height);
                    trendCtx.lineTo(0.128 * width, 0.516 * height + 0.074 * height);
                    trendCtx.stroke();
                } else {
                    // draw halo
                    fill = trendCtx.createRadialGradient(0.5 * width, 0.5 * height, 0, 0.5 * width, 0.5 * height, 0.7 * width);
                    fill.addColorStop(0, setAlpha(ledColor.coronaColor, 0));
                    fill.addColorStop(0.5, setAlpha(ledColor.coronaColor, 0.3));
                    fill.addColorStop(0.7, setAlpha(ledColor.coronaColor, 0.2));
                    fill.addColorStop(0.8, setAlpha(ledColor.coronaColor, 0.1));
                    fill.addColorStop(0.85, setAlpha(ledColor.coronaColor, 0.05));
                    fill.addColorStop(1, setAlpha(ledColor.coronaColor, 0));
                    trendCtx.fillStyle = fill;
                    trendCtx.beginPath();
                    trendCtx.arc(0.5 * width, 0.5 * height, 0.7 * width, 0, TWO_PI, true);
                    trendCtx.closePath();
                    trendCtx.fill();
                }
            },

            drawDownArrow = function () {
                // draw down arrow
                var ledColor = colors[2];
                if (onSection.state === 'down') {
                    fill = trendCtx.createRadialGradient(0.5 * width, 0.8 * height, 0, 0.5 * width, 0.8 * height, 0.5 * width);
                    fill.addColorStop(0, ledColor.innerColor1_ON);
                    fill.addColorStop(0.2, ledColor.innerColor2_ON);
                    fill.addColorStop(1, ledColor.outerColor_ON);
                } else {
                    fill = trendCtx.createLinearGradient(0, 0.63 * height, 0, height);
                    fill.addColorStop(0, '#323232');
                    fill.addColorStop(1, '#5c5c5c');
                }
                trendCtx.beginPath();
                trendCtx.fillStyle = fill;
                trendCtx.moveTo(0.5 * width, height);
                trendCtx.lineTo(width, 0.8 * height);
                trendCtx.lineTo(0.725 * width, 0.8 * height);
                trendCtx.lineTo(0.725 * width, 0.63 * height);
                trendCtx.lineTo(0.252 * width, 0.63 * height);
                trendCtx.lineTo(0.252 * width, 0.8 * height);
                trendCtx.lineTo(0, 0.8 * height);
                trendCtx.closePath();
                trendCtx.fill();
                if (onSection.state !== 'down') {
                    // Inner shadow
                    trendCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0, 0.8 * height);
                    trendCtx.lineTo(0.252 * width, 0.8 * height);
                    trendCtx.moveTo(0.252 * width, 0.63 * height);
                    trendCtx.lineTo(0.752 * width, 0.63 * height);
                    trendCtx.stroke();
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.752 * width, 0.8 * height);
                    trendCtx.lineTo(width, 0.8 * height);
                    trendCtx.stroke();
                    // Inner highlight
                    trendCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    trendCtx.beginPath();
                    trendCtx.moveTo(0, 0.8 * height);
                    trendCtx.lineTo(0.5 * width, height);
                    trendCtx.lineTo(width, 0.8 * height);
                    trendCtx.stroke();
                    trendCtx.beginPath();
                    trendCtx.moveTo(0.752 * width, 0.8 * height);
                    trendCtx.lineTo(0.752 * width, 0.63 * height);
                    trendCtx.stroke();
                } else {
                    // draw halo
                    fill = trendCtx.createRadialGradient(0.5 * width, 0.8 * height, 0, 0.5 * width, 0.8 * height, 0.7 * width);
                    fill.addColorStop(0, setAlpha(ledColor.coronaColor, 0));
                    fill.addColorStop(0.5, setAlpha(ledColor.coronaColor, 0.3));
                    fill.addColorStop(0.7, setAlpha(ledColor.coronaColor, 0.2));
                    fill.addColorStop(0.8, setAlpha(ledColor.coronaColor, 0.1));
                    fill.addColorStop(0.85, setAlpha(ledColor.coronaColor, 0.05));
                    fill.addColorStop(1, setAlpha(ledColor.coronaColor, 0));
                    trendCtx.fillStyle = fill;
                    trendCtx.beginPath();
                    trendCtx.arc(0.5 * width, 0.8 * height, 0.7 * width, 0, TWO_PI, true);
                    trendCtx.closePath();
                    trendCtx.fill();
                }
            };

        // Check if we have already cached this indicator, if not create it
        if (!createTrendIndicator.cache[cacheKey]) {
            // create oversized buffer for the glow
            trendBuffer = createBuffer(width * 2, width * 4);
            trendCtx = trendBuffer.getContext('2d');
            trendCtx.translate(width * 0.5, width * 0.5);
            // Must draw the active section last so the 'glow' is on top
            switch (onSection.state) {
            case 'up':
                drawDownArrow();
                drawEquals();
                drawUpArrow();
                break;
            case 'steady':
                drawDownArrow();
                drawUpArrow();
                drawEquals();
                break;
            case 'down':
            /* falls through */
            default:
                drawUpArrow();
                drawEquals();
                drawDownArrow();
                break;
            }
            // cache the buffer
            createTrendIndicator.cache[cacheKey] = trendBuffer;
        }
        return createTrendIndicator.cache[cacheKey];
    };
    createTrendIndicator.cache = {};

    var drawTitleImage = function (ctx, imageWidth, imageHeight, titleString, unitString, backgroundColor, vertical, radial, altPos, gaugeType) {
        gaugeType = (undefined === gaugeType ? gaugeType = steelseries.GaugeType.TYPE1 : gaugeType);
        ctx.save();
        ctx.textAlign = (radial ? 'center' : 'left');
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor();
        ctx.fillStyle = backgroundColor.labelColor.getRgbaColor();

        if (radial) {
            ctx.font = 0.046728 * imageWidth + 'px ' + stdFontName;
            ctx.fillText(titleString, imageWidth / 2, imageHeight * 0.3, imageWidth * 0.3);
            ctx.fillText(unitString, imageWidth / 2, imageHeight * 0.38, imageWidth * 0.3);
        } else {
            // linear
            if (vertical) {
                ctx.font = 0.1 * imageWidth + 'px ' + stdFontName;
                ctx.save();
                ctx.translate(0.671428 * imageWidth, 0.1375 * imageHeight);
                ctx.rotate(1.570796);
                ctx.fillText(titleString, 0, 0);
                ctx.translate(-0.671428 * imageWidth, -0.1375 * imageHeight);
                ctx.restore();
                ctx.font = 0.071428 * imageWidth + 'px ' + stdFontName;
                if (altPos) {
                    // LCD visible
                    if (gaugeType.type === 'type2') {
                        ctx.textAlign = 'right';
                        ctx.fillText(unitString, 0.36 * imageWidth, imageHeight * 0.79, imageWidth * 0.25);
                    } else {
                        ctx.fillText(unitString, 0.63 * imageWidth, imageHeight * 0.85, imageWidth * 0.2);
                    }
                } else {
                    // LCD hidden
                    ctx.textAlign = 'center';
                    if (gaugeType.type === 'type2') {
                        ctx.fillText(unitString, imageWidth / 2, imageHeight * 0.92, imageWidth * 0.2);
                    } else {
                        ctx.fillText(unitString, imageWidth / 2, imageHeight * 0.89, imageWidth * 0.2);
                    }
                }
            } else { //linear horizontal
                ctx.font = 0.035 * imageWidth + 'px ' + stdFontName;
                ctx.fillText(titleString, imageWidth * 0.15, imageHeight * 0.25, imageWidth * 0.3);
                ctx.font = 0.025 * imageWidth + 'px ' + stdFontName;
                ctx.fillText(unitString, imageWidth * 0.0625, imageHeight * 0.7, imageWidth * 0.07);
            }
        }
        ctx.restore();
    };

    //*****************************************   T E X T U R E S   ****************************************************
    var carbonBuffer = drawToBuffer(12, 12, function (ctx) {
            var imageWidth = ctx.canvas.width,
                imageHeight = ctx.canvas.height,
                offsetX = 0,
                offsetY = 0,
                grad;

            ctx.save();

            // RULB
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, imageWidth * 0.5, imageHeight * 0.5);
            ctx.closePath();
            ctx.restore();

            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.5 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, 'rgb(35, 35, 35)');
            grad.addColorStop(1, 'rgb(23, 23, 23)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RULF
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.083333, 0, imageWidth * 0.333333, imageHeight * 0.416666);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.083333;
            offsetY = 0;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.416666 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, 'rgb(38, 38, 38)');
            grad.addColorStop(1, 'rgb(30, 30, 30)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RLRB
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.5, imageHeight * 0.5, imageWidth * 0.5, imageHeight * 0.5);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.5;
            offsetY = 0.5;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.5 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, 'rgb(35, 35, 35)');
            grad.addColorStop(1, 'rgb(23, 23, 23)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RLRF
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.583333, imageHeight * 0.5, imageWidth * 0.333333, imageHeight * 0.416666);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.583333;
            offsetY = 0.5;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.416666 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, 'rgb(38, 38, 38)');
            grad.addColorStop(1, 'rgb(30, 30, 30)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RURB
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.5, 0, imageWidth * 0.5, imageHeight * 0.5);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.5;
            offsetY = 0;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.5 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, '#303030');
            grad.addColorStop(1, 'rgb(40, 40, 40)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RURF
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.583333, imageHeight * 0.083333, imageWidth * 0.333333, imageHeight * 0.416666);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.583333;
            offsetY = 0.083333;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.416666 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, 'rgb(53, 53, 53)');
            grad.addColorStop(1, 'rgb(45, 45, 45)');
            ctx.fillStyle = grad;
            ctx.fill();

            // RLLB
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, imageHeight * 0.5, imageWidth * 0.5, imageHeight * 0.5);
            ctx.closePath();
            ctx.restore();
            offsetX = 0;
            offsetY = 0.5;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.5 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, '#303030');
            grad.addColorStop(1, '#282828');
            ctx.fillStyle = grad;
            ctx.fill();

            // RLLF
            ctx.save();
            ctx.beginPath();
            ctx.rect(imageWidth * 0.083333, imageHeight * 0.583333, imageWidth * 0.333333, imageHeight * 0.416666);
            ctx.closePath();
            ctx.restore();
            offsetX = 0.083333;
            offsetY = 0.583333;
            grad = ctx.createLinearGradient(0, offsetY * imageHeight, 0, 0.416666 * imageHeight + offsetY * imageHeight);
            grad.addColorStop(0, '#353535');
            grad.addColorStop(1, '#2d2d2d');
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.restore();
        });

    var punchedSheetBuffer = drawToBuffer(15, 15, function (ctx) {
        var imageWidth = ctx.canvas.width,
            imageHeight = ctx.canvas.height,
            grad;

        ctx.save();

        // BACK
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, imageWidth, imageHeight);
        ctx.closePath();
        ctx.restore();
        ctx.fillStyle = '#1D2123';
        ctx.fill();

        // ULB
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, imageHeight * 0.266666);
        ctx.bezierCurveTo(0, imageHeight * 0.4, imageWidth * 0.066666, imageHeight * 0.466666, imageWidth * 0.2, imageHeight * 0.466666);
        ctx.bezierCurveTo(imageWidth * 0.333333, imageHeight * 0.466666, imageWidth * 0.4, imageHeight * 0.4, imageWidth * 0.4, imageHeight * 0.266666);
        ctx.bezierCurveTo(imageWidth * 0.4, imageHeight * 0.133333, imageWidth * 0.333333, imageHeight * 0.066666, imageWidth * 0.2, imageHeight * 0.066666);
        ctx.bezierCurveTo(imageWidth * 0.066666, imageHeight * 0.066666, 0, imageHeight * 0.133333, 0, imageHeight * 0.266666);
        ctx.closePath();
        grad = ctx.createLinearGradient(0, 0.066666 * imageHeight, 0, 0.466666 * imageHeight);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, '#444444');
        ctx.fillStyle = grad;
        ctx.fill();

        // ULF
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, imageHeight * 0.2);
        ctx.bezierCurveTo(0, imageHeight * 0.333333, imageWidth * 0.066666, imageHeight * 0.4, imageWidth * 0.2, imageHeight * 0.4);
        ctx.bezierCurveTo(imageWidth * 0.333333, imageHeight * 0.4, imageWidth * 0.4, imageHeight * 0.333333, imageWidth * 0.4, imageHeight * 0.2);
        ctx.bezierCurveTo(imageWidth * 0.4, imageHeight * 0.066666, imageWidth * 0.333333, 0, imageWidth * 0.2, 0);
        ctx.bezierCurveTo(imageWidth * 0.066666, 0, 0, imageHeight * 0.066666, 0, imageHeight * 0.2);
        ctx.closePath();
        ctx.fillStyle = '#050506';
        ctx.fill();

        // LRB
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(imageWidth * 0.466666, imageHeight * 0.733333);
        ctx.bezierCurveTo(imageWidth * 0.466666, imageHeight * 0.866666, imageWidth * 0.533333, imageHeight * 0.933333, imageWidth * 0.666666, imageHeight * 0.933333);
        ctx.bezierCurveTo(imageWidth * 0.8, imageHeight * 0.933333, imageWidth * 0.866666, imageHeight * 0.866666, imageWidth * 0.866666, imageHeight * 0.733333);
        ctx.bezierCurveTo(imageWidth * 0.866666, imageHeight * 0.6, imageWidth * 0.8, imageHeight * 0.533333, imageWidth * 0.666666, imageHeight * 0.533333);
        ctx.bezierCurveTo(imageWidth * 0.533333, imageHeight * 0.533333, imageWidth * 0.466666, imageHeight * 0.6, imageWidth * 0.466666, imageHeight * 0.733333);
        ctx.closePath();
        grad = ctx.createLinearGradient(0, 0.533333 * imageHeight, 0, 0.933333 * imageHeight);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, '#444444');
        ctx.fillStyle = grad;
        ctx.fill();

        // LRF
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(imageWidth * 0.466666, imageHeight * 0.666666);
        ctx.bezierCurveTo(imageWidth * 0.466666, imageHeight * 0.8, imageWidth * 0.533333, imageHeight * 0.866666, imageWidth * 0.666666, imageHeight * 0.866666);
        ctx.bezierCurveTo(imageWidth * 0.8, imageHeight * 0.866666, imageWidth * 0.866666, imageHeight * 0.8, imageWidth * 0.866666, imageHeight * 0.666666);
        ctx.bezierCurveTo(imageWidth * 0.866666, imageHeight * 0.533333, imageWidth * 0.8, imageHeight * 0.466666, imageWidth * 0.666666, imageHeight * 0.466666);
        ctx.bezierCurveTo(imageWidth * 0.533333, imageHeight * 0.466666, imageWidth * 0.466666, imageHeight * 0.533333, imageWidth * 0.466666, imageHeight * 0.666666);
        ctx.closePath();
        ctx.fillStyle = '#050506';
        ctx.fill();

        ctx.restore();
    });

    var brushedMetalTexture = function (color, radius, amount, monochrome, shine) {

        this.fill = function (startX, startY, endX, endY) {
            var i, x, y,                        // loop counters
                sinArr,
                width, height,
                outCanvas, outCanvasContext,    // output canvas
                inPixels, outPixels,            // pixel arrays
                //alpha = color & 0xff000000;
                alpha = 255,
                red = (color >> 16) & 0xff,
                green = (color >> 8) & 0xff,
                blue = color & 0xff,
                n = 0,
                variation = 255 * amount,
                totR, totG, totB,
                indx, tr, tg, tb, f;

            startX = Math.floor(startX);
            startY = Math.floor(startY);
            endX = Math.ceil(endX);
            endY = Math.ceil(endY);

            width = endX - startX;
            height = endY - startY;

            // Create output canvas
            outCanvas = createBuffer(width, height);
            outCanvasContext = outCanvas.getContext('2d');

            // Create pixel arrays
            inPixels = outCanvasContext.createImageData(width, height);
            outPixels = outCanvasContext.createImageData(width, height);

            // Precreate sin() values
            if (shine !== 0) {
                sinArr = [];
                for (i = 0; i < width; i++) {
                    sinArr[i] = (255 * shine * Math.sin(i / width * PI)) | 0;
                }
            }

            for (y = 0; y < height; y++) {
                // The pixel array is addressed as 4 elements per pixel [r,g,b,a]
                if (radius !== 0) {
                    totR = totG = totB = 0;
                }
                for (x = 0; x < width; x ++) {
                    indx = (y * width * 4) + (x * 4);
                    tr = red;
                    tg = green;
                    tb = blue;
                    if (shine !== 0) {
                        f = sinArr[x];
                        tr += f;
                        tg += f;
                        tb += f;
                    }

                    if (monochrome) {
                        n = ((2 * Math.random() - 1) * variation) | 0;
                        inPixels.data[indx]   = clamp(tr + n);
                        inPixels.data[indx + 1] = clamp(tg + n);
                        inPixels.data[indx + 2] = clamp(tb + n);
                        inPixels.data[indx + 3] = alpha;
                    } else {
                        inPixels.data[indx]   = random(tr, variation);
                        inPixels.data[indx + 1] = random(tg, variation);
                        inPixels.data[indx + 2] = random(tb, variation);
                        inPixels.data[indx + 3] = alpha;
                    }
                }
            }

            if (radius > 0) {
                horizontalBlur(inPixels, outPixels, width, height, radius, alpha);
                outCanvasContext.putImageData(outPixels, startX, startY);
            } else {
                outCanvasContext.putImageData(inPixels, startX, startY);
            }
            return outCanvas;
        };

        function random(x, vari) {
            x += ((2 * Math.random() - 1) * vari) | 0;
            return (x < 0 ? 0 : (x > 255 ? 255 : x));
        }

        function clamp(C) {
            return (C < 0 ? 0 : (C > 255 ? 255 : C));
        }

        function horizontalBlur(inPix, outPix, width, height, radius, alpha) {
            var x, y,       // loop counters
                i, mul, indx,
                totR, totG, totB;

            if (radius >= width) {
                radius = width - 1;
            }
            mul = 1 / (radius * 2 + 1);
            indx = 0;
            for (y = 0; y < height; y++) {
                totR = totG = totB = 0;
                for (x = 0; x < radius ; x++) {
                    i = (indx + x) * 4;
                    totR += inPix.data[i];
                    totG += inPix.data[i + 1];
                    totB += inPix.data[i + 2];
                }
                for (x = 0; x < width; x++) {
                    if (x > radius) {
                        i = (indx - radius - 1) * 4;
                        totR -= inPix.data[i];
                        totG -= inPix.data[i + 1];
                        totB -= inPix.data[i + 2];
                    }
                    if (x + radius < width) {
                        i = (indx + radius) * 4;
                        totR += inPix.data[i];
                        totG += inPix.data[i + 1];
                        totB += inPix.data[i + 2];
                    }
                    i = indx * 4;
                    outPix.data[i] = (totR * mul) | 0;
                    outPix.data[i + 1] = (totG * mul) | 0;
                    outPix.data[i + 2] = (totB * mul) | 0;
                    outPix.data[i + 3] = alpha;
                    indx++;
                }
            }
        }

        return this;
    };

    //********************************************   T O O L S   *******************************************************
    var RgbaColor = function (r, g, b, a) {
        var red, green, blue, alpha;

        if (arguments.length === 1) {
            // hexadecimal input #112233
            b = parseInt(r.substr(5, 2), 16);
            g = parseInt(r.substr(3, 2), 16);
            r = parseInt(r.substr(1, 2), 16);
            a = 1;
        } else if (arguments.length === 3) {
            a = 1;
        }

        function validateColors() {
            red = range(r, 255);
            green = range(g, 255);
            blue = range(b, 255);
            alpha = range(a, 1);
        }

        validateColors();

        this.getRed = function () {
            return red;
        };

        this.setRed = function (r) {
            red = range(r, 255);
        };

        this.getGreen = function () {
            return green;
        };

        this.setGreen = function (g) {
            green = range(g, 255);
        };

        this.getBlue = function () {
            return blue;
        };

        this.setBlue = function (b) {
            blue = range(b, 255);
        };

        this.getAlpha = function () {
            return alpha;
        };

        this.setAlpha = function (a) {
            alpha = range(a, 1);
        };

        this.getRgbaColor = function () {
            return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
        };

        this.getRgbColor = function () {
            return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
        };

        this.getHexColor = function () {
            return '#' + red.toString(16) + green.toString(16) + blue.toString(16);
        };
    };

    var ConicalGradient = function (fractions, colors) {
        var limit = fractions.length - 1,
            i;

        // Pre-multipy fractions array into range -PI to PI
        for (i = 0; i <= limit; i++) {
            fractions[i] = TWO_PI * fractions[i] - PI;
        }

        this.fillCircle = function (ctx, centerX, centerY, innerX, outerX) {
            var angle,
                radius = Math.ceil(outerX),
                diameter = radius * 2,
                pixels, alpha,
                x, y, dx, dy, dy2, distance,
                indx, pixColor,
                buffer, bufferCtx;

            // Create pixel array
            pixels = ctx.createImageData(diameter, diameter);
            alpha = 255;

            for (y = 0; y < diameter; y++) {
                dy = radius - y;
                dy2 = dy * dy;
                for (x = 0; x < diameter; x++) {
                    dx = x - radius;
                    distance = Math.sqrt((dx * dx) + dy2);
                    if (distance <= radius && distance >= innerX) { // pixels are transparent by default, so only paint the ones we need
                        angle = Math.atan2(dx, dy);
                        for (i = 0; i < limit; i++) {
                            if (angle >= fractions[i] && angle < fractions[i + 1]) {
                                pixColor = getColorFromFraction(colors[i], colors[i + 1], fractions[i + 1] - fractions[i], angle - fractions[i], true);
                            }
                        }
                        // The pixel array is addressed as 4 elements per pixel [r,g,b,a]
                        indx = ((diameter - y) * diameter * 4) + (x * 4);  // plot is 180 rotated from orginal method, so apply a simple invert (diameter - y)
                        pixels.data[indx]     = pixColor[0];
                        pixels.data[indx + 1] = pixColor[1];
                        pixels.data[indx + 2] = pixColor[2];
                        pixels.data[indx + 3] = alpha;
                    }
                }
            }

            // Create a new buffer to apply the raw data so we can rotate it
            buffer = createBuffer(diameter, diameter);
            bufferCtx = buffer.getContext('2d');
            bufferCtx.putImageData(pixels, 0, 0);
            // Apply the image buffer
            ctx.drawImage(buffer, centerX - radius, centerY - radius);
        };

        this.fillRect = function (ctx, centerX, centerY, width, height, thicknessX, thicknessY) {
            var angle,
                width2,
                height2,
                pixels, alpha,
                x, y, dx, dy,
                indx,
                pixColor,
                buffer, bufferCtx;

            width = Math.ceil(width);
            height = Math.ceil(height);
            width2 = width / 2;
            height2 = height / 2;
            thicknessX = Math.ceil(thicknessX);
            thicknessY = Math.ceil(thicknessY);

            // Create pixel array
            pixels = ctx.createImageData(width, height);
            alpha = 255;

            for (y = 0; y < height; y++) {
                dy = height2 - y;
                for (x = 0; x < width; x++) {
                    if (y > thicknessY && y <= height - thicknessY) {
                        // we are in the range where we only draw the sides
                        if (x > thicknessX && x < width - thicknessX) {
                            // we are in the empty 'middle', jump to the next edge
                            x = width - thicknessX;
                        }
                    }
                    dx = x - width2;
                    angle = Math.atan2(dx, dy);
                    for (i = 0; i < limit; i++) {
                        if (angle >= fractions[i] && angle < fractions[i + 1]) {
                            pixColor = getColorFromFraction(colors[i], colors[i + 1], fractions[i + 1] - fractions[i], angle - fractions[i], true);
                        }
                    }
                    // The pixel array is addressed as 4 elements per pixel [r,g,b,a]
                    indx = ((height - y) * width * 4) + (x * 4); // plot is 180 rotated from orginal method, so apply a simple invert (height - y)
                    pixels.data[indx]     = pixColor[0];
                    pixels.data[indx + 1] = pixColor[0];
                    pixels.data[indx + 2] = pixColor[0];
                    pixels.data[indx + 3] = alpha;
                }
            }
            // Create a new buffer to apply the raw data so we can clip it when drawing to canvas
            buffer = createBuffer(width, height);
            bufferCtx = buffer.getContext('2d');
            bufferCtx.putImageData(pixels, 0, 0);

            // draw the buffer back to the canvas
            ctx.drawImage(buffer, centerX - width2, centerY - height2);
        };

    };

    var GradientWrapper = function (start, end, fractions, colors) {

        this.getColorAt = function (fraction) {
            var lowerLimit = 0,
                lowerIndex = 0,
                upperLimit = 1,
                upperIndex = 1,
                i,
                interpolationFraction;

            fraction = (fraction < 0 ? 0 : (fraction > 1 ? 1 : fraction));

            for (i = 0; i < fractions.length; i++) {
                if (fractions[i] < fraction && lowerLimit < fractions[i]) {
                    lowerLimit = fractions[i];
                    lowerIndex = i;
                }
                if (fractions[i] === fraction) {
                    return colors[i];
                }
                if (fractions[i] > fraction && upperLimit >= fractions[i]) {
                    upperLimit = fractions[i];
                    upperIndex = i;
                }
            }
            interpolationFraction = (fraction - lowerLimit) / (upperLimit - lowerLimit);
            return getColorFromFraction(colors[lowerIndex], colors[upperIndex], 1, interpolationFraction);
        };

        this.getStart = function () {
            return start;
        };

        this.getEnd = function () {
            return end;
        };
    };

    function setAlpha(hex, alpha) {
        var hexColor = ('#' === hex.charAt(0)) ? hex.substring(1, 7) : hex,
            red = parseInt((hexColor).substring(0, 2), 16),
            green = parseInt((hexColor).substring(2, 4), 16),
            blue = parseInt((hexColor).substring(4, 6), 16),
            color = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';

        return color;
    }

    function getColorFromFraction(sourceColor, destinationColor, range, fraction, returnRawData) {
        var INT_TO_FLOAT = 1 / 255,
            sourceRed = sourceColor.getRed(),
            sourceGreen = sourceColor.getGreen(),
            sourceBlue = sourceColor.getBlue(),
            sourceAlpha = sourceColor.getAlpha(),

            deltaRed = destinationColor.getRed() - sourceRed,
            deltaGreen = destinationColor.getGreen() - sourceGreen,
            deltaBlue = destinationColor.getBlue() - sourceBlue,
            deltaAlpha = destinationColor.getAlpha() * INT_TO_FLOAT - sourceAlpha * INT_TO_FLOAT,

            fractionRed = deltaRed / range * fraction,
            fractionGreen = deltaGreen / range * fraction,
            fractionBlue = deltaBlue / range * fraction,
            fractionAlpha = deltaAlpha / range * fraction;

        returnRawData = returnRawData || false;
        if (returnRawData) {
            return [(sourceRed + fractionRed).toFixed(0), (sourceGreen + fractionGreen).toFixed(0), (sourceBlue + fractionBlue).toFixed(0), sourceAlpha + fractionAlpha];
        } else {
            return new RgbaColor((sourceRed + fractionRed).toFixed(0), (sourceGreen + fractionGreen).toFixed(0), (sourceBlue + fractionBlue).toFixed(0), sourceAlpha + fractionAlpha);
        }
    }

    function section(start, stop, color) {
        return {start : start,
                stop : stop,
                color : color};
    }

    Math.log10 = function (value) {
        return (Math.log(value) / Math.LN10);
    };

    function calcNiceNumber(range, round) {
        var exponent = Math.floor(Math.log10(range)),   // exponent of range
            fraction = range / Math.pow(10, exponent),  // fractional part of range
            niceFraction;                               // nice, rounded fraction

        if (round) {
            if (1.5 > fraction) {
                niceFraction = 1;
            } else if (3 > fraction) {
                niceFraction = 2;
            } else if (7 > fraction) {
                niceFraction = 5;
            } else {
                niceFraction = 10;
            }
        } else {
            if (1 >= fraction) {
                niceFraction = 1;
            } else if (2 >= fraction) {
                niceFraction = 2;
            } else if (5 >= fraction) {
                niceFraction = 5;
            } else {
                niceFraction = 10;
            }
        }
        return niceFraction * Math.pow(10, exponent);
    }

    function roundedRectangle(ctx, x, y, w, h, radius) {
        var r = x + w,
            b = y + h;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(r - radius, y);
        ctx.quadraticCurveTo(r, y, r, y + radius);
        ctx.lineTo(r, y + h - radius);
        ctx.quadraticCurveTo(r, b, r - radius, b);
        ctx.lineTo(x + radius, b);
        ctx.quadraticCurveTo(x, b, x, b - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
//        ctx.stroke();
    }

    function createBuffer(width, height) {
        var buffer = doc.createElement('canvas');
        buffer.width = width;
        buffer.height = height;
        return buffer;
    }

    function drawToBuffer(width, height, drawFunction) {
        var buffer = doc.createElement('canvas');
        buffer.width = width;
        buffer.height = height;
        drawFunction(buffer.getContext('2d'));
        return buffer;
    }

    function range(value, limit) {
        return (value < 0 ? 0 : (value > limit ? limit : value));
    }

      function wrap(value, lower, upper) {
        var distance, times;
        if (upper <= lower) {
            throw 'Rotary bounds are of negative or zero size';
        }

        distance = upper - lower;
        times = Math.floor((value - lower) / distance);

        return value - (times * distance);
    }

    function getShortestAngle(from, to) {
        return wrap((to - from), -180, 180);
    }

    // shim layer
    var requestAnimFrame = (function () {
        return  window.requestAnimationFrame   ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (callback) {
                window.setTimeout(callback, 1000 / 16);
            };
    }());

    function getCanvasContext(elementOrId) {
        var element = (typeof elementOrId === 'string' || elementOrId instanceof String) ?
            doc.getElementById(elementOrId) : elementOrId;
        return element.getContext('2d');
    }

    //****************************************   C O N S T A N T S   ***************************************************
    var BackgroundColorDef;
    (function () {
        BackgroundColorDef = function (gradientStart, gradientFraction, gradientStop, labelColor, symbolColor, name) {
            this.gradientStart = gradientStart;
            this.gradientFraction = gradientFraction;
            this.gradientStop = gradientStop;
            this.labelColor = labelColor;
            this.symbolColor = symbolColor;
            this.name = name;
        };
    }());

    var LcdColorDef;
    (function () {
        LcdColorDef = function (gradientStartColor, gradientFraction1Color, gradientFraction2Color, gradientFraction3Color, gradientStopColor, textColor) {
            this.gradientStartColor = gradientStartColor;
            this.gradientFraction1Color = gradientFraction1Color;
            this.gradientFraction2Color = gradientFraction2Color;
            this.gradientFraction3Color = gradientFraction3Color;
            this.gradientStopColor = gradientStopColor;
            this.textColor = textColor;
        };
    }());

    var ColorDef;
    (function () {
        ColorDef = function (veryDark, dark, medium, light, lighter, veryLight) {
            this.veryDark = veryDark;
            this.dark = dark;
            this.medium = medium;
            this.light = light;
            this.lighter = lighter;
            this.veryLight = veryLight;
        };
    }());

    var LedColorDef;
    (function () {
        LedColorDef = function (innerColor1_ON, innerColor2_ON, outerColor_ON, coronaColor, innerColor1_OFF, innerColor2_OFF, outerColor_OFF) {
            this.innerColor1_ON = innerColor1_ON;
            this.innerColor2_ON = innerColor2_ON;
            this.outerColor_ON = outerColor_ON;
            this.coronaColor = coronaColor;
            this.innerColor1_OFF = innerColor1_OFF;
            this.innerColor2_OFF = innerColor2_OFF;
            this.outerColor_OFF = outerColor_OFF;
        };
    }());

    var GaugeTypeDef;
    (function () {
        GaugeTypeDef = function (type) {
            this.type = type;
        };
    }());

    var OrientationDef;
    (function () {
        OrientationDef = function (type) {
            this.type = type;
        };
    }());

    var KnobTypeDef;
    (function () {
        KnobTypeDef = function (type) {
            this.type = type;
        };
    }());

    var KnobStyleDef;
    (function () {
        KnobStyleDef = function (style) {
            this.style = style;
        };
    }());

    var FrameDesignDef;
    (function () {
        FrameDesignDef = function (design) {
            this.design = design;
        };
    }());

    var PointerTypeDef;
    (function () {
        PointerTypeDef = function (type) {
            this.type = type;
        };
    }());

    var ForegroundTypeDef;
    (function () {
        ForegroundTypeDef = function (type) {
            this.type = type;
        };
    }());

    var LabelNumberFormatDef;
    (function () {
        LabelNumberFormatDef = function (format) {
            this.format = format;
        };
    }());

    var TickLabelOrientationDef;
    (function () {
        TickLabelOrientationDef = function (type) {
            this.type = type;
        };
    }());

    var TrendStateDef;
    (function () {
        TrendStateDef = function (state) {
            this.state = state;
        };
    }());

    //*************************   I m p l e m e n t a t i o n s   o f   d e f i n i t i o n s   ************************
    var backgroundColor = {
        DARK_GRAY: new BackgroundColorDef(new RgbaColor(0, 0, 0, 1), new RgbaColor(51, 51, 51, 1), new RgbaColor(153, 153, 153, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(180, 180, 180, 1), 'DARK_GRAY'),
        SATIN_GRAY: new BackgroundColorDef(new RgbaColor(45, 57, 57, 1), new RgbaColor(45, 57, 57, 1), new RgbaColor(45, 57, 57, 1), new RgbaColor(167, 184, 180, 1), new RgbaColor(137, 154, 150, 1), 'SATIN_GRAY'),
        LIGHT_GRAY: new BackgroundColorDef(new RgbaColor(130, 130, 130, 1), new RgbaColor(181, 181, 181, 1), new RgbaColor(253, 253, 253, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'LIGHT_GRAY'),
        WHITE: new BackgroundColorDef(new RgbaColor(255, 255, 255, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'WHITE'),
        BLACK: new BackgroundColorDef(new RgbaColor(0, 0, 0, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(150, 150, 150, 1), 'BLACK'),
        BEIGE: new BackgroundColorDef(new RgbaColor(178, 172, 150, 1), new RgbaColor(204, 205, 184, 1), new RgbaColor(231, 231, 214, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'BEIGE'),
        BROWN: new BackgroundColorDef(new RgbaColor(245, 225, 193, 1), new RgbaColor(245, 225, 193, 1), new RgbaColor(255, 250, 240, 1), new RgbaColor(109, 73, 47, 1), new RgbaColor(89, 53, 27, 1), 'BROWN'),
        RED: new BackgroundColorDef(new RgbaColor(198, 93, 95, 1), new RgbaColor(212, 132, 134, 1), new RgbaColor(242, 218, 218, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(90, 0, 0, 1), 'RED'),
        GREEN: new BackgroundColorDef(new RgbaColor(65, 120, 40, 1), new RgbaColor(129, 171, 95, 1), new RgbaColor(218, 237, 202, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(0, 90, 0, 1), 'GREEN'),
        BLUE: new BackgroundColorDef(new RgbaColor(45, 83, 122, 1), new RgbaColor(115, 144, 170, 1), new RgbaColor(227, 234, 238, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(0, 0, 90, 1), 'BLUE'),
        ANTHRACITE: new BackgroundColorDef(new RgbaColor(50, 50, 54, 1), new RgbaColor(47, 47, 51, 1), new RgbaColor(69, 69, 74, 1), new RgbaColor(250, 250, 250, 1), new RgbaColor(180, 180, 180, 1), 'ANTHRACITE'),
        MUD: new BackgroundColorDef(new RgbaColor(80, 86, 82, 1), new RgbaColor(70, 76, 72, 1), new RgbaColor(57, 62, 58, 1), new RgbaColor(255, 255, 240, 1), new RgbaColor(225, 225, 210, 1), 'MUD'),
        PUNCHED_SHEET: new BackgroundColorDef(new RgbaColor(50, 50, 54, 1), new RgbaColor(47, 47, 51, 1), new RgbaColor(69, 69, 74, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(180, 180, 180, 1), 'PUNCHED_SHEET'),
        CARBON: new BackgroundColorDef(new RgbaColor(50, 50, 54, 1), new RgbaColor(47, 47, 51, 1), new RgbaColor(69, 69, 74, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(180, 180, 180, 1), 'CARBON'),
        STAINLESS: new BackgroundColorDef(new RgbaColor(130, 130, 130, 1), new RgbaColor(181, 181, 181, 1), new RgbaColor(253, 253, 253, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'STAINLESS'),
        BRUSHED_METAL: new BackgroundColorDef(new RgbaColor(50, 50, 54, 1), new RgbaColor(47, 47, 51, 1), new RgbaColor(69, 69, 74, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'BRUSHED_METAL'),
        BRUSHED_STAINLESS: new BackgroundColorDef(new RgbaColor(50, 50, 54, 1), new RgbaColor(47, 47, 51, 1), new RgbaColor(110, 110, 112, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'BRUSHED_STAINLESS'),
        TURNED: new BackgroundColorDef(new RgbaColor(130, 130, 130, 1), new RgbaColor(181, 181, 181, 1), new RgbaColor(253, 253, 253, 1), new RgbaColor(0, 0, 0, 1), new RgbaColor(80, 80, 80, 1), 'TURNED')
    };

    var lcdColor = {
        BEIGE: new LcdColorDef('#c8c8b1', 'rgb(241, 237, 207)', 'rgb(234, 230, 194)', 'rgb(225, 220, 183)', 'rgb(237, 232, 191)', '#000000'),
        BLUE: new LcdColorDef('#ffffff', 'rgb(231, 246, 255)', 'rgb(170, 224, 255)', 'rgb(136, 212, 255)', 'rgb(192, 232, 255)', '#124564'),
        ORANGE: new LcdColorDef('#ffffff', 'rgb(255, 245, 225)', 'rgb(255, 217, 147)', 'rgb(255, 201, 104)', 'rgb(255, 227, 173)', '#503700'),
        RED: new LcdColorDef('#ffffff', 'rgb(255, 225, 225)', 'rgb(253, 152, 152)', 'rgb(252, 114, 115)', 'rgb(254, 178, 178)', '#4f0c0e'),
        YELLOW: new LcdColorDef('#ffffff', 'rgb(245, 255, 186)', 'rgb(210, 255, 0)', 'rgb(158, 205, 0)', 'rgb(210, 255, 0)', '#405300'),
        WHITE: new LcdColorDef('#ffffff', '#ffffff', 'rgb(241, 246, 242)', 'rgb(229, 239, 244)', '#ffffff', '#000000'),
        GRAY: new LcdColorDef('#414141', 'rgb(117, 117, 117)', 'rgb(87, 87, 87)', '#414141', 'rgb(81, 81, 81)', '#ffffff'),
        BLACK: new LcdColorDef('#414141', '#666666', '#333333', '#000000', '#333333', '#cccccc'),
        GREEN: new LcdColorDef('rgb(33, 67, 67)', 'rgb(33, 67, 67)', 'rgb(29, 58, 58)', 'rgb(28, 57, 57)', 'rgb(23, 46, 46)', 'rgba(0, 185, 165, 255)'),
        BLUE2: new LcdColorDef('rgb(0, 68, 103)', 'rgb(8, 109, 165)', 'rgb(0, 72, 117)', 'rgb(0, 72, 117)', 'rgb(0, 68, 103)', 'rgb(111, 182, 228)'),
        BLUE_BLACK: new LcdColorDef('rgb(22, 125, 212)', 'rgb(3, 162, 254)', 'rgb(3, 162, 254)', 'rgb(3, 162, 254)', 'rgb(11, 172, 244)', '#000000'),
        BLUE_DARKBLUE: new LcdColorDef('rgb(18, 33, 88)', 'rgb(18, 33, 88)', 'rgb(19, 30, 90)', 'rgb(17, 31, 94)', 'rgb(21, 25, 90)', 'rgb(23, 99, 221)'),
        BLUE_GRAY: new LcdColorDef('rgb(135, 174, 255)', 'rgb(101, 159, 255)', 'rgb(44, 93, 255)', 'rgb(27, 65, 254)', 'rgb(12, 50, 255)', '#b2b4ed'),
        STANDARD: new LcdColorDef('rgb(131, 133, 119)', 'rgb(176, 183, 167)', 'rgb(165, 174, 153)', 'rgb(166, 175, 156)', 'rgb(175, 184, 165)', 'rgb(35, 42, 52)'),
        STANDARD_GREEN: new LcdColorDef('#ffffff', 'rgb(219, 230, 220)', 'rgb(179, 194, 178)', 'rgb(153, 176, 151)', 'rgb(114, 138, 109)', '#080C06'),
        BLUE_BLUE: new LcdColorDef('rgb(100, 168, 253)', 'rgb(100, 168, 253)', 'rgb(95, 160, 250)', 'rgb(80, 144, 252)', 'rgb(74, 134, 255)', '#002cbb'),
        RED_DARKRED: new LcdColorDef('rgb(72, 36, 50)', 'rgb(185, 111, 110)', 'rgb(148, 66, 72)', 'rgb(83, 19, 20)', 'rgb(7, 6, 14)', '#FE8B92'),
        DARKBLUE: new LcdColorDef('rgb(14, 24, 31)', 'rgb(46, 105, 144)', 'rgb(19, 64, 96)', 'rgb(6, 20, 29)', 'rgb(8, 9, 10)', '#3DB3FF'),
        LILA: new LcdColorDef('rgb(175, 164, 255)', 'rgb(188, 168, 253)', 'rgb(176, 159, 255)', 'rgb(174, 147, 252)', 'rgb(168, 136, 233)', '#076148'),
        BLACKRED: new LcdColorDef('rgb(8, 12, 11)', 'rgb(10, 11, 13)', 'rgb(11, 10, 15)', 'rgb(7, 13, 9)', 'rgb(9, 13, 14)', '#B50026'),
        DARKGREEN: new LcdColorDef('rgb(25, 85, 0)', 'rgb(47, 154, 0)', 'rgb(30, 101, 0)', 'rgb(30, 101, 0)', 'rgb(25, 85, 0)', '#233123'),
        AMBER: new LcdColorDef('rgb(182, 71, 0)', 'rgb(236, 155, 25)', 'rgb(212, 93, 5)', 'rgb(212, 93, 5)', 'rgb(182, 71, 0)', '#593A0A'),
        LIGHTBLUE: new LcdColorDef('rgb(125, 146, 184)', 'rgb(197, 212, 231)', 'rgb(138, 155, 194)', 'rgb(138, 155, 194)', 'rgb(125, 146, 184)', '#090051'),
        SECTIONS: new LcdColorDef('#b2b2b2', '#ffffff', '#c4c4c4', '#c4c4c4', '#b2b2b2', '#000000')
    };

    var color = {
        RED: new ColorDef(new RgbaColor(82, 0, 0, 1), new RgbaColor(158, 0, 19, 1), new RgbaColor(213, 0, 25, 1), new RgbaColor(240, 82, 88, 1), new RgbaColor(255, 171, 173, 1), new RgbaColor(255, 217, 218, 1)),
        GREEN: new ColorDef(new RgbaColor(8, 54, 4, 1), new RgbaColor(0, 107, 14, 1), new RgbaColor(15, 148, 0, 1), new RgbaColor(121, 186, 37, 1), new RgbaColor(190, 231, 141, 1), new RgbaColor(234, 247, 218, 1)),
        BLUE: new ColorDef(new RgbaColor(0, 11, 68, 1), new RgbaColor(0, 73, 135, 1), new RgbaColor(0, 108, 201, 1), new RgbaColor(0, 141, 242, 1), new RgbaColor(122, 200, 255, 1), new RgbaColor(204, 236, 255, 1)),
        ORANGE: new ColorDef(new RgbaColor(118, 83, 30, 1), new RgbaColor(215, 67, 0, 1), new RgbaColor(240, 117, 0, 1), new RgbaColor(255, 166, 0, 1), new RgbaColor(255, 255, 128, 1), new RgbaColor(255, 247, 194, 1)),
        YELLOW: new ColorDef(new RgbaColor(41, 41, 0, 1), new RgbaColor(102, 102, 0, 1), new RgbaColor(177, 165, 0, 1), new RgbaColor(255, 242, 0, 1), new RgbaColor(255, 250, 153, 1), new RgbaColor(255, 252, 204, 1)),
        CYAN: new ColorDef(new RgbaColor(15, 109, 109, 1), new RgbaColor(0, 109, 144, 1), new RgbaColor(0, 144, 191, 1), new RgbaColor(0, 174, 239, 1), new RgbaColor(153, 223, 249, 1), new RgbaColor(204, 239, 252, 1)),
        MAGENTA: new ColorDef(new RgbaColor(98, 0, 114, 1), new RgbaColor(128, 24, 72, 1), new RgbaColor(191, 36, 107, 1), new RgbaColor(255, 48, 143, 1), new RgbaColor(255, 172, 210, 1), new RgbaColor(255, 214, 23, 1)),
        WHITE: new ColorDef(new RgbaColor(210, 210, 210, 1), new RgbaColor(220, 220, 220, 1), new RgbaColor(235, 235, 235, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(255, 255, 255, 1), new RgbaColor(255, 255, 255, 1)),
        GRAY: new ColorDef(new RgbaColor(25, 25, 25, 1), new RgbaColor(51, 51, 51, 1), new RgbaColor(76, 76, 76, 1), new RgbaColor(128, 128, 128, 1), new RgbaColor(204, 204, 204, 1), new RgbaColor(243, 243, 243, 1)),
        BLACK: new ColorDef(new RgbaColor(0, 0, 0, 1), new RgbaColor(5, 5, 5, 1), new RgbaColor(10, 10, 10, 1), new RgbaColor(15, 15, 15, 1), new RgbaColor(20, 20, 20, 1), new RgbaColor(25, 25, 25, 1)),
        RAITH: new ColorDef(new RgbaColor(0, 32, 65, 1), new RgbaColor(0, 65, 125, 1), new RgbaColor(0, 106, 172, 1), new RgbaColor(130, 180, 214, 1), new RgbaColor(148, 203, 242, 1), new RgbaColor(191, 229, 255, 1)),
        GREEN_LCD: new ColorDef(new RgbaColor(0, 55, 45, 1), new RgbaColor(15, 109, 93, 1), new RgbaColor(0, 185, 165, 1), new RgbaColor(48, 255, 204, 1), new RgbaColor(153, 255, 227, 1), new RgbaColor(204, 255, 241, 1)),
        JUG_GREEN: new ColorDef(new RgbaColor(0, 56, 0, 1), new RgbaColor(32, 69, 36, 1), new RgbaColor(50, 161, 0, 1), new RgbaColor(129, 206, 0, 1), new RgbaColor(190, 231, 141, 1), new RgbaColor(234, 247, 218, 1))
    };

    var ledColor = {
        RED_LED: new LedColorDef('#FF9A89', '#FF9A89', '#FF3300', '#FF8D70', '#7E1C00', '#7E1C00', '#641B00'),
        GREEN_LED: new LedColorDef('#9AFF89', '#9AFF89', '#59FF2A', '#A5FF00', '#1C7E00', '#1C7E00', '#1B6400'),
        BLUE_LED: new LedColorDef('#899AFF', '#899AFF', '#0033FF', '#708DFF', '#001C7E', '#001C7E', '#001B64'),
        ORANGE_LED: new LedColorDef('#FEA23F', '#FEA23F', '#FD6C00', '#FD6C00', '#592800', '#592800', '#421F00'),
        YELLOW_LED: new LedColorDef('#FFFF62', '#FFFF62', '#FFFF00', '#FFFF00', '#6B6D00', '#6B6D00', '#515300'),
        CYAN_LED: new LedColorDef('#00FFFF', '#00FFFF', '#1BC3C3', '#00FFFF', '#083B3B', '#083B3B', '#052727'),
        MAGENTA_LED: new LedColorDef('#D300FF', '#D300FF', '#8600CB', '#C300FF', '#38004B', '#38004B', '#280035')
    };

    var gaugeType = {
        TYPE1: new GaugeTypeDef('type1'),
        TYPE2: new GaugeTypeDef('type2'),
        TYPE3: new GaugeTypeDef('type3'),
        TYPE4: new GaugeTypeDef('type4'),
        TYPE5: new GaugeTypeDef('type5')
    };

    var orientation = {
        NORTH: new OrientationDef('north'),
        SOUTH: new OrientationDef('south'),
        EAST: new OrientationDef('east'),
        WEST: new OrientationDef('west')
    };

    var knobType = {
        STANDARD_KNOB: new KnobTypeDef('standardKnob'),
        METAL_KNOB: new KnobTypeDef('metalKnob')
    };

    var knobStyle = {
        BLACK: new KnobStyleDef('black'),
        BRASS: new KnobStyleDef('brass'),
        SILVER: new KnobStyleDef('silver')
    };

    var frameDesign = {
        BLACK_METAL: new FrameDesignDef('blackMetal'),
        METAL: new FrameDesignDef('metal'),
        SHINY_METAL: new FrameDesignDef('shinyMetal'),
        BRASS: new FrameDesignDef('brass'),
        STEEL: new FrameDesignDef('steel'),
        CHROME: new FrameDesignDef('chrome'),
        GOLD: new FrameDesignDef('gold'),
        ANTHRACITE: new FrameDesignDef('anthracite'),
        TILTED_GRAY: new FrameDesignDef('tiltedGray'),
        TILTED_BLACK: new FrameDesignDef('tiltedBlack'),
        GLOSSY_METAL: new FrameDesignDef('glossyMetal')
    };

    var pointerType = {
        TYPE1: new PointerTypeDef('type1'),
        TYPE2: new PointerTypeDef('type2'),
        TYPE3: new PointerTypeDef('type3'),
        TYPE4: new PointerTypeDef('type4'),
        TYPE5: new PointerTypeDef('type5'),
        TYPE6: new PointerTypeDef('type6'),
        TYPE7: new PointerTypeDef('type7'),
        TYPE8: new PointerTypeDef('type8'),
        TYPE9: new PointerTypeDef('type9'),
        TYPE10: new PointerTypeDef('type10'),
        TYPE11: new PointerTypeDef('type11'),
        TYPE12: new PointerTypeDef('type12'),
        TYPE13: new PointerTypeDef('type13'),
        TYPE14: new PointerTypeDef('type14'),
        TYPE15: new PointerTypeDef('type15'),
        TYPE16: new PointerTypeDef('type16')
    };

    var foregroundType = {
        TYPE1: new ForegroundTypeDef('type1'),
        TYPE2: new ForegroundTypeDef('type2'),
        TYPE3: new ForegroundTypeDef('type3'),
        TYPE4: new ForegroundTypeDef('type4'),
        TYPE5: new ForegroundTypeDef('type5')
    };

    var labelNumberFormat = {
        STANDARD: new LabelNumberFormatDef('standard'),
        FRACTIONAL: new LabelNumberFormatDef('fractional'),
        SCIENTIFIC: new LabelNumberFormatDef('scientific')
    };

    var tickLabelOrientation = {
        NORMAL: new TickLabelOrientationDef('normal'),
        HORIZONTAL: new TickLabelOrientationDef('horizontal'),
        TANGENT: new TickLabelOrientationDef('tangent')
    };

    var trendState = {
        UP: new TrendStateDef('up'),
        STEADY: new TrendStateDef('steady'),
        DOWN: new TrendStateDef('down'),
        OFF: new TrendStateDef('off')
    };

    //**********************************   E X P O R T   F U N C T I O N S   *******************************************
    return {
        // Components EXTERNAL : INTERNAL
        Radial : radial,

        // Images
        drawFrame : drawRadialFrameImage,
        drawBackground : drawRadialBackgroundImage,
        drawForeground : drawRadialForegroundImage,

        // Tools
        rgbaColor :  RgbaColor,
        ConicalGradient : ConicalGradient,
        setAlpha : setAlpha,
        getColorFromFraction : getColorFromFraction,
        gradientWrapper : GradientWrapper,

        // Constants
        BackgroundColor : backgroundColor,
        LcdColor : lcdColor,
        ColorDef : color,
        LedColor : ledColor,
        GaugeType : gaugeType,
        Orientation: orientation,
        FrameDesign : frameDesign,
        PointerType : pointerType,
        ForegroundType : foregroundType,
        KnobType : knobType,
        KnobStyle: knobStyle,
        LabelNumberFormat: labelNumberFormat,
        TickLabelOrientation: tickLabelOrientation,
        TrendState: trendState,

        // Other
        Section : section
    };
}());
