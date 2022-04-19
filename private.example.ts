export default class PrivateConfig {
	// if something is present in index that doesn't call this, that value will be used
	static get cookieSecret() {
		return "YOUR_HIDDEN_VALUE_HERE";
	}
}
