const assert = require("assert");
const TagPath = require("../src/tag-path");
const Tag = require("../src/tag");

describe("A tag path", function () {

    it("should have a legible string representation", function () {
        let path = TagPath.fromItem(Tag.DerivationCodeSequence, 4).thenItem(Tag.DerivationCodeSequence, 3).thenItem(Tag.DerivationCodeSequence, 2).thenTag(Tag.PatientID);
        assert.equal(path.toNamedString(false), "(0008,9215)[4].(0008,9215)[3].(0008,9215)[2].(0010,0020)");
    });

    it("should support string representations with keywords instead of tag numbers where possible", function () {
        let path = TagPath.fromItem(Tag.DerivationCodeSequence, 1).thenItem(0x11110100, 3).thenItem(Tag.DetectorInformationSequence, 3).thenTag(Tag.PatientID);
        assert.equal(path.toNamedString(true), "DerivationCodeSequence[1].(1111,0100)[3].DetectorInformationSequence[3].PatientID");
    });
});

describe("Comparing two tag paths", function () {

    it("should return false when comparing a tag path to itself", function () {
        let path = TagPath.fromTag(1);
        assert(!path.isBelow(path));
    });

    it("should return false when comparing two equivalent tag paths", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(1, 3).thenItem(1, 1).thenTag(2);
        let bPath = TagPath.fromItem(1, 1).thenItem(1, 3).thenItem(1, 1).thenTag(2);
        assert(!aPath.isBelow(bPath));
        assert(!bPath.isBelow(aPath));
    });

    it("should sort all combinations of types correctly when tag and item numbers match", function () {
        assert(!TagPath.fromTag(1).isBelow(TagPath.fromTag(1)));
        assert(!TagPath.fromTag(1).isBelow(TagPath.fromSequence(1)));
        assert(!TagPath.fromTag(1).isBelow(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromTag(1).isBelow(TagPath.fromItem(1, 1)));
        assert(!TagPath.fromTag(1).isBelow(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromSequence(1).isBelow(TagPath.fromTag(1)));
        assert(!TagPath.fromSequence(1).isBelow(TagPath.fromSequence(1)));
        assert(TagPath.fromSequence(1).isBelow(TagPath.fromSequenceEnd(1)));
        assert(TagPath.fromSequence(1).isBelow(TagPath.fromItem(1, 1)));
        assert(TagPath.fromSequence(1).isBelow(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromSequenceEnd(1).isBelow(TagPath.fromTag(1)));
        assert(!TagPath.fromSequenceEnd(1).isBelow(TagPath.fromSequence(1)));
        assert(!TagPath.fromSequenceEnd(1).isBelow(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromSequenceEnd(1).isBelow(TagPath.fromItem(1, 1)));
        assert(!TagPath.fromSequenceEnd(1).isBelow(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromItem(1, 1).isBelow(TagPath.fromTag(1)));
        assert(!TagPath.fromItem(1, 1).isBelow(TagPath.fromSequence(1)));
        assert(TagPath.fromItem(1, 1).isBelow(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromItem(1, 1).isBelow(TagPath.fromItem(1, 1)));
        assert(TagPath.fromItem(1, 1).isBelow(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromItemEnd(1, 1).isBelow(TagPath.fromTag(1)));
        assert(!TagPath.fromItemEnd(1, 1).isBelow(TagPath.fromSequence(1)));
        assert(TagPath.fromItemEnd(1, 1).isBelow(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromItemEnd(1, 1).isBelow(TagPath.fromItem(1, 1)));
        assert(!TagPath.fromItemEnd(1, 1).isBelow(TagPath.fromItemEnd(1, 1)));
    });

    it("should sort them by tag number for depth 0 paths", function () {
        let aPath = TagPath.fromTag(1);
        let bPath = TagPath.fromTag(2);
        assert(aPath.isBelow(bPath));
    });

    it("should sort them by tag number for depth 1 paths", function () {
        let aPath = TagPath.fromItem(1, 1).thenTag(2);
        let bPath = TagPath.fromItem(1, 1).thenTag(1);
        assert(!aPath.isBelow(bPath));
    });

    it("should sort by earliest difference in deep paths", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(1, 2).thenTag(2);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenTag(1);
        assert(aPath.isBelow(bPath));
    });

    it("should sort longer lists after shorter lists when otherwise equivalent", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3);
        assert(!aPath.isBelow(bPath));
    });

    it("should sort by item number in otherwise equivalent paths", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(1, 2).thenItem(1, 2).thenTag(2);
        let bPath = TagPath.fromItem(1, 1).thenItem(1, 3).thenItem(1, 2).thenTag(2);
        assert(aPath.isBelow(bPath));
    });

    it("should not provide a particular ordering of two empty tag paths", function () {
        assert(!TagPath.emptyTagPath.isBelow(TagPath.emptyTagPath));
    });

    it("should sort empty paths as less than any other path", function () {
        assert(TagPath.emptyTagPath.isBelow(TagPath.fromTag(0)));
        assert(TagPath.emptyTagPath.isBelow(TagPath.fromItem(0, 1)));
    });

    it("should sort non-empty tag paths after empty paths", function () {
        assert(!TagPath.fromTag(0).isBelow(TagPath.emptyTagPath));
        assert(!TagPath.fromItem(0, 1).isBelow(TagPath.emptyTagPath));
    });

    it("should establish a total ordering among tag paths encountered when parsing a file", function () {
        let createPaths = function() { return [
            TagPath.emptyTagPath, // preamble
            TagPath.fromTag(Tag.FileMetaInformationGroupLength), // FMI group length header
            TagPath.fromTag(Tag.TransferSyntaxUID), // Transfer syntax header
            TagPath.fromTag(Tag.StudyDate), // Patient name header
            TagPath.fromSequence(Tag.DerivationCodeSequence), // sequence start
            TagPath.fromItem(Tag.DerivationCodeSequence, 1), // item start
            TagPath.fromItem(Tag.DerivationCodeSequence, 1).thenTag(Tag.StudyDate), // study date header
            TagPath.fromItemEnd(Tag.DerivationCodeSequence, 1), // item end
            TagPath.fromItem(Tag.DerivationCodeSequence, 2), // item start
            TagPath.fromItem(Tag.DerivationCodeSequence, 2).thenSequence(Tag.EnergyWindowRangeSequence), // sequence start
            TagPath.fromItem(Tag.DerivationCodeSequence, 2).thenItem(Tag.EnergyWindowRangeSequence, 1), // item start
            TagPath.fromItem(Tag.DerivationCodeSequence, 2).thenItem(Tag.EnergyWindowRangeSequence, 1).thenTag(Tag.StudyDate), // Study date header
            TagPath.fromItem(Tag.DerivationCodeSequence, 2).thenItemEnd(Tag.EnergyWindowRangeSequence, 1), //  item end (inserted)
            TagPath.fromItem(Tag.DerivationCodeSequence, 2).thenSequenceEnd(Tag.EnergyWindowRangeSequence), // sequence end (inserted)
            TagPath.fromItemEnd(Tag.DerivationCodeSequence, 2), // item end
            TagPath.fromSequenceEnd(Tag.DerivationCodeSequence), // sequence end
            TagPath.fromTag(Tag.PatientName), // Patient name header
            TagPath.fromTag(Tag.PixelData), // fragments start
            TagPath.fromTag(Tag.PixelData), // item start
            TagPath.fromTag(Tag.PixelData), // fragment data
            TagPath.fromTag(Tag.PixelData)  // fragments end
        ]; };

        let paths = createPaths();
        let reversed = createPaths().reverse();
        let sorted = createPaths().reverse().sort((a, b) => a.isBelow(b) ? -1 : 1);

        assert.notDeepEqual(reversed, paths);
        assert.deepEqual(sorted, paths);
    });
});

describe("Two tag paths", function () {

    it("should be equal if they point to the same path", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        assert(aPath.isEqualTo(bPath));
    });

    it("should not be equal if item indices do not match", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 1).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        assert(!aPath.isEqualTo(bPath));
    });

    it("should not be equal if they point to different tags", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(5);
        assert(!aPath.isEqualTo(bPath));
    });

    it("should not be equal if they have different depths", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        assert(!aPath.isEqualTo(bPath));
    });

    it("should be equal if both are empty", function () {
        assert(TagPath.emptyTagPath.isEqualTo(TagPath.emptyTagPath));
    });

    it("should not be equal if they point to same tags but are of different types", function () {
        assert(!TagPath.fromTag(1).isEqualTo(TagPath.fromSequence(1)));
    });

    it("should support sequence and item end nodes", function () {
        assert(TagPath.fromSequenceEnd(1).isEqualTo(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromSequenceEnd(1).isEqualTo(TagPath.fromSequence(1)));
        assert(TagPath.fromItemEnd(1, 1).isEqualTo(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromItemEnd(1, 1).isEqualTo(TagPath.fromItem(1, 1)));
    });

    it("should should support equals documentation examples", function () {
        assert(TagPath.fromTag(0x00100010).isEqualTo(TagPath.fromTag(0x00100010)));
        assert(!TagPath.fromTag(0x00100010).isEqualTo(TagPath.fromTag(0x00100020)));
        assert(!TagPath.fromTag(0x00100010).isEqualTo(TagPath.fromItem(0x00089215, 1).thenTag(0x00100010)));
        assert(TagPath.fromItem(0x00089215, 3).thenTag(0x00100010).isEqualTo(TagPath.fromItem(0x00089215, 3).thenTag(0x00100010)));
    });
});

