const base = require("../src/base");
const Tag = require("../src/tag");
const UID = require("../src/uid");
const dictionary = require("../src/dictionary");
const parts = require("../src/parts");
const parsing = require("../src/parsing");

const self = module.exports = {
    preamble: base.concat(Buffer.from(new Array(128).fill(0)), Buffer.from("DICM")),

    element: function(tag, value, bigEndian, explicitVR) {
        bigEndian = bigEndian === undefined ? false : bigEndian;
        explicitVR = explicitVR === undefined ? true : explicitVR;
        let valueBytes = Buffer.from(value);
        let headerBytes = new parts.HeaderPart(tag, dictionary.vrOf(tag), valueBytes.length, parsing.isFileMetaInformation(tag), bigEndian, explicitVR).bytes;
        return base.concat(headerBytes, valueBytes);
    },

    fmiGroupLength: function(...fmis) {
        return self.element(Tag.FileMetaInformationGroupLength, base.intToBytesLE(fmis.map(fmi => fmi.length).reduce((p, c) => p + c)), false, true);
    },

    transferSyntaxUID: function(uid, bigEndian, explicitVR) {
        uid = uid || UID.ExplicitVRLittleEndian;
        return self.element(Tag.TransferSyntaxUID, uid, bigEndian, explicitVR);
    },

    patientNameJohnDoe: function(bigEndian, explicitVR) { return self.element(Tag.PatientName, "John^Doe", bigEndian, explicitVR); },
    emptyPatientName: function(bigEndian, explicitVR) { return self.element(Tag.PatientName, "", bigEndian, explicitVR); },

    patientID: function(bigEndian, explicitVR) { return self.element(Tag.PatientID, "12345678", bigEndian, explicitVR); },

    studyDate: function(bigEndian, explicitVR) { return self.element(Tag.StudyDate, "19700101", bigEndian, explicitVR); }

};