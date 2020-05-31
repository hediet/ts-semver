import { equal, deepEqual } from "assert";
import { SemanticVersion } from "../src";

function testParse(version: string): ReturnType<SemanticVersion["toJSON"]> {
	const ver = SemanticVersion.parse(version);
	deepEqual(ver, SemanticVersion.parse(ver.toString()));
	return ver.toJSON();
}

describe("SemanticVersion", () => {
	it("parse", () => {
		deepEqual(testParse("1.0.0"), {
			major: 1,
			minor: 0,
			patch: 0,
		});

		deepEqual(testParse("1.0.0-alpha.1"), {
			major: 1,
			minor: 0,
			patch: 0,
			preRelease: ["alpha", 1],
		});

		deepEqual(testParse("1.0.0+build.1"), {
			major: 1,
			minor: 0,
			patch: 0,
			build: ["build", "1"],
		});
	});
});

describe("Examples", () => {
	it("example1", () => {
		const ver = SemanticVersion.parse("1.0.0-alpha.1");
		equal(ver.major, 1);

		const ver1 = ver.with({ prerelease: null });
		equal(ver1.toString(), "1.0.0");

		const ver2 = ver.with({ patch: "increment" });
		equal(ver2.toString(), "1.0.1-alpha.1");

		const ver3 = ver.with({ patch: "increment", prerelease: null });
		equal(ver3.toString(), "1.0.1");
	});
});
