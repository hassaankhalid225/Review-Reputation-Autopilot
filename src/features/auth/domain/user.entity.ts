/**
 * Domain entity: the authenticated user (account-level identity).
 * Pure — no framework imports. See Docs/ARCHITECTURE.md §2.1.
 */

export interface UserProps {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get fullName(): string | null {
    return this.props.fullName;
  }
  get displayName(): string {
    return this.props.fullName?.trim() || this.props.email.split("@")[0] || "there";
  }
  get emailVerified(): boolean {
    return this.props.emailVerified;
  }
  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  /** Outbound messaging requires a verified email (FR-AUTH-2). */
  canSendMessages(): boolean {
    return this.props.emailVerified;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
