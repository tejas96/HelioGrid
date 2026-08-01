/**
 * PORT — credential storage is the ONE thing that cannot be shared. React Native has no
 * cookie jar, so it persists the session itself (keychain). Web deliberately has NO
 * implementation: its session is an HttpOnly first-party cookie that JavaScript cannot read
 * by design, and making it readable to satisfy this interface would be strictly worse
 * security. That is why `storage` is OPTIONAL on the data layer rather than required.
 */
export interface TokenStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  clear(): Promise<void>;
}