describe("The startsWith test", function () {

    it("should return true for equal paths", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        assert(aPath.startsWith(bPath));
    });

    it("should return true for two empty paths", function () {
        assert(TagPath.emptyTagPath.startsWith(TagPath.emptyTagPath));
    });

    it("should return true when any path starts with empty path", function () {
        let aPath = TagPath.fromTag(1);
        assert(aPath.startsWith(TagPath.emptyTagPath));
    });

    it("should return false when empty path starts with non-empty path", function () {
        let aPath = TagPath.fromTag(1);
        assert(!TagPath.emptyTagPath.startsWith(aPath));
    });

    it("should return false when subject path is longer than path", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        assert(!aPath.startsWith(bPath));
    });

    it("should return true when paths involving item indices are equal", function () {
        let aPath = TagPath.fromItem(1, 4).thenItem(2, 2).thenItem(3, 2).thenTag(4);
        let bPath = TagPath.fromItem(1, 4).thenItem(2, 2).thenItem(3, 2).thenTag(4);
        assert(aPath.startsWith(bPath));
    });

    it("should return true when subject path is subset of path", function () {
        let aPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3).thenTag(4);
        let bPath = TagPath.fromItem(1, 1).thenItem(2, 2).thenItem(3, 3);
        assert(aPath.startsWith(bPath));
    });

    it("should support sequence and item end nodes", function () {
        assert(TagPath.fromSequenceEnd(1 ).startsWith(TagPath.fromSequenceEnd(1)));
        assert(!TagPath.fromSequenceEnd(1 ).startsWith(TagPath.fromSequence(1)));
        assert(TagPath.fromItemEnd(1, 1).startsWith(TagPath.fromItemEnd(1, 1)));
        assert(!TagPath.fromItemEnd(1, 1).startsWith(TagPath.fromItem(1, 1)));
    });

    it("should support startsWith documentation examples", function () {
        assert(TagPath.fromTag(0x00100010).startsWith(TagPath.fromTag(0x00100010)));
        assert(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010).startsWith(TagPath.fromItem(0x00089215, 2)));
        assert(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010).startsWith(TagPath.emptyTagPath));
        assert(!TagPath.fromItem(0x00089215, 2).thenTag(0x00100010).startsWith(TagPath.fromItem(0x00089215, 1)));
        assert(!TagPath.fromItem(0x00089215, 2).startsWith(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010)));
    });
});

