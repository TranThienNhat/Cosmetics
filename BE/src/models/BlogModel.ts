import { BaseModel } from "../core/BaseModel";
import { IBlog } from "../interfaces/Blog";

class BlogModel extends BaseModel<IBlog> {
  constructor() {
    super("blogs");
  }
}

export const Blog = new BlogModel();