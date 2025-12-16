import { 
  members, images, comments,
  type Member, type InsertMember,
  type Image, type InsertImage,
  type Comment, type InsertComment,
  type ImageWithComments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMember(id: string): Promise<Member | undefined>;
  getMemberBySlug(slug: string): Promise<Member | undefined>;
  getMembers(): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, data: Partial<InsertMember>): Promise<Member | undefined>;

  getImage(id: string): Promise<Image | undefined>;
  getImagesByMemberId(memberId: string): Promise<ImageWithComments[]>;
  getImagesByMemberSlug(slug: string): Promise<ImageWithComments[]>;
  createImage(image: InsertImage): Promise<Image>;

  getCommentsByImageId(imageId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  initializeDefaultMembers(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberBySlug(slug: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.slug, slug));
    return member || undefined;
  }

  async getMembers(): Promise<Member[]> {
    return db.select().from(members);
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [created] = await db.insert(members).values(member).returning();
    return created;
  }

  async updateMember(id: string, data: Partial<InsertMember>): Promise<Member | undefined> {
    const [updated] = await db
      .update(members)
      .set(data)
      .where(eq(members.id, id))
      .returning();
    return updated || undefined;
  }

  async getImage(id: string): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image || undefined;
  }

  async getImagesByMemberId(memberId: string): Promise<ImageWithComments[]> {
    const imageList = await db
      .select()
      .from(images)
      .where(eq(images.memberId, memberId))
      .orderBy(desc(images.createdAt));

    const result: ImageWithComments[] = [];
    for (const image of imageList) {
      const imageComments = await this.getCommentsByImageId(image.id);
      result.push({ ...image, comments: imageComments });
    }
    return result;
  }

  async getImagesByMemberSlug(slug: string): Promise<ImageWithComments[]> {
    const member = await this.getMemberBySlug(slug);
    if (!member) return [];
    return this.getImagesByMemberId(member.id);
  }

  async createImage(image: InsertImage): Promise<Image> {
    const [created] = await db.insert(images).values(image).returning();
    return created;
  }

  async getCommentsByImageId(imageId: string): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.imageId, imageId))
      .orderBy(comments.createdAt);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async initializeDefaultMembers(): Promise<void> {
    const existingMembers = await this.getMembers();
    if (existingMembers.length > 0) return;

    const defaultMembers: InsertMember[] = [
      { name: "me", slug: "me", themeColor: "pink", memo: null, profileImage: null },
      { name: "follower1", slug: "follower1", themeColor: "blue", memo: null, profileImage: null },
      { name: "follower2", slug: "follower2", themeColor: "purple", memo: null, profileImage: null },
    ];

    for (const member of defaultMembers) {
      await this.createMember(member);
    }
  }
}

export const storage = new DatabaseStorage();
