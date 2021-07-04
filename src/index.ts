/**
 * Taken from https://semver.org/spec/v2.0.0.html.
 */
export const semanticVersionRegexEmbeddable = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;

/**
 * Taken from https://semver.org/spec/v2.0.0.html.
 */
export const semanticVersionRegex = new RegExp(
	`^${semanticVersionRegexEmbeddable.source}$`
);

const numberRegex = /0|[1-9][0-9]*/;

export function semanticVersionRegexGroupsToVersion(
	groups: (string | undefined)[]
): SemanticVersion {
	const prereleaseMatch = groups[4];
	const buildMatch = groups[5];

	let prereleaseInfo: PreReleaseInfo | null = null;
	if (prereleaseMatch) {
		prereleaseInfo = new PreReleaseInfo(
			prereleaseMatch
				.split(".")
				.map((r) => (r.match(numberRegex) ? parseInt(r) : r))
		);
	}

	const buildInfo =
		buildMatch !== undefined ? new BuildInfo(buildMatch.split(".")) : null;

	return new SemanticVersion(
		parseInt(groups[1]!),
		parseInt(groups[2]!),
		parseInt(groups[3]!),
		prereleaseInfo,
		buildInfo
	);
}

/**
 * Represents a valid semantic version.
 * See https://semver.org/spec/v2.0.0.html.
 */
export class SemanticVersion {
	public static parse(text: string): SemanticVersion {
		const exec = semanticVersionRegex.exec(text);
		if (!exec) {
			throw new Error(
				`Could not parse semantic version. "${text}" is not valid.`
			);
		}

		return semanticVersionRegexGroupsToVersion(exec);
	}

	constructor(
		public readonly major: number,
		public readonly minor: number,
		public readonly patch: number,
		public readonly prerelease: PreReleaseInfo | null,
		public readonly build: BuildInfo | null
	) {
		function testValidNumber(n: number, arg: string): void {
			if (!Number.isInteger(n) || n < 0) {
				throw new Error(
					`Invalid input. "${n}" is not valid for ${arg}`
				);
			}
		}

		testValidNumber(major, "major");
		testValidNumber(minor, "minor");
		testValidNumber(patch, "patch");
	}

	public get isStable(): boolean {
		return this.major > 0;
	}

	public toString(): string {
		let result = `${this.major}.${this.minor}.${this.patch}`;
		if (this.prerelease) {
			result += `-${this.prerelease.toString()}`;
		}
		if (this.build) {
			result += `+${this.build.toString()}`;
		}
		return result;
	}

	public equals(other: SemanticVersion): boolean {
		return this.toString() === other.toString();
	}

	/*
	public hasSamePrecedence(other: SemanticVersion): boolean {
		return this.getPrecedenceDifference(other).kind === "none";
	}

	public getPrecedenceDifference(
		other: SemanticVersion
	): { kind: "major" | "minor" | "patch" | "prerelease" | "none" } {
		other;
		throw new Error("Not implemented yet.");
	}
	*/

	public with(update: {
		major?: number | "increment";
		minor?: number | "increment";
		patch?: number | "increment";
		prerelease?: PreReleaseInfo | null;
		build?: BuildInfo | null;
	}): SemanticVersion {
		function defaultIfUndefined<T>(val: T | undefined, defaultVal: T): T {
			return val !== undefined ? val : defaultVal;
		}

		function defaultIfUndefinedNumber(
			val: number | undefined | "increment",
			defaultVal: number
		): number {
			if (val === "increment") {
				return defaultVal + 1;
			}
			return val !== undefined ? val : defaultVal;
		}

		return new SemanticVersion(
			defaultIfUndefinedNumber(update.major, this.major),
			defaultIfUndefinedNumber(update.minor, this.minor),
			defaultIfUndefinedNumber(update.patch, this.patch),
			defaultIfUndefined(update.prerelease, this.prerelease),
			defaultIfUndefined(update.build, this.build)
		);
	}

	public toJSON(): {
		major: number;
		minor: number;
		patch: number;
		prerelease?: ReadonlyArray<string | number>;
		build?: ReadonlyArray<string>;
	} {
		return {
			major: this.major,
			minor: this.minor,
			patch: this.patch,
			...(this.prerelease ? { prerelease: this.prerelease.parts } : {}),
			...(this.build ? { build: this.build.parts } : {}),
		};
	}

	/**
	 * Returns -1 if this version is older than the other version, 0 if they are equal, or 1 if this version is newer.
	 */
	public compareTo(other: SemanticVersion): -1 | 0 | 1 {
		if (this.major != other.major) {
			return comparePrimitives(this.major, other.major);
		}
		if (this.minor != other.minor) {
			return comparePrimitives(this.minor, other.minor);
		}
		if (this.patch != other.patch) {
			return comparePrimitives(this.patch, other.patch);
		}

		return PreReleaseInfo.compare(this.prerelease, other.prerelease);
	}
}

function comparePrimitives(a: number | string, b: number | string): -1 | 0 | 1 {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
}

export class PreReleaseInfo {
	public static compare(
		a: PreReleaseInfo | null,
		b: PreReleaseInfo | null
	): -1 | 0 | 1 {
		if (!a && !b) {
			return 0;
		}
		if (!a) {
			// prefer non-prerelease version.
			return 1;
		}
		if (!b) {
			return -1;
		}
		return a.compareTo(b);
	}

	constructor(public readonly parts: ReadonlyArray<number | string>) {
		if (parts.length === 0) {
			throw new Error("Must have at least one part!");
		}

		for (const p of parts) {
			if (typeof p === "string") {
				if (!/^[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*$/.exec(p)) {
					throw new Error(
						"Invalid input! Non-number parts must have at least one non-digit!"
					);
				}
			}
		}
	}

	public toString(): string {
		return this.parts.map((p) => p.toString()).join(".");
	}

	public isNewer(other: PreReleaseInfo): boolean {
		return this.compareTo(other) === 1;
	}

	public isOlder(other: PreReleaseInfo): boolean {
		return this.compareTo(other) === -1;
	}

	public compareTo(other: PreReleaseInfo): -1 | 0 | 1 {
		for (
			let i = 0;
			i < Math.max(this.parts.length, other.parts.length);
			i++
		) {
			const a: string | number | undefined = this.parts[i];
			const b: string | number | undefined = other.parts[i];

			if (a === undefined) {
				// Other has longer prerelease
				return -1;
			}
			if (b === undefined) {
				// This has longer prerelease
				return 1;
			}

			if (a !== b) {
				return comparePrimitives(a, b);
			}
		}
		return 0;
	}
}

export class BuildInfo {
	constructor(public readonly parts: ReadonlyArray<string>) {
		if (parts.length === 0) {
			throw new Error("Must have at least one part!");
		}
	}

	public toString(): string {
		return this.parts.join(".");
	}
}
