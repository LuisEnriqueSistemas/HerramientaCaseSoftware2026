export declare enum ProjectMemberRole {
    HOST = "HOST",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}
export declare class ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectMemberRole;
    joinedAt: Date;
}
