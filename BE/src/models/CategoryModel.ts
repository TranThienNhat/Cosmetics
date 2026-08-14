import { BaseModel } from "../core/BaseModel";
import { ICategory } from "../interfaces/Category";

class CategoryModel extends BaseModel<ICategory> {
  constructor() {
    super("categories");
  }
}

export default new CategoryModel();
