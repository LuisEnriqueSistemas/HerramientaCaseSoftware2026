export declare enum InviteRole {
    EDITOR = "editor",
    VIEWER = "viewer"
}
export declare class InviteUserDto {
    email: string;
    role: InviteRole;
}
