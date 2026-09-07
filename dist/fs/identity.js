const identities = new WeakMap();
const identityTokens = new WeakSet();
/**
 * Return an inert identity token for a filesystem. The token deliberately has
 * no prototype or reference back to the filesystem: consumers may safely use
 * it as a WeakMap key without acquiring filesystem authority.
 */
export function getFileSystemIdentity(fs) {
    let identity = identities.get(fs);
    if (identity === undefined) {
        identity = Object.freeze(Object.create(null));
        identities.set(fs, identity);
        identityTokens.add(identity);
    }
    return identity;
}
/** True only for inert tokens created by getFileSystemIdentity(). */
export function isFileSystemIdentity(value) {
    return identityTokens.has(value);
}
