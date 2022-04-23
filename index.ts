import PrivateConfig from "./private";
import pkg from "../../package.json";
import S3StorageManager from "../logic/storage/S3";
import type BaseStorageManager from "../logic/storage/Base";
import LocalStorageManager from "../logic/storage/Local";
import { TagCategories, TagRestrictions } from "../db/Models/Tag";
import AWS from "aws-sdk";
import session from "express-session";
import { tmpdir } from "os";

// put values that should be hidden in private.ts, you can either add a getter here that returns the super value, or just keep it entirely hidden

export default class Config extends PrivateConfig {
	static get isDevelopment() {
		return true;
	}

	static get siteName() {
		return "Yiff Rocks";
	}

	static get siteDescription() {
		return "An image board made by furries, for furries.";
	}

	/* api */
	static get apiHost() {
		return "127.0.0.1";
	}

	static get apiPort() {
		return 3333;
	}

	static get apiPublicSecure() {
		return true;
	}

	static get apiPublicHost() {
		return "localhost";
	}

	static get apiPublicPort() {
		return 3333;
	}

	static get cookieSecret() {
		return super.cookieSecret;
	}

	/* storage */
	static get tmpDir() {
		return tmpdir();
	}

	static get uploadDir() {
		return `${this.tmpDir}/uploads`;
	}

	static get storageManager(): BaseStorageManager {
		if (this.isDevelopment) return new LocalStorageManager(`${this.tmpDir}/public`, this.cdnPublicURL, this.cdnProtectedURL, false);
		else return new S3StorageManager(this.s3EndpointURL, this.s3Region, new AWS.Credentials({
			accessKeyId:     this.s3AccesskeyID,
			secretAccessKey: this.s3SecretAccessKey
		}), this.s3Bucket, this.s3ProtectedBucket, this.cdnPublicURL, this.cdnProtectedURL, true);
	}

	static get constructFileURL() { return this.storageManager.fileURL.bind(this.storageManager); }

	static get cdnPublicURL() {
		return this.isDevelopment ? `http://${this.apiHost}:${this.apiPort}/data` : "https://cdn.yiff.rocks";
	}

	static get cdnProtectedURL() {
		return this.isDevelopment ? `http://${this.apiHost}:${this.apiPort}/data` : "https://protected.cdn.yiff.rocks";
	}

	static get fileTypes(): Array<[mime: string, ext: string]> {
		return [
			["video/webm", "webm"],
			["image/gif", "gif"],
			["image/apng", "apng"],
			["image/png", "png"],
			["image/jpeg", "jpg"]
		];
	}

	static get allowedMimeTypes() { return this.fileTypes.map(f => f[0]); }
	static get allowedFileExtensions() { return this.fileTypes.map(f => f[1]); }

	static get userAgent() {
		return `YiffRocks/${pkg.version} (https://yiff.rocks)`;
	}

	// defaults
	static get bcryptRounds() { return 12; }

	// limitations
	static get minPostTags() { return 10; }
	static get maxPostTags() { return 250; }
	static get maxDescriptionLength() { return 5000; }
	static get maxTitleLength() { return 100; }
	static get maxSourceLength() { return 256; }
	static get maxSources() { return 10; }
	static get maxTotalSourcesLength() { return (this.maxSourceLength * this.maxSources) + 50; }

	// services
	// s3
	static get s3EndpointURL() { return super.s3EndpointURL; 	}
	static get s3Region() { return super.s3Region; }
	static get s3AccesskeyID() { return super.s3AccesskeyID; }
	static get s3SecretAccessKey() { return super.s3SecretAccessKey; }
	static get s3Bucket() { return super.s3Bucket; }
	static get s3ProtectedBucket() { return super.s3ProtectedBucket; }

	// @TODO convert db ip addresses to hostnames when we start testing with docker
	// db
	static get dbHost() { return "172.19.3.5"; }
	static get dbPort() { return 5432; }
	static get dbUser() { return "yiff-rocks"; }
	// both the local postgres & redis instances do not have passwords, they are not publicly bound
	// do NOT expose them to the internet without setting a password!
	static get dbPassword() { return undefined; }
	static get dbSSL() { return false; }
	static get dbDatabase() { return "yiff-rocks"; }

	// redis
	static get redisHost() { return "172.19.3.4"; }
	static get redisPort() { return 6379; }
	static get redisUser() { return "default"; }
	static get redisPassword() { return undefined; }
	static get redisDb() { return 0; }

	// image proxy
	static get proxyURL() { return super.proxyURL; }
	static get proxyAuth() { return super.proxyAuth; }

	static get sharedSession() {
		return session({
			name:   "yiff-rocks",
			secret: this.cookieSecret,
			cookie: {
				maxAge:   8.64e7,
				secure:   true,
				httpOnly: true,
				domain:   `.${this.apiPublicHost}`
			},
			resave:            false,
			saveUninitialized: true
		});
	}

	// tags
	static get tagMap(): Array<{ id: number; retrictions: number; }> {
		// naming is automatic, pascal case splitting by underscores
		// TagRestrctions can be used for restrictions, a bitfield is expected
		return [
			{ id: TagCategories.GENERAL,   retrictions: 0 },
			{ id: TagCategories.ARTIST,    retrictions: 0 },
			{ id: TagCategories.COPYRIGHT, retrictions: 0 },
			{ id: TagCategories.CHARACTER, retrictions: 0 },
			{ id: TagCategories.SPECIES,   retrictions: 0 },
			{ id: TagCategories.INVALID,   retrictions: TagRestrictions.RESTRICT_CREATE },
			{ id: TagCategories.LORE,      retrictions: TagRestrictions.RESTRICT_CREATE },
			{ id: TagCategories.META,      retrictions: TagRestrictions.RESTRICT_CREATE }
		];
	}

	static get tagOrder() {
		return [TagCategories.INVALID, TagCategories.ARTIST, TagCategories.COPYRIGHT, TagCategories.SPECIES, TagCategories.GENERAL, TagCategories.META, TagCategories.LORE];
	}

	static get wildcardCharacter() {
		return "*";
	}

	static get wildcardCharacterRegex() {
		return /\*/g;
	}

	// posts
	static get defaultPostLimit() { return 75; }
	static get minPostLimit() { return 1; }
	static get maxPostLimit() { return 500; } // 250?

	// users
	static get enableEmailVerification() {
		return !this.isDevelopment;
	}

	static enableRegistrations() {
		return true;
	}

	// regex
	static get urlRegex() {
		return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
	}

	// @TODO hostname
	// iqdb
	static get iqdbInstance() {
		return "http://172.19.3.3:5588";
	}
}