describe("The endsWith test", function () {

    it("should return true when a longer tag ends with a shorter", function () {
        let aPath = TagPath.fromItem(1, 3).thenTag(2);
        let bPath = TagPath.fromTag(2);
        assert(aPath.endsWith(bPath));
    });

    it("should return true for two empty paths", function () {
        assert(TagPath.emptyTagPath.endsWith(TagPath.emptyTagPath));
    });

    it("should return true when checking if non-empty path ends with empty path", function () {
        let aPath = TagPath.fromTag(1);
        assert(aPath.endsWith(TagPath.emptyTagPath));
    });

    it("should return false when empty path starts with non-empty path", function () {
        let aPath = TagPath.fromTag(1);
        assert(!TagPath.emptyTagPath.endsWith(aPath));
    });

    it("should return false when a shorter tag is compared to a longer", function () {
        let aPath = TagPath.fromItem(1, 3).thenTag(2);
        let bPath = TagPath.fromTag(2);
        assert(!bPath.endsWith(aPath));
    });

    it("should return false when tag numbers do not match", function () {
        let aPath = TagPath.fromItem(1, 3).thenTag(2);
        let bPath = TagPath.fromTag(4);
        assert(!aPath.endsWith(bPath));
    });

    it("should work also with deep sequences", function () {
        let aPath = TagPath.fromItem(1, 3).thenItem(2, 4).thenItem(3, 5).thenTag(6);
        let bPath = TagPath.fromItem(2, 4).thenItem(3, 5).thenTag(6);
        assert(aPath.endsWith(bPath));
    });

    it("should support sequence and item end nodes", function () {
        assert(TagPath.fromItem(1,1).thenSequenceEnd(2).endsWith(TagPath.fromSequenceEnd(2)));
        assert(!TagPath.fromItem(1,1).thenSequenceEnd(2).endsWith(TagPath.fromSequence(2)));
        assert(TagPath.fromItem(1,1).thenItemEnd(2,2).endsWith(TagPath.fromItemEnd(2, 2)));
        assert(!TagPath.fromItem(1,1).thenItemEnd(2,2).endsWith(TagPath.fromItem(2, 12)));
    });

    it("should support endsWith documentation examples", function () {
        assert(TagPath.fromTag(0x00100010).endsWith(TagPath.fromTag(0x00100010)));
        assert(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010).endsWith(TagPath.fromTag(0x00100010)));
        assert(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010).endsWith(TagPath.emptyTagPath));
        assert(!TagPath.fromTag(0x00100010).endsWith(TagPath.fromItem(0x00089215, 2).thenTag(0x00100010)));
    });
});

