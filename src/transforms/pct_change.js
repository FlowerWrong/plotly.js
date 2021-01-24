/**
* Copyright 2012-2021, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var Axes = require('../plots/cartesian/axes');
var pointsAccessorFunction = require('./helpers').pointsAccessorFunction;

exports.moduleType = 'transform';

exports.name = 'pct_change';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        role: 'info',
        editType: 'calc',
        description: [
            'Determines whether this pct_change transform is enabled or disabled.'
        ].join(' ')
    },
    target: {
        valType: 'string',
        strict: true,
        noBlank: true,
        arrayOk: true,
        dflt: 'x',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the target by which the pct_change transform is applied.',

            'If a string, *target* is assumed to be a reference to a data array',
            'in the parent trace object.',
            'To pct_change about nested variables, use *.* to access them.',
            'For example, set `target` to *marker.size* to pct_change',
            'about the marker size array.',

            'If an array, *target* is then the data array by which',
            'the pct_change transform is applied.'
        ].join(' ')
    },
    calcType: {
        valType: 'string',
        strict: true,
        noBlank: true,
        arrayOk: true,
        dflt: 'first',
        role: 'info',
        editType: 'calc',
        description: [
            'first or prev'
        ].join(' ')
    },
    editType: 'calc'
};

exports.supplyDefaults = function(transformIn) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(enabled) {
        coerce('target');
        coerce('calcType');
    }

    return transformOut;
};

exports.calcTransform = function(gd, trace, opts) {
    if(!opts.enabled) return;

    var targetArray = Lib.getTargetArray(trace, opts);
    if(!targetArray) return;

    var target = opts.target;
    var calcType = opts.calcType;

    var len = targetArray.length;
    if(trace._length) len = Math.min(len, trace._length);

    var d2c = Axes.getDataToCoordFunc(gd, trace, target, targetArray);
    var indices = getIndices(opts, targetArray, d2c, len);
    var originalPointsAccessor = pointsAccessorFunction(trace.transforms, opts);
    var indexToPoints = {};
    var j, tmpIndex;

    var np = Lib.nestedProperty(trace, target);
    var arrayOld = np.get();
    var arrayNew = new Array(len);
    arrayNew[0] = 0;
    for(j = 1; j < len; j++) {
        tmpIndex = 0;
        switch(calcType) {
            case 'first':
                tmpIndex = 0;
                break;
            case 'prev':
                tmpIndex = j - 1;
                break;
        }
        arrayNew[j] = (arrayOld[j] - arrayOld[tmpIndex]) / arrayOld[j];
    }
    np.set(arrayNew);

    for(j = 0; j < len; j++) {
        indexToPoints[j] = originalPointsAccessor(indices[j]);
    }

    opts._indexToPoints = indexToPoints;
    trace._length = len;
};

function getIndices(opts, targetArray, d2c, len) {
    var pctArray = new Array(len);
    var indices = new Array(len);
    var i;

    for(i = 0; i < len; i++) {
        pctArray[i] = {v: targetArray[i], i: i};
    }

    for(i = 0; i < len; i++) {
        indices[i] = pctArray[i].i;
    }

    return indices;
}
