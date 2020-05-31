import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";
import { parse } from "semver";

export async function run(): Promise<void> {
	const version = readPackageJson().version;
	const semVer = parse(version);
	if (!semVer) {
		throw new Error(`Invalid version "${version}"`);
	}

	let releaseTag: string | undefined = undefined;
	if (semVer.prerelease.length > 0) {
		releaseTag = "" + semVer.prerelease[0];
	}
	await exec("npm", [
		"publish",
		...(releaseTag ? ["--tag", releaseTag] : []),
	]);

	const gitTag = `v${version}`;
	console.log(`Creating a version tag "${gitTag}".`);
	const api = new GitHub(process.env.GH_TOKEN!);
	await api.git.createRef({
		...context.repo,
		ref: `refs/tags/${gitTag}`,
		sha: context.sha,
	});
}
