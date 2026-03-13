export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  filePath?: string;
}

export interface Reviewer {
  id: string;
  name: string;
  avatar?: string;
  status: "pending" | "approved" | "rejected";
}

export interface ReviewInfo {
  reviewers: Reviewer[];
  comments: ReviewComment[];
}

export const TEAM_MEMBERS: Reviewer[] = [
  { id: "u1", name: "吴承霖", status: "pending" },
  { id: "u2", name: "邱翔", status: "pending" },
  { id: "u3", name: "李泽龙", status: "pending" },
  { id: "u4", name: "张东杰", status: "pending" },
];

export const createDefaultReview = (): ReviewInfo => ({
  reviewers: TEAM_MEMBERS.slice(0, 2).map((r) => ({ ...r, status: "pending" as const })),
  comments: [],
});

export const isReviewApproved = (review: ReviewInfo): boolean =>
  review.reviewers.length > 0 && review.reviewers.every((r) => r.status === "approved");