describe("Parsing a tag path", function () {

    it("should work for well-formed depth 0 tag paths", function () {
        assert(TagPath.parse("(0010,0010)").isEqualTo(TagPath.fromTag(Tag.PatientName)));
    });

    it("should work for deep tag paths", function () {
        assert(TagPath.parse("(0008,9215)[1].(0008,9215)[666].(0010,0010)").isEqualTo(TagPath.fromItem(Tag.DerivationCodeSequence, 1).thenItem(Tag.DerivationCodeSequence, 666).thenTag(Tag.PatientName)));
    });

    it("should throw an exception for malformed strings", function () {
        assert.throws(() => {
            TagPath.parse("abc");
        });
    });

    it("should throw an exception for empty strings", function () {
        assert.throws(() => {
            TagPath.parse("");
        });
    });

    it("should accept both tag numbers and keywords", function () {
        let ref = TagPath.fromItem(Tag.DerivationCodeSequence, 1).thenTag(Tag.PatientName);
        assert(TagPath.parse("(0008,9215)[1].(0010,0010)").isEqualTo(ref));
        assert(TagPath.parse("DerivationCodeSequence[1].(0010,0010)").isEqualTo(ref));
        assert(TagPath.parse("(0008,9215)[1].PatientName").isEqualTo(ref));
        assert(TagPath.parse("DerivationCodeSequence[1].PatientName").isEqualTo(ref));
    });
});


describe("The drop operation", function () {

    it("should remove elements from the left", function () {
        let path = TagPath.fromItem(1, 1).thenItem(2, 1).thenItem(3, 3).thenTag(4);
        assert(path.drop(-100).isEqualTo(path));
        assert(path.drop(0).isEqualTo(path));
        assert(path.drop(1).isEqualTo(TagPath.fromItem(2, 1).thenItem(3, 3).thenTag(4)));
        assert(path.drop(2).isEqualTo(TagPath.fromItem(3, 3).thenTag(4)));
        assert(path.drop(3).isEqualTo(TagPath.fromTag(4)));
        assert(path.drop(4).isEqualTo(TagPath.emptyTagPath));
        assert(path.drop(100).isEqualTo(TagPath.emptyTagPath));
    });

    it("should support sequence and item end nodes", function () {
        assert(TagPath.fromItemEnd(1,1).drop(1).isEqualTo(TagPath.emptyTagPath));
        assert(TagPath.fromSequenceEnd(1).drop(1).isEqualTo(TagPath.emptyTagPath));
    });
});
