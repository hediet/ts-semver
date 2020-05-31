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

export function semanticVersionRegexGroupsToVersion(
	groups: (string | undefined)[]
): SemanticVersion {
	const preReleaseMatch = groups[4];
	const buildMatch = groups[5];

	let preReleaseInfo: PreReleaseInfo | null = null;
	if (preReleaseMatch) {
		preReleaseInfo = new PreReleaseInfo(
			preReleaseMatch
				.split(".")
				.map((r) => (r.match(/0|[1-9][0-9]*/) ? parseInt(r) : r))
		);
	}

	const buildInfo =
		buildMatch !== undefined ? new BuildInfo(buildMatch.split(".")) : null;

	return new SemanticVersion(
		parseInt(groups[1]!),
		parseInt(groups[2]!),
		parseInt(groups[3]!),
		preReleaseInfo,
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
		public readonly preRelease: PreReleaseInfo | null,
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
		if (this.preRelease) {
			result += `-${this.preRelease.toString()}`;
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
	): { kind: "major" | "minor" | "patch" | "preRelease" | "none" } {
		other;
		throw new Error("Not implemented yet.");
	}
	*/

	public with(update: {
		major?: number | "increment";
		minor?: number | "increment";
		patch?: number | "increment";
		preRelease?: PreReleaseInfo | null;
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
			defaultIfUndefined(update.preRelease, this.preRelease),
			defaultIfUndefined(update.build, this.build)
		);
	}

	public toJSON(): {
		major: number;
		minor: number;
		patch: number;
		preRelease?: ReadonlyArray<string | number>;
		build?: ReadonlyArray<string>;
	} {
		return {
			major: this.major,
			minor: this.minor,
			patch: this.patch,
			...(this.preRelease ? { preRelease: this.preRelease.parts } : {}),
			...(this.build ? { build: this.build.parts } : {}),
		};
	}
}

export class PreReleaseInfo {
	constructor(public readonly parts: ReadonlyArray<number | string>) {
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
}

export class BuildInfo {
	constructor(public readonly parts: ReadonlyArray<string>) {}

	public toString(): string {
		return this.parts.join(".");
	}
}
