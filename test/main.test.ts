import { equal, deepStrictEqual } from "assert";
import { SemanticVersion } from "../src";

function testParse(version: string): ReturnType<SemanticVersion["toJSON"]> {
	const ver = SemanticVersion.parse(version);
	deepStrictEqual(ver, SemanticVersion.parse(ver.toString()));
	return ver.toJSON();
}

describe("SemanticVersion", () => {
	it("parse", () => {
		deepStrictEqual(testParse("1.0.0"), {
			major: 1,
			minor: 0,
			patch: 0,
		});

		deepStrictEqual(testParse("1.0.0-alpha.1"), {
			major: 1,
			minor: 0,
			patch: 0,
			prerelease: ["alpha", 1],
		});

		deepStrictEqual(testParse("1.0.0+build.1"), {
			major: 1,
			minor: 0,
			patch: 0,
			build: ["build", "1"],
		});
	});

	describe("compare", () => {
		function assertIsGreater(version1: string, version2: string) {
			deepStrictEqual(
				SemanticVersion.parse(version1).compareTo(
					SemanticVersion.parse(version2)
				),
				1
			);

			deepStrictEqual(
				SemanticVersion.parse(version2).compareTo(
					SemanticVersion.parse(version1)
				),
				-1
			);

			deepStrictEqual(
				SemanticVersion.parse(version1).compareTo(
					SemanticVersion.parse(version1)
				),
				0
			);

			deepStrictEqual(
				SemanticVersion.parse(version2).compareTo(
					SemanticVersion.parse(version2)
				),
				0
			);
		}

		it("1", () => assertIsGreater("1.0.1", "1.0.0"));
		it("2", () => assertIsGreater("1.0.1", "1.0.1-alpha.1"));
		it("3", () => assertIsGreater("1.0.1-alpha.1", "1.0.1-alpha.0"));
		it("4", () => assertIsGreater("1.0.1-alpha.0.0", "1.0.1-alpha.0"));
		it("5", () => assertIsGreater("1.0.1-beta", "1.0.1-alpha"));
		it("6", () => assertIsGreater("1.0.1-nightly", "1.0.1-beta"));
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
